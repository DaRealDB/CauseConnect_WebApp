/**
 * Block User for Chat Edge Function
 * POST /functions/v1/chat-block-user
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
      return addCorsHeaders(
        new Response(JSON.stringify({ message: 'User already blocked' }), {
          headers: { 'Content-Type': 'application/json' },
        })
      )
    }

    // Block user
    await query(
      `INSERT INTO blocks ("userId", "blockedUserId", "createdAt")
       VALUES ($1, $2, NOW())`,
      [user.id, blockedUserId]
    )

    return addCorsHeaders(
      new Response(JSON.stringify({ message: 'User blocked successfully' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    )
  } catch (error) {
    return addCorsHeaders(handleError(error))
  }
})

