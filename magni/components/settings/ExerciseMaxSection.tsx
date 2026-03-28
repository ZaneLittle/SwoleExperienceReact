import React, { useState, useEffect, useCallback } from 'react'
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native'
import { ExerciseMax } from '../../lib/models/ExerciseMax'
import { exerciseMaxService } from '../../lib/services/ExerciseMaxService'
import { useThemeColors } from '../../hooks/useThemeColors'
import { confirmDelete } from '../../utils/confirm'
import ExerciseMaxFormModal from './ExerciseMaxFormModal'
import { SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../../lib/constants/ui'

export default function ExerciseMaxSection() {
  const colors = useThemeColors()
  const [maxes, setMaxes] = useState<ExerciseMax[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingMax, setEditingMax] = useState<ExerciseMax | undefined>(undefined)

  const loadMaxes = useCallback(async () => {
    const data = await exerciseMaxService.getExerciseMaxes()
    setMaxes(data)
  }, [])

  useEffect(() => {
    loadMaxes()
  }, [loadMaxes])

  const handleAdd = () => {
    setEditingMax(undefined)
    setShowForm(true)
  }

  const handleEdit = (exerciseMax: ExerciseMax) => {
    setEditingMax(exerciseMax)
    setShowForm(true)
  }

  const handleDelete = (exerciseMax: ExerciseMax) => {
    confirmDelete(
      'Delete Exercise Max',
      `Are you sure you want to delete the max for "${exerciseMax.name}"?`,
      async () => {
        await exerciseMaxService.removeExerciseMax(exerciseMax.id)
        loadMaxes()
      },
    )
  }

  const handleSave = () => {
    setShowForm(false)
    setEditingMax(undefined)
    loadMaxes()
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingMax(undefined)
  }

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Exercise Maxes</Text>

      {maxes.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
          <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
            No exercise maxes set. Add your squat, bench, or deadlift max to use percentage-based programming.
          </Text>
        </View>
      ) : (
        maxes.map((exerciseMax) => (
          <View
            key={exerciseMax.id}
            style={[styles.maxItem, { backgroundColor: colors.surface }]}
          >
            <TouchableOpacity
              style={styles.maxContent}
              onPress={() => handleEdit(exerciseMax)}
              accessibilityLabel={`Edit ${exerciseMax.name} max`}
              accessibilityRole="button"
            >
              <Text style={[styles.maxName, { color: colors.text.primary }]}>{exerciseMax.name}</Text>
              <Text style={[styles.maxWeight, { color: colors.text.secondary }]}>
                {exerciseMax.maxWeight} lbs
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDelete(exerciseMax)}
              style={styles.deleteButton}
              accessibilityLabel={`Delete ${exerciseMax.name} max`}
              accessibilityRole="button"
            >
              <Text style={[styles.deleteText, { color: colors.error || '#FF3B30' }]}>✕</Text>
            </TouchableOpacity>
          </View>
        ))
      )}

      <TouchableOpacity
        style={[styles.addButton, { borderColor: colors.border }]}
        onPress={handleAdd}
        accessibilityLabel="Add exercise max"
        accessibilityRole="button"
      >
        <Text style={[styles.addButtonText, { color: colors.primary }]}>+ Add Exercise Max</Text>
      </TouchableOpacity>

      <ExerciseMaxFormModal
        visible={showForm}
        exerciseMax={editingMax}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyState: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: 1,
    ...SHADOWS.sm,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    lineHeight: 20,
  },
  maxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: 1,
    ...SHADOWS.sm,
  },
  maxContent: {
    flex: 1,
  },
  maxName: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
    marginBottom: 2,
  },
  maxWeight: {
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  deleteButton: {
    padding: SPACING.sm,
    marginLeft: SPACING.sm,
  },
  deleteText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  addButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    borderStyle: 'dashed',
    marginTop: SPACING.sm,
  },
  addButtonText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
})
