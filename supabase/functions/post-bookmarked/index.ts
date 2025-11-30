/**
 * Get Bookmarked Posts Edge Function
 * GET /functions/v1/post-bookmarked
 * Query params: page, limit
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
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const bookmarks = await query(
      `SELECT b.*, p.*, u.id as "userId", u."firstName", u."lastName", u.username, u.avatar, u.verified
       FROM bookmarks b
       JOIN posts p ON b."postId" = p.id
       JOIN users u ON p."userId" = u.id
       WHERE b."userId" = $1 AND b."postId" IS NOT NULL AND b."eventId" IS NULL
       ORDER BY b."createdAt" DESC
       LIMIT $2 OFFSET $3`,
      [user.id, limit, skip]
    )

    const totalResult = await query(
      `SELECT COUNT(*) as count FROM bookmarks 
       WHERE "userId" = $1 AND "postId" IS NOT NULL AND "eventId" IS NULL`,
      [user.id]
    )
    const total = parseInt(totalResult[0]?.count || '0')

    return addCorsHeaders(
      new Response(
        JSON.stringify({
          posts: bookmarks,
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

