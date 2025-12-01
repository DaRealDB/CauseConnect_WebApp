/**
 * Firebase Error Handler
 * Provides user-friendly error messages for Firebase errors
 */

export function getFirebaseErrorMessage(error: any): string {
  if (!error) {
    return 'An unknown error occurred'
  }

  const code = error.code || ''
  const message = error.message || ''

  // Firebase Firestore errors
  if (code === 'permission-denied' || message.includes('Missing or insufficient permissions')) {
    return 'Permission denied. Please check Firebase security rules are configured correctly.'
  }

  if (code === 'unavailable') {
    return 'Firebase service is temporarily unavailable. Please try again.'
  }

  if (code === 'unauthenticated') {
    return 'Authentication required. Please log in again.'
  }

  if (code === 'not-found') {
    return 'Resource not found.'
  }

  // Firebase Storage errors
  if (code === 'storage/unauthorized') {
    return 'Storage access denied. Please check Firebase Storage security rules.'
  }

  if (code === 'storage/quota-exceeded') {
    return 'Storage quota exceeded. Please contact support.'
  }

  if (code === 'storage/unauthenticated') {
    return 'Storage authentication required. Please log in again.'
  }

  if (code === 'storage/canceled') {
    return 'Upload was canceled.'
  }

  // Generic error messages
  if (message) {
    return message
  }

  if (code) {
    return `Error: ${code}`
  }

  return 'An unexpected error occurred'
}

export function isFirebasePermissionError(error: any): boolean {
  if (!error) return false
  
  const code = error.code || ''
  const message = (error.message || '').toLowerCase()
  
  return (
    code === 'permission-denied' ||
    code === 'storage/unauthorized' ||
    message.includes('missing or insufficient permissions') ||
    message.includes('permission denied')
  )
}





