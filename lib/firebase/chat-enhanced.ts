/**
 * Enhanced Chat Functions
 * All advanced chat features: typing indicators, reactions, editing, etc.
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore'
import { db } from './firestore'
import type {
  Conversation,
  Message,
  MessageReaction,
  TypingIndicator,
  UserPresence,
  MessageAttachment,
} from './chat.types'

// Re-export types
export type { Conversation, Message, MessageReaction, TypingIndicator, UserPresence, MessageAttachment }

const ensureFirestore = () => {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }
  return db
}

const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
}

const timestampToDate = (timestamp: Date | Timestamp | undefined): Date | undefined => {
  if (!timestamp) return undefined
  if (timestamp instanceof Date) return timestamp
  if (timestamp instanceof Timestamp) return timestamp.toDate()
  return undefined
}

// ==================== TYPING INDICATORS ====================

/**
 * Set typing indicator for a user in a conversation
 */
export async function setTypingIndicator(
  conversationId: string,
  userId: string,
  isTyping: boolean
): Promise<void> {
  ensureFirestore()
  const typingRef = doc(db, 'conversations', conversationId, 'typing', userId)

  if (isTyping) {
    await setDoc(typingRef, {
      userId,
      conversationId,
      timestamp: serverTimestamp(),
    }, { merge: true })
  } else {
    await deleteDoc(typingRef)
  }
}

/**
 * Subscribe to typing indicators in a conversation
 */
export function subscribeToTyping(
  conversationId: string,
  callback: (typingUsers: TypingIndicator[]) => void
): () => void {
  ensureFirestore()
  const typingRef = collection(db, 'conversations', conversationId, 'typing')

  return onSnapshot(typingRef, (snapshot) => {
    const typingUsers = snapshot.docs.map((doc) => ({
      userId: doc.id,
      conversationId,
      timestamp: timestampToDate(doc.data().timestamp) || new Date(),
    }))
    callback(typingUsers)
  })
}

// ==================== MESSAGE REACTIONS ====================

/**
 * Add or toggle a reaction on a message
 */
export async function toggleMessageReaction(
  conversationId: string,
  messageId: string,
  userId: string,
  emoji: string
): Promise<void> {
  ensureFirestore()
  const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId)
  const messageDoc = await getDoc(messageRef)

  if (!messageDoc.exists()) {
    throw new Error('Message not found')
  }

  const messageData = messageDoc.data()
  const reactions: MessageReaction = messageData.reactions || {}

  if (!reactions[emoji]) {
    reactions[emoji] = []
  }

  const userIndex = reactions[emoji].indexOf(userId)
  if (userIndex > -1) {
    // Remove reaction
    reactions[emoji] = reactions[emoji].filter((id) => id !== userId)
    if (reactions[emoji].length === 0) {
      delete reactions[emoji]
    }
  } else {
    // Add reaction
    reactions[emoji].push(userId)
  }

  await updateDoc(messageRef, {
    reactions,
  })
}

// ==================== MESSAGE EDITING ====================

/**
 * Edit a message
 */
export async function editMessage(
  conversationId: string,
  messageId: string,
  senderId: string,
  newText: string
): Promise<void> {
  ensureFirestore()
  const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId)
  const messageDoc = await getDoc(messageRef)

  if (!messageDoc.exists()) {
    throw new Error('Message not found')
  }

  const messageData = messageDoc.data()
  if (messageData.senderId !== senderId) {
    throw new Error('Only the sender can edit this message')
  }

  await updateDoc(messageRef, {
    text: newText.trim(),
    edited: true,
    editedAt: serverTimestamp(),
  })

  // Update conversation last message if this was the last message
  const conversationRef = doc(db, 'conversations', conversationId)
  const conversation = await getDoc(conversationRef)
  if (conversation.exists() && conversation.data().lastSenderId === senderId) {
    await updateDoc(conversationRef, {
      lastMessage: newText.trim().substring(0, 100),
    })
  }
}

// ==================== MESSAGE DELETION ====================

