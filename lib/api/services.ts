/**
 * API Service Functions
 * Organized by feature module
 * Routes to Supabase Edge Functions when available, falls back to Express backend
 */

import { apiClient } from './client'
import { supabaseEdgeFunctions } from './supabase-client'
import { isUsingSupabase } from './supabase-routing'

const IS_SUPABASE = isUsingSupabase()

/**
 * Route request to Supabase Edge Function or Express backend
 */
async function routeRequest<T>(
  supabaseFunction: string | null,
  expressEndpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    data?: any
    queryParams?: Record<string, string>
    useExpress?: boolean // Force Express backend
    formData?: FormData // For file uploads
  } = {}
): Promise<T> {
  // Try Supabase first if enabled and function exists
  if (IS_SUPABASE && supabaseFunction && !options.useExpress) {
    try {
      if (options.formData) {
        // Handle file uploads
        return await supabaseEdgeFunctions.upload<T>(supabaseFunction, options.formData)
      } else if (options.method === 'GET') {
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
        console.warn(`[Services] Supabase function ${supabaseFunction} not found, falling back to Express`)
      } else {
        // Re-throw other errors
        throw error
      }
    }
  }

  // Fall back to Express backend
  if (options.formData) {
    return await apiClient.upload<T>(expressEndpoint, options.formData)
  } else if (options.method === 'GET') {
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
import type {
  User,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  Event,
  CreateEventRequest,
  CreateEventResponse,
  Post,
  CreatePostRequest,
  CreatePostResponse,
  Comment,
  CreateCommentRequest,
  CreateCommentResponse,
  Donation,
  CreateDonationRequest,
  CreateDonationResponse,
  Notification,
  Chat,
  Message,
  SendMessageRequest,
  UserSettings,
  Squad,
  CreateSquadRequest,
  SquadPost,
  SquadComment,
  SquadMember,
  PaginatedResponse,
  ExploreContent,
  PaymentMethod,
  SetupIntentResponse,
  PaymentIntentResponse,
  RecurringDonation,
  DonationHistoryItem,
} from './types'

// ==================== AUTH ====================

export const authService = {
  /**
   * Login user
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await routeRequest<LoginResponse>(
      'auth-login',
      '/auth/login',
      { method: 'POST', data: credentials }
    )
    // Store token
    apiClient.setToken(response.token)
    return response
  },

  /**
   * Register new user
   */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const response = await routeRequest<RegisterResponse>(
      'auth-register',
      '/auth/register',
      { method: 'POST', data }
    )
    // Store token
    apiClient.setToken(response.token)
    return response
  },

  /**
   * Logout user
   */
  logout(): void {
    apiClient.removeToken()
  },

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    const response = await routeRequest<{ user: User }>(
      'auth-me',
      '/auth/me',
      { method: 'GET' }
    )
    // Handle both formats
    return 'user' in response ? response.user : response as User
  },

  /**
   * Refresh token (if your backend supports it)
   */
  async refreshToken(): Promise<{ token: string }> {
    const refreshToken = localStorage.getItem('refresh_token')
    const response = await routeRequest<{ token: string }>(
      'auth-refresh',
      '/auth/refresh',
      { method: 'POST', data: { refreshToken } }
    )
    apiClient.setToken(response.token)
    return response
  },

  /**
   * Send verification code to email
   */
  async sendVerificationCode(email: string, type: 'email_verification' | 'password_reset' = 'email_verification'): Promise<{ success: boolean; message: string }> {
    return routeRequest<{ success: boolean; message: string }>(
      'auth-send-verification',
      '/auth/send-verification',
      { method: 'POST', data: { email, type } }
    )
  },

  /**
   * Verify email with OTP code
   */
  async verifyEmail(email: string, otp: string): Promise<{ success: boolean; message: string }> {
    return routeRequest<{ success: boolean; message: string }>(
      'auth-verify-email',
      '/auth/verify-email',
      { method: 'POST', data: { email, otp } }
    )
  },

  /**
   * Send password reset code
   */
  async sendPasswordResetCode(email: string): Promise<{ success: boolean; message: string }> {
    return routeRequest<{ success: boolean; message: string }>(
      'auth-forgot-password',
      '/auth/forgot-password',
      { method: 'POST', data: { email } }
    )
  },

  /**
   * Verify password reset code
   */
  async verifyPasswordResetCode(email: string, otp: string): Promise<{ success: boolean; message: string }> {
    return routeRequest<{ success: boolean; message: string }>(
      'auth-verify-reset',
      '/auth/verify-reset',
      { method: 'POST', data: { email, otp } }
    )
  },

  /**
   * Reset password after verification
   */
  async resetPassword(email: string, otp: string, newPassword: string, confirmPassword: string): Promise<{ success: boolean; message: string }> {
    return routeRequest<{ success: boolean; message: string }>(
      'auth-reset-password',
      '/auth/reset-password',
      { method: 'POST', data: { email, otp, newPassword, confirmPassword } }
    )
  },
}

