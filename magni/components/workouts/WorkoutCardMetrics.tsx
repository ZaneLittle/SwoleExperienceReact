import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Workout, WorkoutValidator } from '../../lib/models/Workout'
import { COLORS, TYPOGRAPHY, SPACING } from '../../lib/constants/ui'
import { useThemeColors } from '../../hooks/useThemeColors'

interface WorkoutCardMetricsProps {
  workout: Workout;
}

export const WorkoutCardMetrics: React.FC<WorkoutCardMetricsProps> = ({ workout }) => {
  const colors = useThemeColors()

  if (WorkoutValidator.hasSetDetails(workout)) {
    return (
      <View>
        {workout.setDetails!.map((detail, index) => (
          <View key={index} style={styles.metricsRow}>
            <Text style={[styles.metric, { color: colors.text.secondary }]}>
              Set <Text style={[styles.metricValue, { color: colors.text.primary }]}>{index + 1}</Text>
            </Text>
            <Text style={[styles.metric, { color: colors.text.secondary }]}>
              Weight: <Text style={[styles.metricValue, { color: colors.text.primary }]}>{detail.weight}</Text>
            </Text>
            <Text style={[styles.metric, { color: colors.text.secondary }]}>
              Reps: <Text style={[styles.metricValue, { color: colors.text.primary }]}>{detail.reps}</Text>
            </Text>
          </View>
        ))}
      </View>
    )
  }

  const hasMaxPercentage = !!(workout.exerciseMaxId && workout.maxPercentage)

  return (
    <View style={styles.metricsRow}>
      <Text style={[styles.metric, { color: colors.text.secondary }]}>
        Sets: <Text style={[styles.metricValue, { color: colors.text.primary }]}>{workout.sets}</Text>
      </Text>
      <Text style={[styles.metric, { color: colors.text.secondary }]}>
        Weight: <Text style={[styles.metricValue, { color: colors.text.primary }]}>
          {workout.weight}{hasMaxPercentage ? ` (${workout.maxPercentage}%)` : ''}
        </Text>
      </Text>
      <Text style={[styles.metric, { color: colors.text.secondary }]}>
        Reps: <Text style={[styles.metricValue, { color: colors.text.primary }]}>{workout.reps}</Text>
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  metric: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.text.secondary,
  },
  metricValue: {
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.text.primary,
  },
})
