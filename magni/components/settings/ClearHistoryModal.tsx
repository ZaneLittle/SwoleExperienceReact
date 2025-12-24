import React from 'react'
import { Text, View, StyleSheet, TouchableOpacity, Modal } from 'react-native'
import { useThemeColors } from '../../hooks/useThemeColors'

interface ClearHistoryModalProps {
  visible: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ClearHistoryModal({
  visible,
  onConfirm,
  onCancel,
}: ClearHistoryModalProps) {
  const colors = useThemeColors()

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
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
              onPress={onCancel}
            >
              <Text style={[styles.modalButtonText, { color: colors.text.primary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButton, { backgroundColor: colors.error || '#FF4444' }]}
              onPress={onConfirm}
            >
              <Text style={[styles.modalButtonText, { color: 'white' }]}>Clear History</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
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

