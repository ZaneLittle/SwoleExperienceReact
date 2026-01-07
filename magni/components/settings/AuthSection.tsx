import React, { useState } from 'react'
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native'
import { useThemeColors } from '../../hooks/useThemeColors'
import { useAuth } from '../../contexts/AuthContext'
import LoginModal from '../auth/LoginModal'
import RegisterModal from '../auth/RegisterModal'

export default function AuthSection() {
  const colors = useThemeColors()
  const { isAuthenticated, user, logout } = useAuth()
  const [showLogin, setShowLogin] = useState(false)
  const [showRegister, setShowRegister] = useState(false)

  const handleLogout = async () => {
    await logout()
  }

  return (
    <>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Account</Text>

        {isAuthenticated && user ? (
          <>
            <View style={[styles.settingItem, { backgroundColor: colors.surface }]}>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: colors.text.primary }]}>Email</Text>
                <Text style={[styles.settingDescription, { color: colors.text.secondary }]}>
                  {user.email}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.settingItem, { backgroundColor: colors.surface }]}
              onPress={handleLogout}
            >
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: colors.text.primary }]}>Log Out</Text>
                <Text style={[styles.settingDescription, { color: colors.text.secondary }]}>
                  Sign out of your account
                </Text>
              </View>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.settingItem, { backgroundColor: colors.surface }]}
              onPress={() => setShowLogin(true)}
            >
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: colors.text.primary }]}>Log In</Text>
                <Text style={[styles.settingDescription, { color: colors.text.secondary }]}>
                  Sign in to sync your data across devices
                </Text>
              </View>
              <Text style={[styles.chevron, { color: colors.text.tertiary }]}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingItem, { backgroundColor: colors.surface }]}
              onPress={() => setShowRegister(true)}
            >
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: colors.text.primary }]}>Create Account</Text>
                <Text style={[styles.settingDescription, { color: colors.text.secondary }]}>
                  Register a new account
                </Text>
              </View>
              <Text style={[styles.chevron, { color: colors.text.tertiary }]}>›</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <LoginModal
        visible={showLogin}
        onClose={() => setShowLogin(false)}
        onSwitchToRegister={() => {
          setShowLogin(false)
          setShowRegister(true)
        }}
      />

      <RegisterModal
        visible={showRegister}
        onClose={() => setShowRegister(false)}
        onSwitchToLogin={() => {
          setShowRegister(false)
          setShowLogin(true)
        }}
      />
    </>
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



