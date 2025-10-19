import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { WorkoutDay } from '../../lib/models/WorkoutDay';
import { WorkoutHistory } from '../../lib/models/WorkoutHistory';
import { Workout } from '../../lib/models/Workout';
import { workoutService } from '../../lib/services/WorkoutService';
import { WorkoutCard } from './WorkoutCard';
import { useThemeColors } from '../../hooks/useThemeColors';

interface WorkoutListProps {
  workouts: WorkoutDay[];
  history: WorkoutHistory[];
  isLoading?: boolean;
  isHistory?: boolean;
  onAddWorkout?: () => void;
  onGoToToday?: () => void;
  onUpdateWorkout?: (workout: WorkoutDay) => void;
  onDeleteWorkout?: (workout: WorkoutDay) => void;
  isSupersetsEnabled?: boolean;
  isAlternativesEnabled?: boolean;
  isProgressionHelperEnabled?: boolean;
}

export const WorkoutList: React.FC<WorkoutListProps> = ({
  workouts,
  history,
  isLoading = false,
  isHistory = false,
  onAddWorkout,
  onGoToToday,
  onUpdateWorkout,
  onDeleteWorkout,
  isSupersetsEnabled = false,
  isAlternativesEnabled = false,
  isProgressionHelperEnabled = false,
}) => {
  const colors = useThemeColors();
  const dataIsEmpty = (): boolean => {
    return workouts.length === 0 && history.length === 0;
  };

  const isWorkoutsPopulated = (): boolean => {
    return workouts.length > 0;
  };

  const getAlternatives = (workout: Workout, workoutList: (WorkoutDay | WorkoutHistory)[]): Workout[] => {
    const id = 'workoutId' in workout ? workout.workoutId : workout.id;
    return workoutList
      .filter(w => ('workoutId' in w ? w.workoutId : w.id) !== id)
      .filter(w => w.altParentId === id) as Workout[];
  };

  const getSupersets = (workout: Workout, workoutList: (WorkoutDay | WorkoutHistory)[]): Workout[] => {
    const id = 'workoutId' in workout ? workout.workoutId : workout.id;
    return workoutList
      .filter(w => ('workoutId' in w ? w.workoutId : w.id) !== id)
      .filter(w => w.supersetParentId === id) as Workout[];
  };

  const altExists = (workout: WorkoutDay | WorkoutHistory, workoutList: (WorkoutDay | WorkoutHistory)[]): boolean => {
    return !!workout.altParentId;
  };

  const supersetExists = (workout: WorkoutDay | WorkoutHistory, workoutList: (WorkoutDay | WorkoutHistory)[]): boolean => {
    return !!workout.supersetParentId;
  };

  const renderHistoryHeader = (showHeader: boolean = true) => (
    <View style={styles.historyHeader}>
      <Text style={styles.historyHeaderText}>Completed</Text>
    </View>
  );

  const renderAddWorkoutPlaceholder = () => (
    <TouchableOpacity style={styles.placeholderContainer} onPress={onAddWorkout}>
      <View style={styles.placeholderContent}>
        <Text style={styles.placeholderIcon}>+</Text>
        <Text style={styles.placeholderText}>Add a workout</Text>
      </View>
    </TouchableOpacity>
  );

  const renderGoToTodayPlaceholder = () => (
    <TouchableOpacity style={styles.placeholderContainer} onPress={onGoToToday}>
      <View style={styles.placeholderContent}>
        <Text style={styles.noWorkoutsText}>No workouts logged this day</Text>
        <Text style={styles.goToTodayIcon}>→</Text>
        <Text style={styles.goToTodayText}>Go to today</Text>
      </View>
    </TouchableOpacity>
  );

  const renderWorkoutCards = (workoutList: (WorkoutDay | WorkoutHistory)[], isHistory: boolean = false, showCompletedHeader: boolean = false) => {
    if (workoutList.length === 0) return null;

    const cards: React.ReactElement[] = [];
    
    if (isHistory || showCompletedHeader) {
      cards.push(<View key="history-header">{renderHistoryHeader()}</View>);
    }

    // Filter out workouts that are alternatives or supersets of other workouts
    const primaryWorkouts = workoutList.filter(w => 
      !altExists(w, workoutList) && !supersetExists(w, workoutList)
    );

    primaryWorkouts.forEach((workout) => {
      const alternatives = getAlternatives(workout, workoutList);
      const supersets = getSupersets(workout, workoutList);
      
      if (workout.name === "Workout with superset" || workout.name === "Bench Press") {
        console.log(`Debug ${workout.name}:`, {
          workoutId: 'workoutId' in workout ? workout.workoutId : workout.id,
          alternativesFound: alternatives.map(a => a.name),
          supersetsFound: supersets.map(s => s.name),
          allWorkouts: workoutList.map(w => ({
            name: w.name,
            id: 'workoutId' in w ? w.workoutId : w.id,
            altParentId: w.altParentId,
            supersetParentId: w.supersetParentId
          }))
        });
      }

      cards.push(
        <WorkoutCard
          key={workout.id}
          workout={workout}
          allowDelete={!isHistory}
          allowUpdate={!isHistory}
          onDelete={onDeleteWorkout}
          onUpdate={onUpdateWorkout}
          workoutsInDay={isHistory ? [] : workouts}
          alternatives={alternatives}
          supersets={supersets}
          isSupersetsEnabled={isSupersetsEnabled}
          isAlternativesEnabled={isAlternativesEnabled}
          isProgressionHelperEnabled={isProgressionHelperEnabled}
        />
      );
    });

    return cards;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text.secondary }]}>Loading...</Text>
      </View>
    );
  }

  if (!isHistory && dataIsEmpty()) {
    return renderAddWorkoutPlaceholder();
  }

  if (isHistory && dataIsEmpty()) {
    return renderGoToTodayPlaceholder();
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      {!isHistory && renderWorkoutCards(workouts, false)}
      {history.length > 0 && renderWorkoutCards(history, isHistory, !isHistory)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  historyHeader: {
    paddingVertical: 24,
    paddingBottom: 8,
    alignItems: 'center',
  },
  historyHeaderText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  placeholderContent: {
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 32,
    color: '#007AFF',
    marginBottom: 16,
  },
  placeholderText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  noWorkoutsText: {
    color: '#007AFF',
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  goToTodayIcon: {
    fontSize: 24,
    color: '#007AFF',
    marginBottom: 16,
  },
  goToTodayText: {
    color: '#007AFF',
    fontSize: 16,
  },
});
