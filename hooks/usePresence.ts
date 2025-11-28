/**
 * Hook for managing user online/offline status
 */

import { useState, useEffect, useCallback } from 'react'
import {
  updateUserPresence,
  subscribeToUserPresence,
  type UserPresence,
} from '@/lib/firebase/chat-enhanced'
import { verifyFirebaseConnection } from '@/lib/firebase/firebase.config'

interface UsePresenceOptions {
  userId: string | null
  enabled?: boolean
}

export function usePresence({ userId, enabled = true }: UsePresenceOptions) {
  const [presence, setPresence] = useState<UserPresence | null>(null)
  const [isOnline, setIsOnline] = useState(false)

  // Update presence when window visibility changes
  useEffect(() => {
    if (!enabled || !userId || !verifyFirebaseConnection()) return

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        // User went offline or switched tabs
        await updateUserPresence(userId, false, 'offline')
      } else {
        // User came back online
        await updateUserPresence(userId, true, 'online')
      }
    }

    const handleOnline = async () => {
      if (userId) {
        await updateUserPresence(userId, true, 'online')
      }
    }

    const handleOffline = async () => {
      if (userId) {
        await updateUserPresence(userId, false, 'offline')
      }
    }

    // Set initial online status
    updateUserPresence(userId, !document.hidden, 'online').catch(console.error)

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Set offline when component unmounts
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      if (userId) {
        updateUserPresence(userId, false, 'offline').catch(console.error)
      }
    }
  }, [userId, enabled])

  // Subscribe to presence for another user
  const subscribeToUser = useCallback(
    (targetUserId: string, callback: (presence: UserPresence | null) => void) => {
      if (!enabled || !verifyFirebaseConnection()) {
        callback(null)
        return () => {}
      }

      return subscribeToUserPresence(targetUserId, callback)
    },
    [enabled]
  )

  return {
    presence,
    isOnline,
    subscribeToUser,
  }
}


