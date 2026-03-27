import AsyncStorage from '@react-native-async-storage/async-storage'
import { exerciseMaxService } from '../../../lib/services/ExerciseMaxService'
import { ExerciseMax } from '../../../lib/models/ExerciseMax'

jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: jest.fn((obj: any) => obj.ios),
  },
}))

const createMockExerciseMax = (overrides?: Partial<ExerciseMax>): ExerciseMax => ({
  id: 'test-id',
  name: 'Squat',
  maxWeight: 300,
  lastUpdated: '2026-03-26',
  ...overrides,
})

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>
const mockGetItem = mockAsyncStorage.getItem as jest.MockedFunction<typeof mockAsyncStorage.getItem>
const mockSetItem = mockAsyncStorage.setItem as jest.MockedFunction<typeof mockAsyncStorage.setItem>

const originalConsoleError = console.error
beforeAll(() => {
  console.error = jest.fn()
})

afterAll(() => {
  console.error = originalConsoleError
})

describe('ExerciseMaxService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getExerciseMaxes', () => {
    it('returns empty array when no data exists', async () => {
      mockGetItem.mockResolvedValueOnce(null)
      const result = await exerciseMaxService.getExerciseMaxes()
      expect(result).toEqual([])
      expect(mockGetItem).toHaveBeenCalledWith('exercise_maxes')
    })

    it('returns empty array when storage throws error', async () => {
      mockGetItem.mockRejectedValueOnce(new Error('Storage error'))
      const result = await exerciseMaxService.getExerciseMaxes()
      expect(result).toEqual([])
    })

    it('returns exercise maxes from storage', async () => {
      const mockData: ExerciseMax[] = [
        createMockExerciseMax({ id: 'squat-1', name: 'Squat', maxWeight: 300 }),
        createMockExerciseMax({ id: 'bench-1', name: 'Bench Press', maxWeight: 225 }),
        createMockExerciseMax({ id: 'deadlift-1', name: 'Deadlift', maxWeight: 405 }),
      ]

      mockGetItem.mockResolvedValueOnce(JSON.stringify(mockData))

      const result = await exerciseMaxService.getExerciseMaxes()

      expect(result).toHaveLength(3)
      expect(result[0].name).toBe('Squat')
      expect(result[1].name).toBe('Bench Press')
      expect(result[2].name).toBe('Deadlift')
    })

    it('handles malformed JSON gracefully', async () => {
      mockGetItem.mockResolvedValueOnce('invalid json')
      const result = await exerciseMaxService.getExerciseMaxes()
      expect(result).toEqual([])
    })
  })

  describe('getExerciseMaxById', () => {
    it('returns the exercise max when found', async () => {
      const mockData: ExerciseMax[] = [
        createMockExerciseMax({ id: 'squat-1', name: 'Squat' }),
        createMockExerciseMax({ id: 'bench-1', name: 'Bench Press' }),
      ]

      mockGetItem.mockResolvedValueOnce(JSON.stringify(mockData))

      const result = await exerciseMaxService.getExerciseMaxById('squat-1')

      expect(result).toBeDefined()
      expect(result!.name).toBe('Squat')
    })

    it('returns undefined when not found', async () => {
      const mockData: ExerciseMax[] = [
        createMockExerciseMax({ id: 'squat-1', name: 'Squat' }),
      ]

      mockGetItem.mockResolvedValueOnce(JSON.stringify(mockData))

      const result = await exerciseMaxService.getExerciseMaxById('nonexistent')

      expect(result).toBeUndefined()
    })

    it('returns undefined when storage throws error', async () => {
      mockGetItem.mockRejectedValueOnce(new Error('Storage error'))

      const result = await exerciseMaxService.getExerciseMaxById('any-id')

      expect(result).toBeUndefined()
    })
  })

  describe('createExerciseMax', () => {
    it('creates exercise max successfully', async () => {
      mockGetItem.mockResolvedValueOnce(null)
      mockSetItem.mockResolvedValueOnce(undefined)

      const newMax = createMockExerciseMax({
        id: 'new-squat',
        name: 'Squat',
        maxWeight: 315,
      })

      const result = await exerciseMaxService.createExerciseMax(newMax)

      expect(result).toBe(true)
      expect(mockSetItem).toHaveBeenCalledWith(
        'exercise_maxes',
        expect.any(String),
      )

      const storedData = JSON.parse(mockSetItem.mock.calls[0][1] as string)
      expect(storedData).toHaveLength(1)
      expect(storedData[0].id).toBe('new-squat')
      expect(storedData[0].maxWeight).toBe(315)
    })

    it('prepends new max to existing maxes', async () => {
      const existingMax = createMockExerciseMax({ id: 'existing-1', name: 'Bench Press' })

      mockGetItem.mockResolvedValueOnce(JSON.stringify([existingMax]))
      mockSetItem.mockResolvedValueOnce(undefined)

      const newMax = createMockExerciseMax({ id: 'new-1', name: 'Squat' })

      await exerciseMaxService.createExerciseMax(newMax)

      const storedData = JSON.parse(mockSetItem.mock.calls[0][1] as string)
      expect(storedData).toHaveLength(2)
      expect(storedData[0].id).toBe('new-1')
      expect(storedData[1].id).toBe('existing-1')
    })

    it('returns false when validation fails', async () => {
      const invalidMax = createMockExerciseMax({
        name: '',
      })

      const result = await exerciseMaxService.createExerciseMax(invalidMax)

      expect(result).toBe(false)
    })

    it('returns false when storage fails', async () => {
      mockGetItem.mockResolvedValueOnce(null)
      mockSetItem.mockRejectedValueOnce(new Error('Storage error'))

      const newMax = createMockExerciseMax()

      const result = await exerciseMaxService.createExerciseMax(newMax)

      expect(result).toBe(false)
    })

    it('returns false when max weight exceeds limit', async () => {
      const invalidMax = createMockExerciseMax({
        maxWeight: 10000,
      })

      const result = await exerciseMaxService.createExerciseMax(invalidMax)

      expect(result).toBe(false)
    })
  })

  describe('updateExerciseMax', () => {
    it('updates exercise max successfully', async () => {
      const existingMaxes = [
        createMockExerciseMax({ id: 'update-1', maxWeight: 300 }),
        createMockExerciseMax({ id: 'keep-1', maxWeight: 225 }),
      ]

      mockGetItem.mockResolvedValueOnce(JSON.stringify(existingMaxes))
      mockSetItem.mockResolvedValueOnce(undefined)

      const updatedMax = createMockExerciseMax({
        id: 'update-1',
        maxWeight: 315,
        name: 'Squat (Updated)',
      })

      const result = await exerciseMaxService.updateExerciseMax(updatedMax)

      expect(result).toBe(true)

      const storedData = JSON.parse(mockSetItem.mock.calls[0][1] as string)
      const updatedItem = storedData.find((m: ExerciseMax) => m.id === 'update-1')
      expect(updatedItem.maxWeight).toBe(315)
      expect(updatedItem.name).toBe('Squat (Updated)')

      const unchangedItem = storedData.find((m: ExerciseMax) => m.id === 'keep-1')
      expect(unchangedItem.maxWeight).toBe(225)
    })

    it('returns false when validation fails', async () => {
      const invalidMax = createMockExerciseMax({
        id: 'test-1',
        maxWeight: -100,
      })

      const result = await exerciseMaxService.updateExerciseMax(invalidMax)

      expect(result).toBe(false)
    })

    it('returns false when storage fails', async () => {
      mockGetItem.mockResolvedValueOnce(JSON.stringify([createMockExerciseMax({ id: 'test-1' })]))
      mockSetItem.mockRejectedValueOnce(new Error('Set item error'))

      const updatedMax = createMockExerciseMax({ id: 'test-1', maxWeight: 400 })

      const result = await exerciseMaxService.updateExerciseMax(updatedMax)

      expect(result).toBe(false)
    })
  })

  describe('removeExerciseMax', () => {
    it('removes exercise max successfully', async () => {
      const existingMaxes = [
        createMockExerciseMax({ id: 'keep-1', name: 'Squat' }),
        createMockExerciseMax({ id: 'remove-1', name: 'Bench Press' }),
        createMockExerciseMax({ id: 'keep-2', name: 'Deadlift' }),
      ]

      mockGetItem.mockResolvedValueOnce(JSON.stringify(existingMaxes))
      mockSetItem.mockResolvedValueOnce(undefined)

      const result = await exerciseMaxService.removeExerciseMax('remove-1')

      expect(result).toBe(true)

      const storedData = JSON.parse(mockSetItem.mock.calls[0][1] as string)
      expect(storedData).toHaveLength(2)
      expect(storedData.find((m: ExerciseMax) => m.id === 'remove-1')).toBeUndefined()
      expect(storedData.find((m: ExerciseMax) => m.id === 'keep-1')).toBeDefined()
      expect(storedData.find((m: ExerciseMax) => m.id === 'keep-2')).toBeDefined()
    })

    it('returns true even when exercise max does not exist', async () => {
      const existingMaxes = [createMockExerciseMax({ id: 'keep-1' })]

      mockGetItem.mockResolvedValueOnce(JSON.stringify(existingMaxes))
      mockSetItem.mockResolvedValueOnce(undefined)

      const result = await exerciseMaxService.removeExerciseMax('non-existent')

      expect(result).toBe(true)

      const storedData = JSON.parse(mockSetItem.mock.calls[0][1] as string)
      expect(storedData).toHaveLength(1)
    })

    it('returns false when storage fails', async () => {
      mockGetItem.mockResolvedValueOnce(JSON.stringify([createMockExerciseMax({ id: 'test-1' })]))
      mockSetItem.mockRejectedValueOnce(new Error('Set item error'))

      const result = await exerciseMaxService.removeExerciseMax('test-1')

      expect(result).toBe(false)
    })

    it('succeeds when getExerciseMaxes fails but setItem succeeds', async () => {
      mockGetItem.mockRejectedValueOnce(new Error('Storage error'))
      mockSetItem.mockResolvedValueOnce(undefined)

      const result = await exerciseMaxService.removeExerciseMax('any-id')

      expect(result).toBe(true)
    })
  })

  describe('Singleton Pattern', () => {
    it('returns the same instance', () => {
      const instance1 = exerciseMaxService
      const instance2 = exerciseMaxService
      expect(instance1).toBe(instance2)
    })
  })

  describe('Edge Cases', () => {
    it('handles max weight at the limit', async () => {
      mockGetItem.mockResolvedValueOnce(null)
      mockSetItem.mockResolvedValueOnce(undefined)

      const maxAtLimit = createMockExerciseMax({
        maxWeight: 9999,
      })

      const result = await exerciseMaxService.createExerciseMax(maxAtLimit)
      expect(result).toBe(true)

      const storedData = JSON.parse(mockSetItem.mock.calls[0][1] as string)
      expect(storedData[0].maxWeight).toBe(9999)
    })

    it('handles zero max weight', async () => {
      mockGetItem.mockResolvedValueOnce(null)
      mockSetItem.mockResolvedValueOnce(undefined)

      const zeroMax = createMockExerciseMax({
        maxWeight: 0,
      })

      const result = await exerciseMaxService.createExerciseMax(zeroMax)
      expect(result).toBe(true)

      const storedData = JSON.parse(mockSetItem.mock.calls[0][1] as string)
      expect(storedData[0].maxWeight).toBe(0)
    })
  })
})
