/**
 * Chat User Profile Edge Function
 * GET /functions/v1/chat-user-profile?userId=xxx
 * Returns user profile for chat (helper endpoint)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors, addCorsHeaders } from '../_shared/cors.ts'
import { getUserFromRequest } from '../_shared/supabase.ts'
import { handleError, AppError } from '../_shared/errors.ts'
import { queryOne } from '../_shared/db.ts'

serve(async (req: Request) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const { user: currentUser, error: authError } = await getUserFromRequest(req)
    if (authError || !currentUser) {
      throw new AppError('Unauthorized', 401)
    }

    const url = new URL(req.url)
    const userId = url.searchParams.get('userId')
    
    if (!userId) {
      throw new AppError('User ID is required', 400)
    }

    // Get user profile
    const user = await queryOne(
      `SELECT id, username, "firstName", "lastName", email, avatar, verified
       FROM users 
       WHERE id = $1`,
      [userId]
    )

    if (!user) {
      throw new AppError('User not found', 404)
    }

    // Format response for chat
    const response = {
      id: user.id,
      username: user.username,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      avatar: user.avatar,
      verified: user.verified,
    }

    return addCorsHeaders(
      new Response(JSON.stringify(response), {
        headers: { 'Content-Type': 'application/json' },
      })
    )
  } catch (error) {
    return addCorsHeaders(handleError(error))
  }
})




