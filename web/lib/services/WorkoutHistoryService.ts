import AsyncStorage from '@react-native-async-storage/async-storage'
import uuid from 'react-native-uuid'
import { WorkoutHistory } from '../models/WorkoutHistory'
import { WorkoutDay } from '../models/WorkoutDay'

const WORKOUT_HISTORY_STORAGE_KEY = 'workout_history'

export class WorkoutHistoryService {
  private static instance: WorkoutHistoryService

  private constructor() {}

  static getInstance(): WorkoutHistoryService {
    if (!WorkoutHistoryService.instance) {
      WorkoutHistoryService.instance = new WorkoutHistoryService()
    }
    return WorkoutHistoryService.instance
  }

  async getWorkoutHistory(date?: string): Promise<WorkoutHistory[]> {
    try {
      const historyJson = await AsyncStorage.getItem(WORKOUT_HISTORY_STORAGE_KEY)
      if (!historyJson) return []

      const history: WorkoutHistory[] = JSON.parse(historyJson)

      // console.log(`json: ${historyJson}`)
      // console.log(`parsed data: ${history}`)

      if (date) {
        // console.log(`filtered data: ${history.filter(entry => entry.date === date)}`)
        return history.filter(entry => entry.date === date)
      }

      return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    } catch (error) {
      console.error('Error getting workout history:', error)
      return []
    }
  }

  async createWorkoutHistory(workoutHistory: WorkoutHistory): Promise<boolean> {
    try {
      const existingHistory = await this.getWorkoutHistory()
      const historyArray = [workoutHistory, ...existingHistory]

      await AsyncStorage.setItem(WORKOUT_HISTORY_STORAGE_KEY, JSON.stringify(historyArray))
      return true
    } catch (error) {
      console.error('Error creating workout history:', error)
      return false
    }
  }

  async createBulkWorkoutHistories(workoutHistories: WorkoutHistory[]): Promise<boolean> {
    try {
      const existingHistory = await this.getWorkoutHistory()
      const historyArray = [...workoutHistories, ...existingHistory]

      await AsyncStorage.setItem(WORKOUT_HISTORY_STORAGE_KEY, JSON.stringify(historyArray))
      return true
    } catch (error) {
      console.error('Error creating multiple workout histories:', error)
      return false
    }
  }

  async removeWorkoutHistory(id: string): Promise<boolean> {
    try {
      const existingHistory = await this.getWorkoutHistory()
      const filteredHistory = existingHistory.filter(entry => entry.id !== id)
      
      await AsyncStorage.setItem(WORKOUT_HISTORY_STORAGE_KEY, JSON.stringify(filteredHistory))
      return true
    } catch (error) {
      console.error('Error removing workout history:', error)
      return false
    }
  }

  async updateWorkoutHistory(workoutHistory: WorkoutHistory): Promise<boolean> {
    try {
      const existingHistory = await this.getWorkoutHistory()
      const updatedHistory = existingHistory.map(h => 
        h.id === workoutHistory.id ? workoutHistory : h,
      )
      
      await AsyncStorage.setItem(WORKOUT_HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory))
      return true
    } catch (error) {
      console.error('Error updating workout history:', error)
      return false
    }
  }

  async removeAllHistory(): Promise<boolean> {
    try {
      await AsyncStorage.setItem(WORKOUT_HISTORY_STORAGE_KEY, JSON.stringify([]))
      return true
    } catch (error) {
      console.error('Error removing all workout history:', error)
      return false
    }
  }

  // Convert WorkoutDay to WorkoutHistory
  static workoutDayToHistory(workoutDay: WorkoutDay, date?: Date): WorkoutHistory {
    const dateToLog = date || new Date()
    const year = dateToLog.getFullYear()
    const month = String(dateToLog.getMonth() + 1).padStart(2, '0')
    const day = String(dateToLog.getDate()).padStart(2, '0')
    const dateString = `${year}-${month}-${day}`
    
    return {
      id: uuid.v4() as string,
      workoutId: workoutDay.id,
      date: dateString, // YYYY-MM-DD format
      name: workoutDay.name,
      weight: workoutDay.weight,
      sets: workoutDay.sets,
      reps: workoutDay.reps,
      notes: workoutDay.notes,
      supersetParentId: workoutDay.supersetParentId,
      altParentId: workoutDay.altParentId,
    }
  }
}

export const workoutHistoryService = WorkoutHistoryService.getInstance()
