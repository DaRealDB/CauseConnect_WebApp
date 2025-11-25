/**
 * Type definitions for API responses
 */

// User Types
export interface User {
  id: number | string
  name?: string
  firstName?: string
  lastName?: string
  username: string
  email: string
  avatar?: string
  coverImage?: string
  bio?: string
  location?: string
  website?: string
  verified: boolean
  createdAt: string
  joinedDate?: string
  isFollowing?: boolean
  isOwnProfile?: boolean
  interestTags?: string[]
  stats?: {
    followers: number
    following: number
    causesSupported: number
    totalDonated: number
    impactScore: number
  }
  events?: Array<{
    id: string | number
    title: string
    description: string
    image?: string
    goal: number
    raised: number
    createdAt: string
  }>
  supportedEvents?: Array<{
    id: string | number
    title: string
    description: string
    image?: string
    goal: number
    raised: number
    supporters: number
    createdAt: string
    organization: {
      id: string | number
      name: string
      username?: string
      verified: boolean
      avatar?: string
    }
    tags: string[]
  }>
}

export interface LoginRequest {
  emailOrUsername: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
}

export interface RegisterRequest {
  firstName: string
  lastName: string
  username: string
  email: string
  password: string
  confirmPassword: string
}

export interface RegisterResponse {
  token: string
  user: User
}

// Event Types
export interface Event {
  id: string | number
  title: string
  description: string
  fullDescription?: string
  image?: string
  tags: string[]
  supporters: number
  goal: number
  raised: number
  organization: {
    id: string | number
    name: string
    username?: string
    verified: boolean
    avatar?: string
    description?: string
  }
  organizationId?: string | number
  location?: string
  targetDate?: string
  timeLeft?: string
  urgency: 'high' | 'medium' | 'low'
  isSupported: boolean
  isBookmarked: boolean
  createdAt: string
  updates?: EventUpdate[]
}

export interface EventUpdate {
  id: string | number
  title: string
  content: string
  image?: string
  timestamp: string
}

export interface CreateEventRequest {
  title: string
  description: string
  location?: string
  targetDate?: string
  goalAmount?: number
  tags: string[]
  images?: File[]
}

export interface CreateEventResponse {
  event: Event
}

// Post Types
export interface Post {
  id: number | string
  user: {
    id: number | string
    name: string
    username: string
    avatar?: string
    verified: boolean
    following?: boolean
  }
  content: string
  image?: string
  tags?: string[]
  timestamp: string
  likes: number
  comments: number
  participants?: number
  shares: number
  liked: boolean
  bookmarked: boolean
  isParticipating?: boolean
  following?: boolean
}

export interface CreatePostRequest {
  content: string
  image?: File
  tags?: string[] // Tags for the post
}

export interface CreatePostResponse {
  post: Post
}

// Comment Types
export interface Comment {
  id: number
  user: {
    id: number
    name: string
    username: string
    avatar?: string
    verified: boolean
  }
  content: string
  timestamp: string
  likes: number
  dislikes: number
  replies: Comment[]
  liked: boolean
  disliked: boolean
  saved: boolean
  awarded: boolean
}

export interface CreateCommentRequest {
  content: string
  parentId?: number
}

export interface CreateCommentResponse {
  comment: Comment
}

// Donation Types
export interface Donation {
  id: string | number
  eventId: string | number
  amount: number
  paymentMethod: string
  isRecurring: boolean
  isAnonymous: boolean
  message?: string
  createdAt: string
}

export interface CreateDonationRequest {
  eventId: string | number
  amount: number
  paymentMethod: 'card' | 'paypal' | 'apple'
  isRecurring: boolean
  isAnonymous: boolean
  message?: string
  name?: string
  email: string
}

export interface CreateDonationResponse {
  donation: Donation
  transactionId: string
}

