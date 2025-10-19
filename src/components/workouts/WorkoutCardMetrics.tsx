import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Workout } from '../../lib/models/Workout';
import { COLORS, SPACING, TYPOGRAPHY } from '../../lib/constants/ui';
import { useThemeColors } from '../../hooks/useThemeColors';

interface WorkoutCardMetricsProps {
  workout: Workout;
}

export const WorkoutCardMetrics: React.FC<WorkoutCardMetricsProps> = ({ workout }) => {
  const colors = useThemeColors();
  
  return (
    <View style={styles.metricsRow}>
      <Text style={[styles.metric, { color: colors.text.secondary }]}>
        Weight: <Text style={[styles.metricValue, { color: colors.text.primary }]}>{workout.weight}</Text>
      </Text>
      <Text style={[styles.metric, { color: colors.text.secondary }]}>
        Sets: <Text style={[styles.metricValue, { color: colors.text.primary }]}>{workout.sets}</Text>
      </Text>
      <Text style={[styles.metric, { color: colors.text.secondary }]}>
        Reps: <Text style={[styles.metricValue, { color: colors.text.primary }]}>{workout.reps}</Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metric: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.text.secondary,
  },
  metricValue: {
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.text.primary,
  },
});
