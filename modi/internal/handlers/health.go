package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

type HealthHandler struct {
	db    *pgxpool.Pool
	redis *redis.Client
}

func NewHealthHandler(db *pgxpool.Pool, redis *redis.Client) *HealthHandler {
	return &HealthHandler{
		db:    db,
		redis: redis,
	}
}

type HealthResponse struct {
	Status    string            `json:"status"`
	Timestamp string            `json:"timestamp"`
	Services  map[string]string `json:"services,omitempty"`
}

func (h *HealthHandler) Health(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	response := HealthResponse{
		Status:    "ok",
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Services:  make(map[string]string),
	}

	overallStatus := "ok"

	// Check database connection
	if h.db != nil {
		if err := h.db.Ping(ctx); err != nil {
			response.Services["database"] = "unhealthy: " + err.Error()
			overallStatus = "degraded"
		} else {
			response.Services["database"] = "healthy"
		}
	} else {
		response.Services["database"] = "not configured"
	}

	// Check Redis connection
	if h.redis != nil {
		if err := h.redis.Ping(ctx).Err(); err != nil {
			response.Services["redis"] = "unhealthy: " + err.Error()
			overallStatus = "degraded"
		} else {
			response.Services["redis"] = "healthy"
		}
	} else {
		response.Services["redis"] = "not configured"
	}

	response.Status = overallStatus

	statusCode := http.StatusOK
	if overallStatus == "degraded" {
		statusCode = http.StatusServiceUnavailable
	}

	c.JSON(statusCode, response)
}


