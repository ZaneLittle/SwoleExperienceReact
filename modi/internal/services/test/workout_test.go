package services_test

import (
	"context"
	"errors"
	"testing"

	"github.com/ZaneLittle/modi/internal/models"
	"github.com/ZaneLittle/modi/internal/repositories"
	"github.com/ZaneLittle/modi/internal/services"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type mockWorkoutRepository struct {
	createFn      func(ctx context.Context, workout *models.Workout) error
	getByIDFn     func(ctx context.Context, id uuid.UUID) (*models.Workout, error)
	getByUserIDFn func(ctx context.Context, userID uuid.UUID) ([]*models.Workout, error)
	updateFn      func(ctx context.Context, workout *models.Workout) error
	deleteFn      func(ctx context.Context, id uuid.UUID) error
}

func (m *mockWorkoutRepository) Create(ctx context.Context, workout *models.Workout) error {
	if m.createFn != nil {
		return m.createFn(ctx, workout)
	}
	return nil
}

func (m *mockWorkoutRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Workout, error) {
	if m.getByIDFn != nil {
		return m.getByIDFn(ctx, id)
	}
	return nil, nil
}

func (m *mockWorkoutRepository) GetByUserID(ctx context.Context, userID uuid.UUID) ([]*models.Workout, error) {
	if m.getByUserIDFn != nil {
		return m.getByUserIDFn(ctx, userID)
	}
	return []*models.Workout{}, nil
}

func (m *mockWorkoutRepository) Update(ctx context.Context, workout *models.Workout) error {
	if m.updateFn != nil {
		return m.updateFn(ctx, workout)
	}
	return nil
}

func (m *mockWorkoutRepository) Delete(ctx context.Context, id uuid.UUID) error {
	if m.deleteFn != nil {
		return m.deleteFn(ctx, id)
	}
	return nil
}

func TestWorkoutService_CreateWorkout(t *testing.T) {
	userID := uuid.New()
	workoutID := uuid.New()

	tests := []struct {
		name        string
		userID      uuid.UUID
		workout     *models.Workout
		setupMock   func() *mockWorkoutRepository
		expectErr   bool
		expectedErr error
	}{
		{
			name:   "successful creation",
			userID: userID,
			workout: &models.Workout{
				ID:       workoutID,
				Name:     "Bench Press",
				Weight:   floatPtr(135.0),
				Sets:     intPtr(3),
				Reps:     intPtr(10),
				Day:      1,
				DayOrder: 0,
			},
			setupMock: func() *mockWorkoutRepository {
				return &mockWorkoutRepository{
					createFn: func(_ context.Context, w *models.Workout) error {
						// Verify user ID is set
						if w.UserID != userID {
							return errors.New("user ID not set correctly")
						}
						return nil
					},
				}
			},
			expectErr: false,
		},
		{
			name:   "generates ID if not provided",
			userID: userID,
			workout: &models.Workout{
				ID:       uuid.Nil,
				Name:     "Squats",
				Day:      1,
				DayOrder: 0,
			},
			setupMock: func() *mockWorkoutRepository {
				return &mockWorkoutRepository{
					createFn: func(_ context.Context, w *models.Workout) error {
						if w.ID == uuid.Nil {
							return errors.New("ID should be generated")
						}
						if w.UserID != userID {
							return errors.New("user ID not set correctly")
						}
						return nil
					},
				}
			},
			expectErr: false,
		},
		{
			name:   "repository error",
			userID: userID,
			workout: &models.Workout{
				ID:       workoutID,
				Name:     "Deadlift",
				Day:      1,
				DayOrder: 0,
			},
			setupMock: func() *mockWorkoutRepository {
				return &mockWorkoutRepository{
					createFn: func(_ context.Context, _ *models.Workout) error {
						return errors.New("database error")
					},
				}
			},
			expectErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockRepo := tt.setupMock()
			service := services.NewWorkoutService(mockRepo)

			result, err := service.CreateWorkout(context.Background(), tt.userID, tt.workout)

			if tt.expectErr {
				assert.Error(t, err)
			} else {
				require.NoError(t, err)
				assert.NotNil(t, result)
				assert.Equal(t, tt.userID, result.UserID)
				if tt.workout.ID == uuid.Nil {
					assert.NotEqual(t, uuid.Nil, result.ID)
				} else {
					assert.Equal(t, tt.workout.ID, result.ID)
				}
			}
		})
	}
}