// Payment Types
export interface PaymentMethod {
  id: string
  provider: 'stripe' | 'paypal'
  type: 'card' | 'paypal_account'
  isDefault: boolean
  cardBrand?: string
  cardLast4?: string
  cardExpMonth?: number
  cardExpYear?: number
  paypalEmail?: string
  stripePaymentMethodId?: string
  createdAt: string
}

export interface SetupIntentResponse {
  clientSecret: string
  setupIntentId: string
}

export interface PaymentIntentResponse {
  clientSecret: string
  paymentIntentId: string
}

export interface PayPalOrderResponse {
  orderId: string
  approvalUrl: string
  donationId: string
}

export interface RecurringDonation {
  id: string
  eventId: string
  event: {
    id: string
    title: string
    image?: string
  }
  amount: number
  currency: string
  interval: 'month' | 'week' | 'year'
  status: 'active' | 'canceled' | 'paused' | 'expired'
  currentPeriodEnd?: string
  canceledAt?: string
  createdAt: string
}

export interface DonationHistoryItem {
  id: string
  eventId: string
  event: {
    id: string
    title: string
    image?: string
  }
  amount: number
  paymentMethod: 'stripe' | 'paypal'
  isRecurring: boolean
  isAnonymous: boolean
  message?: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  transactionId?: string
  createdAt: string
}

// Notification Types
export interface Notification {
  id: string
  type: 'like' | 'comment' | 'follow' | 'donation' | 'award' | 'system'
  title: string
  message: string
  timestamp: string
  isRead: boolean
  avatar?: string
  actionUrl?: string
  amount?: number
}

// Chat Types
export interface Chat {
  id: string
  name: string
  avatar?: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  isOnline: boolean
  isGroup?: boolean
}

export interface Message {
  id: string
  senderId: string
  senderName: string
  senderAvatar?: string
  content: string
  timestamp: string
  isRead: boolean
}

export interface SendMessageRequest {
  chatId: string
  content: string
}

// Settings Types
export interface UserSettings {
  notifications: {
    donations: boolean
    comments: boolean
    awards: boolean
    mentions: boolean
    newCauses: boolean
    email: boolean
    sms: boolean
  }
  privacy: {
    activityVisibility: 'public' | 'friends' | 'private'
    twoFactor: boolean
  }
  personalization: {
    language: string
    region: string
    currency?: string
    theme: 'light' | 'dark' | 'system'
    interestTags?: string[]
    accessibility: {
      highContrast: boolean
      screenReader: boolean
      textSize: string
    }
  }
}

// Squad Types
export interface Squad {
  id: string | number
  name: string
  description?: string
  avatar?: string
  members: number
  role?: 'admin' | 'moderator' | 'member'
  posts?: number
  creator?: {
    id: string | number
    name: string
    username: string
    avatar?: string
  }
  isMember?: boolean
  createdAt?: string
}

export interface CreateSquadRequest {
  name: string
  description?: string
  avatar?: File
}

export interface SquadPost {
  id: string
  content: string
  image?: string
  isPinned: boolean
  createdAt: string
  updatedAt: string
  user: {
    id: string | number
    name: string
    username: string
    avatar?: string
    verified: boolean
  }
  commentsCount: number
  reactionsCount: number
  userReaction?: {
    type: string
    id: string
  } | null
}

export interface SquadComment {
  id: string
  content: string
  createdAt: string
  updatedAt: string
  user: {
    id: string | number
    name: string
    username: string
    avatar?: string
    verified: boolean
  }
  parentId?: string | null
  replies: SquadComment[]
  reactionsCount: number
  userReaction?: {
    type: string
    id: string
  } | null
}

export interface SquadMember {
  id: string | number
  name: string
  username: string
  avatar?: string
  verified: boolean
  role: string
  joinedAt: string
}

// Explore Types
export interface ExploreContent {
  type: 'event' | 'post' | 'squad'
  id: string | number
  data: Event | Post | Squad
  createdAt: string
}

// API Response wrappers
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}


