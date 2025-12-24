import AsyncStorage from '@react-native-async-storage/async-storage'
import { workoutImportService } from '../../../lib/services/WorkoutImportService'
import { WorkoutDay } from '../../../lib/models/WorkoutDay'

jest.mock('react-native', () => ({
  Platform: {
    OS: 'web',
  },
}))

jest.mock('react-native-uuid', () => ({
  v4: jest.fn(() => `new-uuid-${Math.random().toString(36).substr(2, 9)}`),
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

describe('WorkoutImportService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('parseCSV', () => {
    it('returns empty array for empty CSV', () => {
      const workouts = workoutImportService.parseCSV('')
      expect(workouts).toEqual([])
    })

    it('returns empty array for headers only', () => {
      const csv = 'id,name,weight,sets,reps,notes,supersetParentId,altParentId,day,dayOrder'
      const workouts = workoutImportService.parseCSV(csv)
      expect(workouts).toEqual([])
    })

    it('parses basic workout data', () => {
      const csv = `id,name,weight,sets,reps,notes,supersetParentId,altParentId,day,dayOrder
orig-id,Bench Press,135,4,8,,,,1,0`
      const workouts = workoutImportService.parseCSV(csv)
      
      expect(workouts).toHaveLength(1)
      expect(workouts[0].name).toBe('Bench Press')
      expect(workouts[0].weight).toBe(135)
      expect(workouts[0].sets).toBe(4)
      expect(workouts[0].reps).toBe(8)
      expect(workouts[0].day).toBe(1)
      expect(workouts[0].dayOrder).toBe(0)
    })

    it('generates new IDs for imported workouts', () => {
      const csv = `id,name,weight,sets,reps,notes,supersetParentId,altParentId,day,dayOrder
old-id,Test,100,3,10,,,,1,0`
      const workouts = workoutImportService.parseCSV(csv)
      
      expect(workouts[0].id).not.toBe('old-id')
      expect(workouts[0].id).toContain('new-uuid')
    })

    it('parses optional fields', () => {
      const csv = `id,name,weight,sets,reps,notes,supersetParentId,altParentId,day,dayOrder
id1,Test,100,3,10,Some notes,,,1,0`
      const workouts = workoutImportService.parseCSV(csv)
      
      expect(workouts[0].notes).toBe('Some notes')
    })

    it('remaps parent IDs to new IDs', () => {
      const csv = `id,name,weight,sets,reps,notes,supersetParentId,altParentId,day,dayOrder
parent-id,Parent Exercise,100,3,10,,,,1,0
child-id,Child Exercise,50,3,10,,parent-id,,1,1`
      const workouts = workoutImportService.parseCSV(csv)
      
      expect(workouts).toHaveLength(2)
      const parent = workouts.find(w => w.name === 'Parent Exercise')
      const child = workouts.find(w => w.name === 'Child Exercise')
      
      expect(child?.supersetParentId).toBe(parent?.id)
    })

    it('handles quoted fields with commas', () => {
      const csv = `id,name,weight,sets,reps,notes,supersetParentId,altParentId,day,dayOrder
id1,"Bench, Press",100,3,10,,,,1,0`
      const workouts = workoutImportService.parseCSV(csv)
      
      expect(workouts[0].name).toBe('Bench, Press')
    })

    it('handles quoted fields with escaped quotes', () => {
      const csv = `id,name,weight,sets,reps,notes,supersetParentId,altParentId,day,dayOrder
id1,Test,100,3,10,"Use ""proper"" form",,,1,0`
      const workouts = workoutImportService.parseCSV(csv)
      
      expect(workouts[0].notes).toBe('Use "proper" form')
    })

    it('handles missing optional fields', () => {
      const csv = `id,name,weight,sets,reps,notes,supersetParentId,altParentId,day,dayOrder
id1,Test,100,3,10,,,,1,0`
      const workouts = workoutImportService.parseCSV(csv)
      
      expect(workouts[0].notes).toBeUndefined()
      expect(workouts[0].supersetParentId).toBeUndefined()
      expect(workouts[0].altParentId).toBeUndefined()
    })

    it('handles invalid numeric values', () => {
      const csv = `id,name,weight,sets,reps,notes,supersetParentId,altParentId,day,dayOrder
id1,Test,invalid,abc,xyz,,,,bad,worse`
      const workouts = workoutImportService.parseCSV(csv)
      
      expect(workouts[0].weight).toBe(0)
      expect(workouts[0].sets).toBe(0)
      expect(workouts[0].reps).toBe(0)
      expect(workouts[0].day).toBe(1)
      expect(workouts[0].dayOrder).toBe(0)
    })
  })

  describe('hasExistingWorkouts', () => {
    it('returns false when no workouts exist', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce(null)
      const result = await workoutImportService.hasExistingWorkouts()
      expect(result).toBe(false)
    })

    it('returns false when workouts array is empty', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify([]))
      const result = await workoutImportService.hasExistingWorkouts()
      expect(result).toBe(false)
    })

    it('returns true when workouts exist', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify([createMockWorkout()]))
      const result = await workoutImportService.hasExistingWorkouts()
      expect(result).toBe(true)
    })
  })

  describe('importWorkouts', () => {
    it('imports workouts successfully', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify([]))
      mockAsyncStorage.setItem.mockResolvedValue(undefined)

      const csv = `id,name,weight,sets,reps,notes,supersetParentId,altParentId,day,dayOrder
id1,Bench Press,135,4,8,,,,1,0`

      const result = await workoutImportService.importWorkouts(csv)
      expect(result).toBe(true)
    })

    it('returns true even when storage read fails (treats as empty)', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'))
      mockAsyncStorage.setItem.mockResolvedValue(undefined)

      const csv = `id,name,weight,sets,reps,notes,supersetParentId,altParentId,day,dayOrder
id1,Bench Press,135,4,8,,,,1,0`

      const result = await workoutImportService.importWorkouts(csv)
      expect(result).toBe(true)
    })
  })
})

