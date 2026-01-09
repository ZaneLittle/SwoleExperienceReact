// Package middleware provides HTTP middleware functions for authentication and request handling.
package middleware

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

// RateLimitConfig defines rate limiting configuration.
type RateLimitConfig struct {
	RequestsPerMinute int
	WindowDuration    time.Duration
}

// DefaultRateLimitConfig returns default rate limit configuration.
func DefaultRateLimitConfig() RateLimitConfig {
	return RateLimitConfig{
		RequestsPerMinute: 60,
		WindowDuration:    time.Minute,
	}
}

// RateLimitMiddleware creates a rate limiting middleware.
// If Redis is not available, the middleware allows all requests (graceful degradation).
func RateLimitMiddleware(redisClient *redis.Client, cfg RateLimitConfig) gin.HandlerFunc {
	return func(c *gin.Context) {
		// If Redis is not available, skip rate limiting (graceful degradation)
		if redisClient == nil {
			c.Next()
			return
		}

		// Get user ID from context (if authenticated) or use IP address
		var key string
		userID, err := GetUserIDFromContext(c)
		if err == nil {
			// Authenticated user - rate limit per user
			key = fmt.Sprintf("rate_limit:user:%s:%s", userID.String(), c.FullPath())
		} else {
			// Unauthenticated - rate limit per IP
			key = fmt.Sprintf("rate_limit:ip:%s:%s", c.ClientIP(), c.FullPath())
		}

		ctx := c.Request.Context()
		current, err := redisClient.Incr(ctx, key).Result()
		if err != nil {
			// If Redis fails, allow request (graceful degradation)
			c.Next()
			return
		}

		// Set expiration on first request
		if current == 1 {
			redisClient.Expire(ctx, key, cfg.WindowDuration)
		}

		// Set rate limit headers
		remaining := cfg.RequestsPerMinute - int(current)
		if remaining < 0 {
			remaining = 0
		}
		c.Header("X-Rate-Limit-Limit", strconv.Itoa(cfg.RequestsPerMinute))
		c.Header("X-Rate-Limit-Remaining", strconv.Itoa(remaining))
		c.Header("X-Rate-Limit-Reset", strconv.FormatInt(time.Now().Add(cfg.WindowDuration).Unix(), 10))

		// Check if limit exceeded
		if current > int64(cfg.RequestsPerMinute) {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": gin.H{
					"code":    "RATE_LIMIT_EXCEEDED",
					"message": "Rate limit exceeded. Please try again later.",
				},
			})
			c.Abort()
			return
		}

		c.Next()
	}
}
