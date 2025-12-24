import React, { useState, useEffect, useMemo } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native'
import { TimeClock } from '@mui/x-date-pickers/TimeClock'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { useThemeColors } from '../hooks/useThemeColors'
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../lib/constants/ui'

interface TimePickerModalProps {
  visible: boolean;
  currentDate: Date;
  onClose: () => void;
  onTimeSelected: (date: Date) => void;
}

const HIGHLIGHT_OPACITY = '15'
const VIEW_SWITCH_DELAY = 100
const CLOCK_SCALE = 1.3
const WHITE_COLOR = '#FFFFFF'

const convertHoursForAMPM = (hours24: number, isAM: boolean): number => {
  if (isAM && hours24 >= 12) {
    return hours24 - 12
  }
  if (!isAM && hours24 < 12) {
    return hours24 + 12
  }
  return hours24
}

export const TimePickerModal: React.FC<TimePickerModalProps> = ({
  visible,
  currentDate,
  onClose,
  onTimeSelected,
}) => {
  const colors = useThemeColors()
  const [selectedTime, setSelectedTime] = useState<Date>(currentDate)
  const [isAM, setIsAM] = useState(currentDate.getHours() < 12)
  const [view, setView] = useState<'hours' | 'minutes'>('hours')

  useEffect(() => {
    setSelectedTime(currentDate)
    setIsAM(currentDate.getHours() < 12)
    setView('hours')
  }, [currentDate, visible])

  const handleTimeChange = (value: Date | null) => {
    if (!value) return
    
    const newTime = new Date(selectedTime)
    
    if (view === 'hours') {
      const hours = convertHoursForAMPM(value.getHours(), isAM)
      newTime.setHours(hours, newTime.getMinutes(), 0, 0)
      setSelectedTime(newTime)
      setTimeout(() => setView('minutes'), VIEW_SWITCH_DELAY)
    } else {
      newTime.setMinutes(value.getMinutes(), 0, 0)
      setSelectedTime(newTime)
    }
  }

  const handleAMPMToggle = (newIsAM: boolean) => {
    setIsAM(newIsAM)
    const newTime = new Date(selectedTime)
    const convertedHours = convertHoursForAMPM(newTime.getHours(), newIsAM)
    newTime.setHours(convertedHours)
    setSelectedTime(newTime)
  }

  const handleConfirm = () => {
    const newDate = new Date(currentDate)
    newDate.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0)
    onTimeSelected(newDate)
    onClose()
  }

  const hourDisplay = useMemo(() => {
    const hours = selectedTime.getHours() % 12 || 12
    return hours.toString().padStart(2, '0')
  }, [selectedTime])

  const minuteDisplay = useMemo(() => {
    return selectedTime.getMinutes().toString().padStart(2, '0')
  }, [selectedTime])

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <View style={styles.timeDisplayRow}>
            <View style={styles.timeDisplayContainer}>
              <TouchableOpacity
                onPress={() => setView('hours')}
                style={[
                  styles.timePartTouchable,
                  view === 'hours' && { backgroundColor: colors.primary + HIGHLIGHT_OPACITY },
                ]}
              >
                <Text style={[
                  styles.timeDisplayText,
                  { color: view === 'hours' ? colors.primary : colors.text.primary },
                ]}>
                  {hourDisplay}
                </Text>
              </TouchableOpacity>
              <Text style={[styles.timeDisplayText, { color: colors.text.primary }]}>:</Text>
              <TouchableOpacity
                onPress={() => setView('minutes')}
                style={[
                  styles.timePartTouchable,
                  view === 'minutes' && { backgroundColor: colors.primary + HIGHLIGHT_OPACITY },
                ]}
              >
                <Text style={[
                  styles.timeDisplayText,
                  { color: view === 'minutes' ? colors.primary : colors.text.primary },
                ]}>
                  {minuteDisplay}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.amPmContainer}>
              <TouchableOpacity
                style={[
                  styles.amPmButton,
                  { backgroundColor: isAM ? colors.primary : colors.background },
                ]}
                onPress={() => handleAMPMToggle(true)}
              >
                  <Text
                  style={[
                    styles.amPmButtonText,
                    { color: isAM ? WHITE_COLOR : colors.text.primary },
                  ]}
                >
                  AM
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.amPmButton,
                  { backgroundColor: !isAM ? colors.primary : colors.background },
                ]}
                onPress={() => handleAMPMToggle(false)}
              >
                <Text
                  style={[
                    styles.amPmButtonText,
                    { color: !isAM ? WHITE_COLOR : colors.text.primary },
                  ]}
                >
                  PM
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={[styles.clockContainer, { transform: [{ scale: CLOCK_SCALE }] }]}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <TimeClock
                value={selectedTime}
                onChange={handleTimeChange}
                ampm={true}
                views={[view]}
                sx={{
                  '& .MuiClock-clock': {
                    backgroundColor: colors.background,
                  },
                  '& .MuiClockNumber-root': {
                    color: WHITE_COLOR,
                  },
                  '& .MuiClock-wrapper': {
                    color: WHITE_COLOR,
                  },
                }}
              />
            </LocalizationProvider>
          </View>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.modalButton, { backgroundColor: colors.background }]} 
              onPress={onClose}
            >
              <Text style={[styles.modalButtonText, { color: colors.text.primary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalButton, { backgroundColor: colors.primary }]} 
              onPress={handleConfirm}
            >
              <Text style={[styles.modalButtonText, { color: WHITE_COLOR }]}>Select Time</Text>
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
  },
  modalContent: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    margin: SPACING.lg,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  timeDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xxxl,
    gap: SPACING.md,
  },
  timeDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  timePartTouchable: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeDisplayText: {
    fontSize: 48,
    lineHeight: 48,
    fontWeight: TYPOGRAPHY.weights.bold,
    textAlign: 'center',
    includeFontPadding: false,
    marginTop: 2,
    marginBottom: -6, // Compensate for baseline spacing
  },
  clockContainer: {
    marginBottom: SPACING.xxxl * 2,
    marginTop: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amPmContainer: {
    flexDirection: 'column',
    gap: SPACING.xs,
    alignItems: 'center',
  },
  amPmButton: {
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    minWidth: 60,
    alignItems: 'center',
  },
  amPmButtonText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
    width: '100%',
  },
  modalButton: {
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    flex: 1,
  },
  modalButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
})
