/**
 * Unblock User Edge Function
 * DELETE /functions/v1/settings-unblock-user
 * Body: { userId: string }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors, addCorsHeaders } from '../_shared/cors.ts'
import { getUserFromRequest } from '../_shared/supabase.ts'
import { handleError, AppError } from '../_shared/errors.ts'
import { queryOne, query } from '../_shared/db.ts'

serve(async (req: Request) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const { user, error: authError } = await getUserFromRequest(req)
    if (authError || !user) {
      throw new AppError('Unauthorized', 401)
    }

    if (req.method !== 'DELETE') {
      throw new AppError('Method not allowed', 405)
    }

    const body = await req.json().catch(() => ({}))
    const userId = body.userId || new URL(req.url).searchParams.get('userId')

    if (!userId) {
      throw new AppError('User ID is required', 400)
    }

    // Check if blocked
    const existing = await queryOne(
      `SELECT id FROM blocks WHERE "userId" = $1 AND "blockedUserId" = $2`,
      [user.id, userId]
    )

    if (!existing) {
      throw new AppError('User is not blocked', 400)
    }

    // Unblock
    await query(
      `DELETE FROM blocks WHERE "userId" = $1 AND "blockedUserId" = $2`,
      [user.id, userId]
    )

    return addCorsHeaders(
      new Response(JSON.stringify({ message: 'User unblocked successfully' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    )
  } catch (error) {
    return addCorsHeaders(handleError(error))
  }
})

