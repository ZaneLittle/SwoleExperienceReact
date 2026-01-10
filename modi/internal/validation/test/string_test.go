package validation_test

import (
	"testing"

	"github.com/ZaneLittle/modi/internal/validation"
	"github.com/stretchr/testify/assert"
)

func TestValidateString(t *testing.T) {
	tests := []struct {
		name        string
		value       string
		fieldName   string
		constraints validation.StringConstraints
		expectedErr error
	}{
		{
			name:      "valid string",
			value:     "Test Name",
			fieldName: "name",
			constraints: validation.StringConstraints{
				MaxLength:      255,
				MinLength:      1,
				AllowEmpty:     false,
				TrimWhitespace: true,
				CheckXSS:       true,
			},
			expectedErr: nil,
		},
		{
			name:      "empty string not allowed",
			value:     "",
			fieldName: "name",
			constraints: validation.StringConstraints{
				MaxLength:      255,
				MinLength:      1,
				AllowEmpty:     false,
				TrimWhitespace: true,
				CheckXSS:       true,
			},
			expectedErr: validation.ErrStringEmpty,
		},
		{
			name:      "whitespace only not allowed",
			value:     "   ",
			fieldName: "name",
			constraints: validation.StringConstraints{
				MaxLength:      255,
				MinLength:      1,
				AllowEmpty:     false,
				TrimWhitespace: true,
				CheckXSS:       true,
			},
			expectedErr: validation.ErrStringEmpty,
		},
		{
			name:      "empty string allowed",
			value:     "",
			fieldName: "name",
			constraints: validation.StringConstraints{
				MaxLength:      255,
				MinLength:      0,
				AllowEmpty:     true,
				TrimWhitespace: true,
				CheckXSS:       true,
			},
			expectedErr: nil,
		},
		{
			name:      "string too long",
			value:     "abcdef",
			fieldName: "name",
			constraints: validation.StringConstraints{
				MaxLength:      5,
				MinLength:      1,
				AllowEmpty:     false,
				TrimWhitespace: true,
				CheckXSS:       false,
			},
			expectedErr: validation.ErrStringTooLong,
		},
		{
			name:      "string too short",
			value:     "ab",
			fieldName: "name",
			constraints: validation.StringConstraints{
				MaxLength:      255,
				MinLength:      5,
				AllowEmpty:     false,
				TrimWhitespace: true,
				CheckXSS:       false,
			},
			expectedErr: nil, // Will return error about minimum length (not a specific error type)
		},
		{
			name:      "contains XSS script tag",
			value:     "Test<script>alert('xss')</script>",
			fieldName: "name",
			constraints: validation.StringConstraints{
				MaxLength:      255,
				MinLength:      1,
				AllowEmpty:     false,
				TrimWhitespace: true,
				CheckXSS:       true,
			},
			expectedErr: validation.ErrInvalidCharacters,
		},
		{
			name:      "contains javascript protocol",
			value:     "javascript:alert('xss')",
			fieldName: "name",
			constraints: validation.StringConstraints{
				MaxLength:      255,
				MinLength:      1,
				AllowEmpty:     false,
				TrimWhitespace: true,
				CheckXSS:       true,
			},
			expectedErr: validation.ErrInvalidCharacters,
		},
		{
			name:      "contains event handler",
			value:     "Test onclick='alert(1)'",
			fieldName: "name",
			constraints: validation.StringConstraints{
				MaxLength:      255,
				MinLength:      1,
				AllowEmpty:     false,
				TrimWhitespace: true,
				CheckXSS:       true,
			},
			expectedErr: validation.ErrInvalidCharacters,
		},
		{
			name:      "XSS check disabled",
			value:     "Test<script>alert('xss')</script>",
			fieldName: "name",
			constraints: validation.StringConstraints{
				MaxLength:      255,
				MinLength:      1,
				AllowEmpty:     false,
				TrimWhitespace: true,
				CheckXSS:       false,
			},
			expectedErr: nil,
		},
		{
			name:      "unicode characters counted correctly",
			value:     "测试",
			fieldName: "name",
			constraints: validation.StringConstraints{
				MaxLength:      255,
				MinLength:      1,
				AllowEmpty:     false,
				TrimWhitespace: true,
				CheckXSS:       true,
			},
			expectedErr: nil,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validation.ValidateString(tt.value, tt.fieldName, tt.constraints)
			if tt.expectedErr != nil {
				assert.Error(t, err)
				assert.ErrorIs(t, err, tt.expectedErr)
			} else {
				// For cases where we expect specific error messages (not just error type)
				if tt.name == "string too short" {
					assert.Error(t, err)
					assert.Contains(t, err.Error(), "minimum length")
				} else {
					assert.NoError(t, err)
				}
			}
		})
	}
}

