import { workoutExportService } from '../../../lib/services/WorkoutExportService'
import { workoutImportService } from '../../../lib/services/WorkoutImportService'
import { WorkoutDay } from '../../../lib/models/WorkoutDay'

jest.mock('react-native', () => ({
  Platform: {
    OS: 'web',
  },
}))

const mockUuidState = { counter: 0 }
jest.mock('react-native-uuid', () => ({
  v4: jest.fn(() => `uuid-${++mockUuidState.counter}`),
}))

describe('WorkoutExportImport Integration', () => {
  beforeEach(() => {
    mockUuidState.counter = 0
  })

  const createWorkout = (overrides?: Partial<WorkoutDay>): WorkoutDay => ({
    id: `workout-${Math.random().toString(36).substr(2, 9)}`,
    name: 'Test Exercise',
    weight: 100,
    sets: 3,
    reps: 10,
    day: 1,
    dayOrder: 0,
    ...overrides,
  })

  describe('export then import roundtrip', () => {
    it('preserves basic workout data through export and import', () => {
      const originalWorkouts: WorkoutDay[] = [
        createWorkout({ id: 'w1', name: 'Bench Press', weight: 135, sets: 4, reps: 8, day: 1, dayOrder: 0 }),
        createWorkout({ id: 'w2', name: 'Squat', weight: 225, sets: 5, reps: 5, day: 1, dayOrder: 1 }),
        createWorkout({ id: 'w3', name: 'Deadlift', weight: 315, sets: 3, reps: 5, day: 2, dayOrder: 0 }),
      ]

      const csv = workoutExportService.workoutsToCSV(originalWorkouts)
      const importedWorkouts = workoutImportService.parseCSV(csv)

      expect(importedWorkouts).toHaveLength(originalWorkouts.length)

      originalWorkouts.forEach((original, index) => {
        const imported = importedWorkouts[index]
        expect(imported.name).toBe(original.name)
        expect(imported.weight).toBe(original.weight)
        expect(imported.sets).toBe(original.sets)
        expect(imported.reps).toBe(original.reps)
        expect(imported.day).toBe(original.day)
        expect(imported.dayOrder).toBe(original.dayOrder)
      })
    })

    it('preserves notes through export and import', () => {
      const originalWorkouts: WorkoutDay[] = [
        createWorkout({ id: 'w1', name: 'Bench Press', notes: 'Keep elbows tucked' }),
        createWorkout({ id: 'w2', name: 'Squat', notes: 'Go below parallel' }),
        createWorkout({ id: 'w3', name: 'Curl', notes: undefined }),
      ]

      const csv = workoutExportService.workoutsToCSV(originalWorkouts)
      const importedWorkouts = workoutImportService.parseCSV(csv)

      expect(importedWorkouts[0].notes).toBe('Keep elbows tucked')
      expect(importedWorkouts[1].notes).toBe('Go below parallel')
      expect(importedWorkouts[2].notes).toBeUndefined()
    })

    it('preserves superset relationships through export and import', () => {
      const originalWorkouts: WorkoutDay[] = [
        createWorkout({ id: 'parent-1', name: 'Bench Press', day: 1, dayOrder: 0 }),
        createWorkout({ id: 'child-1', name: 'Dumbbell Fly', supersetParentId: 'parent-1', day: 1, dayOrder: 1 }),
        createWorkout({ id: 'parent-2', name: 'Squat', day: 2, dayOrder: 0 }),
        createWorkout({ id: 'child-2', name: 'Leg Extension', supersetParentId: 'parent-2', day: 2, dayOrder: 1 }),
      ]

      const csv = workoutExportService.workoutsToCSV(originalWorkouts)
      const importedWorkouts = workoutImportService.parseCSV(csv)

      const importedParent1 = importedWorkouts.find(w => w.name === 'Bench Press')
      const importedChild1 = importedWorkouts.find(w => w.name === 'Dumbbell Fly')
      const importedParent2 = importedWorkouts.find(w => w.name === 'Squat')
      const importedChild2 = importedWorkouts.find(w => w.name === 'Leg Extension')

      expect(importedChild1?.supersetParentId).toBe(importedParent1?.id)
      expect(importedChild2?.supersetParentId).toBe(importedParent2?.id)
    })

    it('preserves alternative relationships through export and import', () => {
      const originalWorkouts: WorkoutDay[] = [
        createWorkout({ id: 'main-1', name: 'Barbell Bench', day: 1, dayOrder: 0 }),
        createWorkout({ id: 'alt-1', name: 'Dumbbell Bench', altParentId: 'main-1', day: 1, dayOrder: 1 }),
      ]

      const csv = workoutExportService.workoutsToCSV(originalWorkouts)
      const importedWorkouts = workoutImportService.parseCSV(csv)

      const importedMain = importedWorkouts.find(w => w.name === 'Barbell Bench')
      const importedAlt = importedWorkouts.find(w => w.name === 'Dumbbell Bench')

      expect(importedAlt?.altParentId).toBe(importedMain?.id)
    })

    it('handles special characters in names and notes', () => {
      const originalWorkouts: WorkoutDay[] = [
        createWorkout({ id: 'w1', name: 'Bench, Press (Incline)', notes: 'Use "proper" form\nKeep core tight' }),
        createWorkout({ id: 'w2', name: 'Pull-ups', notes: 'Goal: 10 reps, strict form' }),
      ]

      const csv = workoutExportService.workoutsToCSV(originalWorkouts)
      const importedWorkouts = workoutImportService.parseCSV(csv)

      expect(importedWorkouts[0].name).toBe('Bench, Press (Incline)')
      expect(importedWorkouts[0].notes).toBe('Use "proper" form\nKeep core tight')
      expect(importedWorkouts[1].name).toBe('Pull-ups')
      expect(importedWorkouts[1].notes).toBe('Goal: 10 reps, strict form')
    })

    it('handles complex workout structure with all relationship types', () => {
      const originalWorkouts: WorkoutDay[] = [
        createWorkout({ id: 'main-bench', name: 'Barbell Bench', day: 1, dayOrder: 0 }),
        createWorkout({ id: 'alt-bench', name: 'Dumbbell Bench', altParentId: 'main-bench', day: 1, dayOrder: 1 }),
        createWorkout({ id: 'superset-fly', name: 'Cable Fly', supersetParentId: 'main-bench', day: 1, dayOrder: 2 }),
        createWorkout({ id: 'squat', name: 'Squat', day: 2, dayOrder: 0, notes: 'Heavy day' }),
        createWorkout({ id: 'leg-press', name: 'Leg Press', altParentId: 'squat', day: 2, dayOrder: 1 }),
      ]

      const csv = workoutExportService.workoutsToCSV(originalWorkouts)
      const importedWorkouts = workoutImportService.parseCSV(csv)

      expect(importedWorkouts).toHaveLength(5)

      const mainBench = importedWorkouts.find(w => w.name === 'Barbell Bench')
      const altBench = importedWorkouts.find(w => w.name === 'Dumbbell Bench')
      const supersetFly = importedWorkouts.find(w => w.name === 'Cable Fly')
      const squat = importedWorkouts.find(w => w.name === 'Squat')
      const legPress = importedWorkouts.find(w => w.name === 'Leg Press')

      expect(altBench?.altParentId).toBe(mainBench?.id)
      expect(supersetFly?.supersetParentId).toBe(mainBench?.id)
      expect(legPress?.altParentId).toBe(squat?.id)
      expect(squat?.notes).toBe('Heavy day')
    })

    it('handles empty workout list', () => {
      const originalWorkouts: WorkoutDay[] = []

      const csv = workoutExportService.workoutsToCSV(originalWorkouts)
      const importedWorkouts = workoutImportService.parseCSV(csv)

      expect(importedWorkouts).toHaveLength(0)
    })

    it('generates new unique IDs on import', () => {
      const originalWorkouts: WorkoutDay[] = [
        createWorkout({ id: 'original-id-1', name: 'Exercise 1' }),
        createWorkout({ id: 'original-id-2', name: 'Exercise 2' }),
      ]

      const csv = workoutExportService.workoutsToCSV(originalWorkouts)
      const importedWorkouts = workoutImportService.parseCSV(csv)

      expect(importedWorkouts[0].id).not.toBe('original-id-1')
      expect(importedWorkouts[1].id).not.toBe('original-id-2')
      expect(importedWorkouts[0].id).not.toBe(importedWorkouts[1].id)
    })

    it('preserves day and dayOrder across multiple days', () => {
      const originalWorkouts: WorkoutDay[] = [
        createWorkout({ id: 'w1', name: 'Day 1 Ex 1', day: 1, dayOrder: 0 }),
        createWorkout({ id: 'w2', name: 'Day 1 Ex 2', day: 1, dayOrder: 1 }),
        createWorkout({ id: 'w3', name: 'Day 1 Ex 3', day: 1, dayOrder: 2 }),
        createWorkout({ id: 'w4', name: 'Day 2 Ex 1', day: 2, dayOrder: 0 }),
        createWorkout({ id: 'w5', name: 'Day 3 Ex 1', day: 3, dayOrder: 0 }),
        createWorkout({ id: 'w6', name: 'Day 3 Ex 2', day: 3, dayOrder: 1 }),
      ]

      const csv = workoutExportService.workoutsToCSV(originalWorkouts)
      const importedWorkouts = workoutImportService.parseCSV(csv)

      const day1 = importedWorkouts.filter(w => w.day === 1)
      const day2 = importedWorkouts.filter(w => w.day === 2)
      const day3 = importedWorkouts.filter(w => w.day === 3)

      expect(day1).toHaveLength(3)
      expect(day2).toHaveLength(1)
      expect(day3).toHaveLength(2)

      expect(day1.map(w => w.dayOrder).sort()).toEqual([0, 1, 2])
      expect(day3.map(w => w.dayOrder).sort()).toEqual([0, 1])
    })
  })
})

