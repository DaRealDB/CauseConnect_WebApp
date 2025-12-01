/**
 * Get Event Analytics Edge Function
 * GET /functions/v1/event-analytics
 * Query params: eventId
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

    if (req.method !== 'GET') {
      throw new AppError('Method not allowed', 405)
    }

    const url = new URL(req.url)
    const eventId = url.searchParams.get('eventId')

    if (!eventId) {
      throw new AppError('eventId is required', 400)
    }

    // Verify event ownership
    const event = await queryOne(
      `SELECT * FROM events WHERE id = $1 AND "organizationId" = $2`,
      [eventId, user.id]
    )

    if (!event) {
      throw new AppError('Event not found or access denied', 404)
    }

    // Get analytics data
    const [participantsCount, supportsCount, donationsCount, totalRaised] = await Promise.all([
      queryOne(`SELECT COUNT(*) as count FROM event_participants WHERE "eventId" = $1`, [eventId]),
      queryOne(`SELECT COUNT(*) as count FROM support_history WHERE "eventId" = $1`, [eventId]),
      queryOne(`SELECT COUNT(*) as count FROM donations WHERE "eventId" = $1 AND status = 'completed'`, [eventId]),
      queryOne(`SELECT COALESCE(SUM(amount), 0) as total FROM donations WHERE "eventId" = $1 AND status = 'completed'`, [eventId]),
    ])

    return addCorsHeaders(
      new Response(
        JSON.stringify({
          analytics: {
            participants: parseInt(participantsCount?.count || '0'),
            supports: parseInt(supportsCount?.count || '0'),
            donations: parseInt(donationsCount?.count || '0'),
            totalRaised: parseFloat(totalRaised?.total || '0'),
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



