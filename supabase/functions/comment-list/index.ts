/**
 * Comment List Edge Function
 * GET /functions/v1/comment-list?eventId=xxx
 * Returns comments for an event
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
    const { user: currentUser } = await getUserFromRequest(req)
    const url = new URL(req.url)
    const eventId = url.searchParams.get('eventId')
    
    if (!eventId) {
      throw new AppError('Event ID is required', 400)
    }

    // Get top-level comments (no parent)
    const comments = await query(
      `SELECT c.*, 
              u.id as user_id, u."firstName" as user_firstName, u."lastName" as user_lastName,
              u.username as user_username, u.avatar as user_avatar, u.verified as user_verified,
              (SELECT COUNT(*) FROM likes WHERE "commentId" = c.id) as likes_count
       FROM comments c
       JOIN users u ON u.id = c."userId"
       WHERE c."eventId" = $1 AND c."parentId" IS NULL
       ORDER BY c."createdAt" DESC`,
      [eventId]
    )

    // Get replies for each comment
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment: any) => {
        // Get replies
        const replies = await query(
          `SELECT c.*, 
                  u.id as user_id, u."firstName" as user_firstName, u."lastName" as user_lastName,
                  u.username as user_username, u.avatar as user_avatar, u.verified as user_verified
           FROM comments c
           JOIN users u ON u.id = c."userId"
           WHERE c."parentId" = $1
           ORDER BY c."createdAt" ASC`,
          [comment.id]
        )

        // Check if current user liked/saved/awarded this comment
        let liked = false
        let saved = false
        let awarded = false

        if (currentUser) {
          const [likeCheck, bookmarkCheck, awardCheck] = await Promise.all([
            query(`SELECT id FROM likes WHERE "userId" = $1 AND "commentId" = $2`, [currentUser.id, comment.id]),
            query(`SELECT id FROM bookmarks WHERE "userId" = $1 AND "commentId" = $2`, [currentUser.id, comment.id]),
            query(`SELECT id FROM awards WHERE "userId" = $1 AND "commentId" = $2`, [currentUser.id, comment.id]),
          ])
          liked = likeCheck.length > 0
          saved = bookmarkCheck.length > 0
          awarded = awardCheck.length > 0
        }

        return {
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
          likes: parseInt(comment.likes_count),
          dislikes: 0,
          liked,
          disliked: false,
          saved,
          awarded,
          replies: replies.map((reply: any) => ({
            id: reply.id,
            user: {
              id: reply.user_id,
              name: `${reply.user_firstName} ${reply.user_lastName}`.trim(),
              username: reply.user_username,
              avatar: reply.user_avatar,
              verified: reply.user_verified,
            },
            content: reply.content,
            timestamp: reply.createdAt,
            likes: 0,
            dislikes: 0,
            liked: false,
            disliked: false,
            saved: false,
            awarded: false,
            replies: [],
          })),
        }
      })
    )

    return addCorsHeaders(
      new Response(JSON.stringify(commentsWithReplies), {
        headers: { 'Content-Type': 'application/json' },
      })
    )
  } catch (error) {
    return addCorsHeaders(handleError(error))
  }
})




