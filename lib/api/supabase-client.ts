/**
 * Supabase Client for Edge Functions
 * Handles requests to Supabase Edge Functions with proper authentication
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const EDGE_FUNCTIONS_URL = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1` : ''

export interface SupabaseEdgeFunctionResponse<T> {
  data?: T
  error?: {
    message: string
    code?: string
  }
}

class SupabaseEdgeFunctionsClient {
  private baseURL: string

  constructor() {
    this.baseURL = EDGE_FUNCTIONS_URL
  }

  /**
   * Get Supabase session token from localStorage
   */
  private getSupabaseToken(): string | null {
    if (typeof window === 'undefined') return null
    
    // Check for Supabase Auth token
    const supabaseSession = localStorage.getItem('supabase.auth.token')
    if (supabaseSession) {
      try {
        const session = JSON.parse(supabaseSession)
        return session?.access_token || null
      } catch {
        return null
      }
    }
    
    // Fallback to JWT token for migration period
    return localStorage.getItem('auth_token')
  }

  /**
   * Build full URL for Edge Function
   */
  private buildURL(functionName: string): string {
    if (!this.baseURL) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured')
    }
    return `${this.baseURL}/${functionName}`
  }

  /**
   * Make request to Edge Function
   */
  private async request<T>(
    functionName: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = this.buildURL(functionName)
    const token = this.getSupabaseToken()

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    // Add Supabase headers
    if (SUPABASE_ANON_KEY) {
      headers['apikey'] = SUPABASE_ANON_KEY
    }

    // Add authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const config: RequestInit = {
      ...options,
      headers,
    }

    try {
      const response = await fetch(url, config)

      // Handle CORS preflight
      if (response.status === 204) {
        return {} as T
      }

      // Handle errors
      if (!response.ok) {
        let errorData: any = {}
        try {
          errorData = await response.json()
        } catch {
          errorData = { message: response.statusText || 'An error occurred' }
        }

        const error: any = {
          message: errorData.error || errorData.message || 'An error occurred',
          status: response.status,
        }

        throw error
      }

      // Parse JSON response
      const data = await response.json()
      return data as T
    } catch (error: any) {
      // Re-throw if already formatted
      if (error?.status) {
        throw error
      }

      // Wrap network errors
      throw {
        message: error?.message || 'Network error. Please check your connection.',
        status: 0,
      }
    }
  }

  /**
   * GET request
   */
  async get<T>(functionName: string, queryParams?: Record<string, string>): Promise<T> {
    let url = functionName
    if (queryParams && Object.keys(queryParams).length > 0) {
      const params = new URLSearchParams(queryParams)
      url = `${functionName}?${params.toString()}`
    }
    return this.request<T>(url, { method: 'GET' })
  }

  /**
   * POST request
   */
  async post<T>(functionName: string, data?: any): Promise<T> {
    return this.request<T>(functionName, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * PUT request
   */
  async put<T>(functionName: string, data?: any): Promise<T> {
    return this.request<T>(functionName, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * PATCH request
   */
  async patch<T>(functionName: string, data?: any): Promise<T> {
    return this.request<T>(functionName, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * DELETE request
   */
  async delete<T>(functionName: string): Promise<T> {
    return this.request<T>(functionName, {
      method: 'DELETE',
    })
  }

  /**
   * Upload file (multipart/form-data)
   */
  async upload<T>(
    functionName: string,
    formData: FormData
  ): Promise<T> {
    const url = this.buildURL(functionName)
    const token = this.getSupabaseToken()

    const headers: HeadersInit = {}
    if (SUPABASE_ANON_KEY) {
      headers['apikey'] = SUPABASE_ANON_KEY
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    // Don't set Content-Type for FormData - browser will set it with boundary

    const config: RequestInit = {
      method: 'POST',
      headers,
      body: formData,
    }

    try {
      const response = await fetch(url, config)

      if (!response.ok) {
        let errorData: any = {}
        try {
          errorData = await response.json()
        } catch {
          errorData = { message: response.statusText || 'An error occurred' }
        }

        throw {
          message: errorData.error || errorData.message || 'An error occurred',
          status: response.status,
        }
      }

      const data = await response.json()
      return data as T
    } catch (error: any) {
      if (error?.status) {
        throw error
      }

      throw {
        message: 'Network error. Please check your connection.',
        status: 0,
      }
    }
  }
}

// Export singleton instance
export const supabaseEdgeFunctions = new SupabaseEdgeFunctionsClient()


