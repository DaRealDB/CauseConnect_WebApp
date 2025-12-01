/**
 * Post Like Edge Function
 * POST /functions/v1/post-like
 * Body: { postId: string }
 * Likes a post (toggles like status)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors, addCorsHeaders } from '../_shared/cors.ts'
import { getUserFromRequest } from '../_shared/supabase.ts'
import { handleError, AppError } from '../_shared/errors.ts'
import { query, queryOne } from '../_shared/db.ts'

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

    // Check if already liked
    const existing = await queryOne(
      `SELECT id FROM likes WHERE "userId" = $1 AND "postId" = $2`,
      [user.id, postId]
    )

    if (existing) {
      // Unlike - remove like
      await query(
        `DELETE FROM likes WHERE id = $1`,
        [existing.id]
      )

      return addCorsHeaders(
        new Response(JSON.stringify({ success: true, liked: false }), {
          headers: { 'Content-Type': 'application/json' },
        })
      )
    } else {
      // Like - create like
      await query(
        `INSERT INTO likes ("userId", "postId", "createdAt") 
         VALUES ($1, $2, NOW())`,
        [user.id, postId]
      )

      // Create notification for post author (if not liking own post)
      if (post.userId !== user.id) {
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
              post.userId,
              'post_like',
              'Post Liked',
              `${likerName} liked your post`,
              '/feed'
            ]
          )
        }
      }

      return addCorsHeaders(
        new Response(JSON.stringify({ success: true, liked: true }), {
          headers: { 'Content-Type': 'application/json' },
        })
      )
    }
  } catch (error) {
    return addCorsHeaders(handleError(error))
  }
})




