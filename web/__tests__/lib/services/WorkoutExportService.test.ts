import AsyncStorage from '@react-native-async-storage/async-storage'
import { workoutExportService } from '../../../lib/services/WorkoutExportService'
import { WorkoutDay } from '../../../lib/models/WorkoutDay'

jest.mock('react-native', () => ({
  Platform: {
    OS: 'web',
  },
}))

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>

const createMockWorkout = (overrides?: Partial<WorkoutDay>): WorkoutDay => ({
  id: 'test-id',
  name: 'Test Exercise',
  weight: 100,
  sets: 3,
  reps: 10,
  day: 1,
  dayOrder: 0,
  ...overrides,
})

describe('WorkoutExportService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('workoutsToCSV', () => {
    it('generates CSV with headers for empty array', () => {
      const csv = workoutExportService.workoutsToCSV([])
      expect(csv).toBe('id,name,weight,sets,reps,notes,supersetParentId,altParentId,day,dayOrder')
    })

    it('generates CSV with workout data', () => {
      const workouts = [createMockWorkout()]
      const csv = workoutExportService.workoutsToCSV(workouts)
      const lines = csv.split('\n')
      
      expect(lines).toHaveLength(2)
      expect(lines[0]).toBe('id,name,weight,sets,reps,notes,supersetParentId,altParentId,day,dayOrder')
      expect(lines[1]).toBe('test-id,Test Exercise,100,3,10,,,,1,0')
    })

    it('handles optional fields correctly', () => {
      const workouts = [createMockWorkout({
        notes: 'Some notes',
        supersetParentId: 'parent-1',
        altParentId: 'alt-1',
      })]
      const csv = workoutExportService.workoutsToCSV(workouts)
      const lines = csv.split('\n')
      
      expect(lines[1]).toContain('Some notes')
      expect(lines[1]).toContain('parent-1')
      expect(lines[1]).toContain('alt-1')
    })

    it('escapes fields containing commas', () => {
      const workouts = [createMockWorkout({ name: 'Bench, Press' })]
      const csv = workoutExportService.workoutsToCSV(workouts)
      
      expect(csv).toContain('"Bench, Press"')
    })

    it('escapes fields containing quotes', () => {
      const workouts = [createMockWorkout({ notes: 'Use "proper" form' })]
      const csv = workoutExportService.workoutsToCSV(workouts)
      
      expect(csv).toContain('"Use ""proper"" form"')
    })

    it('escapes fields containing newlines', () => {
      const workouts = [createMockWorkout({ notes: 'Line 1\nLine 2' })]
      const csv = workoutExportService.workoutsToCSV(workouts)
      
      expect(csv).toContain('"Line 1\nLine 2"')
    })

    it('handles multiple workouts', () => {
      const workouts = [
        createMockWorkout({ id: 'w1', name: 'Exercise 1', day: 1, dayOrder: 0 }),
        createMockWorkout({ id: 'w2', name: 'Exercise 2', day: 1, dayOrder: 1 }),
        createMockWorkout({ id: 'w3', name: 'Exercise 3', day: 2, dayOrder: 0 }),
      ]
      const csv = workoutExportService.workoutsToCSV(workouts)
      const lines = csv.split('\n')
      
      expect(lines).toHaveLength(4)
    })
  })

  describe('exportWorkouts', () => {
    it('exports workouts from storage as CSV', async () => {
      const workouts = [
        createMockWorkout({ id: 'w1', name: 'Bench Press' }),
        createMockWorkout({ id: 'w2', name: 'Squat' }),
      ]
      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(workouts))

      const csv = await workoutExportService.exportWorkouts()
      
      expect(csv).toContain('Bench Press')
      expect(csv).toContain('Squat')
    })

    it('exports empty CSV when no workouts exist', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce(null)

      const csv = await workoutExportService.exportWorkouts()
      const lines = csv.split('\n')
      
      expect(lines).toHaveLength(1)
      expect(lines[0]).toBe('id,name,weight,sets,reps,notes,supersetParentId,altParentId,day,dayOrder')
    })
  })
})

