package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/ZaneLittle/modi/internal/models"
	"github.com/ZaneLittle/modi/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// mockAuthService is a mock implementation of AuthService for testing
type mockAuthService struct {
	registerFn     func(ctx context.Context, email, password string) (*models.User, error)
	loginFn        func(ctx context.Context, email, password string) (*services.LoginResponse, error)
	refreshTokenFn func(ctx context.Context, refreshToken string) (*services.RefreshResponse, error)
	logoutFn       func(ctx context.Context, refreshToken string) error
}

func (m *mockAuthService) Register(ctx context.Context, email, password string) (*models.User, error) {
	if m.registerFn != nil {
		return m.registerFn(ctx, email, password)
	}
	return nil, nil
}

func (m *mockAuthService) Login(ctx context.Context, email, password string) (*services.LoginResponse, error) {
	if m.loginFn != nil {
		return m.loginFn(ctx, email, password)
	}
	return nil, nil
}

func (m *mockAuthService) RefreshToken(ctx context.Context, refreshToken string) (*services.RefreshResponse, error) {
	if m.refreshTokenFn != nil {
		return m.refreshTokenFn(ctx, refreshToken)
	}
	return nil, nil
}

func (m *mockAuthService) Logout(ctx context.Context, refreshToken string) error {
	if m.logoutFn != nil {
		return m.logoutFn(ctx, refreshToken)
	}
	return nil
}

func setupAuthTestRouter(handler *AuthHandler) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	auth := r.Group("/api/v1/auth")
	{
		auth.POST("/register", handler.Register)
		auth.POST("/login", handler.Login)
		auth.POST("/refresh", handler.Refresh)
		auth.POST("/logout", handler.Logout)
	}
	return r
}

func TestAuthHandler_Register_ValidationErrors(t *testing.T) {
	tests := []struct {
		name           string
		body           map[string]interface{}
		expectedStatus int
		expectedMsg    string
	}{
		{
			name:           "missing email",
			body:           map[string]interface{}{"password": "password123"},
			expectedStatus: http.StatusBadRequest,
			expectedMsg:    "Email is required",
		},
		{
			name:           "missing password",
			body:           map[string]interface{}{"email": "test@example.com"},
			expectedStatus: http.StatusBadRequest,
			expectedMsg:    "Password is required",
		},
		{
			name:           "invalid email format",
			body:           map[string]interface{}{"email": "invalid-email", "password": "password123"},
			expectedStatus: http.StatusBadRequest,
			expectedMsg:    "Please enter a valid email address",
		},
		{
			name:           "password too short",
			body:           map[string]interface{}{"email": "test@example.com", "password": "short"},
			expectedStatus: http.StatusBadRequest,
			expectedMsg:    "Password must be at least 8 characters",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockService := &mockAuthService{}
			handler := NewAuthHandler(mockService)
			router := setupAuthTestRouter(handler)

			body, _ := json.Marshal(tt.body)
			req, err := http.NewRequest(http.MethodPost, "/api/v1/auth/register", bytes.NewBuffer(body))
			require.NoError(t, err)
			req.Header.Set("Content-Type", "application/json")

			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code)

			var response map[string]interface{}
			err = json.Unmarshal(w.Body.Bytes(), &response)
			require.NoError(t, err)

			errorObj, ok := response["error"].(map[string]interface{})
			require.True(t, ok, "response should contain error object")
			assert.Equal(t, "VALIDATION_ERROR", errorObj["code"])
			assert.Equal(t, tt.expectedMsg, errorObj["message"])
		})
	}
}

