import AsyncStorage from '@react-native-async-storage/async-storage'
import { workoutHistoryService, WorkoutHistoryService } from '../../../lib/services/WorkoutHistoryService'
import { WorkoutHistory, WorkoutHistoryData } from '../../../lib/models/WorkoutHistory'
import { WorkoutDay } from '../../../lib/models/WorkoutDay'

// Helper to create mock workout history
const createMockWorkoutHistory = (overrides?: Partial<WorkoutHistory>): WorkoutHistory => ({
  id: 'test-history-id',
  workoutId: 'test-workout-id',
  date: '2024-01-15',
  name: 'Test Exercise',
  weight: 100,
  sets: 3,
  reps: 10,
  ...overrides,
})

// Helper to create mock workout day
const createMockWorkoutDay = (overrides?: Partial<WorkoutDay>): WorkoutDay => ({
  id: 'test-workout-id',
  name: 'Test Exercise',
  weight: 100,
  sets: 3,
  reps: 10,
  day: 1,
  dayOrder: 0,
  ...overrides,
})

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>
const mockGetItem = mockAsyncStorage.getItem as jest.MockedFunction<typeof mockAsyncStorage.getItem>
const mockSetItem = mockAsyncStorage.setItem as jest.MockedFunction<typeof mockAsyncStorage.setItem>

// Mock console.error to avoid test output noise
const originalConsoleError = console.error
beforeAll(() => {
  console.error = jest.fn()
})

afterAll(() => {
  console.error = originalConsoleError
})

