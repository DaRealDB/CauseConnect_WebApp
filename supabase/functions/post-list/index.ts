/**
 * Post List Edge Function
 * GET /functions/v1/post-list?page=1&limit=10
 * Returns paginated list of posts with filtering
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
    
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const userId = url.searchParams.get('userId')
    const tags = url.searchParams.get('tags')?.split(',').filter(Boolean) || []
    const requireUserTags = url.searchParams.get('requireUserTags') === 'true'
    const excludeUserTags = url.searchParams.get('excludeUserTags') === 'true'
    
    const skip = (page - 1) * limit
    
    // Build WHERE clause
    let whereConditions = []
    const params: any[] = []
    let paramIndex = 1
    
    // User filtering
    if (userId) {
      whereConditions.push(`p."userId" = $${paramIndex}`)
      params.push(userId)
      paramIndex++
    }
    
    // Tag filtering
    if (tags.length > 0) {
      whereConditions.push(`EXISTS (
        SELECT 1 FROM post_tags pt 
        WHERE pt."postId" = p.id 
        AND LOWER(pt.name) = ANY($${paramIndex}::text[])
      )`)
      params.push(tags.map(t => t.toLowerCase()))
      paramIndex++
    } else if (requireUserTags && currentUser) {
      const userSettings = await query(
        `SELECT "interestTags" FROM user_settings WHERE "userId" = $1`,
        [currentUser.id]
      )
      
      if (userSettings.length > 0 && userSettings[0].interestTags?.length > 0) {
        whereConditions.push(`EXISTS (
          SELECT 1 FROM post_tags pt 
          WHERE pt."postId" = p.id 
          AND LOWER(pt.name) = ANY($${paramIndex}::text[])
        )`)
        params.push(userSettings[0].interestTags.map((t: string) => t.toLowerCase()))
        paramIndex++
      } else {
        whereConditions.push('1 = 0') // Empty result
      }
    } else if (excludeUserTags && currentUser) {
      const userSettings = await query(
        `SELECT "interestTags" FROM user_settings WHERE "userId" = $1`,
        [currentUser.id]
      )
      
      if (userSettings.length > 0 && userSettings[0].interestTags?.length > 0) {
        whereConditions.push(`NOT EXISTS (
          SELECT 1 FROM post_tags pt 
          WHERE pt."postId" = p.id 
          AND LOWER(pt.name) = ANY($${paramIndex}::text[])
        )`)
        params.push(userSettings[0].interestTags.map((t: string) => t.toLowerCase()))
        paramIndex++
      }
    }
    
    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : ''
    
    // Get posts
    const posts = await query(
      `SELECT p.*, 
              u.id as user_id, u."firstName" as user_firstName, u."lastName" as user_lastName,
              u.username as user_username, u.avatar as user_avatar, u.verified as user_verified,
              (SELECT COUNT(*) FROM likes WHERE "postId" = p.id) as likes_count,
              (SELECT COUNT(*) FROM comments WHERE "postId" = p.id) as comments_count,
              (SELECT COUNT(*) FROM post_participants WHERE "postId" = p.id) as participants_count
       FROM posts p
       JOIN users u ON u.id = p."userId"
       ${whereClause}
       ORDER BY p."createdAt" DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, skip]
    )
    
    // Get total count
    const totalResult = await query(
      `SELECT COUNT(*) as count FROM posts p ${whereClause}`,
      params
    )
    const total = parseInt(totalResult[0]?.count || '0')
    
    // Get tags and check likes/bookmarks for each post
    const postsWithDetails = await Promise.all(
      posts.map(async (post: any) => {
        const [tags, likedCheck, bookmarkedCheck] = await Promise.all([
          query(`SELECT name FROM post_tags WHERE "postId" = $1`, [post.id]),
          currentUser ? query(
            `SELECT id FROM likes WHERE "userId" = $1 AND "postId" = $2`,
            [currentUser.id, post.id]
          ) : Promise.resolve([]),
          currentUser ? query(
            `SELECT id FROM bookmarks WHERE "userId" = $1 AND "postId" = $2`,
            [currentUser.id, post.id]
          ) : Promise.resolve([]),
        ])
        
        return {
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
          liked: likedCheck.length > 0,
          bookmarked: bookmarkedCheck.length > 0,
          isParticipating: false, // Would need separate query
        }
      })
    )
    
    return addCorsHeaders(
      new Response(
        JSON.stringify({
          data: postsWithDetails,
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


