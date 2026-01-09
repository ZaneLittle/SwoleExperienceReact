// Package middleware provides HTTP middleware functions for authentication and request handling.
package middleware

import (
	"log"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// SecurityLogger logs security-related events.
type SecurityLogger interface {
	LogUnauthorizedAccess(c *gin.Context, userID uuid.UUID, resourceID string, reason string)
	LogSuspiciousActivity(c *gin.Context, activity string, details map[string]interface{})
}

// SimpleSecurityLogger is a basic implementation of SecurityLogger.
type SimpleSecurityLogger struct{}

// LogUnauthorizedAccess logs unauthorized access attempts.
func (l *SimpleSecurityLogger) LogUnauthorizedAccess(c *gin.Context, userID uuid.UUID, resourceID string, reason string) {
	log.Printf("[SECURITY] Unauthorized access attempt - UserID: %s, ResourceID: %s, Reason: %s, IP: %s, Path: %s, Method: %s",
		userID.String(), resourceID, reason, c.ClientIP(), c.FullPath(), c.Request.Method)
}

// LogSuspiciousActivity logs suspicious activities.
func (l *SimpleSecurityLogger) LogSuspiciousActivity(c *gin.Context, activity string, details map[string]interface{}) {
	log.Printf("[SECURITY] Suspicious activity - Activity: %s, IP: %s, Path: %s, Details: %+v",
		activity, c.ClientIP(), c.FullPath(), details)
}

var defaultSecurityLogger SecurityLogger = &SimpleSecurityLogger{}

// LogUnauthorizedAccess is a convenience function to log unauthorized access attempts.
func LogUnauthorizedAccess(c *gin.Context, userID uuid.UUID, resourceID string, reason string) {
	defaultSecurityLogger.LogUnauthorizedAccess(c, userID, resourceID, reason)
}

// SecurityLoggingMiddleware logs security events.
func SecurityLoggingMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Log request for security monitoring
		start := time.Now()
		c.Next()
		duration := time.Since(start)

		// Log slow requests (potential DoS indicator)
		if duration > 5*time.Second {
			userID, _ := GetUserIDFromContext(c)
			defaultSecurityLogger.LogSuspiciousActivity(c, "slow_request", map[string]interface{}{
				"duration_ms": duration.Milliseconds(),
				"user_id":     userID.String(),
			})
		}
	}
}
