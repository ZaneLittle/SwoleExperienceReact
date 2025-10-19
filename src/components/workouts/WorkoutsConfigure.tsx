import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { WorkoutDay } from '../../lib/models/WorkoutDay';
import { workoutService } from '../../lib/services/WorkoutService';
import { WorkoutCreateUpdateForm } from './WorkoutCreateUpdateForm';
import { useThemeColors } from '../../hooks/useThemeColors';

interface WorkoutsConfigureProps {
  onBack: () => void;
}

export default function WorkoutsConfigure({ onBack }: WorkoutsConfigureProps) {
  const colors = useThemeColors();
  const [workouts, setWorkouts] = useState<WorkoutDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingWorkout, setEditingWorkout] = useState<WorkoutDay | undefined>();
  const [showForm, setShowForm] = useState(false);
  const [selectedDay, setSelectedDay] = useState(1);
  const [totalDays, setTotalDays] = useState(0);

  const loadWorkouts = async () => {
    try {
      setIsLoading(true);
      const [workoutsData, uniqueDays] = await Promise.all([
        workoutService.getWorkouts(),
        workoutService.getUniqueDays(),
      ]);
      
      setWorkouts(workoutsData);
      setTotalDays(uniqueDays);
    } catch (error) {
      console.error('Error loading workouts:', error);
      Alert.alert('Error', 'Failed to load workouts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWorkouts();
  }, []);

  const handleAddWorkout = () => {
    setEditingWorkout(undefined);
    setShowForm(true);
  };

  const handleEditWorkout = (workout: WorkoutDay) => {
    setEditingWorkout(workout);
    setShowForm(true);
  };

  const handleDeleteWorkout = async (workout: WorkoutDay) => {
    Alert.alert(
      'Delete Workout',
      `Are you sure you want to delete "${workout.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            try {
              const success = await workoutService.removeWorkout(workout.id);
              if (success) {
                loadWorkouts();
              } else {
                Alert.alert('Error', 'Failed to delete workout');
              }
            } catch (error) {
              console.error('Error deleting workout:', error);
              Alert.alert('Error', 'Failed to delete workout');
            }
          }
        }
      ]
    );
  };

  const handleSaveWorkout = (workout: WorkoutDay) => {
    setShowForm(false);
    loadWorkouts();
  };

  const handleMoveWorkout = async (workout: WorkoutDay, direction: 'up' | 'down') => {
    try {
      const dayWorkouts = getWorkoutsForDay(selectedDay);
      const currentIndex = dayWorkouts.findIndex(w => w.id === workout.id);
      
      if (direction === 'up' && currentIndex === 0) return; // Already at top
      if (direction === 'down' && currentIndex === dayWorkouts.length - 1) return; // Already at bottom
      
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      const newOrder = [...dayWorkouts];
      
      // Swap the workouts
      [newOrder[currentIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[currentIndex]];
      
      // Update dayOrder for all workouts
      const reorderedIds = newOrder.map(w => w.id);
      const success = await workoutService.reorderWorkouts(selectedDay, reorderedIds);
      
      if (success) {
        loadWorkouts();
      } else {
        Alert.alert('Error', 'Failed to reorder workouts');
      }
    } catch (error) {
      console.error('Error reordering workouts:', error);
      Alert.alert('Error', 'Failed to reorder workouts');
    }
  };

  const getWorkoutsForDay = (day: number): WorkoutDay[] => {
    return workouts.filter(w => w.day === day).sort((a, b) => a.dayOrder - b.dayOrder);
  };

  const hasAlternativesOrSupersets = (workout: WorkoutDay): boolean => {
    const dayWorkouts = getWorkoutsForDay(workout.day);
    const hasAlternatives = dayWorkouts.some(w => w.altParentId === workout.id);
    const hasSupersets = dayWorkouts.some(w => w.supersetParentId === workout.id);
    return hasAlternatives || hasSupersets;
  };

  const canDelete = (workout: WorkoutDay): boolean => {
    return !hasAlternativesOrSupersets(workout);
  };

  const handleNextDay = () => {
    const nextDay = selectedDay + 1;
    if (nextDay > (totalDays || 0)) {
      // If going to a new day, automatically create it
      setTotalDays(nextDay);
    }
    setSelectedDay(nextDay);
  };

  const renderDaySelector = () => (
    <View style={styles.daySelector}>
      <TouchableOpacity 
        style={styles.dayButton}
        onPress={() => setSelectedDay(Math.max(1, selectedDay - 1))}
        disabled={selectedDay <= 1}
      >
        <View style={[styles.navButtonLeft, { borderRightColor: colors.primary }]} />
      </TouchableOpacity>
      
      <View style={styles.dayInfo}>
        <Text style={[
          styles.dayText, 
          selectedDay > (totalDays || 0) && styles.newDayTextStyle,
          { color: colors.text.primary }
        ]}>
          Day {selectedDay}
        </Text>
        {selectedDay > (totalDays || 0) && (
          <Text style={[styles.newDayLabel, { color: colors.text.secondary }]}>New Day</Text>
        )}
      </View>
      
      <TouchableOpacity 
        style={styles.dayButton}
        onPress={handleNextDay}
      >
        <View style={[styles.navButtonRight, { borderLeftColor: colors.primary }]} />
      </TouchableOpacity>
    </View>
  );

  const renderWorkoutItem = (workout: WorkoutDay, index: number, totalItems: number) => (
    <View style={[styles.workoutItem, { backgroundColor: colors.surface }]}>
      <View style={styles.reorderControls}>
        {index > 0 && (
          <TouchableOpacity 
            style={[styles.reorderButton, { backgroundColor: '#666666' }]}
            onPress={() => handleMoveWorkout(workout, 'up')}
          >
            <Text style={[styles.reorderButtonText, { color: '#FFFFFF' }]}>↑</Text>
          </TouchableOpacity>
        )}
        {index < totalItems - 1 && (
          <TouchableOpacity 
            style={[styles.reorderButton, { backgroundColor: '#666666' }]}
            onPress={() => handleMoveWorkout(workout, 'down')}
          >
            <Text style={[styles.reorderButtonText, { color: '#FFFFFF' }]}>↓</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.workoutContent}>
        <View style={styles.workoutHeader}>
          <Text style={[styles.workoutName, { color: colors.text.primary }]}>{workout.name}</Text>
          <View style={styles.workoutActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleEditWorkout(workout)}
            >
              <Text style={[styles.editButtonText, { color: colors.primary }]}>✎</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleDeleteWorkout(workout)}
              disabled={!canDelete(workout)}
            >
              <Text style={[
                styles.deleteButtonText,
                !canDelete(workout) && styles.disabledButtonText,
                { color: colors.error }
              ]}>×</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.workoutDetails}>
          <Text style={[styles.workoutDetail, { color: colors.text.secondary }]}>Weight: {workout.weight || 'N/A'}</Text>
          <Text style={[styles.workoutDetail, { color: colors.text.secondary }]}>Sets: {workout.sets || 'N/A'}</Text>
          <Text style={[styles.workoutDetail, { color: colors.text.secondary }]}>Reps: {workout.reps || 'N/A'}</Text>
        </View>
        
        {workout.notes && (
          <Text style={[styles.workoutNotes, { color: colors.text.secondary }]}>{workout.notes}</Text>
        )}
      </View>
    </View>
  );

  const renderWorkoutList = () => {
    const dayWorkouts = getWorkoutsForDay(selectedDay);
    
    if (dayWorkouts.length === 0) {
      const isNewDay = selectedDay > (totalDays || 0);
      return (
        <View style={[styles.emptyState, { backgroundColor: colors.background }]}>
          <Text style={[styles.emptyStateText, { color: colors.text.secondary }]}>
            {isNewDay ? `Create workouts for Day ${selectedDay}` : `No workouts for Day ${selectedDay}`}
          </Text>
          <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]} onPress={handleAddWorkout}>
            <Text style={[styles.addButtonText, { color: '#fff' }]}>+ Add Workout</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={[styles.workoutListContainer, { backgroundColor: colors.background }]}>
        <ScrollView style={styles.workoutList}>
          {dayWorkouts.map((workout, index) => 
            renderWorkoutItem(workout, index, dayWorkouts.length)
          )}
        </ScrollView>
        
        <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]} onPress={handleAddWorkout}>
          <Text style={[styles.addButtonText, { color: '#fff' }]}>+ Add Workout</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderFormModal = () => (
    <View style={styles.modalOverlay}>
      <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
            {editingWorkout ? 'Edit Workout' : 'Add Workout'}
          </Text>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setShowForm(false)}
          >
            <Text style={[styles.closeButtonText, { color: colors.text.secondary }]}>✕</Text>
          </TouchableOpacity>
        </View>
        
        <WorkoutCreateUpdateForm
          workout={editingWorkout}
          day={selectedDay}
          defaultOrder={getWorkoutsForDay(selectedDay).length + 1}
          onSave={handleSaveWorkout}
          onCancel={() => setShowForm(false)}
          workoutsInDay={getWorkoutsForDay(selectedDay)}
          isSupersetsEnabled={true}
          isAlternativesEnabled={true}
          isProgressionHelperEnabled={true}
        />
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text.secondary }]}>Loading workouts...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={[styles.backButtonText, { color: colors.primary }]}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text.primary }]}>Configure Workouts</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView style={[styles.content, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
        {renderDaySelector()}
        {renderWorkoutList()}
      </ScrollView>

      {showForm && renderFormModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 18,
    color: '#007AFF',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  spacer: {
    width: 60,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 100, // Add space for navigation bar
  },
  daySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    gap: 24,
  },
  dayButton: {
    padding: 8,
  },
  dayButtonText: {
    fontSize: 24,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  navButtonLeft: {
    width: 0,
    height: 0,
    borderTopWidth: 10,
    borderBottomWidth: 10,
    borderRightWidth: 15,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  navButtonRight: {
    width: 0,
    height: 0,
    borderTopWidth: 10,
    borderBottomWidth: 10,
    borderLeftWidth: 15,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  dayInfo: {
    alignItems: 'center',
  },
  dayText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  newDayTextStyle: {
    color: '#007AFF',
  },
  newDayLabel: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  workoutList: {
    paddingBottom: 20,
  },
  workoutListContainer: {
    flex: 1,
  },
  workoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginVertical: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  reorderControls: {
    flexDirection: 'column',
    marginRight: 12,
    justifyContent: 'center',
  },
  reorderButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    padding: 8,
    marginVertical: 2,
    minWidth: 32,
    alignItems: 'center',
  },
  reorderButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  workoutContent: {
    flex: 1,
  },
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  workoutActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutInfo: {
    flex: 1,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  workoutDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  workoutDetail: {
    fontSize: 14,
    color: '#666',
  },
  workoutNotes: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  workoutActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  editButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#e0e0e0',
    opacity: 0.5,
  },
  disabledButtonText: {
    opacity: 0.5,
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20, // Add extra bottom margin
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '100%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
  },
});
