// Package services provides business logic implementations.
package services

import (
	"context"
	"errors"

	"github.com/ZaneLittle/modi/internal/models"
	"github.com/ZaneLittle/modi/internal/repositories"
	"github.com/google/uuid"
)

var (
	// ErrWorkoutNotFound is returned when a workout is not found.
	ErrWorkoutNotFound = errors.New("workout not found")
	// ErrUnauthorizedWorkoutAccess is returned when a user tries to access another user's workout.
	ErrUnauthorizedWorkoutAccess = errors.New("unauthorized workout access")
)

// WorkoutService defines the interface for workout operations.
type WorkoutService interface {
	CreateWorkout(ctx context.Context, userID uuid.UUID, workout *models.Workout) (*models.Workout, error)
	GetWorkout(ctx context.Context, userID uuid.UUID, workoutID uuid.UUID) (*models.Workout, error)
	GetWorkouts(ctx context.Context, userID uuid.UUID) ([]*models.Workout, error)
	UpdateWorkout(ctx context.Context, userID uuid.UUID, workout *models.Workout) (*models.Workout, error)
	DeleteWorkout(ctx context.Context, userID uuid.UUID, workoutID uuid.UUID) error
}

type workoutService struct {
	workoutRepo repositories.WorkoutRepository
}

// NewWorkoutService creates a new workout service.
func NewWorkoutService(workoutRepo repositories.WorkoutRepository) WorkoutService {
	return &workoutService{
		workoutRepo: workoutRepo,
	}
}

func (s *workoutService) CreateWorkout(ctx context.Context, userID uuid.UUID, workout *models.Workout) (*models.Workout, error) {
	// Set user ID to ensure workout belongs to the authenticated user
	workout.UserID = userID

	// Generate ID if not provided
	if workout.ID == uuid.Nil {
		workout.ID = uuid.New()
	}

	err := s.workoutRepo.Create(ctx, workout)
	if err != nil {
		return nil, err
	}

	return workout, nil
}

func (s *workoutService) GetWorkout(ctx context.Context, userID uuid.UUID, workoutID uuid.UUID) (*models.Workout, error) {
	workout, err := s.workoutRepo.GetByID(ctx, workoutID)
	if err != nil {
		if err == repositories.ErrWorkoutNotFound {
			return nil, ErrWorkoutNotFound
		}
		return nil, err
	}

	// Verify workout belongs to the user
	if workout.UserID != userID {
		return nil, ErrUnauthorizedWorkoutAccess
	}

	return workout, nil
}

func (s *workoutService) GetWorkouts(ctx context.Context, userID uuid.UUID) ([]*models.Workout, error) {
	workouts, err := s.workoutRepo.GetByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	return workouts, nil
}

func (s *workoutService) UpdateWorkout(ctx context.Context, userID uuid.UUID, workout *models.Workout) (*models.Workout, error) {
	// Verify workout exists and belongs to user
	existing, err := s.workoutRepo.GetByID(ctx, workout.ID)
	if err != nil {
		if err == repositories.ErrWorkoutNotFound {
			return nil, ErrWorkoutNotFound
		}
		return nil, err
	}

	if existing.UserID != userID {
		return nil, ErrUnauthorizedWorkoutAccess
	}

	// Ensure user ID is set correctly
	workout.UserID = userID

	err = s.workoutRepo.Update(ctx, workout)
	if err != nil {
		if err == repositories.ErrWorkoutNotFound {
			return nil, ErrWorkoutNotFound
		}
		return nil, err
	}

	return workout, nil
}

func (s *workoutService) DeleteWorkout(ctx context.Context, userID uuid.UUID, workoutID uuid.UUID) error {
	// Verify workout exists and belongs to user
	workout, err := s.workoutRepo.GetByID(ctx, workoutID)
	if err != nil {
		if err == repositories.ErrWorkoutNotFound {
			return ErrWorkoutNotFound
		}
		return err
	}

	if workout.UserID != userID {
		return ErrUnauthorizedWorkoutAccess
	}

	err = s.workoutRepo.Delete(ctx, workoutID)
	if err != nil {
		if err == repositories.ErrWorkoutNotFound {
			return ErrWorkoutNotFound
		}
		return err
	}

	return nil
}
