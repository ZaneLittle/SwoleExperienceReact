// Package middleware provides HTTP middleware functions for authentication and request handling.
package middleware

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// TimeoutMiddleware creates a middleware that enforces a request timeout.
// If the request takes longer than the specified duration, it will be cancelled.
func TimeoutMiddleware(timeout time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Create a context with timeout
		ctx, cancel := context.WithTimeout(c.Request.Context(), timeout)
		defer cancel()

		// Replace the request context
		c.Request = c.Request.WithContext(ctx)

		// Create a channel to signal completion
		done := make(chan struct{})
		go func() {
			c.Next()
			close(done)
		}()

		// Wait for either completion or timeout
		select {
		case <-done:
			// Request completed normally
		case <-ctx.Done():
			// Request timed out
			if !c.Writer.Written() {
				c.JSON(http.StatusRequestTimeout, gin.H{
					"error": gin.H{
						"code":    "REQUEST_TIMEOUT",
						"message": "Request took too long to process",
					},
				})
				c.Abort()
			}
		}
	}
}
