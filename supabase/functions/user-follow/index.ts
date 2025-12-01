/**
 * Toggle Follow User Edge Function
 * POST /functions/v1/user-follow
 * Body: { userId: string }
 * Toggles follow status (follows if not following, unfollows if following)
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
    const { userId: followingId } = body

    if (!followingId) {
      throw new AppError('User ID is required', 400)
    }

    if (user.id === followingId) {
      throw new AppError('Cannot follow yourself', 400)
    }

    // Check if user exists
    const targetUser = await queryOne(
      `SELECT id, "firstName", "lastName", username FROM users WHERE id = $1`,
      [followingId]
    )

    if (!targetUser) {
      throw new AppError('User not found', 404)
    }

    // Check if already following
    const existing = await queryOne(
      `SELECT id FROM follows WHERE "followerId" = $1 AND "followingId" = $2`,
      [user.id, followingId]
    )

    if (existing) {
      // Unfollow
      await query(
        `DELETE FROM follows WHERE "followerId" = $1 AND "followingId" = $2`,
        [user.id, followingId]
      )

      return addCorsHeaders(
        new Response(JSON.stringify({ isFollowing: false }), {
          headers: { 'Content-Type': 'application/json' },
        })
      )
    } else {
      // Follow
      await query(
        `INSERT INTO follows ("followerId", "followingId", "createdAt")
         VALUES ($1, $2, NOW())`,
        [user.id, followingId]
      )

      // Create notification
      const followerName = `${user.firstName} ${user.lastName}`.trim() || user.username
      await query(
        `INSERT INTO notifications ("userId", type, title, message, "actionUrl", "createdAt")
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          followingId,
          'follow',
          'New Follower',
          `${followerName} started following you`,
          `/profile/${user.username}`
        ]
      )

      return addCorsHeaders(
        new Response(JSON.stringify({ isFollowing: true }), {
          headers: { 'Content-Type': 'application/json' },
        })
      )
    }
  } catch (error) {
    return addCorsHeaders(handleError(error))
  }
})