// ==================== USERS ====================

export const userService = {
  /**
   * Get user profile by username
   */
  async getUserProfile(username: string): Promise<User> {
    return routeRequest<User>(
      'user-profile',
      `/users/${username}`,
      { method: 'GET', queryParams: { username } }
    )
  },

  /**
   * Get user activity (supported events, awards, follows)
   */
  async getUserActivity(username: string, limit?: number): Promise<Array<{
    type: 'support' | 'award' | 'follow'
    id: string
    title: string
    description: string
    timestamp: string
  }>> {
    const queryParams = new URLSearchParams()
    if (limit) queryParams.append('limit', limit.toString())
    return apiClient.get(`/users/${username}/activity?${queryParams.toString()}`)
  },

  /**
   * Update user profile
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    return routeRequest<User>(
      'user-update',
      '/users/profile',
      { method: 'PUT', data }
    )
  },

  /**
   * Upload profile avatar
   */
  async uploadAvatar(file: File): Promise<{ avatar: string }> {
    const formData = new FormData()
    formData.append('avatar', file)
    return apiClient.upload<{ avatar: string }>('/users/avatar', formData)
  },

  /**
   * Upload cover image
   */
  async uploadCoverImage(file: File): Promise<{ coverImage: string }> {
    const formData = new FormData()
    formData.append('coverImage', file)
    return apiClient.upload<{ coverImage: string }>('/users/cover', formData)
  },

  /**
   * Toggle follow status (follows if not following, unfollows if following)
   */
  async toggleFollow(userId: string | number): Promise<{ isFollowing: boolean }> {
    return routeRequest<{ isFollowing: boolean }>(
      'user-follow',
      `/users/${userId}/follow`,
      { method: 'POST', data: { userId: userId.toString() } }
    )
  },

  /**
   * Check if current user is following another user
   */
  async isFollowing(userId: string | number): Promise<{ isFollowing: boolean }> {
    return apiClient.get<{ isFollowing: boolean }>(`/users/${userId}/isFollowing`)
  },

  /**
   * Search users
   */
  async searchUsers(query: string, limit?: number): Promise<User[]> {
    const queryParams: Record<string, string> = { query }
    if (limit) queryParams.limit = limit.toString()
    return routeRequest<User[]>(
      'user-search',
      `/users/search?query=${query}${limit ? `&limit=${limit}` : ''}`,
      { method: 'GET', queryParams }
    )
  },

  /**
   * Follow user (legacy - use toggleFollow instead)
   */
  async followUser(userId: string | number): Promise<void> {
    return apiClient.post(`/users/${userId}/follow`)
  },

  /**
   * Unfollow user (legacy - use toggleFollow instead)
   */
  async unfollowUser(userId: string | number): Promise<void> {
    return apiClient.delete(`/users/${userId}/follow`)
  },

  /**
   * Get users that the current user is following
   */
  async getFollowingUsers(params?: {
    page?: number
    limit?: number
  }): Promise<PaginatedResponse<User>> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    const query = queryParams.toString()
    return apiClient.get<PaginatedResponse<User>>(`/users/following${query ? `?${query}` : ''}`)
  },

  /**
   * Update user preferences (interest tags)
   */
  async updatePreferences(tags: string[]): Promise<{ success: boolean; tags: string[] }> {
    return apiClient.post<{ success: boolean; tags: string[] }>('/users/preferences', { tags })
  },

  /**
   * Get user preferences
   */
  async getPreferences(): Promise<{ tags: string[] }> {
    return apiClient.get<{ tags: string[] }>('/users/preferences')
  },

  /**
   * Change user password
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<{ success: boolean }> {
    return apiClient.post<{ success: boolean }>('/users/change-password', { oldPassword, newPassword })
  },

  /**
   * Get user's causes with impact stats (grouped by event/post/recipient)
   */
  async getMyCauses(): Promise<{
    causes: Array<{
      id: string
      type: 'event' | 'post' | 'recipient'
      title: string
      description?: string
      image?: string
      organization?: {
        id: string
        username: string
        name: string
        avatar?: string
        verified: boolean
      }
      totalDonated: number
      donationCount: number
      firstDonationDate: string
      lastDonationDate: string
      goalAmount?: number
      raisedAmount?: number
      location?: string
      targetDate?: string
    }>
    totalCauses: number
    totalDonated: number
    totalDonations: number
  }> {
    return apiClient.get('/users/me/my-causes')
  },
}

// ==================== EVENTS ====================

