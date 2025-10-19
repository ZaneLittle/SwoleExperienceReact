import { renderHook, act } from '@testing-library/react-native';
import { useWorkoutData } from '../../hooks/useWorkoutData';
import { workoutService } from '../../lib/services/WorkoutService';
import { workoutHistoryService } from '../../lib/services/WorkoutHistoryService';

// Mock dependencies
jest.mock('../../lib/services/WorkoutService');
jest.mock('../../lib/services/WorkoutHistoryService');

const mockWorkoutService = workoutService as jest.Mocked<typeof workoutService>;
const mockWorkoutHistoryService = workoutHistoryService as jest.Mocked<typeof workoutHistoryService>;

describe('useWorkoutData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockWorkoutService.getWorkouts.mockResolvedValue([]);
    mockWorkoutService.getUniqueDays.mockResolvedValue(2);
    mockWorkoutHistoryService.getWorkoutHistory.mockResolvedValue([]);
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useWorkoutData());

    expect(result.current.workouts).toEqual([]);
    expect(result.current.workoutHistory).toEqual([]);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.currentDay).toBe(1);
    expect(result.current.dayOffset).toBe(0);
    expect(result.current.totalDays).toBe(0);
  });

  it('should load data for current day (offset 0)', async () => {
    const mockWorkouts = [
      { id: '1', name: 'Exercise 1', weight: 100, sets: 3, reps: 10, day: 1, dayOrder: 0 }
    ];
    const mockHistory = [
      { id: 'h1', workoutId: '1', name: 'Exercise 1', weight: 100, sets: 3, reps: 10, date: '2024-01-01' }
    ];

    mockWorkoutService.getWorkouts.mockResolvedValue(mockWorkouts);
    mockWorkoutHistoryService.getWorkoutHistory.mockResolvedValue(mockHistory);

    const { result } = renderHook(() => useWorkoutData());

    await act(async () => {
      await result.current.loadDataForOffset(0);
    });

    expect(result.current.workouts).toEqual(mockWorkouts);
    expect(result.current.workoutHistory).toEqual(mockHistory);
    expect(result.current.isLoading).toBe(false);
    expect(mockWorkoutService.getWorkouts).toHaveBeenCalledWith(1);
    expect(mockWorkoutHistoryService.getWorkoutHistory).toHaveBeenCalled();
  });

  it('should load history for past days (offset < 0)', async () => {
    const mockHistory = [
      { id: 'h1', workoutId: '1', name: 'Exercise 1', weight: 100, sets: 3, reps: 10, date: '2024-01-01' }
    ];

    mockWorkoutHistoryService.getWorkoutHistory.mockResolvedValue(mockHistory);

    const { result } = renderHook(() => useWorkoutData());

    await act(async () => {
      await result.current.loadDataForOffset(-1);
    });

    expect(result.current.workouts).toEqual([]);
    expect(result.current.workoutHistory).toEqual(mockHistory);
    expect(result.current.isLoading).toBe(false);
    expect(mockWorkoutService.getWorkouts).not.toHaveBeenCalled();
    expect(mockWorkoutHistoryService.getWorkoutHistory).toHaveBeenCalled();
  });

  it('should load future workouts for future days (offset > 0)', async () => {
    const mockWorkouts = [
      { id: '1', name: 'Future Exercise', weight: 120, sets: 3, reps: 10, day: 2, dayOrder: 0 }
    ];

    mockWorkoutService.getWorkouts.mockResolvedValue(mockWorkouts);

    const { result } = renderHook(() => useWorkoutData());
    
    // Set totalDays to enable future day calculation
    act(() => {
      result.current.setTotalDays(3);
    });

    await act(async () => {
      await result.current.loadDataForOffset(1);
    });

    expect(result.current.workouts).toEqual(mockWorkouts);
    expect(result.current.workoutHistory).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(mockWorkoutService.getWorkouts).toHaveBeenCalledWith(2);
    expect(mockWorkoutHistoryService.getWorkoutHistory).not.toHaveBeenCalled();
  });

  it('should handle day wrapping for future days', async () => {
    const mockWorkouts = [
      { id: '1', name: 'Wrapped Exercise', weight: 120, sets: 3, reps: 10, day: 1, dayOrder: 0 }
    ];

    mockWorkoutService.getWorkouts.mockResolvedValue(mockWorkouts);

    const { result } = renderHook(() => useWorkoutData());
    
    // Set currentDay to 2 and totalDays to 2, so offset 1 should wrap to day 1
    act(() => {
      result.current.setCurrentDay(2);
      result.current.setTotalDays(2);
    });

    await act(async () => {
      await result.current.loadDataForOffset(1);
    });

    expect(mockWorkoutService.getWorkouts).toHaveBeenCalledWith(1);
  });

  it('should handle day navigation correctly', () => {
    const { result } = renderHook(() => useWorkoutData());

    act(() => {
      result.current.handleDayNavigation(-1);
    });

    expect(result.current.dayOffset).toBe(-1);

    act(() => {
      result.current.handleDayNavigation(2);
    });

    expect(result.current.dayOffset).toBe(1);
  });

  it('should load initial data correctly', async () => {
    const mockWorkouts = [
      { id: '1', name: 'Initial Exercise', weight: 100, sets: 3, reps: 10, day: 1, dayOrder: 0 }
    ];

    mockWorkoutService.getWorkouts.mockResolvedValue(mockWorkouts);
    mockWorkoutService.getUniqueDays.mockResolvedValue(3);
    mockWorkoutHistoryService.getWorkoutHistory.mockResolvedValue([]);

    const { result } = renderHook(() => useWorkoutData());

    await act(async () => {
      await result.current.loadInitialData();
    });

    expect(result.current.totalDays).toBe(3);
    expect(result.current.isLoading).toBe(false);
    expect(mockWorkoutService.getWorkouts).toHaveBeenCalledWith(1);
    expect(mockWorkoutService.getUniqueDays).toHaveBeenCalled();
  });

  it('should handle errors gracefully', async () => {
    mockWorkoutService.getWorkouts.mockRejectedValue(new Error('Service error'));

    const { result } = renderHook(() => useWorkoutData());

    await act(async () => {
      try {
        await result.current.loadDataForOffset(0);
      } catch (error) {
        // Error should be thrown
      }
    });

    expect(result.current.isLoading).toBe(false);
  });
});
