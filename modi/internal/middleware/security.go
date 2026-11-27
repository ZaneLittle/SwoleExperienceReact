package middleware

import (
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// MaxBodySize limits request bodies before handlers bind JSON. It protects the
// public API from oversized payloads and JSON parsing resource exhaustion.
func MaxBodySize(maxBytes int64) gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.ContentLength > maxBytes {
			c.AbortWithStatusJSON(http.StatusRequestEntityTooLarge, gin.H{
				"error": gin.H{"code": "REQUEST_TOO_LARGE", "message": "Request body is too large"},
			})
			return
		}
		c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxBytes)
		c.Next()
	}
}

type rateLimitEntry struct {
	count   int
	resetAt time.Time
}

// RateLimiter is an in-memory fixed-window limiter. It is deliberately scoped
// to authentication endpoints; deployments with multiple API replicas should
// enforce an equivalent limit at Cloudflare or their shared gateway as well.
type RateLimiter struct {
	mu      sync.Mutex
	entries map[string]rateLimitEntry
	limit   int
	window  time.Duration
	now     func() time.Time
}

// NewRateLimiter creates a limiter that allows limit requests per client IP
// within the given window.
func NewRateLimiter(limit int, window time.Duration) *RateLimiter {
	return &RateLimiter{
		entries: make(map[string]rateLimitEntry),
		limit:   limit,
		window:  window,
		now:     time.Now,
	}
}

// Middleware returns a Gin handler that enforces the rate limit per client IP.
func (l *RateLimiter) Middleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		now := l.now()
		key := c.ClientIP()

		l.mu.Lock()
		entry := l.entries[key]
		if entry.resetAt.IsZero() || !now.Before(entry.resetAt) {
			entry = rateLimitEntry{resetAt: now.Add(l.window)}
		}
		entry.count++
		l.entries[key] = entry
		allowed := entry.count <= l.limit
		l.mu.Unlock()

		if !allowed {
			retryAfter := int(time.Until(entry.resetAt).Seconds())
			if retryAfter < 1 {
				retryAfter = 1
			}
			c.Header("Retry-After", strconv.Itoa(retryAfter))
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error": gin.H{"code": "RATE_LIMITED", "message": "Too many requests. Please try again later."},
			})
			return
		}

		c.Next()
	}
}
