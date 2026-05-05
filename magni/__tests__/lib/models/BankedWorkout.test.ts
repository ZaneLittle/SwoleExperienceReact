import {
  BankedWorkout,
  BankedWorkoutConverter,
  BankedWorkoutValidator,
  bankedWorkoutFromWorkout,
  filterBankForActivePrograms,
  getBankedSyncGroupId,
} from '../../../lib/models/BankedWorkout'
import { Workout, WORKOUT_CONSTRAINTS } from '../../../lib/models/Workout'

const baseBanked = (overrides: Partial<BankedWorkout> = {}): BankedWorkout => ({
  id: 'bank-1',
  sharedWorkoutId: 'sync-1',
  name: 'Bench Press',
  weight: 135,
  sets: 3,
  reps: 10,
  bankedAt: '2024-06-01T12:00:00.000Z',
  ...overrides,
})

describe('BankedWorkout Model', () => {
  describe('BankedWorkoutConverter', () => {
    it('round-trips through toData/fromData', () => {
      const banked = baseBanked({
        notes: 'Use spotter',
        setDetails: [
          { weight: 135, reps: 10 },
          { weight: 145, reps: 8 },
        ],
        exerciseMaxId: 'max-1',
        maxPercentage: 67,
      })

      const result = BankedWorkoutConverter.fromData(BankedWorkoutConverter.toData(banked))
      expect(result).toEqual(banked)
    })
  })

  describe('BankedWorkoutValidator', () => {
    it('accepts a valid banked workout', () => {
      expect(() => BankedWorkoutValidator.validate(baseBanked())).not.toThrow()
    })

    it.each([
      ['empty id', { id: '' }],
      ['empty name', { name: '' }],
      ['missing bankedAt', { bankedAt: '' }],
      ['invalid bankedAt', { bankedAt: 'not-a-date' }],
    ])('throws when %s', (_label, overrides) => {
      expect(() => BankedWorkoutValidator.validate(baseBanked(overrides))).toThrow()
    })

    it('throws when notes exceed length limit', () => {
      const banked = baseBanked({
        notes: 'x'.repeat(WORKOUT_CONSTRAINTS.NOTES_LENGTH_LIMIT + 1),
      })
      expect(() => BankedWorkoutValidator.validate(banked)).toThrow(/Notes/)
    })

    it('throws when weight exceeds limit', () => {
      const banked = baseBanked({ weight: WORKOUT_CONSTRAINTS.WEIGHT_LIMIT + 1 })
      expect(() => BankedWorkoutValidator.validate(banked)).toThrow(/Weight/)
    })

    it('throws when a setDetail entry exceeds limits', () => {
      const banked = baseBanked({
        setDetails: [{ weight: WORKOUT_CONSTRAINTS.WEIGHT_LIMIT + 1, reps: 1 }],
      })
      expect(() => BankedWorkoutValidator.validate(banked)).toThrow(/Weight/)
    })

    describe('hasSetDetails', () => {
      it('returns true when set details are present', () => {
        expect(
          BankedWorkoutValidator.hasSetDetails(baseBanked({ setDetails: [{ weight: 1, reps: 1 }] })),
        ).toBe(true)
      })

      it('returns false when set details are missing or empty', () => {
        expect(BankedWorkoutValidator.hasSetDetails(baseBanked())).toBe(false)
        expect(BankedWorkoutValidator.hasSetDetails(baseBanked({ setDetails: [] }))).toBe(false)
      })
    })
  })

  describe('bankedWorkoutFromWorkout', () => {
    const workout: Workout = {
      id: 'w-1',
      name: 'Squat',
      weight: 225,
      sets: 5,
      reps: 5,
      notes: 'Belt on',
      setDetails: [{ weight: 225, reps: 5 }],
      exerciseMaxId: 'max-squat',
      maxPercentage: 80,
    }

    it('preserves persisted fields and strips day-specific data', () => {
      const banked = bankedWorkoutFromWorkout(workout, {
        id: 'fixed-id',
        bankedAt: '2024-06-15T08:30:00.000Z',
      })

      expect(banked).toMatchObject({
        id: 'fixed-id',
        sharedWorkoutId: 'w-1',
        name: 'Squat',
        weight: 225,
        sets: 5,
        reps: 5,
        notes: 'Belt on',
        setDetails: [{ weight: 225, reps: 5 }],
        exerciseMaxId: 'max-squat',
        maxPercentage: 80,
        bankedAt: '2024-06-15T08:30:00.000Z',
      })
    })

    it('uses sharedWorkoutId when present rather than id', () => {
      const banked = bankedWorkoutFromWorkout({ ...workout, sharedWorkoutId: 'shared-99' })
      expect(banked.sharedWorkoutId).toBe('shared-99')
    })

    it('deep-copies set details so later mutation does not affect bank', () => {
      const original = {
        ...workout,
        setDetails: [{ weight: 100, reps: 5 }],
      }
      const banked = bankedWorkoutFromWorkout(original)

      original.setDetails![0].weight = 999
      expect(banked.setDetails?.[0].weight).toBe(100)
    })

    it('falls back to a generated id and current timestamp', () => {
      const banked = bankedWorkoutFromWorkout(workout)
      expect(banked.id).toMatch(/^bank-/)
      expect(Number.isNaN(Date.parse(banked.bankedAt))).toBe(false)
    })
  })

  describe('getBankedSyncGroupId', () => {
    it('returns sharedWorkoutId when present', () => {
      expect(getBankedSyncGroupId(baseBanked({ sharedWorkoutId: 'sync-9' }))).toBe('sync-9')
    })

    it('falls back to id when sharedWorkoutId is missing', () => {
      expect(
        getBankedSyncGroupId(baseBanked({ id: 'lone-1', sharedWorkoutId: undefined })),
      ).toBe('lone-1')
    })
  })

  describe('filterBankForActivePrograms', () => {
    const buildWorkout = (overrides: Partial<Workout> = {}): Workout => ({
      id: 'w-1',
      name: 'Bench Press',
      weight: 135,
      sets: 3,
      reps: 10,
      ...overrides,
    })

    it('returns the original list when there are no active workouts', () => {
      const banked = [baseBanked({ id: 'b-1' }), baseBanked({ id: 'b-2', sharedWorkoutId: 'sync-2' })]
      expect(filterBankForActivePrograms(banked, [])).toEqual(banked)
    })

    it('hides banked entries whose sync group is still active', () => {
      const banked = [
        baseBanked({ id: 'b-active', sharedWorkoutId: 'shared-1' }),
        baseBanked({ id: 'b-orphan', sharedWorkoutId: 'shared-2' }),
      ]
      const active: Workout[] = [
        buildWorkout({ id: 'w-day1', sharedWorkoutId: 'shared-1' }),
        buildWorkout({ id: 'w-day2', sharedWorkoutId: 'shared-1' }),
      ]
      const result = filterBankForActivePrograms(banked, active)
      expect(result.map(b => b.id)).toEqual(['b-orphan'])
    })

    it('matches on sharedWorkoutId OR id (treats unlinked active workouts as their own group)', () => {
      const banked = [baseBanked({ id: 'standalone-1', sharedWorkoutId: undefined })]
      const active: Workout[] = [buildWorkout({ id: 'standalone-1' })]
      expect(filterBankForActivePrograms(banked, active)).toEqual([])
    })

    it('does not mutate inputs', () => {
      const banked = [baseBanked({ id: 'a' }), baseBanked({ id: 'b', sharedWorkoutId: 'group' })]
      const active: Workout[] = [buildWorkout({ sharedWorkoutId: 'group' })]
      const snapshot = JSON.stringify(banked)
      filterBankForActivePrograms(banked, active)
      expect(JSON.stringify(banked)).toBe(snapshot)
    })
  })
})
