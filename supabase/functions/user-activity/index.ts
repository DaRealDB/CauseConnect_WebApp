/**
 * Get User Activity Edge Function
 * GET /functions/v1/user-activity?username=xxx&limit=10
 * Returns user's activity feed (supports, awards, follows)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors, addCorsHeaders } from '../_shared/cors.ts'
import { handleError, AppError } from '../_shared/errors.ts'
import { query } from '../_shared/db.ts'

serve(async (req: Request) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const url = new URL(req.url)
    const username = url.searchParams.get('username')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    
    if (!username) {
      throw new AppError('Username is required', 400)
    }

    // Get user ID
    const user = await query(
      `SELECT id FROM users WHERE username = $1`,
      [username]
    )

    if (!user || user.length === 0) {
      throw new AppError('User not found', 404)
    }

    const userId = user[0].id

    // Get supports
    const supports = await query(
      `SELECT sh."createdAt", e.id, e.title, e.image
       FROM support_history sh
       JOIN events e ON e.id = sh."eventId"
       WHERE sh."userId" = $1
       ORDER BY sh."createdAt" DESC
       LIMIT $2`,
      [userId, limit]
    )

    // Get awards (comments awarded)
    const awards = await query(
      `SELECT a."createdAt", c.id, c.content, e.id as event_id, e.title as event_title
       FROM awards a
       JOIN comments c ON c.id = a."commentId"
       LEFT JOIN events e ON e.id = c."eventId"
       WHERE a."userId" = $1
       ORDER BY a."createdAt" DESC
       LIMIT $2`,
      [userId, limit]
    )

    // Get follows
    const follows = await query(
      `SELECT f."createdAt", u.id, u."firstName", u."lastName", u.username, u.avatar
       FROM follows f
       JOIN users u ON u.id = f."followingId"
       WHERE f."followerId" = $1
       ORDER BY f."createdAt" DESC
       LIMIT $2`,
      [userId, limit]
    )

    // Combine and sort by date
    const activities = [
      ...supports.map((s: any) => ({
        type: 'support' as const,
        id: s.id,
        title: `Supported "${s.title}"`,
        description: `Supported the event "${s.title}"`,
        timestamp: s.createdAt,
        event: {
          id: s.id,
          title: s.title,
          image: s.image,
        },
      })),
      ...awards.map((a: any) => ({
        type: 'award' as const,
        id: a.id,
        title: `Awarded a comment`,
        description: a.content.substring(0, 100) + (a.content.length > 100 ? '...' : ''),
        timestamp: a.createdAt,
        event: a.event_id ? {
          id: a.event_id,
          title: a.event_title,
        } : undefined,
      })),
      ...follows.map((f: any) => ({
        type: 'follow' as const,
        id: f.id,
        title: `Started following ${f.firstName} ${f.lastName}`.trim() || f.username,
        description: `Started following ${f.firstName} ${f.lastName}`.trim() || f.username,
        timestamp: f.createdAt,
        user: {
          id: f.id,
          name: `${f.firstName} ${f.lastName}`.trim() || f.username,
          username: f.username,
          avatar: f.avatar,
        },
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)

    return addCorsHeaders(
      new Response(JSON.stringify(activities), {
        headers: { 'Content-Type': 'application/json' },
      })
    )
  } catch (error) {
    return addCorsHeaders(handleError(error))
  }
})