export const eventService = {
  /**
   * Get events feed
   */
  async getEvents(params?: {
    page?: number
    limit?: number
    filter?: 'all' | 'events' | 'updates' | 'bookmarked'
    tags?: string[]
    search?: string
    userId?: string // Filter by user who created the events
    excludeUser?: boolean // Exclude user's own posts
    requireUserTags?: boolean // Enforce filtering by user's selected tags (for feed)
    excludeUserTags?: boolean // For explore: show events with tags NOT in user's interests
  }): Promise<PaginatedResponse<Event>> {
    // If filter is bookmarked, use the bookmarked endpoint
    if (params?.filter === 'bookmarked') {
      const queryParams: Record<string, string> = {}
      if (params?.page) queryParams.page = params.page.toString()
      if (params?.limit) queryParams.limit = params.limit.toString()
      return routeRequest<PaginatedResponse<Event>>(
        'event-bookmarked',
        `/events/bookmarked`,
        { method: 'GET', queryParams }
      )
    }

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

    const expressParams = new URLSearchParams(queryParams)
    return routeRequest<PaginatedResponse<Event>>(
      'event-list',
      `/events?${expressParams.toString()}`,
      { method: 'GET', queryParams }
    )
  },

  /**
   * Get event by ID
   */
  async getEventById(id: string | number): Promise<Event> {
    return routeRequest<Event>(
      'event-detail',
      `/events/${id}`,
      { method: 'GET', queryParams: { id: id.toString() } }
    )
  },

  /**
   * Create new event
   */
  async createEvent(data: CreateEventRequest): Promise<CreateEventResponse> {
    // If images are provided, use FormData
    if (data.images && data.images.length > 0) {
      const formData = new FormData()
      formData.append('title', data.title)
      formData.append('description', data.description)
      if (data.location) formData.append('location', data.location)
      if (data.targetDate) formData.append('targetDate', data.targetDate)
      if (data.goalAmount) formData.append('goalAmount', data.goalAmount.toString())
      data.tags.forEach((tag) => formData.append('tags', tag))
      data.images.forEach((image) => formData.append('image', image))

      // Try Supabase first
      if (IS_SUPABASE) {
        try {
          return await supabaseEdgeFunctions.upload<CreateEventResponse>('event-create', formData)
        } catch (error: any) {
          if (error?.status !== 404) throw error
        }
      }

      return apiClient.upload<CreateEventResponse>('/events', formData)
    }

    // Otherwise use JSON
    return routeRequest<CreateEventResponse>(
      'event-create',
      '/events',
      { method: 'POST', data }
    )
  },

  /**
   * Support an event
   */
  async supportEvent(eventId: string | number): Promise<void> {
    return routeRequest<void>(
      'event-support',
      `/events/${eventId}/support`,
      { method: 'POST', data: { eventId: eventId.toString() } }
    )
  },

  /**
   * Pass (unsupport) an event
   */
  async passEvent(eventId: string | number): Promise<void> {
    return apiClient.delete(`/events/${eventId}/support`)
  },

  /**
   * Bookmark an event
   */
  async bookmarkEvent(eventId: string | number): Promise<void> {
    return routeRequest<void>(
      'event-bookmark',
      `/events/${eventId}/bookmark`,
      { method: 'POST', data: { eventId: eventId.toString() } }
    )
  },

  /**
   * Unbookmark an event
   */
  async unbookmarkEvent(eventId: string | number): Promise<void> {
    return routeRequest<void>(
      'event-unbookmark',
      `/events/${eventId}/bookmark`,
      { method: 'DELETE', data: { eventId: eventId.toString() } }
    )
  },

  /**
   * Update an event
   */
  async updateEvent(eventId: string | number, data: Partial<Event>): Promise<Event> {
    return apiClient.put<Event>(`/events/${eventId}`, data)
  },

  /**
   * Delete an event
   */
  async deleteEvent(eventId: string | number): Promise<void> {
    return apiClient.delete(`/events/${eventId}`)
  },

  /**
   * Get event participants
   */
  async getEventParticipants(eventId: string | number, params?: {
    page?: number
    limit?: number
  }): Promise<PaginatedResponse<any>> {
    const queryParams: Record<string, string> = { eventId: eventId.toString() }
    if (params?.page) queryParams.page = params.page.toString()
    if (params?.limit) queryParams.limit = params.limit.toString()

    const expressParams = new URLSearchParams({ ...queryParams })
    return routeRequest<PaginatedResponse<any>>(
      'event-participants',
      `/events/${eventId}/participants?${expressParams.toString()}`,
      { method: 'GET', queryParams }
    )
  },

  /**
   * Get event analytics
   */
  async getEventAnalytics(eventId: string | number): Promise<any> {
    return routeRequest<any>(
      'event-analytics',
      `/events/${eventId}/analytics`,
      { method: 'GET', queryParams: { eventId: eventId.toString() } }
    )
  },
}

// ==================== POSTS ====================

