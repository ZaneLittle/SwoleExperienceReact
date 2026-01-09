// Package models provides domain models for the Modi application.
package models

import (
	"time"

	"github.com/google/uuid"
)

// Workout represents a workout entry for a user.
type Workout struct {
	ID        uuid.UUID  `json:"id"`
	UserID    uuid.UUID  `json:"user_id"`
	Name      string     `json:"name"`
	Weight    *float64   `json:"weight,omitempty"`
	Sets      *int       `json:"sets,omitempty"`
	Reps      *int       `json:"reps,omitempty"`
	Notes     *string    `json:"notes,omitempty"`
	Day       int        `json:"day"`
	DayOrder  int        `json:"day_order"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
	DeletedAt *time.Time `json:"deleted_at,omitempty"`
}
