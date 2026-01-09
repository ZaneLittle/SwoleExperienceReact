// Package repositories provides data access layer implementations.
package repositories

import (
	"context"
	"errors"
	"time"

	"github.com/ZaneLittle/modi/internal/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	// ErrWorkoutNotFound is returned when a workout is not found.
	ErrWorkoutNotFound = errors.New("workout not found")
)

// WorkoutRepository defines the interface for workout data operations.
type WorkoutRepository interface {
	Create(ctx context.Context, workout *models.Workout) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.Workout, error)
	GetByUserID(ctx context.Context, userID uuid.UUID) ([]*models.Workout, error)
	Update(ctx context.Context, workout *models.Workout) error
	Delete(ctx context.Context, id uuid.UUID) error
}

type workoutRepository struct {
	db *pgxpool.Pool
}

// NewWorkoutRepository creates a new workout repository.
func NewWorkoutRepository(db *pgxpool.Pool) WorkoutRepository {
	return &workoutRepository{db: db}
}

func (r *workoutRepository) Create(ctx context.Context, workout *models.Workout) error {
	query := `
		INSERT INTO workouts (id, user_id, name, weight, sets, reps, notes, day, day_order, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING id, user_id, name, weight, sets, reps, notes, day, day_order, created_at, updated_at, deleted_at
	`

	now := time.Now()
	workout.CreatedAt = now
	workout.UpdatedAt = now

	err := r.db.QueryRow(ctx, query,
		workout.ID,
		workout.UserID,
		workout.Name,
		workout.Weight,
		workout.Sets,
		workout.Reps,
		workout.Notes,
		workout.Day,
		workout.DayOrder,
		workout.CreatedAt,
		workout.UpdatedAt,
	).Scan(
		&workout.ID,
		&workout.UserID,
		&workout.Name,
		&workout.Weight,
		&workout.Sets,
		&workout.Reps,
		&workout.Notes,
		&workout.Day,
		&workout.DayOrder,
		&workout.CreatedAt,
		&workout.UpdatedAt,
		&workout.DeletedAt,
	)

	if err != nil {
		return err
	}

	return nil
}

func (r *workoutRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Workout, error) {
	query := `
		SELECT id, user_id, name, weight, sets, reps, notes, day, day_order, created_at, updated_at, deleted_at
		FROM workouts
		WHERE id = $1 AND deleted_at IS NULL
	`

	workout := &models.Workout{}
	err := r.db.QueryRow(ctx, query, id).Scan(
		&workout.ID,
		&workout.UserID,
		&workout.Name,
		&workout.Weight,
		&workout.Sets,
		&workout.Reps,
		&workout.Notes,
		&workout.Day,
		&workout.DayOrder,
		&workout.CreatedAt,
		&workout.UpdatedAt,
		&workout.DeletedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrWorkoutNotFound
		}
		return nil, err
	}

	return workout, nil
}

func (r *workoutRepository) GetByUserID(ctx context.Context, userID uuid.UUID) ([]*models.Workout, error) {
	query := `
		SELECT id, user_id, name, weight, sets, reps, notes, day, day_order, created_at, updated_at, deleted_at
		FROM workouts
		WHERE user_id = $1 AND deleted_at IS NULL
		ORDER BY day, day_order
	`

	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var workouts []*models.Workout
	for rows.Next() {
		workout := &models.Workout{}
		err := rows.Scan(
			&workout.ID,
			&workout.UserID,
			&workout.Name,
			&workout.Weight,
			&workout.Sets,
			&workout.Reps,
			&workout.Notes,
			&workout.Day,
			&workout.DayOrder,
			&workout.CreatedAt,
			&workout.UpdatedAt,
			&workout.DeletedAt,
		)
		if err != nil {
			return nil, err
		}
		workouts = append(workouts, workout)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return workouts, nil
}

func (r *workoutRepository) Update(ctx context.Context, workout *models.Workout) error {
	query := `
		UPDATE workouts
		SET name = $2, weight = $3, sets = $4, reps = $5, notes = $6, day = $7, day_order = $8, updated_at = $9
		WHERE id = $1 AND deleted_at IS NULL
		RETURNING id, user_id, name, weight, sets, reps, notes, day, day_order, created_at, updated_at, deleted_at
	`

	workout.UpdatedAt = time.Now()
	err := r.db.QueryRow(ctx, query,
		workout.ID,
		workout.Name,
		workout.Weight,
		workout.Sets,
		workout.Reps,
		workout.Notes,
		workout.Day,
		workout.DayOrder,
		workout.UpdatedAt,
	).Scan(
		&workout.ID,
		&workout.UserID,
		&workout.Name,
		&workout.Weight,
		&workout.Sets,
		&workout.Reps,
		&workout.Notes,
		&workout.Day,
		&workout.DayOrder,
		&workout.CreatedAt,
		&workout.UpdatedAt,
		&workout.DeletedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrWorkoutNotFound
		}
		return err
	}

	return nil
}

func (r *workoutRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `
		UPDATE workouts
		SET deleted_at = $2, updated_at = $2
		WHERE id = $1 AND deleted_at IS NULL
		RETURNING id
	`

	now := time.Now()
	var deletedID uuid.UUID
	err := r.db.QueryRow(ctx, query, id, now).Scan(&deletedID)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrWorkoutNotFound
		}
		return err
	}

	return nil
}
