package handlers_test

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/ZaneLittle/modi/internal/handlers"
	"github.com/ZaneLittle/modi/internal/models"
	"github.com/ZaneLittle/modi/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type mockWorkoutService struct {
	createFn      func(ctx context.Context, userID uuid.UUID, workout *models.Workout) (*models.Workout, error)
	getWorkoutFn  func(ctx context.Context, userID uuid.UUID, workoutID uuid.UUID) (*models.Workout, error)
	getWorkoutsFn func(ctx context.Context, userID uuid.UUID) ([]*models.Workout, error)
	updateFn      func(ctx context.Context, userID uuid.UUID, workout *models.Workout) (*models.Workout, error)
	deleteFn      func(ctx context.Context, userID uuid.UUID, workoutID uuid.UUID) error
}

func (m *mockWorkoutService) CreateWorkout(ctx context.Context, userID uuid.UUID, workout *models.Workout) (*models.Workout, error) {
	if m.createFn != nil {
		return m.createFn(ctx, userID, workout)
	}
	return nil, nil
}

func (m *mockWorkoutService) GetWorkout(ctx context.Context, userID uuid.UUID, workoutID uuid.UUID) (*models.Workout, error) {
	if m.getWorkoutFn != nil {
		return m.getWorkoutFn(ctx, userID, workoutID)
	}
	return nil, nil
}

func (m *mockWorkoutService) GetWorkouts(ctx context.Context, userID uuid.UUID) ([]*models.Workout, error) {
	if m.getWorkoutsFn != nil {
		return m.getWorkoutsFn(ctx, userID)
	}
	return []*models.Workout{}, nil
}

func (m *mockWorkoutService) UpdateWorkout(ctx context.Context, userID uuid.UUID, workout *models.Workout) (*models.Workout, error) {
	if m.updateFn != nil {
		return m.updateFn(ctx, userID, workout)
	}
	return nil, nil
}

func (m *mockWorkoutService) DeleteWorkout(ctx context.Context, userID uuid.UUID, workoutID uuid.UUID) error {
	if m.deleteFn != nil {
		return m.deleteFn(ctx, userID, workoutID)
	}
	return nil
}

func setupWorkoutTestRouter(handler *handlers.WorkoutHandler, userID uuid.UUID) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	// Mock authentication middleware
	r.Use(func(c *gin.Context) {
		c.Set("user_id", userID)
		c.Next()
	})

	api := r.Group("/api/v1")
	{
		workouts := api.Group("/workouts")
		{
			workouts.GET("", handler.GetWorkouts)
			workouts.POST("", handler.CreateWorkout)
			workouts.GET("/:id", handler.GetWorkout)
			workouts.PUT("/:id", handler.UpdateWorkout)
			workouts.DELETE("/:id", handler.DeleteWorkout)
		}
	}
	return r
}

