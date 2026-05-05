import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  workoutBankService,
  WORKOUT_BANK_STORAGE_KEY,
} from '../../../lib/services/WorkoutBankService'
import { BankedWorkout } from '../../../lib/models/BankedWorkout'
import { Workout } from '../../../lib/models/Workout'

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>
const mockGetItem = mockAsyncStorage.getItem as jest.MockedFunction<typeof mockAsyncStorage.getItem>
const mockSetItem = mockAsyncStorage.setItem as jest.MockedFunction<typeof mockAsyncStorage.setItem>

const buildBanked = (overrides: Partial<BankedWorkout> = {}): BankedWorkout => ({
  id: 'bank-1',
  sharedWorkoutId: 'sync-1',
  name: 'Bench Press',
  weight: 135,
  sets: 3,
  reps: 10,
  bankedAt: '2024-06-01T12:00:00.000Z',
  ...overrides,
})

const buildWorkout = (overrides: Partial<Workout> = {}): Workout => ({
  id: 'workout-1',
  name: 'Bench Press',
  weight: 135,
  sets: 3,
  reps: 10,
  ...overrides,
})

const readLastSetItemPayload = (): BankedWorkout[] => {
  const calls = mockSetItem.mock.calls
  const last = calls[calls.length - 1]
  return JSON.parse(last[1] as string) as BankedWorkout[]
}

const originalConsoleError = console.error
beforeAll(() => {
  console.error = jest.fn()
})
afterAll(() => {
  console.error = originalConsoleError
})

