import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { WorkoutValidator } from '../../lib/models/Workout';
import { WorkoutCardProps, WorkoutCardWorkout } from './WorkoutCardTypes';
import { WorkoutCardHeader } from './WorkoutCardHeader';
import { WorkoutCardMetrics } from './WorkoutCardMetrics';
import { WorkoutCardNotes } from './WorkoutCardNotes';
import { WorkoutCardSupersets } from './WorkoutCardSupersets';
import { COLORS, SPACING, SHADOWS, BORDER_RADIUS } from '../../lib/constants/ui';
import { useThemeColors } from '../../hooks/useThemeColors';

const { width: screenWidth } = Dimensions.get('window');

export const WorkoutCard: React.FC<WorkoutCardProps> = React.memo(({
  workout,
  allowDelete = false,
  allowUpdate = false,
  onDelete,
  onUpdate,
  workoutsInDay = [],
  alternatives = [],
  supersets = [],
  isSupersetsEnabled = false,
  isAlternativesEnabled = false,
  isProgressionHelperEnabled = false,
}) => {
  const colors = useThemeColors();
  const [currentAlternativeIndex, setCurrentAlternativeIndex] = useState(0);

  // Memoized calculations for better performance
  const mainNote = useMemo(() => {
    let note = workout.notes;
    for (const superset of supersets) {
      if (note) {
        note += `\n${superset.notes}`;
      } else {
        note = superset.notes;
      }
    }
    return note;
  }, [workout.notes, supersets]);

  const hasAlternativesOrSupersets = useMemo(() => {
    return (alternatives && alternatives.length > 0) || (supersets && supersets.length > 0);
  }, [alternatives, supersets]);

  const canDelete = useMemo(() => {
    return allowDelete && !hasAlternativesOrSupersets;
  }, [allowDelete, hasAlternativesOrSupersets]);

  const handleLongPress = () => {
    if (allowUpdate && onUpdate && 'day' in workout) {
      onUpdate(workout as any);
    }
  };

  const handleDelete = () => {
    if (allowDelete && onDelete && 'day' in workout) {
      Alert.alert(
        'Delete Workout',
        'Are you sure you want to delete this workout?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => onDelete(workout as any) }
        ]
      );
    }
  };

  const renderMainCard = () => (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <TouchableOpacity
        style={styles.infoSection}
        onLongPress={handleLongPress}
        activeOpacity={0.7}
      >
        <View style={styles.workoutInfo}>
          <WorkoutCardHeader
            workout={workout}
            hasPrevious={false}
            hasNext={alternatives.length > 0}
            canDelete={canDelete}
            allowUpdate={allowUpdate}
            onDelete={handleDelete}
            onUpdate={handleLongPress}
          />
          <WorkoutCardMetrics workout={workout} />
        </View>
      </TouchableOpacity>
      
      <WorkoutCardSupersets
        supersets={supersets}
        allowUpdate={allowUpdate}
        onUpdate={handleLongPress}
      />
      
      <WorkoutCardNotes notes={mainNote || ''} isMain />
    </View>
  );

  const renderAlternativeCard = (alternative: any, index: number) => (
    <View key={alternative.id} style={styles.card}>
      <TouchableOpacity
        style={styles.infoSection}
        onLongPress={handleLongPress}
        activeOpacity={0.7}
      >
        <View style={styles.workoutInfo}>
          <WorkoutCardHeader
            workout={alternative}
            hasPrevious={index > 0}
            hasNext={index < alternatives.length - 1}
            canDelete={false}
            allowUpdate={allowUpdate}
            onDelete={() => {}}
            onUpdate={handleLongPress}
          />
          <WorkoutCardMetrics workout={alternative} />
        </View>
      </TouchableOpacity>
      <WorkoutCardNotes notes={alternative.notes || ''} />
    </View>
  );

  const renderCardList = () => {
    const cards = [<View key="main">{renderMainCard()}</View>];
    alternatives.forEach((alternative, index) => {
      cards.push(<View key={`alt-${alternative.id}-${index}`}>{renderAlternativeCard(alternative, index)}</View>);
    });
    return cards;
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.horizontalScroll}
        contentContainerStyle={styles.scrollContent}
      >
        {renderCardList()}
      </ScrollView>
    </View>
  );
});

WorkoutCard.displayName = 'WorkoutCard';

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.sm,
  },
  horizontalScroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.sm,
    paddingRight: SPACING.sm,
  },
  card: {
    marginHorizontal: SPACING.xs,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.md,
    width: screenWidth - 48, // Account for scroll padding (16px) + margins (8px) + extra buffer (24px)
  },
  infoSection: {
    paddingVertical: SPACING.sm,
  },
  workoutInfo: {
    paddingBottom: SPACING.sm,
  },
});