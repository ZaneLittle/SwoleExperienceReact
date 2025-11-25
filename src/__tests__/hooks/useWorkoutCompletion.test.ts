import { renderHook, act } from '@testing-library/react-native';
import { useWorkoutCompletion } from '../../hooks/useWorkoutCompletion';
import { workoutService } from '../../lib/services/WorkoutService';
import { workoutHistoryService, WorkoutHistoryService } from '../../lib/services/WorkoutHistoryService';
import { confirmAlert } from '../../utils/confirm';

// Mock dependencies
jest.mock('../../lib/services/WorkoutService');
jest.mock('../../lib/services/WorkoutHistoryService');
jest.mock('../../utils/confirm', () => ({
  confirmAlert: jest.fn(),
}));

const mockWorkoutService = workoutService as jest.Mocked<typeof workoutService>;
const mockWorkoutHistoryService = workoutHistoryService as jest.Mocked<typeof workoutHistoryService>;
const mockConfirmAlert = confirmAlert as jest.MockedFunction<typeof confirmAlert>;

// Mock WorkoutHistoryService static method
jest.mock('../../lib/services/WorkoutHistoryService', () => ({
  ...jest.requireActual('../../lib/services/WorkoutHistoryService'),
  WorkoutHistoryService: {
    workoutDayToHistory: jest.fn((workout) => ({
      id: 'history-id',
      workoutId: workout.id,
      name: workout.name,
      weight: workout.weight,
      sets: workout.sets,
      reps: workout.reps,
      date: '2024-01-01',
    })),
  },
}));

