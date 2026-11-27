import React from 'react'
import { render, fireEvent, waitFor, within } from '@testing-library/react-native'
import RegisterModal from '../../../components/auth/RegisterModal'
import { useAuth } from '../../../contexts/AuthContext'

// Mock dependencies
jest.mock('../../../contexts/AuthContext')
jest.mock('../../../hooks/useThemeColors', () => ({
  useThemeColors: () => ({
    primary: '#007AFF',
    background: '#F2F2F7',
    surface: '#FFFFFF',
    error: '#FF3B30',
    text: {
      primary: '#000000',
      secondary: '#3C3C43',
      tertiary: '#3C3C4399',
    },
    border: '#C6C6C8',
  }),
}))

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockRegister = jest.fn()

describe('RegisterModal', () => {
  const defaultProps = {
    visible: true,
    onClose: jest.fn(),
    onSwitchToLogin: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAuth.mockReturnValue({
      register: mockRegister,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
      deleteAccount: jest.fn(),
      refreshAccessToken: jest.fn(),
    })
  })

  describe('Rendering', () => {
    it('renders registration form when visible', async () => {
      const { getAllByText, getByPlaceholderText, getByTestId } = await render(<RegisterModal {...defaultProps} />)

      expect(getAllByText('Create Account').length).toBe(2)
      expect(getByPlaceholderText('Enter your email')).toBeTruthy()
      expect(getByPlaceholderText('At least 8 characters')).toBeTruthy()
      expect(getByPlaceholderText('Confirm your password')).toBeTruthy()
      expect(within(getByTestId('register-modal-submit')).getByText('Create Account')).toBeTruthy()
    })

    it('does not render when not visible', async () => {
      const { queryByText } = await render(<RegisterModal {...defaultProps} visible={false} />)

      expect(queryByText('Create Account')).toBeNull()
    })
  })

  describe('Form Input', () => {
    it('allows entering email, password, and confirm password', async () => {
      const { getByPlaceholderText } = await render(<RegisterModal {...defaultProps} />)

      const emailInput = getByPlaceholderText('Enter your email')
      const passwordInput = getByPlaceholderText('At least 8 characters')
      const confirmPasswordInput = getByPlaceholderText('Confirm your password')

      await fireEvent.changeText(emailInput, 'test@example.com')
      await fireEvent.changeText(passwordInput, 'password123')
      await fireEvent.changeText(confirmPasswordInput, 'password123')

      expect(emailInput.props.value).toBe('test@example.com')
      expect(passwordInput.props.value).toBe('password123')
      expect(confirmPasswordInput.props.value).toBe('password123')
    })
  })

  describe('Password Validation', () => {
    it('shows error when password is less than 8 characters', async () => {
      const { getByPlaceholderText, getByText } = await render(<RegisterModal {...defaultProps} />)

      const passwordInput = getByPlaceholderText('At least 8 characters')
      await fireEvent.changeText(passwordInput, 'short')

      expect(getByText('Password must be at least 8 characters')).toBeTruthy()
    })

    it('hides error when password meets minimum length', async () => {
      const { getByPlaceholderText, queryByText } = await render(<RegisterModal {...defaultProps} />)

      const passwordInput = getByPlaceholderText('At least 8 characters')
      await fireEvent.changeText(passwordInput, 'short')

      expect(queryByText('Password must be at least 8 characters')).not.toBeNull()

      await fireEvent.changeText(passwordInput, 'password123')

      expect(queryByText('Password must be at least 8 characters')).toBeNull()
    })

    it('shows error when passwords do not match', async () => {
      const { getByPlaceholderText, getByText } = await render(<RegisterModal {...defaultProps} />)

      const passwordInput = getByPlaceholderText('At least 8 characters')
      const confirmPasswordInput = getByPlaceholderText('Confirm your password')

      await fireEvent.changeText(passwordInput, 'password123')
      await fireEvent.changeText(confirmPasswordInput, 'different')

      expect(getByText('Passwords do not match')).toBeTruthy()
    })

    it('hides error when passwords match', async () => {
      const { getByPlaceholderText, queryByText } = await render(<RegisterModal {...defaultProps} />)

      const passwordInput = getByPlaceholderText('At least 8 characters')
      const confirmPasswordInput = getByPlaceholderText('Confirm your password')

      await fireEvent.changeText(passwordInput, 'password123')
      await fireEvent.changeText(confirmPasswordInput, 'different')

      expect(queryByText('Passwords do not match')).not.toBeNull()

      await fireEvent.changeText(confirmPasswordInput, 'password123')

      expect(queryByText('Passwords do not match')).toBeNull()
    })

    it('does not show password match error when confirm password is empty', async () => {
      const { getByPlaceholderText, queryByText } = await render(<RegisterModal {...defaultProps} />)

      const passwordInput = getByPlaceholderText('At least 8 characters')
      const confirmPasswordInput = getByPlaceholderText('Confirm your password')

      await fireEvent.changeText(passwordInput, 'password123')
      await fireEvent.changeText(confirmPasswordInput, '')

      expect(queryByText('Passwords do not match')).toBeNull()
    })
  })

  describe('Form Validation', () => {
    it('disables submit button when email is empty', async () => {
      const { getByTestId, getByPlaceholderText } = await render(<RegisterModal {...defaultProps} />)

      const passwordInput = getByPlaceholderText('At least 8 characters')
      const confirmPasswordInput = getByPlaceholderText('Confirm your password')
      const submitButton = getByTestId('register-modal-submit')

      await fireEvent.changeText(passwordInput, 'password123')
      await fireEvent.changeText(confirmPasswordInput, 'password123')

      expect(submitButton.props.disabled).toBe(true)
    })

    it('disables submit button when password is too short', async () => {
      const { getByTestId, getByPlaceholderText } = await render(<RegisterModal {...defaultProps} />)

      const emailInput = getByPlaceholderText('Enter your email')
      const passwordInput = getByPlaceholderText('At least 8 characters')
      const confirmPasswordInput = getByPlaceholderText('Confirm your password')
      const submitButton = getByTestId('register-modal-submit')

      await fireEvent.changeText(emailInput, 'test@example.com')
      await fireEvent.changeText(passwordInput, 'short')
      await fireEvent.changeText(confirmPasswordInput, 'short')

      expect(submitButton.props.disabled).toBe(true)
    })

    it('disables submit button when passwords do not match', async () => {
      const { getByTestId, getByPlaceholderText } = await render(<RegisterModal {...defaultProps} />)

      const emailInput = getByPlaceholderText('Enter your email')
      const passwordInput = getByPlaceholderText('At least 8 characters')
      const confirmPasswordInput = getByPlaceholderText('Confirm your password')
      const submitButton = getByTestId('register-modal-submit')

      await fireEvent.changeText(emailInput, 'test@example.com')
      await fireEvent.changeText(passwordInput, 'password123')
      await fireEvent.changeText(confirmPasswordInput, 'different')

      expect(submitButton.props.disabled).toBe(true)
    })

    it('enables submit button when all fields are valid', async () => {
      const { getByTestId, getByPlaceholderText } = await render(<RegisterModal {...defaultProps} />)

      const emailInput = getByPlaceholderText('Enter your email')
      const passwordInput = getByPlaceholderText('At least 8 characters')
      const confirmPasswordInput = getByPlaceholderText('Confirm your password')
      const submitButton = getByTestId('register-modal-submit')

      await fireEvent.changeText(emailInput, 'test@example.com')
      await fireEvent.changeText(passwordInput, 'password123')
      await fireEvent.changeText(confirmPasswordInput, 'password123')

      expect(submitButton.props.disabled).toBe(false)
    })

    it('trims email before submitting', async () => {
      mockRegister.mockResolvedValueOnce(undefined)

      const { getByTestId, getByPlaceholderText } = await render(<RegisterModal {...defaultProps} />)

      const emailInput = getByPlaceholderText('Enter your email')
      const passwordInput = getByPlaceholderText('At least 8 characters')
      const confirmPasswordInput = getByPlaceholderText('Confirm your password')
      const submitButton = getByTestId('register-modal-submit')

      await fireEvent.changeText(emailInput, '  test@example.com  ')
      await fireEvent.changeText(passwordInput, 'password123')
      await fireEvent.changeText(confirmPasswordInput, 'password123')
      await fireEvent.press(submitButton)

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith('test@example.com', 'password123')
      })
    })
  })

  describe('Form Submission', () => {
    it('calls register with email and password on submit', async () => {
      mockRegister.mockResolvedValueOnce(undefined)

      const { getByTestId, getByPlaceholderText } = await render(<RegisterModal {...defaultProps} />)

      const emailInput = getByPlaceholderText('Enter your email')
      const passwordInput = getByPlaceholderText('At least 8 characters')
      const confirmPasswordInput = getByPlaceholderText('Confirm your password')
      const submitButton = getByTestId('register-modal-submit')

      await fireEvent.changeText(emailInput, 'newuser@example.com')
      await fireEvent.changeText(passwordInput, 'password123')
      await fireEvent.changeText(confirmPasswordInput, 'password123')
      await fireEvent.press(submitButton)

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith('newuser@example.com', 'password123')
      })
    })

    it('calls onClose after successful registration', async () => {
      mockRegister.mockResolvedValueOnce(undefined)

      const onClose = jest.fn()
      const { getByTestId, getByPlaceholderText } = await render(
        <RegisterModal {...defaultProps} onClose={onClose} />,
      )

      const emailInput = getByPlaceholderText('Enter your email')
      const passwordInput = getByPlaceholderText('At least 8 characters')
      const confirmPasswordInput = getByPlaceholderText('Confirm your password')
      const submitButton = getByTestId('register-modal-submit')

      await fireEvent.changeText(emailInput, 'newuser@example.com')
      await fireEvent.changeText(passwordInput, 'password123')
      await fireEvent.changeText(confirmPasswordInput, 'password123')
      await fireEvent.press(submitButton)

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled()
      })
    })

    it('clears all form fields after successful registration', async () => {
      mockRegister.mockResolvedValueOnce(undefined)

      const { getByTestId, getByPlaceholderText } = await render(<RegisterModal {...defaultProps} />)

      const emailInput = getByPlaceholderText('Enter your email')
      const passwordInput = getByPlaceholderText('At least 8 characters')
      const confirmPasswordInput = getByPlaceholderText('Confirm your password')
      const submitButton = getByTestId('register-modal-submit')

      await fireEvent.changeText(emailInput, 'newuser@example.com')
      await fireEvent.changeText(passwordInput, 'password123')
      await fireEvent.changeText(confirmPasswordInput, 'password123')
      await fireEvent.press(submitButton)

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalled()
      })

      expect(emailInput.props.value).toBe('')
      expect(passwordInput.props.value).toBe('')
      expect(confirmPasswordInput.props.value).toBe('')
    })

    it('does not submit when validation fails', async () => {
      const { getByTestId, getByPlaceholderText } = await render(<RegisterModal {...defaultProps} />)

      const emailInput = getByPlaceholderText('Enter your email')
      const passwordInput = getByPlaceholderText('At least 8 characters')
      const confirmPasswordInput = getByPlaceholderText('Confirm your password')
      const submitButton = getByTestId('register-modal-submit')

      await fireEvent.changeText(emailInput, 'test@example.com')
      await fireEvent.changeText(passwordInput, 'short')
      await fireEvent.changeText(confirmPasswordInput, 'short')

      if (!submitButton.props.disabled) {
        await fireEvent.press(submitButton)
      }

      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(mockRegister).not.toHaveBeenCalled()
    })
  })

  describe('Loading State', () => {
    it('shows loading indicator while registering', async () => {
      let resolveRegister: () => void
      const registerPromise = new Promise<void>((resolve) => {
        resolveRegister = resolve
      })
      mockRegister.mockReturnValueOnce(registerPromise)

      const { getByTestId, getByPlaceholderText } = await render(<RegisterModal {...defaultProps} />)

      await fireEvent.changeText(getByPlaceholderText('Enter your email'), 'test@example.com')
      await fireEvent.changeText(getByPlaceholderText('At least 8 characters'), 'password123')
      await fireEvent.changeText(getByPlaceholderText('Confirm your password'), 'password123')

      // The register promise stays pending until the test resolves it.
      const pressPromise = fireEvent.press(getByTestId('register-modal-submit'))

      await waitFor(() => {
        expect(within(getByTestId('register-modal-submit')).queryByText('Create Account')).toBeNull()
      })

      resolveRegister!()

      await waitFor(() => {
        expect(within(getByTestId('register-modal-submit')).getByText('Create Account')).toBeTruthy()
      })
      await pressPromise
    })
  })

  describe('User Interactions', () => {
    it('calls onSwitchToLogin when switch button is pressed', async () => {
      const onSwitchToLogin = jest.fn()
      const { getByText } = await render(
        <RegisterModal {...defaultProps} onSwitchToLogin={onSwitchToLogin} />,
      )

      await fireEvent.press(getByText('Already have an account? Log In'))

      expect(onSwitchToLogin).toHaveBeenCalledTimes(1)
    })

    it('calls onClose when cancel button is pressed', async () => {
      const onClose = jest.fn()
      const { getByText } = await render(<RegisterModal {...defaultProps} onClose={onClose} />)

      await fireEvent.press(getByText('Cancel'))

      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Error Handling', () => {
    it('does not close modal on registration error', async () => {
      const onClose = jest.fn()
      const error = new Error('Email already exists')
      mockRegister.mockRejectedValueOnce(error)

      const { getByTestId, getByPlaceholderText } = await render(
        <RegisterModal {...defaultProps} onClose={onClose} />,
      )

      const emailInput = getByPlaceholderText('Enter your email')
      const passwordInput = getByPlaceholderText('At least 8 characters')
      const confirmPasswordInput = getByPlaceholderText('Confirm your password')
      const submitButton = getByTestId('register-modal-submit')

      await fireEvent.changeText(emailInput, 'existing@example.com')
      await fireEvent.changeText(passwordInput, 'password123')
      await fireEvent.changeText(confirmPasswordInput, 'password123')
      await fireEvent.press(submitButton)

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalled()
      })

      expect(onClose).not.toHaveBeenCalled()
      expect(within(submitButton).getByText('Create Account')).toBeTruthy()
    })
  })
})

