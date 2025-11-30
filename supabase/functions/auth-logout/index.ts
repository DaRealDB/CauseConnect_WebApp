/**
 * Logout Edge Function
 * POST /functions/v1/auth-logout
 * Body: { refreshToken?: string }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors, addCorsHeaders } from '../_shared/cors.ts'
import { getUserFromRequest } from '../_shared/supabase.ts'
import { handleError, AppError } from '../_shared/errors.ts'
import { query } from '../_shared/db.ts'

serve(async (req: Request) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const { user } = await getUserFromRequest(req)
    const body = await req.json().catch(() => ({}))
    const { refreshToken } = body

    // Delete refresh token if provided
    if (refreshToken) {
      await query(`DELETE FROM refresh_tokens WHERE token = $1`, [refreshToken])
    }

    // Optionally delete all refresh tokens for user
    if (user) {
      await query(`DELETE FROM refresh_tokens WHERE "userId" = $1`, [user.id])
    }

    return addCorsHeaders(
      new Response(JSON.stringify({ message: 'Logged out successfully' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    )
  } catch (error) {
    // Don't fail logout even if there are errors
    return addCorsHeaders(
      new Response(JSON.stringify({ message: 'Logged out successfully' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    )
  }
})


