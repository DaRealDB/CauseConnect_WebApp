/**
 * Mark All Notifications as Read Edge Function
 * PATCH /functions/v1/notification-read-all
 * Marks all notifications as read for current user
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

    if (req.method !== 'PATCH') {
      throw new AppError('Method not allowed', 405)
    }

    // Update all notifications
    await query(
      `UPDATE notifications 
       SET "isRead" = true, "updatedAt" = NOW()
       WHERE "userId" = $1 AND "isRead" = false`,
      [user.id]
    )

    return addCorsHeaders(
      new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      })
    )
  } catch (error) {
    return addCorsHeaders(handleError(error))
  }
})




