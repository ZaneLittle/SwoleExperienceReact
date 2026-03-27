export interface ExerciseMax {
  id: string;
  name: string;
  maxWeight: number;
  lastUpdated: string;
}

export const ExerciseMaxConverter = {
  toData: (exerciseMax: ExerciseMax): ExerciseMax => exerciseMax,
  fromData: (data: ExerciseMax): ExerciseMax => data,
}

export const EXERCISE_MAX_CONSTRAINTS = {
  NAME_LENGTH_LIMIT: 100,
  WEIGHT_LIMIT: 9999,
  AMRAP_REPS_LIMIT: 100,
} as const

export class ExerciseMaxValidator {
  static validate(exerciseMax: ExerciseMax): void {
    if (!exerciseMax.name || exerciseMax.name.trim().length === 0) {
      throw new Error('Exercise name is required.')
    }
    if (exerciseMax.name.length > EXERCISE_MAX_CONSTRAINTS.NAME_LENGTH_LIMIT) {
      throw new Error(`Exercise name cannot exceed ${EXERCISE_MAX_CONSTRAINTS.NAME_LENGTH_LIMIT} characters.`)
    }
    if (exerciseMax.maxWeight < 0) {
      throw new Error('Max weight cannot be negative.')
    }
    if (exerciseMax.maxWeight > EXERCISE_MAX_CONSTRAINTS.WEIGHT_LIMIT) {
      throw new Error(`Max weight cannot exceed ${EXERCISE_MAX_CONSTRAINTS.WEIGHT_LIMIT}.`)
    }
  }
}

/**
 * Epley formula: e1RM = weight × (1 + reps / 30)
 * Returns 0 if inputs are invalid.
 */
export const calculateE1RM = (weight: number, reps: number): number => {
  if (weight <= 0 || reps <= 0) return 0
  if (reps === 1) return weight
  return Math.round(weight * (1 + reps / 30))
}

/**
 * Calculate the working weight from a max and a percentage.
 * Rounds to the nearest whole number.
 */
export const calculateWorkingWeight = (maxWeight: number, percentage: number): number => {
  if (maxWeight <= 0 || percentage <= 0) return 0
  return Math.round(maxWeight * percentage / 100)
}
