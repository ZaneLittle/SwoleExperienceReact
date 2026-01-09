// Package validation provides reusable input validation utilities.
package validation

import (
	"errors"
	"fmt"
	"strings"
	"unicode/utf8"
)

var (
	// ErrStringTooLong is returned when a string exceeds maximum length.
	ErrStringTooLong = errors.New("string exceeds maximum length")
	// ErrStringEmpty is returned when a string is empty or only whitespace.
	ErrStringEmpty = errors.New("string cannot be empty")
	// ErrInvalidCharacters is returned when input contains potentially dangerous characters.
	ErrInvalidCharacters = errors.New("input contains invalid characters")
)

// StringConstraints defines validation constraints for string fields.
type StringConstraints struct {
	MaxLength      int
	MinLength      int
	AllowEmpty     bool
	TrimWhitespace bool
	CheckXSS       bool
}

// DefaultStringConstraints returns default string validation constraints.
func DefaultStringConstraints() StringConstraints {
	return StringConstraints{
		MaxLength:      255,
		MinLength:      1,
		AllowEmpty:     false,
		TrimWhitespace: true,
		CheckXSS:       true,
	}
}

// ValidateString validates a string field with the given constraints.
// This is a reusable function that can be used for any string field (name, notes, description, etc.).
func ValidateString(value string, fieldName string, constraints StringConstraints) error {
	var trimmed string
	if constraints.TrimWhitespace {
		trimmed = strings.TrimSpace(value)
	} else {
		trimmed = value
	}

	// Check if empty
	if trimmed == "" {
		if constraints.AllowEmpty {
			return nil
		}
		return fmt.Errorf("%s: %w", fieldName, ErrStringEmpty)
	}

	// Check minimum length
	if utf8.RuneCountInString(trimmed) < constraints.MinLength {
		return fmt.Errorf("%s: minimum length is %d characters", fieldName, constraints.MinLength)
	}

	// Check maximum length
	if utf8.RuneCountInString(trimmed) > constraints.MaxLength {
		return fmt.Errorf("%s: %w: maximum %d characters", fieldName, ErrStringTooLong, constraints.MaxLength)
	}

	// Check for XSS patterns if enabled
	if constraints.CheckXSS && ContainsDangerousCharacters(trimmed) {
		return fmt.Errorf("%s: %w", fieldName, ErrInvalidCharacters)
	}

	return nil
}

// ValidateOptionalString validates an optional string field.
func ValidateOptionalString(value *string, fieldName string, constraints StringConstraints) error {
	if value == nil {
		return nil // Optional field
	}

	// For optional fields, allow empty
	constraints.AllowEmpty = true
	return ValidateString(*value, fieldName, constraints)
}

// ContainsDangerousCharacters checks for potentially dangerous characters that could be used in XSS attacks.
// This is a reusable function that can be used across all text field validations.
// Note: JSON encoding in handlers provides additional protection.
func ContainsDangerousCharacters(s string) bool {
	// Check for script tags and common XSS patterns
	dangerous := []string{
		"<script",
		"</script>",
		"javascript:",
		"onerror=",
		"onload=",
		"onclick=",
		"<iframe",
		"<object",
		"<embed",
		"<img",
		"onmouseover=",
		"onfocus=",
		"onblur=",
	}

	lower := strings.ToLower(s)
	for _, pattern := range dangerous {
		if strings.Contains(lower, pattern) {
			return true
		}
	}

	return false
}