export const postService = {
  /**
   * Get posts feed
   */
  async getPosts(params?: {
    page?: number
    limit?: number
    userId?: number | string
    tags?: string[]
    requireUserTags?: boolean // Enforce filtering by user's selected tags (for feed)
    excludeUserTags?: boolean // For explore: exclude user's tags
  }): Promise<PaginatedResponse<Post>> {
    const queryParams: Record<string, string> = {}
    if (params?.page) queryParams.page = params.page.toString()
    if (params?.limit) queryParams.limit = params.limit.toString()
    if (params?.userId) queryParams.userId = params.userId.toString()
    if (params?.requireUserTags) queryParams.requireUserTags = 'true'
    if (params?.excludeUserTags) queryParams.excludeUserTags = 'true'
    if (params?.tags && params.tags.length > 0) {
      queryParams.tags = params.tags.join(',')
    }

    const expressParams = new URLSearchParams(queryParams)
    return routeRequest<PaginatedResponse<Post>>(
      'post-list',
      `/posts?${expressParams.toString()}`,
      { method: 'GET', queryParams }
    )
  },

  /**
   * Create new post
   */
  async createPost(data: CreatePostRequest): Promise<CreatePostResponse> {
    if (data.image) {
      const formData = new FormData()
      formData.append('content', data.content)
      formData.append('image', data.image)
      // Append tags as JSON string for FormData
      if (data.tags && data.tags.length > 0) {
        formData.append('tags', JSON.stringify(data.tags))
      }
      return apiClient.upload<CreatePostResponse>('/posts', formData)
    }

    return apiClient.post<CreatePostResponse>('/posts', { 
      content: data.content,
      tags: data.tags || []
    })
  },

  /**
   * Like a post
   */
  async likePost(postId: number | string): Promise<void> {
    return routeRequest<void>(
      'post-like',
      `/posts/${postId}/like`,
      { method: 'POST', data: { postId: postId.toString() } }
    )
  },

  /**
   * Unlike a post
   */
  async unlikePost(postId: number | string): Promise<void> {
    return routeRequest<void>(
      'post-unlike',
      `/posts/${postId}/like`,
      { method: 'DELETE', data: { postId: postId.toString() } }
    )
  },

  /**
   * Bookmark a post
   */
  async bookmarkPost(postId: number | string): Promise<void> {
    return routeRequest<void>(
      'post-bookmark',
      `/posts/${postId}/bookmark`,
      { method: 'POST', data: { postId: postId.toString() } }
    )
  },

  /**
   * Unbookmark a post
   */
  async unbookmarkPost(postId: number | string): Promise<void> {
    return routeRequest<void>(
      'post-unbookmark',
      `/posts/${postId}/bookmark`,
      { method: 'DELETE', data: { postId: postId.toString() } }
    )
  },

  /**
   * Get bookmarked posts
   */
  async getBookmarkedPosts(params?: {
    page?: number
    limit?: number
  }): Promise<PaginatedResponse<Post>> {
    const queryParams: Record<string, string> = {}
    if (params?.page) queryParams.page = params.page.toString()
    if (params?.limit) queryParams.limit = params.limit.toString()

    const expressParams = new URLSearchParams(queryParams)
    return routeRequest<PaginatedResponse<Post>>(
      'post-bookmarked',
      `/posts/bookmarked?${expressParams.toString()}`,
      { method: 'GET', queryParams }
    )
  },

  /**
   * Participate in a post
   */
  async participateInPost(postId: number | string): Promise<{ isParticipating: boolean }> {
    return apiClient.post<{ isParticipating: boolean }>(`/posts/${postId}/participate`)
  },

  /**
   * Get post participants
   */
  async getPostParticipants(postId: number | string, params?: {
    page?: number
    limit?: number
  }): Promise<PaginatedResponse<any>> {
    const queryParams: Record<string, string> = { postId: postId.toString() }
    if (params?.page) queryParams.page = params.page.toString()
    if (params?.limit) queryParams.limit = params.limit.toString()

    const expressParams = new URLSearchParams({ ...queryParams })
    return routeRequest<PaginatedResponse<any>>(
      'post-participants',
      `/posts/${postId}/participants?${expressParams.toString()}`,
      { method: 'GET', queryParams }
    )
  },
}

// ==================== COMMENTS ====================

export const commentService = {
  /**
   * Get comments for an event/post
   */
  async getComments(eventId: string | number): Promise<Comment[]> {
    return routeRequest<Comment[]>(
      'comment-list',
      `/comments/events/${eventId}/comments`,
      { method: 'GET', queryParams: { eventId: eventId.toString() } }
    )
  },

  /**
   * Create a comment
   */
  async createComment(eventId: string | number, data: CreateCommentRequest): Promise<CreateCommentResponse> {
    return routeRequest<CreateCommentResponse>(
      'comment-create',
      `/comments/events/${eventId}/comments`,
      { method: 'POST', data: { ...data, eventId: eventId.toString() } }
    )
  },

  /**
   * Like a comment
   */
  async likeComment(commentId: string | number): Promise<void> {
    return routeRequest<void>(
      'comment-like',
      `/comments/${commentId}/like`,
      { method: 'POST', data: { commentId: commentId.toString() } }
    )
  },

  /**
   * Dislike a comment
   */
  async dislikeComment(commentId: string | number): Promise<void> {
    return apiClient.post(`/comments/${commentId}/dislike`)
  },

  /**
   * Remove like/dislike from comment
   */
  async removeCommentReaction(commentId: string | number): Promise<void> {
    return apiClient.delete(`/comments/${commentId}/reaction`)
  },

  /**
   * Award a comment
   */
  async awardComment(commentId: string | number): Promise<void> {
    return apiClient.post(`/comments/${commentId}/award`)
  },

  /**
   * Save a comment
   */
  async saveComment(commentId: string | number): Promise<void> {
    return apiClient.post(`/comments/${commentId}/save`)
  },

  /**
   * Delete a comment
   */
  async deleteComment(commentId: string | number): Promise<void> {
    return apiClient.delete(`/comments/${commentId}`)
  },
}