func TestWorkoutService_GetWorkout(t *testing.T) {
	userID := uuid.New()
	otherUserID := uuid.New()
	workoutID := uuid.New()

	tests := []struct {
		name        string
		userID      uuid.UUID
		workoutID   uuid.UUID
		setupMock   func() *mockWorkoutRepository
		expectErr   bool
		expectedErr error
	}{
		{
			name:      "successful retrieval",
			userID:    userID,
			workoutID: workoutID,
			setupMock: func() *mockWorkoutRepository {
				return &mockWorkoutRepository{
					getByIDFn: func(_ context.Context, id uuid.UUID) (*models.Workout, error) {
						if id != workoutID {
							return nil, errors.New("unexpected ID")
						}
						return &models.Workout{
							ID:     workoutID,
							UserID: userID,
							Name:   "Bench Press",
						}, nil
					},
				}
			},
			expectErr: false,
		},
		{
			name:      "workout not found",
			userID:    userID,
			workoutID: workoutID,
			setupMock: func() *mockWorkoutRepository {
				return &mockWorkoutRepository{
					getByIDFn: func(_ context.Context, _ uuid.UUID) (*models.Workout, error) {
						return nil, repositories.ErrWorkoutNotFound
					},
				}
			},
			expectErr:   true,
			expectedErr: services.ErrWorkoutNotFound,
		},
		{
			name:      "unauthorized access - different user",
			userID:    userID,
			workoutID: workoutID,
			setupMock: func() *mockWorkoutRepository {
				return &mockWorkoutRepository{
					getByIDFn: func(_ context.Context, _ uuid.UUID) (*models.Workout, error) {
						return &models.Workout{
							ID:     workoutID,
							UserID: otherUserID,
							Name:   "Bench Press",
						}, nil
					},
				}
			},
			expectErr:   true,
			expectedErr: services.ErrUnauthorizedWorkoutAccess,
		},
		{
			name:      "repository error",
			userID:    userID,
			workoutID: workoutID,
			setupMock: func() *mockWorkoutRepository {
				return &mockWorkoutRepository{
					getByIDFn: func(_ context.Context, _ uuid.UUID) (*models.Workout, error) {
						return nil, errors.New("database error")
					},
				}
			},
			expectErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockRepo := tt.setupMock()
			service := services.NewWorkoutService(mockRepo)

			result, err := service.GetWorkout(context.Background(), tt.userID, tt.workoutID)

			if tt.expectErr {
				assert.Error(t, err)
				if tt.expectedErr != nil {
					assert.ErrorIs(t, err, tt.expectedErr)
				}
				assert.Nil(t, result)
			} else {
				require.NoError(t, err)
				assert.NotNil(t, result)
				assert.Equal(t, tt.workoutID, result.ID)
				assert.Equal(t, tt.userID, result.UserID)
			}
		})
	}
}

