/**
 * Unsupport Event Edge Function
 * DELETE /functions/v1/event-unsupport
 * Body: { eventId: string }
 * Removes support from an event
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

    if (req.method !== 'DELETE') {
      throw new AppError('Method not allowed', 405)
    }

    const body = await req.json().catch(() => ({}))
    const eventId = body.eventId || new URL(req.url).searchParams.get('eventId')

    if (!eventId) {
      throw new AppError('Event ID is required', 400)
    }

    // Delete support
    await query(
      `DELETE FROM support_history WHERE "userId" = $1 AND "eventId" = $2`,
      [user.id, eventId]
    )

    // Optionally add to pass history
    await query(
      `INSERT INTO pass_history ("userId", "eventId", "createdAt")
       VALUES ($1, $2, NOW())
       ON CONFLICT DO NOTHING`,
      [user.id, eventId]
    )

    return addCorsHeaders(
      new Response(JSON.stringify({ success: true, message: 'Event unsupported successfully' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    )
  } catch (error) {
    return addCorsHeaders(handleError(error))
  }
})




