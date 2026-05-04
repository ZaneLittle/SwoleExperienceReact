import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import { WorkoutDay } from '../../lib/models/WorkoutDay'
import { getSyncGroupId } from '../../lib/models/Workout'
import { BankedWorkout, filterBankForActivePrograms } from '../../lib/models/BankedWorkout'
import { workoutService } from '../../lib/services/WorkoutService'
import { workoutBankService } from '../../lib/services/WorkoutBankService'
import { WorkoutCreateUpdateForm } from './WorkoutCreateUpdateForm'
import { WorkoutLibraryModal } from './WorkoutLibraryModal'
import { useThemeColors } from '../../hooks/useThemeColors'
import { confirm, confirmAlert, confirmDelete } from '../../utils/confirm'

interface WorkoutsConfigureProps {
  onBack: () => void;
}

export default function WorkoutsConfigure({ onBack }: WorkoutsConfigureProps) {
  const colors = useThemeColors()
  const [workouts, setWorkouts] = useState<WorkoutDay[]>([])
  const [bankedWorkouts, setBankedWorkouts] = useState<BankedWorkout[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingWorkout, setEditingWorkout] = useState<WorkoutDay | undefined>()
  const [showForm, setShowForm] = useState(false)
  const [showLibrary, setShowLibrary] = useState(false)
  const [selectedDay, setSelectedDay] = useState(1)
  const [totalDays, setTotalDays] = useState(0)

  const loadWorkouts = async () => {
    try {
      setIsLoading(true)
      const [workoutsData, uniqueDays, bankedData] = await Promise.all([
        workoutService.getWorkouts(),
        workoutService.getUniqueDays(),
        workoutBankService.getBankedWorkouts(),
      ])

      setWorkouts(workoutsData)
      setTotalDays(uniqueDays)
      setBankedWorkouts(bankedData)
    } catch (error) {
      console.error('Error loading workouts:', error)
      confirmAlert('Error', 'Failed to load workouts')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadWorkouts()
  }, [])

  const handleAddWorkout = () => {
    setEditingWorkout(undefined)
    setShowForm(true)
  }

  const handleOpenLibrary = () => {
    setShowLibrary(true)
  }

  const handleSaveWorkoutToBank = (workout: WorkoutDay) => {
    const syncGroupId = getSyncGroupId(workout)
    const linkedInstances = workouts.filter(w => getSyncGroupId(w) === syncGroupId)
    const otherDays = Array.from(
      new Set(linkedInstances.filter(w => w.id !== workout.id).map(w => w.day)),
    ).sort((a, b) => a - b)

    let daysList = `Day ${workout.day}`
    if (otherDays.length === 1) {
      daysList = `Days ${workout.day} and ${otherDays[0]}`
    } else if (otherDays.length > 1) {
      const allDays = [workout.day, ...otherDays].sort((a, b) => a - b)
      daysList = `Days ${allDays.slice(0, -1).join(', ')} and ${allDays[allDays.length - 1]}`
    }

    const message = otherDays.length === 0
      ? `Save "${workout.name}" to your workout bank for later? It will be removed from Day ${workout.day} but its weights, reps, and notes will be preserved.`
      : `"${workout.name}" is also scheduled in ${otherDays.length === 1 ? `Day ${otherDays[0]}` : `Days ${otherDays.join(', ')}`}. Saving to your bank will remove it from ${daysList}. Its weights, reps, and notes will be preserved.`

    confirm(
      'Save to Bank?',
      message,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => {} },
        {
          text: 'Save to Bank',
          style: 'default',
          onPress: async () => {
            try {
              const banked = await workoutBankService.bankWorkout(workout)
              if (!banked) {
                confirmAlert('Error', 'Failed to save workout to bank')
                return
              }
              const idsToRemove = linkedInstances.map(w => w.id)
              const removed = await workoutService.removeWorkoutsByIds(idsToRemove)
              if (!removed) {
                confirmAlert(
                  'Error',
                  'Saved to bank but failed to remove all copies from your program. Check other days and remove duplicates manually.',
                )
              }
              await loadWorkouts()
            } catch (error) {
              console.error('Error saving workout to bank:', error)
              confirmAlert('Error', 'Failed to save workout to bank')
            }
          },
        },
      ],
    )
  }

  const handleSelectBankedWorkout = async (banked: BankedWorkout) => {
    try {
      const dayWorkouts = getWorkoutsForDay(selectedDay)
      const newWorkout: WorkoutDay = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        sharedWorkoutId: banked.sharedWorkoutId,
        day: selectedDay,
        dayOrder: dayWorkouts.length + 1,
        name: banked.name,
        weight: banked.weight,
        sets: banked.sets,
        reps: banked.reps,
        notes: banked.notes,
        setDetails: banked.setDetails?.map(detail => ({ ...detail })),
        exerciseMaxId: banked.exerciseMaxId,
        maxPercentage: banked.maxPercentage,
      }

      const created = await workoutService.createWorkout(newWorkout)
      if (!created) {
        confirmAlert('Error', 'Failed to add workout from bank')
        return
      }

      await workoutBankService.removeBankedWorkout(banked.id)
      setShowLibrary(false)
      await loadWorkouts()
    } catch (error) {
      console.error('Error restoring banked workout:', error)
      confirmAlert('Error', 'Failed to add workout from bank')
    }
  }

  const handleDeleteBankedWorkout = (banked: BankedWorkout) => {
    confirmDelete(
      'Remove from Bank',
      `Remove "${banked.name}" from your workout bank? This cannot be undone.`,
      async () => {
        const success = await workoutBankService.removeBankedWorkout(banked.id)
        if (!success) {
          confirmAlert('Error', 'Failed to remove banked workout')
          return
        }
        await loadWorkouts()
      },
      () => {},
    )
  }

  const handleEditWorkout = (workout: WorkoutDay) => {
    setEditingWorkout(workout)
    setShowForm(true)
  }

  const handleDeleteWorkout = async (workout: WorkoutDay) => {
    console.log('handleDeleteWorkout called for:', workout.name, 'day:', workout.day)
    confirmDelete(
      'Delete Workout',
      'Are you sure you want to delete this workout?',
      async () => {
        try {
          // Delete the workout
          const success = await workoutService.removeWorkout(workout.id)
          if (!success) {
            confirmAlert('Error', 'Failed to delete workout')
            return
          }

          // Reload workouts to get updated state
          await loadWorkouts()

          // Check if this was the last workout in the day
          const updatedWorkouts = await workoutService.getWorkouts()
          const dayWorkouts = updatedWorkouts.filter(w => w.day === workout.day)
          const isLastWorkoutInDay = dayWorkouts.length === 0

          if (isLastWorkoutInDay) {
            // Check if this is the last day
            const uniqueDays = Array.from(new Set(updatedWorkouts.map(w => w.day))).sort((a, b) => a - b)
            const isLastDay = uniqueDays.length > 0 && workout.day === uniqueDays[uniqueDays.length - 1]

            if (!isLastDay) {
              console.log('Showing delete day alert after workout deletion')
              confirm(
                'Delete Day?',
                `This was the last workout in Day ${workout.day}. Do you want to delete the entire day?`,
                [
                  {
                    text: 'Keep Day',
                    style: 'cancel',
                    onPress: () => {
                      console.log('Keep Day pressed - day already empty')
                      // Day is already empty, just reload
                      loadWorkouts()
                    },
                  },
                  {
                    text: 'Delete Day',
                    style: 'destructive',
                    onPress: () => {
                      console.log('Delete Day pressed')
                      handleDeleteDay(workout.day).catch(error => {
                        console.error('Error deleting day:', error)
                        confirmAlert('Error', 'Failed to delete day')
                      })
                    },
                  },
                ],
              )
            }
          }
        } catch (error) {
          console.error('Error in handleDeleteWorkout:', error)
          confirmAlert('Error', 'Failed to delete workout')
        }
      },
      () => {
        // Cancel callback - just close the modal, do nothing
      },
    )
  }

  const handleDeleteDay = async (_day: number) => {
    await workoutService.reorderDays().catch(() => {
      confirmAlert('Error', 'Failed to reorder days')
    })
      
    loadWorkouts()  
  }

  const handleSaveWorkout = (_workout: WorkoutDay) => {
    setShowForm(false)
    loadWorkouts()
  }

  const handleMoveWorkout = async (workout: WorkoutDay, direction: 'up' | 'down') => {
    try {
      const dayWorkouts = getWorkoutsForDay(selectedDay)
      const currentIndex = dayWorkouts.findIndex(w => w.id === workout.id)
      
      if (direction === 'up' && currentIndex === 0) return // Already at top
      if (direction === 'down' && currentIndex === dayWorkouts.length - 1) return // Already at bottom
      
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
      const newOrder = [...dayWorkouts];
      
      // Swap the workouts
      [newOrder[currentIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[currentIndex]]
      
      // Update dayOrder for all workouts
      const reorderedIds = newOrder.map(w => w.id)
      const success = await workoutService.reorderWorkouts(selectedDay, reorderedIds)
      
      if (success) {
        loadWorkouts()
      } else {
        confirmAlert('Error', 'Failed to reorder workouts')
      }
    } catch (error) {
      console.error('Error reordering workouts:', error)
      confirmAlert('Error', 'Failed to reorder workouts')
    }
  }

  const getWorkoutsForDay = (day: number): WorkoutDay[] => {
    return workouts.filter(w => w.day === day).sort((a, b) => a.dayOrder - b.dayOrder)
  }

  const getSelectableExistingWorkouts = (): WorkoutDay[] => {
    return workouts
      .filter((workout, index, allWorkouts) => {
        const syncKey = getSyncGroupId(workout)
        return allWorkouts.findIndex(item => getSyncGroupId(item) === syncKey) === index
      })
      .sort((first, second) => first.name.localeCompare(second.name))
  }

  const handleSelectExistingWorkout = async (selectedWorkout: WorkoutDay) => {
    try {
      const dayWorkouts = getWorkoutsForDay(selectedDay)
      const syncGroupId = getSyncGroupId(selectedWorkout)
      const copiedSetDetails = selectedWorkout.setDetails?.map(detail => ({ ...detail }))

      const newWorkout: WorkoutDay = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        sharedWorkoutId: syncGroupId,
        day: selectedDay,
        dayOrder: dayWorkouts.length + 1,
        name: selectedWorkout.name,
        weight: selectedWorkout.weight,
        sets: selectedWorkout.sets,
        reps: selectedWorkout.reps,
        notes: selectedWorkout.notes,
        setDetails: copiedSetDetails,
        exerciseMaxId: selectedWorkout.exerciseMaxId,
        maxPercentage: selectedWorkout.maxPercentage,
      }

      const success = await workoutService.createWorkout(newWorkout)
      if (!success) {
        confirmAlert('Error', 'Failed to add existing workout')
        return
      }

      setShowLibrary(false)
      await loadWorkouts()
    } catch (error) {
      console.error('Error selecting existing workout:', error)
      confirmAlert('Error', 'Failed to add existing workout')
    }
  }

  const handleNextDay = () => {
    const nextDay = selectedDay + 1
    
    if (nextDay > (totalDays || 0)) {
      // If going to a new day, automatically create it
      setTotalDays(nextDay)
    }
    setSelectedDay(nextDay)
  }

  const renderDaySelector = () => (
    <View style={styles.daySelector}>
      <TouchableOpacity 
        style={styles.dayButton}
        onPress={() => setSelectedDay(Math.max(1, selectedDay - 1))}
        disabled={selectedDay <= 1}
        testID="prev-day-button"
      >
        <View style={[styles.navButtonLeft, { borderRightColor: colors.primary }]} />
      </TouchableOpacity>
      
      <View style={styles.dayInfo}>
        <Text style={[
          styles.dayText, 
          selectedDay > (totalDays || 0) && styles.newDayTextStyle,
          { color: colors.text.primary },
        ]}>
          Day {selectedDay}
        </Text>
      </View>
      
      <TouchableOpacity 
        style={styles.dayButton}
        onPress={handleNextDay}
        testID="next-day-button"
      >
        <View style={[
          styles.navButtonRight, 
          { 
            borderLeftColor: colors.primary,
          },
        ]} />
      </TouchableOpacity>
    </View>
  )

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
              accessibilityLabel={`Edit ${workout.name}`}
              accessibilityRole="button"
            >
              <Text style={[styles.editButtonText, { color: colors.primary }]}>✎</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleSaveWorkoutToBank(workout)}
              accessibilityLabel={`Save ${workout.name} to bank`}
              accessibilityRole="button"
            >
              <Text style={[styles.bankButtonText, { color: colors.warning }]}>★</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                handleDeleteWorkout(workout)
              }}
              accessibilityLabel={`Delete ${workout.name}`}
              accessibilityRole="button"
            >
              <Text style={[
                styles.deleteButtonText,
                { color: colors.error },
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
  )

  const renderAddButtons = () => (
    <View style={styles.addButtonsRow}>
      <TouchableOpacity
        style={[
          styles.addButton,
          styles.addButtonHalf,
          { backgroundColor: colors.primary },
        ]}
        onPress={handleAddWorkout}
        accessibilityLabel="Add new workout"
        accessibilityRole="button"
      >
        <Text style={[styles.addButtonText, { color: '#fff' }]}>Add New Workout</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.addButton,
          styles.addButtonHalf,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderWidth: 1,
          },
        ]}
        onPress={handleOpenLibrary}
        accessibilityLabel="Open workout library"
        accessibilityRole="button"
      >
        <Text style={[styles.addButtonText, { color: colors.text.primary }]}>From Library</Text>
      </TouchableOpacity>
    </View>
  )

  const renderWorkoutList = () => {
    const dayWorkouts = getWorkoutsForDay(selectedDay)
    
    if (dayWorkouts.length === 0) {
      const isNewDay = selectedDay > (totalDays || 0)
      return (
        <View style={[styles.emptyState, { backgroundColor: colors.background }]}>
          <Text style={[styles.emptyStateText, { color: colors.text.secondary }]}>
            {isNewDay ? `Create workouts for Day ${selectedDay}` : `No workouts for Day ${selectedDay}`}
          </Text>
          <View style={styles.emptyStateButtons}>
            {renderAddButtons()}
            {!isNewDay && (() => {
              const uniqueDays = Array.from(new Set(workouts.map(w => w.day))).sort((a, b) => a - b)
              const isLastDay = uniqueDays.length > 0 && selectedDay === uniqueDays[uniqueDays.length - 1]
              
              return !isLastDay && (
                <TouchableOpacity 
                  style={styles.deleteDayButton} 
                  onPress={() => {
                    confirm(
                      'Delete Day?',
                      `Are you sure you want to delete Day ${selectedDay}?`,
                      [
                        {
                          text: 'Cancel',
                          style: 'cancel',
                          onPress: () => {},
                        },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: () => handleDeleteDay(selectedDay),
                        },
                      ],
                    )
                  }}
                >
                  <Text style={styles.deleteDayButtonText}>Delete Day</Text>
                </TouchableOpacity>
              )
            })()}
          </View>
        </View>
      )
    }

    return (
      <View style={[styles.workoutListContainer, { backgroundColor: colors.background }]}>
        <ScrollView style={styles.workoutList}>
          {dayWorkouts.map((workout, index) => 
            renderWorkoutItem(workout, index, dayWorkouts.length),
          )}
        </ScrollView>
        {renderAddButtons()}
      </View>
    )
  }

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
  )

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text.secondary }]}>Loading workouts...</Text>
      </View>
    )
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
      {showLibrary && (
        <WorkoutLibraryModal
          activeWorkouts={getSelectableExistingWorkouts()}
          bankedWorkouts={filterBankForActivePrograms(bankedWorkouts, workouts)}
          onSelectActive={handleSelectExistingWorkout}
          onSelectBanked={handleSelectBankedWorkout}
          onDeleteBanked={handleDeleteBankedWorkout}
          onClose={() => setShowLibrary(false)}
        />
      )}
    </View>
  )
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  emptyStateButtons: {
    flexDirection: 'column',
    gap: 12,
    width: '100%',
    paddingHorizontal: 16,
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
  bankButtonText: {
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
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 20, // Add extra bottom margin
  },
  addButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 20,
  },
  addButtonHalf: {
    flex: 1,
    marginTop: 0,
    marginBottom: 0,
    paddingHorizontal: 12,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  deleteDayButton: {
    backgroundColor: '#ff3b30',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  deleteDayButtonText: {
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
})
