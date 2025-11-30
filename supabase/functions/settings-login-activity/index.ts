/**
 * Get Login Activity Edge Function
 * GET /functions/v1/settings-login-activity
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

    // Get login activity from tokens/sessions table
    // Note: This assumes you have a sessions or login_activity table
    // For now, return empty array if table doesn't exist
    const activities = await query(
      `SELECT id, "deviceInfo" as device, "ipAddress" as location, "createdAt", "lastUsedAt"
       FROM tokens 
       WHERE "userId" = $1 
       ORDER BY "lastUsedAt" DESC
       LIMIT 20`,
      [user.id]
    ).catch(() => [])

    return addCorsHeaders(
      new Response(
        JSON.stringify({
          activities: activities.map((activity: any) => ({
            id: activity.id,
            device: activity.device || 'Unknown Device',
            location: activity.location || 'Unknown Location',
            timeAgo: activity.lastUsedAt ? new Date(activity.lastUsedAt).toISOString() : new Date().toISOString(),
            isCurrentSession: false, // Would need to check current token
            createdAt: activity.createdAt || new Date().toISOString(),
          })),
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

