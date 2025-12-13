import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
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

  // Update selected time when currentDate changes
  useEffect(() => {
    setSelectedTime(currentDate)
    setIsAM(currentDate.getHours() < 12)
    setView('hours') // Reset to hours view when modal opens
  }, [currentDate, visible])

  const handleTimeChange = (value: Date | null) => {
    if (!value) return
    
    const newTime = new Date(selectedTime)
    
    if (view === 'hours') {
      // Update only the hour, preserve minutes
      let hours = value.getHours()
      const minutes = newTime.getMinutes()
      
      // Adjust for AM/PM preference
      if (isAM && hours >= 12) {
        hours = hours - 12
      } else if (!isAM && hours < 12) {
        hours = hours + 12
      }
      
      // Only update if the hour actually changed
      if (newTime.getHours() !== hours) {
        newTime.setHours(hours, minutes, 0, 0)
        setSelectedTime(newTime)
        // Automatically switch to minutes view after hour selection
        setTimeout(() => setView('minutes'), 100)
      }
    } else {
      // Update only the minutes, preserve hours
      const hours = newTime.getHours()
      const minutes = value.getMinutes()
      
      // Only update if the minute actually changed
      if (newTime.getMinutes() !== minutes) {
        newTime.setHours(hours, minutes, 0, 0)
        setSelectedTime(newTime)
      }
    }
  }

  const handleAMPMToggle = (newIsAM: boolean) => {
    setIsAM(newIsAM)
    // Adjust the hours based on AM/PM change
    const newTime = new Date(selectedTime)
    let hours = newTime.getHours()
    
    if (newIsAM && hours >= 12) {
      hours = hours - 12
    } else if (!newIsAM && hours < 12) {
      hours = hours + 12
    }
    
    newTime.setHours(hours)
    setSelectedTime(newTime)
  }

  const handleConfirm = () => {
    // Preserve the date from currentDate, only update the time part
    const newDate = new Date(currentDate)
    newDate.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0)
    onTimeSelected(newDate)
    onClose()
  }

  const getHourPart = (date: Date) => {
    const hours = date.getHours() % 12 || 12
    return hours.toString().padStart(2, '0')
  }

  const getMinutePart = (date: Date) => {
    return date.getMinutes().toString().padStart(2, '0')
  }

  // Generate CSS styles for the clock - darker background with white text
  // Based on actual MUI Clock HTML structure
  const clockStyles = `
    .MuiTimeClock-root {
      transform: scale(1.3) !important;
      transform-origin: center !important;
    }
    .MuiClock-clock {
      background-color: ${colors.background} !important;
    }
    .MuiClockNumber-root {
      color: #FFFFFF !important;
      cursor: pointer !important;
    }
    .MuiClock-wrapper {
      color: #FFFFFF !important;
    }
    .MuiClock-wrapper > span {
      cursor: pointer !important;
    }
  `

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          {Platform.OS === 'web' && <style>{clockStyles}</style>}
          <View style={styles.timeDisplayRow}>
            <View style={styles.timeDisplayContainer}>
              <TouchableOpacity
                onPress={() => setView('hours')}
                style={[
                  styles.timePartTouchable,
                  view === 'hours' && { backgroundColor: colors.primary + '15' },
                ]}
              >
                <Text style={[
                  styles.timeDisplayText,
                  { color: view === 'hours' ? colors.primary : colors.text.primary },
                ]}>
                  {getHourPart(selectedTime)}
                </Text>
              </TouchableOpacity>
              <Text style={[styles.timeDisplayText, { color: colors.text.primary }]}>:</Text>
              <TouchableOpacity
                onPress={() => setView('minutes')}
                style={[
                  styles.timePartTouchable,
                  view === 'minutes' && { backgroundColor: colors.primary + '15' },
                ]}
              >
                <Text style={[
                  styles.timeDisplayText,
                  { color: view === 'minutes' ? colors.primary : colors.text.primary },
                ]}>
                  {getMinutePart(selectedTime)}
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
                    { color: isAM ? '#FFFFFF' : colors.text.primary },
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
                    { color: !isAM ? '#FFFFFF' : colors.text.primary },
                  ]}
                >
                  PM
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.clockContainer}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <TimeClock
                value={selectedTime}
                onChange={handleTimeChange}
                ampm={true}
                views={[view]}
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
              <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Select Time</Text>
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
    marginBottom: -6,
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
