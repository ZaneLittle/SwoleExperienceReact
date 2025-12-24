import React from 'react'
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native'
import { ThemeMode } from '../../contexts/ThemeContext'
import { useThemeColors } from '../../hooks/useThemeColors'

interface AppearanceSectionProps {
  themeMode: ThemeMode
  onThemeModeChange: (mode: ThemeMode) => void
}

export default function AppearanceSection({
  themeMode,
  onThemeModeChange,
}: AppearanceSectionProps) {
  const colors = useThemeColors()

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Appearance</Text>
      
      <TouchableOpacity 
        style={[styles.settingItem, { backgroundColor: colors.surface }]}
        onPress={() => onThemeModeChange('system')}
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
        onPress={() => onThemeModeChange('light')}
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
        onPress={() => onThemeModeChange('dark')}
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

