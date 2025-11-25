import { useState } from 'react';
import { WorkoutDay } from '../lib/models/WorkoutDay';
import { workoutService } from '../lib/services/WorkoutService';
import { workoutHistoryService, WorkoutHistoryService } from '../lib/services/WorkoutHistoryService';
import { confirmAlert } from '../utils/confirm';

export const useWorkoutCompletion = () => {
  const [isCompletingDay, setIsCompletingDay] = useState(false);

  const completeWorkoutDay = async (
    workouts: WorkoutDay[],
    currentDay: number,
    totalDays: number,
    onComplete: (nextDay: number) => void
  ) => {
    try {
      setIsCompletingDay(true);

      // Only create workout histories if there are workouts
      if (workouts.length > 0) {
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
      }

      // Move to next day
      const nextDay = currentDay < totalDays ? currentDay + 1 : 1;
      await workoutService.setCurrentDay(nextDay);
      
      setIsCompletingDay(false);
      
      // Show different messages based on whether there were workouts
      if (workouts.length > 0) {
        confirmAlert('Success', `Workout day completed! Moved to day ${nextDay}.`);
      } else {
        confirmAlert('Success', `Day ${currentDay} completed (no workouts). Moved to day ${nextDay}.`);
      }
      
      // Call the completion callback
      onComplete(nextDay);
    } catch (error) {
      console.error('Error completing day:', error);
      setIsCompletingDay(false);
      confirmAlert('Error', 'Failed to complete workout day');
    }
  };

  return {
    isCompletingDay,
    completeWorkoutDay,
  };
};
