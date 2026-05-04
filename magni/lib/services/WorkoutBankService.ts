import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  BankedWorkout,
  BankedWorkoutValidator,
  bankedWorkoutFromWorkout,
} from '../models/BankedWorkout'
import { Workout } from '../models/Workout'

const WORKOUT_BANK_STORAGE_KEY = 'workout_bank'

class WorkoutBankService {
  private static instance: WorkoutBankService

  private constructor() {}

  static getInstance(): WorkoutBankService {
    if (!WorkoutBankService.instance) {
      WorkoutBankService.instance = new WorkoutBankService()
    }
    return WorkoutBankService.instance
  }

  /**
   * Returns all banked workouts, sorted most-recently-banked first.
   */
  async getBankedWorkouts(): Promise<BankedWorkout[]> {
    try {
      const json = await AsyncStorage.getItem(WORKOUT_BANK_STORAGE_KEY)
      if (!json) return []

      const banked: BankedWorkout[] = JSON.parse(json)
      return [...banked].sort((a, b) => {
        const aTime = Date.parse(a.bankedAt) || 0
        const bTime = Date.parse(b.bankedAt) || 0
        return bTime - aTime
      })
    } catch (error) {
      console.error('Error getting banked workouts:', error)
      return []
    }
  }

  /**
   * Persist a snapshot of `workout` into the bank. If a banked entry with the
   * same `sharedWorkoutId` already exists, it is replaced (keeps the bank from
   * filling up with stale duplicates of the same exercise).
   */
  async bankWorkout(workout: Workout): Promise<boolean> {
    try {
      const snapshot = bankedWorkoutFromWorkout(workout)
      BankedWorkoutValidator.validate(snapshot)

      const existing = await this.getBankedWorkouts()
      const filtered = existing.filter(
        entry => entry.sharedWorkoutId !== snapshot.sharedWorkoutId,
      )
      const next = [snapshot, ...filtered]

      await AsyncStorage.setItem(WORKOUT_BANK_STORAGE_KEY, JSON.stringify(next))
      return true
    } catch (error) {
      console.error('Error banking workout:', error)
      return false
    }
  }

  async removeBankedWorkout(id: string): Promise<boolean> {
    try {
      const existing = await this.getBankedWorkouts()
      const next = existing.filter(entry => entry.id !== id)
      await AsyncStorage.setItem(WORKOUT_BANK_STORAGE_KEY, JSON.stringify(next))
      return true
    } catch (error) {
      console.error('Error removing banked workout:', error)
      return false
    }
  }

  async clearBank(): Promise<boolean> {
    try {
      await AsyncStorage.setItem(WORKOUT_BANK_STORAGE_KEY, JSON.stringify([]))
      return true
    } catch (error) {
      console.error('Error clearing workout bank:', error)
      return false
    }
  }
}

export const workoutBankService = WorkoutBankService.getInstance()
export { WORKOUT_BANK_STORAGE_KEY }
