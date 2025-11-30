/**
 * Get Blocked Users Edge Function
 * GET /functions/v1/settings-blocked-users
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
    const { user, error: authError } = await getUserFromRequest(req)
    if (authError || !user) {
      throw new AppError('Unauthorized', 401)
    }

    const blockedUsers = await query(
      `SELECT b.id, b."blockedUserId", b."createdAt",
              u.id as user_id, u.username, u."firstName", u."lastName", 
              u.avatar, u.verified
       FROM blocks b
       JOIN users u ON u.id = b."blockedUserId"
       WHERE b."userId" = $1
       ORDER BY b."createdAt" DESC`,
      [user.id]
    )

    const formatted = blockedUsers.map((b: any) => ({
      id: b.id,
      userId: b.blockedUserId,
      username: b.username,
      name: `${b.firstName} ${b.lastName}`.trim() || b.username,
      avatar: b.avatar,
      verified: b.verified,
      blockedAt: b.createdAt,
    }))

    return addCorsHeaders(
      new Response(JSON.stringify(formatted), {
        headers: { 'Content-Type': 'application/json' },
      })
    )
  } catch (error) {
    return addCorsHeaders(handleError(error))
  }
})

