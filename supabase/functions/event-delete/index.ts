/**
 * Delete Event Edge Function
 * DELETE /functions/v1/event-delete?id=xxx
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors, addCorsHeaders } from '../_shared/cors.ts'
import { getUserFromRequest } from '../_shared/supabase.ts'
import { handleError, AppError } from '../_shared/errors.ts'
import { queryOne, query } from '../_shared/db.ts'

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

    const url = new URL(req.url)
    const eventId = url.searchParams.get('id')
    if (!eventId) {
      throw new AppError('Event ID is required', 400)
    }

    // Verify event exists and user is owner
    const event = await queryOne(
      `SELECT "organizationId", image FROM events WHERE id = $1`,
      [eventId]
    )

    if (!event) {
      throw new AppError('Event not found', 404)
    }

    if (event.organizationId !== user.id) {
      throw new AppError('Not authorized to delete this event', 403)
    }

    // Delete event (cascade will delete related records)
    await query(`DELETE FROM events WHERE id = $1`, [eventId])

    // Note: If image was stored in Supabase Storage, you might want to delete it here
    // For now, we'll leave it as orphaned files can be cleaned up later

    return addCorsHeaders(
      new Response(JSON.stringify({ message: 'Event deleted successfully' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    )
  } catch (error) {
    return addCorsHeaders(handleError(error))
  }
})




