import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { authService, LoginRequest, RegisterRequest } from '../lib/services/AuthService'
import { tokenStorage, StoredUser } from '../lib/utils/tokenStorage'
import { useToast } from './ToastContext'

interface AuthContextType {
  user: StoredUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  deleteAccount: () => Promise<void>
  refreshAccessToken: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<StoredUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { showToast } = useToast()

  // Load stored auth state on mount
  useEffect(() => {
    loadAuthState()
  }, [])

  const loadAuthState = async () => {
    try {
      const storedUser = await tokenStorage.getUser()
      if (storedUser) {
        setUser(storedUser)
      }
    } catch (error) {
      console.error('Failed to load auth state:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const login = useCallback(async (email: string, password: string) => {
    try {
      const request: LoginRequest = { email, password }
      const response = await authService.login(request)
      
      const { access_token, refresh_token, user: userData } = response.data
      await tokenStorage.saveTokens(access_token, refresh_token, userData)
      
      setUser(userData)
      showToast('Logged in successfully', 'success')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to log in'
      showToast(message, 'error')
      throw error
    }
  }, [showToast])

  const register = useCallback(async (email: string, password: string) => {
    try {
      const request: RegisterRequest = { email, password }
      const response = await authService.register(request)
      
      const { access_token, refresh_token, user: userData } = response.data
      await tokenStorage.saveTokens(access_token, refresh_token, userData)
      
      setUser(userData)
      showToast('Account created successfully', 'success')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create account'
      showToast(message, 'error')
      throw error
    }
  }, [showToast])

  const logout = useCallback(async () => {
    try {
      const refreshToken = await tokenStorage.getRefreshToken()
      if (refreshToken) {
        try {
          await authService.logout(refreshToken)
        } catch (error) {
          // Continue with logout even if API call fails
          console.warn('Failed to logout on server:', error)
        }
      }
      
      await tokenStorage.clearTokens()
      setUser(null)
      showToast('Logged out successfully', 'success')
    } catch (error) {
      console.error('Failed to logout:', error)
      // Still clear local state even if storage clear fails
      setUser(null)
      showToast('Logged out', 'success')
    }
  }, [showToast])

  const deleteAccount = useCallback(async () => {
    try {
      const accessToken = await tokenStorage.getAccessToken()
      if (!accessToken) {
        throw new Error('Not authenticated')
      }

      await authService.deleteAccount(accessToken)
      
      await tokenStorage.clearTokens()
      setUser(null)
      showToast('Account deleted successfully', 'success')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete account'
      showToast(message, 'error')
      throw error
    }
  }, [showToast])

  const refreshAccessToken = useCallback(async (): Promise<boolean> => {
    try {
      const refreshToken = await tokenStorage.getRefreshToken()
      if (!refreshToken) {
        return false
      }

      const response = await authService.refresh({ refresh_token: refreshToken })
      const { access_token, refresh_token: newRefreshToken } = response.data
      
      const currentUser = await tokenStorage.getUser()
      if (!currentUser) {
        return false
      }

      await tokenStorage.saveTokens(access_token, newRefreshToken, currentUser)
      return true
    } catch (error) {
      console.error('Failed to refresh token:', error)
      // If refresh fails, clear auth state
      await tokenStorage.clearTokens()
      setUser(null)
      return false
    }
  }, [])

  const value: AuthContextType = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    login,
    register,
    logout,
    deleteAccount,
    refreshAccessToken,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}