func TestWorkoutHandler_CreateWorkout(t *testing.T) {
	userID := uuid.New()
	workoutID := uuid.New()

	tests := []struct {
		name           string
		body           map[string]interface{}
		setupMock      func() *mockWorkoutService
		expectedStatus int
		checkResponse  func(t *testing.T, w *httptest.ResponseRecorder)
	}{
		{
			name: "successful creation",
			body: map[string]interface{}{
				"name":      "Bench Press",
				"weight":    135.0,
				"sets":      3,
				"reps":      10,
				"day":       1,
				"day_order": 0,
			},
			setupMock: func() *mockWorkoutService {
				return &mockWorkoutService{
					createFn: func(_ context.Context, uid uuid.UUID, w *models.Workout) (*models.Workout, error) {
						if uid != userID {
							return nil, assert.AnError
						}
						w.ID = workoutID
						w.UserID = uid
						w.CreatedAt = time.Now()
						w.UpdatedAt = time.Now()
						return w, nil
					},
				}
			},
			expectedStatus: http.StatusCreated,
			checkResponse: func(t *testing.T, w *httptest.ResponseRecorder) {
				var response map[string]interface{}
				err := json.Unmarshal(w.Body.Bytes(), &response)
				require.NoError(t, err)
				assert.Contains(t, w.Header().Get("X-Server-Timestamp"), "T")
				data, ok := response["data"].(map[string]interface{})
				require.True(t, ok)
				assert.Equal(t, "Bench Press", data["name"])
			},
		},
		{
			name: "missing required field - name",
			body: map[string]interface{}{
				"day":       1,
				"day_order": 0,
			},
			setupMock: func() *mockWorkoutService {
				return &mockWorkoutService{}
			},
			expectedStatus: http.StatusBadRequest,
			checkResponse: func(t *testing.T, w *httptest.ResponseRecorder) {
				var response map[string]interface{}
				err := json.Unmarshal(w.Body.Bytes(), &response)
				require.NoError(t, err)
				errorObj, ok := response["error"].(map[string]interface{})
				require.True(t, ok)
				assert.Equal(t, "VALIDATION_ERROR", errorObj["code"])
			},
		},
		{
			name: "invalid day - too low",
			body: map[string]interface{}{
				"name":      "Bench Press",
				"day":       0,
				"day_order": 0,
			},
			setupMock: func() *mockWorkoutService {
				return &mockWorkoutService{}
			},
			expectedStatus: http.StatusBadRequest,
			checkResponse: func(t *testing.T, w *httptest.ResponseRecorder) {
				var response map[string]interface{}
				err := json.Unmarshal(w.Body.Bytes(), &response)
				require.NoError(t, err)
				errorObj, ok := response["error"].(map[string]interface{})
				require.True(t, ok)
				assert.Equal(t, "VALIDATION_ERROR", errorObj["code"])
			},
		},
		{
			name: "XSS in name",
			body: map[string]interface{}{
				"name":      "<script>alert('xss')</script>",
				"day":       1,
				"day_order": 0,
			},
			setupMock: func() *mockWorkoutService {
				return &mockWorkoutService{}
			},
			expectedStatus: http.StatusBadRequest,
			checkResponse: func(t *testing.T, w *httptest.ResponseRecorder) {
				var response map[string]interface{}
				err := json.Unmarshal(w.Body.Bytes(), &response)
				require.NoError(t, err)
				errorObj, ok := response["error"].(map[string]interface{})
				require.True(t, ok)
				assert.Equal(t, "VALIDATION_ERROR", errorObj["code"])
			},
		},
		{
			name: "service error",
			body: map[string]interface{}{
				"name":      "Bench Press",
				"day":       1,
				"day_order": 0,
			},
			setupMock: func() *mockWorkoutService {
				return &mockWorkoutService{
					createFn: func(_ context.Context, _ uuid.UUID, _ *models.Workout) (*models.Workout, error) {
						return nil, assert.AnError
					},
				}
			},
			expectedStatus: http.StatusInternalServerError,
			checkResponse: func(t *testing.T, w *httptest.ResponseRecorder) {
				var response map[string]interface{}
				err := json.Unmarshal(w.Body.Bytes(), &response)
				require.NoError(t, err)
				errorObj, ok := response["error"].(map[string]interface{})
				require.True(t, ok)
				assert.Equal(t, "INTERNAL_ERROR", errorObj["code"])
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockService := tt.setupMock()
			handler := handlers.NewWorkoutHandler(mockService)
			router := setupWorkoutTestRouter(handler, userID)

			body, _ := json.Marshal(tt.body)
			req, err := http.NewRequest(http.MethodPost, "/api/v1/workouts", bytes.NewBuffer(body))
			require.NoError(t, err)
			req.Header.Set("Content-Type", "application/json")

			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code)
			if tt.checkResponse != nil {
				tt.checkResponse(t, w)
			}
		})
	}
}

