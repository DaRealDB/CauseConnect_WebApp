/**
 * Get Squad Posts Edge Function
 * GET /functions/v1/squad-posts?id=xxx&page=1&limit=10
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
    const squadId = url.searchParams.get('id')
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    if (!squadId) {
      throw new AppError('Squad ID is required', 400)
    }

    // Verify squad exists
    const squad = await queryOne(
      `SELECT id FROM squads WHERE id = $1`,
      [squadId]
    )

    if (!squad) {
      throw new AppError('Squad not found', 404)
    }

    // Check if user is member (optional - can make posts public later)
    if (currentUser) {
      const member = await queryOne(
        `SELECT id FROM squad_members WHERE "squadId" = $1 AND "userId" = $2`,
        [squadId, currentUser.id]
      )
      // For now, allow viewing if member exists - can be made public later
    }

    // Get squad posts
    const posts = await query(
      `SELECT sp.*, 
              u.id as user_id, u."firstName" as user_firstName, u."lastName" as user_lastName,
              u.username as user_username, u.avatar as user_avatar, u.verified as user_verified,
              (SELECT COUNT(*) FROM squad_post_likes WHERE "squadPostId" = sp.id) as likes_count,
              (SELECT COUNT(*) FROM squad_post_comments WHERE "squadPostId" = sp.id) as comments_count
       FROM squad_posts sp
       JOIN users u ON u.id = sp."userId"
       WHERE sp."squadId" = $1
       ORDER BY sp."createdAt" DESC
       LIMIT $2 OFFSET $3`,
      [squadId, limit, skip]
    )

    // Get total count
    const totalResult = await queryOne(
      `SELECT COUNT(*) as count FROM squad_posts WHERE "squadId" = $1`,
      [squadId]
    )
    const total = parseInt(totalResult?.count || '0')

    // Format posts
    const formattedPosts = await Promise.all(
      posts.map(async (post: any) => {
        let liked = false
        if (currentUser) {
          const likeCheck = await queryOne(
            `SELECT id FROM squad_post_likes WHERE "squadPostId" = $1 AND "userId" = $2`,
            [post.id, currentUser.id]
          )
          liked = !!likeCheck
        }

        return {
          id: post.id,
          content: post.content,
          image: post.image,
          user: {
            id: post.user_id,
            name: `${post.user_firstName} ${post.user_lastName}`.trim(),
            username: post.user_username,
            avatar: post.user_avatar,
            verified: post.user_verified,
          },
          likes: parseInt(post.likes_count),
          comments: parseInt(post.comments_count),
          liked,
          createdAt: post.createdAt,
        }
      })
    )

    return addCorsHeaders(
      new Response(
        JSON.stringify({
          data: formattedPosts,
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


