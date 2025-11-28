"use client"

import { useEffect, useRef } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useChat } from "@/hooks/useChat"
import { useBrowserNotifications } from "@/hooks/useChatNotifications"
import { subscribeToMessages } from "@/lib/firebase/chat"

/**
 * Manages browser notifications for chat messages
 * Should be mounted once at the chat page level
 */
export function ChatNotificationManager() {
  const { user } = useAuth()
  const { conversations } = useChat()
  const { showChatNotification, canNotify } = useBrowserNotifications(true)
  const lastMessageIdsRef = useRef<Map<string, string>>(new Map())

  useEffect(() => {
    if (!user?.id || !canNotify || conversations.length === 0) {
      return
    }

    const unsubscribes: Array<() => void> = []

    conversations.forEach((conv) => {
      const conversationName =
        conv.type === 'private' && conv.otherParticipant
          ? conv.otherParticipant.name || conv.otherParticipant.username || 'Someone'
          : conv.type === 'group'
            ? conv.groupName || 'Group Chat'
            : 'Unknown'

      // Subscribe to messages in this conversation
      const unsubscribe = subscribeToMessages(conv.id, (messages) => {
        if (messages.length === 0) return

        const lastMessage = messages[messages.length - 1]
        const lastMessageId = lastMessageIdsRef.current.get(conv.id)

        // Only show notification if:
        // 1. Message is from someone else
        // 2. We haven't seen this message before
        // 3. Page is not visible (to avoid duplicate notifications)
        if (
          lastMessage.senderId !== user.id?.toString() &&
          lastMessage.id !== lastMessageId &&
          document.visibilityState !== 'visible'
        ) {
          showChatNotification(conversationName, lastMessage.text.substring(0, 100), conv.id)
          lastMessageIdsRef.current.set(conv.id, lastMessage.id)
        }
      })

      unsubscribes.push(unsubscribe)
    })

    return () => {
      unsubscribes.forEach((unsub) => unsub())
    }
  }, [conversations, user?.id, canNotify, showChatNotification])

  return null // This is a manager component, no UI
}

