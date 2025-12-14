// Mock React Native components for web testing
jest.mock('react-native', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const React = require('react')
  
  const View = ({ children, style, testID, ...props }: { children?: React.ReactNode; style?: unknown; testID?: string; [key: string]: unknown }) => 
    React.createElement('div', { 'data-testid': testID, style, ...props }, children)
  View.displayName = 'View'
  
  const Text = ({ children, style, ...props }: { children?: React.ReactNode; style?: unknown; [key: string]: unknown }) => 
    React.createElement('span', { style, ...props }, children)
  Text.displayName = 'Text'
  
  const TouchableOpacity = ({ children, onPress, style, testID, ...props }: { children?: React.ReactNode; onPress?: () => void; style?: unknown; testID?: string; [key: string]: unknown }) => 
    React.createElement('button', { onClick: onPress, style, 'data-testid': testID, ...props }, children)
  TouchableOpacity.displayName = 'TouchableOpacity'
  
  const Modal = ({ visible, children, ...props }: { visible?: boolean; children?: React.ReactNode; [key: string]: unknown }) => 
    visible ? React.createElement('div', { 'data-testid': 'modal', ...props }, children) : null
  Modal.displayName = 'Modal'
  
  return {
    View,
    Text,
    TouchableOpacity,
    Modal,
    StyleSheet: {
      create: (styles: Record<string, unknown>) => styles,
    },
  }
})

// Mock MUI X date pickers
jest.mock('@mui/x-date-pickers/DateCalendar', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const React = require('react')
  
  const DateCalendar = (props: { onChange?: (value: Date | null) => void; value?: Date; sx?: unknown; [key: string]: unknown }) => {
    const { onChange, value, ...otherProps } = props
    
    const handleClick = () => {
      if (onChange) {
        const newDate = new Date(2024, 0, 15, 12, 0, 0)
        onChange(newDate)
      }
    }
    
    return React.createElement('div', {
      'data-testid': 'calendar',
      'data-value': value?.toISOString(),
      onClick: handleClick,
      ...otherProps,
    })
  }
  
  DateCalendar.displayName = 'DateCalendar'
  
  return {
    DateCalendar,
  }
})

jest.mock('@mui/x-date-pickers/LocalizationProvider', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const React = require('react')
  
  const LocalizationProvider = ({ children }: { children: React.ReactNode; dateAdapter?: unknown }) => {
    return React.createElement('div', { 'data-testid': 'localization-provider' }, children)
  }
  
  return {
    LocalizationProvider,
  }
})

jest.mock('@mui/x-date-pickers/AdapterDateFns', () => {
  const MockAdapter = function MockAdapter() {}
  MockAdapter.displayName = 'AdapterDateFns'
  return {
    AdapterDateFns: MockAdapter,
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
      const { container } = render(
        <DatePickerModal
          visible={false}
          currentDate={testDate}
          onClose={mockOnClose}
          onDateSelected={mockOnDateSelected}
        />,
      )

      expect(container.firstChild).toBeNull()
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

      const calendar = getByTestId('calendar')
      fireEvent.click(calendar)

      const selectButtons = getAllByText('Select Date')
      const selectButton = selectButtons[1]
      fireEvent.click(selectButton.parentElement || selectButton)

      expect(mockOnDateSelected).toHaveBeenCalledTimes(1)
      const selectedDate = mockOnDateSelected.mock.calls[0][0]
      
      expect(selectedDate.getHours()).toBe(testDate.getHours())
      expect(selectedDate.getMinutes()).toBe(testDate.getMinutes())
      
      expect(selectedDate.getDate()).toBe(15)
      expect(selectedDate.getMonth()).toBe(0)
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
})
