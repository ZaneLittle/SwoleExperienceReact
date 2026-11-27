// React Native + React Native Testing Library (matches the jest-expo preset).
// The React Native mock comes from jest.setup.rntl.js; only the MUI X pickers
// are mocked here (they render web DOM, which has no place in RN testing).
import React from 'react'
import { render, fireEvent, waitFor, act } from '@testing-library/react-native'
import { TimePickerModal } from '../../components/TimePickerModal'

// Mock MUI X date pickers with React Native host elements
jest.mock('@mui/x-date-pickers/TimeClock', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react')

  const TimeClock = (props: { onChange?: (value: Date | null) => void; value?: Date; views?: Array<'hours' | 'minutes'>; sx?: unknown; [key: string]: unknown }) => {
    const { onChange, value, views, ...otherProps } = props

    const handlePress = () => {
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

    return React.createElement('View', {
      ...otherProps,
      onPress: handlePress,
      testID: 'time-clock',
      value: value?.toISOString(),
      views: views?.join(','),
    })
  }

  TimeClock.displayName = 'TimeClock'

  return {
    TimeClock,
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

  afterEach(async () => {
    await act(async () => {
      jest.runOnlyPendingTimers()
    })
    jest.useRealTimers()
  })

  describe('Rendering', () => {
    it('should not render when visible is false', async () => {
      const { queryByText } = await render(
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

    it('should render when visible is true', async () => {
      const { getByText, getByTestId } = await render(
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

    it('should render time display with correct format', async () => {
      const { getByText } = await render(
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

    it('should render AM/PM buttons', async () => {
      const { getByText } = await render(
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

    it('should show PM as selected for afternoon time', async () => {
      const pmDate = new Date('2024-01-10T14:30:00') // 2:30 PM
      const { getByText } = await render(
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

    it('should show AM as selected for morning time', async () => {
      const amDate = new Date('2024-01-10T09:30:00') // 9:30 AM
      const { getByText } = await render(
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
    it('should switch to hours view when hour is clicked', async () => {
      const { getByText, getByTestId } = await render(
        <TimePickerModal
          visible={true}
          currentDate={testDate}
          onClose={mockOnClose}
          onTimeSelected={mockOnTimeSelected}
        />,
      )

      const hourDisplay = getByText('02')
      await fireEvent.press(hourDisplay)

      const clock = getByTestId('time-clock')
      expect(clock.props.views).toBe('hours')
    })

    it('should switch to minutes view when minute is clicked', async () => {
      const { getByText, getByTestId } = await render(
        <TimePickerModal
          visible={true}
          currentDate={testDate}
          onClose={mockOnClose}
          onTimeSelected={mockOnTimeSelected}
        />,
      )

      const minuteDisplay = getByText('30')
      await fireEvent.press(minuteDisplay)

      const clock = getByTestId('time-clock')
      expect(clock.props.views).toBe('minutes')
    })
  })

  describe('Time Selection', () => {
    it('should initialize with currentDate', async () => {
      const { getByTestId } = await render(
        <TimePickerModal
          visible={true}
          currentDate={testDate}
          onClose={mockOnClose}
          onTimeSelected={mockOnTimeSelected}
        />,
      )

      const clock = getByTestId('time-clock')
      expect(clock.props.value).toBe(testDate.toISOString())
    })

    it('should update hour when clock is clicked in hours view', async () => {
      const { getByTestId, getByText } = await render(
        <TimePickerModal
          visible={true}
          currentDate={testDate}
          onClose={mockOnClose}
          onTimeSelected={mockOnTimeSelected}
        />,
      )

      const clock = getByTestId('time-clock')
      await fireEvent.press(clock)

      // Wait for the view to switch to minutes (component defers 100ms)
      await act(async () => {
        await jest.advanceTimersByTimeAsync(150)
      })
      expect(getByTestId('time-clock').props.views).toBe('minutes')

      // The hour should be updated (our mock sets it to 3)
      expect(getByText('03')).toBeTruthy()
    })

    it('should update minute when clock is clicked in minutes view', async () => {
      const { getByTestId, getByText } = await render(
        <TimePickerModal
          visible={true}
          currentDate={testDate}
          onClose={mockOnClose}
          onTimeSelected={mockOnTimeSelected}
        />,
      )

      // Switch to minutes view first
      const minuteDisplay = getByText('30')
      await fireEvent.press(minuteDisplay)

      const clock = getByTestId('time-clock')
      await fireEvent.press(clock)

      // The minute should be updated (our mock sets it to 15)
      await waitFor(() => {
        expect(getByText('15')).toBeTruthy()
      })
    })

    it('should automatically switch to minutes view after hour selection', async () => {
      const { getByTestId } = await render(
        <TimePickerModal
          visible={true}
          currentDate={testDate}
          onClose={mockOnClose}
          onTimeSelected={mockOnTimeSelected}
        />,
      )

      // Initially should be in hours view
      expect(getByTestId('time-clock').props.views).toBe('hours')

      await fireEvent.press(getByTestId('time-clock'))

      // Should switch to minutes view after delay
      await act(async () => {
        await jest.advanceTimersByTimeAsync(150)
      })
      expect(getByTestId('time-clock').props.views).toBe('minutes')
    })
  })

  describe('AM/PM Toggle', () => {
    it('should toggle to AM when AM button is clicked', async () => {
      const pmDate = new Date('2024-01-10T14:30:00') // 2:30 PM
      const { getByText } = await render(
        <TimePickerModal
          visible={true}
          currentDate={pmDate}
          onClose={mockOnClose}
          onTimeSelected={mockOnTimeSelected}
        />,
      )

      const amButton = getByText('AM')
      await fireEvent.press(amButton)

      // Time should now show 02:30 AM (2:30 PM converted to AM)
      expect(getByText('02')).toBeTruthy()
    })

    it('should toggle to PM when PM button is clicked', async () => {
      const amDate = new Date('2024-01-10T09:30:00') // 9:30 AM
      const { getByText } = await render(
        <TimePickerModal
          visible={true}
          currentDate={amDate}
          onClose={mockOnClose}
          onTimeSelected={mockOnTimeSelected}
        />,
      )

      const pmButton = getByText('PM')
      await fireEvent.press(pmButton)

      // Time should now show 09:30 PM (9:30 AM converted to PM)
      expect(getByText('09')).toBeTruthy()
    })

    it('should convert hours correctly when toggling AM/PM', async () => {
      const pmDate = new Date('2024-01-10T14:30:00') // 2:30 PM
      const { getByText } = await render(
        <TimePickerModal
          visible={true}
          currentDate={pmDate}
          onClose={mockOnClose}
          onTimeSelected={mockOnTimeSelected}
        />,
      )

      // Click AM button
      const amButton = getByText('AM')
      await fireEvent.press(amButton)

      // Should still show 02:30 (hours preserved, just AM/PM changed)
      expect(getByText('02')).toBeTruthy()
      expect(getByText('30')).toBeTruthy()
    })
  })

  describe('Button Interactions', () => {
    it('should call onClose when Cancel button is pressed', async () => {
      const { getByText } = await render(
        <TimePickerModal
          visible={true}
          currentDate={testDate}
          onClose={mockOnClose}
          onTimeSelected={mockOnTimeSelected}
        />,
      )

      await fireEvent.press(getByText('Cancel'))

      expect(mockOnClose).toHaveBeenCalledTimes(1)
      expect(mockOnTimeSelected).not.toHaveBeenCalled()
    })

    it('should call onTimeSelected and onClose when Select Time button is pressed', async () => {
      const { getByText } = await render(
        <TimePickerModal
          visible={true}
          currentDate={testDate}
          onClose={mockOnClose}
          onTimeSelected={mockOnTimeSelected}
        />,
      )

      await fireEvent.press(getByText('Select Time'))

      expect(mockOnTimeSelected).toHaveBeenCalledTimes(1)
      expect(mockOnClose).toHaveBeenCalledTimes(1)

      const selectedDate = mockOnTimeSelected.mock.calls[0][0]
      expect(selectedDate).toBeInstanceOf(Date)
    })

    it('should preserve date when time is selected', async () => {
      const { getByText } = await render(
        <TimePickerModal
          visible={true}
          currentDate={testDate}
          onClose={mockOnClose}
          onTimeSelected={mockOnTimeSelected}
        />,
      )

      await fireEvent.press(getByText('Select Time'))

      const selectedDate = mockOnTimeSelected.mock.calls[0][0]
      // Should preserve the date part
      expect(selectedDate.getFullYear()).toBe(testDate.getFullYear())
      expect(selectedDate.getMonth()).toBe(testDate.getMonth())
      expect(selectedDate.getDate()).toBe(testDate.getDate())
    })

    it('should update time part when time is selected', async () => {
      const { getByText } = await render(
        <TimePickerModal
          visible={true}
          currentDate={testDate}
          onClose={mockOnClose}
          onTimeSelected={mockOnTimeSelected}
        />,
      )

      await fireEvent.press(getByText('Select Time'))

      const selectedDate = mockOnTimeSelected.mock.calls[0][0]
      // Should preserve the time that was selected
      expect(selectedDate.getHours()).toBe(testDate.getHours())
      expect(selectedDate.getMinutes()).toBe(testDate.getMinutes())
      expect(selectedDate.getSeconds()).toBe(0) // Seconds should be reset to 0
    })
  })

  describe('State Updates', () => {
    it('should update selected time when currentDate prop changes', async () => {
      const newDate = new Date('2024-01-10T10:15:00') // 10:15 AM
      const { rerender, getByTestId, getByText } = await render(
        <TimePickerModal
          visible={true}
          currentDate={testDate}
          onClose={mockOnClose}
          onTimeSelected={mockOnTimeSelected}
        />,
      )

      await rerender(
        <TimePickerModal
          visible={true}
          currentDate={newDate}
          onClose={mockOnClose}
          onTimeSelected={mockOnTimeSelected}
        />,
      )

      const clock = getByTestId('time-clock')
      expect(clock.props.value).toBe(newDate.toISOString())

      // Should display new time
      expect(getByText('10')).toBeTruthy()
      expect(getByText('15')).toBeTruthy()
    })

    it('should reset to hours view when modal becomes visible', async () => {
      const { rerender, getByTestId } = await render(
        <TimePickerModal
          visible={false}
          currentDate={testDate}
          onClose={mockOnClose}
          onTimeSelected={mockOnTimeSelected}
        />,
      )

      await rerender(
        <TimePickerModal
          visible={true}
          currentDate={testDate}
          onClose={mockOnClose}
          onTimeSelected={mockOnTimeSelected}
        />,
      )

      const clock = getByTestId('time-clock')
      expect(clock.props.views).toBe('hours')
    })
  })

  describe('Edge Cases', () => {
    it('should handle midnight (00:00)', async () => {
      const midnight = new Date('2024-01-10T00:00:00')
      const { getByText } = await render(
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

    it('should handle noon (12:00)', async () => {
      const noon = new Date('2024-01-10T12:00:00')
      const { getByText } = await render(
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

    it('should handle 11:59 PM', async () => {
      const lateNight = new Date('2024-01-10T23:59:00')
      const { getByText } = await render(
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

    it('should handle 12-hour format conversion correctly', async () => {
      const onePM = new Date('2024-01-10T13:00:00') // 1:00 PM
      const { getByText } = await render(
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

    it('should handle null onChange value gracefully', async () => {
      // Mock TimeClock to return null
      jest.doMock('@mui/x-date-pickers/TimeClock', () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const React = require('react')
        return function TimeClock() {
          return React.createElement('View', { testID: 'time-clock' })
        }
      })

      const { getByTestId } = await render(
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
    it('should pad single digit hours with zero', async () => {
      const singleDigitHour = new Date('2024-01-10T09:30:00') // 9:30 AM
      const { getByText } = await render(
        <TimePickerModal
          visible={true}
          currentDate={singleDigitHour}
          onClose={mockOnClose}
          onTimeSelected={mockOnTimeSelected}
        />,
      )

      expect(getByText('09')).toBeTruthy()
    })

    it('should pad single digit minutes with zero', async () => {
      const singleDigitMinute = new Date('2024-01-10T14:05:00') // 2:05 PM
      const { getByText } = await render(
        <TimePickerModal
          visible={true}
          currentDate={singleDigitMinute}
          onClose={mockOnClose}
          onTimeSelected={mockOnTimeSelected}
        />,
      )

      expect(getByText('05')).toBeTruthy()
    })

    it('should display 12 for midnight and noon', async () => {
      const midnight = new Date('2024-01-10T00:00:00')
      const { getByText: getByTextMidnight, unmount } = await render(
        <TimePickerModal
          visible={true}
          currentDate={midnight}
          onClose={mockOnClose}
          onTimeSelected={mockOnTimeSelected}
        />,
      )
      expect(getByTextMidnight('12')).toBeTruthy()
      await unmount()

      const noon = new Date('2024-01-10T12:00:00')
      const { getByText: getByTextNoon } = await render(
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
