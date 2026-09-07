import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { WorkoutDay } from '../../lib/models/WorkoutDay'
import { useThemeColors } from '../../hooks/useThemeColors'
import { ReorderControls } from './ReorderControls'

interface ProgramDayListProps {
  dayCount: number;
  workouts: WorkoutDay[];
  /** The day each current position represented when reordering began. */
  originalDays?: number[];
  selectedDay: number;
  onSelectDay: (day: number) => void;
  onSwapDays: (dayA: number, dayB: number) => void;
}

const summarizeDay = (workouts: WorkoutDay[]): string => {
  const names = [...workouts]
    .sort((a, b) => a.dayOrder - b.dayOrder)
    .map(workout => workout.name)
    .filter(Boolean)

  if (names.length === 0) {
    return 'No workouts'
  }
  return names.join(', ')
}

export function ProgramDayList({
  dayCount,
  workouts,
  originalDays,
  selectedDay,
  onSelectDay,
  onSwapDays,
}: ProgramDayListProps) {
  const colors = useThemeColors()

  if (dayCount < 1) {
    return null
  }

  const days = Array.from({ length: dayCount }, (_, index) => index + 1)

  return (
    <View style={styles.container} testID="program-days-section">
      <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
        Reorder Days
      </Text>
      <Text style={[styles.sectionHint, { color: colors.text.secondary }]}> 
        Use arrows to swap with the day above or below.
      </Text>

      {days.map((day, index) => {
        const dayWorkouts = workouts.filter(workout => workout.day === day)
        const isSelected = day === selectedDay
        const originalDay = originalDays?.[index] ?? day

        return (
          <View
            key={day}
            style={[
              styles.dayRow,
              {
                backgroundColor: colors.surface,
                borderColor: isSelected ? colors.primary : colors.border,
              },
            ]}
            testID={`program-day-row-${day}`}
          >
            <ReorderControls
              index={index}
              totalItems={days.length}
              onMoveUp={() => onSwapDays(day, day - 1)}
              onMoveDown={() => onSwapDays(day, day + 1)}
              upTestID={`move-day-${day}-up`}
              downTestID={`move-day-${day}-down`}
              upAccessibilityLabel={`Swap day ${day} with day ${day - 1}`}
              downAccessibilityLabel={`Swap day ${day} with day ${day + 1}`}
            />
            <TouchableOpacity
              style={styles.dayContent}
              onPress={() => onSelectDay(day)}
              accessibilityRole="button"
              accessibilityLabel={`Select day ${day}`}
              testID={`select-day-${day}`}
            >
              {originalDay === day ? (
                <Text style={[styles.dayLabel, { color: colors.text.primary }]}>Day {day}</Text>
              ) : (
                <View style={styles.dayLabelRow} accessibilityLabel={`Day ${originalDay} to Day ${day}`}>
                  <Text style={[styles.dayLabel, { color: colors.text.primary }]}>Day {originalDay}</Text>
                  <MaterialIcons
                    name="arrow-forward"
                    size={18}
                    color={colors.text.primary}
                    style={styles.dayChangeIcon}
                    testID={`day-change-arrow-${day}`}
                  />
                  <Text style={[styles.dayLabel, { color: colors.text.primary }]}>Day {day}</Text>
                </View>
              )}
              <Text
                style={[styles.daySummary, { color: colors.text.secondary }]}
                numberOfLines={1}
              >
                {summarizeDay(dayWorkouts)}
              </Text>
            </TouchableOpacity>
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 13,
    marginBottom: 12,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginVertical: 4,
    borderRadius: 8,
    borderWidth: 2,
  },
  dayContent: {
    flex: 1,
  },
  dayLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  dayLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayChangeIcon: {
    marginHorizontal: 6,
    marginBottom: 2,
  },
  daySummary: {
    fontSize: 13,
  },
})
