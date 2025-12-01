import { renderHook, act } from '@testing-library/react-native'
import { useWorkoutForm } from '../../hooks/useWorkoutForm'
import { workoutService } from '../../lib/services/WorkoutService'
import { confirmAlert, confirmDelete } from '../../utils/confirm'

// Mock dependencies
jest.mock('../../lib/services/WorkoutService')
jest.mock('../../utils/confirm', () => ({
  confirmAlert: jest.fn(),
  confirmDelete: jest.fn(),
}))

const mockWorkoutService = workoutService as jest.Mocked<typeof workoutService>
const mockConfirmAlert = confirmAlert as jest.MockedFunction<typeof confirmAlert>
const mockConfirmDelete = confirmDelete as jest.MockedFunction<typeof confirmDelete>

describe('useWorkoutForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default mock implementations
    mockWorkoutService.removeWorkout.mockResolvedValue(true)
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useWorkoutForm())

    expect(result.current.showForm).toBe(false)
    expect(result.current.editingWorkout).toBeUndefined()
    expect(typeof result.current.handleAddWorkout).toBe('function')
    expect(typeof result.current.handleEditWorkout).toBe('function')
    expect(typeof result.current.handleDeleteWorkout).toBe('function')
    expect(typeof result.current.handleSaveWorkout).toBe('function')
    expect(typeof result.current.handleCancelForm).toBe('function')
  })

  it('should handle add workout', () => {
    const { result } = renderHook(() => useWorkoutForm())

    act(() => {
      result.current.handleAddWorkout()
    })

    expect(result.current.showForm).toBe(true)
    expect(result.current.editingWorkout).toBeUndefined()
  })

  it('should handle edit workout', () => {
    const mockWorkout = {
      id: '1',
      name: 'Exercise 1',
      weight: 100,
      sets: 3,
      reps: 10,
      day: 1,
      dayOrder: 0,
    }

    const { result } = renderHook(() => useWorkoutForm())

    act(() => {
      result.current.handleEditWorkout(mockWorkout)
    })

    expect(result.current.showForm).toBe(true)
    expect(result.current.editingWorkout).toEqual(mockWorkout)
  })

  it('should handle delete workout successfully', async () => {
    const mockWorkout = {
      id: '1',
      name: 'Exercise 1',
      weight: 100,
      sets: 3,
      reps: 10,
      day: 1,
      dayOrder: 0,
    }

    const mockOnRefresh = jest.fn()
    let confirmCallback: (() => void) | undefined

    mockConfirmDelete.mockImplementation((title, message, onConfirm) => {
      confirmCallback = onConfirm
    })

    const { result } = renderHook(() => useWorkoutForm())

    act(() => {
      result.current.handleDeleteWorkout(mockWorkout, mockOnRefresh)
    })

    expect(mockConfirmDelete).toHaveBeenCalledWith(
      'Delete Workout',
      'Are you sure you want to delete this workout?',
      expect.any(Function),
    )

    // Simulate user confirming the deletion
    await act(async () => {
      if (confirmCallback) {
        await confirmCallback()
      }
    })

    expect(mockWorkoutService.removeWorkout).toHaveBeenCalledWith('1')
    expect(mockOnRefresh).toHaveBeenCalled()
    expect(mockConfirmAlert).not.toHaveBeenCalled()
  })

  it('should handle delete workout failure', async () => {
    const mockWorkout = {
      id: '1',
      name: 'Exercise 1',
      weight: 100,
      sets: 3,
      reps: 10,
      day: 1,
      dayOrder: 0,
    }

    mockWorkoutService.removeWorkout.mockResolvedValue(false)
    const mockOnRefresh = jest.fn()
    let confirmCallback: (() => void) | undefined

    mockConfirmDelete.mockImplementation((title, message, onConfirm) => {
      confirmCallback = onConfirm
    })

    const { result } = renderHook(() => useWorkoutForm())

    act(() => {
      result.current.handleDeleteWorkout(mockWorkout, mockOnRefresh)
    })

    expect(mockConfirmDelete).toHaveBeenCalled()

    // Simulate user confirming the deletion
    await act(async () => {
      if (confirmCallback) {
        await confirmCallback()
      }
    })

    expect(mockWorkoutService.removeWorkout).toHaveBeenCalledWith('1')
    expect(mockOnRefresh).not.toHaveBeenCalled()
    expect(mockConfirmAlert).toHaveBeenCalledWith('Error', 'Failed to delete workout')
  })

  it('should handle delete workout error', async () => {
    const mockWorkout = {
      id: '1',
      name: 'Exercise 1',
      weight: 100,
      sets: 3,
      reps: 10,
      day: 1,
      dayOrder: 0,
    }

    mockWorkoutService.removeWorkout.mockRejectedValue(new Error('Service error'))
    const mockOnRefresh = jest.fn()
    let confirmCallback: (() => void) | undefined

    mockConfirmDelete.mockImplementation((title, message, onConfirm) => {
      confirmCallback = onConfirm
    })

    const { result } = renderHook(() => useWorkoutForm())

    act(() => {
      result.current.handleDeleteWorkout(mockWorkout, mockOnRefresh)
    })

    expect(mockConfirmDelete).toHaveBeenCalled()

    // Simulate user confirming the deletion
    await act(async () => {
      if (confirmCallback) {
        await confirmCallback()
      }
    })

    expect(mockWorkoutService.removeWorkout).toHaveBeenCalledWith('1')
    expect(mockOnRefresh).not.toHaveBeenCalled()
    expect(mockConfirmAlert).toHaveBeenCalledWith('Error', 'Failed to delete workout')
  })

  it('should handle save workout', () => {
    const mockOnRefresh = jest.fn()
    const _mockWorkout = {
      id: '1',
      name: 'Exercise 1',
      weight: 100,
      sets: 3,
      reps: 10,
      day: 1,
      dayOrder: 0,
    }

    const { result } = renderHook(() => useWorkoutForm())

    // Set form as visible first
    act(() => {
      result.current.setShowForm(true)
    })

    act(() => {
      result.current.handleSaveWorkout(mockOnRefresh)
    })

    expect(result.current.showForm).toBe(false)
    expect(mockOnRefresh).toHaveBeenCalled()
  })

  it('should handle cancel form', () => {
    const mockWorkout = {
      id: '1',
      name: 'Exercise 1',
      weight: 100,
      sets: 3,
      reps: 10,
      day: 1,
      dayOrder: 0,
    }

    const { result } = renderHook(() => useWorkoutForm())

    // Set form as visible and editing first
    act(() => {
      result.current.setShowForm(true)
      result.current.setEditingWorkout(mockWorkout)
    })

    act(() => {
      result.current.handleCancelForm()
    })

    expect(result.current.showForm).toBe(false)
    expect(result.current.editingWorkout).toBeUndefined()
  })
})
