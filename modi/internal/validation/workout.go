// Package validation provides input validation for workout data.
// This package uses the reusable validation utilities from the common package.
package validation

// WorkoutConstraints defines validation constraints for workout fields.
// These constraints are specific to workout data and use the common validation utilities.
type WorkoutConstraints struct {
	NameConstraints     StringConstraints
	NotesConstraints    StringConstraints
	WeightConstraints   NumericConstraints
	SetsConstraints     NumericConstraints
	RepsConstraints     NumericConstraints
	DayConstraints      NumericConstraints
	DayOrderConstraints NumericConstraints
}

// DefaultWorkoutConstraints returns default validation constraints for workouts.
func DefaultWorkoutConstraints() WorkoutConstraints {
	return WorkoutConstraints{
		NameConstraints: StringConstraints{
			MaxLength:      255,
			MinLength:      1,
			AllowEmpty:     false,
			TrimWhitespace: true,
			CheckXSS:       true,
		},
		NotesConstraints: StringConstraints{
			MaxLength:      1000,
			MinLength:      0,
			AllowEmpty:     true,
			TrimWhitespace: true,
			CheckXSS:       true,
		},
		WeightConstraints: NumericConstraints{
			Min: 0.0,
			Max: 10000.0, // 10,000 lbs/kg
		},
		SetsConstraints: NumericConstraints{
			Min: 1.0,
			Max: 100.0,
		},
		RepsConstraints: NumericConstraints{
			Min: 1.0,
			Max: 1000.0,
		},
		DayConstraints: NumericConstraints{
			Min: 1.0,
			Max: 365.0, // Reasonable max for workout days
		},
		DayOrderConstraints: NumericConstraints{
			Min: 0.0,
			Max: 1000.0, // Reasonable max for day order
		},
	}
}

// ValidateWorkoutName validates a workout name using reusable string validation.
func ValidateWorkoutName(name string, constraints WorkoutConstraints) error {
	return ValidateString(name, "name", constraints.NameConstraints)
}

// ValidateWorkoutNotes validates workout notes using reusable string validation.
func ValidateWorkoutNotes(notes *string, constraints WorkoutConstraints) error {
	return ValidateOptionalString(notes, "notes", constraints.NotesConstraints)
}

// ValidateWorkoutWeight validates workout weight using reusable numeric validation.
func ValidateWorkoutWeight(weight *float64, constraints WorkoutConstraints) error {
	return ValidateOptionalNumeric(weight, "weight", constraints.WeightConstraints)
}

// ValidateWorkoutSets validates workout sets using reusable numeric validation.
func ValidateWorkoutSets(sets *int, constraints WorkoutConstraints) error {
	return ValidateOptionalInt(sets, "sets", constraints.SetsConstraints)
}

// ValidateWorkoutReps validates workout reps using reusable numeric validation.
func ValidateWorkoutReps(reps *int, constraints WorkoutConstraints) error {
	return ValidateOptionalInt(reps, "reps", constraints.RepsConstraints)
}

// ValidateWorkoutDay validates workout day using reusable numeric validation.
func ValidateWorkoutDay(day int, constraints WorkoutConstraints) error {
	return ValidateInt(day, "day", constraints.DayConstraints)
}

// ValidateWorkoutDayOrder validates workout day order using reusable numeric validation.
func ValidateWorkoutDayOrder(dayOrder int, constraints WorkoutConstraints) error {
	return ValidateInt(dayOrder, "day_order", constraints.DayOrderConstraints)
}

// ValidateWorkoutRequest validates a complete workout request.
// This function composes the individual field validators for a complete validation.
func ValidateWorkoutRequest(name string, weight *float64, sets *int, reps *int, notes *string, day int, dayOrder int) error {
	constraints := DefaultWorkoutConstraints()

	if err := ValidateWorkoutName(name, constraints); err != nil {
		return err
	}

	if err := ValidateWorkoutNotes(notes, constraints); err != nil {
		return err
	}

	if err := ValidateWorkoutWeight(weight, constraints); err != nil {
		return err
	}

	if err := ValidateWorkoutSets(sets, constraints); err != nil {
		return err
	}

	if err := ValidateWorkoutReps(reps, constraints); err != nil {
		return err
	}

	if err := ValidateWorkoutDay(day, constraints); err != nil {
		return err
	}

	if err := ValidateWorkoutDayOrder(dayOrder, constraints); err != nil {
		return err
	}

	return nil
}
