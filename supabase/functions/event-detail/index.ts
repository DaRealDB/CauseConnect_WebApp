/**
 * Event Detail Edge Function
 * GET /functions/v1/event-detail?id=xxx
 * Returns detailed event information
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
    const eventId = url.searchParams.get('id')
    
    if (!eventId) {
      throw new AppError('Event ID is required', 400)
    }

    // Get event
    const event = await queryOne(
      `SELECT e.*, 
              u.id as org_id, u."firstName" as org_firstName, u."lastName" as org_lastName,
              u.username as org_username, u.avatar as org_avatar, u.verified as org_verified, u.bio as org_bio,
              (SELECT COUNT(*) FROM support_history WHERE "eventId" = e.id) as supporters,
              (SELECT COUNT(*) FROM donations WHERE "eventId" = e.id) as donation_count
       FROM events e
       JOIN users u ON u.id = e."organizationId"
       WHERE e.id = $1 AND e.status = 'active'`,
      [eventId]
    )

    if (!event) {
      throw new AppError('Event not found', 404)
    }

    // Get tags
    const tags = await query(
      `SELECT name FROM event_tags WHERE "eventId" = $1`,
      [eventId]
    )

    // Get updates
    const updates = await query(
      `SELECT id, title, content, image, "createdAt"
       FROM event_updates
       WHERE "eventId" = $1
       ORDER BY "createdAt" DESC`,
      [eventId]
    )

    // Check if current user supported/bookmarked
    let isSupported = false
    let isBookmarked = false

    if (currentUser) {
      const [supportCheck, bookmarkCheck] = await Promise.all([
        queryOne(
          `SELECT id FROM support_history WHERE "userId" = $1 AND "eventId" = $2`,
          [currentUser.id, eventId]
        ),
        queryOne(
          `SELECT id FROM bookmarks WHERE "userId" = $1 AND "eventId" = $2`,
          [currentUser.id, eventId]
        ),
      ])
      isSupported = !!supportCheck
      isBookmarked = !!bookmarkCheck
    }

    // Format response
    const response = {
      id: event.id,
      title: event.title,
      description: event.description,
      fullDescription: event.fullDescription || event.description,
      image: event.image,
      tags: tags.map((t: any) => t.name),
      supporters: parseInt(event.supporters),
      goal: parseFloat(event.goalAmount),
      raised: parseFloat(event.raisedAmount),
      organization: {
        id: event.org_id,
        name: `${event.org_firstName} ${event.org_lastName}`.trim() || event.org_username,
        verified: event.org_verified,
        avatar: event.org_avatar,
        description: event.org_bio,
      },
      location: event.location,
      targetDate: event.targetDate ? new Date(event.targetDate).toISOString() : null,
      timeLeft: event.targetDate
        ? `${Math.ceil((new Date(event.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left`
        : undefined,
      urgency: event.urgency,
      isSupported,
      isBookmarked,
      updates: updates.map((u: any) => ({
        id: u.id,
        title: u.title,
        content: u.content,
        image: u.image,
        timestamp: u.createdAt,
      })),
      createdAt: event.createdAt,
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