// ==================== DONATIONS ====================

export const donationService = {
  /**
   * Create a donation
   */
  async createDonation(data: CreateDonationRequest): Promise<CreateDonationResponse> {
    return routeRequest<CreateDonationResponse>(
      'donation-create',
      '/donations',
      { method: 'POST', data }
    )
  },

  /**
   * Get user's donation history
   */
  async getDonations(params?: {
    page?: number
    limit?: number
    eventId?: number
  }): Promise<PaginatedResponse<Donation>> {
    const queryParams: Record<string, string> = {}
    if (params?.page) queryParams.page = params.page.toString()
    if (params?.limit) queryParams.limit = params.limit.toString()
    if (params?.eventId) queryParams.eventId = params.eventId.toString()

    const expressParams = new URLSearchParams(queryParams)
    return routeRequest<PaginatedResponse<Donation>>(
      'donation-list',
      `/donations?${expressParams.toString()}`,
      { method: 'GET', queryParams }
    )
  },
}

// ==================== NOTIFICATIONS ====================

export const notificationService = {
  /**
   * Get notifications
   */
  async getNotifications(params?: {
    page?: number
    limit?: number
    type?: string
  }): Promise<PaginatedResponse<Notification>> {
    const queryParams: Record<string, string> = {}
    if (params?.page) queryParams.page = params.page.toString()
    if (params?.limit) queryParams.limit = params.limit.toString()
    if (params?.type) queryParams.type = params.type

    const expressParams = new URLSearchParams(queryParams)
    return routeRequest<PaginatedResponse<Notification>>(
      'notification-list',
      `/notifications?${expressParams.toString()}`,
      { method: 'GET', queryParams }
    )
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    return routeRequest<void>(
      'notification-read',
      `/notifications/${notificationId}/read`,
      { method: 'PATCH', queryParams: { id: notificationId } }
    )
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    return routeRequest<void>(
      'notification-read-all',
      '/notifications/read-all',
      { method: 'PATCH' }
    )
  },

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    return apiClient.delete(`/notifications/${notificationId}`)
  },

  /**
   * Get unread count
   */
  async getUnreadCount(): Promise<{ count: number }> {
    return routeRequest<{ count: number }>(
      'notification-unread-count',
      '/notifications/unread-count',
      { method: 'GET' }
    )
  },
}

// ==================== CHAT ====================

export const chatService = {
  /**
   * Get chat conversations
   */
  async getChats(): Promise<Chat[]> {
    return apiClient.get<Chat[]>('/chat/conversations')
  },

  /**
   * Get messages for a chat
   */
  async getMessages(chatId: string): Promise<Message[]> {
    return apiClient.get<Message[]>(`/chat/conversations/${chatId}/messages`)
  },

  /**
   * Send a message
   */
  async sendMessage(data: SendMessageRequest): Promise<Message> {
    return apiClient.post<Message>(`/chat/conversations/${data.chatId}/messages`, {
      content: data.content,
    })
  },
}

// ==================== SETTINGS ====================

export const settingsService = {
  /**
   * Get user settings
   */
  async getSettings(): Promise<UserSettings> {
    return routeRequest<UserSettings>(
      'settings-get',
      '/settings',
      { method: 'GET' }
    )
  },

  /**
   * Update user settings
   */
  async updateSettings(data: Partial<UserSettings>): Promise<UserSettings> {
    return routeRequest<UserSettings>(
      'settings-update',
      '/settings',
      { method: 'PUT', data }
    )
  },

  /**
   * Get login activity (sessions)
   */
  async getLoginActivity(): Promise<Array<{
    id: string
    device: string
    location: string
    timeAgo: string
    isCurrentSession: boolean
    createdAt: string
  }>> {
    return routeRequest<Array<{
      id: string
      device: string
      location: string
      timeAgo: string
      isCurrentSession: boolean
      createdAt: string
    }>>(
      'settings-login-activity',
      '/settings/login-activity',
      { method: 'GET' }
    )
  },

  /**
   * Revoke a session
   */
  async revokeSession(tokenId: string): Promise<void> {
    return routeRequest<void>(
      'settings-revoke-session',
      `/settings/login-activity/${tokenId}`,
      { method: 'DELETE', data: { tokenId } }
    )
  },

  /**
   * Get blocked users
   */
  async getBlockedUsers(): Promise<Array<{
    id: string
    userId: string
    username: string
    name: string
    avatar?: string
    verified: boolean
    blockedAt: string
  }>> {
    return apiClient.get('/settings/blocked-users')
  },

  /**
   * Block a user
   */
  async blockUser(userId: string): Promise<{
    id: string
    userId: string
    username: string
    name: string
    avatar?: string
    blockedAt: string
  }> {
    return apiClient.post(`/settings/block-user/${userId}`)
  },

  /**
   * Unblock a user
   */
  async unblockUser(userId: string): Promise<void> {
    return apiClient.delete(`/settings/block-user/${userId}`)
  },

  /**
   * Export user data
   */
  async exportUserData(): Promise<any> {
    return apiClient.get('/settings/export-data')
  },

  /**
   * Get user impact statistics
   */
  async getImpactStats(): Promise<{
    totalDonated: number
    causesSupported: number
    donationCount: number
  }> {
    return apiClient.get('/settings/impact')
  },
}

