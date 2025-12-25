import React, { useState } from 'react'
import { Text, View, StyleSheet, ScrollView } from 'react-native'
import WorkoutsConfigure from '../components/workouts/WorkoutsConfigure'
import { useTheme, ThemeMode } from '../contexts/ThemeContext'
import { useThemeColors } from '../hooks/useThemeColors'
import { useToast } from '../contexts/ToastContext'
import { workoutHistoryService } from '../lib/services/WorkoutHistoryService'
import { workoutExportService } from '../lib/services/WorkoutExportService'
import { workoutImportService } from '../lib/services/WorkoutImportService'
import WorkoutManagementSection from '../components/settings/WorkoutManagementSection'
import AppearanceSection from '../components/settings/AppearanceSection'
import SupportSection from '../components/settings/SupportSection'
import ClearHistoryModal from '../components/settings/ClearHistoryModal'
import ImportConfirmModal from '../components/settings/ImportConfirmModal'

export default function SettingsScreen() {
  const [showWorkoutConfig, setShowWorkoutConfig] = useState(false)
  const [showClearHistoryModal, setShowClearHistoryModal] = useState(false)
  const [showImportConfirmModal, setShowImportConfirmModal] = useState(false)
  const [pendingImportCSV, setPendingImportCSV] = useState<string | null>(null)
  const { themeMode, setThemeMode } = useTheme()
  const colors = useThemeColors()
  const { showToast } = useToast()

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
        showToast('All workout history has been cleared.', 'success')
      } else {
        showToast('Failed to clear workout history. Please try again.', 'error')
      }
    } catch (error) {
      showToast('An unexpected error occurred while clearing workout history.', 'error')
    }
    setShowClearHistoryModal(false)
  }

  const handleExportWorkouts = async () => {
    try {
      const csv = await workoutExportService.exportWorkouts()
      const date = new Date().toISOString().split('T')[0]
      workoutExportService.downloadCSV(csv, `workouts-${date}.csv`)
      showToast('Workouts exported successfully.', 'success')
    } catch (error) {
      showToast('Failed to export workouts.', 'error')
    }
  }

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      const csv = e.target?.result as string
      if (!csv) return

      const hasExisting = await workoutImportService.hasExistingWorkouts()
      if (hasExisting) {
        setPendingImportCSV(csv)
        setShowImportConfirmModal(true)
      } else {
        await executeImport(csv)
      }
    }
    reader.readAsText(file)
  }

  const executeImport = async (csv: string) => {
    try {
      const success = await workoutImportService.importWorkouts(csv)
      if (success) {
        showToast('Workouts imported successfully.', 'success')
      } else {
        showToast('Failed to import workouts. Please check the file format.', 'error')
      }
    } catch (error) {
      showToast('An unexpected error occurred while importing workouts.', 'error')
    }
  }

  const handleConfirmImport = async () => {
    if (pendingImportCSV) {
      await executeImport(pendingImportCSV)
    }
    setPendingImportCSV(null)
    setShowImportConfirmModal(false)
  }

  const handleCancelImport = () => {
    setPendingImportCSV(null)
    setShowImportConfirmModal(false)
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text.primary }]}>Settings</Text>
      </View>

      <View style={styles.content}>
        <WorkoutManagementSection
          onConfigureWorkouts={() => setShowWorkoutConfig(true)}
          onClearHistory={() => setShowClearHistoryModal(true)}
          onExport={handleExportWorkouts}
          onFileSelected={handleFileSelected}
        />

        <AppearanceSection
          themeMode={themeMode}
          onThemeModeChange={handleThemeModeChange}
        />

        <SupportSection />
      </View>

      <ClearHistoryModal
        visible={showClearHistoryModal}
        onConfirm={handleClearHistory}
        onCancel={() => setShowClearHistoryModal(false)}
      />

      <ImportConfirmModal
        visible={showImportConfirmModal}
        onConfirm={handleConfirmImport}
        onCancel={handleCancelImport}
      />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  scrollView: {
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
})


