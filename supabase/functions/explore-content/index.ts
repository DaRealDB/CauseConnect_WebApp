/**
 * Explore Content Edge Function
 * GET /functions/v1/explore-content?page=1&limit=10
 * Returns events and posts with tags NOT in user's interests (for discovery)
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
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Get user's interest tags if authenticated
    let userTags: string[] = []
    if (currentUser) {
      const userSettings = await queryOne(
        `SELECT "interestTags" FROM user_settings WHERE "userId" = $1`,
        [currentUser.id]
      )
      userTags = userSettings?.interestTags || []
    }

    // Get events with tags NOT in user's interests
    let eventWhereClause = 'e.status = $1'
    const eventParams: any[] = ['active']
    let eventParamIndex = 2

    if (userTags.length > 0) {
      eventWhereClause += ` AND NOT EXISTS (
        SELECT 1 FROM event_tags et 
        WHERE et."eventId" = e.id 
        AND LOWER(et.name) = ANY($${eventParamIndex}::text[])
      )`
      eventParams.push(userTags.map(t => t.toLowerCase()))
      eventParamIndex++
    }

    const events = await query(
      `SELECT e.*, 
              u.id as org_id, u."firstName" as org_firstName, u."lastName" as org_lastName,
              u.username as org_username, u.avatar as org_avatar, u.verified as org_verified,
              (SELECT COUNT(*) FROM support_history WHERE "eventId" = e.id) as supporters
       FROM events e
       JOIN users u ON u.id = e."organizationId"
       WHERE ${eventWhereClause}
       ORDER BY e."createdAt" DESC
       LIMIT $${eventParamIndex} OFFSET $${eventParamIndex + 1}`,
      [...eventParams, limit, skip]
    )

    // Get posts with tags NOT in user's interests
    let postWhereClause = '1=1'
    const postParams: any[] = []
    let postParamIndex = 1

    if (userTags.length > 0) {
      postWhereClause = `NOT EXISTS (
        SELECT 1 FROM post_tags pt 
        WHERE pt."postId" = p.id 
        AND LOWER(pt.name) = ANY($${postParamIndex}::text[])
      )`
      postParams.push(userTags.map(t => t.toLowerCase()))
      postParamIndex++
    }

    const posts = await query(
      `SELECT p.*, 
              u.id as user_id, u."firstName" as user_firstName, u."lastName" as user_lastName,
              u.username as user_username, u.avatar as user_avatar, u.verified as user_verified,
              (SELECT COUNT(*) FROM likes WHERE "postId" = p.id) as likes_count,
              (SELECT COUNT(*) FROM comments WHERE "postId" = p.id) as comments_count
       FROM posts p
       JOIN users u ON u.id = p."userId"
       WHERE ${postWhereClause}
       ORDER BY p."createdAt" DESC
       LIMIT $${postParamIndex} OFFSET $${postParamIndex + 1}`,
      [...postParams, limit, skip]
    )

    // Format events
    const formattedEvents = await Promise.all(
      events.map(async (event: any) => {
        const tags = await query(
          `SELECT name FROM event_tags WHERE "eventId" = $1`,
          [event.id]
        )
        return {
          type: 'event',
          id: event.id,
          title: event.title,
          description: event.description,
          image: event.image,
          tags: tags.map((t: any) => t.name),
          supporters: parseInt(event.supporters),
          goal: parseFloat(event.goalAmount),
          raised: parseFloat(event.raisedAmount),
          organization: {
            id: event.org_id,
            name: `${event.org_firstName} ${event.org_lastName}`.trim() || event.org_username,
            username: event.org_username,
            verified: event.org_verified,
            avatar: event.org_avatar,
          },
          createdAt: event.createdAt,
        }
      })
    )

    // Format posts
    const formattedPosts = await Promise.all(
      posts.map(async (post: any) => {
        const tags = await query(
          `SELECT name FROM post_tags WHERE "postId" = $1`,
          [post.id]
        )
        return {
          type: 'post',
          id: post.id,
          content: post.content,
          image: post.image,
          tags: tags.map((t: any) => t.name),
          likes: parseInt(post.likes_count),
          comments: parseInt(post.comments_count),
          user: {
            id: post.user_id,
            name: `${post.user_firstName} ${post.user_lastName}`.trim(),
            username: post.user_username,
            avatar: post.user_avatar,
            verified: post.user_verified,
          },
          createdAt: post.createdAt,
        }
      })
    )

    // Combine and shuffle for variety
    const allContent = [...formattedEvents, ...formattedPosts]
      .sort(() => Math.random() - 0.5) // Shuffle
      .slice(0, limit)

    return addCorsHeaders(
      new Response(
        JSON.stringify({
          data: allContent,
          pagination: {
            page,
            limit,
            total: allContent.length,
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


