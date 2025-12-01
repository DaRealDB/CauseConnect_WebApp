/**
 * Get Current User Edge Function
 * GET /functions/v1/auth-me
 * Returns current authenticated user
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors, addCorsHeaders } from '../_shared/cors.ts'
import { getUserFromRequest } from '../_shared/supabase.ts'
import { handleError, AppError } from '../_shared/errors.ts'
import { queryOne } from '../_shared/db.ts'

serve(async (req: Request) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const { user: authUser, error: authError } = await getUserFromRequest(req)
    if (authError || !authUser) {
      throw new AppError('Unauthorized', 401)
    }

    // Get full user data from database
    const user = await queryOne(
      `SELECT id, email, username, "firstName", "lastName", avatar, "coverImage",
              bio, location, website, verified, "emailVerified", "createdAt"
       FROM users 
       WHERE id = $1`,
      [authUser.id]
    )

    if (!user) {
      throw new AppError('User not found', 404)
    }

    // Get user stats
    const [followers, following, causesSupported] = await Promise.all([
      queryOne(`SELECT COUNT(*) as count FROM follows WHERE "followingId" = $1`, [user.id]),
      queryOne(`SELECT COUNT(*) as count FROM follows WHERE "followerId" = $1`, [user.id]),
      queryOne(`SELECT COUNT(*) as count FROM support_history WHERE "userId" = $1`, [user.id]),
    ])

    const response = {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        name: `${user.firstName} ${user.lastName}`.trim(),
        avatar: user.avatar,
        coverImage: user.coverImage,
        bio: user.bio,
        location: user.location,
        website: user.website,
        verified: user.verified,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        stats: {
          followers: parseInt(followers?.count || '0'),
          following: parseInt(following?.count || '0'),
          causesSupported: parseInt(causesSupported?.count || '0'),
        },
      },
      token: null, // Supabase handles tokens separately
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




