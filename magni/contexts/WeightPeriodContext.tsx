import React, { createContext, useContext, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

export type WeightPeriodWindow = 'week' | 'month' | 'twoMonths' | 'sixMonths' | 'twelveMonths'

interface WeightPeriodContextType {
  periodWindow: WeightPeriodWindow
  setPeriodWindow: (window: WeightPeriodWindow) => Promise<void>
  getDaysFromWindow: (window: WeightPeriodWindow) => number
}

const WeightPeriodContext = createContext<WeightPeriodContextType | undefined>(undefined)

const WEIGHT_PERIOD_STORAGE_KEY = '@swole_weight_period_window'

export const WeightPeriodProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [periodWindow, setPeriodWindowState] = useState<WeightPeriodWindow>('twoMonths')

  // Load saved period preference on mount
  useEffect(() => {
    loadPeriodPreference()
  }, [])

  const loadPeriodPreference = async () => {
    try {
      const savedWindow = await AsyncStorage.getItem(WEIGHT_PERIOD_STORAGE_KEY)
      if (savedWindow && ['week', 'month', 'twoMonths', 'sixMonths', 'twelveMonths'].includes(savedWindow)) {
        setPeriodWindowState(savedWindow as WeightPeriodWindow)
      }
    } catch (error) {
      console.warn('Failed to load weight period preference:', error)
    }
  }

  const setPeriodWindow = async (window: WeightPeriodWindow) => {
    setPeriodWindowState(window)
    try {
      await AsyncStorage.setItem(WEIGHT_PERIOD_STORAGE_KEY, window)
    } catch (error) {
      console.warn('Failed to save weight period preference:', error)
    }
  }

  const getDaysFromWindow = (window: WeightPeriodWindow): number => {
    switch (window) {
      case 'week':
        return 7
      case 'month':
        return 30
      case 'twoMonths':
        return 60
      case 'sixMonths':
        return 180
      case 'twelveMonths':
        return 365
      default:
        return 60
    }
  }

  return (
    <WeightPeriodContext.Provider value={{ periodWindow, setPeriodWindow, getDaysFromWindow }}>
      {children}
    </WeightPeriodContext.Provider>
  )
}

export const useWeightPeriod = (): WeightPeriodContextType => {
  const context = useContext(WeightPeriodContext)
  if (!context) {
    throw new Error('useWeightPeriod must be used within a WeightPeriodProvider')
  }
  return context
}
