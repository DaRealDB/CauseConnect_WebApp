/**
 * React Hook for Chat Functionality
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  subscribeToConversations,
  subscribeToMessages,
  sendMessage as sendMessageToFirestore,
  startConversation as startConversationInFirestore,
  markConversationAsRead as markReadInFirestore,
  getUserConversations,
  type Conversation,
  type Message,
} from '@/lib/firebase/chat'
import { verifyFirebaseConnection } from '@/lib/firebase/firebase.config'
import { userService } from '@/lib/api/services'
import type { User } from '@/lib/api/types'

interface ChatParticipant {
  id: string
  username: string
  name?: string
  firstName?: string
  lastName?: string
  avatar?: string
  verified?: boolean
}

export interface ConversationWithParticipants extends Conversation {
  participantsData?: ChatParticipant[]
  otherParticipant?: ChatParticipant
  unreadCountForUser?: number
}

export function useChat() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<ConversationWithParticipants[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const unsubscribeConversationsRef = useRef<(() => void) | null>(null)
  const participantCacheRef = useRef<Map<string, ChatParticipant>>(new Map())

  // Check if Firebase is configured
  const isFirebaseConfigured = typeof window !== 'undefined' && verifyFirebaseConnection()

  // Fetch user data for participant IDs
  const fetchParticipantData = useCallback(async (participantIds: string[]): Promise<ChatParticipant[]> => {
    const participants: ChatParticipant[] = []
    const fetchPromises = participantIds.map(async (id) => {
      // Check cache first
      if (participantCacheRef.current.has(id)) {
        return participantCacheRef.current.get(id)!
      }

      try {
        // Try to fetch user data from backend chat endpoint (accepts user ID)
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/chat/user/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
        })
        
        if (!response.ok) {
          throw new Error('User not found')
        }
        
        const userData = await response.json()
        const participant: ChatParticipant = {
          id: userData.id.toString(),
          username: userData.username,
          name: userData.name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.username,
          firstName: userData.firstName,
          lastName: userData.lastName,
          avatar: userData.avatar,
          verified: userData.verified,
        }
        participantCacheRef.current.set(id, participant)
        return participant
      } catch (err) {
        console.error(`[useChat] Failed to fetch user ${id}:`, err)
        // If user not found, create a basic participant object
        const participant: ChatParticipant = {
          id,
          username: id,
          name: 'Unknown User',
        }
        participantCacheRef.current.set(id, participant)
        return participant
      }
    })

    const results = await Promise.all(fetchPromises)
    return results.filter(Boolean) as ChatParticipant[]
  }, [])

  // Enrich conversation with participant data
  const enrichConversation = useCallback(
    async (conversation: Conversation): Promise<ConversationWithParticipants> => {
      const enriched: ConversationWithParticipants = { ...conversation }

      // Get other participant for private chats
      if (conversation.type === 'private' && user) {
        const otherParticipantId = conversation.participants.find((id) => id !== user.id?.toString())
        if (otherParticipantId) {
          const participants = await fetchParticipantData([otherParticipantId])
          enriched.otherParticipant = participants[0]
        }
      } else if (conversation.type === 'group') {
        // For group chats, get all participants
        const participants = await fetchParticipantData(conversation.participants)
        enriched.participantsData = participants
      }

      // Get unread count for current user
      if (user && conversation.unreadCount) {
        enriched.unreadCountForUser = conversation.unreadCount[user.id?.toString() || ''] || 0
      }

      return enriched
    },
    [user, fetchParticipantData]
  )

  // Subscribe to conversations
  useEffect(() => {
    if (!isFirebaseConfigured) {
      setIsLoading(false)
      setError(new Error('Firebase is not configured'))
      return
    }

    if (!user?.id) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    // Initial fetch
    getUserConversations(user.id.toString())
      .then(async (convs) => {
        const enriched = await Promise.all(convs.map(enrichConversation))
        setConversations(enriched)
        setIsLoading(false)
      })
      .catch((err) => {
        console.error('[useChat] Error fetching conversations:', err)
        
        // Check for permission errors
        if (err?.code === 'permission-denied' || err?.message?.includes('Missing or insufficient permissions')) {
          console.error('[useChat] PERMISSION ERROR: Please update Firestore security rules!')
          console.error('[useChat] Rules should allow read/write for conversations collection')
        }
        
        setError(err)
        setIsLoading(false)
      })

    // Subscribe to real-time updates
    const unsubscribe = subscribeToConversations(user.id.toString(), async (convs) => {
      try {
        const enriched = await Promise.all(convs.map(enrichConversation))
        setConversations(enriched)
        
        // Dispatch event for badge notifications
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('chat_conversations_updated', { detail: enriched })
          )
        }
      } catch (err) {
        console.error('[useChat] Error enriching conversations:', err)
      }
    })

    unsubscribeConversationsRef.current = unsubscribe

    return () => {
      if (unsubscribeConversationsRef.current) {
        unsubscribeConversationsRef.current()
        unsubscribeConversationsRef.current = null
      }
    }
  }, [user, enrichConversation])

  // Start a new conversation
  const startConversation = useCallback(
    async (targetUserId: string): Promise<string> => {
      if (!user?.id) {
        throw new Error('User must be logged in')
      }

      if (user.id.toString() === targetUserId) {
        throw new Error('Cannot start a conversation with yourself')
      }

      try {
        const conversationId = await startConversationInFirestore(user.id.toString(), targetUserId)
        return conversationId
      } catch (err) {
        console.error('[useChat] Error starting conversation:', err)
        throw err
      }
    },
    [user]
  )

  // Send a message
  const sendMessage = useCallback(
    async (conversationId: string, text: string, attachments?: string[]): Promise<void> => {
      if (!user?.id) {
        throw new Error('User must be logged in')
      }

      try {
        await sendMessageToFirestore(conversationId, user.id.toString(), text, attachments)
      } catch (err) {
        console.error('[useChat] Error sending message:', err)
        throw err
      }
    },
    [user]
  )

  // Mark conversation as read
  const markConversationAsRead = useCallback(
    async (conversationId: string): Promise<void> => {
      if (!user?.id) {
        return
      }

      try {
        await markReadInFirestore(conversationId, user.id.toString())
      } catch (err) {
        console.error('[useChat] Error marking conversation as read:', err)
      }
    },
    [user]
  )

  return {
    conversations,
    isLoading,
    error,
    startConversation,
    sendMessage,
    markConversationAsRead,
  }
}

