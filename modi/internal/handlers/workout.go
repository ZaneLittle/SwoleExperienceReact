package handlers

import (
	"net/http"
	"time"

	"github.com/ZaneLittle/modi/internal/middleware"
	"github.com/ZaneLittle/modi/internal/models"
	"github.com/ZaneLittle/modi/internal/services"
	"github.com/ZaneLittle/modi/internal/validation"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
)

// WorkoutHandler handles HTTP requests for workout operations.
type WorkoutHandler struct {
	workoutService services.WorkoutService
	validator      *validator.Validate
}

// NewWorkoutHandler creates a new workout handler.
func NewWorkoutHandler(workoutService services.WorkoutService) *WorkoutHandler {
	return &WorkoutHandler{
		workoutService: workoutService,
		validator:      validator.New(),
	}
}

// CreateWorkoutRequest represents a workout creation request.
type CreateWorkoutRequest struct {
	Name     string   `json:"name" binding:"required"`
	Weight   *float64 `json:"weight,omitempty"`
	Sets     *int     `json:"sets,omitempty"`
	Reps     *int     `json:"reps,omitempty"`
	Notes    *string  `json:"notes,omitempty"`
	Day      int      `json:"day" binding:"required,min=1"`
	DayOrder int      `json:"day_order" binding:"required,min=0"`
}

// UpdateWorkoutRequest represents a workout update request.
type UpdateWorkoutRequest struct {
	ID       uuid.UUID `json:"id" binding:"required"`
	Name     string    `json:"name" binding:"required"`
	Weight   *float64  `json:"weight,omitempty"`
	Sets     *int      `json:"sets,omitempty"`
	Reps     *int      `json:"reps,omitempty"`
	Notes    *string   `json:"notes,omitempty"`
	Day      int       `json:"day" binding:"required,min=1"`
	DayOrder int       `json:"day_order" binding:"required,min=0"`
}

// CreateWorkout handles workout creation.
func (h *WorkoutHandler) CreateWorkout(c *gin.Context) {
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

	var req CreateWorkoutRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		errorMsg := extractValidationError(err)
		if errorMsg == "" {
			errorMsg = "Invalid request. Please check your input and try again."
		}

		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": errorMsg,
			},
		})
		return
	}

	// Validate input using custom validation
	if err := validation.ValidateWorkoutRequest(req.Name, req.Weight, req.Sets, req.Reps, req.Notes, req.Day, req.DayOrder); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": err.Error(),
			},
		})
		return
	}

	workout := &models.Workout{
		ID:       uuid.New(),
		Name:     req.Name,
		Weight:   req.Weight,
		Sets:     req.Sets,
		Reps:     req.Reps,
		Notes:    req.Notes,
		Day:      req.Day,
		DayOrder: req.DayOrder,
	}

	result, err := h.workoutService.CreateWorkout(c.Request.Context(), userID, workout)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to create workout",
			},
		})
		return
	}

	c.Header("X-Timestamp", time.Now().UTC().Format(time.RFC3339))
	c.Header("X-Server-Timestamp", result.UpdatedAt.UTC().Format(time.RFC3339))
	c.JSON(http.StatusCreated, gin.H{
		"data": result,
	})
}

// GetWorkout handles retrieving a single workout by ID.
func (h *WorkoutHandler) GetWorkout(c *gin.Context) {
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

	workoutIDStr := c.Param("id")
	workoutID, err := uuid.Parse(workoutIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Invalid workout ID",
			},
		})
		return
	}

	workout, err := h.workoutService.GetWorkout(c.Request.Context(), userID, workoutID)
	if err != nil {
		if err == services.ErrWorkoutNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error": gin.H{
					"code":    "NOT_FOUND",
					"message": "Workout not found",
				},
			})
			return
		}
		if err == services.ErrUnauthorizedWorkoutAccess {
			c.JSON(http.StatusForbidden, gin.H{
				"error": gin.H{
					"code":    "FORBIDDEN",
					"message": "You do not have access to this workout",
				},
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to retrieve workout",
			},
		})
		return
	}

	c.Header("X-Timestamp", time.Now().UTC().Format(time.RFC3339))
	c.Header("X-Server-Timestamp", workout.UpdatedAt.UTC().Format(time.RFC3339))
	c.JSON(http.StatusOK, gin.H{
		"data": workout,
	})
}

