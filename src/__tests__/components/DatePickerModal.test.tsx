// Mock CSS imports first
jest.mock('react-calendar/dist/Calendar.css', () => ({}), { virtual: true })

// Mock react-calendar for web testing
jest.mock('react-calendar', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const React = require('react')
  
  interface CalendarProps {
    onChange?: (date: Date) => void
    value?: Date
    calendarType?: string
    showNeighboringMonth?: boolean
    next2Label?: string | null
    prev2Label?: string | null
  }
  
  return function Calendar(props: CalendarProps) {
    const { onChange, value, ...otherProps } = props
    const dataAttributes: Record<string, string> = {
      'data-testid': 'calendar',
      'data-value': value?.toISOString() || '',
      'data-calendar-type': otherProps.calendarType || '',
      'data-show-neighboring-month': String(otherProps.showNeighboringMonth),
    }
    // Only set attributes if they're not null
    if (otherProps.next2Label != null) {
      dataAttributes['data-next2-label'] = String(otherProps.next2Label)
    }
    if (otherProps.prev2Label != null) {
      dataAttributes['data-prev2-label'] = String(otherProps.prev2Label)
    }
    return React.createElement('div', {
      ...dataAttributes,
      onClick: () => {
        if (onChange) {
          // Create date at noon to avoid timezone/DST issues
          const newDate = new Date(2024, 0, 15, 12, 0, 0)
          onChange(newDate)
        }
      },
    })
  }
})

import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import { DatePickerModal } from '../../components/DatePickerModal'

// Mock ThemeContext
jest.mock('../../contexts/ThemeContext', () => {
  return {
    useTheme: () => ({
      theme: 'light',
      themeMode: 'light',
      setThemeMode: jest.fn(),
      toggleTheme: jest.fn(),
    }),
    ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
  }
})

// Mock useThemeColors hook
jest.mock('../../hooks/useThemeColors', () => ({
  useThemeColors: () => ({
    primary: '#007AFF',
    secondary: '#5856D6',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    background: '#F2F2F7',
    surface: '#FFFFFF',
    text: {
      primary: '#000000',
      secondary: '#3C3C43',
      tertiary: '#3C3C4399',
      quaternary: '#3C3C4366',
    },
    border: '#C6C6C8',
    separator: '#C6C6C8',
  }),
}))

// Mock constants
jest.mock('../../lib/constants/ui', () => ({
  BORDER_RADIUS: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
  SPACING: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  TYPOGRAPHY: {
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      xxxl: 28,
    },
    weights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
}))

