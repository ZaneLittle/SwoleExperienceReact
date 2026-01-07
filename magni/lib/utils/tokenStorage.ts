// Token storage utilities for secure token management
import AsyncStorage from '@react-native-async-storage/async-storage'

const ACCESS_TOKEN_KEY = '@magni_access_token'
const REFRESH_TOKEN_KEY = '@magni_refresh_token'
const USER_KEY = '@magni_user'

export interface StoredUser {
  id: string
  email: string
  created_at: string
  updated_at: string
}

export const tokenStorage = {
  async saveTokens(accessToken: string, refreshToken: string, user: StoredUser): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken),
        AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken),
        AsyncStorage.setItem(USER_KEY, JSON.stringify(user)),
      ])
    } catch (error) {
      console.error('Failed to save tokens:', error)
      throw new Error('Failed to save authentication tokens')
    }
  },

  async getAccessToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(ACCESS_TOKEN_KEY)
    } catch (error) {
      console.error('Failed to get access token:', error)
      return null
    }
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(REFRESH_TOKEN_KEY)
    } catch (error) {
      console.error('Failed to get refresh token:', error)
      return null
    }
  },

  async getUser(): Promise<StoredUser | null> {
    try {
      const userStr = await AsyncStorage.getItem(USER_KEY)
      if (!userStr) return null
      return JSON.parse(userStr) as StoredUser
    } catch (error) {
      console.error('Failed to get user:', error)
      return null
    }
  },

  async clearTokens(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(ACCESS_TOKEN_KEY),
        AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
        AsyncStorage.removeItem(USER_KEY),
      ])
    } catch (error) {
      console.error('Failed to clear tokens:', error)
      throw new Error('Failed to clear authentication tokens')
    }
  },

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getAccessToken()
    return token !== null
  },
}



