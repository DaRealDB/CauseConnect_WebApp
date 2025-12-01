/**
 * User Profile Edge Function
 * GET /functions/v1/user-profile?username=xxx
 * Returns user profile with stats, events, and supported events
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors, addCorsHeaders } from '../_shared/cors.ts'
import { getUserFromRequest } from '../_shared/supabase.ts'
import { handleError, AppError } from '../_shared/errors.ts'
import { query, queryOne } from '../_shared/db.ts'

serve(async (req: Request) => {
  // Handle CORS
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    // Get current user (optional - for isFollowing check)
    const { user: currentUser } = await getUserFromRequest(req)
    
    // Get username from query params
    const url = new URL(req.url)
    const username = url.searchParams.get('username')
    
    if (!username) {
      throw new AppError('Username parameter is required', 400)
    }

    // Get user profile
    const user = await queryOne(
      `SELECT id, username, "firstName", "lastName", email, avatar, "coverImage", 
              bio, location, website, verified, "createdAt"
       FROM users 
       WHERE username = $1`,
      [username]
    )

    if (!user) {
      throw new AppError('User not found', 404)
    }

    // Get user stats
    const [followers, following, causesSupported, donations] = await Promise.all([
      queryOne(`SELECT COUNT(*) as count FROM follows WHERE "followingId" = $1`, [user.id]),
      queryOne(`SELECT COUNT(*) as count FROM follows WHERE "followerId" = $1`, [user.id]),
      queryOne(`SELECT COUNT(*) as count FROM support_history WHERE "userId" = $1`, [user.id]),
      queryOne(
        `SELECT COALESCE(SUM(amount), 0) as total 
         FROM donations 
         WHERE "userId" = $1 AND status = 'completed'`,
        [user.id]
      ),
    ])

    // Check if current user is following
    let isFollowing = false
    if (currentUser) {
      const followCheck = await queryOne(
        `SELECT id FROM follows WHERE "followerId" = $1 AND "followingId" = $2`,
        [currentUser.id, user.id]
      )
      isFollowing = !!followCheck
    }

    // Get user settings for interest tags
    const userSettings = await queryOne(
      `SELECT "interestTags" FROM user_settings WHERE "userId" = $1`,
      [user.id]
    )

    // Get created events
    const createdEvents = await query(
      `SELECT id, title, description, image, "goalAmount" as goal, 
              "raisedAmount" as raised, "createdAt"
       FROM events 
       WHERE "organizationId" = $1 AND status = 'active'
       ORDER BY "createdAt" DESC
       LIMIT 10`,
      [user.id]
    )

    // Get supported events
    const supportedEventsData = await query(
      `SELECT e.id, e.title, e.description, e.image, e."goalAmount" as goal,
              e."raisedAmount" as raised, e."createdAt",
              u.id as org_id, u."firstName" as org_firstName, u."lastName" as org_lastName,
              u.username as org_username, u.avatar as org_avatar, u.verified as org_verified,
              (SELECT COUNT(*) FROM support_history WHERE "eventId" = e.id) as supporters
       FROM support_history sh
       JOIN events e ON e.id = sh."eventId"
       JOIN users u ON u.id = e."organizationId"
       WHERE sh."userId" = $1 AND e.status = 'active'
       ORDER BY sh."createdAt" DESC
       LIMIT 10`,
      [user.id]
    )

    // Get tags for supported events
    const supportedEventsWithTags = await Promise.all(
      supportedEventsData.map(async (event: any) => {
        const tags = await query(
          `SELECT name FROM event_tags WHERE "eventId" = $1`,
          [event.id]
        )
        return {
          id: event.id,
          title: event.title,
          description: event.description,
          image: event.image,
          goal: parseFloat(event.goal),
          raised: parseFloat(event.raised),
          supporters: parseInt(event.supporters),
          createdAt: event.createdAt,
          organization: {
            id: event.org_id,
            name: `${event.org_firstName} ${event.org_lastName}`.trim() || event.org_username,
            username: event.org_username,
            verified: event.org_verified,
            avatar: event.org_avatar,
          },
          tags: tags.map((t: any) => t.name),
        }
      })
    )

    // Format response
    const response = {
      id: user.id,
      username: user.username,
      name: `${user.firstName} ${user.lastName}`,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      avatar: user.avatar,
      coverImage: user.coverImage,
      bio: user.bio,
      location: user.location,
      website: user.website,
      verified: user.verified,
      joinedDate: new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      isFollowing,
      isOwnProfile: currentUser?.id === user.id,
      interestTags: userSettings?.interestTags || [],
      stats: {
        followers: parseInt(followers?.count || '0'),
        following: parseInt(following?.count || '0'),
        causesSupported: parseInt(causesSupported?.count || '0'),
        totalDonated: parseFloat(donations?.total || '0'),
        impactScore: parseInt(causesSupported?.count || '0') * 10 + parseFloat(donations?.total || '0') / 100,
      },
      events: createdEvents.map((e: any) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        image: e.image,
        goal: parseFloat(e.goal),
        raised: parseFloat(e.raised),
        createdAt: e.createdAt,
      })),
      supportedEvents: supportedEventsWithTags,
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




