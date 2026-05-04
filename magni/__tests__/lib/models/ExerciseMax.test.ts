import {
  ExerciseMax,
  ExerciseMaxConverter,
  ExerciseMaxValidator,
  EXERCISE_MAX_CONSTRAINTS,
  absoluteWeightToMaxPercent,
  calculateE1RM,
  calculateWorkingWeight,
} from '../../../lib/models/ExerciseMax'

describe('ExerciseMax Model', () => {
  describe('ExerciseMax Interface', () => {
    it('has correct structure', () => {
      const exerciseMax: ExerciseMax = {
        id: 'test-id',
        name: 'Squat',
        maxWeight: 300,
        lastUpdated: '2026-03-26',
      }

      expect(exerciseMax).toHaveProperty('id')
      expect(exerciseMax).toHaveProperty('name')
      expect(exerciseMax).toHaveProperty('maxWeight')
      expect(exerciseMax).toHaveProperty('lastUpdated')

      expect(typeof exerciseMax.id).toBe('string')
      expect(typeof exerciseMax.name).toBe('string')
      expect(typeof exerciseMax.maxWeight).toBe('number')
      expect(typeof exerciseMax.lastUpdated).toBe('string')
    })
  })

  describe('ExerciseMaxConverter', () => {
    describe('toData', () => {
      it('converts ExerciseMax to data correctly', () => {
        const exerciseMax: ExerciseMax = {
          id: 'test-id',
          name: 'Bench Press',
          maxWeight: 225,
          lastUpdated: '2026-03-26',
        }

        const data = ExerciseMaxConverter.toData(exerciseMax)

        expect(data.id).toBe(exerciseMax.id)
        expect(data.name).toBe(exerciseMax.name)
        expect(data.maxWeight).toBe(exerciseMax.maxWeight)
        expect(data.lastUpdated).toBe(exerciseMax.lastUpdated)
      })
    })

    describe('fromData', () => {
      it('converts data to ExerciseMax correctly', () => {
        const data: ExerciseMax = {
          id: 'test-id',
          name: 'Deadlift',
          maxWeight: 405,
          lastUpdated: '2026-03-26',
        }

        const exerciseMax = ExerciseMaxConverter.fromData(data)

        expect(exerciseMax.id).toBe(data.id)
        expect(exerciseMax.name).toBe(data.name)
        expect(exerciseMax.maxWeight).toBe(data.maxWeight)
        expect(exerciseMax.lastUpdated).toBe(data.lastUpdated)
      })
    })

    describe('Round-trip conversion', () => {
      it('maintains data integrity through conversion cycle', () => {
        const original: ExerciseMax = {
          id: 'round-trip-id',
          name: 'Squat',
          maxWeight: 315,
          lastUpdated: '2026-01-15',
        }

        const converted = ExerciseMaxConverter.fromData(ExerciseMaxConverter.toData(original))

        expect(converted.id).toBe(original.id)
        expect(converted.name).toBe(original.name)
        expect(converted.maxWeight).toBe(original.maxWeight)
        expect(converted.lastUpdated).toBe(original.lastUpdated)
      })
    })
  })

  describe('ExerciseMaxValidator', () => {
    describe('validate', () => {
      it('validates exercise max with valid data', () => {
        const exerciseMax: ExerciseMax = {
          id: 'valid-id',
          name: 'Squat',
          maxWeight: 300,
          lastUpdated: '2026-03-26',
        }

        expect(() => ExerciseMaxValidator.validate(exerciseMax)).not.toThrow()
      })

      it('throws error for empty name', () => {
        const exerciseMax: ExerciseMax = {
          id: 'invalid-id',
          name: '',
          maxWeight: 300,
          lastUpdated: '2026-03-26',
        }

        expect(() => ExerciseMaxValidator.validate(exerciseMax)).toThrow('Exercise name is required.')
      })

      it('throws error for whitespace-only name', () => {
        const exerciseMax: ExerciseMax = {
          id: 'invalid-id',
          name: '   ',
          maxWeight: 300,
          lastUpdated: '2026-03-26',
        }

        expect(() => ExerciseMaxValidator.validate(exerciseMax)).toThrow('Exercise name is required.')
      })

      it('throws error for name exceeding length limit', () => {
        const exerciseMax: ExerciseMax = {
          id: 'invalid-id',
          name: 'A'.repeat(EXERCISE_MAX_CONSTRAINTS.NAME_LENGTH_LIMIT + 1),
          maxWeight: 300,
          lastUpdated: '2026-03-26',
        }

        expect(() => ExerciseMaxValidator.validate(exerciseMax)).toThrow(
          `Exercise name cannot exceed ${EXERCISE_MAX_CONSTRAINTS.NAME_LENGTH_LIMIT} characters.`,
        )
      })

      it('throws error for negative max weight', () => {
        const exerciseMax: ExerciseMax = {
          id: 'invalid-id',
          name: 'Squat',
          maxWeight: -100,
          lastUpdated: '2026-03-26',
        }

        expect(() => ExerciseMaxValidator.validate(exerciseMax)).toThrow('Max weight cannot be negative.')
      })

      it('throws error for max weight exceeding limit', () => {
        const exerciseMax: ExerciseMax = {
          id: 'invalid-id',
          name: 'Squat',
          maxWeight: EXERCISE_MAX_CONSTRAINTS.WEIGHT_LIMIT + 1,
          lastUpdated: '2026-03-26',
        }

        expect(() => ExerciseMaxValidator.validate(exerciseMax)).toThrow(
          `Max weight cannot exceed ${EXERCISE_MAX_CONSTRAINTS.WEIGHT_LIMIT}.`,
        )
      })

      it('allows maximum valid values', () => {
        const exerciseMax: ExerciseMax = {
          id: 'max-valid-id',
          name: 'A'.repeat(EXERCISE_MAX_CONSTRAINTS.NAME_LENGTH_LIMIT),
          maxWeight: EXERCISE_MAX_CONSTRAINTS.WEIGHT_LIMIT,
          lastUpdated: '2026-03-26',
        }

        expect(() => ExerciseMaxValidator.validate(exerciseMax)).not.toThrow()
      })

      it('allows zero max weight', () => {
        const exerciseMax: ExerciseMax = {
          id: 'zero-weight',
          name: 'Squat',
          maxWeight: 0,
          lastUpdated: '2026-03-26',
        }

        expect(() => ExerciseMaxValidator.validate(exerciseMax)).not.toThrow()
      })
    })
  })

  describe('EXERCISE_MAX_CONSTRAINTS', () => {
    it('has correct constraint values', () => {
      expect(EXERCISE_MAX_CONSTRAINTS.NAME_LENGTH_LIMIT).toBe(100)
      expect(EXERCISE_MAX_CONSTRAINTS.WEIGHT_LIMIT).toBe(9999)
      expect(EXERCISE_MAX_CONSTRAINTS.AMRAP_REPS_LIMIT).toBe(100)
    })
  })

  describe('calculateE1RM', () => {
    it('calculates e1RM correctly using Epley formula', () => {
      // e1RM = weight * (1 + reps / 30)
      // 200 * (1 + 10/30) = 200 * 1.333... = 266.66... → 267
      expect(calculateE1RM(200, 10)).toBe(267)
    })

    it('returns the weight itself for a single rep', () => {
      expect(calculateE1RM(300, 1)).toBe(300)
    })

    it('calculates correctly for 5 reps', () => {
      // 225 * (1 + 5/30) = 225 * 1.1667 = 262.5 → 263
      expect(calculateE1RM(225, 5)).toBe(263)
    })

    it('calculates correctly for 3 reps', () => {
      // 315 * (1 + 3/30) = 315 * 1.1 = 346.5 → 347
      expect(calculateE1RM(315, 3)).toBe(347)
    })

    it('calculates correctly for high reps', () => {
      // 135 * (1 + 20/30) = 135 * 1.6667 = 225 → 225
      expect(calculateE1RM(135, 20)).toBe(225)
    })

    it('returns 0 for zero weight', () => {
      expect(calculateE1RM(0, 10)).toBe(0)
    })

    it('returns 0 for zero reps', () => {
      expect(calculateE1RM(200, 0)).toBe(0)
    })

    it('returns 0 for negative weight', () => {
      expect(calculateE1RM(-100, 5)).toBe(0)
    })

    it('returns 0 for negative reps', () => {
      expect(calculateE1RM(200, -5)).toBe(0)
    })

    it('rounds to nearest whole number', () => {
      // 100 * (1 + 7/30) = 100 * 1.2333... = 123.33... → 123
      expect(calculateE1RM(100, 7)).toBe(123)
    })
  })

  describe('absoluteWeightToMaxPercent', () => {
    it('converts absolute weight to rounded percent of max', () => {
      expect(absoluteWeightToMaxPercent(200, 400)).toBe(50)
    })

    it('returns 0 when max is zero or negative', () => {
      expect(absoluteWeightToMaxPercent(200, 0)).toBe(0)
      expect(absoluteWeightToMaxPercent(200, -100)).toBe(0)
    })
  })

  describe('calculateWorkingWeight', () => {
    it('calculates working weight from max and percentage', () => {
      // 300 * 75 / 100 = 225
      expect(calculateWorkingWeight(300, 75)).toBe(225)
    })

    it('calculates 100% correctly', () => {
      expect(calculateWorkingWeight(315, 100)).toBe(315)
    })

    it('calculates 50% correctly', () => {
      // 400 * 50 / 100 = 200
      expect(calculateWorkingWeight(400, 50)).toBe(200)
    })

    it('rounds to nearest whole number', () => {
      // 315 * 67 / 100 = 211.05 → 211
      expect(calculateWorkingWeight(315, 67)).toBe(211)
    })

    it('handles rounding up correctly', () => {
      // 300 * 85 / 100 = 255
      expect(calculateWorkingWeight(300, 85)).toBe(255)
    })

    it('returns 0 for zero max weight', () => {
      expect(calculateWorkingWeight(0, 75)).toBe(0)
    })

    it('returns 0 for zero percentage', () => {
      expect(calculateWorkingWeight(300, 0)).toBe(0)
    })

    it('returns 0 for negative max weight', () => {
      expect(calculateWorkingWeight(-300, 75)).toBe(0)
    })

    it('returns 0 for negative percentage', () => {
      expect(calculateWorkingWeight(300, -75)).toBe(0)
    })

    it('handles percentages over 100', () => {
      // 200 * 110 / 100 = 220
      expect(calculateWorkingWeight(200, 110)).toBe(220)
    })
  })
})
