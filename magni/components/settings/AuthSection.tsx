import React, { useState } from 'react'
import { Text, View, StyleSheet, TouchableOpacity, Modal, ActivityIndicator, Platform } from 'react-native'
import { useThemeColors } from '../../hooks/useThemeColors'
import { useAuth } from '../../contexts/AuthContext'
import LoginModal from '../auth/LoginModal'
import RegisterModal from '../auth/RegisterModal'

export default function AuthSection() {
  const colors = useThemeColors()
  const { isAuthenticated, user, logout, deleteAccount } = useAuth()
  const [showLogin, setShowLogin] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleLogout = async () => {
    await logout()
  }

  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    try {
      await deleteAccount()
      setShowDeleteConfirm(false)
    } catch (error) {
      // Error is handled by AuthContext toast
    } finally {
      setIsDeleting(false)
    }
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

            <TouchableOpacity
              style={[styles.settingItem, { backgroundColor: colors.surface }]}
              onPress={() => setShowDeleteConfirm(true)}
            >
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: colors.error || '#FF3B30' }]}>Delete Account</Text>
                <Text style={[styles.settingDescription, { color: colors.text.secondary }]}>
                  Permanently delete your account and all data
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

      <Modal
        visible={showDeleteConfirm}
        animationType="fade"
        transparent={true}
        onRequestClose={() => !isDeleting && setShowDeleteConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>Delete Account</Text>
            <Text style={[styles.modalDescription, { color: colors.text.secondary }]}>
              Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data.
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { borderColor: colors.border }]}
                onPress={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                <Text style={[styles.modalButtonText, { color: colors.text.primary }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButton, { backgroundColor: colors.error || '#FF3B30' }]}
                onPress={handleDeleteAccount}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.deleteButtonText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 12,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  modalDescription: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  deleteButton: {
    marginLeft: 8,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
})



