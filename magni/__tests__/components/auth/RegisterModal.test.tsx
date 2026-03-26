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
    it('renders registration form when visible', () => {
      const { getAllByText, getByPlaceholderText, getByTestId } = render(<RegisterModal {...defaultProps} />)

      expect(getAllByText('Create Account').length).toBe(2)
      expect(getByPlaceholderText('Enter your email')).toBeTruthy()
      expect(getByPlaceholderText('At least 8 characters')).toBeTruthy()
      expect(getByPlaceholderText('Confirm your password')).toBeTruthy()
      expect(within(getByTestId('register-modal-submit')).getByText('Create Account')).toBeTruthy()
    })

    it('does not render when not visible', () => {
      const { queryByText } = render(<RegisterModal {...defaultProps} visible={false} />)

      expect(queryByText('Create Account')).toBeNull()
    })
  })

  describe('Form Input', () => {
    it('allows entering email, password, and confirm password', () => {
      const { getByPlaceholderText } = render(<RegisterModal {...defaultProps} />)

      const emailInput = getByPlaceholderText('Enter your email')
      const passwordInput = getByPlaceholderText('At least 8 characters')
      const confirmPasswordInput = getByPlaceholderText('Confirm your password')

      fireEvent.changeText(emailInput, 'test@example.com')
      fireEvent.changeText(passwordInput, 'password123')
      fireEvent.changeText(confirmPasswordInput, 'password123')

      expect(emailInput.props.value).toBe('test@example.com')
      expect(passwordInput.props.value).toBe('password123')
      expect(confirmPasswordInput.props.value).toBe('password123')
    })
  })

  describe('Password Validation', () => {
    it('shows error when password is less than 8 characters', () => {
      const { getByPlaceholderText, getByText } = render(<RegisterModal {...defaultProps} />)

      const passwordInput = getByPlaceholderText('At least 8 characters')
      fireEvent.changeText(passwordInput, 'short')

      expect(getByText('Password must be at least 8 characters')).toBeTruthy()
    })

    it('hides error when password meets minimum length', () => {
      const { getByPlaceholderText, queryByText } = render(<RegisterModal {...defaultProps} />)

      const passwordInput = getByPlaceholderText('At least 8 characters')
      fireEvent.changeText(passwordInput, 'short')

      expect(queryByText('Password must be at least 8 characters')).not.toBeNull()

      fireEvent.changeText(passwordInput, 'password123')

      expect(queryByText('Password must be at least 8 characters')).toBeNull()
    })

    it('shows error when passwords do not match', () => {
      const { getByPlaceholderText, getByText } = render(<RegisterModal {...defaultProps} />)

      const passwordInput = getByPlaceholderText('At least 8 characters')
      const confirmPasswordInput = getByPlaceholderText('Confirm your password')

      fireEvent.changeText(passwordInput, 'password123')
      fireEvent.changeText(confirmPasswordInput, 'different')

      expect(getByText('Passwords do not match')).toBeTruthy()
    })

    it('hides error when passwords match', () => {
      const { getByPlaceholderText, queryByText } = render(<RegisterModal {...defaultProps} />)

      const passwordInput = getByPlaceholderText('At least 8 characters')
      const confirmPasswordInput = getByPlaceholderText('Confirm your password')

      fireEvent.changeText(passwordInput, 'password123')
      fireEvent.changeText(confirmPasswordInput, 'different')

      expect(queryByText('Passwords do not match')).not.toBeNull()

      fireEvent.changeText(confirmPasswordInput, 'password123')

      expect(queryByText('Passwords do not match')).toBeNull()
    })

    it('does not show password match error when confirm password is empty', () => {
      const { getByPlaceholderText, queryByText } = render(<RegisterModal {...defaultProps} />)

      const passwordInput = getByPlaceholderText('At least 8 characters')
      const confirmPasswordInput = getByPlaceholderText('Confirm your password')

      fireEvent.changeText(passwordInput, 'password123')
      fireEvent.changeText(confirmPasswordInput, '')

      expect(queryByText('Passwords do not match')).toBeNull()
    })
  })

  describe('Form Validation', () => {
    it('disables submit button when email is empty', () => {
      const { getByTestId, getByPlaceholderText } = render(<RegisterModal {...defaultProps} />)

      const passwordInput = getByPlaceholderText('At least 8 characters')
      const confirmPasswordInput = getByPlaceholderText('Confirm your password')
      const submitButton = getByTestId('register-modal-submit')

      fireEvent.changeText(passwordInput, 'password123')
      fireEvent.changeText(confirmPasswordInput, 'password123')

      expect(submitButton.props.disabled).toBe(true)
    })

    it('disables submit button when password is too short', () => {
      const { getByTestId, getByPlaceholderText } = render(<RegisterModal {...defaultProps} />)

      const emailInput = getByPlaceholderText('Enter your email')
      const passwordInput = getByPlaceholderText('At least 8 characters')
      const confirmPasswordInput = getByPlaceholderText('Confirm your password')
      const submitButton = getByTestId('register-modal-submit')

      fireEvent.changeText(emailInput, 'test@example.com')
      fireEvent.changeText(passwordInput, 'short')
      fireEvent.changeText(confirmPasswordInput, 'short')

      expect(submitButton.props.disabled).toBe(true)
    })

    it('disables submit button when passwords do not match', () => {
      const { getByTestId, getByPlaceholderText } = render(<RegisterModal {...defaultProps} />)

      const emailInput = getByPlaceholderText('Enter your email')
      const passwordInput = getByPlaceholderText('At least 8 characters')
      const confirmPasswordInput = getByPlaceholderText('Confirm your password')
      const submitButton = getByTestId('register-modal-submit')

      fireEvent.changeText(emailInput, 'test@example.com')
      fireEvent.changeText(passwordInput, 'password123')
      fireEvent.changeText(confirmPasswordInput, 'different')

      expect(submitButton.props.disabled).toBe(true)
    })

    it('enables submit button when all fields are valid', () => {
      const { getByTestId, getByPlaceholderText } = render(<RegisterModal {...defaultProps} />)

      const emailInput = getByPlaceholderText('Enter your email')
      const passwordInput = getByPlaceholderText('At least 8 characters')
      const confirmPasswordInput = getByPlaceholderText('Confirm your password')
      const submitButton = getByTestId('register-modal-submit')

      fireEvent.changeText(emailInput, 'test@example.com')
      fireEvent.changeText(passwordInput, 'password123')
      fireEvent.changeText(confirmPasswordInput, 'password123')

      expect(submitButton.props.disabled).toBe(false)
    })

    it('trims email before submitting', async () => {
      mockRegister.mockResolvedValueOnce(undefined)

      const { getByTestId, getByPlaceholderText } = render(<RegisterModal {...defaultProps} />)

      const emailInput = getByPlaceholderText('Enter your email')
      const passwordInput = getByPlaceholderText('At least 8 characters')
      const confirmPasswordInput = getByPlaceholderText('Confirm your password')
      const submitButton = getByTestId('register-modal-submit')

      fireEvent.changeText(emailInput, '  test@example.com  ')
      fireEvent.changeText(passwordInput, 'password123')
      fireEvent.changeText(confirmPasswordInput, 'password123')
      fireEvent.press(submitButton)

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith('test@example.com', 'password123')
      })
    })
  })

  describe('Form Submission', () => {
    it('calls register with email and password on submit', async () => {
      mockRegister.mockResolvedValueOnce(undefined)

      const { getByTestId, getByPlaceholderText } = render(<RegisterModal {...defaultProps} />)

      const emailInput = getByPlaceholderText('Enter your email')
      const passwordInput = getByPlaceholderText('At least 8 characters')
      const confirmPasswordInput = getByPlaceholderText('Confirm your password')
      const submitButton = getByTestId('register-modal-submit')

      fireEvent.changeText(emailInput, 'newuser@example.com')
      fireEvent.changeText(passwordInput, 'password123')
      fireEvent.changeText(confirmPasswordInput, 'password123')
      fireEvent.press(submitButton)

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith('newuser@example.com', 'password123')
      })
    })

    it('calls onClose after successful registration', async () => {
      mockRegister.mockResolvedValueOnce(undefined)

      const onClose = jest.fn()
      const { getByTestId, getByPlaceholderText } = render(
        <RegisterModal {...defaultProps} onClose={onClose} />,
      )

      const emailInput = getByPlaceholderText('Enter your email')
      const passwordInput = getByPlaceholderText('At least 8 characters')
      const confirmPasswordInput = getByPlaceholderText('Confirm your password')
      const submitButton = getByTestId('register-modal-submit')

      fireEvent.changeText(emailInput, 'newuser@example.com')
      fireEvent.changeText(passwordInput, 'password123')
      fireEvent.changeText(confirmPasswordInput, 'password123')
      fireEvent.press(submitButton)

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled()
      })
    })

    it('clears all form fields after successful registration', async () => {
      mockRegister.mockResolvedValueOnce(undefined)

      const { getByTestId, getByPlaceholderText } = render(<RegisterModal {...defaultProps} />)

      const emailInput = getByPlaceholderText('Enter your email')
      const passwordInput = getByPlaceholderText('At least 8 characters')
      const confirmPasswordInput = getByPlaceholderText('Confirm your password')
      const submitButton = getByTestId('register-modal-submit')

      fireEvent.changeText(emailInput, 'newuser@example.com')
      fireEvent.changeText(passwordInput, 'password123')
      fireEvent.changeText(confirmPasswordInput, 'password123')
      fireEvent.press(submitButton)

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalled()
      })

      expect(emailInput.props.value).toBe('')
      expect(passwordInput.props.value).toBe('')
      expect(confirmPasswordInput.props.value).toBe('')
    })

    it('does not submit when validation fails', async () => {
      const { getByTestId, getByPlaceholderText } = render(<RegisterModal {...defaultProps} />)

      const emailInput = getByPlaceholderText('Enter your email')
      const passwordInput = getByPlaceholderText('At least 8 characters')
      const confirmPasswordInput = getByPlaceholderText('Confirm your password')
      const submitButton = getByTestId('register-modal-submit')

      fireEvent.changeText(emailInput, 'test@example.com')
      fireEvent.changeText(passwordInput, 'short')
      fireEvent.changeText(confirmPasswordInput, 'short')

      if (!submitButton.props.disabled) {
        fireEvent.press(submitButton)
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

      const { getByTestId, getByPlaceholderText } = render(<RegisterModal {...defaultProps} />)

      const emailInput = getByPlaceholderText('Enter your email')
      const passwordInput = getByPlaceholderText('At least 8 characters')
      const confirmPasswordInput = getByPlaceholderText('Confirm your password')
      const submitButton = getByTestId('register-modal-submit')

      fireEvent.changeText(emailInput, 'test@example.com')
      fireEvent.changeText(passwordInput, 'password123')
      fireEvent.changeText(confirmPasswordInput, 'password123')

      fireEvent.press(submitButton)

      const submitScope = within(submitButton)
      expect(submitScope.queryByText('Create Account')).toBeNull()

      resolveRegister!()
      await waitFor(() => {
        expect(submitScope.getByText('Create Account')).toBeTruthy()
      })
    })
  })

  describe('User Interactions', () => {
    it('calls onSwitchToLogin when switch button is pressed', () => {
      const onSwitchToLogin = jest.fn()
      const { getByText } = render(
        <RegisterModal {...defaultProps} onSwitchToLogin={onSwitchToLogin} />,
      )

      fireEvent.press(getByText('Already have an account? Log In'))

      expect(onSwitchToLogin).toHaveBeenCalledTimes(1)
    })

    it('calls onClose when cancel button is pressed', () => {
      const onClose = jest.fn()
      const { getByText } = render(<RegisterModal {...defaultProps} onClose={onClose} />)

      fireEvent.press(getByText('Cancel'))

      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Error Handling', () => {
    it('does not close modal on registration error', async () => {
      const onClose = jest.fn()
      const error = new Error('Email already exists')
      mockRegister.mockRejectedValueOnce(error)

      const { getByTestId, getByPlaceholderText } = render(
        <RegisterModal {...defaultProps} onClose={onClose} />,
      )

      const emailInput = getByPlaceholderText('Enter your email')
      const passwordInput = getByPlaceholderText('At least 8 characters')
      const confirmPasswordInput = getByPlaceholderText('Confirm your password')
      const submitButton = getByTestId('register-modal-submit')

      fireEvent.changeText(emailInput, 'existing@example.com')
      fireEvent.changeText(passwordInput, 'password123')
      fireEvent.changeText(confirmPasswordInput, 'password123')
      fireEvent.press(submitButton)

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalled()
      })

      expect(onClose).not.toHaveBeenCalled()
      expect(within(submitButton).getByText('Create Account')).toBeTruthy()
    })
  })
})