func TestWorkoutService_GetWorkouts(t *testing.T) {
	userID := uuid.New()

	tests := []struct {
		name      string
		userID    uuid.UUID
		setupMock func() *mockWorkoutRepository
		expectErr bool
	}{
		{
			name:   "successful retrieval",
			userID: userID,
			setupMock: func() *mockWorkoutRepository {
				return &mockWorkoutRepository{
					getByUserIDFn: func(_ context.Context, uid uuid.UUID) ([]*models.Workout, error) {
						if uid != userID {
							return nil, errors.New("unexpected user ID")
						}
						return []*models.Workout{
							{ID: uuid.New(), UserID: userID, Name: "Workout 1"},
							{ID: uuid.New(), UserID: userID, Name: "Workout 2"},
						}, nil
					},
				}
			},
			expectErr: false,
		},
		{
			name:   "empty list",
			userID: userID,
			setupMock: func() *mockWorkoutRepository {
				return &mockWorkoutRepository{
					getByUserIDFn: func(_ context.Context, _ uuid.UUID) ([]*models.Workout, error) {
						return []*models.Workout{}, nil
					},
				}
			},
			expectErr: false,
		},
		{
			name:   "repository error",
			userID: userID,
			setupMock: func() *mockWorkoutRepository {
				return &mockWorkoutRepository{
					getByUserIDFn: func(_ context.Context, _ uuid.UUID) ([]*models.Workout, error) {
						return nil, errors.New("database error")
					},
				}
			},
			expectErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockRepo := tt.setupMock()
			service := services.NewWorkoutService(mockRepo)

			result, err := service.GetWorkouts(context.Background(), tt.userID)

			if tt.expectErr {
				assert.Error(t, err)
				assert.Nil(t, result)
			} else {
				require.NoError(t, err)
				assert.NotNil(t, result)
			}
		})
	}
}

func TestWorkoutService_UpdateWorkout(t *testing.T) {
	userID := uuid.New()
	otherUserID := uuid.New()
	workoutID := uuid.New()

	tests := []struct {
		name        string
		userID      uuid.UUID
		workout     *models.Workout
		setupMock   func() *mockWorkoutRepository
		expectErr   bool
		expectedErr error
	}{
		{
			name:   "successful update",
			userID: userID,
			workout: &models.Workout{
				ID:     workoutID,
				UserID: userID,
				Name:   "Updated Bench Press",
			},
			setupMock: func() *mockWorkoutRepository {
				return &mockWorkoutRepository{
					getByIDFn: func(_ context.Context, id uuid.UUID) (*models.Workout, error) {
						if id != workoutID {
							return nil, errors.New("unexpected ID")
						}
						return &models.Workout{
							ID:     workoutID,
							UserID: userID,
							Name:   "Original Name",
						}, nil
					},
					updateFn: func(_ context.Context, w *models.Workout) error {
						if w.ID != workoutID {
							return errors.New("unexpected ID")
						}
						if w.UserID != userID {
							return errors.New("user ID not set correctly")
						}
						return nil
					},
				}
			},
			expectErr: false,
		},
		{
			name:   "workout not found",
			userID: userID,
			workout: &models.Workout{
				ID:     workoutID,
				UserID: userID,
				Name:   "Updated Name",
			},
			setupMock: func() *mockWorkoutRepository {
				return &mockWorkoutRepository{
					getByIDFn: func(_ context.Context, _ uuid.UUID) (*models.Workout, error) {
						return nil, repositories.ErrWorkoutNotFound
					},
				}
			},
			expectErr:   true,
			expectedErr: services.ErrWorkoutNotFound,
		},
		{
			name:   "unauthorized access - different user",
			userID: userID,
			workout: &models.Workout{
				ID:     workoutID,
				UserID: userID,
				Name:   "Updated Name",
			},
			setupMock: func() *mockWorkoutRepository {
				return &mockWorkoutRepository{
					getByIDFn: func(_ context.Context, _ uuid.UUID) (*models.Workout, error) {
						return &models.Workout{
							ID:     workoutID,
							UserID: otherUserID,
							Name:   "Original Name",
						}, nil
					},
				}
			},
			expectErr:   true,
			expectedErr: services.ErrUnauthorizedWorkoutAccess,
		},
		{
			name:   "update repository error",
			userID: userID,
			workout: &models.Workout{
				ID:     workoutID,
				UserID: userID,
				Name:   "Updated Name",
			},
			setupMock: func() *mockWorkoutRepository {
				return &mockWorkoutRepository{
					getByIDFn: func(_ context.Context, _ uuid.UUID) (*models.Workout, error) {
						return &models.Workout{
							ID:     workoutID,
							UserID: userID,
							Name:   "Original Name",
						}, nil
					},
					updateFn: func(_ context.Context, _ *models.Workout) error {
						return errors.New("database error")
					},
				}
			},
			expectErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockRepo := tt.setupMock()
			service := services.NewWorkoutService(mockRepo)

			result, err := service.UpdateWorkout(context.Background(), tt.userID, tt.workout)

			if tt.expectErr {
				assert.Error(t, err)
				if tt.expectedErr != nil {
					assert.ErrorIs(t, err, tt.expectedErr)
				}
				assert.Nil(t, result)
			} else {
				require.NoError(t, err)
				assert.NotNil(t, result)
				assert.Equal(t, tt.workout.ID, result.ID)
				assert.Equal(t, tt.userID, result.UserID)
			}
		})
	}
}