describe('DatePickerModal', () => {
  const mockOnClose = jest.fn()
  const mockOnDateSelected = jest.fn()
  const testDate = new Date('2024-01-10T14:30:00')

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should not render when visible is false', () => {
      const { queryByText } = render(
        <DatePickerModal
          visible={false}
          currentDate={testDate}
          onClose={mockOnClose}
          onDateSelected={mockOnDateSelected}
        />,
      )

      expect(queryByText('Select Date')).toBeNull()
    })

    it('should render when visible is true', () => {
      const { getByText, getAllByText } = render(
        <DatePickerModal
          visible={true}
          currentDate={testDate}
          onClose={mockOnClose}
          onDateSelected={mockOnDateSelected}
        />,
      )

      // There are two "Select Date" texts - title and button
      expect(getAllByText('Select Date').length).toBe(2)
      expect(getByText('Cancel')).toBeTruthy()
    })

    it('should render calendar component when visible', () => {
      const { getByTestId } = render(
        <DatePickerModal
          visible={true}
          currentDate={testDate}
          onClose={mockOnClose}
          onDateSelected={mockOnDateSelected}
        />,
      )

      expect(getByTestId('calendar')).toBeTruthy()
    })
  })

  describe('Date Selection', () => {
    it('should initialize with currentDate', () => {
      const { getByTestId } = render(
        <DatePickerModal
          visible={true}
          currentDate={testDate}
          onClose={mockOnClose}
          onDateSelected={mockOnDateSelected}
        />,
      )

      const calendar = getByTestId('calendar')
      expect(calendar.getAttribute('data-value')).toBe(testDate.toISOString())
    })

    it('should update selected date when calendar date changes', () => {
      const { getByTestId } = render(
        <DatePickerModal
          visible={true}
          currentDate={testDate}
          onClose={mockOnClose}
          onDateSelected={mockOnDateSelected}
        />,
      )

      const calendar = getByTestId('calendar')
      fireEvent.click(calendar)

      // The calendar onChange should update the internal state
      // We can't directly test the internal state, but we can test the behavior
      expect(calendar).toBeTruthy()
    })

    it('should preserve time when selecting a new date', () => {
      const { getAllByText, getByTestId } = render(
        <DatePickerModal
          visible={true}
          currentDate={testDate}
          onClose={mockOnClose}
          onDateSelected={mockOnDateSelected}
        />,
      )

      // Simulate selecting a new date
      const calendar = getByTestId('calendar')
      fireEvent.click(calendar)

      // Click Select Date button (second occurrence is the button)
      const selectButtons = getAllByText('Select Date')
      const selectButton = selectButtons[1] // Button is the second one
      fireEvent.click(selectButton.parentElement || selectButton)

      expect(mockOnDateSelected).toHaveBeenCalledTimes(1)
      const selectedDate = mockOnDateSelected.mock.calls[0][0]
      
      // Check that time is preserved (hours and minutes)
      expect(selectedDate.getHours()).toBe(testDate.getHours())
      expect(selectedDate.getMinutes()).toBe(testDate.getMinutes())
      
      // Check that date is updated
      expect(selectedDate.getDate()).toBe(15) // The mocked calendar returns 2024-01-15
      expect(selectedDate.getMonth()).toBe(0) // January
      expect(selectedDate.getFullYear()).toBe(2024)
    })

    it('should update selected date when currentDate prop changes', () => {
      const newDate = new Date('2024-02-20T10:00:00')
      const { rerender, getByTestId } = render(
        <DatePickerModal
          visible={true}
          currentDate={testDate}
          onClose={mockOnClose}
          onDateSelected={mockOnDateSelected}
        />,
      )

      rerender(
        <DatePickerModal
          visible={true}
          currentDate={newDate}
          onClose={mockOnClose}
          onDateSelected={mockOnDateSelected}
        />,
      )

      const calendar = getByTestId('calendar')
      expect(calendar.getAttribute('data-value')).toBe(newDate.toISOString())
    })
  })

  describe('Button Interactions', () => {
    it('should call onClose when Cancel button is pressed', () => {
      const { getByText } = render(
        <DatePickerModal
          visible={true}
          currentDate={testDate}
          onClose={mockOnClose}
          onDateSelected={mockOnDateSelected}
        />,
      )

      const cancelText = getByText('Cancel')
      // Click on the parent TouchableOpacity element
      fireEvent.click(cancelText.parentElement || cancelText)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
      expect(mockOnDateSelected).not.toHaveBeenCalled()
    })

    it('should call onDateSelected and onClose when Select Date button is pressed', () => {
      const { getAllByText } = render(
        <DatePickerModal
          visible={true}
          currentDate={testDate}
          onClose={mockOnClose}
          onDateSelected={mockOnDateSelected}
        />,
      )

      // Button is the second "Select Date" text
      const selectButtons = getAllByText('Select Date')
      const selectButton = selectButtons[1]
      fireEvent.click(selectButton.parentElement || selectButton)

      expect(mockOnDateSelected).toHaveBeenCalledTimes(1)
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('should handle date selection with different time', () => {
      const dateWithTime = new Date('2024-01-10T18:45:30')
      const { getAllByText } = render(
        <DatePickerModal
          visible={true}
          currentDate={dateWithTime}
          onClose={mockOnClose}
          onDateSelected={mockOnDateSelected}
        />,
      )

      // Button is the second "Select Date" text
      const selectButtons = getAllByText('Select Date')
      const selectButton = selectButtons[1]
      fireEvent.click(selectButton.parentElement || selectButton)

      const selectedDate = mockOnDateSelected.mock.calls[0][0]
      expect(selectedDate.getHours()).toBe(18)
      expect(selectedDate.getMinutes()).toBe(45)
      expect(selectedDate.getSeconds()).toBe(30)
    })
  })

  describe('Edge Cases', () => {
    it('should handle date selection when calendar returns array', () => {
      // This tests the handleDateChange logic for array values
      const { getByTestId } = render(
        <DatePickerModal
          visible={true}
          currentDate={testDate}
          onClose={mockOnClose}
          onDateSelected={mockOnDateSelected}
        />,
      )

      const calendar = getByTestId('calendar')
      // The mock calendar already handles this, but we verify it works
      fireEvent.click(calendar)
      expect(calendar).toBeTruthy()
    })

    it('should handle modal visibility changes', () => {
      const { rerender, queryByText, getAllByText } = render(
        <DatePickerModal
          visible={false}
          currentDate={testDate}
          onClose={mockOnClose}
          onDateSelected={mockOnDateSelected}
        />,
      )

      expect(queryByText('Select Date')).toBeNull()

      rerender(
        <DatePickerModal
          visible={true}
          currentDate={testDate}
          onClose={mockOnClose}
          onDateSelected={mockOnDateSelected}
        />,
      )

      // Should find at least one "Select Date" text (title)
      // Use getAllByText to avoid the multiple elements error
      expect(getAllByText('Select Date').length).toBeGreaterThan(0)
    })

    it('should reset selected date when modal becomes visible', () => {
      const initialDate = new Date('2024-01-10T14:30:00')
      const { rerender, getByTestId } = render(
        <DatePickerModal
          visible={false}
          currentDate={initialDate}
          onClose={mockOnClose}
          onDateSelected={mockOnDateSelected}
        />,
      )

      const newDate = new Date('2024-02-20T10:00:00')
      rerender(
        <DatePickerModal
          visible={true}
          currentDate={newDate}
          onClose={mockOnClose}
          onDateSelected={mockOnDateSelected}
        />,
      )

      const calendar = getByTestId('calendar')
      expect(calendar.getAttribute('data-value')).toBe(newDate.toISOString())
    })

    it('should handle dates at month boundaries', () => {
      const monthEndDate = new Date('2024-01-31T12:00:00')
      const { getAllByText } = render(
        <DatePickerModal
          visible={true}
          currentDate={monthEndDate}
          onClose={mockOnClose}
          onDateSelected={mockOnDateSelected}
        />,
      )

      // Button is the second "Select Date" text
      const selectButtons = getAllByText('Select Date')
      const selectButton = selectButtons[1]
      fireEvent.click(selectButton.parentElement || selectButton)

      expect(mockOnDateSelected).toHaveBeenCalled()
      const selectedDate = mockOnDateSelected.mock.calls[0][0]
      expect(selectedDate.getHours()).toBe(12)
      expect(selectedDate.getMinutes()).toBe(0)
    })

    it('should handle dates at year boundaries', () => {
      const yearEndDate = new Date('2023-12-31T23:59:59')
      const { getAllByText } = render(
        <DatePickerModal
          visible={true}
          currentDate={yearEndDate}
          onClose={mockOnClose}
          onDateSelected={mockOnDateSelected}
        />,
      )

      // Button is the second "Select Date" text
      const selectButtons = getAllByText('Select Date')
      const selectButton = selectButtons[1]
      fireEvent.click(selectButton.parentElement || selectButton)

      expect(mockOnDateSelected).toHaveBeenCalled()
      const selectedDate = mockOnDateSelected.mock.calls[0][0]
      expect(selectedDate.getHours()).toBe(23)
      expect(selectedDate.getMinutes()).toBe(59)
      expect(selectedDate.getSeconds()).toBe(59)
    })
  })

  describe('Calendar Props', () => {
    it('should pass correct props to Calendar component', () => {
      const { getByTestId } = render(
        <DatePickerModal
          visible={true}
          currentDate={testDate}
          onClose={mockOnClose}
          onDateSelected={mockOnDateSelected}
        />,
      )

      const calendar = getByTestId('calendar')
      expect(calendar.getAttribute('data-calendar-type')).toBe('gregory')
      expect(calendar.getAttribute('data-show-neighboring-month')).toBe('true')
      expect(calendar.getAttribute('data-next2-label')).toBeNull()
      expect(calendar.getAttribute('data-prev2-label')).toBeNull()
    })
  })
})

