import { renderHook, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { useWorkoutForm } from '../../hooks/useWorkoutForm';
import { workoutService } from '../../lib/services/WorkoutService';

// Mock dependencies
jest.mock('../../lib/services/WorkoutService');

const mockWorkoutService = workoutService as jest.Mocked<typeof workoutService>;
const mockAlert = Alert.alert as jest.MockedFunction<typeof Alert.alert>;

describe('useWorkoutForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockWorkoutService.removeWorkout.mockResolvedValue(true);
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useWorkoutForm());

    expect(result.current.showForm).toBe(false);
    expect(result.current.editingWorkout).toBeUndefined();
    expect(typeof result.current.handleAddWorkout).toBe('function');
    expect(typeof result.current.handleEditWorkout).toBe('function');
    expect(typeof result.current.handleDeleteWorkout).toBe('function');
    expect(typeof result.current.handleSaveWorkout).toBe('function');
    expect(typeof result.current.handleCancelForm).toBe('function');
  });

  it('should handle add workout', () => {
    const { result } = renderHook(() => useWorkoutForm());

    act(() => {
      result.current.handleAddWorkout();
    });

    expect(result.current.showForm).toBe(true);
    expect(result.current.editingWorkout).toBeUndefined();
  });

  it('should handle edit workout', () => {
    const mockWorkout = {
      id: '1',
      name: 'Exercise 1',
      weight: 100,
      sets: 3,
      reps: 10,
      day: 1,
      dayOrder: 0
    };

    const { result } = renderHook(() => useWorkoutForm());

    act(() => {
      result.current.handleEditWorkout(mockWorkout);
    });

    expect(result.current.showForm).toBe(true);
    expect(result.current.editingWorkout).toEqual(mockWorkout);
  });

  it('should handle delete workout successfully', async () => {
    const mockWorkout = {
      id: '1',
      name: 'Exercise 1',
      weight: 100,
      sets: 3,
      reps: 10,
      day: 1,
      dayOrder: 0
    };

    const mockOnRefresh = jest.fn();

    const { result } = renderHook(() => useWorkoutForm());

    await act(async () => {
      await result.current.handleDeleteWorkout(mockWorkout, mockOnRefresh);
    });

    expect(mockWorkoutService.removeWorkout).toHaveBeenCalledWith('1');
    expect(mockOnRefresh).toHaveBeenCalled();
    expect(mockAlert).not.toHaveBeenCalled();
  });

  it('should handle delete workout failure', async () => {
    const mockWorkout = {
      id: '1',
      name: 'Exercise 1',
      weight: 100,
      sets: 3,
      reps: 10,
      day: 1,
      dayOrder: 0
    };

    mockWorkoutService.removeWorkout.mockResolvedValue(false);
    const mockOnRefresh = jest.fn();

    const { result } = renderHook(() => useWorkoutForm());

    await act(async () => {
      await result.current.handleDeleteWorkout(mockWorkout, mockOnRefresh);
    });

    expect(mockWorkoutService.removeWorkout).toHaveBeenCalledWith('1');
    expect(mockOnRefresh).not.toHaveBeenCalled();
    expect(mockAlert).toHaveBeenCalledWith('Error', 'Failed to delete workout');
  });

  it('should handle delete workout error', async () => {
    const mockWorkout = {
      id: '1',
      name: 'Exercise 1',
      weight: 100,
      sets: 3,
      reps: 10,
      day: 1,
      dayOrder: 0
    };

    mockWorkoutService.removeWorkout.mockRejectedValue(new Error('Service error'));
    const mockOnRefresh = jest.fn();

    const { result } = renderHook(() => useWorkoutForm());

    await act(async () => {
      await result.current.handleDeleteWorkout(mockWorkout, mockOnRefresh);
    });

    expect(mockWorkoutService.removeWorkout).toHaveBeenCalledWith('1');
    expect(mockOnRefresh).not.toHaveBeenCalled();
    expect(mockAlert).toHaveBeenCalledWith('Error', 'Failed to delete workout');
  });

  it('should handle save workout', () => {
    const mockOnRefresh = jest.fn();
    const mockWorkout = {
      id: '1',
      name: 'Exercise 1',
      weight: 100,
      sets: 3,
      reps: 10,
      day: 1,
      dayOrder: 0
    };

    const { result } = renderHook(() => useWorkoutForm());

    // Set form as visible first
    act(() => {
      result.current.setShowForm(true);
    });

    act(() => {
      result.current.handleSaveWorkout(mockOnRefresh);
    });

    expect(result.current.showForm).toBe(false);
    expect(mockOnRefresh).toHaveBeenCalled();
  });

  it('should handle cancel form', () => {
    const mockWorkout = {
      id: '1',
      name: 'Exercise 1',
      weight: 100,
      sets: 3,
      reps: 10,
      day: 1,
      dayOrder: 0
    };

    const { result } = renderHook(() => useWorkoutForm());

    // Set form as visible and editing first
    act(() => {
      result.current.setShowForm(true);
      result.current.setEditingWorkout(mockWorkout);
    });

    act(() => {
      result.current.handleCancelForm();
    });

    expect(result.current.showForm).toBe(false);
    expect(result.current.editingWorkout).toBeUndefined();
  });
});
