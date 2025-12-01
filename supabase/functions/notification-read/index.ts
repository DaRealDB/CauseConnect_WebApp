/**
 * Mark Notification as Read Edge Function
 * PATCH /functions/v1/notification-read?id=xxx
 * Marks a notification as read
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

    const url = new URL(req.url)
    const notificationId = url.searchParams.get('id')
    
    if (!notificationId) {
      throw new AppError('Notification ID is required', 400)
    }

    // Update notification
    await query(
      `UPDATE notifications 
       SET "isRead" = true, "updatedAt" = NOW()
       WHERE id = $1 AND "userId" = $2`,
      [notificationId, user.id]
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




