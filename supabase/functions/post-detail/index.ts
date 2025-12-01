/**
 * Post Detail Edge Function
 * GET /functions/v1/post-detail?id=xxx
 * Returns detailed post information
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
    const { user: currentUser } = await getUserFromRequest(req)
    const url = new URL(req.url)
    const postId = url.searchParams.get('id')
    
    if (!postId) {
      throw new AppError('Post ID is required', 400)
    }

    // Get post
    const post = await queryOne(
      `SELECT p.*, 
              u.id as user_id, u."firstName" as user_firstName, u."lastName" as user_lastName,
              u.username as user_username, u.avatar as user_avatar, u.verified as user_verified,
              (SELECT COUNT(*) FROM likes WHERE "postId" = p.id) as likes_count,
              (SELECT COUNT(*) FROM comments WHERE "postId" = p.id) as comments_count,
              (SELECT COUNT(*) FROM post_participants WHERE "postId" = p.id) as participants_count
       FROM posts p
       JOIN users u ON u.id = p."userId"
       WHERE p.id = $1`,
      [postId]
    )

    if (!post) {
      throw new AppError('Post not found', 404)
    }

    // Get tags
    const tags = await query(
      `SELECT name FROM post_tags WHERE "postId" = $1`,
      [postId]
    )

    // Check if current user liked/bookmarked/participated
    let liked = false
    let bookmarked = false
    let isParticipating = false

    if (currentUser) {
      const [likeCheck, bookmarkCheck, participantCheck] = await Promise.all([
        queryOne(`SELECT id FROM likes WHERE "userId" = $1 AND "postId" = $2`, [currentUser.id, postId]),
        queryOne(`SELECT id FROM bookmarks WHERE "userId" = $1 AND "postId" = $2`, [currentUser.id, postId]),
        queryOne(`SELECT id FROM post_participants WHERE "userId" = $1 AND "postId" = $2`, [currentUser.id, postId]),
      ])
      liked = !!likeCheck
      bookmarked = !!bookmarkCheck
      isParticipating = !!participantCheck
    }

    const response = {
      id: post.id,
      user: {
        id: post.user_id,
        name: `${post.user_firstName} ${post.user_lastName}`.trim(),
        username: post.user_username,
        avatar: post.user_avatar,
        verified: post.user_verified,
        following: false, // Would need separate query
      },
      content: post.content,
      image: post.image,
      tags: tags.map((t: any) => t.name),
      timestamp: post.createdAt,
      likes: parseInt(post.likes_count),
      comments: parseInt(post.comments_count),
      participants: parseInt(post.participants_count),
      shares: 0,
      liked,
      bookmarked,
      isParticipating,
    }

    return addCorsHeaders(
      new Response(JSON.stringify(response), {
        headers: { 'Content-Type': 'application/json' },
      })
    )
  } catch (error) {
    return addCorsHeaders(handleError(error))
  }
})




