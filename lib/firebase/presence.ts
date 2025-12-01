/**
 * User Presence tracking for online/offline status
 */

import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from './firestore'
import type { UserPresence } from './chat.types'

const ensureFirestore = () => {
  if (!db) {
    throw new Error('Firestore is not initialized')
  }
  return db
}

const timestampToDate = (timestamp: Date | Timestamp | undefined): Date | undefined => {
  if (!timestamp) return undefined
  if (timestamp instanceof Date) return timestamp
  if (timestamp instanceof Timestamp) return timestamp.toDate()
  return undefined
}

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
  }, (error) => {
    console.error('[Presence] Error subscribing to presence:', error)
    callback(null)
  })
}

/**
 * Get user presence (one-time fetch)
 */
export async function getUserPresence(userId: string): Promise<UserPresence | null> {
  ensureFirestore()
  const presenceRef = doc(db, 'presence', userId)
  const presenceDoc = await getDoc(presenceRef)

  if (!presenceDoc.exists()) {
    return null
  }

  const data = presenceDoc.data()
  return {
    userId,
    isOnline: data.isOnline || false,
    status: data.status || 'offline',
    lastSeen: timestampToDate(data.lastSeen),
  }
}





