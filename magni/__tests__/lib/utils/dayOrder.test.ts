import { WorkoutDay } from '../../../lib/models/WorkoutDay'
import { getProgramDayCount, swapWorkoutDays } from '../../../lib/utils/dayOrder'

const workout = (overrides: Partial<WorkoutDay>): WorkoutDay => ({
  id: 'id',
  name: 'Exercise',
  weight: 100,
  sets: 3,
  reps: 10,
  day: 1,
  dayOrder: 0,
  ...overrides,
})

describe('dayOrder', () => {
  describe('swapWorkoutDays', () => {
    it('exchanges workouts between two days and leaves others unchanged', () => {
      const workouts = [
        workout({ id: 'd3a', name: 'Squat', day: 3, dayOrder: 0 }),
        workout({ id: 'd3b', name: 'RDL', day: 3, dayOrder: 1 }),
        workout({ id: 'd4a', name: 'Bench', day: 4, dayOrder: 0 }),
        workout({ id: 'd1', name: 'Pullup', day: 1, dayOrder: 0 }),
      ]

      const result = swapWorkoutDays(workouts, 3, 4)

      expect(result.find(w => w.id === 'd3a')?.day).toBe(4)
      expect(result.find(w => w.id === 'd3b')?.day).toBe(4)
      expect(result.find(w => w.id === 'd4a')?.day).toBe(3)
      expect(result.find(w => w.id === 'd1')?.day).toBe(1)
      expect(result.find(w => w.id === 'd3a')?.dayOrder).toBe(0)
    })

    it('moves workouts onto an empty day and leaves the source day empty', () => {
      const workouts = [
        workout({ id: 'd3a', name: 'Squat', day: 3 }),
        workout({ id: 'd1', name: 'Pullup', day: 1 }),
      ]

      const result = swapWorkoutDays(workouts, 3, 4)

      expect(result.filter(w => w.day === 3)).toHaveLength(0)
      expect(result.filter(w => w.day === 4).map(w => w.id)).toEqual(['d3a'])
    })

    it('returns the same array when both days are the same', () => {
      const workouts = [workout({ id: 'd1', day: 1 })]
      expect(swapWorkoutDays(workouts, 2, 2)).toBe(workouts)
    })
  })

  describe('getProgramDayCount', () => {
    it('returns 0 for an empty program', () => {
      expect(getProgramDayCount([])).toBe(0)
    })

    it('returns the highest day number so empty days before it are kept', () => {
      const workouts = [
        workout({ id: '1', day: 1 }),
        workout({ id: '4', day: 4 }),
      ]
      expect(getProgramDayCount(workouts)).toBe(4)
    })
  })
})
