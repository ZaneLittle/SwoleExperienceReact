import React from 'react';
import { Alert } from 'react-native';
import { workoutService } from '../../../lib/services/WorkoutService';
import { workoutHistoryService } from '../../../lib/services/WorkoutHistoryService';
import { WorkoutDay } from '../../../lib/models/WorkoutDay';
import { WorkoutHistory } from '../../../lib/models/WorkoutHistory';

// Mock dependencies
jest.mock('../../../lib/services/WorkoutService');
jest.mock('../../../lib/services/WorkoutHistoryService');
jest.mock('../../../lib/models/WorkoutHistory', () => ({
  WorkoutHistoryService: {
    workoutDayToHistory: jest.fn((workout) => ({
      id: 'history-id',
      workoutDayId: workout.id,
      name: workout.name,
      weight: workout.weight,
      sets: workout.sets,
      reps: workout.reps,
      date: '2023-01-01',
    })),
  },
}));

// React Native is already mocked in jest.setup.js
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));
jest.mock('../../../hooks/useThemeColors', () => ({
  useThemeColors: () => ({
    background: '#ffffff',
    card: '#f5f5f5',
    surface: '#f5f5f5',
    text: { primary: '#000000', secondary: '#666666' },
    primary: '#007AFF',
    accent: '#007AFF',
    border: '#e0e0e0',
  }),
}));

const mockWorkoutService = workoutService as jest.Mocked<typeof workoutService>;
const mockWorkoutHistoryService = workoutHistoryService as jest.Mocked<typeof workoutHistoryService>;

// Mock Alert
const mockAlert = Alert.alert as jest.MockedFunction<typeof Alert.alert>;

// Helper to create mock workout day
const createMockWorkoutDay = (overrides?: Partial<WorkoutDay>): WorkoutDay => ({
  id: 'test-workout-1',
  name: 'Test Exercise',
  weight: 100,
  sets: 3,
  reps: 10,
  day: 1,
  dayOrder: 0,
  ...overrides,
});

// Helper to create mock workout history
const createMockWorkoutHistory = (overrides?: Partial<WorkoutHistory>): WorkoutHistory => ({
  id: 'test-history-1',
  workoutId: 'test-workout-1',
  name: 'Test Exercise',
  weight: 100,
  sets: 3,
  reps: 10,
  date: '2024-01-01',
  ...overrides,
});

