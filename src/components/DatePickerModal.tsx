import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
} from 'react-native'
import Calendar from 'react-calendar'
import { useThemeColors } from '../hooks/useThemeColors'
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../lib/constants/ui'

// Only import CSS on web platform
if (Platform.OS === 'web') {
  require('react-calendar/dist/Calendar.css')
}

interface DatePickerModalProps {
  visible: boolean;
  currentDate: Date;
  onClose: () => void;
  onDateSelected: (date: Date) => void;
}

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  visible,
  currentDate,
  onClose,
  onDateSelected,
}) => {
  const colors = useThemeColors()
  const [selectedDate, setSelectedDate] = useState<Date>(currentDate)

  // Update selected date when currentDate changes
  useEffect(() => {
    setSelectedDate(currentDate)
  }, [currentDate, visible])

  const handleDateChange = (value: any) => {
    if (!value) return
    const date = Array.isArray(value) ? value[0] : value
    if (date instanceof Date) {
      setSelectedDate(date)
    }
  }

  const handleConfirm = () => {
    // Preserve the time from currentDate, only update the date part
    const newDate = new Date(currentDate)
    newDate.setFullYear(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
    )
    onDateSelected(newDate)
    onClose()
  }

  // Generate CSS styles for the calendar based on theme
  const calendarStyles = `
    .react-calendar {
      background-color: ${colors.surface};
      color: ${colors.text.primary};
      border: 1px solid ${colors.border};
      border-radius: ${BORDER_RADIUS.md}px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      width: 100%;
      max-width: 100%;
    }
    .react-calendar__navigation {
      display: flex;
      height: 44px;
      margin-bottom: 1em;
      border-bottom: 1px solid ${colors.border};
    }
    .react-calendar__navigation button {
      min-width: 44px;
      background: none;
      font-size: ${TYPOGRAPHY.sizes.md}px;
      font-weight: ${TYPOGRAPHY.weights.semibold};
      color: ${colors.text.primary};
      border: none;
      cursor: pointer;
    }
    .react-calendar__navigation button:hover {
      background-color: ${colors.background};
    }
    .react-calendar__navigation button:enabled:hover,
    .react-calendar__navigation button:enabled:focus {
      background-color: ${colors.background};
    }
    .react-calendar__navigation button[disabled] {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .react-calendar__month-view__weekdays {
      text-align: center;
      text-transform: uppercase;
      font-weight: ${TYPOGRAPHY.weights.semibold};
      font-size: ${TYPOGRAPHY.sizes.xs}px;
      color: ${colors.text.secondary};
      padding-bottom: ${SPACING.xs}px;
    }
    .react-calendar__month-view__weekdays__weekday {
      padding: ${SPACING.xs}px;
    }
    .react-calendar__month-view__weekdays__weekday abbr {
      text-decoration: none;
    }
    .react-calendar__month-view__days {
      display: grid !important;
      grid-template-columns: repeat(7, 1fr);
    }
    .react-calendar__tile {
      max-width: 100%;
      text-align: center;
      padding: ${SPACING.sm}px;
      background: none;
      font-size: ${TYPOGRAPHY.sizes.sm}px;
      color: ${colors.text.primary};
      border: none;
      cursor: pointer;
      aspect-ratio: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .react-calendar__tile:enabled:hover,
    .react-calendar__tile:enabled:focus {
      background-color: ${colors.background};
      border-radius: ${BORDER_RADIUS.sm}px;
    }
    .react-calendar__tile--now {
      background-color: ${colors.background};
      border-radius: ${BORDER_RADIUS.sm}px;
      font-weight: ${TYPOGRAPHY.weights.semibold};
    }
    .react-calendar__tile--now:enabled:hover,
    .react-calendar__tile--now:enabled:focus {
      background-color: ${colors.background};
    }
    .react-calendar__tile--active {
      background-color: ${colors.primary};
      color: ${colors.surface};
      border-radius: ${BORDER_RADIUS.sm}px;
      font-weight: ${TYPOGRAPHY.weights.semibold};
    }
    .react-calendar__tile--active:enabled:hover,
    .react-calendar__tile--active:enabled:focus {
      background-color: ${colors.primary};
      opacity: 0.9;
    }
    .react-calendar__tile--neighboringMonth {
      color: ${colors.text.tertiary};
    }
    .react-calendar__tile--disabled {
      opacity: 0.3;
      cursor: not-allowed;
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
          {Platform.OS === 'web' && <style>{calendarStyles}</style>}
          <Text style={[styles.modalTitle, { color: colors.text.primary }]}>Select Date</Text>
          
          <View style={styles.calendarContainer}>
            <Calendar
              onChange={handleDateChange}
              value={selectedDate}
              calendarType="gregory"
              showNeighboringMonth={true}
              next2Label={null}
              prev2Label={null}
            />
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
              <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Select Date</Text>
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
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  calendarContainer: {
    marginBottom: SPACING.md,
    width: '100%',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
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
