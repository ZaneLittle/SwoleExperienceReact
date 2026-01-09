import React from 'react'
import { renderHook, act, waitFor } from '@testing-library/react-native'
import { AuthProvider, useAuth } from '../../contexts/AuthContext'
import { authService } from '../../lib/services/AuthService'
import { tokenStorage } from '../../lib/utils/tokenStorage'
import { useToast } from '../../contexts/ToastContext'

// Mock dependencies
jest.mock('../../lib/services/AuthService')
jest.mock('../../lib/utils/tokenStorage')
jest.mock('../../contexts/ToastContext', () => ({
  useToast: jest.fn(),
}))

const mockAuthService = authService as jest.Mocked<typeof authService>
const mockTokenStorage = tokenStorage as jest.Mocked<typeof tokenStorage>
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>
const mockShowToast = jest.fn()

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseToast.mockReturnValue({ showToast: mockShowToast })
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  )

  describe('Initial State', () => {
    it('initializes with loading state', async () => {
      mockTokenStorage.getUser.mockResolvedValueOnce(null)

      const { result } = renderHook(() => useAuth(), { wrapper })

      expect(result.current.isLoading).toBe(true)
      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('loads existing user from storage on mount', async () => {
      const storedUser = {
        id: 'user-id',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }
      mockTokenStorage.getUser.mockResolvedValueOnce(storedUser)

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.user).toEqual(storedUser)
      expect(result.current.isAuthenticated).toBe(true)
    })
  })

  describe('login', () => {
    it('successfully logs in and saves tokens', async () => {
      mockTokenStorage.getUser.mockResolvedValueOnce(null)
      const mockResponse = {
        data: {
          access_token: 'access-token',
          refresh_token: 'refresh-token',
          user: {
            id: 'user-id',
            email: 'test@example.com',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        },
      }
      mockAuthService.login.mockResolvedValueOnce(mockResponse)
      mockTokenStorage.saveTokens.mockResolvedValueOnce()

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.login('test@example.com', 'password123')
      })

      expect(mockAuthService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
      expect(mockTokenStorage.saveTokens).toHaveBeenCalledWith(
        'access-token',
        'refresh-token',
        mockResponse.data.user,
      )
      expect(result.current.user).toEqual(mockResponse.data.user)
      expect(result.current.isAuthenticated).toBe(true)
      expect(mockShowToast).toHaveBeenCalledWith('Logged in successfully', 'success')
    })

    it('shows error toast and throws on login failure', async () => {
      mockTokenStorage.getUser.mockResolvedValueOnce(null)
      const error = new Error('Invalid credentials')
      mockAuthService.login.mockRejectedValueOnce(error)

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await expect(result.current.login('test@example.com', 'wrong')).rejects.toThrow()
      })

      expect(mockShowToast).toHaveBeenCalledWith('Invalid credentials', 'error')
      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
    })
  })

  describe('register', () => {
    it('successfully registers and saves tokens', async () => {
      mockTokenStorage.getUser.mockResolvedValueOnce(null)
      const mockResponse = {
        data: {
          access_token: 'access-token',
          refresh_token: 'refresh-token',
          user: {
            id: 'user-id',
            email: 'newuser@example.com',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        },
      }
      mockAuthService.register.mockResolvedValueOnce(mockResponse)
      mockTokenStorage.saveTokens.mockResolvedValueOnce()

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.register('newuser@example.com', 'password123')
      })

      expect(mockAuthService.register).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'password123',
      })
      expect(mockTokenStorage.saveTokens).toHaveBeenCalledWith(
        'access-token',
        'refresh-token',
        mockResponse.data.user,
      )
      expect(result.current.user).toEqual(mockResponse.data.user)
      expect(result.current.isAuthenticated).toBe(true)
      expect(mockShowToast).toHaveBeenCalledWith('Account created successfully', 'success')
    })

    it('shows error toast and throws on registration failure', async () => {
      mockTokenStorage.getUser.mockResolvedValueOnce(null)
      const error = new Error('Email already exists')
      mockAuthService.register.mockRejectedValueOnce(error)

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await expect(result.current.register('existing@example.com', 'password123')).rejects.toThrow()
      })

      expect(mockShowToast).toHaveBeenCalledWith('Email already exists', 'error')
    })
  })

  describe('logout', () => {
    it('successfully logs out and clears tokens', async () => {
      const storedUser = {
        id: 'user-id',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }
      mockTokenStorage.getUser.mockResolvedValueOnce(storedUser)
      mockTokenStorage.getRefreshToken.mockResolvedValueOnce('refresh-token')
      mockAuthService.logout.mockResolvedValueOnce()
      mockTokenStorage.clearTokens.mockResolvedValueOnce()

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.logout()
      })

      expect(mockTokenStorage.getRefreshToken).toHaveBeenCalled()
      expect(mockAuthService.logout).toHaveBeenCalledWith('refresh-token')
      expect(mockTokenStorage.clearTokens).toHaveBeenCalled()
      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(mockShowToast).toHaveBeenCalledWith('Logged out successfully', 'success')
    })

    it('clears local state even if API logout fails', async () => {
      const storedUser = {
        id: 'user-id',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }
      mockTokenStorage.getUser.mockResolvedValueOnce(storedUser)
      mockTokenStorage.getRefreshToken.mockResolvedValueOnce('refresh-token')
      mockAuthService.logout.mockRejectedValueOnce(new Error('Network error'))
      mockTokenStorage.clearTokens.mockResolvedValueOnce()

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.logout()
      })

      expect(mockTokenStorage.clearTokens).toHaveBeenCalled()
      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('handles logout when no refresh token exists', async () => {
      mockTokenStorage.getUser.mockResolvedValueOnce(null)
      mockTokenStorage.getRefreshToken.mockResolvedValueOnce(null)
      mockTokenStorage.clearTokens.mockResolvedValueOnce()

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.logout()
      })

      expect(mockAuthService.logout).not.toHaveBeenCalled()
      expect(mockTokenStorage.clearTokens).toHaveBeenCalled()
      expect(result.current.user).toBeNull()
    })
  })

  describe('deleteAccount', () => {
    it('successfully deletes account and clears tokens', async () => {
      const storedUser = {
        id: 'user-id',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }
      mockTokenStorage.getUser.mockResolvedValueOnce(storedUser)
      mockTokenStorage.getAccessToken.mockResolvedValueOnce('access-token')
      mockAuthService.deleteAccount.mockResolvedValueOnce()
      mockTokenStorage.clearTokens.mockResolvedValueOnce()

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.deleteAccount()
      })

      expect(mockTokenStorage.getAccessToken).toHaveBeenCalled()
      expect(mockAuthService.deleteAccount).toHaveBeenCalledWith('access-token')
      expect(mockTokenStorage.clearTokens).toHaveBeenCalled()
      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(mockShowToast).toHaveBeenCalledWith('Account deleted successfully', 'success')
    })

    it('throws error when not authenticated', async () => {
      mockTokenStorage.getUser.mockResolvedValueOnce(null)
      mockTokenStorage.getAccessToken.mockResolvedValueOnce(null)

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await expect(result.current.deleteAccount()).rejects.toThrow('Not authenticated')
      })

      expect(mockAuthService.deleteAccount).not.toHaveBeenCalled()
      expect(mockShowToast).toHaveBeenCalledWith('Not authenticated', 'error')
    })

    it('shows error toast and throws on delete failure', async () => {
      const storedUser = {
        id: 'user-id',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }
      mockTokenStorage.getUser.mockResolvedValueOnce(storedUser)
      mockTokenStorage.getAccessToken.mockResolvedValueOnce('access-token')
      const error = new Error('Failed to delete account')
      mockAuthService.deleteAccount.mockRejectedValueOnce(error)

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await expect(result.current.deleteAccount()).rejects.toThrow()
      })

      expect(mockShowToast).toHaveBeenCalledWith('Failed to delete account', 'error')
      // User should still be set if deletion failed
      expect(result.current.user).toEqual(storedUser)
    })
  })
})

