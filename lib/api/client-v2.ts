/**
 * API Client V2 - Supports both Express Backend and Supabase Edge Functions
 * Automatically detects which backend to use based on NEXT_PUBLIC_API_URL
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''

// Detect if using Supabase Edge Functions
const IS_SUPABASE = SUPABASE_URL && API_BASE_URL.includes('supabase.co/functions/v1')
const EDGE_FUNCTIONS_URL = IS_SUPABASE ? API_BASE_URL : null
const EXPRESS_API_URL = IS_SUPABASE ? null : API_BASE_URL

export interface ApiError {
  message: string
  status: number
  errors?: Record<string, string[]>
}

class ApiClientV2 {
  private isSupabase: boolean
  private edgeFunctionsURL: string | null
  private expressURL: string | null

  constructor() {
    this.isSupabase = IS_SUPABASE
    this.edgeFunctionsURL = EDGE_FUNCTIONS_URL
    this.expressURL = EXPRESS_API_URL
  }

  /**
   * Get authentication token
   */
  private getToken(): string | null {
    if (typeof window === 'undefined') return null
    
    if (this.isSupabase) {
      // Try Supabase Auth token first
      const supabaseSession = localStorage.getItem('supabase.auth.token')
      if (supabaseSession) {
        try {
          const session = JSON.parse(supabaseSession)
          return session?.access_token || null
        } catch {
          // Fall through to JWT token
        }
      }
    }
    
    // Fallback to JWT token (for Express backend or migration period)
    return localStorage.getItem('auth_token')
  }

  /**
   * Set authentication token
   */
  setToken(token: string): void {
    if (typeof window === 'undefined') return
    
    if (this.isSupabase) {
      // Store as Supabase session (simplified)
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: token,
      }))
    }
    
    // Also store as JWT for backward compatibility
    localStorage.setItem('auth_token', token)
  }

  /**
   * Remove authentication token
   */
  removeToken(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem('auth_token')
    localStorage.removeItem('supabase.auth.token')
  }

  /**
   * Build full URL
   */
  private buildURL(endpoint: string): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
    
    if (this.isSupabase && this.edgeFunctionsURL) {
      // For Supabase, endpoint should be function name
      return `${this.edgeFunctionsURL}/${cleanEndpoint}`
    }
    
    if (this.expressURL) {
      return `${this.expressURL}/${cleanEndpoint}`
    }
    
    throw new Error('No API URL configured')
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
      message: errorData.error || errorData.message || 'An error occurred',
      status: response.status,
      errors: errorData.errors,
    }

    // Handle 401 Unauthorized
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname
        const isAuthPage = currentPath.includes('/login') || 
                          currentPath.includes('/register') || 
                          currentPath.includes('/onboarding')
        if (!isAuthPage) {
          setTimeout(() => {
            if (!window.location.pathname.includes('/login')) {
              const token = this.getToken()
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

    // Add Supabase-specific headers
    if (this.isSupabase && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      headers['apikey'] = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
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

      // Handle empty responses
      if (response.status === 204) {
        return {} as T
      }

      // Handle errors
      if (!response.ok) {
        const error = await this.handleError(response)
        throw error
      }

      // Parse JSON response
      let data: T
      try {
        data = await response.json()
      } catch (parseError) {
        console.error('[API Client] Failed to parse JSON response:', {
          url,
          status: response.status,
          parseError,
        })
        throw {
          message: 'Invalid response format from server',
          status: response.status,
        } as ApiError
      }
      
      return data
    } catch (error: any) {
      // Re-throw ApiError
      if (error && typeof error === 'object' && 'status' in error) {
        throw error
      }

      // Log and wrap network errors
      console.error('[API Client] Request failed:', {
        url,
        error,
        errorType: typeof error,
        errorMessage: error?.message,
      })

      throw {
        message: error?.message || 'Network error. Please check your connection.',
        status: 0,
        originalError: error,
      } as ApiError & { originalError?: any }
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
    
    if (this.isSupabase && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      headers['apikey'] = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    // Don't set Content-Type for FormData - browser will set it with boundary

    const config: RequestInit = {
      ...options,
      method: options?.method || 'POST',
      headers,
      body: formData,
    }

    try {
      const response = await fetch(url, config)

      if (!response.ok) {
        if (response.status === 401) {
          let errorData: any = {}
          try {
            errorData = await response.json()
          } catch {
            errorData = { message: 'Unauthorized' }
          }
          const error: ApiError = {
            message: errorData.error || errorData.message || 'Session expired. Please log in again.',
            status: 401,
            errors: errorData.errors,
          }
          throw error
        }
        
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
export const apiClientV2 = new ApiClientV2()


