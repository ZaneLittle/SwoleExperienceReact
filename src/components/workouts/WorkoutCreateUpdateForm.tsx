import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { WorkoutDay } from '../../lib/models/WorkoutDay';
import { WorkoutValidator } from '../../lib/models/Workout';
import { workoutService } from '../../lib/services/WorkoutService';
import { useThemeColors } from '../../hooks/useThemeColors';

interface WorkoutCreateUpdateFormProps {
  workout?: WorkoutDay;
  day: number;
  defaultOrder: number;
  onSave: (workout: WorkoutDay) => void;
  onCancel: () => void;
  workoutsInDay?: WorkoutDay[];
  isSupersetsEnabled?: boolean;
  isAlternativesEnabled?: boolean;
  isProgressionHelperEnabled?: boolean;
}

export const WorkoutCreateUpdateForm: React.FC<WorkoutCreateUpdateFormProps> = ({
  workout,
  day,
  defaultOrder,
  onSave,
  onCancel,
  workoutsInDay = [],
  isSupersetsEnabled = false,
  isAlternativesEnabled = false,
}) => {
  const colors = useThemeColors();
  const [name, setName] = useState(workout?.name || '');
  const [weight, setWeight] = useState(workout?.weight?.toString() || '');
  const [sets, setSets] = useState(workout?.sets?.toString() || '');
  const [reps, setReps] = useState(workout?.reps?.toString() || '');
  const [notes, setNotes] = useState(workout?.notes || '');
  const [alternativeId, setAlternativeId] = useState<string>('');
  const [supersetId, setSupersetId] = useState<string>('');
  const [showAlternativeDropdown, setShowAlternativeDropdown] = useState(false);
  const [showSupersetDropdown, setShowSupersetDropdown] = useState(false);

  useEffect(() => {
    if (workout?.altParentId) {
      setAlternativeId(workout.altParentId);
    } else {
      setAlternativeId('');
    }
    if (workout?.supersetParentId) {
      setSupersetId(workout.supersetParentId);
    } else {
      setSupersetId('');
    }
  }, [workout]);

  const validateForm = (): boolean => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Name is required');
      return false;
    }
    if (!weight || isNaN(Number(weight)) || Number(weight) < 0) {
      Alert.alert('Validation Error', 'Please enter a valid weight (must be 0 or greater)');
      return false;
    }
    if (!sets || isNaN(Number(sets)) || Number(sets) < 0) {
      Alert.alert('Validation Error', 'Please enter a valid number of sets (must be 0 or greater)');
      return false;
    }
    if (!reps || isNaN(Number(reps)) || Number(reps) < 0) {
      Alert.alert('Validation Error', 'Please enter a valid number of reps (must be 0 or greater)');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      const workoutData: WorkoutDay = {
        id: workout?.id || Date.now().toString(),
        day,
        dayOrder: defaultOrder,
        name: name.trim(),
        weight: Number(weight),
        sets: Number(sets),
        reps: Number(reps),
        notes: notes.trim() || undefined,
        altParentId: alternativeId || undefined,
        supersetParentId: supersetId || undefined,
      };

      WorkoutValidator.validate(workoutData);

      const success = workout 
        ? await workoutService.updateWorkout(workoutData)
        : await workoutService.createWorkout(workoutData);

      if (success) {
        onSave(workoutData);
      } else {
        Alert.alert('Error', 'Failed to save workout');
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'An error occurred');
    }
  };

  const getPossibleAlternatives = (): WorkoutDay[] => {
    if (workout?.id) {
      const isCurrentWorkoutUsedAsAlternative = workoutsInDay.some(w => w.altParentId === workout.id);
      if (isCurrentWorkoutUsedAsAlternative) {
        return [];
      }
    }
    
    return workoutsInDay.filter(w => w.id !== workout?.id);
  };

  const getAlternativesForDropdown = (): WorkoutDay[] => {
    return getPossibleAlternatives();
  };

  const hasAlternativesToShow = (): boolean => {
    if (workout?.altParentId) return true;
    return workoutsInDay.length > 0;
  };

  const getPossibleSupersets = (): WorkoutDay[] => {
    if (workout?.id) {
      const isCurrentWorkoutUsedAsSuperset = workoutsInDay.some(w => w.supersetParentId === workout.id);
      if (isCurrentWorkoutUsedAsSuperset) {
        return [];
      }
    }
    
    return workoutsInDay.filter(w => w.id !== workout?.id);
  };

  const getSupersetsForDropdown = (): WorkoutDay[] => {
    return getPossibleSupersets();
  };

  const hasSupersetsToShow = (): boolean => {
    if (workout?.supersetParentId) return true;
    return workoutsInDay.length > 0;
  };

  const getOtherAlternatives = (): WorkoutDay[] => {
    if (!workout) return [];
    return workoutsInDay.filter(w => w.altParentId === workout.id);
  };

  const getOtherSupersets = (): WorkoutDay[] => {
    if (!workout) return [];
    return workoutsInDay.filter(w => w.supersetParentId === workout.id);
  };

  const renderInputField = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string,
    keyboardType: 'default' | 'numeric' = 'default',
    multiline: boolean = false
  ) => (
    <View style={styles.inputContainer}>
      <Text style={[styles.inputLabel, { color: colors.text.primary }]}>{label}</Text>
      <TextInput
        style={[
          styles.input, 
          multiline && styles.multilineInput,
          { 
            backgroundColor: colors.surface, 
            color: colors.text.primary,
            borderColor: colors.border 
          }
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.text.tertiary}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
      />
    </View>
  );

  const renderDropdown = (
    label: string,
    value: string,
    onValueChange: (value: string) => void,
    options: WorkoutDay[],
    emptyOption: string,
    showModal: boolean,
    setShowModal: (show: boolean) => void
  ) => {
    const selectedOption = options.find(option => option.id === value);
    const displayText = selectedOption ? selectedOption.name : emptyOption;

    return (
      <View style={styles.inputContainer}>
        <Text style={[styles.inputLabel, { color: colors.text.primary }]}>{label}</Text>
        <TouchableOpacity
          style={[styles.dropdownButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setShowModal(true)}
        >
          <Text style={[styles.dropdownButtonText, { color: colors.text.primary }]}>{displayText}</Text>
          <Text style={[styles.dropdownArrow, { color: colors.text.secondary }]}>▼</Text>
        </TouchableOpacity>
        
        <Modal
          visible={showModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowModal(false)}
          >
            <View style={[styles.dropdownModal, { backgroundColor: colors.surface }]}>
              <TouchableOpacity
                style={styles.dropdownModalOption}
                onPress={() => {
                  onValueChange('');
                  setShowModal(false);
                }}
              >
                <Text style={[styles.dropdownModalText, { color: colors.text.primary }]}>{emptyOption}</Text>
              </TouchableOpacity>
              {options.map((option, index) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.dropdownModalOption,
                    index === options.length - 1 && styles.dropdownModalOptionLast
                  ]}
                  onPress={() => {
                    onValueChange(option.id);
                    setShowModal(false);
                  }}
                >
                  <Text style={[styles.dropdownModalText, { color: colors.text.primary }]}>{option.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    );
  };

  const renderAlternatives = () => {
    if (!isAlternativesEnabled || workoutsInDay.length === 0) return null;

    const possibleAlternatives = getPossibleAlternatives();
    const otherAlternatives = getOtherAlternatives();

    if (!hasAlternativesToShow() && otherAlternatives.length === 0) return null;

    return (
      <View style={styles.section}>
        {hasAlternativesToShow() && renderDropdown(
          'Alternative For',
          alternativeId,
          setAlternativeId,
          getAlternativesForDropdown(),
          'Select alternative',
          showAlternativeDropdown,
          setShowAlternativeDropdown
        )}
        {otherAlternatives.length > 0 && (
          <View style={styles.otherItemsContainer}>
            <Text style={styles.otherItemsLabel}>Current Alternatives:</Text>
            {otherAlternatives.map(alt => (
              <Text key={alt.id} style={styles.otherItemText}>• {alt.name}</Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderSupersets = () => {
    if (!isSupersetsEnabled || workoutsInDay.length === 0) return null;

    const possibleSupersets = getPossibleSupersets();
    const otherSupersets = getOtherSupersets();

    if (!hasSupersetsToShow() && otherSupersets.length === 0) return null;

    return (
      <View style={styles.section}>
        {hasSupersetsToShow() && renderDropdown(
          'Superset For',
          supersetId,
          setSupersetId,
          getSupersetsForDropdown(),
          'Select superset',
          showSupersetDropdown,
          setShowSupersetDropdown
        )}
        {otherSupersets.length > 0 && (
          <View style={styles.otherItemsContainer}>
            <Text style={styles.otherItemsLabel}>Current Supersets:</Text>
            {otherSupersets.map(superset => (
              <Text key={superset.id} style={styles.otherItemText}>• {superset.name}</Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={[styles.form, { backgroundColor: colors.background }]}>
          {renderInputField('Name', name, setName, 'Exercise name')}
          
          <View style={styles.row}>
            {renderInputField('Weight', weight, setWeight, '0', 'numeric')}
            {renderInputField('Sets', sets, setSets, '0', 'numeric')}
            {renderInputField('Reps', reps, setReps, '0', 'numeric')}
          </View>

          <View style={styles.row}>
            {isAlternativesEnabled && renderAlternatives()}
            {isSupersetsEnabled && renderSupersets()}
          </View>

          {renderInputField('Notes', notes, setNotes, 'Add notes...', 'default', true)}

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.cancelButton, { backgroundColor: colors.background, borderColor: colors.border }]} 
              onPress={onCancel}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text.primary }]}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.saveButton, { backgroundColor: colors.primary }]} 
              onPress={handleSave}
            >
              <Text style={[styles.saveButtonText, { color: '#fff' }]}>
                {workout ? 'Update' : 'Create'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    flex: 1,
    marginHorizontal: 8,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  inputContainer: {
    flex: 1,
    marginBottom: 16,
    marginHorizontal: 4,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModal: {
    backgroundColor: '#fff',
    borderRadius: 8,
    minWidth: 200,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  dropdownModalOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownModalOptionLast: {
    borderBottomWidth: 0,
  },
  dropdownModalText: {
    fontSize: 16,
    color: '#333',
  },
  otherItemsContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
  },
  otherItemsLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    color: '#666',
  },
  otherItemText: {
    fontSize: 14,
    color: '#333',
    marginVertical: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 24,
    paddingBottom: 40,
  },
  cancelButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  saveButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#007AFF',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});
