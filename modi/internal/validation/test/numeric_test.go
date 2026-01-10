package validation_test

import (
	"testing"

	"github.com/ZaneLittle/modi/internal/validation"
	"github.com/stretchr/testify/assert"
)

func TestValidateNumeric(t *testing.T) {
	tests := []struct {
		name        string
		value       float64
		fieldName   string
		constraints validation.NumericConstraints
		expectedErr error
	}{
		{
			name:      "valid value in range",
			value:     50.5,
			fieldName: "weight",
			constraints: validation.NumericConstraints{
				Min: 0.0,
				Max: 1000.0,
			},
			expectedErr: nil,
		},
		{
			name:      "value at minimum boundary",
			value:     0.0,
			fieldName: "weight",
			constraints: validation.NumericConstraints{
				Min: 0.0,
				Max: 1000.0,
			},
			expectedErr: nil,
		},
		{
			name:      "value at maximum boundary",
			value:     1000.0,
			fieldName: "weight",
			constraints: validation.NumericConstraints{
				Min: 0.0,
				Max: 1000.0,
			},
			expectedErr: nil,
		},
		{
			name:      "value below minimum",
			value:     -1.0,
			fieldName: "weight",
			constraints: validation.NumericConstraints{
				Min: 0.0,
				Max: 1000.0,
			},
			expectedErr: validation.ErrValueOutOfRange,
		},
		{
			name:      "value above maximum",
			value:     1001.0,
			fieldName: "weight",
			constraints: validation.NumericConstraints{
				Min: 0.0,
				Max: 1000.0,
			},
			expectedErr: validation.ErrValueOutOfRange,
		},
		{
			name:      "negative range",
			value:     -5.0,
			fieldName: "temperature",
			constraints: validation.NumericConstraints{
				Min: -10.0,
				Max: 50.0,
			},
			expectedErr: nil,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validation.ValidateNumeric(tt.value, tt.fieldName, tt.constraints)
			if tt.expectedErr != nil {
				assert.Error(t, err)
				assert.ErrorIs(t, err, tt.expectedErr)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestValidateOptionalNumeric(t *testing.T) {
	tests := []struct {
		name        string
		value       *float64
		fieldName   string
		constraints validation.NumericConstraints
		expectedErr error
	}{
		{
			name:      "nil value allowed",
			value:     nil,
			fieldName: "weight",
			constraints: validation.NumericConstraints{
				Min: 0.0,
				Max: 1000.0,
			},
			expectedErr: nil,
		},
		{
			name:      "valid optional value",
			value:     floatPtr(50.5),
			fieldName: "weight",
			constraints: validation.NumericConstraints{
				Min: 0.0,
				Max: 1000.0,
			},
			expectedErr: nil,
		},
		{
			name:      "optional value out of range",
			value:     floatPtr(1001.0),
			fieldName: "weight",
			constraints: validation.NumericConstraints{
				Min: 0.0,
				Max: 1000.0,
			},
			expectedErr: validation.ErrValueOutOfRange,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validation.ValidateOptionalNumeric(tt.value, tt.fieldName, tt.constraints)
			if tt.expectedErr != nil {
				assert.Error(t, err)
				assert.ErrorIs(t, err, tt.expectedErr)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestValidateInt(t *testing.T) {
	tests := []struct {
		name        string
		value       int
		fieldName   string
		constraints validation.NumericConstraints
		expectedErr error
	}{
		{
			name:      "valid integer in range",
			value:     10,
			fieldName: "sets",
			constraints: validation.NumericConstraints{
				Min: 1.0,
				Max: 100.0,
			},
			expectedErr: nil,
		},
		{
			name:      "integer below minimum",
			value:     0,
			fieldName: "sets",
			constraints: validation.NumericConstraints{
				Min: 1.0,
				Max: 100.0,
			},
			expectedErr: validation.ErrValueOutOfRange,
		},
		{
			name:      "integer above maximum",
			value:     101,
			fieldName: "sets",
			constraints: validation.NumericConstraints{
				Min: 1.0,
				Max: 100.0,
			},
			expectedErr: validation.ErrValueOutOfRange,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validation.ValidateInt(tt.value, tt.fieldName, tt.constraints)
			if tt.expectedErr != nil {
				assert.Error(t, err)
				assert.ErrorIs(t, err, tt.expectedErr)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestValidateOptionalInt(t *testing.T) {
	tests := []struct {
		name        string
		value       *int
		fieldName   string
		constraints validation.NumericConstraints
		expectedErr error
	}{
		{
			name:      "nil value allowed",
			value:     nil,
			fieldName: "sets",
			constraints: validation.NumericConstraints{
				Min: 1.0,
				Max: 100.0,
			},
			expectedErr: nil,
		},
		{
			name:      "valid optional integer",
			value:     intPtr(10),
			fieldName: "sets",
			constraints: validation.NumericConstraints{
				Min: 1.0,
				Max: 100.0,
			},
			expectedErr: nil,
		},
		{
			name:      "optional integer out of range",
			value:     intPtr(101),
			fieldName: "sets",
			constraints: validation.NumericConstraints{
				Min: 1.0,
				Max: 100.0,
			},
			expectedErr: validation.ErrValueOutOfRange,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validation.ValidateOptionalInt(tt.value, tt.fieldName, tt.constraints)
			if tt.expectedErr != nil {
				assert.Error(t, err)
				assert.ErrorIs(t, err, tt.expectedErr)
			} else {
				assert.NoError(t, err)
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
