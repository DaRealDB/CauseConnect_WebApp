/**
 * Event Bookmark Edge Function
 * POST /functions/v1/event-bookmark
 * Body: { eventId: string }
 * Bookmarks an event
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
      `SELECT id FROM events WHERE id = $1`,
      [eventId]
    )

    if (!event) {
      throw new AppError('Event not found', 404)
    }

    // Check if already bookmarked
    const existing = await queryOne(
      `SELECT id FROM bookmarks WHERE "userId" = $1 AND "eventId" = $2`,
      [user.id, eventId]
    )

    if (existing) {
      return addCorsHeaders(
        new Response(JSON.stringify({ success: true, message: 'Already bookmarked' }), {
          headers: { 'Content-Type': 'application/json' },
        })
      )
    }

    // Create bookmark
    await query(
      `INSERT INTO bookmarks ("userId", "eventId", "createdAt") 
       VALUES ($1, $2, NOW())`,
      [user.id, eventId]
    )

    return addCorsHeaders(
      new Response(JSON.stringify({ success: true, message: 'Event bookmarked successfully' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )
  } catch (error) {
    return addCorsHeaders(handleError(error))
  }
})