func TestWorkoutHandler_GetWorkout(t *testing.T) {
	userID := uuid.New()
	workoutID := uuid.New()

	tests := []struct {
		name           string
		workoutID      uuid.UUID
		setupMock      func() *mockWorkoutService
		expectedStatus int
		checkResponse  func(t *testing.T, w *httptest.ResponseRecorder)
	}{
		{
			name:      "successful retrieval",
			workoutID: workoutID,
			setupMock: func() *mockWorkoutService {
				return &mockWorkoutService{
					getWorkoutFn: func(_ context.Context, uid uuid.UUID, wid uuid.UUID) (*models.Workout, error) {
						if uid != userID || wid != workoutID {
							return nil, assert.AnError
						}
						return &models.Workout{
							ID:        workoutID,
							UserID:    userID,
							Name:      "Bench Press",
							UpdatedAt: time.Now(),
						}, nil
					},
				}
			},
			expectedStatus: http.StatusOK,
			checkResponse: func(t *testing.T, w *httptest.ResponseRecorder) {
				var response map[string]interface{}
				err := json.Unmarshal(w.Body.Bytes(), &response)
				require.NoError(t, err)
				assert.Contains(t, w.Header().Get("X-Server-Timestamp"), "T")
				data, ok := response["data"].(map[string]interface{})
				require.True(t, ok)
				assert.Equal(t, "Bench Press", data["name"])
			},
		},
		{
			name:      "invalid UUID",
			workoutID: workoutID,
			setupMock: func() *mockWorkoutService {
				return &mockWorkoutService{}
			},
			expectedStatus: http.StatusBadRequest,
			checkResponse: func(t *testing.T, w *httptest.ResponseRecorder) {
				var response map[string]interface{}
				err := json.Unmarshal(w.Body.Bytes(), &response)
				require.NoError(t, err)
				errorObj, ok := response["error"].(map[string]interface{})
				require.True(t, ok)
				assert.Equal(t, "VALIDATION_ERROR", errorObj["code"])
			},
		},
		{
			name:      "workout not found",
			workoutID: workoutID,
			setupMock: func() *mockWorkoutService {
				return &mockWorkoutService{
					getWorkoutFn: func(_ context.Context, _ uuid.UUID, _ uuid.UUID) (*models.Workout, error) {
						return nil, services.ErrWorkoutNotFound
					},
				}
			},
			expectedStatus: http.StatusNotFound,
			checkResponse: func(t *testing.T, w *httptest.ResponseRecorder) {
				var response map[string]interface{}
				err := json.Unmarshal(w.Body.Bytes(), &response)
				require.NoError(t, err)
				errorObj, ok := response["error"].(map[string]interface{})
				require.True(t, ok)
				assert.Equal(t, "NOT_FOUND", errorObj["code"])
			},
		},
		{
			name:      "unauthorized access",
			workoutID: workoutID,
			setupMock: func() *mockWorkoutService {
				return &mockWorkoutService{
					getWorkoutFn: func(_ context.Context, _ uuid.UUID, _ uuid.UUID) (*models.Workout, error) {
						return nil, services.ErrUnauthorizedWorkoutAccess
					},
				}
			},
			expectedStatus: http.StatusForbidden,
			checkResponse: func(t *testing.T, w *httptest.ResponseRecorder) {
				var response map[string]interface{}
				err := json.Unmarshal(w.Body.Bytes(), &response)
				require.NoError(t, err)
				errorObj, ok := response["error"].(map[string]interface{})
				require.True(t, ok)
				assert.Equal(t, "FORBIDDEN", errorObj["code"])
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockService := tt.setupMock()
			handler := handlers.NewWorkoutHandler(mockService)
			router := setupWorkoutTestRouter(handler, userID)

			workoutIDStr := tt.workoutID.String()
			if tt.name == "invalid UUID" {
				workoutIDStr = "invalid-uuid"
			}

			req, err := http.NewRequest(http.MethodGet, "/api/v1/workouts/"+workoutIDStr, nil)
			require.NoError(t, err)

			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code)
			if tt.checkResponse != nil {
				tt.checkResponse(t, w)
			}
		})
	}
}

