import { WorkoutDay } from '../models/WorkoutDay'
import { workoutService } from './WorkoutService'
import uuid from 'react-native-uuid'

class WorkoutImportService {
  private static instance: WorkoutImportService

  private constructor() {}

  static getInstance(): WorkoutImportService {
    if (!WorkoutImportService.instance) {
      WorkoutImportService.instance = new WorkoutImportService()
    }
    return WorkoutImportService.instance
  }

  parseCSV(csv: string): WorkoutDay[] {
    const rows = this.parseCSVRows(csv)
    if (rows.length < 2) return []

    const headers = rows[0]
    const headerIndices = new Map<string, number>()
    headers.forEach((header, index) => {
      headerIndices.set(header.trim(), index)
    })

    const workouts: WorkoutDay[] = []
    const idMapping = new Map<string, string>()

    for (let i = 1; i < rows.length; i++) {
      const values = rows[i]
      if (values.length === 0 || (values.length === 1 && values[0] === '')) continue

      const getValue = (header: string): string => {
        const index = headerIndices.get(header)
        return index !== undefined ? (values[index] || '') : ''
      }

      const originalId = getValue('id')
      const newId = uuid.v4() as string
      idMapping.set(originalId, newId)

      const workout: WorkoutDay = {
        id: newId,
        name: getValue('name'),
        weight: parseFloat(getValue('weight')) || 0,
        sets: parseInt(getValue('sets'), 10) || 0,
        reps: parseInt(getValue('reps'), 10) || 0,
        day: parseInt(getValue('day'), 10) || 1,
        dayOrder: parseInt(getValue('dayOrder'), 10) || 0,
      }

      const notes = getValue('notes')
      if (notes) workout.notes = notes

      const supersetParentId = getValue('supersetParentId')
      if (supersetParentId) workout.supersetParentId = supersetParentId

      const altParentId = getValue('altParentId')
      if (altParentId) workout.altParentId = altParentId

      workouts.push(workout)
    }

    return workouts.map(workout => ({
      ...workout,
      supersetParentId: workout.supersetParentId ? idMapping.get(workout.supersetParentId) : undefined,
      altParentId: workout.altParentId ? idMapping.get(workout.altParentId) : undefined,
    }))
  }

  async importWorkouts(csv: string): Promise<boolean> {
    try {
      const workouts = this.parseCSV(csv)
      await this.replaceAllWorkouts(workouts)
      return true
    } catch (error) {
      console.error('Error importing workouts:', error)
      return false
    }
  }

  async hasExistingWorkouts(): Promise<boolean> {
    const workouts = await workoutService.getWorkouts()
    return workouts.length > 0
  }

  private async replaceAllWorkouts(workouts: WorkoutDay[]): Promise<void> {
    const existingWorkouts = await workoutService.getWorkouts()
    
    for (const workout of existingWorkouts) {
      await workoutService.removeWorkout(workout.id)
    }
    
    const sortedWorkouts = [...workouts].sort((a, b) => {
      if (a.day !== b.day) return a.day - b.day
      return a.dayOrder - b.dayOrder
    })
    
    for (const workout of sortedWorkouts.reverse()) {
      await workoutService.createWorkout(workout)
    }
  }

  private parseCSVRows(csv: string): string[][] {
    const rows: string[][] = []
    let currentRow: string[] = []
    let currentField = ''
    let inQuotes = false

    for (let i = 0; i < csv.length; i++) {
      const char = csv[i]

      if (inQuotes) {
        if (char === '"' && csv[i + 1] === '"') {
          currentField += '"'
          i++
        } else if (char === '"') {
          inQuotes = false
        } else {
          currentField += char
        }
      } else {
        if (char === '"') {
          inQuotes = true
        } else if (char === ',') {
          currentRow.push(currentField)
          currentField = ''
        } else if (char === '\n') {
          currentRow.push(currentField)
          rows.push(currentRow)
          currentRow = []
          currentField = ''
        } else if (char === '\r') {
          continue
        } else {
          currentField += char
        }
      }
    }

    if (currentField || currentRow.length > 0) {
      currentRow.push(currentField)
      rows.push(currentRow)
    }

    return rows
  }
}

export const workoutImportService = WorkoutImportService.getInstance()

