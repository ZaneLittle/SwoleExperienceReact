import React from 'react'
import { renderHook, act, waitFor } from '@testing-library/react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { WeightPeriodProvider, useWeightPeriod, WeightPeriodWindow } from '../../contexts/WeightPeriodContext'

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>
const mockGetItem = mockAsyncStorage.getItem as jest.MockedFunction<typeof mockAsyncStorage.getItem>
const mockSetItem = mockAsyncStorage.setItem as jest.MockedFunction<typeof mockAsyncStorage.setItem>

// Mock console.warn to avoid test output noise
const originalConsoleWarn = console.warn
beforeAll(() => {
  console.warn = jest.fn()
})

afterAll(() => {
  console.warn = originalConsoleWarn
})

describe('WeightPeriodContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <WeightPeriodProvider>{children}</WeightPeriodProvider>
  )

  describe('useWeightPeriod', () => {
    it('returns default period window when no saved preference exists', async () => {
      mockGetItem.mockResolvedValueOnce(null)

      const { result } = renderHook(() => useWeightPeriod(), { wrapper })

      await waitFor(() => {
        expect(result.current.periodWindow).toBe('twoMonths')
      })
    })

    it('loads saved period window from storage', async () => {
      mockGetItem.mockResolvedValueOnce('week')

      const { result } = renderHook(() => useWeightPeriod(), { wrapper })

      await waitFor(() => {
        expect(result.current.periodWindow).toBe('week')
      })
    })

    it('returns correct days for each period window', () => {
      mockGetItem.mockResolvedValueOnce(null)

      const { result } = renderHook(() => useWeightPeriod(), { wrapper })

      expect(result.current.getDaysFromWindow('week')).toBe(7)
      expect(result.current.getDaysFromWindow('month')).toBe(30)
      expect(result.current.getDaysFromWindow('twoMonths')).toBe(60)
      expect(result.current.getDaysFromWindow('sixMonths')).toBe(180)
      expect(result.current.getDaysFromWindow('twelveMonths')).toBe(365)
    })

    it('saves period window to storage when set', async () => {
      mockGetItem.mockResolvedValueOnce(null)
      mockSetItem.mockResolvedValueOnce(undefined)

      const { result } = renderHook(() => useWeightPeriod(), { wrapper })

      await waitFor(() => {
        expect(result.current.periodWindow).toBe('twoMonths')
      })

      await act(async () => {
        await result.current.setPeriodWindow('month')
      })

      expect(mockSetItem).toHaveBeenCalledWith('@swole_weight_period_window', 'month')
      expect(result.current.periodWindow).toBe('month')
    })

    it('handles invalid saved period window gracefully', async () => {
      mockGetItem.mockResolvedValueOnce('invalid')

      const { result } = renderHook(() => useWeightPeriod(), { wrapper })

      await waitFor(() => {
        expect(result.current.periodWindow).toBe('twoMonths')
      })
    })

    it('handles storage errors gracefully when loading', async () => {
      mockGetItem.mockRejectedValueOnce(new Error('Storage error'))

      const { result } = renderHook(() => useWeightPeriod(), { wrapper })

      await waitFor(() => {
        expect(result.current.periodWindow).toBe('twoMonths')
      })
    })

    it('handles storage errors gracefully when saving', async () => {
      mockGetItem.mockResolvedValueOnce(null)
      mockSetItem.mockRejectedValueOnce(new Error('Storage error'))

      const { result } = renderHook(() => useWeightPeriod(), { wrapper })

      await waitFor(() => {
        expect(result.current.periodWindow).toBe('twoMonths')
      })

      await act(async () => {
        await result.current.setPeriodWindow('week')
      })

      // Should still update the state even if storage fails
      expect(result.current.periodWindow).toBe('week')
    })

    it('can change period window multiple times', async () => {
      mockGetItem.mockResolvedValueOnce(null)
      mockSetItem.mockResolvedValue(undefined)

      const { result } = renderHook(() => useWeightPeriod(), { wrapper })

      await waitFor(() => {
        expect(result.current.periodWindow).toBe('twoMonths')
      })

      await act(async () => {
        await result.current.setPeriodWindow('week')
      })
      expect(result.current.periodWindow).toBe('week')

      await act(async () => {
        await result.current.setPeriodWindow('sixMonths')
      })
      expect(result.current.periodWindow).toBe('sixMonths')

      await act(async () => {
        await result.current.setPeriodWindow('twelveMonths')
      })
      expect(result.current.periodWindow).toBe('twelveMonths')
    })

    it('throws error when used outside provider', () => {
      // Suppress console.error for this test
      const originalError = console.error
      console.error = jest.fn()

      expect(() => {
        renderHook(() => useWeightPeriod())
      }).toThrow('useWeightPeriod must be used within a WeightPeriodProvider')

      console.error = originalError
    })
  })
})