describe('WorkoutBankService', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  describe('getBankedWorkouts', () => {
    it('returns empty array when storage is empty', async () => {
      mockGetItem.mockResolvedValueOnce(null)
      const result = await workoutBankService.getBankedWorkouts()
      expect(result).toEqual([])
      expect(mockGetItem).toHaveBeenCalledWith(WORKOUT_BANK_STORAGE_KEY)
    })

    it('returns banked workouts sorted by bankedAt descending', async () => {
      const banked: BankedWorkout[] = [
        buildBanked({ id: 'old', bankedAt: '2024-01-01T00:00:00.000Z' }),
        buildBanked({ id: 'newest', bankedAt: '2024-06-01T00:00:00.000Z' }),
        buildBanked({ id: 'mid', bankedAt: '2024-03-01T00:00:00.000Z' }),
      ]
      mockGetItem.mockResolvedValueOnce(JSON.stringify(banked))

      const result = await workoutBankService.getBankedWorkouts()
      expect(result.map(b => b.id)).toEqual(['newest', 'mid', 'old'])
    })

    it('returns empty array when storage rejects', async () => {
      mockGetItem.mockRejectedValueOnce(new Error('boom'))
      const result = await workoutBankService.getBankedWorkouts()
      expect(result).toEqual([])
    })

    it('returns empty array when payload is malformed JSON', async () => {
      mockGetItem.mockResolvedValueOnce('not-json')
      const result = await workoutBankService.getBankedWorkouts()
      expect(result).toEqual([])
    })
  })

  describe('bankWorkout', () => {
    it('persists a snapshot of the workout', async () => {
      mockGetItem.mockResolvedValueOnce(null)
      mockSetItem.mockResolvedValueOnce(undefined)

      const result = await workoutBankService.bankWorkout(
        buildWorkout({ notes: 'Watch elbows' }),
      )

      expect(result).toBe(true)
      const stored = readLastSetItemPayload()
      expect(stored).toHaveLength(1)
      expect(stored[0]).toMatchObject({
        sharedWorkoutId: 'workout-1',
        name: 'Bench Press',
        weight: 135,
        sets: 3,
        reps: 10,
        notes: 'Watch elbows',
      })
      expect(stored[0].bankedAt).toBeTruthy()
    })

    it('replaces an existing entry with the same sharedWorkoutId', async () => {
      const existing = buildBanked({
        id: 'old',
        sharedWorkoutId: 'workout-1',
        weight: 100,
        bankedAt: '2024-01-01T00:00:00.000Z',
      })
      const unrelated = buildBanked({
        id: 'other',
        sharedWorkoutId: 'workout-2',
        bankedAt: '2024-02-01T00:00:00.000Z',
      })
      mockGetItem.mockResolvedValueOnce(JSON.stringify([existing, unrelated]))
      mockSetItem.mockResolvedValueOnce(undefined)

      await workoutBankService.bankWorkout(buildWorkout({ id: 'workout-1', weight: 200 }))

      const stored = readLastSetItemPayload()
      expect(stored.find(b => b.id === 'old')).toBeUndefined()
      expect(stored.find(b => b.sharedWorkoutId === 'workout-2')?.id).toBe('other')
      const replacement = stored.find(b => b.sharedWorkoutId === 'workout-1')
      expect(replacement?.weight).toBe(200)
    })

    it('preserves explicit sharedWorkoutId from the source workout', async () => {
      mockGetItem.mockResolvedValueOnce(null)
      mockSetItem.mockResolvedValueOnce(undefined)

      await workoutBankService.bankWorkout(
        buildWorkout({ id: 'workout-1', sharedWorkoutId: 'shared-99' }),
      )

      const stored = readLastSetItemPayload()
      expect(stored[0].sharedWorkoutId).toBe('shared-99')
    })

    it('returns false when validation fails', async () => {
      mockGetItem.mockResolvedValueOnce(null)
      const result = await workoutBankService.bankWorkout(
        buildWorkout({ name: '' }),
      )
      expect(result).toBe(false)
      expect(mockSetItem).not.toHaveBeenCalled()
    })

    it('returns false when AsyncStorage write fails', async () => {
      mockGetItem.mockResolvedValueOnce(null)
      mockSetItem.mockRejectedValueOnce(new Error('disk full'))
      const result = await workoutBankService.bankWorkout(buildWorkout())
      expect(result).toBe(false)
    })
  })

  describe('removeBankedWorkout', () => {
    it('removes only the matching entry', async () => {
      const banked = [
        buildBanked({ id: 'keep-1', bankedAt: '2024-02-01T00:00:00.000Z' }),
        buildBanked({ id: 'remove-me', bankedAt: '2024-03-01T00:00:00.000Z' }),
        buildBanked({ id: 'keep-2', bankedAt: '2024-04-01T00:00:00.000Z' }),
      ]
      mockGetItem.mockResolvedValueOnce(JSON.stringify(banked))
      mockSetItem.mockResolvedValueOnce(undefined)

      const result = await workoutBankService.removeBankedWorkout('remove-me')

      expect(result).toBe(true)
      const stored = readLastSetItemPayload()
      expect(stored.map(b => b.id).sort()).toEqual(['keep-1', 'keep-2'])
    })

    it('returns false when storage write fails', async () => {
      mockGetItem.mockResolvedValueOnce(JSON.stringify([buildBanked()]))
      mockSetItem.mockRejectedValueOnce(new Error('boom'))

      const result = await workoutBankService.removeBankedWorkout('bank-1')
      expect(result).toBe(false)
    })
  })

  describe('clearBank', () => {
    it('writes an empty array to storage', async () => {
      mockSetItem.mockResolvedValueOnce(undefined)
      const result = await workoutBankService.clearBank()
      expect(result).toBe(true)
      expect(mockSetItem).toHaveBeenCalledWith(WORKOUT_BANK_STORAGE_KEY, JSON.stringify([]))
    })

    it('returns false when storage write fails', async () => {
      mockSetItem.mockRejectedValueOnce(new Error('boom'))
      const result = await workoutBankService.clearBank()
      expect(result).toBe(false)
    })
  })

  describe('Singleton', () => {
    it('returns the same instance on repeated imports', () => {
      expect(workoutBankService).toBe(workoutBankService)
    })
  })
})