func TestAuthHandler_Register_Success(t *testing.T) {
	userID := uuid.New()
	mockService := &mockAuthService{
		registerFn: func(_ context.Context, email, _ string) (*models.User, error) {
			return &models.User{
				ID:    userID,
				Email: email,
			}, nil
		},
		loginFn: func(_ context.Context, email, _ string) (*services.LoginResponse, error) {
			return &services.LoginResponse{
				AccessToken:  "test-access-token",
				RefreshToken: "test-refresh-token",
				User: &models.User{
					ID:    userID,
					Email: email,
				},
			}, nil
		},
	}
	handler := NewAuthHandler(mockService)
	router := setupAuthTestRouter(handler)

	body, _ := json.Marshal(map[string]interface{}{
		"email":    "test@example.com",
		"password": "password123",
	})
	req, err := http.NewRequest(http.MethodPost, "/api/v1/auth/register", bytes.NewBuffer(body))
	require.NoError(t, err)
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	data, ok := response["data"].(map[string]interface{})
	require.True(t, ok, "response should contain data object")
	assert.Equal(t, "test-access-token", data["access_token"])
	assert.Equal(t, "test-refresh-token", data["refresh_token"])
}

func TestAuthHandler_Login_ValidationErrors(t *testing.T) {
	tests := []struct {
		name           string
		body           map[string]interface{}
		expectedStatus int
		expectedMsg    string
	}{
		{
			name:           "missing email",
			body:           map[string]interface{}{"password": "password123"},
			expectedStatus: http.StatusBadRequest,
			expectedMsg:    "Email is required",
		},
		{
			name:           "missing password",
			body:           map[string]interface{}{"email": "test@example.com"},
			expectedStatus: http.StatusBadRequest,
			expectedMsg:    "Password is required",
		},
		{
			name:           "invalid email format",
			body:           map[string]interface{}{"email": "invalid-email", "password": "password123"},
			expectedStatus: http.StatusBadRequest,
			expectedMsg:    "Please enter a valid email address",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockService := &mockAuthService{}
			handler := NewAuthHandler(mockService)
			router := setupAuthTestRouter(handler)

			body, _ := json.Marshal(tt.body)
			req, err := http.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewBuffer(body))
			require.NoError(t, err)
			req.Header.Set("Content-Type", "application/json")

			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code)

			var response map[string]interface{}
			err = json.Unmarshal(w.Body.Bytes(), &response)
			require.NoError(t, err)

			errorObj, ok := response["error"].(map[string]interface{})
			require.True(t, ok, "response should contain error object")
			assert.Equal(t, "VALIDATION_ERROR", errorObj["code"])
			assert.Equal(t, tt.expectedMsg, errorObj["message"])
		})
	}
}

func TestAuthHandler_Login_InvalidCredentials(t *testing.T) {
	mockService := &mockAuthService{
		loginFn: func(_ context.Context, _, _ string) (*services.LoginResponse, error) {
			return nil, services.ErrInvalidCredentials
		},
	}
	handler := NewAuthHandler(mockService)
	router := setupAuthTestRouter(handler)

	body, _ := json.Marshal(map[string]interface{}{
		"email":    "test@example.com",
		"password": "wrongpassword",
	})
	req, err := http.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewBuffer(body))
	require.NoError(t, err)
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	errorObj, ok := response["error"].(map[string]interface{})
	require.True(t, ok, "response should contain error object")
	assert.Equal(t, "INVALID_CREDENTIALS", errorObj["code"])
	assert.Equal(t, "Invalid email or password", errorObj["message"])
}

func TestAuthHandler_Login_Success(t *testing.T) {
	userID := uuid.New()
	mockService := &mockAuthService{
		loginFn: func(_ context.Context, email, _ string) (*services.LoginResponse, error) {
			return &services.LoginResponse{
				AccessToken:  "test-access-token",
				RefreshToken: "test-refresh-token",
				User: &models.User{
					ID:    userID,
					Email: email,
				},
			}, nil
		},
	}
	handler := NewAuthHandler(mockService)
	router := setupAuthTestRouter(handler)

	body, _ := json.Marshal(map[string]interface{}{
		"email":    "test@example.com",
		"password": "password123",
	})
	req, err := http.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewBuffer(body))
	require.NoError(t, err)
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)

	data, ok := response["data"].(map[string]interface{})
	require.True(t, ok, "response should contain data object")
	assert.Equal(t, "test-access-token", data["access_token"])
	assert.Equal(t, "test-refresh-token", data["refresh_token"])
}

func TestExtractValidationError(t *testing.T) {
	// Test that the function returns empty string for non-validation errors
	result := extractValidationError(nil)
	assert.Equal(t, "", result)
}
