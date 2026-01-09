// Package middleware provides HTTP middleware functions for authentication and request handling.
package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// RequestSizeLimitMiddleware limits request body size to prevent DoS.
func RequestSizeLimitMiddleware(maxSize int64) gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.ContentLength > maxSize {
			defaultSecurityLogger.LogSuspiciousActivity(c, "request_size_exceeded", map[string]interface{}{
				"content_length": c.Request.ContentLength,
				"max_size":       maxSize,
			})
			c.JSON(http.StatusRequestEntityTooLarge, gin.H{
				"error": gin.H{
					"code":    "REQUEST_TOO_LARGE",
					"message": "Request body too large",
				},
			})
			c.Abort()
			return
		}
		c.Next()
	}
}
