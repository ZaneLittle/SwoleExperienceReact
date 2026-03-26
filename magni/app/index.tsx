import { Link } from 'expo-router'
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native'
import { useState } from 'react'
import { useThemeColors } from '../hooks/useThemeColors'
import { useAuth } from '../contexts/AuthContext'
import LoginModal from '../components/auth/LoginModal'
import RegisterModal from '../components/auth/RegisterModal'

export default function HomeScreen() {
  const colors = useThemeColors()
  const { isAuthenticated, user } = useAuth()
  const [showLogin, setShowLogin] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text.primary }]}>Magni</Text>
      <Text style={[styles.subtitle, { color: colors.text.secondary }]}>A simple weight tracker and workout planner</Text>
      
      {isAuthenticated && user ? (
        <View style={styles.authStatus}>
          <Text style={[styles.authText, { color: colors.text.secondary }]}>
            Logged in as {user.email}
          </Text>
        </View>
      ) : (
        <View style={styles.authButtons}>
          <TouchableOpacity
            style={[styles.authButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowLogin(true)}
          >
            <Text style={styles.authButtonText}>Log In</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.authButton, styles.registerButton, { borderColor: colors.primary }]}
            onPress={() => setShowRegister(true)}
          >
            <Text style={[styles.authButtonText, { color: colors.primary }]}>Register</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.links}>
        <Link href="/weight" style={[styles.link, { color: colors.primary }]}>Go to Weight Tracker</Link>
        <Link href="/workouts" style={[styles.link, { color: colors.primary }]}>Go to Workouts</Link>
        <Link href="/settings" style={[styles.link, { color: colors.primary }]}>Go to Settings</Link>
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
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: '700' },
  subtitle: { marginTop: 8 },
  authStatus: {
    marginTop: 24,
    padding: 12,
    borderRadius: 8,
  },
  authText: {
    fontSize: 14,
  },
  authButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    width: '100%',
    maxWidth: 300,
  },
  authButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  authButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  links: { marginTop: 24, gap: 12 },
  link: { marginTop: 8 },
})


