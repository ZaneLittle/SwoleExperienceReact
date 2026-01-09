// Package services provides business logic implementations.
package services

import (
	"context"
	"errors"
	"time"

	"github.com/ZaneLittle/modi/internal/middleware"
	"github.com/ZaneLittle/modi/internal/models"
	"github.com/ZaneLittle/modi/internal/repositories"
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
		refreshTTL: 7 * 24 * time.Hour,
	}
}

func (s *authService) Register(ctx context.Context, email, password string) (*models.User, error) {
	hashedPassword, err := middleware.HashPassword(password)
	if err != nil {
		return nil, err
	}

	user := &models.User{
		ID:           uuid.New(),
		Email:        email,
		PasswordHash: hashedPassword,
	}

	err = s.userRepo.Create(ctx, user)
	if err != nil {
		if errors.Is(err, repositories.ErrUserExists) {
			return nil, ErrInvalidCredentials
		}
		return nil, err
	}

	user.PasswordHash = ""
	return user, nil
}

func (s *authService) Login(ctx context.Context, email, password string) (*LoginResponse, error) {
	user, err := s.userRepo.GetByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, repositories.ErrUserNotFound) {
			return nil, ErrInvalidCredentials
		}
		return nil, err
	}

	valid, err := middleware.VerifyPassword(password, user.PasswordHash)
	if err != nil {
		return nil, err
	}
	if !valid {
		return nil, ErrInvalidCredentials
	}

	accessToken, err := middleware.GenerateAccessToken(user.ID, user.Email, s.jwtSecret)
	if err != nil {
		return nil, err
	}

	refreshToken := middleware.GenerateRefreshToken()

	key := "session:" + refreshToken
	value := user.ID.String()
	err = s.redis.Set(ctx, key, value, s.refreshTTL).Err()
	if err != nil {
		return nil, err
	}

	user.PasswordHash = ""

	return &LoginResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User:         user,
	}, nil
}

func (s *authService) RefreshToken(ctx context.Context, refreshToken string) (*RefreshResponse, error) {
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

	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, ErrInvalidRefreshToken
	}

	accessToken, err := middleware.GenerateAccessToken(user.ID, user.Email, s.jwtSecret)
	if err != nil {
		return nil, err
	}

	newRefreshToken := middleware.GenerateRefreshToken()
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

func (s *authService) Logout(ctx context.Context, refreshToken string) error {
	key := "session:" + refreshToken
	err := s.redis.Del(ctx, key).Err()
	if err != nil {
		return err
	}
	return nil
}
