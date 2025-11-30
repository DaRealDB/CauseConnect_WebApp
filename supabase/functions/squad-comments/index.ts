/**
 * Get Squad Post Comments Edge Function
 * GET /functions/v1/squad-comments?postId=xxx&page=1&limit=10
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
    const { user: currentUser } = await getUserFromRequest(req)
    const url = new URL(req.url)
    const postId = url.searchParams.get('postId')
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    if (!postId) {
      throw new AppError('Post ID is required', 400)
    }

    // Get comments
    const comments = await query(
      `SELECT sc.*,
              u.id as user_id, u."firstName" as user_firstName, u."lastName" as user_lastName,
              u.username as user_username, u.avatar as user_avatar, u.verified as user_verified,
              (SELECT COUNT(*) FROM squad_post_likes WHERE "squadPostId" = sc.id AND "commentId" IS NOT NULL) as likes_count
       FROM squad_post_comments sc
       JOIN users u ON u.id = sc."userId"
       WHERE sc."squadPostId" = $1 AND sc."parentId" IS NULL
       ORDER BY sc."createdAt" DESC
       LIMIT $2 OFFSET $3`,
      [postId, limit, skip]
    )

    // Get total count
    const totalResult = await queryOne(
      `SELECT COUNT(*) as count FROM squad_post_comments WHERE "squadPostId" = $1 AND "parentId" IS NULL`,
      [postId]
    )
    const total = parseInt(totalResult?.count || '0')

    // Format comments
    const formattedComments = await Promise.all(
      comments.map(async (comment: any) => {
        let liked = false
        if (currentUser) {
          const likeCheck = await queryOne(
            `SELECT id FROM squad_post_likes WHERE "commentId" = $1 AND "userId" = $2`,
            [comment.id, currentUser.id]
          )
          liked = !!likeCheck
        }

        // Get replies
        const replies = await query(
          `SELECT sc.*,
                  u.id as user_id, u."firstName" as user_firstName, u."lastName" as user_lastName,
                  u.username as user_username, u.avatar as user_avatar
           FROM squad_post_comments sc
           JOIN users u ON u.id = sc."userId"
           WHERE sc."parentId" = $1
           ORDER BY sc."createdAt" ASC
           LIMIT 5`,
          [comment.id]
        )

        return {
          id: comment.id,
          content: comment.content,
          user: {
            id: comment.user_id,
            name: `${comment.user_firstName} ${comment.user_lastName}`.trim(),
            username: comment.user_username,
            avatar: comment.user_avatar,
            verified: comment.user_verified,
          },
          likes: parseInt(comment.likes_count),
          liked,
          replies: replies.map((r: any) => ({
            id: r.id,
            content: r.content,
            user: {
              id: r.user_id,
              name: `${r.user_firstName} ${r.user_lastName}`.trim(),
              username: r.user_username,
              avatar: r.user_avatar,
            },
            createdAt: r.createdAt,
          })),
          createdAt: comment.createdAt,
        }
      })
    )

    return addCorsHeaders(
      new Response(
        JSON.stringify({
          data: formattedComments,
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

