import { useState } from 'react';
import { Alert } from 'react-native';
import { WorkoutDay } from '../lib/models/WorkoutDay';
import { workoutService } from '../lib/services/WorkoutService';
import { workoutHistoryService, WorkoutHistoryService } from '../lib/services/WorkoutHistoryService';

export const useWorkoutCompletion = () => {
  const [isCompletingDay, setIsCompletingDay] = useState(false);

  const completeWorkoutDay = async (
    workouts: WorkoutDay[],
    currentDay: number,
    totalDays: number,
    onComplete: (nextDay: number) => void
  ) => {
    try {
      if (workouts.length === 0) {
        Alert.alert('No Workouts', 'No workouts to complete for today');
        return;
      }

      setIsCompletingDay(true);

      // Convert all workouts to history with the current date
      const completionDate = new Date();
      
      const workoutHistories = workouts.map(workout => 
        WorkoutHistoryService.workoutDayToHistory(workout, completionDate)
      );
      
      // Create all workout histories at once to avoid race conditions
      const success = await workoutHistoryService.createBulkWorkoutHistories(workoutHistories);
      
      if (!success) {
        throw new Error('Failed to create workout histories');
      }

      // Move to next day
      const nextDay = currentDay < totalDays ? currentDay + 1 : 1;
      await workoutService.setCurrentDay(nextDay);
      
      setIsCompletingDay(false);
      Alert.alert('Success', `Workout day completed! Moved to day ${nextDay}.`);
      
      // Call the completion callback
      onComplete(nextDay);
    } catch (error) {
      console.error('Error completing day:', error);
      setIsCompletingDay(false);
      Alert.alert('Error', 'Failed to complete workout day');
    }
  };

  return {
    isCompletingDay,
    completeWorkoutDay,
  };
};
