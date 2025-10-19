import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useThemeColors } from '../../hooks/useThemeColors';

interface WorkoutsHeaderProps {
  dayText: string;
  hasContent: boolean;
  onPreviousDay: () => void;
  onNextDay: () => void;
}

export const WorkoutsHeader: React.FC<WorkoutsHeaderProps> = ({
  dayText,
  hasContent,
  onPreviousDay,
  onNextDay,
}) => {
  const colors = useThemeColors();

  if (!hasContent) {
    return (
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.spacer} testID="header-spacer" />
      </View>
    );
  }

  return (
    <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <View style={styles.spacer} />
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
      <View style={styles.spacer} />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  spacer: {
    width: 36,
  },
});
