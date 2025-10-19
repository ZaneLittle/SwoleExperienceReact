import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Workout } from '../../lib/models/Workout';
import { COLORS, SPACING, TYPOGRAPHY } from '../../lib/constants/ui';
import { useThemeColors } from '../../hooks/useThemeColors';

interface WorkoutCardHeaderProps {
  workout: Workout;
  hasPrevious: boolean;
  hasNext: boolean;
  canDelete: boolean;
  allowUpdate: boolean;
  onDelete: () => void;
  onUpdate: () => void;
}

export const WorkoutCardHeader: React.FC<WorkoutCardHeaderProps> = ({
  workout,
  hasPrevious,
  hasNext,
  canDelete,
  allowUpdate,
  onDelete,
  onUpdate,
}) => {
  const colors = useThemeColors();
  
  return (
    <View style={styles.nameRow}>
      {hasPrevious && <View style={styles.chevronLeft} />}
      
      <View style={styles.titleContainer}>
        <Text style={[styles.workoutName, { color: colors.text.primary }]}>{workout.name}</Text>
        
        <View style={styles.buttonsContainer}>
          {canDelete && (
            <TouchableOpacity 
              style={styles.titleButton}
              onPress={onDelete}
            >
              <Text style={[styles.deleteButtonText, { color: colors.error }]}>×</Text>
            </TouchableOpacity>
          )}
          
          {allowUpdate && (
            <TouchableOpacity 
              style={styles.titleButton}
              onPress={onUpdate}
            >
              <Text style={[styles.editButtonText, { color: colors.primary }]}>✎</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {hasNext && <View style={styles.chevronRight} />}
    </View>
  );
};

const styles = StyleSheet.create({
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  buttonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  titleButton: {
    padding: SPACING.xs,
    marginHorizontal: SPACING.xs,
  },
  workoutName: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    textAlign: 'center',
    marginHorizontal: SPACING.sm,
    flex: 1,
    flexShrink: 1,
  },
  chevronLeft: {
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderRightWidth: 12,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: COLORS.primary,
  },
  chevronRight: {
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderLeftWidth: 12,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: COLORS.primary,
  },
  editButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  deleteButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
});
