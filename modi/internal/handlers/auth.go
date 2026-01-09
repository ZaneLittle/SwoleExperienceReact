package handlers

import (
	"fmt"
	"net/http"
	"time"

	"github.com/ZaneLittle/modi/internal/middleware"
	"github.com/ZaneLittle/modi/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

// AuthHandler handles HTTP requests for authentication operations.
type AuthHandler struct {
	authService services.AuthService
	validator   *validator.Validate
}

// NewAuthHandler creates a new authentication handler.
func NewAuthHandler(authService services.AuthService) *AuthHandler {
	return &AuthHandler{
		authService: authService,
		validator:   validator.New(),
	}
}

// RegisterRequest represents a user registration request.
type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

// LoginRequest represents a user login request.
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// RefreshRequest represents a token refresh request.
type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

func extractValidationError(err error) string {
	if validationErrors, ok := err.(validator.ValidationErrors); ok {
		if len(validationErrors) > 0 {
			fieldError := validationErrors[0]
			fieldName := fieldError.Field()
			tag := fieldError.Tag()

			switch tag {
			case "required":
				return fmt.Sprintf("%s is required", fieldName)
			case "email":
				return "Please enter a valid email address"
			case "min":
				if fieldName == "Password" {
					return "Password must be at least 8 characters"
				}
				return fmt.Sprintf("%s is too short", fieldName)
			default:
				return fmt.Sprintf("Invalid %s", fieldName)
			}
		}
	}
	return ""
}

// Register handles user registration.
func (h *AuthHandler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		errorMsg := extractValidationError(err)
		if errorMsg == "" {
			errorMsg = "Invalid request. Please check your input and try again."
		}

		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": errorMsg,
				"details": err.Error(),
			},
		})
		return
	}

	_, err := h.authService.Register(c.Request.Context(), req.Email, req.Password)
	if err != nil {
		if err == services.ErrInvalidCredentials {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": gin.H{
					"code":    "VALIDATION_ERROR",
					"message": "Invalid email or password",
				},
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to create user",
			},
		})
		return
	}

	loginResponse, err := h.authService.Login(c.Request.Context(), req.Email, req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to login after registration",
			},
		})
		return
	}

	c.Header("X-Timestamp", time.Now().UTC().Format(time.RFC3339))
	c.JSON(http.StatusCreated, gin.H{
		"data": loginResponse,
	})
}

// Login handles user login.
func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		errorMsg := extractValidationError(err)
		if errorMsg == "" {
			errorMsg = "Invalid request. Please check your input and try again."
		}

		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": errorMsg,
				"details": err.Error(),
			},
		})
		return
	}

	response, err := h.authService.Login(c.Request.Context(), req.Email, req.Password)
	if err != nil {
		if err == services.ErrInvalidCredentials {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": gin.H{
					"code":    "INVALID_CREDENTIALS",
					"message": "Invalid email or password",
				},
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to login",
			},
		})
		return
	}

	c.Header("X-Timestamp", time.Now().UTC().Format(time.RFC3339))
	c.JSON(http.StatusOK, gin.H{
		"data": response,
	})
}

// Refresh handles token refresh.
func (h *AuthHandler) Refresh(c *gin.Context) {
	var req RefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Invalid request",
				"details": err.Error(),
			},
		})
		return
	}

	response, err := h.authService.RefreshToken(c.Request.Context(), req.RefreshToken)
	if err != nil {
		if err == services.ErrInvalidRefreshToken {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": gin.H{
					"code":    "INVALID_REFRESH_TOKEN",
					"message": "Invalid or expired refresh token",
				},
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to refresh token",
			},
		})
		return
	}

	c.Header("X-Timestamp", time.Now().UTC().Format(time.RFC3339))
	c.JSON(http.StatusOK, gin.H{
		"data": response,
	})
}

// Logout handles user logout.
func (h *AuthHandler) Logout(c *gin.Context) {
	var req RefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Invalid request",
				"details": err.Error(),
			},
		})
		return
	}

	err := h.authService.Logout(c.Request.Context(), req.RefreshToken)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to logout",
			},
		})
		return
	}

	c.Header("X-Timestamp", time.Now().UTC().Format(time.RFC3339))
	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"message": "Logged out successfully",
		},
	})
}

// DeleteAccount handles account deletion.
func (h *AuthHandler) DeleteAccount(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": gin.H{
				"code":    "UNAUTHORIZED",
				"message": "User ID not found in context",
			},
		})
		return
	}

	err = h.authService.DeleteAccount(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to delete account",
			},
		})
		return
	}

	c.Header("X-Timestamp", time.Now().UTC().Format(time.RFC3339))
	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"message": "Account deleted successfully",
		},
	})
}
