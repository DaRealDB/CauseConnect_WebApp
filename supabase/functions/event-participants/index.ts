/**
 * Get Event Participants Edge Function
 * GET /functions/v1/event-participants
 * Query params: eventId, page, limit
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors, addCorsHeaders } from '../_shared/cors.ts'
import { getUserFromRequest } from '../_shared/supabase.ts'
import { handleError, AppError } from '../_shared/errors.ts'
import { query } from '../_shared/db.ts'

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
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    if (!eventId) {
      throw new AppError('eventId is required', 400)
    }

    const participants = await query(
      `SELECT ep.*, u.id as "userId", u."firstName", u."lastName", u.username, u.avatar, u.verified
       FROM event_participants ep
       JOIN users u ON ep."userId" = u.id
       WHERE ep."eventId" = $1
       ORDER BY ep."createdAt" DESC
       LIMIT $2 OFFSET $3`,
      [eventId, limit, skip]
    )

    const totalResult = await query(
      `SELECT COUNT(*) as count FROM event_participants WHERE "eventId" = $1`,
      [eventId]
    )
    const total = parseInt(totalResult[0]?.count || '0')

    return addCorsHeaders(
      new Response(
        JSON.stringify({
          participants,
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

