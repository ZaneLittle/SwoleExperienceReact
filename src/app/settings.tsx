import React, { useState } from 'react'
import { Text, View, StyleSheet, TouchableOpacity, ScrollView, Platform, Modal, Alert } from 'react-native'
import WorkoutsConfigure from '../components/workouts/WorkoutsConfigure'
import { useTheme, ThemeMode } from '../contexts/ThemeContext'
import { useThemeColors } from '../hooks/useThemeColors'
import { workoutHistoryService } from '../lib/services/WorkoutHistoryService'

export default function SettingsScreen() {
  const [showWorkoutConfig, setShowWorkoutConfig] = useState(false)
  const [showClearHistoryModal, setShowClearHistoryModal] = useState(false)
  const { themeMode, setThemeMode } = useTheme()
  const colors = useThemeColors()

  if (showWorkoutConfig) {
    return <WorkoutsConfigure onBack={() => setShowWorkoutConfig(false)} />
  }

  const handleThemeModeChange = (mode: ThemeMode) => {
    setThemeMode(mode)
  }

  const handleClearHistory = async () => {
    try {
      const success = await workoutHistoryService.removeAllHistory()
      if (success) {
        Alert.alert('Success', 'All workout history has been cleared.')
      } else {
        Alert.alert('Error', 'Failed to clear workout history. Please try again.')
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred while clearing workout history.')
    }
    setShowClearHistoryModal(false)
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text.primary }]}>Settings</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Workout Management</Text>
          
          <TouchableOpacity 
            style={[styles.settingItem, { backgroundColor: colors.surface }]}
            onPress={() => setShowWorkoutConfig(true)}
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
            onPress={() => setShowClearHistoryModal(true)}
          >
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.error || '#FF4444' }]}>Clear Workout History</Text>
              <Text style={[styles.settingDescription, { color: colors.text.secondary }]}>
                Permanently delete all workout history data
              </Text>
            </View>
            <Text style={[styles.chevron, { color: colors.error || '#FF4444' }]}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Appearance</Text>
          
          <TouchableOpacity 
            style={[styles.settingItem, { backgroundColor: colors.surface }]}
            onPress={() => handleThemeModeChange('system')}
          >
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text.primary }]}>Follow System</Text>
              <Text style={[styles.settingDescription, { color: colors.text.secondary }]}>
                Automatically switch based on device settings
              </Text>
            </View>
            <Text style={[styles.chevron, { color: themeMode === 'system' ? colors.primary : colors.text.tertiary }]}>
              {themeMode === 'system' ? '●' : '○'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, { backgroundColor: colors.surface }]}
            onPress={() => handleThemeModeChange('light')}
          >
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text.primary }]}>Light Mode</Text>
              <Text style={[styles.settingDescription, { color: colors.text.secondary }]}>
                Always use light theme
              </Text>
            </View>
            <Text style={[styles.chevron, { color: themeMode === 'light' ? colors.primary : colors.text.tertiary }]}>
              {themeMode === 'light' ? '●' : '○'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, { backgroundColor: colors.surface }]}
            onPress={() => handleThemeModeChange('dark')}
          >
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text.primary }]}>Dark Mode</Text>
              <Text style={[styles.settingDescription, { color: colors.text.secondary }]}>
                Always use dark theme
              </Text>
            </View>
            <Text style={[styles.chevron, { color: themeMode === 'dark' ? colors.primary : colors.text.tertiary }]}>
              {themeMode === 'dark' ? '●' : '○'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Support</Text>
          
          <TouchableOpacity 
            style={[styles.settingItem, { backgroundColor: colors.surface }]}
            onPress={() => {
              // Open GitHub repository in external browser
              const url = 'https://github.com/ZaneLittle/SwoleExperience/'
              if (Platform.OS === 'web' && window.open) {
                window.open(url, '_blank')
              }
            }}
          >
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text.primary }]}>Visit GitHub Repository</Text>
              <Text style={[styles.settingDescription, { color: colors.text.secondary }]}>
                View source code and leave feedback
              </Text>
            </View>
            <Text style={[styles.chevron, { color: colors.text.tertiary }]}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Clear History Confirmation Modal */}
      <Modal
        visible={showClearHistoryModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowClearHistoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
              Clear Workout History
            </Text>
            <Text style={[styles.modalMessage, { color: colors.text.secondary }]}>
              This will permanently delete all workout history. Are you sure?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setShowClearHistoryModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text.primary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton, { backgroundColor: colors.error || '#FF4444' }]}
                onPress={handleClearHistory}
              >
                <Text style={[styles.modalButtonText, { color: 'white' }]}>Clear History</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  confirmButton: {
    // backgroundColor will be set dynamically
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
})


