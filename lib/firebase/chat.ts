/**
 * Firestore Chat Functions
 * Handles all chat-related Firestore operations
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
  addDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot,
  deleteField,
} from 'firebase/firestore'
import { db } from './firestore'

// Helper to check if Firestore is available
function ensureFirestore() {
  if (!db) {
    throw new Error('Firestore is not initialized. Please check your Firebase configuration.')
  }
  return db
}
// Types - Import from chat.types for consistency
export type { Conversation, Message, MessageAttachment, MessageReaction } from './chat.types'

// Re-export for backward compatibility
import type { Conversation, Message } from './chat.types'

// Generate UUID for IDs
function generateId(): string {
  // Use crypto.randomUUID() if available, otherwise fallback to timestamp + random
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for older browsers
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 15)}`
}

// Helper to convert Firestore timestamp to Date
function timestampToDate(
  timestamp: Date | Timestamp | undefined
): Date | undefined {
  if (!timestamp) return undefined
  if (timestamp instanceof Date) return timestamp
  if (timestamp instanceof Timestamp) return timestamp.toDate()
  return undefined
}

/**
 * Create a new conversation
 */
export async function createConversation(
  participants: string[],
  type: 'private' | 'group' = 'private',
  squadId?: string
): Promise<string> {
  if (participants.length < 2) {
    throw new Error('A conversation must have at least 2 participants')
  }

  // For private chats, check if conversation already exists
  if (type === 'private' && participants.length === 2) {
    const existing = await findConversation(participants[0], participants[1])
    if (existing) {
      return existing.id
    }
  }

  const conversationId = generateId()
  const now = serverTimestamp()

  const conversationData: Omit<Conversation, 'id'> = {
    participants,
    type,
    createdAt: now as Timestamp,
    updatedAt: now as Timestamp,
    unreadCount: {},
    ...(squadId && { squadId }),
  }

  await setDoc(doc(db, 'conversations', conversationId), conversationData)

  console.log(`[Chat] Created conversation ${conversationId}`)
  return conversationId
}

/**
 * Find existing private conversation between two users
 */
export async function findConversation(
  userId1: string,
  userId2: string
): Promise<Conversation | null> {
  const conversationsRef = collection(db, 'conversations')
  const q = query(
    conversationsRef,
    where('type', '==', 'private'),
    where('participants', 'array-contains', userId1)
  )

  const snapshot = await getDocs(q)

  for (const docSnapshot of snapshot.docs) {
    const data = docSnapshot.data()
    if (
      data.participants.includes(userId1) &&
      data.participants.includes(userId2) &&
      data.participants.length === 2
    ) {
      return {
        id: docSnapshot.id,
        ...data,
        createdAt: timestampToDate(data.createdAt) || new Date(),
        updatedAt: timestampToDate(data.updatedAt) || new Date(),
        lastMessageTime: timestampToDate(data.updatedAt),
      } as Conversation
    }
  }

  return null
}

/**
 * Get all conversations for a user
 */
export async function getUserConversations(
  userId: string
): Promise<Conversation[]> {
  const conversationsRef = collection(db, 'conversations')
  // Note: Firestore requires composite index for array-contains + orderBy
  // We'll sort client-side instead
  const q = query(
    conversationsRef,
    where('participants', 'array-contains', userId)
  )

  const snapshot = await getDocs(q)

  const conversations = snapshot.docs.map((docSnapshot) => {
    const data = docSnapshot.data()
    return {
      id: docSnapshot.id,
      ...data,
      createdAt: timestampToDate(data.createdAt) || new Date(),
      updatedAt: timestampToDate(data.updatedAt) || new Date(),
      lastMessageTime: timestampToDate(data.updatedAt),
    } as Conversation
  })

  // Sort by updatedAt descending (most recent first)
  conversations.sort((a, b) => {
    const aTime = a.updatedAt instanceof Date ? a.updatedAt.getTime() : 0
    const bTime = b.updatedAt instanceof Date ? b.updatedAt.getTime() : 0
    return bTime - aTime
  })

  return conversations
}

/**
 * Get a single conversation
 */
export async function getConversation(
  conversationId: string
): Promise<Conversation | null> {
  const docRef = doc(db, 'conversations', conversationId)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) {
    return null
  }

  const data = docSnap.data()
  return {
    id: docSnap.id,
    ...data,
    createdAt: timestampToDate(data.createdAt) || new Date(),
    updatedAt: timestampToDate(data.updatedAt) || new Date(),
    lastMessageTime: timestampToDate(data.updatedAt),
  } as Conversation
}

/**
 * Send a message to a conversation
 */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  text: string,
  attachments?: string[]
): Promise<string> {
  if (!text.trim() && (!attachments || attachments.length === 0)) {
    throw new Error('Message text or attachments required')
  }

  // Verify conversation exists
  const conversation = await getConversation(conversationId)
  if (!conversation) {
    throw new Error('Conversation not found')
  }

  // Create message
  const messageId = generateId()
  const messageData: Omit<Message, 'id'> = {
    senderId,
    text: text.trim(),
    timestamp: serverTimestamp() as Timestamp,
    attachments: attachments || [],
    readBy: [senderId], // Sender has read their own message
  }

  const messagesRef = collection(db, 'conversations', conversationId, 'messages')
  await setDoc(doc(messagesRef, messageId), messageData)

  // Update conversation last message and timestamp
  const conversationRef = doc(db, 'conversations', conversationId)
  
  // Prepare unread count updates
  const unreadCountUpdates: { [key: string]: number } = { ...conversation.unreadCount }
  conversation.participants.forEach((participantId) => {
    if (participantId !== senderId) {
      unreadCountUpdates[participantId] = (unreadCountUpdates[participantId] || 0) + 1
    }
  })

  await updateDoc(conversationRef, {
    lastMessage: text.trim().substring(0, 100), // Truncate to 100 chars
    lastSenderId: senderId,
    updatedAt: serverTimestamp(),
    unreadCount: unreadCountUpdates,
  })

  console.log(`[Chat] Sent message ${messageId} to conversation ${conversationId}`)
  return messageId
}