// GetWorkouts handles retrieving all workouts for the authenticated user.
func (h *WorkoutHandler) GetWorkouts(c *gin.Context) {
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

	workouts, err := h.workoutService.GetWorkouts(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to retrieve workouts",
			},
		})
		return
	}

	c.Header("X-Timestamp", time.Now().UTC().Format(time.RFC3339))
	c.JSON(http.StatusOK, gin.H{
		"data": workouts,
	})
}

// UpdateWorkout handles workout updates.
func (h *WorkoutHandler) UpdateWorkout(c *gin.Context) {
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

	workoutIDStr := c.Param("id")
	workoutID, err := uuid.Parse(workoutIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Invalid workout ID",
			},
		})
		return
	}

	var req UpdateWorkoutRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		errorMsg := extractValidationError(err)
		if errorMsg == "" {
			errorMsg = "Invalid request. Please check your input and try again."
		}

		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": errorMsg,
			},
		})
		return
	}

	// Ensure the ID in the request body matches the URL parameter
	if req.ID != workoutID {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Workout ID in body must match URL parameter",
			},
		})
		return
	}

	// Validate input using custom validation
	if err := validation.ValidateWorkoutRequest(req.Name, req.Weight, req.Sets, req.Reps, req.Notes, req.Day, req.DayOrder); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": err.Error(),
			},
		})
		return
	}

	workout := &models.Workout{
		ID:       req.ID,
		Name:     req.Name,
		Weight:   req.Weight,
		Sets:     req.Sets,
		Reps:     req.Reps,
		Notes:    req.Notes,
		Day:      req.Day,
		DayOrder: req.DayOrder,
	}

	result, err := h.workoutService.UpdateWorkout(c.Request.Context(), userID, workout)
	if err != nil {
		if err == services.ErrWorkoutNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error": gin.H{
					"code":    "NOT_FOUND",
					"message": "Workout not found",
				},
			})
			return
		}
		if err == services.ErrUnauthorizedWorkoutAccess {
			// Log unauthorized access attempt
			middleware.LogUnauthorizedAccess(c, userID, workoutIDStr, "workout update")
			c.JSON(http.StatusForbidden, gin.H{
				"error": gin.H{
					"code":    "FORBIDDEN",
					"message": "You do not have access to this workout",
				},
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to update workout",
			},
		})
		return
	}

	c.Header("X-Timestamp", time.Now().UTC().Format(time.RFC3339))
	c.Header("X-Server-Timestamp", result.UpdatedAt.UTC().Format(time.RFC3339))
	c.JSON(http.StatusOK, gin.H{
		"data": result,
	})
}

// DeleteWorkout handles workout deletion (soft delete).
func (h *WorkoutHandler) DeleteWorkout(c *gin.Context) {
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

	workoutIDStr := c.Param("id")
	workoutID, err := uuid.Parse(workoutIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Invalid workout ID",
			},
		})
		return
	}

	err = h.workoutService.DeleteWorkout(c.Request.Context(), userID, workoutID)
	if err != nil {
		if err == services.ErrWorkoutNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error": gin.H{
					"code":    "NOT_FOUND",
					"message": "Workout not found",
				},
			})
			return
		}
		if err == services.ErrUnauthorizedWorkoutAccess {
			// Log unauthorized access attempt
			middleware.LogUnauthorizedAccess(c, userID, workoutIDStr, "workout delete")
			c.JSON(http.StatusForbidden, gin.H{
				"error": gin.H{
					"code":    "FORBIDDEN",
					"message": "You do not have access to this workout",
				},
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to delete workout",
			},
		})
		return
	}

	c.Header("X-Timestamp", time.Now().UTC().Format(time.RFC3339))
	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"message": "Workout deleted successfully",
		},
	})
}
