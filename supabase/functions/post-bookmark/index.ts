/**
 * Bookmark Post Edge Function
 * POST /functions/v1/post-bookmark
 * Body: { postId: string }
 * Toggles bookmark status
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
    const { postId } = body

    if (!postId) {
      throw new AppError('Post ID is required', 400)
    }

    // Check if post exists
    const post = await queryOne(
      `SELECT id FROM posts WHERE id = $1`,
      [postId]
    )

    if (!post) {
      throw new AppError('Post not found', 404)
    }

    // Check if already bookmarked
    const existing = await queryOne(
      `SELECT id FROM bookmarks WHERE "userId" = $1 AND "postId" = $2`,
      [user.id, postId]
    )

    if (existing) {
      // Unbookmark
      await query(
        `DELETE FROM bookmarks WHERE id = $1`,
        [existing.id]
      )

      return addCorsHeaders(
        new Response(JSON.stringify({ bookmarked: false }), {
          headers: { 'Content-Type': 'application/json' },
        })
      )
    } else {
      // Bookmark
      await query(
        `INSERT INTO bookmarks ("userId", "postId", "createdAt")
         VALUES ($1, $2, NOW())`,
        [user.id, postId]
      )

      return addCorsHeaders(
        new Response(JSON.stringify({ bookmarked: true }), {
          headers: { 'Content-Type': 'application/json' },
        })
      )
    }
  } catch (error) {
    return addCorsHeaders(handleError(error))
  }
})


