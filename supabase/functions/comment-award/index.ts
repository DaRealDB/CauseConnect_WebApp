/**
 * Award Comment Edge Function
 * POST /functions/v1/comment-award
 * Body: { commentId: string }
 * Awards a comment
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

    // Check if already awarded
    const existing = await queryOne(
      `SELECT id FROM awards WHERE "userId" = $1 AND "commentId" = $2`,
      [user.id, commentId]
    )

    if (existing) {
      return addCorsHeaders(
        new Response(JSON.stringify({ awarded: true, message: 'Already awarded' }), {
          headers: { 'Content-Type': 'application/json' },
        })
      )
    }

    // Create award
    await query(
      `INSERT INTO awards ("userId", "commentId", "createdAt")
       VALUES ($1, $2, NOW())`,
      [user.id, commentId]
    )

    // Create notification if not awarding own comment
    if (comment.userId !== user.id) {
      const awarder = await queryOne(
        `SELECT "firstName", "lastName", username FROM users WHERE id = $1`,
        [user.id]
      )

      if (awarder) {
        const awarderName = `${awarder.firstName} ${awarder.lastName}`.trim() || awarder.username
        await query(
          `INSERT INTO notifications ("userId", type, title, message, "actionUrl", "createdAt")
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [
            comment.userId,
            'award',
            'Comment Awarded',
            `${awarderName} awarded your comment`,
            '/feed'
          ]
        )
      }
    }

    return addCorsHeaders(
      new Response(JSON.stringify({ awarded: true, message: 'Comment awarded successfully' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    )
  } catch (error) {
    return addCorsHeaders(handleError(error))
  }
})