// ==================== SQUADS ====================

export const squadService = {
  /**
   * Get user's squads
   */
  async getSquads(): Promise<Squad[]> {
    return routeRequest<Squad[]>(
      'squad-list',
      '/squads',
      { method: 'GET' }
    )
  },

  /**
   * Search squads
   */
  async searchSquads(query: string, limit?: number): Promise<Squad[]> {
    const queryParams = new URLSearchParams()
    queryParams.append('query', query)
    if (limit) queryParams.append('limit', limit.toString())
    return apiClient.get<Squad[]>(`/squads/search?${queryParams.toString()}`)
  },

  /**
   * Get squad by ID
   */
  async getSquadById(squadId: string | number): Promise<Squad> {
    return routeRequest<Squad>(
      'squad-detail',
      `/squads/${squadId}`,
      { method: 'GET', queryParams: { id: squadId.toString() } }
    )
  },

  /**
   * Create a squad
   */
  async createSquad(data: CreateSquadRequest): Promise<Squad> {
    if (data.avatar) {
      const formData = new FormData()
      formData.append('name', data.name)
      if (data.description) formData.append('description', data.description)
      formData.append('avatar', data.avatar)
      return apiClient.upload<Squad>('/squads', formData)
    }

    return apiClient.post<Squad>('/squads', data)
  },

  /**
   * Join a squad
   */
  async joinSquad(squadId: string | number): Promise<void> {
    return routeRequest<void>(
      'squad-join',
      `/squads/${squadId}/join`,
      { method: 'POST', queryParams: { id: squadId.toString() } }
    )
  },

  /**
   * Leave a squad
   */
  async leaveSquad(squadId: string | number): Promise<void> {
    return routeRequest<void>(
      'squad-leave',
      `/squads/${squadId}/join`,
      { method: 'DELETE', queryParams: { id: squadId.toString() } }
    )
  },

  /**
   * Update squad (admin only)
   */
  async updateSquad(squadId: string | number, data: { name?: string; description?: string; avatar?: File }): Promise<Squad> {
    if (data.avatar) {
      const formData = new FormData()
      if (data.name) formData.append('name', data.name)
      if (data.description !== undefined) formData.append('description', data.description || '')
      formData.append('avatar', data.avatar)
      return apiClient.upload<Squad>(`/squads/${squadId}`, formData, { method: 'PATCH' })
    }

    return apiClient.patch<Squad>(`/squads/${squadId}`, {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
    })
  },

  /**
   * Delete squad (admin only)
   */
  async deleteSquad(squadId: string | number): Promise<void> {
    return apiClient.delete(`/squads/${squadId}`)
  },

  /**
   * Remove member from squad (admin only)
   */
  async removeMember(squadId: string | number, memberId: string | number): Promise<void> {
    return apiClient.delete(`/squads/${squadId}/members/${memberId}`)
  },

  /**
   * Change member role (admin only)
   */
  async changeMemberRole(squadId: string | number, memberId: string | number, role: 'admin' | 'moderator' | 'member'): Promise<void> {
    return apiClient.patch(`/squads/${squadId}/members/${memberId}/role`, { role })
  },

  /**
   * Get squad members
   */
  async getSquadMembers(squadId: string | number, page?: number, limit?: number): Promise<PaginatedResponse<SquadMember>> {
    const queryParams = new URLSearchParams()
    if (page) queryParams.append('page', page.toString())
    if (limit) queryParams.append('limit', limit.toString())
    const query = queryParams.toString()
    return apiClient.get<PaginatedResponse<SquadMember>>(`/squads/${squadId}/members${query ? `?${query}` : ''}`)
  },

  /**
   * Get squad posts
   */
  async getSquadPosts(squadId: string | number, page?: number, limit?: number): Promise<PaginatedResponse<SquadPost>> {
    const queryParams: Record<string, string> = { id: squadId.toString() }
    if (page) queryParams.page = page.toString()
    if (limit) queryParams.limit = limit.toString()

    const expressParams = new URLSearchParams({ page: page?.toString() || '1', limit: limit?.toString() || '10' })
    return routeRequest<PaginatedResponse<SquadPost>>(
      'squad-posts',
      `/squads/${squadId}/posts?${expressParams.toString()}`,
      { method: 'GET', queryParams }
    )
  },

  /**
   * Create squad post
   */
  async createSquadPost(squadId: string | number, data: { content: string; image?: File }): Promise<SquadPost> {
    if (data.image) {
      const formData = new FormData()
      formData.append('squadId', squadId.toString())
      formData.append('content', data.content)
      formData.append('image', data.image)

      // Try Supabase first
      if (IS_SUPABASE) {
        try {
          return await supabaseEdgeFunctions.upload<SquadPost>('squad-post-create', formData)
        } catch (error: any) {
          if (error?.status !== 404) throw error
        }
      }

      return apiClient.upload<SquadPost>(`/squads/${squadId}/posts`, formData)
    }

    return routeRequest<SquadPost>(
      'squad-post-create',
      `/squads/${squadId}/posts`,
      { method: 'POST', data: { squadId: squadId.toString(), content: data.content } }
    )
  },

  /**
   * Update squad post
   */
  async updateSquadPost(squadId: string | number, postId: string, data: { content: string }): Promise<SquadPost> {
    return apiClient.patch<SquadPost>(`/squads/${squadId}/posts/${postId}`, data)
  },

  /**
   * Delete squad post
   */
  async deleteSquadPost(squadId: string | number, postId: string): Promise<void> {
    return apiClient.delete(`/squads/${squadId}/posts/${postId}`)
  },

  /**
   * Pin/unpin squad post
   */
  async pinSquadPost(squadId: string | number, postId: string, isPinned: boolean): Promise<void> {
    return apiClient.patch(`/squads/${squadId}/posts/${postId}/pin`, { isPinned })
  },

  /**
   * Get squad post comments
   */
  async getSquadPostComments(squadId: string | number, postId: string, page?: number, limit?: number): Promise<PaginatedResponse<SquadComment>> {
    const queryParams = new URLSearchParams()
    if (page) queryParams.append('page', page.toString())
    if (limit) queryParams.append('limit', limit.toString())
    const query = queryParams.toString()
    return apiClient.get<PaginatedResponse<SquadComment>>(`/squads/${squadId}/posts/${postId}/comments${query ? `?${query}` : ''}`)
  },

  /**
   * Create squad comment
   */
  async createSquadComment(squadId: string | number, postId: string, data: { content: string; parentId?: string }): Promise<SquadComment> {
    return apiClient.post<SquadComment>(`/squads/${squadId}/posts/${postId}/comments`, data)
  },

  /**
   * Update squad comment
   */
  async updateSquadComment(squadId: string | number, postId: string, commentId: string, data: { content: string }): Promise<SquadComment> {
    return apiClient.patch<SquadComment>(`/squads/${squadId}/posts/${postId}/comments/${commentId}`, data)
  },

  /**
   * Delete squad comment
   */
  async deleteSquadComment(squadId: string | number, postId: string, commentId: string): Promise<void> {
    return apiClient.delete(`/squads/${squadId}/posts/${postId}/comments/${commentId}`)
  },

  /**
   * Toggle reaction on post or comment
   */
  async toggleReaction(squadId: string | number, data: { postId?: string; commentId?: string; type?: string }): Promise<{ reaction: any; action: string }> {
    return apiClient.post(`/squads/${squadId}/reactions`, {
      postId: data.postId,
      commentId: data.commentId,
      type: data.type || 'like',
    })
  },
}

