import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native'
import { WorkoutDay } from '../../lib/models/WorkoutDay'
import { WorkoutValidator, SetDetail } from '../../lib/models/Workout'
import { workoutService } from '../../lib/services/WorkoutService'
import { useThemeColors } from '../../hooks/useThemeColors'
import { confirmAlert } from '../../utils/confirm'
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../lib/constants/ui'

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
  const colors = useThemeColors()
  const [name, setName] = useState(workout?.name || '')
  const [weight, setWeight] = useState(workout?.weight?.toString() || '')
  const [sets, setSets] = useState(workout?.sets?.toString() || '')
  const [reps, setReps] = useState(workout?.reps?.toString() || '')
  const [notes, setNotes] = useState(workout?.notes || '')
  const [alternativeId, setAlternativeId] = useState<string>('')
  const [supersetId, setSupersetId] = useState<string>('')
  const [showAlternativeDropdown, setShowAlternativeDropdown] = useState(false)
  const [showSupersetDropdown, setShowSupersetDropdown] = useState(false)
  const [perSetMode, setPerSetMode] = useState<boolean>(
    !!(workout?.setDetails && workout.setDetails.length > 0),
  )
  const [setDetails, setSetDetails] = useState<SetDetail[]>(
    workout?.setDetails ?? [],
  )
  const [errors, setErrors] = useState<{
    name?: string;
    weight?: string;
    sets?: string;
    reps?: string;
    setDetails?: Record<number, { weight?: string; reps?: string }>;
  }>({})

  useEffect(() => {
    if (workout?.altParentId) {
      setAlternativeId(workout.altParentId)
    } else {
      setAlternativeId('')
    }
    if (workout?.supersetParentId) {
      setSupersetId(workout.supersetParentId)
    } else {
      setSupersetId('')
    }
    setErrors({})
  }, [workout])

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {}

    if (!name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (perSetMode) {
      if (setDetails.length === 0) {
        newErrors.sets = 'Add at least one set'
      }
      const detailErrors: Record<number, { weight?: string; reps?: string }> = {}
      setDetails.forEach((detail, index) => {
        const rowErrors: { weight?: string; reps?: string } = {}
        if (isNaN(detail.weight) || detail.weight < 0) {
          rowErrors.weight = 'Invalid'
        }
        if (isNaN(detail.reps) || detail.reps < 0) {
          rowErrors.reps = 'Invalid'
        }
        if (Object.keys(rowErrors).length > 0) {
          detailErrors[index] = rowErrors
        }
      })
      if (Object.keys(detailErrors).length > 0) {
        newErrors.setDetails = detailErrors
      }
    } else {
      const weightNum = Number(weight)
      if (weight === '' || weight.trim() === '' || isNaN(weightNum) || weightNum < 0) {
        newErrors.weight = 'Please enter a valid weight'
      }
      const setsNum = Number(sets)
      if (sets === '' || sets.trim() === '' || isNaN(setsNum) || setsNum < 0) {
        newErrors.sets = 'Please enter a valid number of sets'
      }
      const repsNum = Number(reps)
      if (reps === '' || reps.trim() === '' || isNaN(repsNum) || repsNum < 0) {
        newErrors.reps = 'Please enter a valid number of reps'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return

    try {
      const workoutDay = workout?.day ?? day

      const resolvedWeight = perSetMode && setDetails.length > 0
        ? setDetails[0].weight
        : Number(weight)
      const resolvedSets = perSetMode
        ? setDetails.length
        : Number(sets)
      const resolvedReps = perSetMode && setDetails.length > 0
        ? setDetails[0].reps
        : Number(reps)

      const workoutData: WorkoutDay = {
        id: workout?.id || Date.now().toString(),
        day: workoutDay,
        dayOrder: workout?.dayOrder ?? defaultOrder,
        name: name.trim(),
        weight: resolvedWeight,
        sets: resolvedSets,
        reps: resolvedReps,
        notes: notes.trim() || undefined,
        altParentId: alternativeId || undefined,
        supersetParentId: supersetId || undefined,
        setDetails: perSetMode ? setDetails : undefined,
      }

      WorkoutValidator.validate(workoutData)

      const success = workout 
        ? await workoutService.updateWorkout(workoutData)
        : await workoutService.createWorkout(workoutData)

      if (success) {
        onSave(workoutData)
      } else {
        confirmAlert('Error', 'Failed to save workout')
      }
    } catch (error) {
      confirmAlert('Error', error instanceof Error ? error.message : 'An error occurred')
    }
  }

  const getPossibleAlternatives = (): WorkoutDay[] => {
    if (workout?.id) {
      const isCurrentWorkoutUsedAsAlternative = workoutsInDay.some(w => w.altParentId === workout.id)
      if (isCurrentWorkoutUsedAsAlternative) {
        return []
      }
    }
    
    return workoutsInDay.filter(w => w.id !== workout?.id)
  }

  const getAlternativesForDropdown = (): WorkoutDay[] => {
    return getPossibleAlternatives()
  }

  const hasAlternativesToShow = (): boolean => {
    if (workout?.altParentId) return true
    return workoutsInDay.length > 0
  }

  const getPossibleSupersets = (): WorkoutDay[] => {
    if (workout?.id) {
      const isCurrentWorkoutUsedAsSuperset = workoutsInDay.some(w => w.supersetParentId === workout.id)
      if (isCurrentWorkoutUsedAsSuperset) {
        return []
      }
    }
    
    return workoutsInDay.filter(w => w.id !== workout?.id)
  }

  const getSupersetsForDropdown = (): WorkoutDay[] => {
    return getPossibleSupersets()
  }

  const hasSupersetsToShow = (): boolean => {
    if (workout?.supersetParentId) return true
    return workoutsInDay.length > 0
  }

  const getOtherAlternatives = (): WorkoutDay[] => {
    if (!workout) return []
    return workoutsInDay.filter(w => w.altParentId === workout.id)
  }

  const getOtherSupersets = (): WorkoutDay[] => {
    if (!workout) return []
    return workoutsInDay.filter(w => w.supersetParentId === workout.id)
  }

  const renderInputField = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string,
    keyboardType: 'default' | 'numeric' = 'default',
    multiline: boolean = false,
    error?: string,
    errorKey?: keyof typeof errors,
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
            borderColor: error ? '#ff4444' : colors.border, 
          },
        ]}
        value={value}
        onChangeText={(text) => {
          onChangeText(text)
          // Clear error when user starts typing
          if (errorKey && errors[errorKey]) {
            setErrors(prev => {
              const newErrors = { ...prev }
              delete newErrors[errorKey]
              return newErrors
            })
          }
        }}
        placeholder={placeholder}
        placeholderTextColor={colors.text.tertiary}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
      />
      {error && (
        <Text style={[styles.errorText, { color: '#ff4444' }]}>{error}</Text>
      )}
    </View>
  )

  const renderDropdown = (
    label: string,
    value: string,
    onValueChange: (value: string) => void,
    options: WorkoutDay[],
    emptyOption: string,
    showModal: boolean,
    setShowModal: (show: boolean) => void,
  ) => {
    const selectedOption = options.find(option => option.id === value)
    const displayText = selectedOption ? selectedOption.name : emptyOption

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
                  onValueChange('')
                  setShowModal(false)
                }}
              >
                <Text style={[styles.dropdownModalText, { color: colors.text.primary }]}>{emptyOption}</Text>
              </TouchableOpacity>
              {options.map((option, index) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.dropdownModalOption,
                    index === options.length - 1 && styles.dropdownModalOptionLast,
                  ]}
                  onPress={() => {
                    onValueChange(option.id)
                    setShowModal(false)
                  }}
                >
                  <Text style={[styles.dropdownModalText, { color: colors.text.primary }]}>{option.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    )
  }

  const renderAlternatives = () => {
    if (!isAlternativesEnabled || workoutsInDay.length === 0) return null

    const otherAlternatives = getOtherAlternatives()

    if (!hasAlternativesToShow() && otherAlternatives.length === 0) return null

    return (
      <View style={styles.section}>
        {hasAlternativesToShow() && renderDropdown(
          'Alternative For',
          alternativeId,
          setAlternativeId,
          getAlternativesForDropdown(),
          'Select alternative',
          showAlternativeDropdown,
          setShowAlternativeDropdown,
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
    )
  }

  const renderSupersets = () => {
    if (!isSupersetsEnabled || workoutsInDay.length === 0) return null

    const otherSupersets = getOtherSupersets()

    if (!hasSupersetsToShow() && otherSupersets.length === 0) return null

    return (
      <View style={styles.section}>
        {hasSupersetsToShow() && renderDropdown(
          'Superset For',
          supersetId,
          setSupersetId,
          getSupersetsForDropdown(),
          'Select superset',
          showSupersetDropdown,
          setShowSupersetDropdown,
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
    )
  }

  const handleTogglePerSetMode = () => {
    if (!perSetMode) {
      const count = Math.max(Number(sets) || 1, 1)
      const w = Number(weight) || 0
      const r = Number(reps) || 0
      setSetDetails(Array.from({ length: count }, () => ({ weight: w, reps: r })))
    } else {
      if (setDetails.length > 0) {
        setWeight(String(setDetails[0].weight))
        setReps(String(setDetails[0].reps))
        setSets(String(setDetails.length))
      }
      setSetDetails([])
    }
    setPerSetMode(prev => !prev)
    setErrors({})
  }

  const updateSetDetail = (index: number, field: keyof SetDetail, value: string) => {
    setSetDetails(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: Number(value) || 0 }
      return updated
    })
    if (errors.setDetails?.[index]?.[field]) {
      setErrors(prev => {
        const detailErrors = { ...prev.setDetails }
        if (detailErrors[index]) {
          const rowErrors = { ...detailErrors[index] }
          delete rowErrors[field]
          if (Object.keys(rowErrors).length === 0) {
            delete detailErrors[index]
          } else {
            detailErrors[index] = rowErrors
          }
        }
        return {
          ...prev,
          setDetails: Object.keys(detailErrors).length > 0 ? detailErrors : undefined,
        }
      })
    }
  }

  const addSet = () => {
    const lastSet = setDetails[setDetails.length - 1]
    setSetDetails(prev => [...prev, lastSet ? { ...lastSet } : { weight: 0, reps: 0 }])
  }

  const removeSet = (index: number) => {
    if (setDetails.length <= 1) return
    setSetDetails(prev => prev.filter((_, i) => i !== index))
  }

  const renderPerSetDetails = () => (
    <View style={formStyles.setDetailsContainer}>
      <View style={formStyles.setDetailsHeader}>
        <Text style={[formStyles.setDetailsHeaderText, { color: colors.text.secondary }]}>Set</Text>
        <Text style={[formStyles.setDetailsHeaderText, formStyles.setDetailsHeaderWeight, { color: colors.text.secondary }]}>Weight</Text>
        <Text style={[formStyles.setDetailsHeaderText, formStyles.setDetailsHeaderReps, { color: colors.text.secondary }]}>Reps</Text>
        <View style={formStyles.setDetailsRemoveColumn} />
      </View>
      {setDetails.map((detail, index) => (
        <View key={index} style={formStyles.setDetailRow}>
          <Text style={[formStyles.setDetailLabel, { color: colors.text.primary }]}>{index + 1}</Text>
          <TextInput
            style={[
              formStyles.setDetailInput,
              {
                backgroundColor: colors.surface,
                color: colors.text.primary,
                borderColor: errors.setDetails?.[index]?.weight ? '#ff4444' : colors.border,
              },
            ]}
            value={String(detail.weight)}
            onChangeText={(text) => updateSetDetail(index, 'weight', text)}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={colors.text.tertiary}
          />
          <TextInput
            style={[
              formStyles.setDetailInput,
              {
                backgroundColor: colors.surface,
                color: colors.text.primary,
                borderColor: errors.setDetails?.[index]?.reps ? '#ff4444' : colors.border,
              },
            ]}
            value={String(detail.reps)}
            onChangeText={(text) => updateSetDetail(index, 'reps', text)}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={colors.text.tertiary}
          />
          <TouchableOpacity
            onPress={() => removeSet(index)}
            disabled={setDetails.length <= 1}
            style={formStyles.setDetailRemoveButton}
          >
            <Text style={[
              formStyles.setDetailRemoveText,
              setDetails.length <= 1 && { opacity: 0.3 },
            ]}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity
        style={[formStyles.addSetButton, { borderColor: colors.border }]}
        onPress={addSet}
      >
        <Text style={[formStyles.addSetButtonText, { color: colors.primary }]}>+ Add Set</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={[styles.form, { backgroundColor: colors.background }]}>
          {renderInputField('Name', name, setName, 'Exercise name', 'default', false, errors.name, 'name')}
          
          {!perSetMode && (
            <View style={styles.row}>
              {renderInputField('Weight', weight, setWeight, '0', 'numeric', false, errors.weight, 'weight')}
              {renderInputField('Sets', sets, setSets, '0', 'numeric', false, errors.sets, 'sets')}
              {renderInputField('Reps', reps, setReps, '0', 'numeric', false, errors.reps, 'reps')}
            </View>
          )}

          <TouchableOpacity
            style={[formStyles.toggleButton, { borderColor: colors.border }]}
            onPress={handleTogglePerSetMode}
          >
            <Text style={[formStyles.toggleButtonText, { color: colors.primary }]}>
              {perSetMode ? 'Use Standard Mode' : 'Per-Set Details'}
            </Text>
          </TouchableOpacity>

          {perSetMode && renderPerSetDetails()}

          {errors.sets && perSetMode && (
            <Text style={[styles.errorText, { color: '#ff4444' }]}>{errors.sets}</Text>
          )}

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
  )
}

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
  errorText: {
    fontSize: 12,
    marginTop: 4,
    color: '#ff4444',
  },
})

const formStyles = StyleSheet.create({
  toggleButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
    marginHorizontal: 4,
  },
  toggleButtonText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  setDetailsContainer: {
    marginBottom: SPACING.lg,
    marginHorizontal: 4,
  },
  setDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },
  setDetailsHeaderText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.semibold,
    textTransform: 'uppercase',
    width: 40,
  },
  setDetailsHeaderWeight: {
    flex: 1,
    marginHorizontal: SPACING.xs,
  },
  setDetailsHeaderReps: {
    flex: 1,
    marginHorizontal: SPACING.xs,
  },
  setDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  setDetailLabel: {
    width: 40,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    textAlign: 'center',
  },
  setDetailInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.md,
    marginHorizontal: SPACING.xs,
  },
  setDetailRemoveButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setDetailRemoveText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: '#ff4444',
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  setDetailsRemoveColumn: {
    width: 32,
  },
  addSetButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    borderStyle: 'dashed',
    marginTop: SPACING.xs,
  },
  addSetButtonText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
})
