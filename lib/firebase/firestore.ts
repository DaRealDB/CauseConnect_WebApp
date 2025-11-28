import { getFirestore, Firestore } from 'firebase/firestore'
import { firebaseApp } from './firebase.config'

// Export Firestore instance (only if Firebase app is initialized)
export let db: Firestore | undefined

if (firebaseApp) {
  try {
    db = getFirestore(firebaseApp)
  } catch (error) {
    console.error('[Firestore] Error initializing Firestore:', error)
    db = undefined
  }
}

// Verify Firestore connection
export function verifyFirestoreConnection(): boolean {
  if (!firebaseApp) {
    console.error('[Firestore] Firebase app not initialized')
    return false
  }
  
  if (!db) {
    console.error('[Firestore] Firestore instance not available')
    return false
  }
  
  console.log('[Firestore] Firestore instance created successfully')
  return true
}

