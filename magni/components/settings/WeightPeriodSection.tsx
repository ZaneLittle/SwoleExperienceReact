import React from 'react'
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native'
import { WeightPeriodWindow } from '../../contexts/WeightPeriodContext'
import { useThemeColors } from '../../hooks/useThemeColors'

interface WeightPeriodSectionProps {
  periodWindow: WeightPeriodWindow
  onPeriodWindowChange: (window: WeightPeriodWindow) => void
}

export default function WeightPeriodSection({
  periodWindow,
  onPeriodWindowChange,
}: WeightPeriodSectionProps) {
  const colors = useThemeColors()

  const periodOptions: Array<{ value: WeightPeriodWindow; label: string }> = [
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: 'twoMonths', label: '2 Months' },
    { value: 'sixMonths', label: '6 Months' },
    { value: 'twelveMonths', label: '12 Months' },
  ]

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Weight Chart Period</Text>
      <Text style={[styles.sectionDescription, { color: colors.text.secondary }]}>
        Select the time period to display on the weight chart
      </Text>
      
      {periodOptions.map((option) => (
        <TouchableOpacity 
          key={option.value}
          style={[styles.settingItem, { backgroundColor: colors.surface }]}
          onPress={() => onPeriodWindowChange(option.value)}
        >
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: colors.text.primary }]}>{option.label}</Text>
          </View>
          <Text style={[styles.chevron, { color: periodWindow === option.value ? colors.primary : colors.text.tertiary }]}>
            {periodWindow === option.value ? '●' : '○'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  chevron: {
    fontSize: 16,
    marginLeft: 8,
  },
})
