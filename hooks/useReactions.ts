/**
 * Hook for managing message reactions
 */

import { useState, useCallback } from 'react'
import { toggleMessageReaction, type MessageReaction } from '@/lib/firebase/chat-enhanced'
import { toast } from 'sonner'

interface UseReactionsOptions {
  conversationId: string | null
  userId: string | null
}

export function useReactions({ conversationId, userId }: UseReactionsOptions) {
  const [isProcessing, setIsProcessing] = useState(false)

  const toggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!conversationId || !userId) {
        toast.error('You must be logged in to react to messages')
        return
      }

      if (isProcessing) return

      try {
        setIsProcessing(true)
        await toggleMessageReaction(conversationId, messageId, userId, emoji)
      } catch (error: any) {
        console.error('[useReactions] Error toggling reaction:', error)
        toast.error(error.message || 'Failed to toggle reaction')
      } finally {
        setIsProcessing(false)
      }
    },
    [conversationId, userId, isProcessing]
  )

  const getReactionCount = useCallback((reactions: MessageReaction | undefined, emoji: string): number => {
    if (!reactions || !reactions[emoji]) return 0
    return reactions[emoji].length
  }, [])

  const hasUserReacted = useCallback(
    (reactions: MessageReaction | undefined, emoji: string): boolean => {
      if (!reactions || !reactions[emoji] || !userId) return false
      return reactions[emoji].includes(userId)
    },
    [userId]
  )

  return {
    toggleReaction,
    getReactionCount,
    hasUserReacted,
    isProcessing,
  }
}


