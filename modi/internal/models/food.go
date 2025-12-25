// Package models provides domain models for the Modi application.
package models

import (
	"time"

	"github.com/google/uuid"
)

// Food represents a food item with nutritional information.
type Food struct {
	ID              uuid.UUID  `json:"id"`
	Name            string     `json:"name"`
	Brand           *string    `json:"brand,omitempty"`
	Barcode         *string    `json:"barcode,omitempty"`
	Calories        float64    `json:"calories"`
	Protein         float64    `json:"protein"`
	Carbs           float64    `json:"carbs"`
	Fat             float64    `json:"fat"`
	CreatedByUserID *uuid.UUID `json:"created_by_user_id,omitempty"`
	Verified        bool       `json:"verified"`
	VerifiedAt      *time.Time `json:"verified_at,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}
