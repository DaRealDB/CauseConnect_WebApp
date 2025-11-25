/**
 * API Client for CauseConnect
 * Handles all HTTP requests with JWT token management
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export interface ApiError {
  message: string
  status: number
  errors?: Record<string, string[]>
}

class ApiClient {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  /**
   * Get JWT token from localStorage
   */
  private getToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('auth_token')
  }

  /**
   * Set JWT token in localStorage
   */
  setToken(token: string): void {
    if (typeof window === 'undefined') return
    localStorage.setItem('auth_token', token)
  }

  /**
   * Remove JWT token from localStorage
   */
  removeToken(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem('auth_token')
  }

  /**
   * Build full URL
   */
  private buildURL(endpoint: string): string {
    // Remove leading slash if present to avoid double slashes
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
    return `${this.baseURL}/${cleanEndpoint}`
  }

  /**
   * Handle API errors
   */
  private async handleError(response: Response): Promise<ApiError> {
    let errorData: any = {}
    try {
      errorData = await response.json()
    } catch {
      errorData = { message: response.statusText || 'An error occurred' }
    }

    const error: ApiError = {
      message: errorData.message || 'An error occurred',
      status: response.status,
      errors: errorData.errors,
    }

    // Handle 401 Unauthorized - token expired or invalid
    // Don't automatically remove token here - let the AuthContext handle it
    // This prevents race conditions and double-clearing of tokens during page refresh
    // The AuthContext will check the error status and handle token removal appropriately
    if (response.status === 401) {
      // Only redirect if not already on auth pages
      // Let AuthContext handle token removal to prevent race conditions
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname
        const isAuthPage = currentPath.includes('/login') || 
                          currentPath.includes('/register') || 
                          currentPath.includes('/onboarding')
        if (!isAuthPage) {
          // Wait a bit for AuthContext to handle the error and remove token
          // Then redirect if still not on login page
          setTimeout(() => {
            if (!window.location.pathname.includes('/login')) {
              // Check localStorage directly to see if token was removed by AuthContext
              const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
              if (!token) {
                window.location.href = '/login'
              }
            }
          }, 300)
        }
      }
    }

    return error
  }

  /**
   * Make HTTP request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = this.buildURL(endpoint)
    const token = this.getToken()

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    // Add Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const config: RequestInit = {
      ...options,
      headers,
    }

    try {
      const response = await fetch(url, config)

      // Handle empty responses (204 No Content)
      if (response.status === 204) {
        return {} as T
      }

      // Handle errors
      if (!response.ok) {
        const error = await this.handleError(response)
        throw error
      }

      // Parse JSON response
      const data = await response.json()
      return data as T
    } catch (error) {
      // Re-throw ApiError
      if (error && typeof error === 'object' && 'status' in error) {
        throw error
      }

      // Log the actual error for debugging
      if (process.env.NODE_ENV === 'development') {
        console.error('API Request failed:', {
          url,
          error: error instanceof Error ? error.message : error,
        })
      }

      // Handle network errors - status 0 means network error
      // Don't let these trigger auth token removal
      throw {
        message: `Network error. Please check your connection.`,
        status: 0,
      } as ApiError
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET',
    })
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
    })
  }

  /**
   * Upload file (multipart/form-data)
   */
  async upload<T>(endpoint: string, formData: FormData, options?: RequestInit): Promise<T> {
    const url = this.buildURL(endpoint)
    const token = this.getToken()

    const headers: HeadersInit = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    // Don't set Content-Type for FormData - browser will set it with boundary

    const config: RequestInit = {
      ...options,
      method: 'POST',
      headers,
      body: formData,
    }

    try {
      const response = await fetch(url, config)

      if (!response.ok) {
        // For upload errors, handle 401 more gracefully
        if (response.status === 401) {
          // Don't immediately remove token - let the component handle it
          // This prevents logout during upload operations
          let errorData: any = {}
          try {
            errorData = await response.json()
          } catch {
            errorData = { message: 'Unauthorized' }
          }
          const error: ApiError = {
            message: errorData.message || 'Session expired. Please log in again.',
            status: 401,
            errors: errorData.errors,
          }
          throw error
        }
        
        // For other errors, use standard error handling
        const error = await this.handleError(response)
        throw error
      }

      const data = await response.json()
      return data as T
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) {
        throw error
      }

      throw {
        message: 'Network error. Please check your connection.',
        status: 0,
      } as ApiError
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL)


