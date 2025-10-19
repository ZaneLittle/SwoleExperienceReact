import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Workout } from '../../lib/models/Workout';
import { WorkoutCardHeader } from './WorkoutCardHeader';
import { WorkoutCardMetrics } from './WorkoutCardMetrics';
import { WorkoutCardNotes } from './WorkoutCardNotes';
import { SPACING } from '../../lib/constants/ui';

interface WorkoutCardSupersetsProps {
  supersets: Workout[];
  allowUpdate: boolean;
  onUpdate: (workout: Workout) => void;
}

export const WorkoutCardSupersets: React.FC<WorkoutCardSupersetsProps> = ({
  supersets,
  allowUpdate,
  onUpdate,
}) => {
  if (!supersets.length) return null;

  return (
    <View style={styles.supersetsContainer}>
      {supersets.map((superset) => (
        <View key={superset.id} style={styles.supersetItem}>
          <WorkoutCardHeader
            workout={superset}
            hasPrevious={false}
            hasNext={false}
            canDelete={false}
            allowUpdate={allowUpdate}
            onDelete={() => {}}
            onUpdate={() => onUpdate(superset)}
          />
          <WorkoutCardMetrics workout={superset} />
          <WorkoutCardNotes notes={superset.notes || ''} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  supersetsContainer: {
    marginTop: SPACING.sm,
  },
  supersetItem: {
    marginVertical: SPACING.xs,
  },
});
