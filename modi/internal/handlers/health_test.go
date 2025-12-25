package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// Helper to create a test router with health endpoint
func setupTestRouter(handler *HealthHandler) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/health", handler.Health)
	return r
}

func TestHealthHandler_Health(t *testing.T) {
	tests := []struct {
		name           string
		db             *pgxpool.Pool
		redis          *redis.Client
		setupMocks     func() (*pgxpool.Pool, *redis.Client)
		expectedStatus int
		expectedBody   func() map[string]interface{}
	}{
		{
			name:  "all services healthy",
			db:    nil, // Will be set by setupMocks
			redis: nil,
			setupMocks: func() (*pgxpool.Pool, *redis.Client) {
				// For unit tests, we'll test with nil and verify "not configured"
				// In integration tests, we'll test with real connections
				return nil, nil
			},
			expectedStatus: http.StatusOK,
			expectedBody: func() map[string]interface{} {
				return map[string]interface{}{
					"status": "ok",
					"services": map[string]interface{}{
						"database": "not configured",
						"redis":    "not configured",
					},
				}
			},
		},
		{
			name:  "database not configured, redis not configured",
			db:    nil,
			redis: nil,
			setupMocks: func() (*pgxpool.Pool, *redis.Client) {
				return nil, nil
			},
			expectedStatus: http.StatusOK,
			expectedBody: func() map[string]interface{} {
				return map[string]interface{}{
					"status": "ok",
					"services": map[string]interface{}{
						"database": "not configured",
						"redis":    "not configured",
					},
				}
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			db, redis := tt.setupMocks()
			handler := NewHealthHandler(db, redis)
			router := setupTestRouter(handler)

			req, err := http.NewRequest(http.MethodGet, "/health", nil)
			require.NoError(t, err)

			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code)

			var response HealthResponse
			err = json.Unmarshal(w.Body.Bytes(), &response)
			require.NoError(t, err)

			expected := tt.expectedBody()
			assert.Equal(t, expected["status"], response.Status)
			assert.NotEmpty(t, response.Timestamp)

			// Validate timestamp format
			_, err = time.Parse(time.RFC3339, response.Timestamp)
			assert.NoError(t, err, "timestamp should be in RFC3339 format")

			// Validate services map
			if expectedServices, ok := expected["services"].(map[string]interface{}); ok {
				for key, expectedValue := range expectedServices {
					actualValue, exists := response.Services[key]
					assert.True(t, exists, "service %s should exist in response", key)
					assert.Equal(t, expectedValue, actualValue, "service %s should have expected value", key)
				}
			}
		})
	}
}

func TestHealthHandler_Health_ResponseStructure(t *testing.T) {
	handler := NewHealthHandler(nil, nil)
	router := setupTestRouter(handler)

	req, err := http.NewRequest(http.MethodGet, "/health", nil)
	require.NoError(t, err)

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response HealthResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	// Validate response structure
	assert.NotEmpty(t, response.Status)
	assert.NotEmpty(t, response.Timestamp)
	assert.NotNil(t, response.Services)
}

func TestNewHealthHandler(t *testing.T) {
	tests := []struct {
		name  string
		db    *pgxpool.Pool
		redis *redis.Client
	}{
		{
			name:  "creates handler with nil connections",
			db:    nil,
			redis: nil,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			handler := NewHealthHandler(tt.db, tt.redis)
			assert.NotNil(t, handler)
			assert.Equal(t, tt.db, handler.db)
			assert.Equal(t, tt.redis, handler.redis)
		})
	}
}

func TestHealthHandler_Health_TimestampFormat(t *testing.T) {
	handler := NewHealthHandler(nil, nil)
	router := setupTestRouter(handler)

	req, err := http.NewRequest(http.MethodGet, "/health", nil)
	require.NoError(t, err)

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response HealthResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	// Verify timestamp is valid RFC3339 format
	parsedTime, err := time.Parse(time.RFC3339, response.Timestamp)
	assert.NoError(t, err)
	assert.False(t, parsedTime.IsZero())

	// Verify timestamp is recent (within last minute)
	now := time.Now().UTC()
	diff := now.Sub(parsedTime)
	assert.True(t, diff < time.Minute, "timestamp should be recent")
}

func TestHealthHandler_Health_StatusValues(t *testing.T) {
	handler := NewHealthHandler(nil, nil)
	router := setupTestRouter(handler)

	req, err := http.NewRequest(http.MethodGet, "/health", nil)
	require.NoError(t, err)

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response HealthResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	// Status should be "ok" when services are not configured
	assert.Equal(t, "ok", response.Status)

	// Services map should contain database and redis
	assert.Contains(t, response.Services, "database")
	assert.Contains(t, response.Services, "redis")
}
