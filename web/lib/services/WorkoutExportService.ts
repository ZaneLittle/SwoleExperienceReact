import { Platform } from 'react-native'
import { WorkoutDay } from '../models/WorkoutDay'
import { workoutService } from './WorkoutService'

const CSV_HEADERS = ['id', 'name', 'weight', 'sets', 'reps', 'notes', 'supersetParentId', 'altParentId', 'day', 'dayOrder'] as const

class WorkoutExportService {
  private static instance: WorkoutExportService

  private constructor() {}

  static getInstance(): WorkoutExportService {
    if (!WorkoutExportService.instance) {
      WorkoutExportService.instance = new WorkoutExportService()
    }
    return WorkoutExportService.instance
  }

  workoutsToCSV(workouts: WorkoutDay[]): string {
    const rows = [CSV_HEADERS.join(',')]
    
    for (const workout of workouts) {
      const values = CSV_HEADERS.map(header => {
        const value = workout[header]
        if (value === undefined || value === null) return ''
        if (typeof value === 'string') return this.escapeCSVField(value)
        return String(value)
      })
      rows.push(values.join(','))
    }
    
    return rows.join('\n')
  }

  async exportWorkouts(): Promise<string> {
    const workouts = await workoutService.getWorkouts()
    return this.workoutsToCSV(workouts)
  }

  downloadCSV(csv: string, filename: string): void {
    if (Platform.OS !== 'web') return

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  private escapeCSVField(field: string): string {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`
    }
    return field
  }
}

export const workoutExportService = WorkoutExportService.getInstance()

