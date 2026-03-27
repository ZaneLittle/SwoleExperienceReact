import AsyncStorage from '@react-native-async-storage/async-storage'
import { ExerciseMax, ExerciseMaxValidator } from '../models/ExerciseMax'

const EXERCISE_MAX_STORAGE_KEY = 'exercise_maxes'

class ExerciseMaxService {
  private static instance: ExerciseMaxService

  private constructor() {}

  static getInstance(): ExerciseMaxService {
    if (!ExerciseMaxService.instance) {
      ExerciseMaxService.instance = new ExerciseMaxService()
    }
    return ExerciseMaxService.instance
  }

  async getExerciseMaxes(): Promise<ExerciseMax[]> {
    try {
      const json = await AsyncStorage.getItem(EXERCISE_MAX_STORAGE_KEY)
      if (!json) return []
      return JSON.parse(json) as ExerciseMax[]
    } catch (error) {
      console.error('Error getting exercise maxes:', error)
      return []
    }
  }

  async getExerciseMaxById(id: string): Promise<ExerciseMax | undefined> {
    try {
      const maxes = await this.getExerciseMaxes()
      return maxes.find(m => m.id === id)
    } catch (error) {
      console.error('Error getting exercise max by id:', error)
      return undefined
    }
  }

  async createExerciseMax(exerciseMax: ExerciseMax): Promise<boolean> {
    try {
      ExerciseMaxValidator.validate(exerciseMax)

      const existing = await this.getExerciseMaxes()
      const updated = [exerciseMax, ...existing]

      await AsyncStorage.setItem(EXERCISE_MAX_STORAGE_KEY, JSON.stringify(updated))
      return true
    } catch (error) {
      console.error('Error creating exercise max:', error)
      return false
    }
  }

  async updateExerciseMax(exerciseMax: ExerciseMax): Promise<boolean> {
    try {
      ExerciseMaxValidator.validate(exerciseMax)

      const existing = await this.getExerciseMaxes()
      const updated = existing.map(m =>
        m.id === exerciseMax.id ? exerciseMax : m,
      )

      await AsyncStorage.setItem(EXERCISE_MAX_STORAGE_KEY, JSON.stringify(updated))
      return true
    } catch (error) {
      console.error('Error updating exercise max:', error)
      return false
    }
  }

  async removeExerciseMax(id: string): Promise<boolean> {
    try {
      const existing = await this.getExerciseMaxes()
      const filtered = existing.filter(m => m.id !== id)

      await AsyncStorage.setItem(EXERCISE_MAX_STORAGE_KEY, JSON.stringify(filtered))
      return true
    } catch (error) {
      console.error('Error removing exercise max:', error)
      return false
    }
  }
}

export const exerciseMaxService = ExerciseMaxService.getInstance()
