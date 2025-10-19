import { WorkoutDay, WorkoutDayData, WorkoutDayConverter, WorkoutDayValidator } from '../../../lib/models/WorkoutDay';
import { Workout } from '../../../lib/models/Workout';

describe('WorkoutDay Model', () => {
  describe('WorkoutDay Interface', () => {
    it('extends Workout interface with day properties', () => {
      const workoutDay: WorkoutDay = {
        id: 'test-id',
        name: 'Bench Press',
        weight: 135,
        sets: 3,
        reps: 10,
        day: 1,
        dayOrder: 0,
        notes: 'Test notes',
        supersetParentId: 'parent-id',
        altParentId: 'alt-id',
      };

      // Inherited from Workout
      expect(workoutDay.id).toBe('test-id');
      expect(workoutDay.name).toBe('Bench Press');
      expect(workoutDay.weight).toBe(135);
      expect(workoutDay.sets).toBe(3);
      expect(workoutDay.reps).toBe(10);
      expect(workoutDay.notes).toBe('Test notes');
      expect(workoutDay.supersetParentId).toBe('parent-id');
      expect(workoutDay.altParentId).toBe('alt-id');

      // WorkoutDay specific
      expect(workoutDay.day).toBe(1);
      expect(workoutDay.dayOrder).toBe(0);
      expect(typeof workoutDay.day).toBe('number');
      expect(typeof workoutDay.dayOrder).toBe('number');
    });

    it('allows optional properties from Workout', () => {
      const workoutDay: WorkoutDay = {
        id: 'test-id',
        name: 'Squats',
        weight: 225,
        sets: 4,
        reps: 8,
        day: 2,
        dayOrder: 1,
      };

      expect(workoutDay.notes).toBeUndefined();
      expect(workoutDay.supersetParentId).toBeUndefined();
      expect(workoutDay.altParentId).toBeUndefined();
    });
  });

  describe('WorkoutDayData Interface', () => {
    it('extends WorkoutData interface with day properties', () => {
      const workoutDayData: WorkoutDayData = {
        id: 'test-id',
        name: 'Deadlift',
        weight: 315,
        sets: 1,
        reps: 5,
        day: 3,
        dayOrder: 2,
        notes: 'Heavy set',
        supersetParentId: 'parent-id',
        altParentId: 'alt-id',
      };

      expect(workoutDayData.day).toBe(3);
      expect(workoutDayData.dayOrder).toBe(2);
      expect(typeof workoutDayData.day).toBe('number');
      expect(typeof workoutDayData.dayOrder).toBe('number');
    });
  });

  describe('WorkoutDayConverter', () => {
    describe('toData', () => {
      it('converts WorkoutDay to WorkoutDayData correctly', () => {
        const workoutDay: WorkoutDay = {
          id: 'test-id',
          name: 'Overhead Press',
          weight: 95,
          sets: 3,
          reps: 12,
          day: 1,
          dayOrder: 0,
          notes: 'Focus on form',
          supersetParentId: 'parent-id',
          altParentId: 'alt-id',
        };

        const workoutDayData = WorkoutDayConverter.toData(workoutDay);

        // Workout properties
        expect(workoutDayData.id).toBe(workoutDay.id);
        expect(workoutDayData.name).toBe(workoutDay.name);
        expect(workoutDayData.weight).toBe(workoutDay.weight);
        expect(workoutDayData.sets).toBe(workoutDay.sets);
        expect(workoutDayData.reps).toBe(workoutDay.reps);
        expect(workoutDayData.notes).toBe(workoutDay.notes);
        expect(workoutDayData.supersetParentId).toBe(workoutDay.supersetParentId);
        expect(workoutDayData.altParentId).toBe(workoutDay.altParentId);

        // WorkoutDay specific properties
        expect(workoutDayData.day).toBe(workoutDay.day);
        expect(workoutDayData.dayOrder).toBe(workoutDay.dayOrder);
      });

      it('handles optional properties correctly', () => {
        const workoutDay: WorkoutDay = {
          id: 'test-id',
          name: 'Pull-ups',
          weight: 0,
          sets: 3,
          reps: 8,
          day: 2,
          dayOrder: 1,
        };

        const workoutDayData = WorkoutDayConverter.toData(workoutDay);

        expect(workoutDayData.day).toBe(workoutDay.day);
        expect(workoutDayData.dayOrder).toBe(workoutDay.dayOrder);
        expect(workoutDayData.notes).toBeUndefined();
        expect(workoutDayData.supersetParentId).toBeUndefined();
        expect(workoutDayData.altParentId).toBeUndefined();
      });
    });

    describe('fromData', () => {
      it('converts WorkoutDayData to WorkoutDay correctly', () => {
        const workoutDayData: WorkoutDayData = {
          id: 'test-id',
          name: 'Dips',
          weight: 25,
          sets: 4,
          reps: 10,
          day: 3,
          dayOrder: 2,
          notes: 'Bodyweight + 25lb',
          supersetParentId: 'parent-id',
          altParentId: 'alt-id',
        };

        const workoutDay = WorkoutDayConverter.fromData(workoutDayData);

        // Workout properties
        expect(workoutDay.id).toBe(workoutDayData.id);
        expect(workoutDay.name).toBe(workoutDayData.name);
        expect(workoutDay.weight).toBe(workoutDayData.weight);
        expect(workoutDay.sets).toBe(workoutDayData.sets);
        expect(workoutDay.reps).toBe(workoutDayData.reps);
        expect(workoutDay.notes).toBe(workoutDayData.notes);
        expect(workoutDay.supersetParentId).toBe(workoutDayData.supersetParentId);
        expect(workoutDay.altParentId).toBe(workoutDayData.altParentId);

        // WorkoutDay specific properties
        expect(workoutDay.day).toBe(workoutDayData.day);
        expect(workoutDay.dayOrder).toBe(workoutDayData.dayOrder);
      });

      it('handles optional properties correctly', () => {
        const workoutDayData: WorkoutDayData = {
          id: 'test-id',
          name: 'Push-ups',
          weight: 0,
          sets: 3,
          reps: 15,
          day: 1,
          dayOrder: 0,
        };

        const workoutDay = WorkoutDayConverter.fromData(workoutDayData);

        expect(workoutDay.day).toBe(workoutDayData.day);
        expect(workoutDay.dayOrder).toBe(workoutDayData.dayOrder);
        expect(workoutDay.notes).toBeUndefined();
        expect(workoutDay.supersetParentId).toBeUndefined();
        expect(workoutDay.altParentId).toBeUndefined();
      });
    });

    describe('Round-trip conversion', () => {
      it('maintains data integrity through conversion cycle', () => {
        const originalWorkoutDay: WorkoutDay = {
          id: 'original-id',
          name: 'Barbell Rows',
          weight: 155,
          sets: 4,
          reps: 8,
          day: 2,
          dayOrder: 1,
          notes: 'Keep back straight',
          supersetParentId: 'parent-id',
          altParentId: 'alt-id',
        };

        const convertedToData = WorkoutDayConverter.toData(originalWorkoutDay);
        const convertedBack = WorkoutDayConverter.fromData(convertedToData);

        expect(convertedBack.id).toBe(originalWorkoutDay.id);
        expect(convertedBack.name).toBe(originalWorkoutDay.name);
        expect(convertedBack.weight).toBe(originalWorkoutDay.weight);
        expect(convertedBack.sets).toBe(originalWorkoutDay.sets);
        expect(convertedBack.reps).toBe(originalWorkoutDay.reps);
        expect(convertedBack.day).toBe(originalWorkoutDay.day);
        expect(convertedBack.dayOrder).toBe(originalWorkoutDay.dayOrder);
        expect(convertedBack.notes).toBe(originalWorkoutDay.notes);
        expect(convertedBack.supersetParentId).toBe(originalWorkoutDay.supersetParentId);
        expect(convertedBack.altParentId).toBe(originalWorkoutDay.altParentId);
      });
    });
  });

  describe('WorkoutDayValidator', () => {
    describe('altExists', () => {
      it('returns true when alternative workout exists', () => {
        const workoutDay: WorkoutDay = {
          id: 'test-id',
          name: 'Test Exercise',
          weight: 100,
          sets: 3,
          reps: 10,
          day: 1,
          dayOrder: 0,
          altParentId: 'parent-id',
        };

        const workouts: Workout[] = [
          { id: 'parent-id', name: 'Parent', weight: 100, sets: 3, reps: 10 },
          { id: 'other-id', name: 'Other', weight: 50, sets: 3, reps: 10 },
        ];

        expect(WorkoutDayValidator.altExists(workoutDay, workouts)).toBe(true);
      });

      it('returns false when alternative workout does not exist', () => {
        const workoutDay: WorkoutDay = {
          id: 'test-id',
          name: 'Test Exercise',
          weight: 100,
          sets: 3,
          reps: 10,
          day: 1,
          dayOrder: 0,
          altParentId: 'non-existent-id',
        };

        const workouts: Workout[] = [
          { id: 'other-id', name: 'Other', weight: 50, sets: 3, reps: 10 },
        ];

        expect(WorkoutDayValidator.altExists(workoutDay, workouts)).toBe(false);
      });

      it('returns false when no altParentId is specified', () => {
        const workoutDay: WorkoutDay = {
          id: 'test-id',
          name: 'Test Exercise',
          weight: 100,
          sets: 3,
          reps: 10,
          day: 1,
          dayOrder: 0,
        };

        const workouts: Workout[] = [
          { id: 'parent-id', name: 'Parent', weight: 100, sets: 3, reps: 10 },
        ];

        expect(WorkoutDayValidator.altExists(workoutDay, workouts)).toBe(false);
      });
    });

    describe('supersetExists', () => {
      it('returns true when superset workout exists', () => {
        const workoutDay: WorkoutDay = {
          id: 'test-id',
          name: 'Test Exercise',
          weight: 100,
          sets: 3,
          reps: 10,
          day: 1,
          dayOrder: 0,
          supersetParentId: 'parent-id',
        };

        const workouts: Workout[] = [
          { id: 'parent-id', name: 'Parent', weight: 100, sets: 3, reps: 10 },
          { id: 'other-id', name: 'Other', weight: 50, sets: 3, reps: 10 },
        ];

        expect(WorkoutDayValidator.supersetExists(workoutDay, workouts)).toBe(true);
      });

      it('returns false when superset workout does not exist', () => {
        const workoutDay: WorkoutDay = {
          id: 'test-id',
          name: 'Test Exercise',
          weight: 100,
          sets: 3,
          reps: 10,
          day: 1,
          dayOrder: 0,
          supersetParentId: 'non-existent-id',
        };

        const workouts: Workout[] = [
          { id: 'other-id', name: 'Other', weight: 50, sets: 3, reps: 10 },
        ];

        expect(WorkoutDayValidator.supersetExists(workoutDay, workouts)).toBe(false);
      });

      it('returns false when no supersetParentId is specified', () => {
        const workoutDay: WorkoutDay = {
          id: 'test-id',
          name: 'Test Exercise',
          weight: 100,
          sets: 3,
          reps: 10,
          day: 1,
          dayOrder: 0,
        };

        const workouts: Workout[] = [
          { id: 'parent-id', name: 'Parent', weight: 100, sets: 3, reps: 10 },
        ];

        expect(WorkoutDayValidator.supersetExists(workoutDay, workouts)).toBe(false);
      });
    });

    describe('isAlternative', () => {
      it('returns true when workout is an alternative to others', () => {
        const workoutDay: WorkoutDay = {
          id: 'parent-id',
          name: 'Parent Exercise',
          weight: 100,
          sets: 3,
          reps: 10,
          day: 1,
          dayOrder: 0,
        };

        const workouts: Workout[] = [
          workoutDay,
          { id: 'alt-1', name: 'Alt 1', weight: 90, sets: 3, reps: 10, altParentId: 'parent-id' },
          { id: 'alt-2', name: 'Alt 2', weight: 110, sets: 3, reps: 10, altParentId: 'parent-id' },
        ];

        expect(WorkoutDayValidator.isAlternative(workoutDay, workouts)).toBe(true);
      });

      it('returns false when workout is not an alternative to others', () => {
        const workoutDay: WorkoutDay = {
          id: 'test-id',
          name: 'Test Exercise',
          weight: 100,
          sets: 3,
          reps: 10,
          day: 1,
          dayOrder: 0,
        };

        const workouts: Workout[] = [
          workoutDay,
          { id: 'other', name: 'Other', weight: 50, sets: 3, reps: 10 },
        ];

        expect(WorkoutDayValidator.isAlternative(workoutDay, workouts)).toBe(false);
      });
    });

    describe('isSuperset', () => {
      it('returns true when workout is a superset to others', () => {
        const workoutDay: WorkoutDay = {
          id: 'parent-id',
          name: 'Parent Exercise',
          weight: 100,
          sets: 3,
          reps: 10,
          day: 1,
          dayOrder: 0,
        };

        const workouts: Workout[] = [
          workoutDay,
          { id: 'superset-1', name: 'Superset 1', weight: 80, sets: 3, reps: 12, supersetParentId: 'parent-id' },
          { id: 'superset-2', name: 'Superset 2', weight: 120, sets: 3, reps: 8, supersetParentId: 'parent-id' },
        ];

        expect(WorkoutDayValidator.isSuperset(workoutDay, workouts)).toBe(true);
      });

      it('returns false when workout is not a superset to others', () => {
        const workoutDay: WorkoutDay = {
          id: 'test-id',
          name: 'Test Exercise',
          weight: 100,
          sets: 3,
          reps: 10,
          day: 1,
          dayOrder: 0,
        };

        const workouts: Workout[] = [
          workoutDay,
          { id: 'other', name: 'Other', weight: 50, sets: 3, reps: 10 },
        ];

        expect(WorkoutDayValidator.isSuperset(workoutDay, workouts)).toBe(false);
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles extreme day values', () => {
      const workoutDay: WorkoutDay = {
        id: 'test-id',
        name: 'Test Exercise',
        weight: 100,
        sets: 3,
        reps: 10,
        day: 999,
        dayOrder: 999,
      };

      const convertedBack = WorkoutDayConverter.fromData(WorkoutDayConverter.toData(workoutDay));
      expect(convertedBack.day).toBe(999);
      expect(convertedBack.dayOrder).toBe(999);
    });

    it('handles zero values', () => {
      const workoutDay: WorkoutDay = {
        id: 'test-id',
        name: 'Test Exercise',
        weight: 0,
        sets: 0,
        reps: 0,
        day: 0,
        dayOrder: 0,
      };

      const convertedBack = WorkoutDayConverter.fromData(WorkoutDayConverter.toData(workoutDay));
      expect(convertedBack.day).toBe(0);
      expect(convertedBack.dayOrder).toBe(0);
      expect(convertedBack.weight).toBe(0);
      expect(convertedBack.sets).toBe(0);
      expect(convertedBack.reps).toBe(0);
    });

    it('handles negative values', () => {
      const workoutDay: WorkoutDay = {
        id: 'test-id',
        name: 'Test Exercise',
        weight: -50,
        sets: -1,
        reps: -5,
        day: -1,
        dayOrder: -1,
      };

      const convertedBack = WorkoutDayConverter.fromData(WorkoutDayConverter.toData(workoutDay));
      expect(convertedBack.day).toBe(-1);
      expect(convertedBack.dayOrder).toBe(-1);
      expect(convertedBack.weight).toBe(-50);
      expect(convertedBack.sets).toBe(-1);
      expect(convertedBack.reps).toBe(-5);
    });
  });
});