describe('useWorkoutCompletion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockWorkoutService.setCurrentDay.mockResolvedValue(true);
    mockWorkoutHistoryService.createBulkWorkoutHistories = jest.fn().mockResolvedValue(true);
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useWorkoutCompletion());

    expect(result.current.isCompletingDay).toBe(false);
    expect(typeof result.current.completeWorkoutDay).toBe('function');
  });

  it('should complete workout day successfully', async () => {
    const mockWorkouts = [
      { id: '1', name: 'Exercise 1', weight: 100, sets: 3, reps: 10, day: 1, dayOrder: 0 },
      { id: '2', name: 'Exercise 2', weight: 120, sets: 3, reps: 8, day: 1, dayOrder: 1 }
    ];

    const mockOnComplete = jest.fn();

    const { result } = renderHook(() => useWorkoutCompletion());

    await act(async () => {
      await result.current.completeWorkoutDay(mockWorkouts, 1, 3, mockOnComplete);
    });

    expect(result.current.isCompletingDay).toBe(false);
    expect(mockWorkoutHistoryService.createBulkWorkoutHistories).toHaveBeenCalledTimes(1);
    expect(mockWorkoutHistoryService.createBulkWorkoutHistories).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'history-id', workoutId: '1', name: 'Exercise 1' }),
      expect.objectContaining({ id: 'history-id', workoutId: '2', name: 'Exercise 2' })
    ]);
    expect(mockWorkoutService.setCurrentDay).toHaveBeenCalledWith(2);
    expect(mockConfirmAlert).toHaveBeenCalledWith('Success', 'Workout day completed! Moved to day 2.');
    expect(mockOnComplete).toHaveBeenCalledWith(2);
  });

  it('should wrap to day 1 when completing last day', async () => {
    const mockWorkouts = [
      { id: '1', name: 'Exercise 1', weight: 100, sets: 3, reps: 10, day: 3, dayOrder: 0 }
    ];

    const mockOnComplete = jest.fn();

    const { result } = renderHook(() => useWorkoutCompletion());

    await act(async () => {
      await result.current.completeWorkoutDay(mockWorkouts, 3, 3, mockOnComplete);
    });

    expect(mockWorkoutService.setCurrentDay).toHaveBeenCalledWith(1);
    expect(mockConfirmAlert).toHaveBeenCalledWith('Success', 'Workout day completed! Moved to day 1.');
    expect(mockOnComplete).toHaveBeenCalledWith(1);
  });

  it('should complete empty day successfully', async () => {
    const mockOnComplete = jest.fn();

    const { result } = renderHook(() => useWorkoutCompletion());

    await act(async () => {
      await result.current.completeWorkoutDay([], 1, 3, mockOnComplete);
    });

    expect(mockWorkoutService.setCurrentDay).toHaveBeenCalledWith(2);
    expect(mockWorkoutHistoryService.createBulkWorkoutHistories).not.toHaveBeenCalled();
    expect(mockConfirmAlert).toHaveBeenCalledWith('Success', 'Day 1 completed (no workouts). Moved to day 2.');
    expect(mockOnComplete).toHaveBeenCalledWith(2);
  });

  it('should complete empty day and wrap to day 1 when on last day', async () => {
    const mockOnComplete = jest.fn();

    const { result } = renderHook(() => useWorkoutCompletion());

    await act(async () => {
      await result.current.completeWorkoutDay([], 3, 3, mockOnComplete);
    });

    expect(mockWorkoutService.setCurrentDay).toHaveBeenCalledWith(1);
    expect(mockWorkoutHistoryService.createBulkWorkoutHistories).not.toHaveBeenCalled();
    expect(mockConfirmAlert).toHaveBeenCalledWith('Success', 'Day 3 completed (no workouts). Moved to day 1.');
    expect(mockOnComplete).toHaveBeenCalledWith(1);
  });

  it('should complete day with workouts and show different message', async () => {
    const mockWorkouts = [
      { id: '1', name: 'Exercise 1', weight: 100, sets: 3, reps: 10, day: 1, dayOrder: 0 }
    ];
    const mockOnComplete = jest.fn();

    const { result } = renderHook(() => useWorkoutCompletion());

    await act(async () => {
      await result.current.completeWorkoutDay(mockWorkouts, 1, 3, mockOnComplete);
    });

    expect(mockWorkoutService.setCurrentDay).toHaveBeenCalledWith(2);
    expect(mockWorkoutHistoryService.createBulkWorkoutHistories).toHaveBeenCalledTimes(1);
    expect(mockConfirmAlert).toHaveBeenCalledWith('Success', 'Workout day completed! Moved to day 2.');
    expect(mockOnComplete).toHaveBeenCalledWith(2);
  });

  it('should handle setCurrentDay failure', async () => {
    const mockWorkouts = [
      { id: '1', name: 'Exercise 1', weight: 100, sets: 3, reps: 10, day: 1, dayOrder: 0 }
    ];

    mockWorkoutService.setCurrentDay.mockResolvedValue(false);
    const mockOnComplete = jest.fn();

    const { result } = renderHook(() => useWorkoutCompletion());

    await act(async () => {
      await result.current.completeWorkoutDay(mockWorkouts, 1, 3, mockOnComplete);
    });

    expect(result.current.isCompletingDay).toBe(false);
    expect(mockWorkoutHistoryService.createBulkWorkoutHistories).toHaveBeenCalledTimes(1);
    expect(mockWorkoutService.setCurrentDay).toHaveBeenCalledWith(2);
    expect(mockConfirmAlert).toHaveBeenCalledWith('Success', 'Workout day completed! Moved to day 2.');
    expect(mockOnComplete).toHaveBeenCalledWith(2);
  });

  it('should handle errors gracefully', async () => {
    const mockWorkouts = [
      { id: '1', name: 'Exercise 1', weight: 100, sets: 3, reps: 10, day: 1, dayOrder: 0 }
    ];

    mockWorkoutService.setCurrentDay.mockRejectedValue(new Error('Storage error'));
    const mockOnComplete = jest.fn();

    const { result } = renderHook(() => useWorkoutCompletion());

    await act(async () => {
      await result.current.completeWorkoutDay(mockWorkouts, 1, 3, mockOnComplete);
    });

    expect(result.current.isCompletingDay).toBe(false);
    expect(mockConfirmAlert).toHaveBeenCalledWith('Error', 'Failed to complete workout day');
    expect(mockOnComplete).not.toHaveBeenCalled();
  });

  it('should set completing state during execution', async () => {
    const mockWorkouts = [
      { id: '1', name: 'Exercise 1', weight: 100, sets: 3, reps: 10, day: 1, dayOrder: 0 }
    ];

    const mockOnComplete = jest.fn();

    const { result } = renderHook(() => useWorkoutCompletion());

    await act(async () => {
      await result.current.completeWorkoutDay(mockWorkouts, 1, 3, mockOnComplete);
    });

    // After completion, it should be false
    expect(result.current.isCompletingDay).toBe(false);
    expect(mockOnComplete).toHaveBeenCalledWith(2);
  });

  it('should handle bulk workout history creation failure', async () => {
    const mockWorkouts = [
      { id: '1', name: 'Exercise 1', weight: 100, sets: 3, reps: 10, day: 1, dayOrder: 0 },
      { id: '2', name: 'Exercise 2', weight: 120, sets: 3, reps: 8, day: 1, dayOrder: 1 }
    ];

    mockWorkoutHistoryService.createBulkWorkoutHistories.mockResolvedValue(false);
    const mockOnComplete = jest.fn();

    const { result } = renderHook(() => useWorkoutCompletion());

    await act(async () => {
      await result.current.completeWorkoutDay(mockWorkouts, 1, 3, mockOnComplete);
    });

    expect(result.current.isCompletingDay).toBe(false);
    expect(mockWorkoutHistoryService.createBulkWorkoutHistories).toHaveBeenCalledTimes(1);
    expect(mockWorkoutService.setCurrentDay).not.toHaveBeenCalled();
    expect(mockConfirmAlert).toHaveBeenCalledWith('Error', 'Failed to complete workout day');
    expect(mockOnComplete).not.toHaveBeenCalled();
  });

  it('should use bulk method to prevent race conditions', async () => {
    const mockWorkouts = [
      { id: '1', name: 'Exercise 1', weight: 100, sets: 3, reps: 10, day: 1, dayOrder: 0 },
      { id: '2', name: 'Exercise 2', weight: 120, sets: 3, reps: 8, day: 1, dayOrder: 1 },
      { id: '3', name: 'Exercise 3', weight: 140, sets: 3, reps: 6, day: 1, dayOrder: 2 }
    ];

    const mockOnComplete = jest.fn();

    const { result } = renderHook(() => useWorkoutCompletion());

    await act(async () => {
      await result.current.completeWorkoutDay(mockWorkouts, 1, 3, mockOnComplete);
    });

    // Verify that createBulkWorkoutHistories was called once with all workouts
    expect(mockWorkoutHistoryService.createBulkWorkoutHistories).toHaveBeenCalledTimes(1);
    expect(mockWorkoutHistoryService.createBulkWorkoutHistories).toHaveBeenCalledWith([
      expect.objectContaining({ workoutId: '1', name: 'Exercise 1' }),
      expect.objectContaining({ workoutId: '2', name: 'Exercise 2' }),
      expect.objectContaining({ workoutId: '3', name: 'Exercise 3' })
    ]);

    // Verify all workouts were converted to history with the same date
    const callArgs = mockWorkoutHistoryService.createBulkWorkoutHistories.mock.calls[0][0];
    expect(callArgs).toHaveLength(3);
    expect(callArgs[0].date).toBe(callArgs[1].date); // Same date for all
    expect(callArgs[1].date).toBe(callArgs[2].date);
  });
});
