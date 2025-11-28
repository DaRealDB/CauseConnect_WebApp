/**
 * React Hook for a Single Conversation
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  subscribeToMessages,
  sendMessage as sendMessageToFirestore,
  markConversationAsRead as markReadInFirestore,
  getConversation,
  getMessages,
  type Message,
  type Conversation,
} from '@/lib/firebase/chat'
import { verifyFirebaseConnection } from '@/lib/firebase/firebase.config'
import { userService } from '@/lib/api/services'

interface MessageWithSender extends Message {
  senderData?: {
    id: string
    username: string
    name?: string
    avatar?: string
    verified?: boolean
  }
}

export function useConversation(conversationId: string | null) {
  const { user } = useAuth()
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<MessageWithSender[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [isSending, setIsSending] = useState(false)
  const unsubscribeMessagesRef = useRef<(() => void) | null>(null)
  const senderCacheRef = useRef<Map<string, MessageWithSender['senderData']>>(new Map())

  // Fetch sender data for a message
  const fetchSenderData = useCallback(async (senderId: string) => {
    // Check cache
    if (senderCacheRef.current.has(senderId)) {
      return senderCacheRef.current.get(senderId)!
    }

    try {
      // Use chat endpoint which accepts user ID
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/chat/user/${senderId}`, {
        headers: {
          'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('auth_token') : ''}`,
        },
      })
      
      if (!response.ok) {
        throw new Error('User not found')
      }
      
      const userData = await response.json()
      const senderData = {
        id: userData.id.toString(),
        username: userData.username,
        name: userData.name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.username,
        avatar: userData.avatar,
        verified: userData.verified,
      }
      senderCacheRef.current.set(senderId, senderData)
      return senderData
    } catch (err) {
      console.error(`[useConversation] Failed to fetch sender ${senderId}:`, err)
      // If user not found, return basic data
      const senderData = {
        id: senderId,
        username: senderId,
        name: 'Unknown User',
      }
      senderCacheRef.current.set(senderId, senderData)
      return senderData
    }
  }, [])

  // Enrich messages with sender data
  const enrichMessages = useCallback(
    async (msgs: Message[]): Promise<MessageWithSender[]> => {
      const uniqueSenderIds = [...new Set(msgs.map((msg) => msg.senderId))]
      const senderDataMap = new Map<string, MessageWithSender['senderData']>()

      // Fetch all unique senders
      await Promise.all(
        uniqueSenderIds.map(async (senderId) => {
          const senderData = await fetchSenderData(senderId)
          senderDataMap.set(senderId, senderData)
        })
      )

      // Enrich messages
      return msgs.map((msg) => ({
        ...msg,
        senderData: senderDataMap.get(msg.senderId),
      }))
    },
    [fetchSenderData]
  )

  // Load conversation and messages
  useEffect(() => {
    if (!conversationId) {
      setConversation(null)
      setMessages([])
      setIsLoading(false)
      return
    }

    // Check if Firebase is configured
    if (typeof window !== 'undefined' && !verifyFirebaseConnection()) {
      setError(new Error('Firebase is not configured'))
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    // Load conversation
    getConversation(conversationId)
      .then((conv) => {
        if (!conv) {
          throw new Error('Conversation not found')
        }
        setConversation(conv)
        return getMessages(conversationId)
      })
      .then(async (msgs) => {
        const enriched = await enrichMessages(msgs)
        setMessages(enriched)
        setIsLoading(false)
      })
      .catch((err) => {
        console.error('[useConversation] Error loading conversation:', err)
        setError(err)
        setIsLoading(false)
      })

    // Subscribe to real-time message updates
    const unsubscribe = subscribeToMessages(conversationId, async (msgs) => {
      try {
        const enriched = await enrichMessages(msgs)
        setMessages(enriched)

        // Mark as read when new messages arrive
        if (user?.id && msgs.length > 0) {
          const lastMessage = msgs[msgs.length - 1]
          if (lastMessage.senderId !== user.id.toString()) {
            markReadInFirestore(conversationId, user.id.toString()).catch(console.error)
          }
        }
      } catch (err: any) {
        console.error('[useConversation] Error enriching messages:', err)
        
        // Check for permission errors
        if (err?.code === 'permission-denied' || err?.message?.includes('Missing or insufficient permissions')) {
          console.error('[useConversation] PERMISSION ERROR: Please update Firestore security rules!')
        }
      }
    })

    unsubscribeMessagesRef.current = unsubscribe

    // Mark conversation as read when opened
    if (user?.id) {
      markReadInFirestore(conversationId, user.id.toString()).catch(console.error)
    }

    return () => {
      if (unsubscribeMessagesRef.current) {
        unsubscribeMessagesRef.current()
        unsubscribeMessagesRef.current = null
      }
    }
  }, [conversationId, user, enrichMessages])

  // Send a message
  const sendMessage = useCallback(
    async (text: string, attachments?: string[]): Promise<void> => {
      if (!conversationId || !user?.id) {
        throw new Error('Conversation ID and user ID are required')
      }

      if (!text.trim() && (!attachments || attachments.length === 0)) {
        return
      }

      setIsSending(true)
      try {
        await sendMessageToFirestore(conversationId, user.id.toString(), text, attachments)
      } catch (err) {
        console.error('[useConversation] Error sending message:', err)
        throw err
      } finally {
        setIsSending(false)
      }
    },
    [conversationId, user]
  )

  // Mark conversation as read
  const markAsRead = useCallback(async () => {
    if (!conversationId || !user?.id) {
      return
    }

    try {
      await markReadInFirestore(conversationId, user.id.toString())
    } catch (err) {
      console.error('[useConversation] Error marking as read:', err)
    }
  }, [conversationId, user])

  return {
    conversation,
    messages,
    isLoading,
    error,
    isSending,
    sendMessage,
    markAsRead,
  }
}

