package models

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID                    uuid.UUID `json:"id"`
	Email                 string    `json:"email"`
	PasswordHash          string    `json:"-"`
	ConsentDate           *time.Time `json:"consent_date,omitempty"`
	PrivacyPolicyVersion  *int       `json:"privacy_policy_version,omitempty"`
	TermsVersion          *int       `json:"terms_version,omitempty"`
	CreatedAt             time.Time `json:"created_at"`
	UpdatedAt             time.Time `json:"updated_at"`
}


