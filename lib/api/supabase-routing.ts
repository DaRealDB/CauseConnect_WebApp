/**
 * Supabase Edge Functions Routing Map
 * Maps Express API endpoints to Supabase Edge Function names
 */

const IS_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL && 
                   process.env.NEXT_PUBLIC_API_URL?.includes('supabase.co/functions/v1')

/**
 * Route mapping: Express endpoint -> Supabase Edge Function name
 */
export const SUPABASE_ROUTES: Record<string, string> = {
  // Auth
  '/auth/register': 'auth-register',
  '/auth/login': 'auth-login',
  '/auth/me': 'auth-me',
  '/auth/refresh': 'auth-refresh',
  '/auth/logout': 'auth-logout',
  
  // Users
  '/users/search': 'user-search',
  '/users/:username': 'user-profile',
  '/users/profile': 'user-update',
  '/users/avatar': 'user-avatar',
  '/users/cover': 'user-cover',
  '/users/:id/follow': 'user-follow',
  '/users/:id/isFollowing': 'user-is-following',
  
  // Events
  '/events': 'event-list',
  '/events/:id': 'event-detail',
  '/events/:id/support': 'event-support',
  '/events/:id/bookmark': 'event-bookmark',
  '/events/bookmarked': 'event-bookmarked',
  
  // Posts
  '/posts': 'post-list',
  '/posts/:id/like': 'post-like',
  '/posts/:id/bookmark': 'post-bookmark',
  
  // Comments
  '/comments/events/:eventId/comments': 'comment-list',
  '/comments/:id/like': 'comment-like',
  
  // Donations
  '/donations': 'donation-list',
  
  // Settings
  '/settings': 'settings-get',
  
  // Squads
  '/squads': 'squad-list',
  '/squads/:id': 'squad-detail',
  
  // Chat helpers
  '/chat/user/:userId': 'chat-user-profile',
  '/chat/block/:userId': 'chat-block-user',
}

/**
 * Check if using Supabase Edge Functions
 */
export function isUsingSupabase(): boolean {
  return IS_SUPABASE || false
}

/**
 * Convert Express endpoint to Supabase Edge Function name
 */
export function getSupabaseFunctionName(endpoint: string, method: string = 'GET'): string | null {
  // Remove query params
  const path = endpoint.split('?')[0]
  
  // Try exact match first
  if (SUPABASE_ROUTES[path]) {
    return SUPABASE_ROUTES[path]
  }
  
  // Try pattern matching for dynamic routes
  for (const [pattern, functionName] of Object.entries(SUPABASE_ROUTES)) {
    const regex = new RegExp('^' + pattern.replace(/:[^/]+/g, '[^/]+') + '$')
    if (regex.test(path)) {
      return functionName
    }
  }
  
  // No mapping found - use Express backend
  return null
}

/**
 * Build Supabase Edge Function URL
 */
export function buildSupabaseFunctionURL(functionName: string, queryParams?: Record<string, string>): string {
  const baseURL = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!baseURL) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured')
  }
  
  const functionURL = `${baseURL}/functions/v1/${functionName}`
  
  if (queryParams && Object.keys(queryParams).length > 0) {
    const params = new URLSearchParams(queryParams)
    return `${functionURL}?${params.toString()}`
  }
  
  return functionURL
}


