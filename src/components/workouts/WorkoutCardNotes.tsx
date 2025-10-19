import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../lib/constants/ui';
import { useThemeColors } from '../../hooks/useThemeColors';

interface WorkoutCardNotesProps {
  notes: string;
  isMain?: boolean;
}

export const WorkoutCardNotes: React.FC<WorkoutCardNotesProps> = ({ notes, isMain = false }) => {
  const colors = useThemeColors();
  
  if (!notes || notes.trim() === '') {
    return null;
  }

  return (
    <View style={[styles.notesContainer, { backgroundColor: colors.background + '80' }]}>
      <ScrollView style={styles.notesScroll}>
        <Text style={[styles.notesText, { color: colors.text.secondary }]}>{notes}</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  notesContainer: {
    marginTop: SPACING.sm,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  notesScroll: {
    maxHeight: 60,
  },
  notesText: {
    fontStyle: 'italic',
    fontSize: TYPOGRAPHY.sizes.sm,
  },
});
