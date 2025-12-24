import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native'
import { useThemeColors } from '../hooks/useThemeColors'
import { BORDER_RADIUS, SPACING, SHADOWS } from '../lib/constants/ui'

export interface ConfirmationButton {
  text: string;
  onPress: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  buttons: ConfirmationButton[];
  onRequestClose?: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  title,
  message,
  buttons,
  onRequestClose,
}) => {
  const colors = useThemeColors()

  const getButtonStyle = (button: ConfirmationButton) => {
    if (button.style === 'destructive') {
      return { backgroundColor: colors.error }
    }
    if (button.style === 'cancel') {
      return { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }
    }
    return { backgroundColor: colors.primary }
  }

  const getButtonTextStyle = (button: ConfirmationButton) => {
    if (button.style === 'destructive' || button.style === 'default') {
      return { color: '#fff' }
    }
    return { color: colors.text.primary }
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onRequestClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onRequestClose}
      >
        <TouchableOpacity
          style={[styles.modalContent, { backgroundColor: colors.surface }]}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={[styles.title, { color: colors.text.primary }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.text.secondary }]}>{message}</Text>
          
          <View style={styles.buttonsContainer}>
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.button,
                  getButtonStyle(button),
                  buttons.length >= 2 && styles.buttonFlex,
                ]}
                onPress={() => {
                  button.onPress()
                  if (onRequestClose) {
                    onRequestClose()
                  }
                }}
              >
                <Text style={[styles.buttonText, getButtonTextStyle(button)]}>
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 400,
    ...SHADOWS.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    marginBottom: SPACING.xl,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    justifyContent: 'space-between',
  },
  button: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    minWidth: 80,
  },
  buttonFlex: {
    flex: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
})

