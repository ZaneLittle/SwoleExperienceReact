import React from 'react'
import { useConfirmation } from '../hooks/useConfirmation'
import { setGlobalConfirmationHandler } from '../utils/confirm'

interface ConfirmationProviderProps {
  children: React.ReactNode;
}

export const ConfirmationProvider: React.FC<ConfirmationProviderProps> = ({ children }) => {
  const { showConfirmation, ConfirmationComponent } = useConfirmation()

  React.useEffect(() => {
    setGlobalConfirmationHandler(showConfirmation)
  }, [showConfirmation])

  return (
    <>
      {children}
      {ConfirmationComponent}
    </>
  )
}