// ==================== EXPLORE ====================

export const exploreService = {
  /**
   * Get explore content (all, groups, posts, or events)
   */
  async getExploreContent(params?: {
    filter?: 'all' | 'groups' | 'posts' | 'events'
    page?: number
    limit?: number
    excludeUserTags?: boolean
  }): Promise<PaginatedResponse<ExploreContent>> {
    const queryParams = new URLSearchParams()
    if (params?.filter) queryParams.append('filter', params.filter)
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.excludeUserTags) queryParams.append('excludeUserTags', 'true')
    
    const query = queryParams.toString()
    return apiClient.get<PaginatedResponse<ExploreContent>>(`/explore${query ? `?${query}` : ''}`)
  },
}

// ==================== CUSTOM FEEDS ====================

export interface CustomFeed {
  id: string
  name: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface CreateCustomFeedRequest {
  name: string
  tags: string[]
}

export const customFeedService = {
  /**
   * Create a custom feed
   */
  async createFeed(data: CreateCustomFeedRequest): Promise<CustomFeed> {
    return apiClient.post<CustomFeed>('/custom-feeds', data)
  },

  /**
   * Get all custom feeds for the current user
   */
  async getFeeds(): Promise<CustomFeed[]> {
    return apiClient.get<CustomFeed[]>('/custom-feeds')
  },

  /**
   * Get a custom feed by ID
   */
  async getFeedById(id: string): Promise<CustomFeed> {
    return apiClient.get<CustomFeed>(`/custom-feeds/${id}`)
  },

  /**
   * Update a custom feed
   */
  async updateFeed(id: string, data: Partial<CreateCustomFeedRequest>): Promise<CustomFeed> {
    return apiClient.put<CustomFeed>(`/custom-feeds/${id}`, data)
  },

  /**
   * Delete a custom feed
   */
  async deleteFeed(id: string): Promise<void> {
    return apiClient.delete(`/custom-feeds/${id}`)
  },
}

// ==================== PAYMENTS ====================

export const paymentService = {
  /**
   * Get user's payment methods
   */
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    return apiClient.get<PaymentMethod[]>('/payments/payment-methods')
  },

