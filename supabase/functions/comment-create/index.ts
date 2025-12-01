/**
 * Create Comment Edge Function
 * POST /functions/v1/comment-create
 * Body: { eventId: string, content: string, parentId?: string }
 * Creates a new comment
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
    const { eventId, content, parentId } = body

    if (!eventId || !content) {
      throw new AppError('Event ID and content are required', 400)
    }

    // Verify event exists
    const event = await queryOne(
      `SELECT id, "organizationId", title FROM events WHERE id = $1`,
      [eventId]
    )

    if (!event) {
      throw new AppError('Event not found', 404)
    }

    // Create comment
    const result = await queryOne(
      `INSERT INTO comments ("eventId", "userId", content, "parentId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING id, "createdAt"`,
      [eventId, user.id, content, parentId || null]
    )

    // Get commenter info
    const commenter = await queryOne(
      `SELECT "firstName", "lastName", username FROM users WHERE id = $1`,
      [user.id]
    )

    // Create notification for event organizer (if not commenting on own event)
    if (event.organizationId !== user.id && commenter) {
      const commenterName = `${commenter.firstName} ${commenter.lastName}`.trim() || commenter.username
      
      await query(
        `INSERT INTO notifications ("userId", type, title, message, "actionUrl", "createdAt")
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          event.organizationId,
          'comment',
          'New Comment',
          `${commenterName} commented on your event "${event.title}"`,
          `/event/${eventId}`
        ]
      )
    }

    // Get full comment with user data
    const comment = await queryOne(
      `SELECT c.*, 
              u.id as user_id, u."firstName" as user_firstName, u."lastName" as user_lastName,
              u.username as user_username, u.avatar as user_avatar, u.verified as user_verified
       FROM comments c
       JOIN users u ON u.id = c."userId"
       WHERE c.id = $1`,
      [result.id]
    )

    const response = {
      id: comment.id,
      user: {
        id: comment.user_id,
        name: `${comment.user_firstName} ${comment.user_lastName}`.trim(),
        username: comment.user_username,
        avatar: comment.user_avatar,
        verified: comment.user_verified,
      },
      content: comment.content,
      timestamp: comment.createdAt,
      likes: 0,
      dislikes: 0,
      liked: false,
      disliked: false,
      saved: false,
      awarded: false,
      replies: [],
    }

    return addCorsHeaders(
      new Response(JSON.stringify(response), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      })
    )
  } catch (error) {
    return addCorsHeaders(handleError(error))
  }
})




