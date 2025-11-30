/**
 * Like Comment Edge Function
 * POST /functions/v1/comment-like
 * Body: { commentId: string }
 * Toggles like status
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
      `SELECT id, "userId" FROM comments WHERE id = $1`,
      [commentId]
    )

    if (!comment) {
      throw new AppError('Comment not found', 404)
    }

    // Check if already liked
    const existing = await queryOne(
      `SELECT id FROM likes WHERE "userId" = $1 AND "commentId" = $2`,
      [user.id, commentId]
    )

    if (existing) {
      // Unlike
      await query(
        `DELETE FROM likes WHERE id = $1`,
        [existing.id]
      )

      return addCorsHeaders(
        new Response(JSON.stringify({ liked: false }), {
          headers: { 'Content-Type': 'application/json' },
        })
      )
    } else {
      // Like
      await query(
        `INSERT INTO likes ("userId", "commentId", "createdAt")
         VALUES ($1, $2, NOW())`,
        [user.id, commentId]
      )

      // Create notification if not liking own comment
      if (comment.userId !== user.id) {
        const liker = await queryOne(
          `SELECT "firstName", "lastName", username FROM users WHERE id = $1`,
          [user.id]
        )

        if (liker) {
          const likerName = `${liker.firstName} ${liker.lastName}`.trim() || liker.username
          await query(
            `INSERT INTO notifications ("userId", type, title, message, "actionUrl", "createdAt")
             VALUES ($1, $2, $3, $4, $5, NOW())`,
            [
              comment.userId,
              'comment_like',
              'Comment Liked',
              `${likerName} liked your comment`,
              '/feed'
            ]
          )
        }
      }

      return addCorsHeaders(
        new Response(JSON.stringify({ liked: true }), {
          headers: { 'Content-Type': 'application/json' },
        })
      )
    }
  } catch (error) {
    return addCorsHeaders(handleError(error))
  }
})


