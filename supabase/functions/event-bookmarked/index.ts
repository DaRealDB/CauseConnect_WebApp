/**
 * Get Bookmarked Events Edge Function
 * GET /functions/v1/event-bookmarked?page=1&limit=10
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

    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Get bookmarked events
    const events = await query(
      `SELECT e.*, 
              u.id as org_id, u."firstName" as org_firstName, u."lastName" as org_lastName,
              u.username as org_username, u.avatar as org_avatar, u.verified as org_verified,
              (SELECT COUNT(*) FROM support_history WHERE "eventId" = e.id) as supporters
       FROM bookmarks b
       JOIN events e ON e.id = b."eventId"
       JOIN users u ON u.id = e."organizationId"
       WHERE b."userId" = $1 AND b."eventId" IS NOT NULL AND e.status = 'active'
       ORDER BY b."createdAt" DESC
       LIMIT $2 OFFSET $3`,
      [user.id, limit, skip]
    )

    // Get total count
    const totalResult = await queryOne(
      `SELECT COUNT(*) as count 
       FROM bookmarks b
       JOIN events e ON e.id = b."eventId"
       WHERE b."userId" = $1 AND b."eventId" IS NOT NULL AND e.status = 'active'`,
      [user.id]
    )
    const total = parseInt(totalResult?.count || '0')

    // Get tags for each event
    const eventsWithTags = await Promise.all(
      events.map(async (event: any) => {
        const eventTags = await query(
          `SELECT name FROM event_tags WHERE "eventId" = $1`,
          [event.id]
        )

        return {
          id: event.id,
          title: event.title,
          description: event.description,
          fullDescription: event.fullDescription,
          image: event.image,
          tags: eventTags.map((t: any) => t.name),
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
          location: event.location,
          targetDate: event.targetDate ? new Date(event.targetDate).toISOString() : null,
          timeLeft: event.targetDate
            ? `${Math.ceil((new Date(event.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left`
            : undefined,
          urgency: event.urgency,
          isSupported: false, // Would need separate check
          isBookmarked: true,
          createdAt: event.createdAt,
        }
      })
    )

    return addCorsHeaders(
      new Response(
        JSON.stringify({
          data: eventsWithTags,
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




