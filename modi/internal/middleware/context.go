package middleware

import (
	"errors"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

var (
	// ErrUserIDNotFound is returned when user_id is not found in context.
	ErrUserIDNotFound = errors.New("user_id not found in context")
)

// GetUserIDFromContext extracts the user ID from the gin context.
func GetUserIDFromContext(c *gin.Context) (uuid.UUID, error) {
	userID, exists := c.Get("user_id")
	if !exists {
		return uuid.Nil, ErrUserIDNotFound
	}

	uid, ok := userID.(uuid.UUID)
	if !ok {
		return uuid.Nil, ErrUserIDNotFound
	}

	return uid, nil
}
