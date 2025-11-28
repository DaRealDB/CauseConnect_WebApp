/**
 * Firebase Storage utilities for chat file uploads
 */

import { getStorage, ref, uploadBytes, getDownloadURL, StorageReference } from 'firebase/storage'
import { firebaseApp } from './firebase.config'

let storageInstance: ReturnType<typeof getStorage> | undefined

// Storage is optional - gracefully handle if not available
if (firebaseApp) {
  try {
    storageInstance = getStorage(firebaseApp)
    console.log('[Firebase Storage] Storage initialized successfully')
  } catch (error: any) {
    // Storage may not be enabled (requires payment) - that's okay
    if (error?.code === 'storage/unknown' || error?.message?.includes('storage')) {
      console.warn('[Firebase Storage] Storage not available (may require payment plan). File uploads will be disabled.')
    } else {
      console.warn('[Firebase Storage] Storage initialization failed:', error)
    }
    storageInstance = undefined
  }
} else {
  console.warn('[Firebase Storage] Firebase app not initialized, storage unavailable')
}

export const storage = storageInstance

/**
 * Verify Firebase Storage connection
 */
export function verifyStorageConnection(): boolean {
  if (!firebaseApp) {
    return false
  }
  
  if (!storageInstance) {
    return false // Storage not available (may require payment) - that's okay
  }
  
  return true
}

export function isStorageAvailable(): boolean {
  return verifyStorageConnection()
}

/**
 * Upload a file to Firebase Storage
 */
export async function uploadChatFile(
  file: File,
  conversationId: string,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<{ url: string; fileName: string; fileSize: number; type: string }> {
  if (!storage) {
    throw new Error('File upload is not available. Firebase Storage requires a paid plan.')
  }

  if (!conversationId || !userId) {
    throw new Error('Conversation ID and User ID are required')
  }

  try {
    // Create a unique filename
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `${conversationId}/${userId}/${timestamp}-${sanitizedName}`
    const storageRef = ref(storage, `chat/${fileName}`)

    console.log('[Firebase Storage] Starting upload:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      storagePath: `chat/${fileName}`,
    })

    // Upload file
    if (onProgress) {
      onProgress(10) // Initial progress
    }

    await uploadBytes(storageRef, file)
    
    if (onProgress) {
      onProgress(90) // Almost done
    }

    console.log('[Firebase Storage] File uploaded, getting download URL...')

    // Get download URL
    const url = await getDownloadURL(storageRef)
    
    if (onProgress) {
      onProgress(100) // Complete
    }

    console.log('[Firebase Storage] Upload successful:', url)

    // Determine file type
    let type: 'image' | 'file' | 'video' | 'audio' = 'file'
    if (file.type.startsWith('image/')) {
      type = 'image'
    } else if (file.type.startsWith('video/')) {
      type = 'video'
    } else if (file.type.startsWith('audio/')) {
      type = 'audio'
    }

    return {
      url,
      fileName: file.name,
      fileSize: file.size,
      type,
    }
  } catch (error: any) {
    console.error('[Firebase Storage] Upload error:', error)
    
    // Provide more helpful error messages
    if (error?.code === 'storage/unauthorized') {
      throw new Error('Storage upload unauthorized. Please check Firebase Storage security rules.')
    } else if (error?.code === 'storage/quota-exceeded') {
      throw new Error('Storage quota exceeded. Please contact support.')
    } else if (error?.code === 'storage/unauthenticated') {
      throw new Error('Storage authentication required. Please log in again.')
    } else if (error?.message) {
      throw new Error(`Upload failed: ${error.message}`)
    } else {
      throw new Error('Failed to upload file. Please check your connection and try again.')
    }
  }
}

/**
 * Upload multiple files
 */
export async function uploadChatFiles(
  files: File[],
  conversationId: string,
  userId: string
): Promise<Array<{ url: string; fileName: string; fileSize: number; type: string }>> {
  const uploadPromises = files.map((file) => uploadChatFile(file, conversationId, userId))
  return Promise.all(uploadPromises)
}

