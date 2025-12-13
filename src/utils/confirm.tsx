import { ConfirmationButton } from '../components/ConfirmationModal'

// Global confirmation state - this will be managed by a provider
let globalShowConfirmation: ((options: {
  title: string;
  message: string;
  buttons: ConfirmationButton[];
  onRequestClose?: () => void;
}) => void) | null = null

export const setGlobalConfirmationHandler = (
  handler: (options: {
    title: string;
    message: string;
    buttons: ConfirmationButton[];
    onRequestClose?: () => void;
  }) => void,
) => {
  globalShowConfirmation = handler
}

export const confirm = (
  title: string,
  message: string,
  buttons: ConfirmationButton[],
): void => {
  if (globalShowConfirmation) {
    globalShowConfirmation({ title, message, buttons })
  } else {
    // Fallback to console warning if handler not set
    console.warn('Confirmation handler not set. Please use ConfirmationProvider.')
  }
}

// Convenience functions
export const confirmAlert = (
  title: string,
  message: string,
  onConfirm?: () => void,
  onCancel?: () => void,
): void => {
  const buttons: ConfirmationButton[] = []
  
  if (onCancel) {
    buttons.push({
      text: 'Cancel',
      style: 'cancel',
      onPress: () => {
        onCancel()
      },
    })
  }
  
  buttons.push({
    text: 'OK',
    style: 'default',
    onPress: () => {
      if (onConfirm) {
        onConfirm()
      }
    },
  })

  confirm(title, message, buttons)
}

export const confirmDelete = (
  title: string,
  message: string,
  onConfirm: () => void,
  onCancel?: () => void,
): void => {
  const buttons: ConfirmationButton[] = []
  
  if (onCancel) {
    buttons.push({
      text: 'Cancel',
      style: 'cancel',
      onPress: () => {
        onCancel()
      },
    })
  }
  
  buttons.push({
    text: 'Delete',
    style: 'destructive',
    onPress: () => {
      onConfirm()
    },
  })

  if (!globalShowConfirmation) {
    console.error('Confirmation handler not set. Please ensure ConfirmationProvider is set up correctly.')
  }

  confirm(title, message, buttons)
}

