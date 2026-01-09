import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import LoginModal from '../../../components/auth/LoginModal'
import { useAuth } from '../../../contexts/AuthContext'

// React Native components are already mocked in jest.setup.rntl.js
// Mock dependencies
jest.mock('../../../contexts/AuthContext')
jest.mock('../../../hooks/useThemeColors', () => ({
  useThemeColors: () => ({
    primary: '#007AFF',
    background: '#F2F2F7',
    surface: '#FFFFFF',
    text: {
      primary: '#000000',
      secondary: '#3C3C43',
      tertiary: '#3C3C4399',
    },
    border: '#C6C6C8',
  }),
}))

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockLogin = jest.fn()

describe('LoginModal', () => {
  const defaultProps = {
    visible: true,
    onClose: jest.fn(),
    onSwitchToRegister: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAuth.mockReturnValue({
      login: mockLogin,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      register: jest.fn(),
      logout: jest.fn(),
      deleteAccount: jest.fn(),
      refreshAccessToken: jest.fn(),
    })
  })

  describe('Rendering', () => {
    it('renders login form when visible', () => {
      const { getByText, getByPlaceholderText } = render(<LoginModal {...defaultProps} />)

      expect(getByText('Log In')).toBeVisible()
      expect(getByPlaceholderText('Enter your email')).toBeVisible()
      expect(getByPlaceholderText('Enter your password')).toBeVisible()
      expect(getByText('Log In')).toBeVisible()
    })

    it('does not render when not visible', () => {
      const { queryByText } = render(<LoginModal {...defaultProps} visible={false} />)

      expect(queryByText('Log In')).toBeNull()
    })

    it('renders switch to register button when onSwitchToRegister is provided', () => {
      const { getByText } = render(<LoginModal {...defaultProps} />)

      expect(getByText("Don't have an account? Register")).toBeVisible()
    })

    it('does not render switch button when onSwitchToRegister is not provided', () => {
      const { queryByText } = render(<LoginModal {...defaultProps} onSwitchToRegister={undefined} />)

      expect(queryByText("Don't have an account? Register")).toBeNull()
    })
  })

  describe('Form Input', () => {
    it('allows entering email and password', () => {
      const { getByPlaceholderText } = render(<LoginModal {...defaultProps} />)

      const emailInput = getByPlaceholderText('Enter your email')
      const passwordInput = getByPlaceholderText('Enter your password')

      fireEvent.changeText(emailInput, 'test@example.com')
      fireEvent.changeText(passwordInput, 'password123')

      expect(emailInput.props.value).toBe('test@example.com')
      expect(passwordInput.props.value).toBe('password123')
    })
  })

  describe('Form Validation', () => {
    it('disables submit button when email is empty', () => {
      const { getByText, getByPlaceholderText } = render(<LoginModal {...defaultProps} />)

      const passwordInput = getByPlaceholderText('Enter your password')
      const submitButton = getByText('Log In').parent

      fireEvent.changeText(passwordInput, 'password123')

      expect(submitButton?.props.disabled).toBe(true)
    })

    it('disables submit button when password is empty', () => {
      const { getByText, getByPlaceholderText } = render(<LoginModal {...defaultProps} />)

      const emailInput = getByPlaceholderText('Enter your email')
      const submitButton = getByText('Log In').parent

      fireEvent.changeText(emailInput, 'test@example.com')

      expect(submitButton?.props.disabled).toBe(true)
    })

    it('enables submit button when both email and password are filled', () => {
      const { getByText, getByPlaceholderText } = render(<LoginModal {...defaultProps} />)

      const emailInput = getByPlaceholderText('Enter your email')
      const passwordInput = getByPlaceholderText('Enter your password')
      const submitButton = getByText('Log In').parent

      fireEvent.changeText(emailInput, 'test@example.com')
      fireEvent.changeText(passwordInput, 'password123')

      expect(submitButton?.props.disabled).toBe(false)
    })

    it('trims email before submitting', async () => {
      mockLogin.mockResolvedValueOnce(undefined)

      const { getByText, getByPlaceholderText } = render(<LoginModal {...defaultProps} />)

      const emailInput = getByPlaceholderText('Enter your email')
      const passwordInput = getByPlaceholderText('Enter your password')
      const submitButton = getByText('Log In')

      fireEvent.changeText(emailInput, '  test@example.com  ')
      fireEvent.changeText(passwordInput, 'password123')
      fireEvent.press(submitButton)

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123')
      })
    })
  })

  describe('Form Submission', () => {
    it('calls login with email and password on submit', async () => {
      mockLogin.mockResolvedValueOnce(undefined)

      const { getByText, getByPlaceholderText } = render(<LoginModal {...defaultProps} />)

      const emailInput = getByPlaceholderText('Enter your email')
      const passwordInput = getByPlaceholderText('Enter your password')
      const submitButton = getByText('Log In')

      fireEvent.changeText(emailInput, 'test@example.com')
      fireEvent.changeText(passwordInput, 'password123')
      fireEvent.press(submitButton)

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123')
      })
    })

    it('calls onClose after successful login', async () => {
      mockLogin.mockResolvedValueOnce(undefined)

      const onClose = jest.fn()
      const { getByText, getByPlaceholderText } = render(
        <LoginModal {...defaultProps} onClose={onClose} />,
      )

      const emailInput = getByPlaceholderText('Enter your email')
      const passwordInput = getByPlaceholderText('Enter your password')
      const submitButton = getByText('Log In')

      fireEvent.changeText(emailInput, 'test@example.com')
      fireEvent.changeText(passwordInput, 'password123')
      fireEvent.press(submitButton)

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled()
      })
    })

    it('clears form fields after successful login', async () => {
      mockLogin.mockResolvedValueOnce(undefined)

      const { getByText, getByPlaceholderText } = render(<LoginModal {...defaultProps} />)

      const emailInput = getByPlaceholderText('Enter your email')
      const passwordInput = getByPlaceholderText('Enter your password')
      const submitButton = getByText('Log In')

      fireEvent.changeText(emailInput, 'test@example.com')
      fireEvent.changeText(passwordInput, 'password123')
      fireEvent.press(submitButton)

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled()
      })

      expect(emailInput.props.value).toBe('')
      expect(passwordInput.props.value).toBe('')
    })

    it('does not submit when email or password is empty', async () => {
      const { getByText, getByPlaceholderText } = render(<LoginModal {...defaultProps} />)

      const emailInput = getByPlaceholderText('Enter your email')
      const submitButton = getByText('Log In')

      fireEvent.changeText(emailInput, 'test@example.com')
      fireEvent.press(submitButton)

      // Wait a bit to ensure login is not called
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(mockLogin).not.toHaveBeenCalled()
    })

    it('does not submit when email is only whitespace', async () => {
      const { getByText, getByPlaceholderText } = render(<LoginModal {...defaultProps} />)

      const emailInput = getByPlaceholderText('Enter your email')
      const passwordInput = getByPlaceholderText('Enter your password')
      const submitButton = getByText('Log In')

      fireEvent.changeText(emailInput, '   ')
      fireEvent.changeText(passwordInput, 'password123')
      fireEvent.press(submitButton)

      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(mockLogin).not.toHaveBeenCalled()
    })
  })

  describe('Loading State', () => {
    it('shows loading indicator while logging in', async () => {
      let resolveLogin: () => void
      const loginPromise = new Promise<void>((resolve) => {
        resolveLogin = resolve
      })
      mockLogin.mockReturnValueOnce(loginPromise)

      const { getByText, getByPlaceholderText, queryByText } = render(<LoginModal {...defaultProps} />)

      const emailInput = getByPlaceholderText('Enter your email')
      const passwordInput = getByPlaceholderText('Enter your password')
      const submitButton = getByText('Log In')

      fireEvent.changeText(emailInput, 'test@example.com')
      fireEvent.changeText(passwordInput, 'password123')
      fireEvent.press(submitButton)

      // Should show loading (ActivityIndicator replaces button text)
      expect(queryByText('Log In')).toBeNull()

      resolveLogin!()
      await waitFor(() => {
        expect(queryByText('Log In')).toBeVisible()
      })
    })

    it('disables inputs while loading', async () => {
      let resolveLogin: () => void
      const loginPromise = new Promise<void>((resolve) => {
        resolveLogin = resolve
      })
      mockLogin.mockReturnValueOnce(loginPromise)

      const { getByPlaceholderText } = render(<LoginModal {...defaultProps} />)

      const emailInput = getByPlaceholderText('Enter your email')
      const passwordInput = getByPlaceholderText('Enter your password')

      fireEvent.changeText(emailInput, 'test@example.com')
      fireEvent.changeText(passwordInput, 'password123')

      // Trigger loading
      fireEvent.press(getByPlaceholderText('Enter your password').parent?.parent?.parent)

      await waitFor(() => {
        expect(emailInput.props.editable).toBe(false)
        expect(passwordInput.props.editable).toBe(false)
      })

      resolveLogin!()
    })
  })

  describe('User Interactions', () => {
    it('calls onSwitchToRegister when switch button is pressed', () => {
      const onSwitchToRegister = jest.fn()
      const { getByText } = render(
        <LoginModal {...defaultProps} onSwitchToRegister={onSwitchToRegister} />,
      )

      fireEvent.press(getByText("Don't have an account? Register"))

      expect(onSwitchToRegister).toHaveBeenCalledTimes(1)
    })

    it('calls onClose when cancel button is pressed', () => {
      const onClose = jest.fn()
      const { getByText } = render(<LoginModal {...defaultProps} onClose={onClose} />)

      fireEvent.press(getByText('Cancel'))

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('triggers login when Enter is pressed on password field', async () => {
      mockLogin.mockResolvedValueOnce(undefined)

      const { getByPlaceholderText } = render(<LoginModal {...defaultProps} />)

      const emailInput = getByPlaceholderText('Enter your email')
      const passwordInput = getByPlaceholderText('Enter your password')

      fireEvent.changeText(emailInput, 'test@example.com')
      fireEvent.changeText(passwordInput, 'password123')

      // Simulate onSubmitEditing on password field
      passwordInput.props.onSubmitEditing()

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123')
      })
    })
  })

  describe('Error Handling', () => {
    it('does not close modal on login error', async () => {
      const onClose = jest.fn()
      const error = new Error('Invalid credentials')
      mockLogin.mockRejectedValueOnce(error)

      const { getByText, getByPlaceholderText } = render(
        <LoginModal {...defaultProps} onClose={onClose} />,
      )

      const emailInput = getByPlaceholderText('Enter your email')
      const passwordInput = getByPlaceholderText('Enter your password')
      const submitButton = getByText('Log In')

      fireEvent.changeText(emailInput, 'test@example.com')
      fireEvent.changeText(passwordInput, 'wrongpassword')
      fireEvent.press(submitButton)

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled()
      })

      // Modal should not close on error
      expect(onClose).not.toHaveBeenCalled()
      expect(getByText('Log In')).toBeVisible()
    })
  })

  describe('Form Validation Edge Cases', () => {
    it('handles whitespace-only email correctly', async () => {
      const { getByText, getByPlaceholderText } = render(<LoginModal {...defaultProps} />)

      const emailInput = getByPlaceholderText('Enter your email')
      const passwordInput = getByPlaceholderText('Enter your password')
      const submitButton = getByText('Log In')

      fireEvent.changeText(emailInput, '   ')
      fireEvent.changeText(passwordInput, 'password123')

      // Button should be disabled
      expect(submitButton.parent?.props.disabled).toBe(true)

      await new Promise((resolve) => setTimeout(resolve, 100))
      expect(mockLogin).not.toHaveBeenCalled()
    })
  })
})

