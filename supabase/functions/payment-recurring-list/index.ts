/**
 * Get Recurring Donations Edge Function
 * GET /functions/v1/payment-recurring-list
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

    const donations = await query(
      `SELECT * FROM donations 
       WHERE "userId" = $1 AND "isRecurring" = true 
       ORDER BY "createdAt" DESC`,
      [user.id]
    )

    return addCorsHeaders(
      new Response(
        JSON.stringify({
          donations,
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

