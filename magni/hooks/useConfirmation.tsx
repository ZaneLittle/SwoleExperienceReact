import { useState, useCallback } from 'react'
import { ConfirmationModal, ConfirmationButton } from '../components/ConfirmationModal'

export interface ConfirmationOptions {
  title: string;
  message: string;
  buttons: ConfirmationButton[];
  onRequestClose?: () => void;
}

export const useConfirmation = () => {
  const [confirmation, setConfirmation] = useState<ConfirmationOptions | null>(null)

  const showConfirmation = useCallback((options: ConfirmationOptions) => {
    setConfirmation(options)
  }, [])

  const hideConfirmation = useCallback(() => {
    setConfirmation(null)
  }, [])

  const ConfirmationComponent = confirmation ? (
    <ConfirmationModal
      visible={true}
      title={confirmation.title}
      message={confirmation.message}
      buttons={confirmation.buttons}
      onRequestClose={() => {
        if (confirmation.onRequestClose) {
          confirmation.onRequestClose()
        }
        hideConfirmation()
      }}
    />
  ) : null

  return {
    showConfirmation,
    hideConfirmation,
    ConfirmationComponent,
  }
}

