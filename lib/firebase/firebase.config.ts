import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getFirestore, Firestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase only once (only if config is valid)
let app: FirebaseApp | undefined

// Check if all required config values are present before initializing
const hasValidConfig = Object.values(firebaseConfig).every((value) => value !== undefined && value !== '')

if (hasValidConfig && getApps().length === 0) {
  try {
    app = initializeApp(firebaseConfig)
  } catch (error) {
    console.error('[Firebase] Error initializing Firebase:', error)
    app = undefined
  }
} else if (getApps().length > 0) {
  app = getApps()[0]
}

export const firebaseApp = app

// Verify Firebase connection
export function verifyFirebaseConnection(): boolean {
  // Check the actual config values instead of process.env
  // (Next.js embeds NEXT_PUBLIC_* vars at build time)
  const configValues = [
    firebaseConfig.apiKey,
    firebaseConfig.authDomain,
    firebaseConfig.projectId,
    firebaseConfig.storageBucket,
    firebaseConfig.messagingSenderId,
    firebaseConfig.appId,
  ]

  const missingValues = configValues.filter(
    (value) => !value || value === '' || value === undefined
  )

  if (missingValues.length > 0) {
    console.error('[Firebase] Missing Firebase configuration values. Please check your environment variables.')
    console.error('[Firebase] Config check:', {
      apiKey: firebaseConfig.apiKey ? '✓' : '✗',
      authDomain: firebaseConfig.authDomain ? '✓' : '✗',
      projectId: firebaseConfig.projectId ? '✓' : '✗',
      storageBucket: firebaseConfig.storageBucket ? '✓' : '✗',
      messagingSenderId: firebaseConfig.messagingSenderId ? '✓' : '✗',
      appId: firebaseConfig.appId ? '✓' : '✗',
    })
    return false
  }

  if (!app) {
    console.error('[Firebase] Firebase app not initialized. Config values exist but initialization failed.')
    return false
  }

  console.log('[Firebase] Firebase initialized successfully')
  return true
}

