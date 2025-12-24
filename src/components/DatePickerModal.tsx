import React, { useState, useEffect } from 'react'
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Text,
} from 'react-native'
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { useThemeColors } from '../hooks/useThemeColors'
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../lib/constants/ui'

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

  const handleDateChange = (value: Date | null) => {
    if (!value) return
    setSelectedDate(value)
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

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <View style={styles.calendarContainer}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateCalendar
                value={selectedDate}
                onChange={handleDateChange}
                slotProps={{
                  day: {
                    sx: {
                      color: colors.text.primary,
                      fontSize: '1rem',
                      '&.Mui-selected': {
                        backgroundColor: colors.primary,
                        color: '#FFFFFF',
                      },
                      '&.MuiPickersDay-today': {
                        borderColor: colors.primary,
                      },
                    },
                  },
                }}
                sx={{
                  '& .MuiPickersCalendarHeader-root': {
                    color: colors.text.primary,
                  },
                  '& .MuiDayCalendar-weekContainer': {
                    color: colors.text.primary,
                  },
                  // Week day labels header row - target all children
                  '& .MuiDayCalendar-header': {
                    '& span': {
                      color: colors.primary,
                      fontWeight: 600,
                    },
                    '& *': {
                      color: colors.primary,
                      fontWeight: 600,
                    },
                  },
                  // Year selection styling - target buttons
                  '& .MuiYearCalendar-button': {
                    color: colors.text.primary,
                    '&.Mui-selected': {
                      backgroundColor: colors.primary,
                      color: '#FFFFFF',
                    },
                  },
                  '& button[class*="MuiYearCalendar"]': {
                    color: colors.text.primary,
                    '&.Mui-selected': {
                      backgroundColor: colors.primary,
                      color: '#FFFFFF',
                    },
                  },
                  '& .MuiPickersDay-root': {
                  '& .MuiDayCalendar-weekDayLabel': {
                    color: colors.primary,
                    fontWeight: 600,
                  },
                    color: colors.text.primary,
                    fontSize: '1rem',
                    '&.Mui-selected': {
                      backgroundColor: colors.primary,
                      color: '#FFFFFF',
                    },
                    '&.MuiPickersDay-today': {
                      borderColor: colors.primary,
                    },
                  },
                  '& .MuiPickersCalendarHeader-label': {
                    color: colors.text.primary,
                    fontSize: '1.1rem',
                  },
                  '& .MuiPickersArrowSwitcher-button': {
                    color: colors.text.primary,
                  },
                  backgroundColor: colors.surface,
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
    width: 'auto',
    maxWidth: 380,
    alignSelf: 'center',
  },
  calendarContainer: {
    marginBottom: SPACING.md,
    width: 'auto',
    alignItems: 'center',
    justifyContent: 'center',
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
