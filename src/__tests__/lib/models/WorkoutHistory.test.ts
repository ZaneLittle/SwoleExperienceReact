import { WorkoutHistory, WorkoutHistoryData, WorkoutHistoryConverter, WorkoutHistoryValidator } from '../../../lib/models/WorkoutHistory';
import { Workout } from '../../../lib/models/Workout';

describe('WorkoutHistory Model', () => {
  describe('WorkoutHistory Interface', () => {
    it('extends Workout interface with history properties', () => {
      const workoutHistory: WorkoutHistory = {
        id: 'history-id',
        workoutId: 'workout-id',
        date: '2024-01-15',
        name: 'Bench Press',
        weight: 135,
        sets: 3,
        reps: 10,
        notes: 'Test notes',
        supersetParentId: 'parent-id',
        altParentId: 'alt-id',
      };

      // Inherited from Workout
      expect(workoutHistory.id).toBe('history-id');
      expect(workoutHistory.name).toBe('Bench Press');
      expect(workoutHistory.weight).toBe(135);
      expect(workoutHistory.sets).toBe(3);
      expect(workoutHistory.reps).toBe(10);
      expect(workoutHistory.notes).toBe('Test notes');
      expect(workoutHistory.supersetParentId).toBe('parent-id');
      expect(workoutHistory.altParentId).toBe('alt-id');

      // WorkoutHistory specific
      expect(workoutHistory.workoutId).toBe('workout-id');
      expect(workoutHistory.date).toBe('2024-01-15');
      expect(typeof workoutHistory.workoutId).toBe('string');
      expect(typeof workoutHistory.date).toBe('string');
    });

    it('allows optional properties from Workout', () => {
      const workoutHistory: WorkoutHistory = {
        id: 'history-id',
        workoutId: 'workout-id',
        date: '2024-01-15',
        name: 'Squats',
        weight: 225,
        sets: 4,
        reps: 8,
      };

      expect(workoutHistory.notes).toBeUndefined();
      expect(workoutHistory.supersetParentId).toBeUndefined();
      expect(workoutHistory.altParentId).toBeUndefined();
    });
  });

  describe('WorkoutHistoryData Interface', () => {
    it('extends WorkoutData interface with history properties', () => {
      const workoutHistoryData: WorkoutHistoryData = {
        id: 'history-id',
        workoutId: 'workout-id',
        date: '2024-01-15',
        name: 'Deadlift',
        weight: 315,
        sets: 1,
        reps: 5,
        notes: 'Heavy set',
        supersetParentId: 'parent-id',
        altParentId: 'alt-id',
      };

      expect(workoutHistoryData.workoutId).toBe('workout-id');
      expect(workoutHistoryData.date).toBe('2024-01-15');
      expect(typeof workoutHistoryData.workoutId).toBe('string');
      expect(typeof workoutHistoryData.date).toBe('string');
    });
  });

  describe('WorkoutHistoryConverter', () => {
    describe('toData', () => {
      it('converts WorkoutHistory to WorkoutHistoryData correctly', () => {
        const workoutHistory: WorkoutHistory = {
          id: 'history-id',
          workoutId: 'workout-id',
          date: '2024-01-15',
          name: 'Overhead Press',
          weight: 95,
          sets: 3,
          reps: 12,
          notes: 'Focus on form',
          supersetParentId: 'parent-id',
          altParentId: 'alt-id',
        };

        const workoutHistoryData = WorkoutHistoryConverter.toData(workoutHistory);

        // Workout properties
        expect(workoutHistoryData.id).toBe(workoutHistory.id);
        expect(workoutHistoryData.name).toBe(workoutHistory.name);
        expect(workoutHistoryData.weight).toBe(workoutHistory.weight);
        expect(workoutHistoryData.sets).toBe(workoutHistory.sets);
        expect(workoutHistoryData.reps).toBe(workoutHistory.reps);
        expect(workoutHistoryData.notes).toBe(workoutHistory.notes);
        expect(workoutHistoryData.supersetParentId).toBe(workoutHistory.supersetParentId);
        expect(workoutHistoryData.altParentId).toBe(workoutHistory.altParentId);

        // WorkoutHistory specific properties
        expect(workoutHistoryData.workoutId).toBe(workoutHistory.workoutId);
        expect(workoutHistoryData.date).toBe(workoutHistory.date);
      });

      it('handles optional properties correctly', () => {
        const workoutHistory: WorkoutHistory = {
          id: 'history-id',
          workoutId: 'workout-id',
          date: '2024-01-15',
          name: 'Pull-ups',
          weight: 0,
          sets: 3,
          reps: 8,
        };

        const workoutHistoryData = WorkoutHistoryConverter.toData(workoutHistory);

        expect(workoutHistoryData.workoutId).toBe(workoutHistory.workoutId);
        expect(workoutHistoryData.date).toBe(workoutHistory.date);
        expect(workoutHistoryData.notes).toBeUndefined();
        expect(workoutHistoryData.supersetParentId).toBeUndefined();
        expect(workoutHistoryData.altParentId).toBeUndefined();
      });
    });

    describe('fromData', () => {
      it('converts WorkoutHistoryData to WorkoutHistory correctly', () => {
        const workoutHistoryData: WorkoutHistoryData = {
          id: 'history-id',
          workoutId: 'workout-id',
          date: '2024-01-15',
          name: 'Dips',
          weight: 25,
          sets: 4,
          reps: 10,
          notes: 'Bodyweight + 25lb',
          supersetParentId: 'parent-id',
          altParentId: 'alt-id',
        };

        const workoutHistory = WorkoutHistoryConverter.fromData(workoutHistoryData);

        // Workout properties
        expect(workoutHistory.id).toBe(workoutHistoryData.id);
        expect(workoutHistory.name).toBe(workoutHistoryData.name);
        expect(workoutHistory.weight).toBe(workoutHistoryData.weight);
        expect(workoutHistory.sets).toBe(workoutHistoryData.sets);
        expect(workoutHistory.reps).toBe(workoutHistoryData.reps);
        expect(workoutHistory.notes).toBe(workoutHistoryData.notes);
        expect(workoutHistory.supersetParentId).toBe(workoutHistoryData.supersetParentId);
        expect(workoutHistory.altParentId).toBe(workoutHistoryData.altParentId);

        // WorkoutHistory specific properties
        expect(workoutHistory.workoutId).toBe(workoutHistoryData.workoutId);
        expect(workoutHistory.date).toBe(workoutHistoryData.date);
      });

      it('handles optional properties correctly', () => {
        const workoutHistoryData: WorkoutHistoryData = {
          id: 'history-id',
          workoutId: 'workout-id',
          date: '2024-01-15',
          name: 'Push-ups',
          weight: 0,
          sets: 3,
          reps: 15,
        };

        const workoutHistory = WorkoutHistoryConverter.fromData(workoutHistoryData);

        expect(workoutHistory.workoutId).toBe(workoutHistoryData.workoutId);
        expect(workoutHistory.date).toBe(workoutHistoryData.date);
        expect(workoutHistory.notes).toBeUndefined();
        expect(workoutHistory.supersetParentId).toBeUndefined();
        expect(workoutHistory.altParentId).toBeUndefined();
      });
    });

    describe('Round-trip conversion', () => {
      it('maintains data integrity through conversion cycle', () => {
        const originalWorkoutHistory: WorkoutHistory = {
          id: 'original-history-id',
          workoutId: 'original-workout-id',
          date: '2024-01-15',
          name: 'Barbell Rows',
          weight: 155,
          sets: 4,
          reps: 8,
          notes: 'Keep back straight',
          supersetParentId: 'parent-id',
          altParentId: 'alt-id',
        };

        const convertedToData = WorkoutHistoryConverter.toData(originalWorkoutHistory);
        const convertedBack = WorkoutHistoryConverter.fromData(convertedToData);

        expect(convertedBack.id).toBe(originalWorkoutHistory.id);
        expect(convertedBack.workoutId).toBe(originalWorkoutHistory.workoutId);
        expect(convertedBack.date).toBe(originalWorkoutHistory.date);
        expect(convertedBack.name).toBe(originalWorkoutHistory.name);
        expect(convertedBack.weight).toBe(originalWorkoutHistory.weight);
        expect(convertedBack.sets).toBe(originalWorkoutHistory.sets);
        expect(convertedBack.reps).toBe(originalWorkoutHistory.reps);
        expect(convertedBack.notes).toBe(originalWorkoutHistory.notes);
        expect(convertedBack.supersetParentId).toBe(originalWorkoutHistory.supersetParentId);
        expect(convertedBack.altParentId).toBe(originalWorkoutHistory.altParentId);
      });
    });
  });

  describe('WorkoutHistoryValidator', () => {
    describe('altExists', () => {
      it('returns true when alternative workout exists in history', () => {
        const workoutHistory: WorkoutHistory = {
          id: 'test-history-id',
          workoutId: 'test-workout-id',
          date: '2024-01-15',
          name: 'Test Exercise',
          weight: 100,
          sets: 3,
          reps: 10,
          altParentId: 'parent-workout-id',
        };

        const workoutHistories: WorkoutHistory[] = [
          {
            id: 'parent-history-id',
            workoutId: 'parent-workout-id',
            date: '2024-01-15',
            name: 'Parent Exercise',
            weight: 100,
            sets: 3,
            reps: 10,
          },
          workoutHistory,
        ];

        expect(WorkoutHistoryValidator.altExists(workoutHistory, workoutHistories)).toBe(true);
      });

      it('returns false when alternative workout does not exist in history', () => {
        const workoutHistory: WorkoutHistory = {
          id: 'test-history-id',
          workoutId: 'test-workout-id',
          date: '2024-01-15',
          name: 'Test Exercise',
          weight: 100,
          sets: 3,
          reps: 10,
          altParentId: 'non-existent-workout-id',
        };

        const workoutHistories: WorkoutHistory[] = [
          workoutHistory,
          {
            id: 'other-history-id',
            workoutId: 'other-workout-id',
            date: '2024-01-15',
            name: 'Other Exercise',
            weight: 50,
            sets: 3,
            reps: 10,
          },
        ];

        expect(WorkoutHistoryValidator.altExists(workoutHistory, workoutHistories)).toBe(false);
      });

      it('returns false when no altParentId is specified', () => {
        const workoutHistory: WorkoutHistory = {
          id: 'test-history-id',
          workoutId: 'test-workout-id',
          date: '2024-01-15',
          name: 'Test Exercise',
          weight: 100,
          sets: 3,
          reps: 10,
        };

        const workoutHistories: WorkoutHistory[] = [
          {
            id: 'parent-history-id',
            workoutId: 'parent-workout-id',
            date: '2024-01-15',
            name: 'Parent Exercise',
            weight: 100,
            sets: 3,
            reps: 10,
          },
        ];

        expect(WorkoutHistoryValidator.altExists(workoutHistory, workoutHistories)).toBe(false);
      });
    });

    describe('supersetExists', () => {
      it('returns true when superset workout exists in history', () => {
        const workoutHistory: WorkoutHistory = {
          id: 'test-history-id',
          workoutId: 'test-workout-id',
          date: '2024-01-15',
          name: 'Test Exercise',
          weight: 100,
          sets: 3,
          reps: 10,
          supersetParentId: 'parent-workout-id',
        };

        const workoutHistories: WorkoutHistory[] = [
          {
            id: 'parent-history-id',
            workoutId: 'parent-workout-id',
            date: '2024-01-15',
            name: 'Parent Exercise',
            weight: 100,
            sets: 3,
            reps: 10,
          },
          workoutHistory,
        ];

        expect(WorkoutHistoryValidator.supersetExists(workoutHistory, workoutHistories)).toBe(true);
      });

      it('returns false when superset workout does not exist in history', () => {
        const workoutHistory: WorkoutHistory = {
          id: 'test-history-id',
          workoutId: 'test-workout-id',
          date: '2024-01-15',
          name: 'Test Exercise',
          weight: 100,
          sets: 3,
          reps: 10,
          supersetParentId: 'non-existent-workout-id',
        };

        const workoutHistories: WorkoutHistory[] = [
          workoutHistory,
          {
            id: 'other-history-id',
            workoutId: 'other-workout-id',
            date: '2024-01-15',
            name: 'Other Exercise',
            weight: 50,
            sets: 3,
            reps: 10,
          },
        ];

        expect(WorkoutHistoryValidator.supersetExists(workoutHistory, workoutHistories)).toBe(false);
      });

      it('returns false when no supersetParentId is specified', () => {
        const workoutHistory: WorkoutHistory = {
          id: 'test-history-id',
          workoutId: 'test-workout-id',
          date: '2024-01-15',
          name: 'Test Exercise',
          weight: 100,
          sets: 3,
          reps: 10,
        };

        const workoutHistories: WorkoutHistory[] = [
          {
            id: 'parent-history-id',
            workoutId: 'parent-workout-id',
            date: '2024-01-15',
            name: 'Parent Exercise',
            weight: 100,
            sets: 3,
            reps: 10,
          },
        ];

        expect(WorkoutHistoryValidator.supersetExists(workoutHistory, workoutHistories)).toBe(false);
      });
    });

    describe('isAlternative', () => {
      it('returns true when workout is an alternative to others in workouts list', () => {
        const workoutHistory: WorkoutHistory = {
          id: 'history-id',
          workoutId: 'parent-workout-id',
          date: '2024-01-15',
          name: 'Parent Exercise',
          weight: 100,
          sets: 3,
          reps: 10,
        };

        const workouts: Workout[] = [
          { id: 'parent-workout-id', name: 'Parent', weight: 100, sets: 3, reps: 10 },
          { id: 'alt-workout-id', name: 'Alt', weight: 90, sets: 3, reps: 10, altParentId: 'parent-workout-id' },
        ];

        expect(WorkoutHistoryValidator.isAlternative(workoutHistory, workouts)).toBe(true);
      });

      it('returns false when workout is not an alternative to others', () => {
        const workoutHistory: WorkoutHistory = {
          id: 'history-id',
          workoutId: 'test-workout-id',
          date: '2024-01-15',
          name: 'Test Exercise',
          weight: 100,
          sets: 3,
          reps: 10,
        };

        const workouts: Workout[] = [
          { id: 'test-workout-id', name: 'Test', weight: 100, sets: 3, reps: 10 },
          { id: 'other-workout-id', name: 'Other', weight: 50, sets: 3, reps: 10 },
        ];

        expect(WorkoutHistoryValidator.isAlternative(workoutHistory, workouts)).toBe(false);
      });
    });

    describe('isSuperset', () => {
      it('returns true when workout is a superset to others in workouts list', () => {
        const workoutHistory: WorkoutHistory = {
          id: 'history-id',
          workoutId: 'parent-workout-id',
          date: '2024-01-15',
          name: 'Parent Exercise',
          weight: 100,
          sets: 3,
          reps: 10,
        };

        const workouts: Workout[] = [
          { id: 'parent-workout-id', name: 'Parent', weight: 100, sets: 3, reps: 10 },
          { id: 'superset-workout-id', name: 'Superset', weight: 80, sets: 3, reps: 12, supersetParentId: 'parent-workout-id' },
        ];

        expect(WorkoutHistoryValidator.isSuperset(workoutHistory, workouts)).toBe(true);
      });

      it('returns false when workout is not a superset to others', () => {
        const workoutHistory: WorkoutHistory = {
          id: 'history-id',
          workoutId: 'test-workout-id',
          date: '2024-01-15',
          name: 'Test Exercise',
          weight: 100,
          sets: 3,
          reps: 10,
        };

        const workouts: Workout[] = [
          { id: 'test-workout-id', name: 'Test', weight: 100, sets: 3, reps: 10 },
          { id: 'other-workout-id', name: 'Other', weight: 50, sets: 3, reps: 10 },
        ];

        expect(WorkoutHistoryValidator.isSuperset(workoutHistory, workouts)).toBe(false);
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles different date formats', () => {
      const workoutHistory: WorkoutHistory = {
        id: 'test-id',
        workoutId: 'workout-id',
        date: '2024-12-31',
        name: 'Test Exercise',
        weight: 100,
        sets: 3,
        reps: 10,
      };

      const convertedBack = WorkoutHistoryConverter.fromData(WorkoutHistoryConverter.toData(workoutHistory));
      expect(convertedBack.date).toBe('2024-12-31');
    });

    it('handles empty date string', () => {
      const workoutHistory: WorkoutHistory = {
        id: 'test-id',
        workoutId: 'workout-id',
        date: '',
        name: 'Test Exercise',
        weight: 100,
        sets: 3,
        reps: 10,
      };

      const convertedBack = WorkoutHistoryConverter.fromData(WorkoutHistoryConverter.toData(workoutHistory));
      expect(convertedBack.date).toBe('');
    });

    it('handles long workout IDs', () => {
      const longWorkoutId = 'workout-id-' + 'a'.repeat(100);
      const workoutHistory: WorkoutHistory = {
        id: 'test-id',
        workoutId: longWorkoutId,
        date: '2024-01-15',
        name: 'Test Exercise',
        weight: 100,
        sets: 3,
        reps: 10,
      };

      const convertedBack = WorkoutHistoryConverter.fromData(WorkoutHistoryConverter.toData(workoutHistory));
      expect(convertedBack.workoutId).toBe(longWorkoutId);
    });

    it('handles special characters in IDs', () => {
      const specialId = 'workout-id-!@#$%^&*()_+{}|:"<>?`-=[]\\;\',./~';
      const workoutHistory: WorkoutHistory = {
        id: specialId,
        workoutId: specialId,
        date: '2024-01-15',
        name: 'Test Exercise',
        weight: 100,
        sets: 3,
        reps: 10,
      };

      const convertedBack = WorkoutHistoryConverter.fromData(WorkoutHistoryConverter.toData(workoutHistory));
      expect(convertedBack.id).toBe(specialId);
      expect(convertedBack.workoutId).toBe(specialId);
    });
  });
});

