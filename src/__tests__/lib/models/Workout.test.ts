import { Workout, WorkoutData, WorkoutConverter, WorkoutValidator, WORKOUT_CONSTRAINTS } from '../../../lib/models/Workout';

describe('Workout Model', () => {
  describe('Workout Interface', () => {
    it('has correct structure', () => {
      const workout: Workout = {
        id: 'test-id',
        name: 'Bench Press',
        weight: 135,
        sets: 3,
        reps: 10,
        notes: 'Test notes',
        supersetParentId: 'parent-id',
        altParentId: 'alt-id',
      };

      expect(workout).toHaveProperty('id');
      expect(workout).toHaveProperty('name');
      expect(workout).toHaveProperty('weight');
      expect(workout).toHaveProperty('sets');
      expect(workout).toHaveProperty('reps');
      expect(workout).toHaveProperty('notes');
      expect(workout).toHaveProperty('supersetParentId');
      expect(workout).toHaveProperty('altParentId');

      expect(typeof workout.id).toBe('string');
      expect(typeof workout.name).toBe('string');
      expect(typeof workout.weight).toBe('number');
      expect(typeof workout.sets).toBe('number');
      expect(typeof workout.reps).toBe('number');
      expect(typeof workout.notes).toBe('string');
      expect(typeof workout.supersetParentId).toBe('string');
      expect(typeof workout.altParentId).toBe('string');
    });

    it('allows optional properties', () => {
      const workout: Workout = {
        id: 'test-id',
        name: 'Squats',
        weight: 225,
        sets: 4,
        reps: 8,
      };

      expect(workout.notes).toBeUndefined();
      expect(workout.supersetParentId).toBeUndefined();
      expect(workout.altParentId).toBeUndefined();
    });
  });

  describe('WorkoutData Interface', () => {
    it('has correct structure', () => {
      const workoutData: WorkoutData = {
        id: 'test-id',
        name: 'Deadlift',
        weight: 315,
        sets: 1,
        reps: 5,
        notes: 'Heavy set',
        supersetParentId: 'parent-id',
        altParentId: 'alt-id',
      };

      expect(workoutData).toHaveProperty('id');
      expect(workoutData).toHaveProperty('name');
      expect(workoutData).toHaveProperty('weight');
      expect(workoutData).toHaveProperty('sets');
      expect(workoutData).toHaveProperty('reps');
      expect(workoutData).toHaveProperty('notes');
      expect(workoutData).toHaveProperty('supersetParentId');
      expect(workoutData).toHaveProperty('altParentId');
    });
  });

  describe('WorkoutConverter', () => {
    describe('toData', () => {
      it('converts Workout to WorkoutData correctly', () => {
        const workout: Workout = {
          id: 'test-id',
          name: 'Overhead Press',
          weight: 95,
          sets: 3,
          reps: 12,
          notes: 'Focus on form',
          supersetParentId: 'parent-id',
          altParentId: 'alt-id',
        };

        const workoutData = WorkoutConverter.toData(workout);

        expect(workoutData.id).toBe(workout.id);
        expect(workoutData.name).toBe(workout.name);
        expect(workoutData.weight).toBe(workout.weight);
        expect(workoutData.sets).toBe(workout.sets);
        expect(workoutData.reps).toBe(workout.reps);
        expect(workoutData.notes).toBe(workout.notes);
        expect(workoutData.supersetParentId).toBe(workout.supersetParentId);
        expect(workoutData.altParentId).toBe(workout.altParentId);
      });

      it('handles optional properties correctly', () => {
        const workout: Workout = {
          id: 'test-id',
          name: 'Pull-ups',
          weight: 0,
          sets: 3,
          reps: 8,
        };

        const workoutData = WorkoutConverter.toData(workout);

        expect(workoutData.id).toBe(workout.id);
        expect(workoutData.name).toBe(workout.name);
        expect(workoutData.weight).toBe(workout.weight);
        expect(workoutData.sets).toBe(workout.sets);
        expect(workoutData.reps).toBe(workout.reps);
        expect(workoutData.notes).toBeUndefined();
        expect(workoutData.supersetParentId).toBeUndefined();
        expect(workoutData.altParentId).toBeUndefined();
      });
    });

    describe('fromData', () => {
      it('converts WorkoutData to Workout correctly', () => {
        const workoutData: WorkoutData = {
          id: 'test-id',
          name: 'Dips',
          weight: 25,
          sets: 4,
          reps: 10,
          notes: 'Bodyweight + 25lb',
          supersetParentId: 'parent-id',
          altParentId: 'alt-id',
        };

        const workout = WorkoutConverter.fromData(workoutData);

        expect(workout.id).toBe(workoutData.id);
        expect(workout.name).toBe(workoutData.name);
        expect(workout.weight).toBe(workoutData.weight);
        expect(workout.sets).toBe(workoutData.sets);
        expect(workout.reps).toBe(workoutData.reps);
        expect(workout.notes).toBe(workoutData.notes);
        expect(workout.supersetParentId).toBe(workoutData.supersetParentId);
        expect(workout.altParentId).toBe(workoutData.altParentId);
      });

      it('handles optional properties correctly', () => {
        const workoutData: WorkoutData = {
          id: 'test-id',
          name: 'Push-ups',
          weight: 0,
          sets: 3,
          reps: 15,
        };

        const workout = WorkoutConverter.fromData(workoutData);

        expect(workout.id).toBe(workoutData.id);
        expect(workout.name).toBe(workoutData.name);
        expect(workout.weight).toBe(workoutData.weight);
        expect(workout.sets).toBe(workoutData.sets);
        expect(workout.reps).toBe(workoutData.reps);
        expect(workout.notes).toBeUndefined();
        expect(workout.supersetParentId).toBeUndefined();
        expect(workout.altParentId).toBeUndefined();
      });
    });

    describe('Round-trip conversion', () => {
      it('maintains data integrity through conversion cycle', () => {
        const originalWorkout: Workout = {
          id: 'original-id',
          name: 'Barbell Rows',
          weight: 155,
          sets: 4,
          reps: 8,
          notes: 'Keep back straight',
          supersetParentId: 'parent-id',
          altParentId: 'alt-id',
        };

        const convertedToData = WorkoutConverter.toData(originalWorkout);
        const convertedBack = WorkoutConverter.fromData(convertedToData);

        expect(convertedBack.id).toBe(originalWorkout.id);
        expect(convertedBack.name).toBe(originalWorkout.name);
        expect(convertedBack.weight).toBe(originalWorkout.weight);
        expect(convertedBack.sets).toBe(originalWorkout.sets);
        expect(convertedBack.reps).toBe(originalWorkout.reps);
        expect(convertedBack.notes).toBe(originalWorkout.notes);
        expect(convertedBack.supersetParentId).toBe(originalWorkout.supersetParentId);
        expect(convertedBack.altParentId).toBe(originalWorkout.altParentId);
      });

      it('handles edge values correctly', () => {
        const originalWorkout: Workout = {
          id: 'edge-test',
          name: 'Max Weight Test',
          weight: 9999,
          sets: 9999,
          reps: 9999,
          notes: 'A'.repeat(256),
        };

        const convertedBack = WorkoutConverter.fromData(WorkoutConverter.toData(originalWorkout));
        
        expect(convertedBack.weight).toBe(9999);
        expect(convertedBack.sets).toBe(9999);
        expect(convertedBack.reps).toBe(9999);
        expect(convertedBack.notes).toBe('A'.repeat(256));
      });
    });
  });

  describe('WorkoutValidator', () => {
    describe('validate', () => {
      it('validates workout with valid data', () => {
        const workout: Workout = {
          id: 'valid-workout',
          name: 'Valid Exercise',
          weight: 100,
          sets: 3,
          reps: 10,
          notes: 'Valid notes',
        };

        expect(() => WorkoutValidator.validate(workout)).not.toThrow();
      });

      it('throws error for notes exceeding length limit', () => {
        const workout: Workout = {
          id: 'invalid-workout',
          name: 'Invalid Exercise',
          weight: 100,
          sets: 3,
          reps: 10,
          notes: 'A'.repeat(WORKOUT_CONSTRAINTS.NOTES_LENGTH_LIMIT + 1),
        };

        expect(() => WorkoutValidator.validate(workout)).toThrow(
          `Notes cannot exceed ${WORKOUT_CONSTRAINTS.NOTES_LENGTH_LIMIT} characters.`
        );
      });

      it('throws error for weight exceeding limit', () => {
        const workout: Workout = {
          id: 'invalid-workout',
          name: 'Invalid Exercise',
          weight: WORKOUT_CONSTRAINTS.WEIGHT_LIMIT + 1,
          sets: 3,
          reps: 10,
        };

        expect(() => WorkoutValidator.validate(workout)).toThrow(
          `Weight cannot exceed ${WORKOUT_CONSTRAINTS.WEIGHT_LIMIT}.`
        );
      });

      it('throws error for sets exceeding limit', () => {
        const workout: Workout = {
          id: 'invalid-workout',
          name: 'Invalid Exercise',
          weight: 100,
          sets: WORKOUT_CONSTRAINTS.SETS_LIMIT + 1,
          reps: 10,
        };

        expect(() => WorkoutValidator.validate(workout)).toThrow(
          `Sets cannot exceed ${WORKOUT_CONSTRAINTS.SETS_LIMIT}.`
        );
      });

      it('throws error for reps exceeding limit', () => {
        const workout: Workout = {
          id: 'invalid-workout',
          name: 'Invalid Exercise',
          weight: 100,
          sets: 3,
          reps: WORKOUT_CONSTRAINTS.REPS_LIMIT + 1,
        };

        expect(() => WorkoutValidator.validate(workout)).toThrow(
          `Reps cannot exceed ${WORKOUT_CONSTRAINTS.REPS_LIMIT}.`
        );
      });

      it('allows maximum valid values', () => {
        const workout: Workout = {
          id: 'max-valid-workout',
          name: 'Max Valid Exercise',
          weight: WORKOUT_CONSTRAINTS.WEIGHT_LIMIT,
          sets: WORKOUT_CONSTRAINTS.SETS_LIMIT,
          reps: WORKOUT_CONSTRAINTS.REPS_LIMIT,
          notes: 'A'.repeat(WORKOUT_CONSTRAINTS.NOTES_LENGTH_LIMIT),
        };

        expect(() => WorkoutValidator.validate(workout)).not.toThrow();
      });
    });

    describe('hasNote', () => {
      it('returns true for workout with notes', () => {
        const workout: Workout = {
          id: 'test-id',
          name: 'Test Exercise',
          weight: 100,
          sets: 3,
          reps: 10,
          notes: 'Has notes',
        };

        expect(WorkoutValidator.hasNote(workout)).toBe(true);
      });

      it('returns false for workout without notes', () => {
        const workout: Workout = {
          id: 'test-id',
          name: 'Test Exercise',
          weight: 100,
          sets: 3,
          reps: 10,
        };

        expect(WorkoutValidator.hasNote(workout)).toBe(false);
      });

      it('returns false for workout with empty notes', () => {
        const workout: Workout = {
          id: 'test-id',
          name: 'Test Exercise',
          weight: 100,
          sets: 3,
          reps: 10,
          notes: '',
        };

        expect(WorkoutValidator.hasNote(workout)).toBe(false);
      });

      it('returns false for workout with whitespace-only notes', () => {
        const workout: Workout = {
          id: 'test-id',
          name: 'Test Exercise',
          weight: 100,
          sets: 3,
          reps: 10,
          notes: '   ',
        };

        expect(WorkoutValidator.hasNote(workout)).toBe(false);
      });
    });

    describe('getAlternatives', () => {
      it('returns alternative workouts for given workout', () => {
        const parentWorkout: Workout = {
          id: 'parent-id',
          name: 'Parent Exercise',
          weight: 100,
          sets: 3,
          reps: 10,
        };

        const workoutList: Workout[] = [
          parentWorkout,
          {
            id: 'alt-1',
            name: 'Alternative 1',
            weight: 90,
            sets: 3,
            reps: 10,
            altParentId: 'parent-id',
          },
          {
            id: 'alt-2',
            name: 'Alternative 2',
            weight: 110,
            sets: 3,
            reps: 10,
            altParentId: 'parent-id',
          },
          {
            id: 'unrelated',
            name: 'Unrelated Exercise',
            weight: 50,
            sets: 3,
            reps: 10,
          },
        ];

        const alternatives = WorkoutValidator.getAlternatives(parentWorkout, workoutList);

        expect(alternatives).toHaveLength(2);
        expect(alternatives[0].id).toBe('alt-1');
        expect(alternatives[1].id).toBe('alt-2');
      });

      it('returns empty array when no alternatives exist', () => {
        const workout: Workout = {
          id: 'test-id',
          name: 'Test Exercise',
          weight: 100,
          sets: 3,
          reps: 10,
        };

        const workoutList: Workout[] = [
          workout,
          {
            id: 'other',
            name: 'Other Exercise',
            weight: 50,
            sets: 3,
            reps: 10,
          },
        ];

        const alternatives = WorkoutValidator.getAlternatives(workout, workoutList);

        expect(alternatives).toHaveLength(0);
      });
    });

    describe('getSupersets', () => {
      it('returns superset workouts for given workout', () => {
        const parentWorkout: Workout = {
          id: 'parent-id',
          name: 'Parent Exercise',
          weight: 100,
          sets: 3,
          reps: 10,
        };

        const workoutList: Workout[] = [
          parentWorkout,
          {
            id: 'superset-1',
            name: 'Superset 1',
            weight: 80,
            sets: 3,
            reps: 12,
            supersetParentId: 'parent-id',
          },
          {
            id: 'superset-2',
            name: 'Superset 2',
            weight: 120,
            sets: 3,
            reps: 8,
            supersetParentId: 'parent-id',
          },
          {
            id: 'unrelated',
            name: 'Unrelated Exercise',
            weight: 50,
            sets: 3,
            reps: 10,
          },
        ];

        const supersets = WorkoutValidator.getSupersets(parentWorkout, workoutList);

        expect(supersets).toHaveLength(2);
        expect(supersets[0].id).toBe('superset-1');
        expect(supersets[1].id).toBe('superset-2');
      });

      it('returns empty array when no supersets exist', () => {
        const workout: Workout = {
          id: 'test-id',
          name: 'Test Exercise',
          weight: 100,
          sets: 3,
          reps: 10,
        };

        const workoutList: Workout[] = [
          workout,
          {
            id: 'other',
            name: 'Other Exercise',
            weight: 50,
            sets: 3,
            reps: 10,
          },
        ];

        const supersets = WorkoutValidator.getSupersets(workout, workoutList);

        expect(supersets).toHaveLength(0);
      });
    });
  });

  describe('WORKOUT_CONSTRAINTS', () => {
    it('has correct constraint values', () => {
      expect(WORKOUT_CONSTRAINTS.NOTES_LENGTH_LIMIT).toBe(256);
      expect(WORKOUT_CONSTRAINTS.WEIGHT_LIMIT).toBe(9999);
      expect(WORKOUT_CONSTRAINTS.SETS_LIMIT).toBe(9999);
      expect(WORKOUT_CONSTRAINTS.REPS_LIMIT).toBe(9999);
    });
  });
});

