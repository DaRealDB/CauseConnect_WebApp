/**
 * Hook for chat notifications and badge counts
 */

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useChat } from './useChat'
import { verifyFirebaseConnection } from '@/lib/firebase/firebase.config'

interface ChatNotificationState {
  totalUnread: number
  unreadByConversation: { [conversationId: string]: number }
  hasNewMessages: boolean
}

/**
 * Hook to track unread chat messages across all conversations
 */
export function useChatNotifications(enabled: boolean = true) {
  const { user } = useAuth()
  const { conversations } = useChat()
  const [notificationState, setNotificationState] = useState<ChatNotificationState>({
    totalUnread: 0,
    unreadByConversation: {},
    hasNewMessages: false,
  })

  // Check if Firebase is configured
  const isFirebaseConfigured = typeof window !== 'undefined' && verifyFirebaseConnection()

  // Calculate unread counts from conversations
  useEffect(() => {
    if (!enabled || !user?.id || !isFirebaseConfigured) {
      setNotificationState({
        totalUnread: 0,
        unreadByConversation: {},
        hasNewMessages: false,
      })
      return
    }

    let totalUnread = 0
    const unreadByConversation: { [conversationId: string]: number } = {}
    let hasNewMessages = false

    conversations.forEach((conv) => {
      const unreadCount = conv.unreadCountForUser || 0
      if (unreadCount > 0) {
        totalUnread += unreadCount
        unreadByConversation[conv.id] = unreadCount
        hasNewMessages = true
      }
    })

    setNotificationState({
      totalUnread,
      unreadByConversation,
      hasNewMessages,
    })
  }, [conversations, user?.id, enabled, isFirebaseConfigured])

  return notificationState
}

/**
 * Hook to request browser notification permission and show notifications
 */
export function useBrowserNotifications(enabled: boolean = true) {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const { user } = useAuth()

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !('Notification' in window)) {
      return
    }

    setPermission(Notification.permission)

    // Request permission if not already granted or denied
    if (Notification.permission === 'default') {
      Notification.requestPermission().then((result) => {
        setPermission(result)
      })
    }
  }, [enabled])

  const requestPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false
    }

    const result = await Notification.requestPermission()
    setPermission(result)
    return result === 'granted'
  }, [])

  const showNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (!enabled || typeof window === 'undefined' || !('Notification' in window)) {
        return
      }

      if (Notification.permission !== 'granted') {
        return
      }

      // Only show notifications if page is not visible (to avoid duplicate notifications)
      if (document.visibilityState === 'visible') {
        return
      }

      const notificationOptions: NotificationOptions = {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      }

      new Notification(title, notificationOptions)
    },
    [enabled]
  )

  const showChatNotification = useCallback(
    (conversationName: string, message: string, conversationId?: string) => {
      const senderName = conversationName || 'Someone'
      showNotification(`${senderName} sent you a message`, {
        body: message,
        tag: conversationId || 'chat',
        requireInteraction: false,
        data: {
          conversationId,
          type: 'chat',
        },
      })
    },
    [showNotification]
  )

  return {
    permission,
    requestPermission,
    showNotification,
    showChatNotification,
    canNotify: permission === 'granted',
  }
}





