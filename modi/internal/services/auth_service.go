// Package services provides business logic for the Modi application.
package services

import (
	"context"
	"errors"
	"time"

	"github.com/ZaneLittle/modi/internal/models"
	"github.com/ZaneLittle/modi/internal/repositories"
	"github.com/ZaneLittle/modi/internal/utils"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

var (
	// ErrInvalidCredentials is returned when credentials are invalid.
	ErrInvalidCredentials = errors.New("invalid email or password")
	// ErrInvalidRefreshToken is returned when refresh token is invalid or expired.
	ErrInvalidRefreshToken = errors.New("invalid or expired refresh token")
)

// AuthService defines the interface for authentication operations.
type AuthService interface {
	Register(ctx context.Context, email, password string) (*models.User, error)
	Login(ctx context.Context, email, password string) (*LoginResponse, error)
	RefreshToken(ctx context.Context, refreshToken string) (*RefreshResponse, error)
	Logout(ctx context.Context, refreshToken string) error
}

type authService struct {
	userRepo   repositories.UserRepository
	redis      *redis.Client
	jwtSecret  string
	refreshTTL time.Duration
}

// LoginResponse contains the tokens returned after login.
type LoginResponse struct {
	AccessToken  string       `json:"access_token"`
	RefreshToken string       `json:"refresh_token"`
	User         *models.User `json:"user"`
}

// RefreshResponse contains the new access token after refresh.
type RefreshResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
}

// NewAuthService creates a new authentication service.
func NewAuthService(userRepo repositories.UserRepository, redis *redis.Client, jwtSecret string) AuthService {
	return &authService{
		userRepo:   userRepo,
		redis:      redis,
		jwtSecret:  jwtSecret,
		refreshTTL: 7 * 24 * time.Hour, // 7 days
	}
}

// Register creates a new user account.
func (s *authService) Register(ctx context.Context, email, password string) (*models.User, error) {
	// Hash the password
	hashedPassword, err := utils.HashPassword(password)
	if err != nil {
		return nil, err
	}

	// Create user
	user := &models.User{
		ID:           uuid.New(),
		Email:        email,
		PasswordHash: hashedPassword,
	}

	// Save to database
	err = s.userRepo.Create(ctx, user)
	if err != nil {
		if errors.Is(err, repositories.ErrUserExists) {
			return nil, ErrInvalidCredentials // Don't reveal that email exists
		}
		return nil, err
	}

	// Clear password hash from response
	user.PasswordHash = ""
	return user, nil
}

// Login authenticates a user and returns tokens.
func (s *authService) Login(ctx context.Context, email, password string) (*LoginResponse, error) {
	// Get user by email
	user, err := s.userRepo.GetByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, repositories.ErrUserNotFound) {
			return nil, ErrInvalidCredentials
		}
		return nil, err
	}

	// Verify password
	valid, err := utils.VerifyPassword(password, user.PasswordHash)
	if err != nil {
		return nil, err
	}
	if !valid {
		return nil, ErrInvalidCredentials
	}

	// Generate tokens
	accessToken, err := utils.GenerateAccessToken(user.ID, user.Email, s.jwtSecret)
	if err != nil {
		return nil, err
	}

	refreshToken := utils.GenerateRefreshToken()

	// Store refresh token in Redis
	key := "session:" + refreshToken
	value := user.ID.String()
	err = s.redis.Set(ctx, key, value, s.refreshTTL).Err()
	if err != nil {
		return nil, err
	}

	// Clear password hash from response
	user.PasswordHash = ""

	return &LoginResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User:         user,
	}, nil
}

// RefreshToken generates a new access token from a refresh token.
func (s *authService) RefreshToken(ctx context.Context, refreshToken string) (*RefreshResponse, error) {
	// Validate refresh token in Redis
	key := "session:" + refreshToken
	userIDStr, err := s.redis.Get(ctx, key).Result()
	if err != nil {
		if errors.Is(err, redis.Nil) {
			return nil, ErrInvalidRefreshToken
		}
		return nil, err
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return nil, ErrInvalidRefreshToken
	}

	// Get user to get email
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, ErrInvalidRefreshToken
	}

	// Generate new access token
	accessToken, err := utils.GenerateAccessToken(user.ID, user.Email, s.jwtSecret)
	if err != nil {
		return nil, err
	}

	// Rotate refresh token (new token, delete old one)
	newRefreshToken := utils.GenerateRefreshToken()
	newKey := "session:" + newRefreshToken

	pipe := s.redis.Pipeline()
	pipe.Set(ctx, newKey, userIDStr, s.refreshTTL)
	pipe.Del(ctx, key)
	_, err = pipe.Exec(ctx)
	if err != nil {
		return nil, err
	}

	return &RefreshResponse{
		AccessToken:  accessToken,
		RefreshToken: newRefreshToken,
	}, nil
}

// Logout invalidates a refresh token.
func (s *authService) Logout(ctx context.Context, refreshToken string) error {
	key := "session:" + refreshToken
	err := s.redis.Del(ctx, key).Err()
	if err != nil {
		return err
	}
	return nil
}

