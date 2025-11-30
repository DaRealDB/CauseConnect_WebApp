/**
 * Block User Edge Function
 * POST /functions/v1/settings-block-user
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

    if (req.method !== 'POST') {
      throw new AppError('Method not allowed', 405)
    }

    const body = await req.json()
    const { userId: blockedUserId } = body

    if (!blockedUserId) {
      throw new AppError('User ID is required', 400)
    }

    if (user.id === blockedUserId) {
      throw new AppError('Cannot block yourself', 400)
    }

    // Check if already blocked
    const existing = await queryOne(
      `SELECT id FROM blocks WHERE "userId" = $1 AND "blockedUserId" = $2`,
      [user.id, blockedUserId]
    )

    if (existing) {
      throw new AppError('User already blocked', 400)
    }

    // Get blocked user info
    const blockedUser = await queryOne(
      `SELECT id, username, "firstName", "lastName", avatar, verified
       FROM users WHERE id = $1`,
      [blockedUserId]
    )

    if (!blockedUser) {
      throw new AppError('User not found', 404)
    }

    // Block user
    await query(
      `INSERT INTO blocks ("userId", "blockedUserId", "createdAt")
       VALUES ($1, $2, NOW())`,
      [user.id, blockedUserId]
    )

    // Remove any follows in both directions
    await query(
      `DELETE FROM follows WHERE ("followerId" = $1 AND "followingId" = $2) OR ("followerId" = $2 AND "followingId" = $1)`,
      [user.id, blockedUserId]
    )

    const response = {
      id: blockedUser.id,
      userId: blockedUser.id,
      username: blockedUser.username,
      name: `${blockedUser.firstName} ${blockedUser.lastName}`.trim() || blockedUser.username,
      avatar: blockedUser.avatar,
      verified: blockedUser.verified,
      blockedAt: new Date().toISOString(),
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

