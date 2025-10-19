import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { WorkoutDay } from '../../lib/models/WorkoutDay';
import { workoutService } from '../../lib/services/WorkoutService';
import { WorkoutList } from './WorkoutList';
import { WorkoutsHeader } from './WorkoutsHeader';
import { WorkoutFormModal } from './WorkoutFormModal';
import { CompleteWorkoutButton } from './CompleteWorkoutButton';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useWorkoutData } from '../../hooks/useWorkoutData';
import { useWorkoutCompletion } from '../../hooks/useWorkoutCompletion';
import { useWorkoutForm } from '../../hooks/useWorkoutForm';
import { useDayText } from '../../hooks/useDayText';

export const WorkoutsScreen: React.FC = () => {
  const colors = useThemeColors();
  
  // Feature toggles (you can make these configurable later)
  const [isSupersetsEnabled] = useState(true);
  const [isAlternativesEnabled] = useState(true);
  const [isProgressionHelperEnabled] = useState(true);

  // Custom hooks
  const {
    workouts,
    workoutHistory,
    isLoading,
    currentDay,
    dayOffset,
    totalDays,
    setCurrentDay,
    setDayOffset,
    loadDataForOffset,
    loadInitialData,
    handleDayNavigation,
  } = useWorkoutData();

  const { isCompletingDay, completeWorkoutDay } = useWorkoutCompletion();
  const {
    showForm,
    editingWorkout,
    handleAddWorkout,
    handleEditWorkout,
    handleDeleteWorkout,
    handleSaveWorkout,
    handleCancelForm,
  } = useWorkoutForm();

  const dayText = useDayText(dayOffset);

  // Event handlers
  const handleCompleteDay = () => {
    completeWorkoutDay(workouts, currentDay, totalDays, (nextDay) => {
      setCurrentDay(nextDay);
      setDayOffset(0);
      loadDataForOffset(0);
    });
  };

  const handleGoToToday = async () => {
    setDayOffset(0);
    const savedCurrentDay = await workoutService.getCurrentDay();
    setCurrentDay(savedCurrentDay);
    loadInitialData(savedCurrentDay);
  };

  const handleRefresh = () => {
    loadDataForOffset(dayOffset);
  };

  const handleDelete = (workout: WorkoutDay) => {
    handleDeleteWorkout(workout, handleRefresh);
  };

  const handleSave = (workout: WorkoutDay) => {
    handleSaveWorkout(handleRefresh);
  };

  // Load current day from storage and initialize workouts on component mount
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const savedCurrentDay = await workoutService.getCurrentDay();
        setCurrentDay(savedCurrentDay);
        
        // Load workouts for the saved current day
        await loadInitialData(savedCurrentDay);
      } catch (error) {
        console.error('Error initializing app:', error);
        Alert.alert('Error', 'Failed to load app data');
      }
    };

    initializeApp();
  }, []);

  // Refresh data when the screen comes into focus (e.g., when switching tabs)
  useFocusEffect(
    React.useCallback(() => {
      const refreshData = async () => {
        try {
          // Only refresh if we're not currently loading
          if (!isLoading) {
            await loadDataForOffset(dayOffset);
          }
        } catch (error) {
          console.error('Error refreshing data on focus:', error);
        }
      };

      refreshData();
    }, [dayOffset, isLoading, loadDataForOffset])
  );

  // Load data when currentDay or dayOffset changes (but not on initial mount)
  useEffect(() => {
    // Only reload if currentDay has been updated from storage (not initial load)
    const hasInitialized = workouts.length > 0 || totalDays > 0;
    if (!hasInitialized) {
      return; // Still initializing
    }
    
    // Load appropriate data based on dayOffset
    loadDataForOffset(dayOffset);
  }, [currentDay, dayOffset]);

  const hasContent = workoutHistory.length > 0 || workouts.length > 0 || dayOffset !== 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <WorkoutsHeader
        dayText={dayText}
        hasContent={hasContent}
        onPreviousDay={() => handleDayNavigation(-1)}
        onNextDay={() => handleDayNavigation(1)}
      />
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>Loading...</Text>
        </View>
      ) : (
        <WorkoutList
          workouts={workouts}
          history={workoutHistory}
          isHistory={dayOffset < 0}
          onAddWorkout={handleAddWorkout}
          onGoToToday={handleGoToToday}
          onUpdateWorkout={handleEditWorkout}
          onDeleteWorkout={handleDelete}
          isSupersetsEnabled={isSupersetsEnabled}
          isAlternativesEnabled={isAlternativesEnabled}
          isProgressionHelperEnabled={isProgressionHelperEnabled}
        />
      )}
      
      <CompleteWorkoutButton
        visible={workouts.length > 0 && dayOffset === 0}
        isCompleting={isCompletingDay}
        onComplete={handleCompleteDay}
      />
      
      <WorkoutFormModal
        visible={showForm}
        editingWorkout={editingWorkout}
        currentDay={currentDay}
        workoutsCount={workouts.length}
        workoutsInDay={workouts}
        onSave={handleSave}
        onCancel={handleCancelForm}
        isSupersetsEnabled={isSupersetsEnabled}
        isAlternativesEnabled={isAlternativesEnabled}
        isProgressionHelperEnabled={isProgressionHelperEnabled}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
});
