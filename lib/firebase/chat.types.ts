/**
 * Comprehensive Chat System Types
 * All types for the real-time chat system
 */

import { Timestamp } from 'firebase/firestore'

// ==================== CONVERSATION TYPES ====================

export interface Conversation {
  id: string
  type: 'private' | 'group'
  participants: string[]
  adminId?: string // For group chats
  groupName?: string // For group chats
  groupAvatar?: string // For group chats
  createdAt: Date | Timestamp
  updatedAt: Date | Timestamp
  lastMessage?: string
  lastSenderId?: string
  lastMessageAt?: Date | Timestamp
  unreadCount?: { [userId: string]: number }
  squadId?: string // If it's a squad group chat
  mutedBy?: string[] // Users who have muted this conversation
  pinnedMessages?: string[] // Message IDs of pinned messages
}

// ==================== MESSAGE TYPES ====================

export interface MessageReaction {
  [emoji: string]: string[] // emoji -> array of userIds who reacted
}

export interface MessageAttachment {
  type: 'image' | 'file' | 'video' | 'audio'
  url: string
  fileName?: string
  fileSize?: number
  thumbnailUrl?: string
}

export interface Message {
  id: string
  senderId: string
  text: string
  timestamp: Date | Timestamp
  edited?: boolean
  editedAt?: Date | Timestamp
  attachments?: MessageAttachment[]
  readBy: string[] // Array of userIds who have read this message
  reactions?: MessageReaction
  deleted?: boolean // For soft delete
  deletedAt?: Date | Timestamp
  deletedFor?: string[] // Users this message was deleted for (delete for everyone)
  replyTo?: string // Message ID this message is replying to
  pinned?: boolean
  pinnedAt?: Date | Timestamp
  pinnedBy?: string // User ID who pinned this message
}

// ==================== TYPING INDICATOR ====================

export interface TypingIndicator {
  userId: string
  conversationId: string
  timestamp: Date | Timestamp
}

// ==================== ONLINE STATUS ====================

export interface UserPresence {
  userId: string
  isOnline: boolean
  lastSeen?: Date | Timestamp
  status?: 'online' | 'away' | 'busy' | 'offline'
}

// ==================== BLOCK & MUTE ====================

export interface BlockedUser {
  userId: string
  blockedUserId: string
  blockedAt: Date | Timestamp
}

export interface MutedConversation {
  userId: string
  conversationId: string
  mutedAt: Date | Timestamp
  mutedUntil?: Date | Timestamp // Optional: mute for a specific time period
}

// ==================== SEARCH TYPES ====================

export interface ConversationSearchResult {
  conversation: Conversation
  matchedMessages?: Message[]
  matchedUsers?: string[]
}

// ==================== CHAT SETTINGS ====================

export interface ChatSettings {
  userId: string
  allowNotifications: boolean
  showReadReceipts: boolean
  showTypingIndicators: boolean
  playSoundOnMessage: boolean
  theme?: 'light' | 'dark' | 'auto'
}