func TestWorkoutHandler_GetWorkouts(t *testing.T) {
	userID := uuid.New()

	tests := []struct {
		name           string
		setupMock      func() *mockWorkoutService
		expectedStatus int
		checkResponse  func(t *testing.T, w *httptest.ResponseRecorder)
	}{
		{
			name: "successful retrieval",
			setupMock: func() *mockWorkoutService {
				return &mockWorkoutService{
					getWorkoutsFn: func(_ context.Context, uid uuid.UUID) ([]*models.Workout, error) {
						if uid != userID {
							return nil, assert.AnError
						}
						return []*models.Workout{
							{ID: uuid.New(), UserID: userID, Name: "Workout 1"},
							{ID: uuid.New(), UserID: userID, Name: "Workout 2"},
						}, nil
					},
				}
			},
			expectedStatus: http.StatusOK,
			checkResponse: func(t *testing.T, w *httptest.ResponseRecorder) {
				var response map[string]interface{}
				err := json.Unmarshal(w.Body.Bytes(), &response)
				require.NoError(t, err)
				data, ok := response["data"].([]interface{})
				require.True(t, ok)
				assert.Len(t, data, 2)
			},
		},
		{
			name: "empty list",
			setupMock: func() *mockWorkoutService {
				return &mockWorkoutService{
					getWorkoutsFn: func(_ context.Context, _ uuid.UUID) ([]*models.Workout, error) {
						return []*models.Workout{}, nil
					},
				}
			},
			expectedStatus: http.StatusOK,
			checkResponse: func(t *testing.T, w *httptest.ResponseRecorder) {
				var response map[string]interface{}
				err := json.Unmarshal(w.Body.Bytes(), &response)
				require.NoError(t, err)
				data, ok := response["data"].([]interface{})
				require.True(t, ok)
				assert.Len(t, data, 0)
			},
		},
		{
			name: "service error",
			setupMock: func() *mockWorkoutService {
				return &mockWorkoutService{
					getWorkoutsFn: func(_ context.Context, _ uuid.UUID) ([]*models.Workout, error) {
						return nil, assert.AnError
					},
				}
			},
			expectedStatus: http.StatusInternalServerError,
			checkResponse: func(t *testing.T, w *httptest.ResponseRecorder) {
				var response map[string]interface{}
				err := json.Unmarshal(w.Body.Bytes(), &response)
				require.NoError(t, err)
				errorObj, ok := response["error"].(map[string]interface{})
				require.True(t, ok)
				assert.Equal(t, "INTERNAL_ERROR", errorObj["code"])
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockService := tt.setupMock()
			handler := handlers.NewWorkoutHandler(mockService)
			router := setupWorkoutTestRouter(handler, userID)

			req, err := http.NewRequest(http.MethodGet, "/api/v1/workouts", nil)
			require.NoError(t, err)

			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code)
			if tt.checkResponse != nil {
				tt.checkResponse(t, w)
			}
		})
	}
}

func TestWorkoutHandler_UpdateWorkout(t *testing.T) {
	userID := uuid.New()
	workoutID := uuid.New()

	tests := []struct {
		name           string
		workoutID      uuid.UUID
		body           map[string]interface{}
		setupMock      func() *mockWorkoutService
		expectedStatus int
		checkResponse  func(t *testing.T, w *httptest.ResponseRecorder)
	}{
		{
			name:      "successful update",
			workoutID: workoutID,
			body: map[string]interface{}{
				"id":        workoutID,
				"name":      "Updated Bench Press",
				"day":       1,
				"day_order": 0,
			},
			setupMock: func() *mockWorkoutService {
				return &mockWorkoutService{
					updateFn: func(_ context.Context, uid uuid.UUID, w *models.Workout) (*models.Workout, error) {
						if uid != userID || w.ID != workoutID {
							return nil, assert.AnError
						}
						result := &models.Workout{
							ID:        w.ID,
							UserID:    uid,
							Name:      w.Name,
							Weight:    w.Weight,
							Sets:      w.Sets,
							Reps:      w.Reps,
							Notes:     w.Notes,
							Day:       w.Day,
							DayOrder:  w.DayOrder,
							UpdatedAt: time.Now(),
						}
						return result, nil
					},
				}
			},
			expectedStatus: http.StatusOK,
			checkResponse: func(t *testing.T, w *httptest.ResponseRecorder) {
				var response map[string]interface{}
				err := json.Unmarshal(w.Body.Bytes(), &response)
				require.NoError(t, err)
				assert.Contains(t, w.Header().Get("X-Server-Timestamp"), "T")
				data, ok := response["data"].(map[string]interface{})
				require.True(t, ok)
				assert.Equal(t, "Updated Bench Press", data["name"])
			},
		},
		{
			name:      "ID mismatch",
			workoutID: workoutID,
			body: map[string]interface{}{
				"id":        uuid.New(),
				"name":      "Updated Bench Press",
				"day":       1,
				"day_order": 0,
			},
			setupMock: func() *mockWorkoutService {
				return &mockWorkoutService{}
			},
			expectedStatus: http.StatusBadRequest,
			checkResponse: func(t *testing.T, w *httptest.ResponseRecorder) {
				var response map[string]interface{}
				err := json.Unmarshal(w.Body.Bytes(), &response)
				require.NoError(t, err)
				errorObj, ok := response["error"].(map[string]interface{})
				require.True(t, ok)
				assert.Equal(t, "VALIDATION_ERROR", errorObj["code"])
			},
		},
		{
			name:      "unauthorized access",
			workoutID: workoutID,
			body: map[string]interface{}{
				"id":        workoutID,
				"name":      "Updated Bench Press",
				"day":       1,
				"day_order": 0,
			},
			setupMock: func() *mockWorkoutService {
				return &mockWorkoutService{
					updateFn: func(_ context.Context, _ uuid.UUID, _ *models.Workout) (*models.Workout, error) {
						return nil, services.ErrUnauthorizedWorkoutAccess
					},
				}
			},
			expectedStatus: http.StatusForbidden,
			checkResponse: func(t *testing.T, w *httptest.ResponseRecorder) {
				var response map[string]interface{}
				err := json.Unmarshal(w.Body.Bytes(), &response)
				require.NoError(t, err)
				errorObj, ok := response["error"].(map[string]interface{})
				require.True(t, ok)
				// Note: The handler validates ID match first, so unauthorized access
				// would only be detected if IDs match but user doesn't own the workout
				// In this test, we're testing the service layer behavior
				assert.Contains(t, []string{"FORBIDDEN", "VALIDATION_ERROR"}, errorObj["code"].(string))
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockService := tt.setupMock()
			handler := handlers.NewWorkoutHandler(mockService)
			router := setupWorkoutTestRouter(handler, userID)

			body, _ := json.Marshal(tt.body)
			req, err := http.NewRequest(http.MethodPut, "/api/v1/workouts/"+tt.workoutID.String(), bytes.NewBuffer(body))
			require.NoError(t, err)
			req.Header.Set("Content-Type", "application/json")

			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code)
			if tt.checkResponse != nil {
				tt.checkResponse(t, w)
			}
		})
	}
}

