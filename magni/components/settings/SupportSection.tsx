import React from 'react'
import { Text, View, StyleSheet, TouchableOpacity, Platform } from 'react-native'
import { useThemeColors } from '../../hooks/useThemeColors'

export default function SupportSection() {
  const colors = useThemeColors()

  const handleGitHubClick = () => {
    const url = 'https://github.com/ZaneLittle/SwoleExperience/'
    if (Platform.OS === 'web' && window.open) {
      window.open(url, '_blank')
    }
  }

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Support</Text>
      
      <TouchableOpacity 
        style={[styles.settingItem, { backgroundColor: colors.surface }]}
        onPress={handleGitHubClick}
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

