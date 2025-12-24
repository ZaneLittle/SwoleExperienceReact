import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import Toast from '../components/Toast'

export type ToastType = 'success' | 'error' | 'info'

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [toastType, setToastType] = useState<ToastType>('info')
  const [showToast, setShowToast] = useState(false)
  const [duration, setDuration] = useState(4000)

  const showToastHandler = useCallback((message: string, type: ToastType = 'info', toastDuration: number = 4000) => {
    setToastMessage(message)
    setToastType(type)
    setDuration(toastDuration)
    setShowToast(true)
  }, [])

  const hideToast = useCallback(() => {
    setShowToast(false)
    setToastMessage(null)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast: showToastHandler }}>
      {children}
      <Toast
        message={toastMessage || ''}
        visible={showToast}
        onHide={hideToast}
        type={toastType}
        duration={duration}
      />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
