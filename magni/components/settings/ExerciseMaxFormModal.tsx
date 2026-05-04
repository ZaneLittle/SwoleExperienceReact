import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { ExerciseMax, calculateE1RM, EXERCISE_MAX_CONSTRAINTS } from '../../lib/models/ExerciseMax'
import { exerciseMaxService } from '../../lib/services/ExerciseMaxService'
import { workoutService } from '../../lib/services/WorkoutService'
import { useThemeColors } from '../../hooks/useThemeColors'
import { confirmAlert } from '../../utils/confirm'
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../lib/constants/ui'

interface ExerciseMaxFormModalProps {
  visible: boolean;
  exerciseMax?: ExerciseMax;
  onSave: (exerciseMax: ExerciseMax) => void;
  onCancel: () => void;
}

export default function ExerciseMaxFormModal({
  visible,
  exerciseMax,
  onSave,
  onCancel,
}: ExerciseMaxFormModalProps) {
  const colors = useThemeColors()

  const [name, setName] = useState('')
  const [maxWeight, setMaxWeight] = useState('')
  const [amrapWeight, setAmrapWeight] = useState('')
  const [amrapReps, setAmrapReps] = useState('')
  const [showAmrapCalc, setShowAmrapCalc] = useState(false)
  const [errors, setErrors] = useState<{ name?: string; maxWeight?: string; amrapWeight?: string; amrapReps?: string }>({})

  useEffect(() => {
    if (exerciseMax) {
      setName(exerciseMax.name)
      setMaxWeight(exerciseMax.maxWeight.toString())
    } else {
      setName('')
      setMaxWeight('')
    }
    setAmrapWeight('')
    setAmrapReps('')
    setShowAmrapCalc(false)
    setErrors({})
  }, [exerciseMax, visible])

  const estimatedMax = calculateE1RM(Number(amrapWeight) || 0, Number(amrapReps) || 0)

  const handleApplyAmrap = () => {
    const w = Number(amrapWeight)
    const r = Number(amrapReps)
    const newErrors: typeof errors = {}

    if (isNaN(w) || w <= 0) {
      newErrors.amrapWeight = 'Enter a valid weight'
    }
    if (isNaN(r) || r <= 0 || !Number.isInteger(r)) {
      newErrors.amrapReps = 'Enter a valid rep count'
    }
    if (r > EXERCISE_MAX_CONSTRAINTS.AMRAP_REPS_LIMIT) {
      newErrors.amrapReps = `Reps cannot exceed ${EXERCISE_MAX_CONSTRAINTS.AMRAP_REPS_LIMIT}`
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...newErrors }))
      return
    }

    setMaxWeight(estimatedMax.toString())
    setShowAmrapCalc(false)
    setErrors({})
  }

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {}

    if (!name.trim()) {
      newErrors.name = 'Exercise name is required'
    }
    if (name.length > EXERCISE_MAX_CONSTRAINTS.NAME_LENGTH_LIMIT) {
      newErrors.name = `Name cannot exceed ${EXERCISE_MAX_CONSTRAINTS.NAME_LENGTH_LIMIT} characters`
    }

    const weightNum = Number(maxWeight)
    if (maxWeight === '' || isNaN(weightNum) || weightNum <= 0) {
      newErrors.maxWeight = 'Enter a valid max weight'
    }
    if (weightNum > EXERCISE_MAX_CONSTRAINTS.WEIGHT_LIMIT) {
      newErrors.maxWeight = `Weight cannot exceed ${EXERCISE_MAX_CONSTRAINTS.WEIGHT_LIMIT}`
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return

    const data: ExerciseMax = {
      id: exerciseMax?.id || Date.now().toString(),
      name: name.trim(),
      maxWeight: Number(maxWeight),
      lastUpdated: new Date().toISOString().split('T')[0],
    }

    const success = exerciseMax
      ? await exerciseMaxService.updateExerciseMax(data)
      : await exerciseMaxService.createExerciseMax(data)

    if (success && exerciseMax && exerciseMax.maxWeight !== data.maxWeight) {
      const synced = await workoutService.applyExerciseMaxChangeToWorkouts(
        data.id,
        data.maxWeight,
        exerciseMax.maxWeight,
      )
      if (!synced) {
        confirmAlert(
          'Workout update failed',
          'Your max was saved, but some workouts could not be updated to match. Try editing those workouts manually.',
        )
      }
    }

    if (success) {
      onSave(data)
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <Text style={[styles.title, { color: colors.text.primary }]}>
                {exerciseMax ? 'Edit Exercise Max' : 'Add Exercise Max'}
              </Text>
              <TouchableOpacity
                onPress={onCancel}
                style={styles.closeButton}
                accessibilityLabel="Close"
                accessibilityRole="button"
              >
                <Text style={[styles.closeText, { color: colors.text.secondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.text.primary }]}>Exercise Name</Text>
                <TextInput
                  style={[styles.input, {
                    backgroundColor: colors.surface,
                    color: colors.text.primary,
                    borderColor: errors.name ? '#ff4444' : colors.border,
                  }]}
                  value={name}
                  onChangeText={(text) => {
                    setName(text)
                    if (errors.name) setErrors(prev => ({ ...prev, name: undefined }))
                  }}
                  placeholder="Exercise Name"
                  placeholderTextColor={colors.text.tertiary}
                  accessibilityLabel="Exercise name"
                />
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
              </View>

              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.text.primary }]}>1 Rep Max</Text>
                <TextInput
                  style={[styles.input, {
                    backgroundColor: colors.surface,
                    color: colors.text.primary,
                    borderColor: errors.maxWeight ? '#ff4444' : colors.border,
                  }]}
                  value={maxWeight}
                  onChangeText={(text) => {
                    setMaxWeight(text)
                    if (errors.maxWeight) setErrors(prev => ({ ...prev, maxWeight: undefined }))
                  }}
                  placeholder="0"
                  placeholderTextColor={colors.text.tertiary}
                  keyboardType="numeric"
                  accessibilityLabel="One rep max weight"
                />
                {errors.maxWeight && <Text style={styles.errorText}>{errors.maxWeight}</Text>}
              </View>

              <TouchableOpacity
                style={[styles.amrapToggle, { borderColor: colors.border }]}
                onPress={() => setShowAmrapCalc(!showAmrapCalc)}
                accessibilityLabel="Estimate from AMRAP set"
                accessibilityRole="button"
              >
                <Text style={[styles.amrapToggleText, { color: colors.primary }]}>
                  {showAmrapCalc ? 'Hide AMRAP Calculator' : 'Estimate from AMRAP'}
                </Text>
              </TouchableOpacity>

              {showAmrapCalc && (
                <View style={[styles.amrapSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.amrapDescription, { color: colors.text.secondary }]}>
                    Enter the weight and reps from an AMRAP set to estimate your 1RM.
                  </Text>

                  <View style={styles.amrapRow}>
                    <View style={styles.amrapField}>
                      <Text style={[styles.label, { color: colors.text.primary }]}>Weight</Text>
                      <TextInput
                        style={[styles.input, {
                          backgroundColor: colors.background,
                          color: colors.text.primary,
                          borderColor: errors.amrapWeight ? '#ff4444' : colors.border,
                        }]}
                        value={amrapWeight}
                        onChangeText={(text) => {
                          setAmrapWeight(text)
                          if (errors.amrapWeight) setErrors(prev => ({ ...prev, amrapWeight: undefined }))
                        }}
                        placeholder="0"
                        placeholderTextColor={colors.text.tertiary}
                        keyboardType="numeric"
                        accessibilityLabel="AMRAP weight"
                      />
                      {errors.amrapWeight && <Text style={styles.errorText}>{errors.amrapWeight}</Text>}
                    </View>

                    <View style={styles.amrapField}>
                      <Text style={[styles.label, { color: colors.text.primary }]}>Reps</Text>
                      <TextInput
                        style={[styles.input, {
                          backgroundColor: colors.background,
                          color: colors.text.primary,
                          borderColor: errors.amrapReps ? '#ff4444' : colors.border,
                        }]}
                        value={amrapReps}
                        onChangeText={(text) => {
                          setAmrapReps(text)
                          if (errors.amrapReps) setErrors(prev => ({ ...prev, amrapReps: undefined }))
                        }}
                        placeholder="0"
                        placeholderTextColor={colors.text.tertiary}
                        keyboardType="numeric"
                        accessibilityLabel="AMRAP reps"
                      />
                      {errors.amrapReps && <Text style={styles.errorText}>{errors.amrapReps}</Text>}
                    </View>
                  </View>

                  {estimatedMax > 0 && (
                    <Text style={[styles.estimatedMax, { color: colors.text.primary }]}>
                      Estimated 1RM: <Text style={{ fontWeight: TYPOGRAPHY.weights.bold }}>{estimatedMax}</Text>
                    </Text>
                  )}

                  <TouchableOpacity
                    style={[styles.applyButton, { backgroundColor: colors.primary }]}
                    onPress={handleApplyAmrap}
                    accessibilityLabel="Apply estimated max"
                    accessibilityRole="button"
                  >
                    <Text style={styles.applyButtonText}>Apply Estimate</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.cancelButton, { borderColor: colors.border }]}
                  onPress={onCancel}
                  accessibilityLabel="Cancel"
                  accessibilityRole="button"
                >
                  <Text style={[styles.cancelButtonText, { color: colors.text.primary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: colors.primary }]}
                  onPress={handleSave}
                  accessibilityLabel={exerciseMax ? 'Update exercise max' : 'Save exercise max'}
                  accessibilityRole="button"
                >
                  <Text style={styles.saveButtonText}>{exerciseMax ? 'Update' : 'Save'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  closeButton: {
    padding: SPACING.sm,
  },
  closeText: {
    fontSize: TYPOGRAPHY.sizes.lg,
  },
  body: {
    padding: SPACING.lg,
  },
  field: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginBottom: SPACING.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.md,
  },
  errorText: {
    color: '#ff4444',
    fontSize: TYPOGRAPHY.sizes.xs,
    marginTop: SPACING.xs,
  },
  amrapToggle: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
  },
  amrapToggleText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  amrapSection: {
    padding: SPACING.md,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
  },
  amrapDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    marginBottom: SPACING.md,
  },
  amrapRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  amrapField: {
    flex: 1,
    marginBottom: SPACING.sm,
  },
  estimatedMax: {
    fontSize: TYPOGRAPHY.sizes.md,
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  applyButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.xs,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.xl,
    paddingBottom: SPACING.xxxl,
  },
  cancelButton: {
    paddingHorizontal: SPACING.xxxl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  saveButton: {
    paddingHorizontal: SPACING.xxxl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
})
