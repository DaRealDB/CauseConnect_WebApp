/**
 * API Services V2 - Routes to Supabase Edge Functions when available
 * Falls back to Express backend for functions not yet migrated
 */

import { apiClient } from './client'
import { supabaseEdgeFunctions } from './supabase-client'
import { isUsingSupabase, getSupabaseFunctionName } from './supabase-routing'
import type {
  User,
  Event,
  Post,
  CreateEventRequest,
  CreateEventResponse,
  PaginatedResponse,
  UserSettings,
  // ... add more types as needed
} from './types'

const USE_SUPABASE = isUsingSupabase()

// Helper to route requests
async function routeRequest<T>(
  expressEndpoint: string,
  supabaseFunction: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    data?: any
    queryParams?: Record<string, string>
  } = {}
): Promise<T> {
  if (USE_SUPABASE) {
    // Try Supabase Edge Function first
    try {
      if (options.method === 'GET') {
        return await supabaseEdgeFunctions.get<T>(supabaseFunction, options.queryParams)
      } else if (options.method === 'POST') {
        return await supabaseEdgeFunctions.post<T>(supabaseFunction, options.data)
      } else if (options.method === 'PUT') {
        return await supabaseEdgeFunctions.put<T>(supabaseFunction, options.data)
      } else if (options.method === 'PATCH') {
        return await supabaseEdgeFunctions.patch<T>(supabaseFunction, options.data)
      } else if (options.method === 'DELETE') {
        return await supabaseEdgeFunctions.delete<T>(supabaseFunction)
      } else {
        return await supabaseEdgeFunctions.get<T>(supabaseFunction, options.queryParams)
      }
    } catch (error: any) {
      // If function not found (404), fall back to Express
      if (error?.status === 404) {
        console.warn(`[Services V2] Supabase function ${supabaseFunction} not found, falling back to Express`)
        // Fall through to Express backend
      } else {
        throw error
      }
    }
  }
  
  // Use Express backend
  if (options.method === 'GET') {
    return await apiClient.get<T>(expressEndpoint)
  } else if (options.method === 'POST') {
    return await apiClient.post<T>(expressEndpoint, options.data)
  } else if (options.method === 'PUT') {
    return await apiClient.put<T>(expressEndpoint, options.data)
  } else if (options.method === 'PATCH') {
    return await apiClient.patch<T>(expressEndpoint, options.data)
  } else if (options.method === 'DELETE') {
    return await apiClient.delete<T>(expressEndpoint)
  } else {
    return await apiClient.get<T>(expressEndpoint)
  }
}

// ==================== USERS ====================

export const userServiceV2 = {
  /**
   * Get user profile by username
   */
  async getUserProfile(username: string): Promise<User> {
    return routeRequest<User>(
      `/users/${username}`,
      'user-profile',
      {
        method: 'GET',
        queryParams: { username },
      }
    )
  },

  /**
   * Search users
   */
  async searchUsers(query: string, limit?: number): Promise<User[]> {
    const queryParams: Record<string, string> = { query }
    if (limit) queryParams.limit = limit.toString()
    
    return routeRequest<User[]>(
      `/users/search?query=${query}${limit ? `&limit=${limit}` : ''}`,
      'user-search',
      {
        method: 'GET',
        queryParams,
      }
    )
  },
}

// ==================== EVENTS ====================

export const eventServiceV2 = {
  /**
   * Get events feed
   */
  async getEvents(params?: {
    page?: number
    limit?: number
    filter?: string
    tags?: string[]
    search?: string
    userId?: string
    excludeUser?: boolean
    requireUserTags?: boolean
    excludeUserTags?: boolean
  }): Promise<PaginatedResponse<Event>> {
    const queryParams: Record<string, string> = {}
    if (params?.page) queryParams.page = params.page.toString()
    if (params?.limit) queryParams.limit = params.limit.toString()
    if (params?.filter) queryParams.filter = params.filter
    if (params?.search) queryParams.search = params.search
    if (params?.userId) queryParams.userId = params.userId
    if (params?.excludeUser) queryParams.excludeUser = 'true'
    if (params?.requireUserTags) queryParams.requireUserTags = 'true'
    if (params?.excludeUserTags) queryParams.excludeUserTags = 'true'
    if (params?.tags && params.tags.length > 0) {
      queryParams.tags = params.tags.join(',')
    }

    // Build Express endpoint
    const expressParams = new URLSearchParams(queryParams)
    const expressEndpoint = `/events?${expressParams.toString()}`

    return routeRequest<PaginatedResponse<Event>>(
      expressEndpoint,
      'event-list',
      {
        method: 'GET',
        queryParams,
      }
    )
  },

  /**
   * Get event by ID
   */
  async getEventById(id: string | number): Promise<Event> {
    return routeRequest<Event>(
      `/events/${id}`,
      'event-detail',
      {
        method: 'GET',
        queryParams: { id: id.toString() },
      }
    )
  },
}

// ==================== SETTINGS ====================

export const settingsServiceV2 = {
  /**
   * Get user settings
   */
  async getSettings(): Promise<UserSettings> {
    return routeRequest<UserSettings>(
      '/settings',
      'settings-get',
      {
        method: 'GET',
      }
    )
  },
}

// Export all services
export const servicesV2 = {
  user: userServiceV2,
  event: eventServiceV2,
  settings: settingsServiceV2,
}


