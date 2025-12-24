import React, { useRef } from 'react'
import { Text, View, StyleSheet, TouchableOpacity, Platform } from 'react-native'
import { useThemeColors } from '../../hooks/useThemeColors'

interface WorkoutManagementSectionProps {
  onConfigureWorkouts: () => void
  onClearHistory: () => void
  onExport: () => void
  onFileSelected: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export default function WorkoutManagementSection({
  onConfigureWorkouts,
  onClearHistory,
  onExport,
  onFileSelected,
}: WorkoutManagementSectionProps) {
  const colors = useThemeColors()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImportClick = () => {
    if (Platform.OS === 'web' && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Workout Management</Text>
      
      <TouchableOpacity 
        style={[styles.settingItem, { backgroundColor: colors.surface }]}
        onPress={onConfigureWorkouts}
      >
        <View style={styles.settingContent}>
          <Text style={[styles.settingTitle, { color: colors.text.primary }]}>Configure Workouts</Text>
          <Text style={[styles.settingDescription, { color: colors.text.secondary }]}>
            Add, edit, and organize your workout routines
          </Text>
        </View>
        <Text style={[styles.chevron, { color: colors.text.tertiary }]}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.settingItem, { backgroundColor: colors.surface }]}
        onPress={onExport}
      >
        <View style={styles.settingContent}>
          <Text style={[styles.settingTitle, { color: colors.text.primary }]}>Export Workouts</Text>
          <Text style={[styles.settingDescription, { color: colors.text.secondary }]}>
            Download your workouts as a CSV file
          </Text>
        </View>
        <Text style={[styles.chevron, { color: colors.text.tertiary }]}>↓</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.settingItem, { backgroundColor: colors.surface }]}
        onPress={handleImportClick}
      >
        <View style={styles.settingContent}>
          <Text style={[styles.settingTitle, { color: colors.text.primary }]}>Import Workouts</Text>
          <Text style={[styles.settingDescription, { color: colors.text.secondary }]}>
            Import workouts from a CSV file
          </Text>
        </View>
        <Text style={[styles.chevron, { color: colors.text.tertiary }]}>↑</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.settingItem, { backgroundColor: colors.surface }]}
        onPress={onClearHistory}
      >
        <View style={styles.settingContent}>
          <Text style={[styles.settingTitle, { color: colors.error || '#FF4444' }]}>Clear Workout History</Text>
          <Text style={[styles.settingDescription, { color: colors.text.secondary }]}>
            Permanently delete all workout history data
          </Text>
        </View>
        <Text style={[styles.chevron, { color: colors.error || '#FF4444' }]}>›</Text>
      </TouchableOpacity>

      {Platform.OS === 'web' && (
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={onFileSelected}
          style={{ display: 'none' }}
        />
      )}
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
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
  },
  chevron: {
    fontSize: 16,
    marginLeft: 8,
  },
})

