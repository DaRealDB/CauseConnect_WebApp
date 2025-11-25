/**
 * API Service Functions
 * Organized by feature module
 */

import { apiClient } from './client'
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
  PayPalOrderResponse,
  RecurringDonation,
  DonationHistoryItem,
} from './types'

// ==================== AUTH ====================

export const authService = {
  /**
   * Login user
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials)
    // Store token
    apiClient.setToken(response.token)
    return response
  },

  /**
   * Register new user
   */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const response = await apiClient.post<RegisterResponse>('/auth/register', data)
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
    return apiClient.get<User>('/auth/me')
  },

  /**
   * Refresh token (if your backend supports it)
   */
  async refreshToken(): Promise<{ token: string }> {
    const response = await apiClient.post<{ token: string }>('/auth/refresh')
    apiClient.setToken(response.token)
    return response
  },
}

// ==================== USERS ====================

export const userService = {
  /**
   * Get user profile by username
   */
  async getUserProfile(username: string): Promise<User> {
    return apiClient.get<User>(`/users/${username}`)
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
    return apiClient.put<User>('/users/profile', data)
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
    return apiClient.post<{ isFollowing: boolean }>(`/users/${userId}/follow`)
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
    const queryParams = new URLSearchParams()
    queryParams.append('query', query)
    if (limit) queryParams.append('limit', limit.toString())
    return apiClient.get<User[]>(`/users/search?${queryParams.toString()}`)
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
      const queryParams = new URLSearchParams()
      if (params?.page) queryParams.append('page', params.page.toString())
      if (params?.limit) queryParams.append('limit', params.limit.toString())
      const query = queryParams.toString()
      return apiClient.get<PaginatedResponse<Event>>(`/events/bookmarked${query ? `?${query}` : ''}`)
    }

    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.filter) queryParams.append('filter', params.filter)
    if (params?.search) queryParams.append('search', params.search)
    if (params?.userId) queryParams.append('userId', params.userId)
    if (params?.excludeUser) queryParams.append('excludeUser', 'true')
    if (params?.requireUserTags) queryParams.append('requireUserTags', 'true')
    if (params?.excludeUserTags) queryParams.append('excludeUserTags', 'true')
    if (params?.tags && params.tags.length > 0) {
      queryParams.append('tags', params.tags.join(','))
    }

    const query = queryParams.toString()
    return apiClient.get<PaginatedResponse<Event>>(`/events${query ? `?${query}` : ''}`)
  },

  /**
   * Get event by ID
   */
  async getEventById(id: string | number): Promise<Event> {
    return apiClient.get<Event>(`/events/${id}`)
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
      data.images.forEach((image) => formData.append('images', image))

      return apiClient.upload<CreateEventResponse>('/events', formData)
    }

    // Otherwise use JSON
    return apiClient.post<CreateEventResponse>('/events', data)
  },

  /**
   * Support an event
   */
  async supportEvent(eventId: string | number): Promise<void> {
    return apiClient.post(`/events/${eventId}/support`)
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
    return apiClient.post(`/events/${eventId}/bookmark`)
  },

  /**
   * Unbookmark an event
   */
  async unbookmarkEvent(eventId: string | number): Promise<void> {
    return apiClient.delete(`/events/${eventId}/bookmark`)
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
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    const query = queryParams.toString()
    return apiClient.get<PaginatedResponse<any>>(`/events/${eventId}/participants${query ? `?${query}` : ''}`)
  },

  /**
   * Get event analytics
   */
  async getEventAnalytics(eventId: string | number): Promise<any> {
    return apiClient.get<any>(`/events/${eventId}/analytics`)
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
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.userId) queryParams.append('userId', params.userId.toString())
    if (params?.requireUserTags) queryParams.append('requireUserTags', 'true')
    if (params?.excludeUserTags) queryParams.append('excludeUserTags', 'true')
    if (params?.tags && params.tags.length > 0) {
      queryParams.append('tags', params.tags.join(','))
    }

    const query = queryParams.toString()
    return apiClient.get<PaginatedResponse<Post>>(`/posts${query ? `?${query}` : ''}`)
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
    return apiClient.post(`/posts/${postId}/like`)
  },

  /**
   * Unlike a post
   */
  async unlikePost(postId: number | string): Promise<void> {
    return apiClient.delete(`/posts/${postId}/like`)
  },

  /**
   * Bookmark a post
   */
  async bookmarkPost(postId: number | string): Promise<void> {
    return apiClient.post(`/posts/${postId}/bookmark`)
  },

  /**
   * Unbookmark a post
   */
  async unbookmarkPost(postId: number | string): Promise<void> {
    return apiClient.delete(`/posts/${postId}/bookmark`)
  },

  /**
   * Get bookmarked posts
   */
  async getBookmarkedPosts(params?: {
    page?: number
    limit?: number
  }): Promise<PaginatedResponse<Post>> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    const query = queryParams.toString()
    return apiClient.get<PaginatedResponse<Post>>(`/posts/bookmarked${query ? `?${query}` : ''}`)
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
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    const query = queryParams.toString()
    return apiClient.get<PaginatedResponse<any>>(`/posts/${postId}/participants${query ? `?${query}` : ''}`)
  },
}