/**
 * Delete a message (soft delete)
 */
export async function deleteMessage(
  conversationId: string,
  messageId: string,
  senderId: string,
  deleteForEveryone: boolean = false
): Promise<void> {
  ensureFirestore()
  const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId)
  const messageDoc = await getDoc(messageRef)

  if (!messageDoc.exists()) {
    throw new Error('Message not found')
  }

  const messageData = messageDoc.data()
  if (messageData.senderId !== senderId) {
    throw new Error('Only the sender can delete this message')
  }

  if (deleteForEveryone) {
    // Soft delete for everyone
    await updateDoc(messageRef, {
      deleted: true,
      deletedAt: serverTimestamp(),
      deletedFor: messageData.deletedFor || [],
      text: '[This message was deleted]',
    })
  } else {
    // Delete only for sender
    const deletedFor = messageData.deletedFor || []
    if (!deletedFor.includes(senderId)) {
      await updateDoc(messageRef, {
        deletedFor: [...deletedFor, senderId],
      })
    }
  }
}

// ==================== GROUP CHAT FUNCTIONS ====================

/**
 * Create a group conversation
 */
export async function createGroupConversation(
  participants: string[],
  adminId: string,
  groupName?: string,
  groupAvatar?: string
): Promise<string> {
  ensureFirestore()
  if (participants.length < 2) {
    throw new Error('A group conversation must have at least 2 participants')
  }

  if (!participants.includes(adminId)) {
    throw new Error('Admin must be a participant')
  }

  const conversationId = generateId()
  const now = serverTimestamp()

  await setDoc(doc(db, 'conversations', conversationId), {
    id: conversationId,
    type: 'group',
    participants,
    adminId,
    groupName: groupName || 'Group Chat',
    groupAvatar,
    createdAt: now,
    updatedAt: now,
    unreadCount: {},
    mutedBy: [],
    pinnedMessages: [],
  })

  return conversationId
}

/**
 * Add member to group
 */
export async function addGroupMember(
  conversationId: string,
  adminId: string,
  newMemberId: string
): Promise<void> {
  ensureFirestore()
  const conversationRef = doc(db, 'conversations', conversationId)
  const conversationDoc = await getDoc(conversationRef)

  if (!conversationDoc.exists()) {
    throw new Error('Conversation not found')
  }

  const conversationData = conversationDoc.data()
  if (conversationData.adminId !== adminId) {
    throw new Error('Only the admin can add members')
  }

  if (conversationData.type !== 'group') {
    throw new Error('This is not a group conversation')
  }

  const participants = conversationData.participants || []
  if (!participants.includes(newMemberId)) {
    await updateDoc(conversationRef, {
      participants: [...participants, newMemberId],
      unreadCount: {
        ...conversationData.unreadCount,
        [newMemberId]: 0,
      },
    })
  }
}

/**
 * Remove member from group
 */
export async function removeGroupMember(
  conversationId: string,
  adminId: string,
  memberId: string
): Promise<void> {
  ensureFirestore()
  const conversationRef = doc(db, 'conversations', conversationId)
  const conversationDoc = await getDoc(conversationRef)

  if (!conversationDoc.exists()) {
    throw new Error('Conversation not found')
  }

  const conversationData = conversationDoc.data()
  if (conversationData.adminId !== adminId) {
    throw new Error('Only the admin can remove members')
  }

  if (memberId === adminId) {
    throw new Error('Admin cannot remove themselves')
  }

  const participants = conversationData.participants || []
  await updateDoc(conversationRef, {
    participants: participants.filter((id: string) => id !== memberId),
  })
}

/**
 * Leave group conversation
 */