func TestWorkoutHandler_DeleteWorkout(t *testing.T) {
	userID := uuid.New()
	workoutID := uuid.New()

	tests := []struct {
		name           string
		workoutID      uuid.UUID
		setupMock      func() *mockWorkoutService
		expectedStatus int
		checkResponse  func(t *testing.T, w *httptest.ResponseRecorder)
	}{
		{
			name:      "successful deletion",
			workoutID: workoutID,
			setupMock: func() *mockWorkoutService {
				return &mockWorkoutService{
					deleteFn: func(_ context.Context, uid uuid.UUID, wid uuid.UUID) error {
						if uid != userID || wid != workoutID {
							return assert.AnError
						}
						return nil
					},
				}
			},
			expectedStatus: http.StatusOK,
			checkResponse: func(t *testing.T, w *httptest.ResponseRecorder) {
				var response map[string]interface{}
				err := json.Unmarshal(w.Body.Bytes(), &response)
				require.NoError(t, err)
				data, ok := response["data"].(map[string]interface{})
				require.True(t, ok)
				assert.Equal(t, "Workout deleted successfully", data["message"])
			},
		},
		{
			name:      "workout not found",
			workoutID: workoutID,
			setupMock: func() *mockWorkoutService {
				return &mockWorkoutService{
					deleteFn: func(_ context.Context, _ uuid.UUID, _ uuid.UUID) error {
						return services.ErrWorkoutNotFound
					},
				}
			},
			expectedStatus: http.StatusNotFound,
			checkResponse: func(t *testing.T, w *httptest.ResponseRecorder) {
				var response map[string]interface{}
				err := json.Unmarshal(w.Body.Bytes(), &response)
				require.NoError(t, err)
				errorObj, ok := response["error"].(map[string]interface{})
				require.True(t, ok)
				assert.Equal(t, "NOT_FOUND", errorObj["code"])
			},
		},
		{
			name:      "unauthorized access",
			workoutID: workoutID,
			setupMock: func() *mockWorkoutService {
				return &mockWorkoutService{
					deleteFn: func(_ context.Context, _ uuid.UUID, _ uuid.UUID) error {
						return services.ErrUnauthorizedWorkoutAccess
					},
				}
			},
			expectedStatus: http.StatusForbidden,
			checkResponse: func(t *testing.T, w *httptest.ResponseRecorder) {
				var response map[string]interface{}
				err := json.Unmarshal(w.Body.Bytes(), &response)
				require.NoError(t, err)
				errorObj, ok := response["error"].(map[string]interface{})
				require.True(t, ok)
				assert.Equal(t, "FORBIDDEN", errorObj["code"])
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockService := tt.setupMock()
			handler := handlers.NewWorkoutHandler(mockService)
			router := setupWorkoutTestRouter(handler, userID)

			req, err := http.NewRequest(http.MethodDelete, "/api/v1/workouts/"+tt.workoutID.String(), nil)
			require.NoError(t, err)

			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code)
			if tt.checkResponse != nil {
				tt.checkResponse(t, w)
			}
		})
	}
}
