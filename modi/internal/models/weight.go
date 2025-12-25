// Package models provides domain models for the Modi application.
package models

import (
	"time"

	"github.com/google/uuid"
)

// Weight represents a weight entry for a user.
type Weight struct {
	ID           uuid.UUID  `json:"id"`
	UserID       uuid.UUID  `json:"user_id"`
	Weight       float64    `json:"weight"`
	DateTime     time.Time  `json:"date_time"`
	SyncVersion  int        `json:"sync_version"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
	DeletedAt    *time.Time `json:"deleted_at,omitempty"`
	LastSyncedAt *time.Time `json:"last_synced_at,omitempty"`
}
