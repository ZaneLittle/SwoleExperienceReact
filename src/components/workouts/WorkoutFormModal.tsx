import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WorkoutDay } from '../../lib/models/WorkoutDay';
import { WorkoutCreateUpdateForm } from './WorkoutCreateUpdateForm';
import { useThemeColors } from '../../hooks/useThemeColors';

interface WorkoutFormModalProps {
  visible: boolean;
  editingWorkout?: WorkoutDay;
  currentDay: number;
  workoutsCount: number;
  workoutsInDay: WorkoutDay[];
  onSave: (workout: WorkoutDay) => void;
  onCancel: () => void;
  isSupersetsEnabled: boolean;
  isAlternativesEnabled: boolean;
  isProgressionHelperEnabled: boolean;
}

export const WorkoutFormModal: React.FC<WorkoutFormModalProps> = ({
  visible,
  editingWorkout,
  currentDay,
  workoutsCount,
  workoutsInDay,
  onSave,
  onCancel,
  isSupersetsEnabled,
  isAlternativesEnabled,
  isProgressionHelperEnabled,
}) => {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={[styles.modalContainer, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
            {editingWorkout ? 'Edit Workout' : 'Add Workout'}
          </Text>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={onCancel}
            testID="close-button"
          >
            <Text style={[styles.closeButtonText, { color: colors.text.secondary }]}>✕</Text>
          </TouchableOpacity>
        </View>
        
        <WorkoutCreateUpdateForm
          workout={editingWorkout}
          day={currentDay}
          defaultOrder={workoutsCount + 1}
          onSave={onSave}
          onCancel={onCancel}
          workoutsInDay={workoutsInDay}
          isSupersetsEnabled={isSupersetsEnabled}
          isAlternativesEnabled={isAlternativesEnabled}
          isProgressionHelperEnabled={isProgressionHelperEnabled}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
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
