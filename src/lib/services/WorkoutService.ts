import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import uuid from 'react-native-uuid';
import { WorkoutDay, WorkoutDayValidator } from '../models/WorkoutDay';
import { WorkoutValidator } from '../models/Workout';

const WORKOUT_STORAGE_KEY = 'workouts';
const CURRENT_DAY_STORAGE_KEY = 'current_workout_day';

class WorkoutService {
  private static instance: WorkoutService;

  private constructor() {}

  static getInstance(): WorkoutService {
    if (!WorkoutService.instance) {
      WorkoutService.instance = new WorkoutService();
    }
    return WorkoutService.instance;
  }

  async getWorkouts(day?: number): Promise<WorkoutDay[]> {
    try {
      const workoutsJson = await AsyncStorage.getItem(WORKOUT_STORAGE_KEY);
      if (!workoutsJson) return [];

      const workouts: WorkoutDay[] = JSON.parse(workoutsJson);

      if (day !== undefined) {
        return workouts
          .filter(workout => workout.day === day)
          .sort((a, b) => a.dayOrder - b.dayOrder);
      }

      return workouts.sort((a, b) => a.dayOrder - b.dayOrder);
    } catch (error) {
      console.error('Error getting workouts:', error);
      return [];
    }
  }

  async getUniqueDays(): Promise<number> {
    try {
      const workouts = await this.getWorkouts();
      const uniqueDays = new Set(workouts.map(w => w.day));
      return uniqueDays.size;
    } catch (error) {
      console.error('Error getting unique days:', error);
      return 0;
    }
  }

  async createWorkout(workout: WorkoutDay): Promise<boolean> {
    try {
      WorkoutValidator.validate(workout);
      
      const existingWorkouts = await this.getWorkouts();
      const workoutsArray = [workout, ...existingWorkouts];

      await AsyncStorage.setItem(WORKOUT_STORAGE_KEY, JSON.stringify(workoutsArray));
      return true;
    } catch (error) {
      console.error('Error creating workout:', error);
      return false;
    }
  }

  async removeWorkout(id: string): Promise<boolean> {
    try {
      const existingWorkouts = await this.getWorkouts();
      const filteredWorkouts = existingWorkouts.filter(workout => workout.id !== id);
      
      await AsyncStorage.setItem(WORKOUT_STORAGE_KEY, JSON.stringify(filteredWorkouts));
      return true;
    } catch (error) {
      console.error('Error removing workout:', error);
      return false;
    }
  }

  async updateWorkout(workout: WorkoutDay): Promise<boolean> {
    try {
      WorkoutValidator.validate(workout);
      
      const existingWorkouts = await this.getWorkouts();
      const updatedWorkouts = existingWorkouts.map(w => 
        w.id === workout.id ? workout : w
      );
      
      await AsyncStorage.setItem(WORKOUT_STORAGE_KEY, JSON.stringify(updatedWorkouts));
      return true;
    } catch (error) {
      console.error('Error updating workout:', error);
      return false;
    }
  }

  async reorderWorkouts(day: number, reorderedIds: string[]): Promise<boolean> {
    try {
      const existingWorkouts = await this.getWorkouts();
      
      // Update the dayOrder for workouts in the specified day
      const updatedWorkouts = existingWorkouts.map(workout => {
        if (workout.day === day) {
          const newOrder = reorderedIds.indexOf(workout.id);
          if (newOrder !== -1) {
            return { ...workout, dayOrder: newOrder };
          }
        }
        return workout;
      });
      
      await AsyncStorage.setItem(WORKOUT_STORAGE_KEY, JSON.stringify(updatedWorkouts));
      return true;
    } catch (error) {
      console.error('Error reordering workouts:', error);
      return false;
    }
  }

  // Helper methods for workout relationships
  static altExists(workoutDay: WorkoutDay, workouts: WorkoutDay[]): boolean {
    return WorkoutDayValidator.altExists(workoutDay, workouts);
  }

  static supersetExists(workoutDay: WorkoutDay, workouts: WorkoutDay[]): boolean {
    return WorkoutDayValidator.supersetExists(workoutDay, workouts);
  }

  // Current workout day persistence methods
  async getCurrentDay(): Promise<number> {
    try {
      let currentDayJson = await AsyncStorage.getItem(CURRENT_DAY_STORAGE_KEY);
      
      // If AsyncStorage fails on web, try localStorage as fallback (hydration-safe)
      if (!currentDayJson && Platform.OS === 'web') {
        try {
          currentDayJson = localStorage.getItem(CURRENT_DAY_STORAGE_KEY);
        } catch (localError) {
          // localStorage fallback failed, continue with AsyncStorage result
        }
      }
      
      if (!currentDayJson) {
        return 1; // Default to day 1
      }
      
      const currentDay = JSON.parse(currentDayJson);
      return typeof currentDay === 'number' ? currentDay : 1;
    } catch (error) {
      console.error('Error getting current day:', error);
      return 1; // Default to day 1 on error
    }
  }

  async setCurrentDay(day: number): Promise<boolean> {
    try {
      // Use the same robust pattern as workouts/weights: read existing data first
      const existingDay = await this.getCurrentDay();
      
      // Only update if the day is actually different
      if (existingDay === day) {
        return true;
      }
      
      // Use a more explicit storage approach for web (hydration-safe)
      if (Platform.OS === 'web') {
        // Web platform - use localStorage directly as backup
        try {
          localStorage.setItem(CURRENT_DAY_STORAGE_KEY, JSON.stringify(day));
        } catch (localError) {
          // localStorage backup failed, continue with AsyncStorage
        }
      }
      
      await AsyncStorage.setItem(CURRENT_DAY_STORAGE_KEY, JSON.stringify(day));
      return true;
    } catch (error) {
      console.error('Error setting current day:', error);
      return false;
    }
  }

  async reorderDays(): Promise<boolean> {
    try {
      const workouts = await this.getWorkouts();
      if (workouts.length === 0) return true;

      // Find all unique days that have workouts, sorted
      const daysWithWorkouts = Array.from(new Set(workouts.map(w => w.day))).sort((a, b) => a - b);
      
      // If days are already sequential starting from 1, no reordering needed
      const isSequential = daysWithWorkouts.every((day, index) => day === index + 1);
      if (isSequential) return true;

      // Create mapping from old day to new day (1, 2, 3, ...)
      const dayMapping = new Map<number, number>();
      daysWithWorkouts.forEach((oldDay, index) => {
        dayMapping.set(oldDay, index + 1);
      });

      // Update all workouts with new day numbers
      const updatedWorkouts = workouts.map(workout => ({
        ...workout,
        day: dayMapping.get(workout.day) || workout.day,
      }));

      // Update current day if it was affected
      const currentDay = await this.getCurrentDay();
      const newCurrentDay = dayMapping.get(currentDay) || currentDay;
      if (newCurrentDay !== currentDay) {
        await this.setCurrentDay(newCurrentDay);
      }

      await AsyncStorage.setItem(WORKOUT_STORAGE_KEY, JSON.stringify(updatedWorkouts));
      return true;
    } catch (error) {
      console.error('Error reordering days:', error);
      return false;
    }
  }
}

export const workoutService = WorkoutService.getInstance();
