// Package middleware provides HTTP middleware for the Modi API.
package middleware

import (
	"net/http"
	"strings"

	"github.com/ZaneLittle/modi/internal/config"
	"github.com/ZaneLittle/modi/internal/utils"
	"github.com/gin-gonic/gin"
)

// AuthMiddleware validates JWT tokens and sets user context.
func AuthMiddleware(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get token from Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": gin.H{
					"code":    "UNAUTHORIZED",
					"message": "Authorization header required",
				},
			})
			c.Abort()
			return
		}

		// Extract token from "Bearer <token>"
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": gin.H{
					"code":    "UNAUTHORIZED",
					"message": "Invalid authorization header format. Expected: Bearer <token>",
				},
			})
			c.Abort()
			return
		}

		token := parts[1]

		// Validate token
		claims, err := utils.ValidateAccessToken(token, cfg.JWTSecret)
		if err != nil {
			statusCode := http.StatusUnauthorized
			if err == utils.ErrExpiredToken {
				c.JSON(statusCode, gin.H{
					"error": gin.H{
						"code":    "TOKEN_EXPIRED",
						"message": "Token has expired",
					},
				})
			} else {
				c.JSON(statusCode, gin.H{
					"error": gin.H{
						"code":    "INVALID_TOKEN",
						"message": "Invalid token",
					},
				})
			}
			c.Abort()
			return
		}

		// Set user context
		c.Set("user_id", claims.UserID)
		c.Set("user_email", claims.Email)

		c.Next()
	}
}

