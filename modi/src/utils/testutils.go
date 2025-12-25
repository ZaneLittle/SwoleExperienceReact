// Package testutils provides utilities for testing in the Modi application.
package testutils

import (
	"time"

	"github.com/ZaneLittle/modi/src/models"
	"github.com/google/uuid"
)

// NewUser creates a test user with default values
func NewUser() *models.User {
	now := time.Now()
	return &models.User{
		ID:        uuid.New(),
		Email:     "test@example.com",
		CreatedAt: now,
		UpdatedAt: now,
	}
}

// NewUserWithEmail creates a test user with a specific email
func NewUserWithEmail(email string) *models.User {
	user := NewUser()
	user.Email = email
	return user
}

// NewWorkout creates a test workout with default values
func NewWorkout(userID uuid.UUID) *models.Workout {
	now := time.Now()
	return &models.Workout{
		ID:          uuid.New(),
		UserID:      userID,
		Name:        "Test Workout",
		Weight:      floatPtr(100.0),
		Sets:        intPtr(3),
		Reps:        intPtr(10),
		Day:         1,
		DayOrder:    0,
		SyncVersion: 1,
		CreatedAt:   now,
		UpdatedAt:   now,
	}
}

// NewWeight creates a test weight entry with default values
func NewWeight(userID uuid.UUID) *models.Weight {
	now := time.Now()
	return &models.Weight{
		ID:          uuid.New(),
		UserID:      userID,
		Weight:      75.5,
		DateTime:    now,
		SyncVersion: 1,
		CreatedAt:   now,
		UpdatedAt:   now,
	}
}

// NewFood creates a test food with default values
func NewFood() *models.Food {
	now := time.Now()
	return &models.Food{
		ID:        uuid.New(),
		Name:      "Test Food",
		Calories:  200.0,
		Protein:   20.0,
		Carbs:     30.0,
		Fat:       5.0,
		Verified:  false,
		CreatedAt: now,
		UpdatedAt: now,
	}
}

// Helper functions for pointers
func floatPtr(f float64) *float64 {
	return &f
}

func intPtr(i int) *int {
	return &i
}
