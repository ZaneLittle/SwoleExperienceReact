import { authService, LoginRequest, RegisterRequest } from '../../../lib/services/AuthService'

// Mock fetch globally
global.fetch = jest.fn()

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('login', () => {
    it('sends login request with correct data', async () => {
      const mockResponse: any = {
        data: {
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token',
          user: {
            id: 'user-id',
            email: 'test@example.com',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const request: LoginRequest = {
        email: 'test@example.com',
        password: 'password123',
      }

      const result = await authService.login(request)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/auth/login'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(request),
        }),
      )
      expect(result.data.access_token).toBe('test-access-token')
      expect(result.data.refresh_token).toBe('test-refresh-token')
      expect(result.data.user.email).toBe('test@example.com')
    })

    it('throws error with message when login fails', async () => {
      const mockErrorResponse = {
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => mockErrorResponse,
      } as Response)

      const request: LoginRequest = {
        email: 'test@example.com',
        password: 'wrongpassword',
      }

      await expect(authService.login(request)).rejects.toThrow('Invalid email or password')
    })

    it('throws generic error when error response has no message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      } as Response)

      const request: LoginRequest = {
        email: 'test@example.com',
        password: 'password123',
      }

      await expect(authService.login(request)).rejects.toThrow('An error occurred')
    })
  })

  describe('register', () => {
    it('sends register request with correct data', async () => {
      const mockResponse: any = {
        data: {
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token',
          user: {
            id: 'user-id',
            email: 'newuser@example.com',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const request: RegisterRequest = {
        email: 'newuser@example.com',
        password: 'password123',
      }

      const result = await authService.register(request)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/auth/register'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(request),
        }),
      )
      expect(result.data.access_token).toBe('test-access-token')
      expect(result.data.user.email).toBe('newuser@example.com')
    })

    it('throws error with message when registration fails', async () => {
      const mockErrorResponse = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email already exists',
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => mockErrorResponse,
      } as Response)

      const request: RegisterRequest = {
        email: 'existing@example.com',
        password: 'password123',
      }

      await expect(authService.register(request)).rejects.toThrow('Email already exists')
    })
  })

  describe('deleteAccount', () => {
    it('sends delete request with authorization header', async () => {
      const mockResponse = {
        data: {
          message: 'Account deleted successfully',
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      await authService.deleteAccount('test-access-token')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/auth/account'),
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-access-token',
          }),
        }),
      )
    })

    it('throws error when delete fails', async () => {
      const mockErrorResponse = {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete account',
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => mockErrorResponse,
      } as Response)

      await expect(authService.deleteAccount('test-access-token')).rejects.toThrow(
        'Failed to delete account',
      )
    })
  })
})

