/**
 * Export User Data Edge Function
 * GET /functions/v1/settings-export-data
 * Returns all user data in JSON format
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

    // Get user profile
    const userProfile = await queryOne(
      `SELECT * FROM users WHERE id = $1`,
      [user.id]
    )

    // Get user settings
    const settings = await queryOne(
      `SELECT * FROM user_settings WHERE "userId" = $1`,
      [user.id]
    )

    // Get posts
    const posts = await query(
      `SELECT * FROM posts WHERE "userId" = $1`,
      [user.id]
    )

    // Get events created
    const events = await query(
      `SELECT * FROM events WHERE "organizationId" = $1`,
      [user.id]
    )

    // Get donations
    const donations = await query(
      `SELECT * FROM donations WHERE "userId" = $1`,
      [user.id]
    )

    // Get comments
    const comments = await query(
      `SELECT * FROM comments WHERE "userId" = $1`,
      [user.id]
    )

    // Get squads
    const squads = await query(
      `SELECT s.* FROM squads s
       JOIN squad_members sm ON sm."squadId" = s.id
       WHERE sm."userId" = $1`,
      [user.id]
    )

    // Get follows
    const following = await query(
      `SELECT f.*, u.username, u."firstName", u."lastName"
       FROM follows f
       JOIN users u ON u.id = f."followingId"
       WHERE f."followerId" = $1`,
      [user.id]
    )

    const followers = await query(
      `SELECT f.*, u.username, u."firstName", u."lastName"
       FROM follows f
       JOIN users u ON u.id = f."followerId"
       WHERE f."followingId" = $1`,
      [user.id]
    )

    // Remove sensitive data
    const { password, ...safeUserProfile } = userProfile

    const exportData = {
      user: safeUserProfile,
      settings,
      posts: posts.length,
      events: events.length,
      donations: donations.length,
      comments: comments.length,
      squads: squads.length,
      following: following.length,
      followers: followers.length,
      exportedAt: new Date().toISOString(),
    }

    return addCorsHeaders(
      new Response(JSON.stringify(exportData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="causeconnect-data-${new Date().toISOString().split('T')[0]}.json"`,
        },
      })
    )
  } catch (error) {
    return addCorsHeaders(handleError(error))
  }
})

