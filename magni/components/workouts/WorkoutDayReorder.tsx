import React, { useCallback, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { WorkoutDay } from '../../lib/models/WorkoutDay'
import { workoutService } from '../../lib/services/WorkoutService'
import { getProgramDayCount } from '../../lib/utils/dayOrder'
import { confirmAlert } from '../../utils/confirm'
import { useThemeColors } from '../../hooks/useThemeColors'
import { ProgramDayList } from './ProgramDayList'

interface WorkoutDayReorderProps {
  onBack: () => void;
}

export default function WorkoutDayReorder({ onBack }: WorkoutDayReorderProps) {
  const colors = useThemeColors()
  const [workouts, setWorkouts] = useState<WorkoutDay[]>([])
  const [totalDays, setTotalDays] = useState(0)
  const [originalDays, setOriginalDays] = useState<number[]>([])
  const [selectedDay, setSelectedDay] = useState(1)
  const [isLoading, setIsLoading] = useState(true)

  const loadWorkouts = useCallback(async (resetOriginalDays = false) => {
    try {
      setIsLoading(true)
      const [workoutsData, dayCount] = await Promise.all([
        workoutService.getWorkouts(),
        workoutService.getUniqueDays(),
      ])
      setWorkouts(workoutsData)
      const programDayCount = Math.max(dayCount, getProgramDayCount(workoutsData))
      setTotalDays(programDayCount)
      if (resetOriginalDays) {
        setOriginalDays(Array.from({ length: programDayCount }, (_, index) => index + 1))
      }
    } catch (error) {
      console.error('Error loading workout days:', error)
      confirmAlert('Error', 'Failed to load workout days')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Stack screens may stay mounted while another settings screen changes the program.
  // Reload on focus so this view never renders a stale workout-day snapshot.
  useFocusEffect(useCallback(() => {
    loadWorkouts(true)
  }, [loadWorkouts]))

  const handleSwapDays = async (dayA: number, dayB: number) => {
    try {
      const success = await workoutService.swapDays(dayA, dayB)
      if (success) {
        setOriginalDays(days => {
          const updatedDays = [...days]
          ;[updatedDays[dayA - 1], updatedDays[dayB - 1]] = [updatedDays[dayB - 1], updatedDays[dayA - 1]]
          return updatedDays
        })
        await loadWorkouts()
        return
      }
      confirmAlert('Error', 'Failed to swap days')
    } catch (error) {
      console.error('Error swapping days:', error)
      confirmAlert('Error', 'Failed to swap days')
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} accessibilityRole="button">
          <Text style={[styles.backButtonText, { color: colors.primary }]}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text.primary }]}>Reorder Workout Days</Text>
        <View style={styles.spacer} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>Loading workout days...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <ProgramDayList
            dayCount={Math.max(totalDays, selectedDay)}
            workouts={workouts}
            originalDays={originalDays}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
            onSwapDays={handleSwapDays}
          />
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    paddingVertical: 4,
  },
  backButtonText: {
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  spacer: {
    width: 44,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
})