export async function leaveGroupConversation(
  conversationId: string,
  userId: string
): Promise<void> {
  ensureFirestore()
  const conversationRef = doc(db, 'conversations', conversationId)
  const conversationDoc = await getDoc(conversationRef)

  if (!conversationDoc.exists()) {
    throw new Error('Conversation not found')
  }

  const conversationData = conversationDoc.data()
  if (conversationData.type !== 'group') {
    throw new Error('This is not a group conversation')
  }

  if (conversationData.adminId === userId) {
    throw new Error('Admin cannot leave. Transfer admin or delete group.')
  }

  const participants = conversationData.participants || []
  await updateDoc(conversationRef, {
    participants: participants.filter((id: string) => id !== userId),
  })
}

/**
 * Update group settings
 */
export async function updateGroupSettings(
  conversationId: string,
  adminId: string,
  updates: { groupName?: string; groupAvatar?: string }
): Promise<void> {
  ensureFirestore()
  const conversationRef = doc(db, 'conversations', conversationId)
  const conversationDoc = await getDoc(conversationRef)

  if (!conversationDoc.exists()) {
    throw new Error('Conversation not found')
  }

  const conversationData = conversationDoc.data()
  if (conversationData.adminId !== adminId) {
    throw new Error('Only the admin can update group settings')
  }

  const updateData: any = {}
  if (updates.groupName !== undefined) updateData.groupName = updates.groupName
  if (updates.groupAvatar !== undefined) updateData.groupAvatar = updates.groupAvatar

  if (Object.keys(updateData).length > 0) {
    await updateDoc(conversationRef, updateData)
  }
}

// ==================== PINNED MESSAGES ====================

/**
 * Pin a message in a group conversation
 */
export async function pinMessage(
  conversationId: string,
  messageId: string,
  userId: string,
  isAdmin: boolean = false
): Promise<void> {
  ensureFirestore()
  const conversationRef = doc(db, 'conversations', conversationId)
  const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId)

  const [conversationDoc, messageDoc] = await Promise.all([
    getDoc(conversationRef),
    getDoc(messageRef),
  ])

  if (!conversationDoc.exists() || !messageDoc.exists()) {
    throw new Error('Conversation or message not found')
  }

  const conversationData = conversationDoc.data()
  const messageData = messageDoc.data()

  // Check permissions
  if (conversationData.type === 'group') {
    if (!isAdmin && conversationData.adminId !== userId && messageData.senderId !== userId) {
      throw new Error('Only admin or message sender can pin messages')
    }
  } else {
    if (messageData.senderId !== userId) {
      throw new Error('Only message sender can pin messages in private chats')
    }
  }

  // Pin the message
  const pinnedMessages = conversationData.pinnedMessages || []
  if (!pinnedMessages.includes(messageId)) {
    await Promise.all([
      updateDoc(conversationRef, {
        pinnedMessages: [...pinnedMessages, messageId],
      }),
      updateDoc(messageRef, {
        pinned: true,
        pinnedAt: serverTimestamp(),
        pinnedBy: userId,
      }),
    ])
  }
}

/**
 * Unpin a message
 */
export async function unpinMessage(
  conversationId: string,
  messageId: string,
  userId: string
): Promise<void> {
  ensureFirestore()
  const conversationRef = doc(db, 'conversations', conversationId)
  const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId)

  const [conversationDoc, messageDoc] = await Promise.all([
    getDoc(conversationRef),
    getDoc(messageRef),
  ])

  if (!conversationDoc.exists() || !messageDoc.exists()) {
    throw new Error('Conversation or message not found')
  }

  const conversationData = conversationDoc.data()
  const messageData = messageDoc.data()

  // Check permissions (same as pin)
  if (conversationData.type === 'group') {
    if (conversationData.adminId !== userId && messageData.senderId !== userId) {
      throw new Error('Only admin or message sender can unpin messages')
    }
  } else {
    if (messageData.senderId !== userId) {
      throw new Error('Only message sender can unpin messages')
    }
  }

  const pinnedMessages = conversationData.pinnedMessages || []
  await Promise.all([
    updateDoc(conversationRef, {
      pinnedMessages: pinnedMessages.filter((id: string) => id !== messageId),
    }),
    updateDoc(messageRef, {
      pinned: false,
      pinnedAt: deleteField(),
      pinnedBy: deleteField(),
    }),
  ])
}

