/**
 * Participate in Post Edge Function
 * POST /functions/v1/post-participate
 * Body: { postId: string }
 * Toggles participation status
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
      `SELECT id, "userId" FROM posts WHERE id = $1`,
      [postId]
    )

    if (!post) {
      throw new AppError('Post not found', 404)
    }

    // Check if already participating
    const existing = await queryOne(
      `SELECT id FROM post_participants WHERE "userId" = $1 AND "postId" = $2`,
      [user.id, postId]
    )

    if (existing) {
      // Unparticipate
      await query(
        `DELETE FROM post_participants WHERE id = $1`,
        [existing.id]
      )

      return addCorsHeaders(
        new Response(JSON.stringify({ isParticipating: false }), {
          headers: { 'Content-Type': 'application/json' },
        })
      )
    } else {
      // Participate
      await query(
        `INSERT INTO post_participants ("userId", "postId", "createdAt")
         VALUES ($1, $2, NOW())`,
        [user.id, postId]
      )

      // Create notification if not participating in own post
      if (post.userId !== user.id) {
        const participant = await queryOne(
          `SELECT "firstName", "lastName", username FROM users WHERE id = $1`,
          [user.id]
        )

        if (participant) {
          const participantName = `${participant.firstName} ${participant.lastName}`.trim() || participant.username
          await query(
            `INSERT INTO notifications ("userId", type, title, message, "actionUrl", "createdAt")
             VALUES ($1, $2, $3, $4, $5, NOW())`,
            [
              post.userId,
              'post_participate',
              'New Participant',
              `${participantName} is participating in your post`,
              '/feed'
            ]
          )
        }
      }

      return addCorsHeaders(
        new Response(JSON.stringify({ isParticipating: true }), {
          headers: { 'Content-Type': 'application/json' },
        })
      )
    }
  } catch (error) {
    return addCorsHeaders(handleError(error))
  }
})




