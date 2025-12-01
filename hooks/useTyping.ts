/**
 * Hook for managing typing indicators
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { setTypingIndicator, subscribeToTyping, type TypingIndicator } from '@/lib/firebase/chat-enhanced'
import { verifyFirebaseConnection } from '@/lib/firebase/firebase.config'

interface UseTypingOptions {
  conversationId: string | null
  userId: string | null
  enabled?: boolean
}

export function useTyping({ conversationId, userId, enabled = true }: UseTypingOptions) {
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  // Subscribe to typing indicators
  useEffect(() => {
    if (!enabled || !conversationId || !verifyFirebaseConnection()) {
      setTypingUsers([])
      return
    }

    const unsubscribe = subscribeToTyping(conversationId, (users) => {
      // Filter out current user
      const otherUsers = users.filter((u) => u.userId !== userId)
      
      // Filter out typing indicators older than 3 seconds
      const now = Date.now()
      const recentUsers = otherUsers.filter((u) => {
        const typingTime = u.timestamp instanceof Date ? u.timestamp.getTime() : 0
        return now - typingTime < 3000
      })

      setTypingUsers(recentUsers)
    })

    unsubscribeRef.current = unsubscribe

    return () => {
      unsubscribe()
      unsubscribeRef.current = null
    }
  }, [conversationId, userId, enabled])

  // Clear typing indicator when component unmounts or conversation changes
  useEffect(() => {
    return () => {
      if (conversationId && userId) {
        setTypingIndicator(conversationId, userId, false).catch(console.error)
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [conversationId, userId])

  // Set typing indicator
  const startTyping = useCallback(async () => {
    if (!conversationId || !userId || !enabled) return

    if (!isTyping) {
      setIsTyping(true)
      await setTypingIndicator(conversationId, userId, true)
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(async () => {
      if (conversationId && userId) {
        await setTypingIndicator(conversationId, userId, false)
        setIsTyping(false)
      }
    }, 3000)
  }, [conversationId, userId, enabled, isTyping])

  // Stop typing
  const stopTyping = useCallback(async () => {
    if (!conversationId || !userId || !isTyping) return

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }

    setIsTyping(false)
    await setTypingIndicator(conversationId, userId, false)
  }, [conversationId, userId, isTyping])

  return {
    typingUsers,
    isTyping,
    startTyping,
    stopTyping,
  }
}





