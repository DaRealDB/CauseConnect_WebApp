/**
 * Supabase client helper for Edge Functions
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

export function createSupabaseClient(request: Request) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

  // Get authorization header
  const authHeader = request.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '') ?? null

  // Create client with service role key for admin operations
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return { supabase, token }
}

export async function getUserFromRequest(request: Request) {
  const { supabase, token } = createSupabaseClient(request)

  if (!token) {
    return { user: null, error: 'No authorization token' }
  }

  try {
    // Verify token and get user
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token)

    if (error || !user) {
      return { user: null, error: error?.message ?? 'Invalid token' }
    }

    return { user, error: null }
  } catch (error) {
    return { user: null, error: 'Failed to verify token' }
  }
}


