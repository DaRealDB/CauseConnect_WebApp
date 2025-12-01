/**
 * Event Support Edge Function
 * POST /functions/v1/event-support
 * Body: { eventId: string }
 * Supports an event (adds to support history)
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

    if (req.method !== 'POST') {
      throw new AppError('Method not allowed', 405)
    }

    const body = await req.json()
    const { eventId } = body

    if (!eventId) {
      throw new AppError('Event ID is required', 400)
    }

    // Check if event exists
    const event = await queryOne(
      `SELECT id, "organizationId", title FROM events WHERE id = $1`,
      [eventId]
    )

    if (!event) {
      throw new AppError('Event not found', 404)
    }

    // Check if already supported
    const existing = await queryOne(
      `SELECT id FROM support_history WHERE "userId" = $1 AND "eventId" = $2`,
      [user.id, eventId]
    )

    if (existing) {
      throw new AppError('Event already supported', 400)
    }

    // Remove from pass history if exists
    await query(
      `DELETE FROM pass_history WHERE "userId" = $1 AND "eventId" = $2`,
      [user.id, eventId]
    )

    // Add to support history
    await query(
      `INSERT INTO support_history ("userId", "eventId", "createdAt") 
       VALUES ($1, $2, NOW())`,
      [user.id, eventId]
    )

    // Get user info for notification
    const supporter = await queryOne(
      `SELECT "firstName", "lastName", username FROM users WHERE id = $1`,
      [user.id]
    )

    // Create notification for event organizer (if not supporting own event)
    if (event.organizationId !== user.id && supporter) {
      const supporterName = `${supporter.firstName} ${supporter.lastName}`.trim() || supporter.username
      
      await query(
        `INSERT INTO notifications ("userId", type, title, message, "actionUrl", "createdAt")
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          event.organizationId,
          'support',
          'New Supporter',
          `${supporterName} supported your event "${event.title}"`,
          `/event/${eventId}`
        ]
      )
    }

    return addCorsHeaders(
      new Response(JSON.stringify({ success: true, message: 'Event supported successfully' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )
  } catch (error) {
    return addCorsHeaders(handleError(error))
  }
})