/**
 * Get messages for a conversation
 */
export async function getMessages(
  conversationId: string,
  limitCount: number = 50
): Promise<Message[]> {
  const messagesRef = collection(db, 'conversations', conversationId, 'messages')
  const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(limitCount))

  const snapshot = await getDocs(q)

  return snapshot.docs
    .map((docSnapshot) => {
      const data = docSnapshot.data()
      return {
        id: docSnapshot.id,
        ...data,
        timestamp: timestampToDate(data.timestamp) || new Date(),
      } as Message
    })
    .reverse() // Reverse to get chronological order
}

/**
 * Mark messages as read
 */
export async function markConversationAsRead(
  conversationId: string,
  userId: string
): Promise<void> {
  const conversationRef = doc(db, 'conversations', conversationId)
  const conversation = await getConversation(conversationId)

  if (!conversation) {
    throw new Error('Conversation not found')
  }

  // Reset unread count for this user
  const unreadCountUpdates = { ...conversation.unreadCount }
  unreadCountUpdates[userId] = 0

  await updateDoc(conversationRef, {
    unreadCount: unreadCountUpdates,
  })

  // Mark all unread messages as read
  // Note: Firestore doesn't support "not contains" queries, so we fetch all messages
  // and filter client-side, or we can just update messages in batches
  // For now, we'll get all messages and filter for unread ones
  const messagesRef = collection(db, 'conversations', conversationId, 'messages')
  
  // Get all messages (we'll filter for unread ones client-side)
  const snapshot = await getDocs(query(messagesRef, orderBy('timestamp', 'desc')))
  
  // Filter for messages not read by this user and update them
  const unreadMessages = snapshot.docs.filter((doc) => {
    const data = doc.data()
    const readBy = data.readBy || []
    return !readBy.includes(userId)
  })

  // Update all unread messages to mark them as read
  const updatePromises = unreadMessages.map((doc) => {
    const currentReadBy = doc.data().readBy || []
    return updateDoc(doc.ref, {
      readBy: [...currentReadBy, userId],
    })
  })

  await Promise.all(updatePromises)

  console.log(`[Chat] Marked conversation ${conversationId} as read for user ${userId}`)
}

/**
 * Start a new conversation with a user
 */
export async function startConversation(
  userId: string,
  targetUserId: string
): Promise<string> {
  if (userId === targetUserId) {
    throw new Error('Cannot start a conversation with yourself')
  }

  // Check if conversation already exists
  const existing = await findConversation(userId, targetUserId)
  if (existing) {
    return existing.id
  }

  return createConversation([userId, targetUserId], 'private')
}

/**
 * Create a group conversation for a squad
 */
export async function createSquadConversation(
  squadId: string,
  participants: string[]
): Promise<string> {
  if (participants.length < 2) {
    throw new Error('A group conversation must have at least 2 participants')
  }

  return createConversation(participants, 'group', squadId)
}

/**
 * Subscribe to conversation list updates
 */
export function subscribeToConversations(
  userId: string,
  callback: (conversations: Conversation[]) => void
): () => void {
  const conversationsRef = collection(db, 'conversations')
  // Note: Firestore requires composite index for array-contains + orderBy
  // We'll sort client-side instead
  const q = query(
    conversationsRef,
    where('participants', 'array-contains', userId)
  )

  return onSnapshot(
    q,
    (snapshot) => {
      const conversations = snapshot.docs.map((docSnapshot) => {
        const data = docSnapshot.data()
        return {
          id: docSnapshot.id,
          ...data,
          createdAt: timestampToDate(data.createdAt) || new Date(),
          updatedAt: timestampToDate(data.updatedAt) || new Date(),
          lastMessageTime: timestampToDate(data.updatedAt),
        } as Conversation
      })
      // Sort by updatedAt descending (most recent first)
      conversations.sort((a, b) => {
        const aTime = a.updatedAt instanceof Date ? a.updatedAt.getTime() : 0
        const bTime = b.updatedAt instanceof Date ? b.updatedAt.getTime() : 0
        return bTime - aTime
      })
      callback(conversations)
    },
    (error) => {
      console.error('[Chat] Error subscribing to conversations:', error)
    }
  )
}

/**
 * Subscribe to messages in a conversation
 */
export function subscribeToMessages(
  conversationId: string,
  callback: (messages: Message[]) => void,
  limitCount: number = 50
): () => void {
  const messagesRef = collection(db, 'conversations', conversationId, 'messages')
  const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(limitCount))

  return onSnapshot(
    q,
    (snapshot) => {
      const messages = snapshot.docs
        .map((docSnapshot) => {
          const data = docSnapshot.data()
          return {
            id: docSnapshot.id,
            ...data,
            timestamp: timestampToDate(data.timestamp) || new Date(),
          } as Message
        })
        .reverse() // Reverse to get chronological order
      callback(messages)
    },
    (error) => {
      console.error('[Chat] Error subscribing to messages:', error)
    }
  )
}

