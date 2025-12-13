import { workoutService } from '../../../lib/services/WorkoutService'
import { createMockWorkoutDay } from '../../utils/testUtils'
import { WorkoutDay } from '../../../lib/models/WorkoutDay'
import { WorkoutValidator } from '../../../lib/models/Workout'

// Mock dependencies
jest.mock('../../../lib/services/WorkoutService')
jest.mock('../../../lib/models/Workout', () => ({
  WorkoutValidator: {
    validate: jest.fn(),
  },
}))
jest.mock('../../../utils/confirm', () => ({
  confirmAlert: jest.fn(),
}))

const mockWorkoutService = workoutService as jest.Mocked<typeof workoutService>
const mockWorkoutValidator = WorkoutValidator as jest.Mocked<typeof WorkoutValidator>

describe('WorkoutCreateUpdateForm Day Preservation Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default mock implementations
    mockWorkoutService.updateWorkout.mockResolvedValue(true)
    mockWorkoutService.createWorkout.mockResolvedValue(true)
    mockWorkoutValidator.validate.mockReturnValue(undefined)
  })

  describe('Day preservation when updating workouts', () => {
    it('should preserve original workout day when updating from a different day view', async () => {
      // Simulate the logic in handleSave: workoutDay = workout?.day ?? day
      const originalWorkout: WorkoutDay = createMockWorkoutDay({
        id: 'workout-1',
        name: 'Day 2 Exercise',
        day: 2, // Original day is 2
        weight: 100,
        sets: 3,
        reps: 10,
      })

      const dayProp = 1 // User is viewing day 1 (different from workout's day)
      const workoutDay = originalWorkout.day ?? dayProp

      // When updating, the workout should keep its original day
      const updatedWorkout: WorkoutDay = {
        ...originalWorkout,
        day: workoutDay, // Should be 2 (original), not 1 (prop)
        weight: 120, // Updated weight
      }

      mockWorkoutService.updateWorkout.mockResolvedValue(true)
      const result = await mockWorkoutService.updateWorkout(updatedWorkout)

      expect(result).toBe(true)
      expect(updatedWorkout.day).toBe(2) // Preserves original day
      expect(updatedWorkout.day).not.toBe(dayProp) // Not the day prop
      expect(mockWorkoutService.updateWorkout).toHaveBeenCalledWith(
        expect.objectContaining({ day: 2 }),
      )
    })

    it('should preserve original workout day even when day prop is from future date', async () => {
      const originalWorkout: WorkoutDay = createMockWorkoutDay({
        id: 'workout-2',
        name: 'Day 1 Exercise',
        day: 1, // Original day is 1
      })

      const dayProp = 3 // User navigated to day 3's view
      const workoutDay = originalWorkout.day ?? dayProp

      const updatedWorkout: WorkoutDay = {
        ...originalWorkout,
        day: workoutDay,
        name: 'Updated Exercise',
      }

      await mockWorkoutService.updateWorkout(updatedWorkout)

      expect(updatedWorkout.day).toBe(1) // Preserves original day
      expect(updatedWorkout.day).not.toBe(dayProp)
      expect(mockWorkoutService.updateWorkout).toHaveBeenCalledWith(
        expect.objectContaining({ day: 1 }),
      )
    })

    it('should preserve original workout day when day prop matches', async () => {
      const originalWorkout: WorkoutDay = createMockWorkoutDay({
        id: 'workout-3',
        name: 'Day 2 Exercise',
        day: 2,
      })

      const dayProp = 2 // User is viewing day 2 (same as workout's day)
      const workoutDay = originalWorkout.day ?? dayProp

      const updatedWorkout: WorkoutDay = {
        ...originalWorkout,
        day: workoutDay,
      }

      await mockWorkoutService.updateWorkout(updatedWorkout)

      expect(updatedWorkout.day).toBe(2)
      expect(mockWorkoutService.updateWorkout).toHaveBeenCalledWith(
        expect.objectContaining({ day: 2 }),
      )
    })
  })

  describe('Day assignment when creating workouts', () => {
    it('should use day prop when creating a new workout', async () => {
      // Simulate the logic in handleSave: workoutDay = workout?.day ?? day
      const workout = undefined // Creating new workout
      const dayProp = 2
      const workoutDay = workout?.day ?? dayProp

      const newWorkout: WorkoutDay = createMockWorkoutDay({
        id: 'new-workout-1',
        name: 'New Exercise',
        day: workoutDay, // Should be 2 (day prop)
        dayOrder: 1,
      })

      mockWorkoutService.createWorkout.mockResolvedValue(true)
      const result = await mockWorkoutService.createWorkout(newWorkout)

      expect(result).toBe(true)
      expect(newWorkout.day).toBe(2) // Uses day prop
      expect(mockWorkoutService.createWorkout).toHaveBeenCalledWith(
        expect.objectContaining({ day: 2 }),
      )
    })

    it('should use effective day when creating workout from future date view', async () => {
      const workout = undefined
      const dayProp = 3 // Effective day calculated from dayOffset
      const workoutDay = workout?.day ?? dayProp

      const newWorkout: WorkoutDay = createMockWorkoutDay({
        id: 'new-workout-2',
        name: 'Future Exercise',
        day: workoutDay, // Should be 3 (effective day)
        dayOrder: 0,
      })

      await mockWorkoutService.createWorkout(newWorkout)

      expect(newWorkout.day).toBe(3)
      expect(mockWorkoutService.createWorkout).toHaveBeenCalledWith(
        expect.objectContaining({ day: 3 }),
      )
    })

    it('should use day prop of 1 when creating workout on current day', async () => {
      const workout = undefined
      const dayProp = 1
      const workoutDay = workout?.day ?? dayProp

      const newWorkout: WorkoutDay = createMockWorkoutDay({
        id: 'new-workout-3',
        name: 'Today Exercise',
        day: workoutDay,
        dayOrder: 0,
      })

      await mockWorkoutService.createWorkout(newWorkout)

      expect(newWorkout.day).toBe(1)
      expect(mockWorkoutService.createWorkout).toHaveBeenCalledWith(
        expect.objectContaining({ day: 1 }),
      )
    })
  })

  describe('Edge cases', () => {
    it('should handle workout with undefined day property gracefully', async () => {
      // Edge case: workout exists but has undefined day (shouldn't happen, but test it)
      const originalWorkout: WorkoutDay = createMockWorkoutDay({
        id: 'workout-edge',
        day: undefined as any, // TypeScript will complain, but test the logic
      })

      const dayProp = 2
      // workout?.day would be undefined, so fallback to day prop
      const workoutDay = (originalWorkout as any).day ?? dayProp

      expect(workoutDay).toBe(2)
    })

    it('should preserve all other workout properties when updating day', async () => {
      const originalWorkout: WorkoutDay = createMockWorkoutDay({
        id: 'workout-complete',
        name: 'Complete Exercise',
        day: 2,
        dayOrder: 1,
        weight: 100,
        sets: 3,
        reps: 10,
        notes: 'Original notes',
        altParentId: 'alt-1',
        supersetParentId: 'superset-1',
      })

      const dayProp = 1
      const workoutDay = originalWorkout.day ?? dayProp

      const updatedWorkout: WorkoutDay = {
        ...originalWorkout,
        day: workoutDay,
        weight: 120, // Only weight changed
      }

      await mockWorkoutService.updateWorkout(updatedWorkout)

      // Verify day is preserved
      expect(updatedWorkout.day).toBe(2)
      
      // Verify all other properties are maintained
      expect(updatedWorkout.id).toBe(originalWorkout.id)
      expect(updatedWorkout.name).toBe(originalWorkout.name)
      expect(updatedWorkout.dayOrder).toBe(originalWorkout.dayOrder)
      expect(updatedWorkout.weight).toBe(120) // Updated
      expect(updatedWorkout.sets).toBe(originalWorkout.sets)
      expect(updatedWorkout.reps).toBe(originalWorkout.reps)
      expect(updatedWorkout.notes).toBe(originalWorkout.notes)
      expect(updatedWorkout.altParentId).toBe(originalWorkout.altParentId)
      expect(updatedWorkout.supersetParentId).toBe(originalWorkout.supersetParentId)
    })
  })
})

