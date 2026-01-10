package validation_test

import (
	"testing"

	"github.com/ZaneLittle/modi/internal/validation"
	"github.com/stretchr/testify/assert"
)

func TestValidateWorkoutRequest(t *testing.T) {
	tests := []struct {
		name      string
		nameVal   string
		weight    *float64
		sets      *int
		reps      *int
		notes     *string
		day       int
		dayOrder  int
		expectErr bool
	}{
		{
			name:      "valid workout request",
			nameVal:   "Bench Press",
			weight:    floatPtr(135.0),
			sets:      intPtr(3),
			reps:      intPtr(10),
			notes:     stringPtr("Good form"),
			day:       1,
			dayOrder:  0,
			expectErr: false,
		},
		{
			name:      "valid workout with optional fields nil",
			nameVal:   "Squats",
			weight:    nil,
			sets:      nil,
			reps:      nil,
			notes:     nil,
			day:       1,
			dayOrder:  0,
			expectErr: false,
		},
		{
			name:      "empty name",
			nameVal:   "",
			weight:    floatPtr(135.0),
			sets:      intPtr(3),
			reps:      intPtr(10),
			notes:     nil,
			day:       1,
			dayOrder:  0,
			expectErr: true,
		},
		{
			name:      "name too long",
			nameVal:   stringWithLength(256),
			weight:    floatPtr(135.0),
			sets:      intPtr(3),
			reps:      intPtr(10),
			notes:     nil,
			day:       1,
			dayOrder:  0,
			expectErr: true,
		},
		{
			name:      "weight out of range",
			nameVal:   "Bench Press",
			weight:    floatPtr(10001.0),
			sets:      intPtr(3),
			reps:      intPtr(10),
			notes:     nil,
			day:       1,
			dayOrder:  0,
			expectErr: true,
		},
		{
			name:      "sets out of range",
			nameVal:   "Bench Press",
			weight:    floatPtr(135.0),
			sets:      intPtr(101),
			reps:      intPtr(10),
			notes:     nil,
			day:       1,
			dayOrder:  0,
			expectErr: true,
		},
		{
			name:      "reps out of range",
			nameVal:   "Bench Press",
			weight:    floatPtr(135.0),
			sets:      intPtr(3),
			reps:      intPtr(1001),
			notes:     nil,
			day:       1,
			dayOrder:  0,
			expectErr: true,
		},
		{
			name:      "day out of range",
			nameVal:   "Bench Press",
			weight:    floatPtr(135.0),
			sets:      intPtr(3),
			reps:      intPtr(10),
			notes:     nil,
			day:       366,
			dayOrder:  0,
			expectErr: true,
		},
		{
			name:      "day_order out of range",
			nameVal:   "Bench Press",
			weight:    floatPtr(135.0),
			sets:      intPtr(3),
			reps:      intPtr(10),
			notes:     nil,
			day:       1,
			dayOrder:  1001,
			expectErr: true,
		},
		{
			name:      "notes with XSS",
			nameVal:   "Bench Press",
			weight:    floatPtr(135.0),
			sets:      intPtr(3),
			reps:      intPtr(10),
			notes:     stringPtr("Notes<script>alert('xss')</script>"),
			day:       1,
			dayOrder:  0,
			expectErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validation.ValidateWorkoutRequest(tt.nameVal, tt.weight, tt.sets, tt.reps, tt.notes, tt.day, tt.dayOrder)
			if tt.expectErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func stringWithLength(n int) string {
	result := make([]byte, n)
	for i := range result {
		result[i] = 'a'
	}
	return string(result)
}
