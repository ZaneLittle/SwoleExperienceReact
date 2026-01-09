// AuthService handles authentication API calls
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
}

export interface RefreshRequest {
  refresh_token: string
}

export interface LoginResponse {
  data: {
    access_token: string
    refresh_token: string
    user: {
      id: string
      email: string
      created_at: string
      updated_at: string
    }
  }
}

export interface RefreshResponse {
  data: {
    access_token: string
    refresh_token: string
  }
}

export interface APIError {
  error: {
    code: string
    message: string
    details?: string
  }
}

// Get API base URL from environment or use default
const getAPIBaseURL = (): string => {
  // In production, this would come from environment variables
  // For now, default to localhost for development
  if (typeof window !== 'undefined' && window.location) {
    // Web: use same origin or configured API URL
    return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080'
  }
  // Native: use configured API URL or localhost
  return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080'
}

class AuthService {
  private baseURL: string

  constructor() {
    this.baseURL = getAPIBaseURL()
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseURL}/api/v1${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      const error = data as APIError
      // Use the message field which contains user-friendly error messages
      const errorMessage = error.error?.message || 'An error occurred'
      throw new Error(errorMessage)
    }

    return data as T
  }

  async register(request: RegisterRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  async login(request: LoginRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  async refresh(request: RefreshRequest): Promise<RefreshResponse> {
    return this.request<RefreshResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  async logout(refreshToken: string): Promise<void> {
    await this.request('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
  }

  async deleteAccount(accessToken: string): Promise<void> {
    await this.request<{ data: { message: string } }>('/auth/account', {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
  }
}

export const authService = new AuthService()