func TestValidateOptionalString(t *testing.T) {
	tests := []struct {
		name        string
		value       *string
		fieldName   string
		constraints validation.StringConstraints
		expectedErr error
	}{
		{
			name:      "nil value allowed",
			value:     nil,
			fieldName: "notes",
			constraints: validation.StringConstraints{
				MaxLength:      1000,
				MinLength:      0,
				AllowEmpty:     false,
				TrimWhitespace: true,
				CheckXSS:       true,
			},
			expectedErr: nil,
		},
		{
			name:      "valid optional string",
			value:     stringPtr("Valid notes"),
			fieldName: "notes",
			constraints: validation.StringConstraints{
				MaxLength:      1000,
				MinLength:      0,
				AllowEmpty:     true,
				TrimWhitespace: true,
				CheckXSS:       true,
			},
			expectedErr: nil,
		},
		{
			name:      "empty optional string allowed",
			value:     stringPtr(""),
			fieldName: "notes",
			constraints: validation.StringConstraints{
				MaxLength:      1000,
				MinLength:      0,
				AllowEmpty:     true,
				TrimWhitespace: true,
				CheckXSS:       true,
			},
			expectedErr: nil,
		},
		{
			name:      "optional string with XSS",
			value:     stringPtr("Notes<script>alert('xss')</script>"),
			fieldName: "notes",
			constraints: validation.StringConstraints{
				MaxLength:      1000,
				MinLength:      0,
				AllowEmpty:     true,
				TrimWhitespace: true,
				CheckXSS:       true,
			},
			expectedErr: validation.ErrInvalidCharacters,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validation.ValidateOptionalString(tt.value, tt.fieldName, tt.constraints)
			if tt.expectedErr != nil {
				assert.Error(t, err)
				assert.ErrorIs(t, err, tt.expectedErr)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestContainsDangerousCharacters(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected bool
	}{
		{
			name:     "safe string",
			input:    "Normal text without any issues",
			expected: false,
		},
		{
			name:     "contains script tag",
			input:    "Text<script>alert('xss')</script>",
			expected: true,
		},
		{
			name:     "contains closing script tag",
			input:    "Text</script>",
			expected: true,
		},
		{
			name:     "contains javascript protocol",
			input:    "Link: javascript:alert('xss')",
			expected: true,
		},
		{
			name:     "contains onclick handler",
			input:    "Button onclick='alert(1)'",
			expected: true,
		},
		{
			name:     "contains onerror handler",
			input:    "Image onerror='alert(1)'",
			expected: true,
		},
		{
			name:     "contains iframe tag",
			input:    "Content<iframe src='evil.com'></iframe>",
			expected: true,
		},
		{
			name:     "case insensitive detection",
			input:    "Text<SCRIPT>alert('xss')</SCRIPT>",
			expected: true,
		},
		{
			name:     "contains img tag",
			input:    "Image<img src='test.jpg'>",
			expected: true,
		},
		{
			name:     "contains onmouseover handler",
			input:    "Element onmouseover='alert(1)'",
			expected: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := validation.ContainsDangerousCharacters(tt.input)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestDefaultStringConstraints(t *testing.T) {
	constraints := validation.DefaultStringConstraints()

	assert.Equal(t, 255, constraints.MaxLength)
	assert.Equal(t, 1, constraints.MinLength)
	assert.False(t, constraints.AllowEmpty)
	assert.True(t, constraints.TrimWhitespace)
	assert.True(t, constraints.CheckXSS)
}

// Helper function to create string pointer
func stringPtr(s string) *string {
	return &s
}
