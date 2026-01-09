// Package validation provides reusable input validation utilities.
package validation

import (
	"errors"
	"fmt"
)

var (
	// ErrValueOutOfRange is returned when a numeric value is out of valid range.
	ErrValueOutOfRange = errors.New("value is out of valid range")
)

// NumericConstraints defines validation constraints for numeric fields.
type NumericConstraints struct {
	Min float64
	Max float64
}

// ValidateNumeric validates a numeric value (int or float64) with the given constraints.
// This is a reusable function that can be used for any numeric field (weight, sets, reps, quantity, etc.).
func ValidateNumeric(value float64, fieldName string, constraints NumericConstraints) error {
	if value < constraints.Min || value > constraints.Max {
		return fmt.Errorf("%s: %w: must be between %.2f and %.2f", fieldName, ErrValueOutOfRange, constraints.Min, constraints.Max)
	}
	return nil
}

// ValidateOptionalNumeric validates an optional numeric value.
func ValidateOptionalNumeric(value *float64, fieldName string, constraints NumericConstraints) error {
	if value == nil {
		return nil // Optional field
	}
	return ValidateNumeric(*value, fieldName, constraints)
}

// ValidateOptionalInt validates an optional integer value.
func ValidateOptionalInt(value *int, fieldName string, constraints NumericConstraints) error {
	if value == nil {
		return nil // Optional field
	}
	return ValidateNumeric(float64(*value), fieldName, constraints)
}

// ValidateInt validates an integer value with the given constraints.
func ValidateInt(value int, fieldName string, constraints NumericConstraints) error {
	return ValidateNumeric(float64(value), fieldName, constraints)
}