describe('WorkoutsScreen Service Logic Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockWorkoutService.getCurrentDay.mockResolvedValue(1);
    mockWorkoutService.getWorkouts.mockResolvedValue([]);
    mockWorkoutService.getUniqueDays.mockResolvedValue(2);
    mockWorkoutService.setCurrentDay.mockResolvedValue(true);
    mockWorkoutHistoryService.getWorkoutHistory.mockResolvedValue([]);
  });

  describe('Current Day Persistence Logic', () => {
    it('should load saved current day correctly', async () => {
      mockWorkoutService.getCurrentDay.mockResolvedValue(3);
      mockWorkoutService.getWorkouts.mockResolvedValue([
        createMockWorkoutDay({ day: 3, name: 'Day 3 Exercise' })
      ]);

      const currentDay = await mockWorkoutService.getCurrentDay();
      const workouts = await mockWorkoutService.getWorkouts(currentDay);

      expect(currentDay).toBe(3);
      expect(workouts).toHaveLength(1);
      expect(workouts[0].name).toBe('Day 3 Exercise');
      expect(mockWorkoutService.getCurrentDay).toHaveBeenCalledTimes(1);
      expect(mockWorkoutService.getWorkouts).toHaveBeenCalledWith(3);
    });

    it('should default to day 1 when no saved day exists', async () => {
      mockWorkoutService.getCurrentDay.mockResolvedValue(1);
      mockWorkoutService.getWorkouts.mockResolvedValue([]);

      const currentDay = await mockWorkoutService.getCurrentDay();
      const workouts = await mockWorkoutService.getWorkouts(currentDay);

      expect(currentDay).toBe(1);
      expect(workouts).toHaveLength(0);
      expect(mockWorkoutService.getCurrentDay).toHaveBeenCalledTimes(1);
      expect(mockWorkoutService.getWorkouts).toHaveBeenCalledWith(1);
    });

    it('should handle getCurrentDay failure gracefully', async () => {
      mockWorkoutService.getCurrentDay.mockRejectedValue(new Error('Storage error'));
      mockWorkoutService.getWorkouts.mockResolvedValue([]);

      try {
        await mockWorkoutService.getCurrentDay();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Storage error');
      }

      // Should still be able to call getWorkouts with default day 1
      const workouts = await mockWorkoutService.getWorkouts(1);
      expect(workouts).toHaveLength(0);
    });
  });

  describe('Complete Day Functionality Logic', () => {
    it('should complete day and move to next day correctly', async () => {
      const mockWorkouts = [
        createMockWorkoutDay({ day: 1, name: 'Day 1 Exercise 1' }),
        createMockWorkoutDay({ day: 1, name: 'Day 1 Exercise 2' })
      ];

      mockWorkoutService.getCurrentDay.mockResolvedValue(1);
      mockWorkoutService.getWorkouts.mockResolvedValue(mockWorkouts);
      mockWorkoutService.getUniqueDays.mockResolvedValue(3);
      mockWorkoutService.setCurrentDay.mockResolvedValue(true);
      mockWorkoutHistoryService.createWorkoutHistory.mockResolvedValue(true);

      // Simulate the complete day logic
      const currentDay = await mockWorkoutService.getCurrentDay();
      const workouts = await mockWorkoutService.getWorkouts(currentDay);
      const totalDays = await mockWorkoutService.getUniqueDays();

      expect(workouts).toHaveLength(2);

      // Convert workouts to history
      for (const workout of workouts) {
        await mockWorkoutHistoryService.createWorkoutHistory({
          id: 'history-id',
          workoutId: workout.id,
          name: workout.name,
          weight: workout.weight,
          sets: workout.sets,
          reps: workout.reps,
          date: '2024-01-01',
        });
      }

      // Move to next day
      const nextDay = currentDay < totalDays ? currentDay + 1 : 1;
      const success = await mockWorkoutService.setCurrentDay(nextDay);

      expect(nextDay).toBe(2);
      expect(success).toBe(true);
      expect(mockWorkoutService.setCurrentDay).toHaveBeenCalledWith(2);
      expect(mockWorkoutHistoryService.createWorkoutHistory).toHaveBeenCalledTimes(2);
    });

    it('should wrap to day 1 when completing last day', async () => {
      const mockWorkouts = [createMockWorkoutDay({ day: 3, name: 'Day 3 Exercise' })];

      mockWorkoutService.getCurrentDay.mockResolvedValue(3);
      mockWorkoutService.getWorkouts.mockResolvedValue(mockWorkouts);
      mockWorkoutService.getUniqueDays.mockResolvedValue(3);
      mockWorkoutService.setCurrentDay.mockResolvedValue(true);
      mockWorkoutHistoryService.createWorkoutHistory.mockResolvedValue(true);

      // Simulate the complete day logic
      const currentDay = await mockWorkoutService.getCurrentDay();
      const workouts = await mockWorkoutService.getWorkouts(currentDay);
      const totalDays = await mockWorkoutService.getUniqueDays();

      // Convert workouts to history
      for (const workout of workouts) {
        await mockWorkoutHistoryService.createWorkoutHistory({
          id: 'history-id',
          workoutId: workout.id,
          name: workout.name,
          weight: workout.weight,
          sets: workout.sets,
          reps: workout.reps,
          date: '2024-01-01',
        });
      }

      // Move to next day (should wrap to 1)
      const nextDay = currentDay < totalDays ? currentDay + 1 : 1;
      const success = await mockWorkoutService.setCurrentDay(nextDay);

      expect(nextDay).toBe(1);
      expect(success).toBe(true);
      expect(mockWorkoutService.setCurrentDay).toHaveBeenCalledWith(1);
    });

    it('should handle setCurrentDay failure', async () => {
      const mockWorkouts = [createMockWorkoutDay({ day: 1, name: 'Day 1 Exercise' })];

      mockWorkoutService.getCurrentDay.mockResolvedValue(1);
      mockWorkoutService.getWorkouts.mockResolvedValue(mockWorkouts);
      mockWorkoutService.getUniqueDays.mockResolvedValue(2);
      mockWorkoutService.setCurrentDay.mockResolvedValue(false);
      mockWorkoutHistoryService.createWorkoutHistory.mockResolvedValue(true);

      // Simulate the complete day logic
      const currentDay = await mockWorkoutService.getCurrentDay();
      const workouts = await mockWorkoutService.getWorkouts(currentDay);
      const totalDays = await mockWorkoutService.getUniqueDays();

      // Convert workouts to history
      for (const workout of workouts) {
        await mockWorkoutHistoryService.createWorkoutHistory({
          id: 'history-id',
          workoutId: workout.id,
          name: workout.name,
          weight: workout.weight,
          sets: workout.sets,
          reps: workout.reps,
          date: '2024-01-01',
        });
      }

      // Move to next day
      const nextDay = currentDay < totalDays ? currentDay + 1 : 1;
      const success = await mockWorkoutService.setCurrentDay(nextDay);

      expect(nextDay).toBe(2);
      expect(success).toBe(false);
      expect(mockWorkoutService.setCurrentDay).toHaveBeenCalledWith(2);
    });
  });

  describe('Error Handling Logic', () => {
    it('should handle workout loading errors', async () => {
      mockWorkoutService.getCurrentDay.mockResolvedValue(1);
      mockWorkoutService.getWorkouts.mockRejectedValue(new Error('Workouts error'));

      try {
        const currentDay = await mockWorkoutService.getCurrentDay();
        await mockWorkoutService.getWorkouts(currentDay);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Workouts error');
      }
    });

    it('should handle history loading errors', async () => {
      mockWorkoutService.getCurrentDay.mockResolvedValue(1);
      mockWorkoutService.getWorkouts.mockResolvedValue([]);
      mockWorkoutHistoryService.getWorkoutHistory.mockRejectedValue(new Error('History error'));

      try {
        const currentDay = await mockWorkoutService.getCurrentDay();
        await mockWorkoutService.getWorkouts(currentDay);
        await mockWorkoutHistoryService.getWorkoutHistory('2024-01-01');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('History error');
      }
    });

    it('should handle unique days loading errors', async () => {
      mockWorkoutService.getCurrentDay.mockResolvedValue(1);
      mockWorkoutService.getWorkouts.mockResolvedValue([]);
      mockWorkoutService.getUniqueDays.mockRejectedValue(new Error('Unique days error'));

      try {
        const currentDay = await mockWorkoutService.getCurrentDay();
        await mockWorkoutService.getWorkouts(currentDay);
        await mockWorkoutService.getUniqueDays();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Unique days error');
      }
    });
  });

  describe('Day Navigation Logic', () => {
    it('should calculate day offsets correctly', () => {
      const currentDay = 2;
      const dayOffset = 0;
      
      const getDayText = (offset: number) => {
        switch (offset) {
          case 0: return 'Today';
          case -1: return 'Yesterday';
          case 1: return 'Tomorrow';
          default:
            return offset > 0 
              ? `In ${offset} Days` 
              : `${Math.abs(offset)} Days Ago`;
        }
      };

      expect(getDayText(0)).toBe('Today');
      expect(getDayText(-1)).toBe('Yesterday');
      expect(getDayText(1)).toBe('Tomorrow');
      expect(getDayText(-2)).toBe('2 Days Ago');
      expect(getDayText(3)).toBe('In 3 Days');
    });

    it('should handle day navigation logic correctly', () => {
      const currentDay = 2;
      const totalDays = 3;
      
      const handleDayNavigation = (currentOffset: number, offset: number) => {
        const newOffset = currentOffset + offset;
        
        if (newOffset === 0) {
          return { day: currentDay, offset: newOffset };
        } else if (newOffset < 0) {
          // Past dates - should load history
          return { day: currentDay, offset: newOffset, loadHistory: true };
        } else {
          // Future dates - should load scheduled workouts
          const futureDay = ((currentDay - 1 + newOffset) % totalDays) + 1;
          return { day: futureDay, offset: newOffset, loadFuture: true };
        }
      };

      // Test going back to today
      expect(handleDayNavigation(-1, 1)).toEqual({ day: 2, offset: 0 });
      
      // Test going to past
      expect(handleDayNavigation(0, -1)).toEqual({ day: 2, offset: -1, loadHistory: true });
      
      // Test going to future
      expect(handleDayNavigation(0, 1)).toEqual({ day: 3, offset: 1, loadFuture: true });
      
      // Test wrapping around
      expect(handleDayNavigation(0, 2)).toEqual({ day: 1, offset: 2, loadFuture: true });
    });
  });
});