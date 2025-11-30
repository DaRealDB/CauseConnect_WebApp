/**
 * Get Post Participants Edge Function
 * GET /functions/v1/post-participants
 * Query params: postId, page, limit
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

    if (req.method !== 'GET') {
      throw new AppError('Method not allowed', 405)
    }

    const url = new URL(req.url)
    const postId = url.searchParams.get('postId')
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    if (!postId) {
      throw new AppError('postId is required', 400)
    }

    const participants = await query(
      `SELECT pp.*, u.id as "userId", u."firstName", u."lastName", u.username, u.avatar, u.verified
       FROM post_participants pp
       JOIN users u ON pp."userId" = u.id
       WHERE pp."postId" = $1
       ORDER BY pp."createdAt" DESC
       LIMIT $2 OFFSET $3`,
      [postId, limit, skip]
    )

    const totalResult = await query(
      `SELECT COUNT(*) as count FROM post_participants WHERE "postId" = $1`,
      [postId]
    )
    const total = parseInt(totalResult[0]?.count || '0')

    return addCorsHeaders(
      new Response(
        JSON.stringify({
          participants,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      )
    )
  } catch (error) {
    return addCorsHeaders(handleError(error))
  }
})

