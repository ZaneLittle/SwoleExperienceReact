import { useState, useCallback } from 'react';
import { WorkoutDay } from '../lib/models/WorkoutDay';
import { WorkoutHistory } from '../lib/models/WorkoutHistory';
import { workoutService } from '../lib/services/WorkoutService';
import { workoutHistoryService } from '../lib/services/WorkoutHistoryService';

export const useWorkoutData = () => {
  const [workouts, setWorkouts] = useState<WorkoutDay[]>([]);
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDay, setCurrentDay] = useState(1);
  const [dayOffset, setDayOffset] = useState(0);
  const [totalDays, setTotalDays] = useState(0);

  const getDateStringForOffset = useCallback((offset: number): string => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const loadDataForOffset = useCallback(async (offset: number) => {
    try {
      setIsLoading(true);
      
      // Get the date string for the offset (unified date calculation)
      const historyDate = getDateStringForOffset(offset);
      
      if (offset === 0) {
        // Current day - load scheduled workouts and history
        const [workoutsData, historyData] = await Promise.all([
          workoutService.getWorkouts(currentDay),
          workoutHistoryService.getWorkoutHistory(historyDate),
        ]);
        
        setWorkouts(workoutsData);
        setWorkoutHistory(historyData);
      } else if (offset < 0) {
        // Past dates - load history only
        const historyData = await workoutHistoryService.getWorkoutHistory(historyDate);
        
        setWorkouts([]);
        setWorkoutHistory(historyData);
      } else {
        // Future dates - load scheduled workouts for that day
        let futureDay = currentDay + offset;
        
        // Handle wrapping around to day 1 if we exceed totalDays
        if (futureDay > totalDays) {
          futureDay = futureDay - totalDays;
        }
        
        const futureWorkouts = await workoutService.getWorkouts(futureDay);
        setWorkouts(futureWorkouts);
        setWorkoutHistory([]); // Clear history for future dates
      }
    } catch (error) {
      console.error('Error loading data for offset:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [currentDay, totalDays, getDateStringForOffset]);

  const loadInitialData = useCallback(async (day?: number) => {
    try {
      setIsLoading(true);
      const targetDay = day !== undefined ? day : currentDay;

      const [workoutsData, uniqueDays] = await Promise.all([
        workoutService.getWorkouts(targetDay),
        workoutService.getUniqueDays(),
      ]);
      
      setTotalDays(uniqueDays);
      // Initial load always starts at dayOffset 0 (today), so load today's data
      await loadDataForOffset(0);
    } catch (error) {
      console.error('Error loading initial data:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [currentDay, loadDataForOffset]);

  const handleDayNavigation = useCallback((offset: number) => {
    const newOffset = dayOffset + offset;
    setDayOffset(newOffset);
    // The useEffect will handle loading the appropriate data based on the new dayOffset
  }, [dayOffset]);

  return {
    workouts,
    workoutHistory,
    isLoading,
    currentDay,
    dayOffset,
    totalDays,
    setWorkouts,
    setWorkoutHistory,
    setIsLoading,
    setCurrentDay,
    setDayOffset,
    setTotalDays,
    loadDataForOffset,
    loadInitialData,
    handleDayNavigation,
  };
};
