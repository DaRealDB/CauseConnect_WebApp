/**
 * Notification Unread Count Edge Function
 * GET /functions/v1/notification-unread-count
 * Returns count of unread notifications
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
    const { user, error: authError } = await getUserFromRequest(req)
    if (authError || !user) {
      throw new AppError('Unauthorized', 401)
    }

    const result = await queryOne(
      `SELECT COUNT(*) as count 
       FROM notifications 
       WHERE "userId" = $1 AND "isRead" = false`,
      [user.id]
    )

    const count = parseInt(result?.count || '0')

    return addCorsHeaders(
      new Response(JSON.stringify({ count }), {
        headers: { 'Content-Type': 'application/json' },
      })
    )
  } catch (error) {
    return addCorsHeaders(handleError(error))
  }
})


