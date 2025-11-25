import { useState } from 'react';
import { WorkoutDay } from '../lib/models/WorkoutDay';
import { workoutService } from '../lib/services/WorkoutService';
import { confirmAlert } from '../utils/confirm';

export const useWorkoutForm = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<WorkoutDay | undefined>();

  const handleAddWorkout = () => {
    setEditingWorkout(undefined);
    setShowForm(true);
  };

  const handleEditWorkout = (workout: WorkoutDay) => {
    setEditingWorkout(workout);
    setShowForm(true);
  };

  const handleDeleteWorkout = async (workout: WorkoutDay, onRefresh: () => void) => {
    try {
      const success = await workoutService.removeWorkout(workout.id);
      if (success) {
        onRefresh();
      } else {
        confirmAlert('Error', 'Failed to delete workout');
      }
    } catch (error) {
      console.error('Error deleting workout:', error);
      confirmAlert('Error', 'Failed to delete workout');
    }
  };

  const handleSaveWorkout = (onRefresh: () => void) => {
    setShowForm(false);
    onRefresh();
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingWorkout(undefined);
  };

  return {
    showForm,
    editingWorkout,
    handleAddWorkout,
    handleEditWorkout,
    handleDeleteWorkout,
    handleSaveWorkout,
    handleCancelForm,
    setShowForm,
    setEditingWorkout,
  };
};