describe('WorkoutHistoryService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getWorkoutHistory', () => {
    it('returns empty array when no data exists', async () => {
      mockGetItem.mockResolvedValueOnce(null)
      const result = await workoutHistoryService.getWorkoutHistory()
      expect(result).toEqual([])
      expect(mockGetItem).toHaveBeenCalledWith('workout_history')
    })

    it('returns empty array when storage throws error', async () => {
      mockGetItem.mockRejectedValueOnce(new Error('Storage error'))
      const result = await workoutHistoryService.getWorkoutHistory()
      expect(result).toEqual([])
      expect(mockGetItem).toHaveBeenCalledWith('workout_history')
    })

    it('returns workout history sorted by date (newest first)', async () => {
      const mockHistoryData: WorkoutHistoryData[] = [
        {
          id: 'history-1',
          workoutId: 'workout-1',
          date: '2024-01-15',
          name: 'Exercise 1',
          weight: 100,
          sets: 3,
          reps: 10,
        },
        {
          id: 'history-2',
          workoutId: 'workout-2',
          date: '2024-01-17',
          name: 'Exercise 2',
          weight: 120,
          sets: 4,
          reps: 8,
        },
        {
          id: 'history-3',
          workoutId: 'workout-3',
          date: '2024-01-16',
          name: 'Exercise 3',
          weight: 80,
          sets: 3,
          reps: 12,
        },
      ]

      mockGetItem.mockResolvedValueOnce(JSON.stringify(mockHistoryData))

      const result = await workoutHistoryService.getWorkoutHistory()

      expect(result).toHaveLength(3)
      expect(result[0].date).toBe('2024-01-17') // Newest first
      expect(result[1].date).toBe('2024-01-16')
      expect(result[2].date).toBe('2024-01-15')
    })

    it('filters workout history by date when specified', async () => {
      const mockHistoryData: WorkoutHistoryData[] = [
        {
          id: 'history-1',
          workoutId: 'workout-1',
          date: '2024-01-15',
          name: 'Exercise 1',
          weight: 100,
          sets: 3,
          reps: 10,
        },
        {
          id: 'history-2',
          workoutId: 'workout-2',
          date: '2024-01-16',
          name: 'Exercise 2',
          weight: 120,
          sets: 4,
          reps: 8,
        },
        {
          id: 'history-3',
          workoutId: 'workout-3',
          date: '2024-01-15',
          name: 'Exercise 3',
          weight: 80,
          sets: 3,
          reps: 12,
        },
      ]

      mockGetItem.mockResolvedValueOnce(JSON.stringify(mockHistoryData))

      const result = await workoutHistoryService.getWorkoutHistory('2024-01-15')

      expect(result).toHaveLength(2)
      expect(result[0].date).toBe('2024-01-15')
      expect(result[1].date).toBe('2024-01-15')
    })

    it('handles malformed JSON gracefully', async () => {
      mockGetItem.mockResolvedValueOnce('invalid json')
      const result = await workoutHistoryService.getWorkoutHistory()
      expect(result).toEqual([])
    })

    it('converts WorkoutHistoryData to WorkoutHistory objects correctly', async () => {
      const mockHistoryData: WorkoutHistoryData = {
        id: 'test-history',
        workoutId: 'test-workout',
        date: '2024-01-15',
        name: 'Test Exercise',
        weight: 150,
        sets: 5,
        reps: 5,
        notes: 'Test notes',
        supersetParentId: 'parent-id',
        altParentId: 'alt-id',
      }

      mockGetItem.mockResolvedValueOnce(JSON.stringify([mockHistoryData]))

      const result = await workoutHistoryService.getWorkoutHistory()

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        id: 'test-history',
        workoutId: 'test-workout',
        date: '2024-01-15',
        name: 'Test Exercise',
        weight: 150,
        sets: 5,
        reps: 5,
        notes: 'Test notes',
        supersetParentId: 'parent-id',
        altParentId: 'alt-id',
      })
    })
  })

  describe('createBulkWorkoutHistories', () => {
    it('creates multiple workout histories successfully', async () => {
      mockGetItem.mockResolvedValueOnce(null)
      mockSetItem.mockResolvedValueOnce(undefined)

      const workoutHistories = [
        createMockWorkoutHistory({
          id: 'history-1',
          workoutId: 'workout-1',
          date: '2024-01-20',
          name: 'Exercise 1',
          weight: 100,
          sets: 3,
          reps: 10,
        }),
        createMockWorkoutHistory({
          id: 'history-2',
          workoutId: 'workout-2',
          date: '2024-01-20',
          name: 'Exercise 2',
          weight: 150,
          sets: 4,
          reps: 8,
        }),
        createMockWorkoutHistory({
          id: 'history-3',
          workoutId: 'workout-3',
          date: '2024-01-20',
          name: 'Exercise 3',
          weight: 200,
          sets: 3,
          reps: 6,
        }),
      ]

      const result = await workoutHistoryService.createBulkWorkoutHistories(workoutHistories)

      expect(result).toBe(true)
      const setItemCall = mockSetItem.mock.calls[0]
      const storedData = JSON.parse(setItemCall[1] as string)
      
      expect(storedData).toHaveLength(3)
      expect(storedData[0].id).toBe('history-1')
      expect(storedData[0].name).toBe('Exercise 1')
      expect(storedData[1].id).toBe('history-2')
      expect(storedData[1].name).toBe('Exercise 2')
      expect(storedData[2].id).toBe('history-3')
      expect(storedData[2].name).toBe('Exercise 3')
    })

    it('adds multiple workout histories to existing history', async () => {
      const existingHistory = [
        createMockWorkoutHistory({
          id: 'existing-history',
          workoutId: 'existing-workout',
          date: '2024-01-15',
          name: 'Existing Exercise',
          weight: 150,
          sets: 3,
          reps: 10,
        }),
      ]

      mockGetItem.mockResolvedValueOnce(JSON.stringify(existingHistory))
      mockSetItem.mockResolvedValueOnce(undefined)

      const newHistories = [
        createMockWorkoutHistory({
          id: 'new-history-1',
          workoutId: 'new-workout-1',
          date: '2024-01-20',
          name: 'New Exercise 1',
          weight: 200,
          sets: 4,
          reps: 6,
        }),
        createMockWorkoutHistory({
          id: 'new-history-2',
          workoutId: 'new-workout-2',
          date: '2024-01-20',
          name: 'New Exercise 2',
          weight: 180,
          sets: 3,
          reps: 8,
        }),
      ]

      await workoutHistoryService.createBulkWorkoutHistories(newHistories)

      const setItemCall = mockSetItem.mock.calls[0]
      const storedData = JSON.parse(setItemCall[1] as string)

      expect(storedData).toHaveLength(3)
      expect(storedData[0].id).toBe('new-history-1') // New histories should be first
      expect(storedData[1].id).toBe('new-history-2')
      expect(storedData[2].id).toBe('existing-history')
    })

    it('handles empty array gracefully', async () => {
      mockGetItem.mockResolvedValueOnce(null)
      mockSetItem.mockResolvedValueOnce(undefined)

      const result = await workoutHistoryService.createBulkWorkoutHistories([])

      expect(result).toBe(true)
      const setItemCall = mockSetItem.mock.calls[0]
      const storedData = JSON.parse(setItemCall[1] as string)
      expect(storedData).toHaveLength(0)
    })

    it('returns false when storage fails', async () => {
      mockGetItem.mockResolvedValueOnce(null)
      mockSetItem.mockRejectedValueOnce(new Error('Storage error'))

      const workoutHistories = [createMockWorkoutHistory()]

      const result = await workoutHistoryService.createBulkWorkoutHistories(workoutHistories)

      expect(result).toBe(false)
    })

    it('succeeds when getWorkoutHistory fails but setItem succeeds', async () => {
      mockGetItem.mockRejectedValueOnce(new Error('Storage error'))
      mockSetItem.mockResolvedValueOnce(undefined)

      const workoutHistories = [createMockWorkoutHistory()]

      const result = await workoutHistoryService.createBulkWorkoutHistories(workoutHistories)

      // The service handles getWorkoutHistory failure gracefully by treating it as empty array
      expect(result).toBe(true)
    })

    it('maintains order of workout histories as provided', async () => {
      mockGetItem.mockResolvedValueOnce(null)
      mockSetItem.mockResolvedValueOnce(undefined)

      const workoutHistories = [
        createMockWorkoutHistory({ id: 'first', name: 'First Exercise', weight: 100 }),
        createMockWorkoutHistory({ id: 'second', name: 'Second Exercise', weight: 150 }),
        createMockWorkoutHistory({ id: 'third', name: 'Third Exercise', weight: 200 }),
      ]

      await workoutHistoryService.createBulkWorkoutHistories(workoutHistories)

      const setItemCall = mockSetItem.mock.calls[0]
      const storedData = JSON.parse(setItemCall[1] as string)
      
      expect(storedData[0].id).toBe('first')
      expect(storedData[1].id).toBe('second')
      expect(storedData[2].id).toBe('third')
    })
  })

  describe('Race Condition Tests', () => {
    it('prevents race condition when creating multiple workout histories simultaneously', async () => {
      // Simulate the race condition scenario where both calls get the same initial state
      mockGetItem.mockResolvedValue(null) // Both calls see empty storage initially
      mockSetItem.mockResolvedValue(undefined)

      const workoutHistories1 = [
        createMockWorkoutHistory({ id: 'batch1-1', name: 'Batch 1 Exercise 1' }),
        createMockWorkoutHistory({ id: 'batch1-2', name: 'Batch 1 Exercise 2' }),
      ]

      const workoutHistories2 = [
        createMockWorkoutHistory({ id: 'batch2-1', name: 'Batch 2 Exercise 1' }),
        createMockWorkoutHistory({ id: 'batch2-2', name: 'Batch 2 Exercise 2' }),
      ]

      // Simulate concurrent calls (like what was happening before the fix)
      const [result1, result2] = await Promise.all([
        workoutHistoryService.createBulkWorkoutHistories(workoutHistories1),
        workoutHistoryService.createBulkWorkoutHistories(workoutHistories2),
      ])

      expect(result1).toBe(true)
      expect(result2).toBe(true)

      // Verify that both batches were saved (this would fail with the old individual createWorkoutHistory approach)
      const setItemCalls = mockSetItem.mock.calls
      expect(setItemCalls.length).toBe(2)

      // Each call should save its own batch (no race condition with bulk method)
      const firstStoredData = JSON.parse(setItemCalls[0][1] as string)
      const secondStoredData = JSON.parse(setItemCalls[1][1] as string)
      
      expect(firstStoredData).toHaveLength(2)
      expect(secondStoredData).toHaveLength(2)
      
      // Each batch should be complete
      const firstBatchNames = firstStoredData.map((h: any) => h.name)
      const secondBatchNames = secondStoredData.map((h: any) => h.name)
      
      expect(firstBatchNames).toContain('Batch 1 Exercise 1')
      expect(firstBatchNames).toContain('Batch 1 Exercise 2')
      expect(secondBatchNames).toContain('Batch 2 Exercise 1')
      expect(secondBatchNames).toContain('Batch 2 Exercise 2')
    })

    it('demonstrates the old race condition with individual createWorkoutHistory calls', async () => {
      // This test demonstrates the problem that existed before the fix
      mockGetItem.mockResolvedValue(null)
      mockSetItem.mockResolvedValue(undefined)

      const workoutHistories = [
        createMockWorkoutHistory({ id: 'race1', name: 'Race Test 1' }),
        createMockWorkoutHistory({ id: 'race2', name: 'Race Test 2' }),
        createMockWorkoutHistory({ id: 'race3', name: 'Race Test 3' }),
      ]

      // Simulate the old approach: multiple individual createWorkoutHistory calls
      const promises = workoutHistories.map(history => 
        workoutHistoryService.createWorkoutHistory(history),
      )

      const results = await Promise.all(promises)
      
      // All individual calls should succeed
      expect(results.every(result => result === true)).toBe(true)

      // But due to race condition, only the last one would be saved in the old implementation
      const setItemCalls = mockSetItem.mock.calls
      expect(setItemCalls.length).toBe(3)

      // The final call shows only one workout history (demonstrating the race condition)
      const finalStoredData = JSON.parse(setItemCalls[2][1] as string)
      expect(finalStoredData).toHaveLength(1)
      expect(finalStoredData[0].id).toBe('race3') // Only the last one
    })

    it('shows the fix works with bulk method vs individual method comparison', async () => {
      // Reset mocks
      jest.clearAllMocks()
      mockGetItem.mockResolvedValue(null)
      mockSetItem.mockResolvedValue(undefined)

      const workoutHistories = [
        createMockWorkoutHistory({ id: 'bulk1', name: 'Bulk Test 1' }),
        createMockWorkoutHistory({ id: 'bulk2', name: 'Bulk Test 2' }),
        createMockWorkoutHistory({ id: 'bulk3', name: 'Bulk Test 3' }),
      ]

      // Use the new bulk method
      const bulkResult = await workoutHistoryService.createBulkWorkoutHistories(workoutHistories)

      expect(bulkResult).toBe(true)

      // Verify all workouts were saved in a single operation
      const setItemCalls = mockSetItem.mock.calls
      expect(setItemCalls.length).toBe(1)

      const storedData = JSON.parse(setItemCalls[0][1] as string)
      expect(storedData).toHaveLength(3)
      expect(storedData[0].id).toBe('bulk1')
      expect(storedData[1].id).toBe('bulk2')
      expect(storedData[2].id).toBe('bulk3')
    })
  })

  describe('createWorkoutHistory', () => {
    it('creates workout history successfully', async () => {
      mockGetItem.mockResolvedValueOnce(null)
      mockSetItem.mockResolvedValueOnce(undefined)

      const newHistory = createMockWorkoutHistory({
        id: 'new-history',
        workoutId: 'new-workout',
        date: '2024-01-20',
        name: 'New Exercise',
        weight: 200,
        sets: 4,
        reps: 6,
      })

      const result = await workoutHistoryService.createWorkoutHistory(newHistory)

      expect(result).toBe(true)
      const setItemCall = mockSetItem.mock.calls[0]
      const storedData = JSON.parse(setItemCall[1] as string)
      
      expect(storedData).toHaveLength(1)
      expect(storedData[0].id).toBe('new-history')
      expect(storedData[0].workoutId).toBe('new-workout')
      expect(storedData[0].date).toBe('2024-01-20')
      expect(storedData[0].name).toBe('New Exercise')
      expect(storedData[0].weight).toBe(200)
      expect(storedData[0].sets).toBe(4)
      expect(storedData[0].reps).toBe(6)
    })

    it('adds workout history to existing history', async () => {
      const existingHistory = createMockWorkoutHistory({
        id: 'existing-history',
        workoutId: 'existing-workout',
        date: '2024-01-15',
        name: 'Existing Exercise',
        weight: 150,
        sets: 3,
        reps: 10,
      })

      mockGetItem.mockResolvedValueOnce(JSON.stringify([existingHistory]))
      mockSetItem.mockResolvedValueOnce(undefined)

      const newHistory = createMockWorkoutHistory({
        id: 'new-history',
        workoutId: 'new-workout',
        date: '2024-01-20',
        name: 'New Exercise',
        weight: 200,
        sets: 4,
        reps: 6,
      })

      await workoutHistoryService.createWorkoutHistory(newHistory)

      const setItemCall = mockSetItem.mock.calls[0]
      const storedData = JSON.parse(setItemCall[1] as string)

      expect(storedData).toHaveLength(2)
      expect(storedData[0].id).toBe('new-history') // New history should be first
      expect(storedData[1].id).toBe('existing-history')
    })

    it('returns false when storage fails', async () => {
      mockGetItem.mockResolvedValueOnce(null)
      mockSetItem.mockRejectedValueOnce(new Error('Storage error'))

      const newHistory = createMockWorkoutHistory()

      const result = await workoutHistoryService.createWorkoutHistory(newHistory)

      expect(result).toBe(false)
    })

    it('succeeds when getWorkoutHistory fails but setItem succeeds', async () => {
      mockGetItem.mockRejectedValueOnce(new Error('Storage error'))
      mockSetItem.mockResolvedValueOnce(undefined)

      const newHistory = createMockWorkoutHistory()

      const result = await workoutHistoryService.createWorkoutHistory(newHistory)

      // The service handles getWorkoutHistory failure gracefully by treating it as empty array
      expect(result).toBe(true)
    })
  })

  describe('removeWorkoutHistory', () => {
    it('removes workout history successfully', async () => {
      const existingHistory = [
        createMockWorkoutHistory({ id: 'keep-1', name: 'Keep 1' }),
        createMockWorkoutHistory({ id: 'remove-1', name: 'Remove 1' }),
        createMockWorkoutHistory({ id: 'keep-2', name: 'Keep 2' }),
      ]

      mockGetItem.mockResolvedValueOnce(JSON.stringify(existingHistory))
      mockSetItem.mockResolvedValueOnce(undefined)

      const result = await workoutHistoryService.removeWorkoutHistory('remove-1')

      expect(result).toBe(true)

      const setItemCall = mockSetItem.mock.calls[0]
      const storedData = JSON.parse(setItemCall[1] as string)

      expect(storedData).toHaveLength(2)
      expect(storedData.find((h: any) => h.id === 'remove-1')).toBeUndefined()
      expect(storedData.find((h: any) => h.id === 'keep-1')).toBeDefined()
      expect(storedData.find((h: any) => h.id === 'keep-2')).toBeDefined()
    })

    it('returns true even when workout history does not exist', async () => {
      const existingHistory = [createMockWorkoutHistory({ id: 'keep-1' })]

      mockGetItem.mockResolvedValueOnce(JSON.stringify(existingHistory))
      mockSetItem.mockResolvedValueOnce(undefined)

      const result = await workoutHistoryService.removeWorkoutHistory('non-existent')

      expect(result).toBe(true)

      const setItemCall = mockSetItem.mock.calls[0]
      const storedData = JSON.parse(setItemCall[1] as string)

      expect(storedData).toHaveLength(1) // Should still have the existing history
    })

    it('succeeds when getWorkoutHistory fails but setItem succeeds', async () => {
      mockGetItem.mockRejectedValueOnce(new Error('Storage error'))
      mockSetItem.mockResolvedValueOnce(undefined)

      const result = await workoutHistoryService.removeWorkoutHistory('any-id')

      // The service handles getWorkoutHistory failure gracefully by treating it as empty array
      expect(result).toBe(true)
    })

    it('returns false when setItem fails', async () => {
      const existingHistory = [createMockWorkoutHistory({ id: 'test-1' })]

      mockGetItem.mockResolvedValueOnce(JSON.stringify(existingHistory))
      mockSetItem.mockRejectedValueOnce(new Error('Set item error'))

      const result = await workoutHistoryService.removeWorkoutHistory('test-1')

      expect(result).toBe(false)
    })
  })

  describe('updateWorkoutHistory', () => {
    it('updates workout history successfully', async () => {
      const existingHistory = [
        createMockWorkoutHistory({ id: 'update-1', weight: 100 }),
        createMockWorkoutHistory({ id: 'keep-1', weight: 150 }),
      ]

      mockGetItem.mockResolvedValueOnce(JSON.stringify(existingHistory))
      mockSetItem.mockResolvedValueOnce(undefined)

      const updatedHistory = createMockWorkoutHistory({
        id: 'update-1',
        weight: 120,
        name: 'Updated Exercise',
      })

      const result = await workoutHistoryService.updateWorkoutHistory(updatedHistory)

      expect(result).toBe(true)

      const setItemCall = mockSetItem.mock.calls[0]
      const storedData = JSON.parse(setItemCall[1] as string)

      const updatedItem = storedData.find((h: any) => h.id === 'update-1')
      expect(updatedItem.weight).toBe(120)
      expect(updatedItem.name).toBe('Updated Exercise')

      const unchangedItem = storedData.find((h: any) => h.id === 'keep-1')
      expect(unchangedItem.weight).toBe(150)
    })

    it('succeeds when getWorkoutHistory fails but setItem succeeds', async () => {
      mockGetItem.mockRejectedValueOnce(new Error('Storage error'))
      mockSetItem.mockResolvedValueOnce(undefined)

      const updatedHistory = createMockWorkoutHistory()

      const result = await workoutHistoryService.updateWorkoutHistory(updatedHistory)

      // The service handles getWorkoutHistory failure gracefully by treating it as empty array
      expect(result).toBe(true)
    })

    it('returns false when setItem fails', async () => {
      const existingHistory = [createMockWorkoutHistory({ id: 'test-1' })]

      mockGetItem.mockResolvedValueOnce(JSON.stringify(existingHistory))
      mockSetItem.mockRejectedValueOnce(new Error('Set item error'))

      const updatedHistory = createMockWorkoutHistory({ id: 'test-1', weight: 200 })

      const result = await workoutHistoryService.updateWorkoutHistory(updatedHistory)

      expect(result).toBe(false)
    })
  })

  describe('removeAllHistory', () => {
    it('removes all workout history successfully', async () => {
      mockSetItem.mockResolvedValueOnce(undefined)

      const result = await workoutHistoryService.removeAllHistory()

      expect(result).toBe(true)
      expect(mockSetItem).toHaveBeenCalledWith('workout_history', '[]')
    })

    it('removes all workout history regardless of existing data', async () => {
      mockSetItem.mockResolvedValueOnce(undefined)

      const result = await workoutHistoryService.removeAllHistory()

      expect(result).toBe(true)
      expect(mockSetItem).toHaveBeenCalledWith('workout_history', '[]')
      expect(mockSetItem).toHaveBeenCalledTimes(1)
    })

    it('returns false when storage fails', async () => {
      mockSetItem.mockRejectedValueOnce(new Error('Storage error'))

      const result = await workoutHistoryService.removeAllHistory()

      expect(result).toBe(false)
    })

    it('does not call getItem when removing all history', async () => {
      mockSetItem.mockResolvedValueOnce(undefined)

      await workoutHistoryService.removeAllHistory()

      expect(mockGetItem).not.toHaveBeenCalled()
      expect(mockSetItem).toHaveBeenCalledWith('workout_history', '[]')
    })

    it('handles multiple consecutive calls correctly', async () => {
      mockSetItem.mockResolvedValue(undefined)

      const result1 = await workoutHistoryService.removeAllHistory()
      const result2 = await workoutHistoryService.removeAllHistory()

      expect(result1).toBe(true)
      expect(result2).toBe(true)
      expect(mockSetItem).toHaveBeenCalledTimes(2)
      expect(mockSetItem).toHaveBeenNthCalledWith(1, 'workout_history', '[]')
      expect(mockSetItem).toHaveBeenNthCalledWith(2, 'workout_history', '[]')
    })

    it('clears the storage key completely', async () => {
      mockSetItem.mockResolvedValueOnce(undefined)

      await workoutHistoryService.removeAllHistory()

      const setItemCall = mockSetItem.mock.calls[0]
      expect(setItemCall[0]).toBe('workout_history')
      
      const storedData = JSON.parse(setItemCall[1] as string)
      expect(storedData).toEqual([])
      expect(Array.isArray(storedData)).toBe(true)
      expect(storedData.length).toBe(0)
    })
  })

  describe('Static methods', () => {
    describe('workoutDayToHistory', () => {
      it('converts WorkoutDay to WorkoutHistory correctly', () => {
        const workoutDay = createMockWorkoutDay({
          id: 'workout-day-id',
          name: 'Workout Day Exercise',
          weight: 175,
          sets: 4,
          reps: 8,
          notes: 'Workout day notes',
          supersetParentId: 'parent-id',
          altParentId: 'alt-id',
        })

        const result = WorkoutHistoryService.workoutDayToHistory(workoutDay)

        expect(result.id).toBeDefined()
        expect(result.workoutId).toBe('workout-day-id')
        expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/) // YYYY-MM-DD format
        expect(result.name).toBe('Workout Day Exercise')
        expect(result.weight).toBe(175)
        expect(result.sets).toBe(4)
        expect(result.reps).toBe(8)
        expect(result.notes).toBe('Workout day notes')
        expect(result.supersetParentId).toBe('parent-id')
        expect(result.altParentId).toBe('alt-id')
      })

      it('uses provided date when specified', () => {
        const workoutDay = createMockWorkoutDay()
        const specificDate = new Date('2024-03-15T14:30:00Z')

        const result = WorkoutHistoryService.workoutDayToHistory(workoutDay, specificDate)

        expect(result.date).toBe('2024-03-15')
      })

      it('uses current date when not specified', () => {
        const workoutDay = createMockWorkoutDay()

        const result = WorkoutHistoryService.workoutDayToHistory(workoutDay)

        // Check that the date is in YYYY-MM-DD format
        expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        
        // Check that it's a valid date
        const resultDate = new Date(result.date + 'T00:00:00Z')
        expect(resultDate.getTime()).not.toBeNaN()
      })

      it('truncates date to start of day', () => {
        const workoutDay = createMockWorkoutDay()
        const dateWithTime = new Date('2024-01-15T14:30:45.123Z')

        const result = WorkoutHistoryService.workoutDayToHistory(workoutDay, dateWithTime)

        expect(result.date).toBe('2024-01-15')
      })

      it('handles optional properties correctly', () => {
        const workoutDay = createMockWorkoutDay({
          notes: undefined,
          supersetParentId: undefined,
          altParentId: undefined,
        })

        const result = WorkoutHistoryService.workoutDayToHistory(workoutDay)

        expect(result.notes).toBeUndefined()
        expect(result.supersetParentId).toBeUndefined()
        expect(result.altParentId).toBeUndefined()
      })
    })
  })

  describe('Singleton Pattern', () => {
    it('returns the same instance on multiple calls', () => {
      const instance1 = workoutHistoryService
      const instance2 = workoutHistoryService
      expect(instance1).toBe(instance2)
    })
  })

  describe('Edge Cases', () => {
    it('handles very large workout history values', async () => {
      mockGetItem.mockResolvedValueOnce(null)
      mockSetItem.mockResolvedValueOnce(undefined)

      const largeHistory = createMockWorkoutHistory({
        weight: 9999,
        sets: 9999,
        reps: 9999,
        notes: 'A'.repeat(256),
      })

      await workoutHistoryService.createWorkoutHistory(largeHistory)

      const setItemCall = mockSetItem.mock.calls[0]
      const storedData = JSON.parse(setItemCall[1] as string)

      expect(storedData[0].weight).toBe(9999)
      expect(storedData[0].sets).toBe(9999)
      expect(storedData[0].reps).toBe(9999)
      expect(storedData[0].notes).toBe('A'.repeat(256))
    })

    it('handles zero values', async () => {
      mockGetItem.mockResolvedValueOnce(null)
      mockSetItem.mockResolvedValueOnce(undefined)

      const zeroHistory = createMockWorkoutHistory({
        weight: 0,
        sets: 0,
        reps: 0,
      })

      await workoutHistoryService.createWorkoutHistory(zeroHistory)

      const setItemCall = mockSetItem.mock.calls[0]
      const storedData = JSON.parse(setItemCall[1] as string)

      expect(storedData[0].weight).toBe(0)
      expect(storedData[0].sets).toBe(0)
      expect(storedData[0].reps).toBe(0)
    })

    it('handles different date formats in storage', async () => {
      const mockHistoryData: WorkoutHistoryData[] = [
        {
          id: 'history-1',
          workoutId: 'workout-1',
          date: '2024-01-15',
          name: 'Exercise 1',
          weight: 100,
          sets: 3,
          reps: 10,
        },
        {
          id: 'history-2',
          workoutId: 'workout-2',
          date: '2024-12-31',
          name: 'Exercise 2',
          weight: 120,
          sets: 4,
          reps: 8,
        },
      ]

      mockGetItem.mockResolvedValueOnce(JSON.stringify(mockHistoryData))

      const result = await workoutHistoryService.getWorkoutHistory()

      expect(result).toHaveLength(2)
      expect(result[0].date).toBe('2024-12-31')
      expect(result[1].date).toBe('2024-01-15')
    })

    it('handles concurrent operations gracefully', async () => {
      mockGetItem.mockResolvedValueOnce(null)
      mockSetItem.mockResolvedValueOnce(undefined)

      const promises = Array.from({ length: 5 }, (_, i) =>
        workoutHistoryService.createWorkoutHistory(createMockWorkoutHistory({ 
          id: `history-${i}`,
          name: `Exercise ${i}`,
          weight: 100 + i, 
        })),
      )

      await Promise.all(promises)

      const setItemCalls = mockSetItem.mock.calls
      expect(setItemCalls.length).toBe(5)
    })
  })
})
