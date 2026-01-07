import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native'
import { useThemeColors } from '../../hooks/useThemeColors'
import { useAuth } from '../../contexts/AuthContext'

interface RegisterModalProps {
  visible: boolean
  onClose: () => void
  onSwitchToLogin?: () => void
}

export default function RegisterModal({ visible, onClose, onSwitchToLogin }: RegisterModalProps) {
  const colors = useThemeColors()
  const { register } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleRegister = async () => {
    if (!email.trim() || !password.trim()) {
      return
    }

    if (password !== confirmPassword) {
      return
    }

    if (password.length < 8) {
      return
    }

    setIsLoading(true)
    try {
      await register(email.trim(), password)
      setEmail('')
      setPassword('')
      setConfirmPassword('')
      onClose()
    } catch (error) {
      // Error is handled by AuthContext toast
    } finally {
      setIsLoading(false)
    }
  }

  const isPasswordValid = password.length >= 8
  const doPasswordsMatch = password === confirmPassword || confirmPassword === ''

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.text.primary }]}>Create Account</Text>

          <View style={styles.form}>
            <Text style={[styles.label, { color: colors.text.secondary }]}>Email</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  color: colors.text.primary,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Enter your email"
              placeholderTextColor={colors.text.tertiary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />

            <Text style={[styles.label, { color: colors.text.secondary }]}>Password</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  color: colors.text.primary,
                  borderColor: colors.border,
                },
              ]}
              placeholder="At least 8 characters"
              placeholderTextColor={colors.text.tertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
            {password.length > 0 && !isPasswordValid && (
              <Text style={[styles.errorText, { color: colors.error }]}>
                Password must be at least 8 characters
              </Text>
            )}

            <Text style={[styles.label, { color: colors.text.secondary }]}>Confirm Password</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  color: colors.text.primary,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Confirm your password"
              placeholderTextColor={colors.text.tertiary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
            {confirmPassword.length > 0 && !doPasswordsMatch && (
              <Text style={[styles.errorText, { color: colors.error }]}>
                Passwords do not match
              </Text>
            )}

            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: colors.primary,
                  opacity:
                    isLoading ||
                    !email.trim() ||
                    !password.trim() ||
                    !confirmPassword.trim() ||
                    !isPasswordValid ||
                    !doPasswordsMatch
                      ? 0.5
                      : 1,
                },
              ]}
              onPress={handleRegister}
              disabled={
                isLoading ||
                !email.trim() ||
                !password.trim() ||
                !confirmPassword.trim() ||
                !isPasswordValid ||
                !doPasswordsMatch
              }
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            {onSwitchToLogin && (
              <TouchableOpacity
                style={styles.switchButton}
                onPress={onSwitchToLogin}
                disabled={isLoading}
              >
                <Text style={[styles.switchText, { color: colors.primary }]}>
                  Already have an account? Log In
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            disabled={isLoading}
          >
            <Text style={[styles.closeText, { color: colors.text.secondary }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 12,
    padding: 24,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
      },
    }),
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
  },
  form: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  button: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  switchButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  switchText: {
    fontSize: 14,
    fontWeight: '500',
  },
  closeButton: {
    marginTop: 8,
    alignItems: 'center',
  },
  closeText: {
    fontSize: 14,
  },
})