// ==================== COMMENTS ====================

export const commentService = {
  /**
   * Get comments for an event/post
   */
  async getComments(eventId: string | number): Promise<Comment[]> {
    return apiClient.get<Comment[]>(`/comments/events/${eventId}/comments`)
  },

  /**
   * Create a comment
   */
  async createComment(eventId: string | number, data: CreateCommentRequest): Promise<CreateCommentResponse> {
    return apiClient.post<CreateCommentResponse>(`/comments/events/${eventId}/comments`, data)
  },

  /**
   * Like a comment
   */
  async likeComment(commentId: string | number): Promise<void> {
    return apiClient.post(`/comments/${commentId}/like`)
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
    return apiClient.post<CreateDonationResponse>('/donations', data)
  },

  /**
   * Get user's donation history
   */
  async getDonations(params?: {
    page?: number
    limit?: number
    eventId?: number
  }): Promise<PaginatedResponse<Donation>> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.eventId) queryParams.append('eventId', params.eventId.toString())

    const query = queryParams.toString()
    return apiClient.get<PaginatedResponse<Donation>>(`/donations${query ? `?${query}` : ''}`)
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
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.type) queryParams.append('type', params.type)

    const query = queryParams.toString()
    return apiClient.get<PaginatedResponse<Notification>>(`/notifications${query ? `?${query}` : ''}`)
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    return apiClient.patch(`/notifications/${notificationId}/read`)
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    return apiClient.patch('/notifications/read-all')
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
    return apiClient.get<{ count: number }>('/notifications/unread-count')
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
    return apiClient.get<UserSettings>('/settings')
  },

  /**
   * Update user settings
   */
  async updateSettings(data: Partial<UserSettings>): Promise<UserSettings> {
    return apiClient.put<UserSettings>('/settings', data)
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
    return apiClient.get('/settings/login-activity')
  },

  /**
   * Revoke a session
   */
  async revokeSession(tokenId: string): Promise<void> {
    return apiClient.delete(`/settings/login-activity/${tokenId}`)
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
}

// ==================== SQUADS ====================

export const squadService = {
  /**
   * Get user's squads
   */
  async getSquads(): Promise<Squad[]> {
    return apiClient.get<Squad[]>('/squads')
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
    return apiClient.get<Squad>(`/squads/${squadId}`)
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
    return apiClient.post(`/squads/${squadId}/join`)
  },

  /**
   * Leave a squad
   */
  async leaveSquad(squadId: string | number): Promise<void> {
    return apiClient.delete(`/squads/${squadId}/join`)
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
    const queryParams = new URLSearchParams()
    if (page) queryParams.append('page', page.toString())
    if (limit) queryParams.append('limit', limit.toString())
    const query = queryParams.toString()
    return apiClient.get<PaginatedResponse<SquadPost>>(`/squads/${squadId}/posts${query ? `?${query}` : ''}`)
  },

  /**
   * Create squad post
   */
  async createSquadPost(squadId: string | number, data: { content: string; image?: File }): Promise<SquadPost> {
    if (data.image) {
      const formData = new FormData()
      formData.append('content', data.content)
      formData.append('image', data.image)
      return apiClient.upload<SquadPost>(`/squads/${squadId}/posts`, formData)
    }
    return apiClient.post<SquadPost>(`/squads/${squadId}/posts`, { content: data.content })
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
   * Add PayPal payment method
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
    return apiClient.post<CreateDonationResponse>('/payments/confirm-payment', data)
  },

  /**
   * Create PayPal order for donation
   */
  async createPayPalOrder(data: {
    eventId: string
    amount: number
    currency?: string
    isAnonymous?: boolean
    message?: string
  }): Promise<PayPalOrderResponse> {
    return apiClient.post<PayPalOrderResponse>('/payments/paypal/order', data)
  },

  /**
   * Capture PayPal payment
   */
  async capturePayPalPayment(orderId: string): Promise<CreateDonationResponse> {
    return apiClient.post<CreateDonationResponse>('/payments/paypal/capture', { orderId })
  },

  /**
   * Create recurring donation (subscription)
   */
  async createRecurringDonation(data: {
    eventId: string
    amount: number
    currency?: string
    interval?: 'month' | 'week' | 'year'
    paymentMethodId?: string
    isAnonymous?: boolean
    message?: string
  }): Promise<{ recurringDonation: RecurringDonation; donation: { id: string; amount: number; createdAt: string }; subscriptionId: string }> {
    return apiClient.post('/payments/recurring', data)
  },

  /**
   * Get user's recurring donations
   */
  async getRecurringDonations(): Promise<RecurringDonation[]> {
    return apiClient.get<RecurringDonation[]>('/payments/recurring')
  },

  /**
   * Cancel recurring donation
   */
  async cancelRecurringDonation(recurringDonationId: string): Promise<void> {
    return apiClient.delete(`/payments/recurring/${recurringDonationId}`)
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