// ==================== MUTE CONVERSATIONS ====================

/**
 * Mute a conversation
 */
export async function muteConversation(
  conversationId: string,
  userId: string,
  mutedUntil?: Date
): Promise<void> {
  ensureFirestore()
  const mutedRef = doc(db, 'muted', `${userId}_${conversationId}`)
  await setDoc(mutedRef, {
    userId,
    conversationId,
    mutedAt: serverTimestamp(),
    ...(mutedUntil && { mutedUntil: Timestamp.fromDate(mutedUntil) }),
  })
}

/**
 * Unmute a conversation
 */
export async function unmuteConversation(
  conversationId: string,
  userId: string
): Promise<void> {
  ensureFirestore()
  const mutedRef = doc(db, 'muted', `${userId}_${conversationId}`)
  await deleteDoc(mutedRef)
}

/**
 * Check if conversation is muted
 */
export async function isConversationMuted(
  conversationId: string,
  userId: string
): Promise<boolean> {
  ensureFirestore()
  const mutedRef = doc(db, 'muted', `${userId}_${conversationId}`)
  const mutedDoc = await getDoc(mutedRef)

  if (!mutedDoc.exists()) {
    return false
  }

  const mutedData = mutedDoc.data()
  if (mutedData.mutedUntil) {
    const mutedUntil = timestampToDate(mutedData.mutedUntil)
    if (mutedUntil && mutedUntil < new Date()) {
      // Mute expired, remove it
      await deleteDoc(mutedRef)
      return false
    }
  }

  return true
}

// ==================== USER PRESENCE (ONLINE/OFFLINE) ====================

/**
 * Update user presence status
 */
export async function updateUserPresence(
  userId: string,
  isOnline: boolean,
  status?: 'online' | 'away' | 'busy' | 'offline'
): Promise<void> {
  ensureFirestore()
  const presenceRef = doc(db, 'presence', userId)
  
  if (isOnline) {
    await setDoc(presenceRef, {
      userId,
      isOnline: true,
      status: status || 'online',
      lastSeen: serverTimestamp(),
    }, { merge: true })
  } else {
    await setDoc(presenceRef, {
      userId,
      isOnline: false,
      status: 'offline',
      lastSeen: serverTimestamp(),
    }, { merge: true })
  }
}

/**
 * Subscribe to user presence
 */
export function subscribeToUserPresence(
  userId: string,
  callback: (presence: UserPresence | null) => void
): () => void {
  ensureFirestore()
  const presenceRef = doc(db, 'presence', userId)

  return onSnapshot(presenceRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null)
      return
    }

    const data = snapshot.data()
    callback({
      userId,
      isOnline: data.isOnline || false,
      status: data.status || 'offline',
      lastSeen: timestampToDate(data.lastSeen),
    })
  })
}

// ==================== SEARCH MESSAGES ====================

/**
 * Search messages in a conversation
 */
export async function searchMessages(
  conversationId: string,
  searchQuery: string,
  limitCount: number = 50
): Promise<Message[]> {
  ensureFirestore()
  const messagesRef = collection(db, 'conversations', conversationId, 'messages')
  const snapshot = await getDocs(messagesRef)

  const queryLower = searchQuery.toLowerCase()
  const matchingMessages = snapshot.docs
    .map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        timestamp: timestampToDate(data.timestamp) || new Date(),
      } as Message
    })
    .filter((msg) => {
      // Filter deleted messages
      if (msg.deleted && msg.deletedFor?.includes(msg.senderId)) {
        return false
      }
      // Search in text
      return msg.text.toLowerCase().includes(queryLower)
    })
    .sort((a, b) => {
      const aTime = a.timestamp instanceof Date ? a.timestamp.getTime() : 0
      const bTime = b.timestamp instanceof Date ? b.timestamp.getTime() : 0
      return bTime - aTime // Most recent first
    })
    .slice(0, limitCount)

  return matchingMessages
}



