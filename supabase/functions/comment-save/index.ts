/**
 * Save Comment Edge Function
 * POST /functions/v1/comment-save
 * Body: { commentId: string }
 * Saves a comment (toggles bookmark status)
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
    const { commentId } = body

    if (!commentId) {
      throw new AppError('Comment ID is required', 400)
    }

    // Check if comment exists
    const comment = await queryOne(
      `SELECT id FROM comments WHERE id = $1`,
      [commentId]
    )

    if (!comment) {
      throw new AppError('Comment not found', 404)
    }

    // Check if already saved
    const existing = await queryOne(
      `SELECT id FROM bookmarks WHERE "userId" = $1 AND "commentId" = $2`,
      [user.id, commentId]
    )

    if (existing) {
      // Unsave
      await query(
        `DELETE FROM bookmarks WHERE id = $1`,
        [existing.id]
      )

      return addCorsHeaders(
        new Response(JSON.stringify({ saved: false }), {
          headers: { 'Content-Type': 'application/json' },
        })
      )
    } else {
      // Save
      await query(
        `INSERT INTO bookmarks ("userId", "commentId", "createdAt")
         VALUES ($1, $2, NOW())`,
        [user.id, commentId]
      )

      return addCorsHeaders(
        new Response(JSON.stringify({ saved: true }), {
          headers: { 'Content-Type': 'application/json' },
        })
      )
    }
  } catch (error) {
    return addCorsHeaders(handleError(error))
  }
})