func TestWorkoutService_DeleteWorkout(t *testing.T) {
	userID := uuid.New()
	otherUserID := uuid.New()
	workoutID := uuid.New()

	tests := []struct {
		name        string
		userID      uuid.UUID
		workoutID   uuid.UUID
		setupMock   func() *mockWorkoutRepository
		expectErr   bool
		expectedErr error
	}{
		{
			name:      "successful deletion",
			userID:    userID,
			workoutID: workoutID,
			setupMock: func() *mockWorkoutRepository {
				return &mockWorkoutRepository{
					getByIDFn: func(_ context.Context, id uuid.UUID) (*models.Workout, error) {
						if id != workoutID {
							return nil, errors.New("unexpected ID")
						}
						return &models.Workout{
							ID:     workoutID,
							UserID: userID,
							Name:   "Bench Press",
						}, nil
					},
					deleteFn: func(_ context.Context, id uuid.UUID) error {
						if id != workoutID {
							return errors.New("unexpected ID")
						}
						return nil
					},
				}
			},
			expectErr: false,
		},
		{
			name:      "workout not found",
			userID:    userID,
			workoutID: workoutID,
			setupMock: func() *mockWorkoutRepository {
				return &mockWorkoutRepository{
					getByIDFn: func(_ context.Context, _ uuid.UUID) (*models.Workout, error) {
						return nil, repositories.ErrWorkoutNotFound
					},
				}
			},
			expectErr:   true,
			expectedErr: services.ErrWorkoutNotFound,
		},
		{
			name:      "unauthorized access - different user",
			userID:    userID,
			workoutID: workoutID,
			setupMock: func() *mockWorkoutRepository {
				return &mockWorkoutRepository{
					getByIDFn: func(_ context.Context, _ uuid.UUID) (*models.Workout, error) {
						return &models.Workout{
							ID:     workoutID,
							UserID: otherUserID,
							Name:   "Bench Press",
						}, nil
					},
				}
			},
			expectErr:   true,
			expectedErr: services.ErrUnauthorizedWorkoutAccess,
		},
		{
			name:      "delete repository error",
			userID:    userID,
			workoutID: workoutID,
			setupMock: func() *mockWorkoutRepository {
				return &mockWorkoutRepository{
					getByIDFn: func(_ context.Context, _ uuid.UUID) (*models.Workout, error) {
						return &models.Workout{
							ID:     workoutID,
							UserID: userID,
							Name:   "Bench Press",
						}, nil
					},
					deleteFn: func(_ context.Context, _ uuid.UUID) error {
						return errors.New("database error")
					},
				}
			},
			expectErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockRepo := tt.setupMock()
			service := services.NewWorkoutService(mockRepo)

			err := service.DeleteWorkout(context.Background(), tt.userID, tt.workoutID)

			if tt.expectErr {
				assert.Error(t, err)
				if tt.expectedErr != nil {
					assert.ErrorIs(t, err, tt.expectedErr)
				}
			} else {
				require.NoError(t, err)
			}
		})
	}
}

// Helper functions
func floatPtr(f float64) *float64 {
	return &f
}

func intPtr(i int) *int {
	return &i
}
