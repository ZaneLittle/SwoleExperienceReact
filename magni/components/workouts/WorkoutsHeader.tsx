import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useThemeColors } from '../../hooks/useThemeColors'

interface WorkoutsHeaderProps {
  dayText: string;
  hasContent: boolean;
  onPreviousDay: () => void;
  onNextDay: () => void;
  onReorderDays: () => void;
}

export const WorkoutsHeader: React.FC<WorkoutsHeaderProps> = ({
  dayText,
  hasContent,
  onPreviousDay,
  onNextDay,
  onReorderDays,
}) => {
  const colors = useThemeColors()

  if (!hasContent) {
    return (
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.reorderButton}
          onPress={onReorderDays}
          accessibilityLabel="Reorder workout days"
          accessibilityRole="button"
          testID="reorder-days-button"
        >
          <Text style={[styles.reorderButtonText, { color: colors.primary }]}>✎</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <View style={styles.dayNavigation}>
        <TouchableOpacity 
          style={styles.navButton}
          onPress={onPreviousDay}
          testID="previous-day-button"
        >
          <View style={[styles.navButtonLeft, { borderRightColor: colors.primary }]} />
        </TouchableOpacity>
        
        <Text style={[styles.dayText, { color: colors.text.primary }]}>{dayText}</Text>
        
        <TouchableOpacity 
          style={styles.navButton}
          onPress={onNextDay}
          testID="next-day-button"
        >
          <View style={[styles.navButtonRight, { borderLeftColor: colors.primary }]} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.reorderButton}
        onPress={onReorderDays}
        accessibilityLabel="Reorder workout days"
        accessibilityRole="button"
        testID="reorder-days-button"
      >
        <Text style={[styles.reorderButtonText, { color: colors.primary }]}>✎</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  dayNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 300,
  },
  navButton: {
    padding: 8,
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
  dayText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  reorderButton: {
    position: 'absolute',
    right: 16,
    width: 36,
    height: 36,
    alignItems: 'flex-end',
    justifyContent: 'center',
    padding: 4,
  },
  reorderButtonText: {
    fontSize: 24,
  },
})
