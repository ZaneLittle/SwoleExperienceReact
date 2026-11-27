// React Native + React Native Testing Library (matches the jest-expo preset).
// The React Native mock comes from jest.setup.rntl.js; only the MUI X pickers
// are mocked here (they render web DOM, which has no place in RN testing).
import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { DatePickerModal } from '../../components/DatePickerModal'

// Mock MUI X date pickers with React Native host elements
jest.mock('@mui/x-date-pickers/DateCalendar', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react')

  const DateCalendar = (props: { onChange?: (value: Date | null) => void; value?: Date; sx?: unknown; [key: string]: unknown }) => {
    const { onChange, value, ...otherProps } = props

    const handlePress = () => {
      if (onChange) {
        const newDate = new Date(2024, 0, 15, 12, 0, 0)
        onChange(newDate)
      }
    }

    return React.createElement('View', {
      ...otherProps,
      onPress: handlePress,
      testID: 'calendar',
      value: value?.toISOString(),
    })
  }

  DateCalendar.displayName = 'DateCalendar'

  return {
    DateCalendar,
  }
})

jest.mock('@mui/x-date-pickers/LocalizationProvider', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react')

  const LocalizationProvider = ({ children }: { children: React.ReactNode; dateAdapter?: unknown }) => {
    return React.createElement(React.Fragment, null, children)
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
    it('should not render when visible is false', async () => {
      const { toJSON, queryByText } = await render(
        <DatePickerModal
          visible={false}
          currentDate={testDate}
          onClose={mockOnClose}
          onDateSelected={mockOnDateSelected}
        />,
      )

      expect(toJSON()).toBeNull()
      expect(queryByText('Select Date')).toBeNull()
    })

    it('should render when visible is true', async () => {
      const { getByText } = await render(
        <DatePickerModal
          visible={true}
          currentDate={testDate}
          onClose={mockOnClose}
          onDateSelected={mockOnDateSelected}
        />,
      )

      expect(getByText('Select Date')).toBeTruthy()
      expect(getByText('Cancel')).toBeTruthy()
    })

    it('should render calendar component when visible', async () => {
      const { getByTestId } = await render(
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
    it('should initialize with currentDate', async () => {
      const { getByTestId } = await render(
        <DatePickerModal
          visible={true}
          currentDate={testDate}
          onClose={mockOnClose}
          onDateSelected={mockOnDateSelected}
        />,
      )

      const calendar = getByTestId('calendar')
      expect(calendar.props.value).toBe(testDate.toISOString())
    })

    it('should update selected date when calendar date changes', async () => {
      const { getByTestId } = await render(
        <DatePickerModal
          visible={true}
          currentDate={testDate}
          onClose={mockOnClose}
          onDateSelected={mockOnDateSelected}
        />,
      )

      const calendar = getByTestId('calendar')
      await fireEvent.press(calendar)

      expect(getByTestId('calendar')).toBeTruthy()
    })

    it('should preserve time when selecting a new date', async () => {
      const { getByText, getByTestId } = await render(
        <DatePickerModal
          visible={true}
          currentDate={testDate}
          onClose={mockOnClose}
          onDateSelected={mockOnDateSelected}
        />,
      )

      const calendar = getByTestId('calendar')
      await fireEvent.press(calendar)

      const selectButton = getByText('Select Date')
      await fireEvent.press(selectButton)

      expect(mockOnDateSelected).toHaveBeenCalledTimes(1)
      const selectedDate = mockOnDateSelected.mock.calls[0][0]

      expect(selectedDate.getHours()).toBe(testDate.getHours())
      expect(selectedDate.getMinutes()).toBe(testDate.getMinutes())

      expect(selectedDate.getDate()).toBe(15)
      expect(selectedDate.getMonth()).toBe(0)
      expect(selectedDate.getFullYear()).toBe(2024)
    })

    it('should update selected date when currentDate prop changes', async () => {
      const newDate = new Date('2024-02-20T10:00:00')
      const { rerender, getByTestId } = await render(
        <DatePickerModal
          visible={true}
          currentDate={testDate}
          onClose={mockOnClose}
          onDateSelected={mockOnDateSelected}
        />,
      )

      await rerender(
        <DatePickerModal
          visible={true}
          currentDate={newDate}
          onClose={mockOnClose}
          onDateSelected={mockOnDateSelected}
        />,
      )

      const calendar = getByTestId('calendar')
      expect(calendar.props.value).toBe(newDate.toISOString())
    })
  })

  describe('Button Interactions', () => {
    it('should call onClose when Cancel button is pressed', async () => {
      const { getByText } = await render(
        <DatePickerModal
          visible={true}
          currentDate={testDate}
          onClose={mockOnClose}
          onDateSelected={mockOnDateSelected}
        />,
      )

      await fireEvent.press(getByText('Cancel'))

      expect(mockOnClose).toHaveBeenCalledTimes(1)
      expect(mockOnDateSelected).not.toHaveBeenCalled()
    })

    it('should call onDateSelected and onClose when Select Date button is pressed', async () => {
      const { getByText } = await render(
        <DatePickerModal
          visible={true}
          currentDate={testDate}
          onClose={mockOnClose}
          onDateSelected={mockOnDateSelected}
        />,
      )

      await fireEvent.press(getByText('Select Date'))

      expect(mockOnDateSelected).toHaveBeenCalledTimes(1)
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('should handle date selection with different time', async () => {
      const dateWithTime = new Date('2024-01-10T18:45:30')
      const { getByText } = await render(
        <DatePickerModal
          visible={true}
          currentDate={dateWithTime}
          onClose={mockOnClose}
          onDateSelected={mockOnDateSelected}
        />,
      )

      await fireEvent.press(getByText('Select Date'))

      const selectedDate = mockOnDateSelected.mock.calls[0][0]
      expect(selectedDate.getHours()).toBe(18)
      expect(selectedDate.getMinutes()).toBe(45)
      expect(selectedDate.getSeconds()).toBe(30)
    })
  })

  describe('Edge Cases', () => {
    it('should handle modal visibility changes', async () => {
      const { rerender, queryByText, getByText } = await render(
        <DatePickerModal
          visible={false}
          currentDate={testDate}
          onClose={mockOnClose}
          onDateSelected={mockOnDateSelected}
        />,
      )

      expect(queryByText('Select Date')).toBeNull()

      await rerender(
        <DatePickerModal
          visible={true}
          currentDate={testDate}
          onClose={mockOnClose}
          onDateSelected={mockOnDateSelected}
        />,
      )

      expect(getByText('Select Date')).toBeTruthy()
    })

    it('should reset selected date when modal becomes visible', async () => {
      const initialDate = new Date('2024-01-10T14:30:00')
      const { rerender, getByTestId } = await render(
        <DatePickerModal
          visible={false}
          currentDate={initialDate}
          onClose={mockOnClose}
          onDateSelected={mockOnDateSelected}
        />,
      )

      const newDate = new Date('2024-02-20T10:00:00')
      await rerender(
        <DatePickerModal
          visible={true}
          currentDate={newDate}
          onClose={mockOnClose}
          onDateSelected={mockOnDateSelected}
        />,
      )

      const calendar = getByTestId('calendar')
      expect(calendar.props.value).toBe(newDate.toISOString())
    })

    it('should handle dates at month boundaries', async () => {
      const monthEndDate = new Date('2024-01-31T12:00:00')
      const { getByText } = await render(
        <DatePickerModal
          visible={true}
          currentDate={monthEndDate}
          onClose={mockOnClose}
          onDateSelected={mockOnDateSelected}
        />,
      )

      await fireEvent.press(getByText('Select Date'))

      expect(mockOnDateSelected).toHaveBeenCalled()
      const selectedDate = mockOnDateSelected.mock.calls[0][0]
      expect(selectedDate.getHours()).toBe(12)
      expect(selectedDate.getMinutes()).toBe(0)
    })

    it('should handle dates at year boundaries', async () => {
      const yearEndDate = new Date('2023-12-31T23:59:59')
      const { getByText } = await render(
        <DatePickerModal
          visible={true}
          currentDate={yearEndDate}
          onClose={mockOnClose}
          onDateSelected={mockOnDateSelected}
        />,
      )

      await fireEvent.press(getByText('Select Date'))

      expect(mockOnDateSelected).toHaveBeenCalled()
      const selectedDate = mockOnDateSelected.mock.calls[0][0]
      expect(selectedDate.getHours()).toBe(23)
      expect(selectedDate.getMinutes()).toBe(59)
      expect(selectedDate.getSeconds()).toBe(59)
    })
  })
})