  /**
   * Create setup intent for adding payment method
   */
  async createSetupIntent(): Promise<SetupIntentResponse> {
    return apiClient.post<SetupIntentResponse>('/payments/payment-methods/setup-intent')
  },

  /**
   * Add payment method after setup intent is confirmed
   */
  async addPaymentMethod(setupIntentId: string, paymentMethodId: string, isDefault: boolean = false): Promise<PaymentMethod> {
    return apiClient.post<PaymentMethod>('/payments/payment-methods', {
      setupIntentId,
      paymentMethodId,
      isDefault,
    })
  },

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(paymentMethodId: string): Promise<void> {
    return apiClient.put(`/payments/payment-methods/${paymentMethodId}/default`)
  },


  /**
   * Add simulated PayPal payment method (for demonstration purposes only)
   */
  async addPayPalPaymentMethod(paypalEmail: string, isDefault: boolean = false): Promise<PaymentMethod> {
    return apiClient.post<PaymentMethod>('/payments/payment-methods/paypal', {
      paypalEmail,
      isDefault,
    })
  },

  /**
   * Remove payment method
   */
  async removePaymentMethod(paymentMethodId: string): Promise<void> {
    return apiClient.delete(`/payments/payment-methods/${paymentMethodId}`)
  },

  /**
   * Create Stripe payment intent for donation
   */
  async createPaymentIntent(data: {
    eventId: string
    amount: number
    currency?: string
    paymentMethodId?: string
    isAnonymous?: boolean
    message?: string
  }): Promise<PaymentIntentResponse> {
    return apiClient.post<PaymentIntentResponse>('/payments/payment-intent', data)
  },

  /**
   * Confirm Stripe payment
   */
  async confirmPayment(data: {
    paymentIntentId: string
    eventId: string
    amount: number
    paymentMethodId?: string
    isAnonymous?: boolean
    message?: string
  }): Promise<CreateDonationResponse> {
    return routeRequest<CreateDonationResponse>(
      'payment-confirm',
      '/payments/confirm-payment',
      { method: 'POST', data }
    )
  },

  /**
   * Simulate PayPal payment (for demonstration purposes only - no actual PayPal API call)
   */
  async simulatePayPalPayment(data: {
    eventId: string
    amount: number
    currency?: string
    paymentMethodId?: string
    isAnonymous?: boolean
    message?: string
  }): Promise<CreateDonationResponse> {
    return apiClient.post<CreateDonationResponse>('/payments/paypal/simulate', data)
  },


  /**
   * Create recurring donation (subscription)
   */
  async createRecurringDonation(data: {
    eventId?: string
    postId?: string
    recipientUserId?: string
    amount: number
    currency?: string
    interval?: 'month' | 'week' | 'year'
    paymentMethodId?: string
    isAnonymous?: boolean
    message?: string
  }): Promise<{ recurringDonation: RecurringDonation; donation: { id: string; amount: number; createdAt: string }; subscriptionId: string }> {
    return routeRequest<{ recurringDonation: RecurringDonation; donation: { id: string; amount: number; createdAt: string }; subscriptionId: string }>(
      'payment-recurring-create',
      '/payments/recurring',
      { method: 'POST', data }
    )
  },

  /**
   * Get user's recurring donations
   */
  async getRecurringDonations(): Promise<RecurringDonation[]> {
    return routeRequest<RecurringDonation[]>(
      'payment-recurring-list',
      '/payments/recurring',
      { method: 'GET' }
    )
  },

  /**
   * Cancel recurring donation
   */
  async cancelRecurringDonation(recurringDonationId: string): Promise<void> {
    return routeRequest<void>(
      'payment-recurring-cancel',
      `/payments/recurring/${recurringDonationId}`,
      { method: 'DELETE', data: { recurringDonationId } }
    )
  },

  /**
   * Get donation history
   */
  async getDonationHistory(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<DonationHistoryItem>> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    const query = queryParams.toString()
    return apiClient.get<PaginatedResponse<DonationHistoryItem>>(`/payments/history${query ? `?${query}` : ''}`)
  },
}
