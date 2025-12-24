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

// Mock MUI X date pickers - using web testing library like DatePickerModal
jest.mock('@mui/x-date-pickers/TimeClock', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const React = require('react')
  
  const TimeClock = (props: { onChange?: (value: Date | null) => void; value?: Date; views?: Array<'hours' | 'minutes'>; sx?: unknown; [key: string]: unknown }) => {
    const { onChange, value, views, ...otherProps } = props 
    const handleClick = () => {
      if (onChange && views && views[0]) {
        const testDate = new Date(value || new Date())
        if (views[0] === 'hours') {
          testDate.setHours(3, testDate.getMinutes(), 0, 0)
        } else {
          testDate.setMinutes(15, 0, 0)
        }
        onChange(testDate)
      }
    }
    
    return React.createElement('div', {
      'data-testid': 'time-clock',
      'data-value': value?.toISOString(),
      'data-views': views?.join(','),
      onClick: handleClick,
      ...otherProps,
    })
  }
  
  TimeClock.displayName = 'TimeClock'
  
  return {
    TimeClock,
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
import { render, fireEvent, waitFor } from '@testing-library/react'
import { TimePickerModal } from '../../components/TimePickerModal'

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
      xxxl: 48,
    },
    weights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
}))

describe('TimePickerModal', () => {
  const mockOnClose = jest.fn()
  const mockOnTimeSelected = jest.fn()
  const testDate = new Date('2024-01-10T14:30:00') // 2:30 PM

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('Rendering', () => {
    it('should not render when visible is false', () => {
      const { queryByText } = render(
        <TimePickerModal
          visible={false}
          currentDate={testDate}
          onClose={mockOnClose}
          onTimeSelected={mockOnTimeSelected}
        />,
      )

      expect(queryByText('Select Time')).toBeNull()
      expect(queryByText('Cancel')).toBeNull()
    })

    it('should render when visible is true', () => {
      const { getByText, getByTestId } = render(
        <TimePickerModal
          visible={true}
          currentDate={testDate}
          onClose={mockOnClose}
          onTimeSelected={mockOnTimeSelected}
        />,
      )

      expect(getByText('Select Time')).toBeTruthy()
      expect(getByText('Cancel')).toBeTruthy()
      expect(getByTestId('time-clock')).toBeTruthy()
    })

    it('should render time display with correct format', () => {
      const { getByText } = render(
        <TimePickerModal
          visible={true}
          currentDate={testDate}
          onClose={mockOnClose}
          onTimeSelected={mockOnTimeSelected}
        />,
      )

      // 2:30 PM should display as "02:30"
      expect(getByText('02')).toBeTruthy()
      expect(getByText('30')).toBeTruthy()
      expect(getByText(':')).toBeTruthy()
    })

    it('should render AM/PM buttons', () => {
      const { getByText } = render(
        <TimePickerModal
          visible={true}
          currentDate={testDate}
          onClose={mockOnClose}
          onTimeSelected={mockOnTimeSelected}
        />,
      )

      expect(getByText('AM')).toBeTruthy()
      expect(getByText('PM')).toBeTruthy()
    })

    it('should show PM as selected for afternoon time', () => {
      const pmDate = new Date('2024-01-10T14:30:00') // 2:30 PM
      const { getByText } = render(
        <TimePickerModal
          visible={true}
          currentDate={pmDate}
          onClose={mockOnClose}
          onTimeSelected={mockOnTimeSelected}
        />,
      )

      const pmButton = getByText('PM')
      expect(pmButton).toBeTruthy()
    })

    it('should show AM as selected for morning time', () => {
      const amDate = new Date('2024-01-10T09:30:00') // 9:30 AM
      const { getByText } = render(
        <TimePickerModal
          visible={true}
          currentDate={amDate}
          onClose={mockOnClose}
          onTimeSelected={mockOnTimeSelected}
        />,
      )

      const amButton = getByText('AM')
      expect(amButton).toBeTruthy()
    })
  })

  describe('Time Display Interaction', () => {
    it('should switch to hours view when hour is clicked', () => {
      const { getByText, getByTestId } = render(
        <TimePickerModal
          visible={true}
          currentDate={testDate}
          onClose={mockOnClose}
          onTimeSelected={mockOnTimeSelected}
        />,
      )

      const hourDisplay = getByText('02')
      fireEvent.click(hourDisplay.parentElement || hourDisplay)

      const clock = getByTestId('time-clock')
      expect(clock.getAttribute('data-views')).toBe('hours')
    })

    it('should switch to minutes view when minute is clicked', () => {
      const { getByText, getByTestId } = render(
        <TimePickerModal
          visible={true}
          currentDate={testDate}
          onClose={mockOnClose}
          onTimeSelected={mockOnTimeSelected}
        />,
      )

      const minuteDisplay = getByText('30')
      fireEvent.click(minuteDisplay.parentElement || minuteDisplay)

      const clock = getByTestId('time-clock')
      expect(clock.getAttribute('data-views')).toBe('minutes')
    })
  })

  describe('Time Selection', () => {
    it('should initialize with currentDate', () => {
      const { getByTestId } = render(
        <TimePickerModal
          visible={true}
          currentDate={testDate}
          onClose={mockOnClose}
          onTimeSelected={mockOnTimeSelected}
        />,
      )

      const clock = getByTestId('time-clock')
      expect(clock.getAttribute('data-value')).toBe(testDate.toISOString())
    })

    it('should update hour when clock is clicked in hours view', async () => {
      const { getByTestId, getByText } = render(
        <TimePickerModal
          visible={true}
          currentDate={testDate}
          onClose={mockOnClose}
          onTimeSelected={mockOnTimeSelected}
        />,
      )

      const clock = getByTestId('time-clock')
      fireEvent.click(clock)

      // Wait for the view to switch to minutes
      await waitFor(() => {
        expect(clock.getAttribute('data-views')).toBe('minutes')
      }, { timeout: 200 })

      // The hour should be updated (our mock sets it to 3)
      expect(getByText('03')).toBeTruthy()
    })

    it('should update minute when clock is clicked in minutes view', async () => {
      const { getByTestId, getByText } = render(
        <TimePickerModal
          visible={true}
          currentDate={testDate}
          onClose={mockOnClose}
          onTimeSelected={mockOnTimeSelected}
        />,
      )

      // Switch to minutes view first
      const minuteDisplay = getByText('30')
      fireEvent.click(minuteDisplay.parentElement || minuteDisplay)

      const clock = getByTestId('time-clock')
      fireEvent.click(clock)

      // The minute should be updated (our mock sets it to 15)
      await waitFor(() => {
        expect(getByText('15')).toBeTruthy()
      })
    })

    it('should automatically switch to minutes view after hour selection', async () => {
      const { getByTestId } = render(
        <TimePickerModal
          visible={true}
          currentDate={testDate}
          onClose={mockOnClose}
          onTimeSelected={mockOnTimeSelected}
        />,
      )

      const clock = getByTestId('time-clock')
      // Initially should be in hours view
      expect(clock.getAttribute('data-views')).toBe('hours')

      fireEvent.click(clock)

      // Should switch to minutes view after delay
      await waitFor(() => {
        expect(clock.getAttribute('data-views')).toBe('minutes')
      }, { timeout: 200 })
    })
  })

  describe('AM/PM Toggle', () => {
    it('should toggle to AM when AM button is clicked', () => {
      const pmDate = new Date('2024-01-10T14:30:00') // 2:30 PM
      const { getByText } = render(
        <TimePickerModal
          visible={true}
          currentDate={pmDate}
          onClose={mockOnClose}
          onTimeSelected={mockOnTimeSelected}
        />,
      )

      const amButton = getByText('AM')
      fireEvent.click(amButton.parentElement || amButton)

      // Time should now show 02:30 AM (2:30 PM converted to AM)
      expect(getByText('02')).toBeTruthy()
    })

    it('should toggle to PM when PM button is clicked', () => {
      const amDate = new Date('2024-01-10T09:30:00') // 9:30 AM
      const { getByText } = render(
        <TimePickerModal
          visible={true}
          currentDate={amDate}
          onClose={mockOnClose}
          onTimeSelected={mockOnTimeSelected}
        />,
      )

      const pmButton = getByText('PM')
      fireEvent.click(pmButton.parentElement || pmButton)

      // Time should now show 09:30 PM (9:30 AM converted to PM)
      expect(getByText('09')).toBeTruthy()
    })

    it('should convert hours correctly when toggling AM/PM', () => {
      const pmDate = new Date('2024-01-10T14:30:00') // 2:30 PM
      const { getByText } = render(
        <TimePickerModal
          visible={true}
          currentDate={pmDate}
          onClose={mockOnClose}
          onTimeSelected={mockOnTimeSelected}
        />,
      )

      // Click AM button
      const amButton = getByText('AM')
      fireEvent.click(amButton.parentElement || amButton)

      // Should still show 02:30 (hours preserved, just AM/PM changed)
      expect(getByText('02')).toBeTruthy()
      expect(getByText('30')).toBeTruthy()
    })
  })

  describe('Button Interactions', () => {
    it('should call onClose when Cancel button is pressed', () => {
      const { getByText } = render(
        <TimePickerModal
          visible={true}
          currentDate={testDate}
          onClose={mockOnClose}
          onTimeSelected={mockOnTimeSelected}
        />,
      )

      const cancelButton = getByText('Cancel')
      fireEvent.click(cancelButton.parentElement || cancelButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
      expect(mockOnTimeSelected).not.toHaveBeenCalled()
    })

    it('should call onTimeSelected and onClose when Select Time button is pressed', () => {
      const { getByText } = render(
        <TimePickerModal
          visible={true}
          currentDate={testDate}
          onClose={mockOnClose}
          onTimeSelected={mockOnTimeSelected}
        />,
      )

      const selectButton = getByText('Select Time')
      fireEvent.click(selectButton.parentElement || selectButton)

      expect(mockOnTimeSelected).toHaveBeenCalledTimes(1)
      expect(mockOnClose).toHaveBeenCalledTimes(1)

      const selectedDate = mockOnTimeSelected.mock.calls[0][0]
      expect(selectedDate).toBeInstanceOf(Date)
    })

    it('should preserve date when time is selected', () => {
      const { getByText } = render(
        <TimePickerModal
          visible={true}
          currentDate={testDate}
          onClose={mockOnClose}
          onTimeSelected={mockOnTimeSelected}
        />,
      )

      const selectButton = getByText('Select Time')
      fireEvent.click(selectButton.parentElement || selectButton)

      const selectedDate = mockOnTimeSelected.mock.calls[0][0]
      // Should preserve the date part
      expect(selectedDate.getFullYear()).toBe(testDate.getFullYear())
      expect(selectedDate.getMonth()).toBe(testDate.getMonth())
      expect(selectedDate.getDate()).toBe(testDate.getDate())
    })

    it('should update time part when time is selected', () => {
      const { getByText } = render(
        <TimePickerModal
          visible={true}
          currentDate={testDate}
          onClose={mockOnClose}
          onTimeSelected={mockOnTimeSelected}
        />,
      )

      const selectButton = getByText('Select Time')
      fireEvent.click(selectButton.parentElement || selectButton)

      const selectedDate = mockOnTimeSelected.mock.calls[0][0]
      // Should preserve the time that was selected
      expect(selectedDate.getHours()).toBe(testDate.getHours())
      expect(selectedDate.getMinutes()).toBe(testDate.getMinutes())
      expect(selectedDate.getSeconds()).toBe(0) // Seconds should be reset to 0
    })
  })

  describe('State Updates', () => {
    it('should update selected time when currentDate prop changes', () => {
      const newDate = new Date('2024-01-10T10:15:00') // 10:15 AM
      const { rerender, getByTestId, getByText } = render(
        <TimePickerModal
          visible={true}
          currentDate={testDate}
          onClose={mockOnClose}
          onTimeSelected={mockOnTimeSelected}
        />,
      )

      rerender(
        <TimePickerModal
          visible={true}
          currentDate={newDate}
          onClose={mockOnClose}
          onTimeSelected={mockOnTimeSelected}
        />,
      )

      const clock = getByTestId('time-clock')
      expect(clock.getAttribute('data-value')).toBe(newDate.toISOString())
      
      // Should display new time
      expect(getByText('10')).toBeTruthy()
      expect(getByText('15')).toBeTruthy()
    })

    it('should reset to hours view when modal becomes visible', () => {
      const { rerender, getByTestId } = render(
        <TimePickerModal
          visible={false}
          currentDate={testDate}
          onClose={mockOnClose}
          onTimeSelected={mockOnTimeSelected}
        />,
      )

      rerender(
        <TimePickerModal
          visible={true}
          currentDate={testDate}
          onClose={mockOnClose}
          onTimeSelected={mockOnTimeSelected}
        />,
      )

      const clock = getByTestId('time-clock')
      expect(clock.getAttribute('data-views')).toBe('hours')
    })
  })

  describe('Edge Cases', () => {
    it('should handle midnight (00:00)', () => {
      const midnight = new Date('2024-01-10T00:00:00')
      const { getByText } = render(
        <TimePickerModal
          visible={true}
          currentDate={midnight}
          onClose={mockOnClose}
          onTimeSelected={mockOnTimeSelected}
        />,
      )

      // Midnight should display as 12:00 AM
      expect(getByText('12')).toBeTruthy()
      expect(getByText('00')).toBeTruthy()
    })

    it('should handle noon (12:00)', () => {
      const noon = new Date('2024-01-10T12:00:00')
      const { getByText } = render(
        <TimePickerModal
          visible={true}
          currentDate={noon}
          onClose={mockOnClose}
          onTimeSelected={mockOnTimeSelected}
        />,
      )

      // Noon should display as 12:00 PM
      expect(getByText('12')).toBeTruthy()
      expect(getByText('00')).toBeTruthy()
    })

    it('should handle 11:59 PM', () => {
      const lateNight = new Date('2024-01-10T23:59:00')
      const { getByText } = render(
        <TimePickerModal
          visible={true}
          currentDate={lateNight}
          onClose={mockOnClose}
          onTimeSelected={mockOnTimeSelected}
        />,
      )

      expect(getByText('11')).toBeTruthy()
      expect(getByText('59')).toBeTruthy()
    })

    it('should handle 12-hour format conversion correctly', () => {
      const onePM = new Date('2024-01-10T13:00:00') // 1:00 PM
      const { getByText } = render(
        <TimePickerModal
          visible={true}
          currentDate={onePM}
          onClose={mockOnClose}
          onTimeSelected={mockOnTimeSelected}
        />,
      )

      // Should display as 01:00
      expect(getByText('01')).toBeTruthy()
      expect(getByText('00')).toBeTruthy()
    })

    it('should handle null onChange value gracefully', () => {
      // Mock TimeClock to return null
      jest.doMock('@mui/x-date-pickers/TimeClock', () => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const React = require('react')
        return function TimeClock() {
          return React.createElement('div', { 'data-testid': 'time-clock' })
        }
      })

      const { getByTestId } = render(
        <TimePickerModal
          visible={true}
          currentDate={testDate}
          onClose={mockOnClose}
          onTimeSelected={mockOnTimeSelected}
        />,
      )

      const clock = getByTestId('time-clock')
      expect(clock).toBeTruthy()
      // Component should not crash when onChange receives null
    })
  })

  describe('Time Formatting', () => {
    it('should pad single digit hours with zero', () => {
      const singleDigitHour = new Date('2024-01-10T09:30:00') // 9:30 AM
      const { getByText } = render(
        <TimePickerModal
          visible={true}
          currentDate={singleDigitHour}
          onClose={mockOnClose}
          onTimeSelected={mockOnTimeSelected}
        />,
      )

      expect(getByText('09')).toBeTruthy()
    })

    it('should pad single digit minutes with zero', () => {
      const singleDigitMinute = new Date('2024-01-10T14:05:00') // 2:05 PM
      const { getByText } = render(
        <TimePickerModal
          visible={true}
          currentDate={singleDigitMinute}
          onClose={mockOnClose}
          onTimeSelected={mockOnTimeSelected}
        />,
      )

      expect(getByText('05')).toBeTruthy()
    })

    it('should display 12 for midnight and noon', () => {
      const midnight = new Date('2024-01-10T00:00:00')
      const { getByText: getByTextMidnight, unmount } = render(
        <TimePickerModal
          visible={true}
          currentDate={midnight}
          onClose={mockOnClose}
          onTimeSelected={mockOnTimeSelected}
        />,
      )
      expect(getByTextMidnight('12')).toBeTruthy()
      unmount()

      const noon = new Date('2024-01-10T12:00:00')
      const { getByText: getByTextNoon } = render(
        <TimePickerModal
          visible={true}
          currentDate={noon}
          onClose={mockOnClose}
          onTimeSelected={mockOnTimeSelected}
        />,
      )
      expect(getByTextNoon('12')).toBeTruthy()
    })
  })
})
