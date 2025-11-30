/**
 * Get User Impact Statistics Edge Function
 * GET /functions/v1/settings-impact
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

    // Get total donated amount
    const totalDonatedResult = await queryOne(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM donations
       WHERE "userId" = $1 AND status = 'completed'`,
      [user.id]
    )

    // Get unique causes supported
    const eventDonations = await query(
      `SELECT DISTINCT "eventId" FROM donations
       WHERE "userId" = $1 AND status = 'completed' AND "eventId" IS NOT NULL`,
      [user.id]
    )

    const postDonations = await query(
      `SELECT DISTINCT "postId" FROM donations
       WHERE "userId" = $1 AND status = 'completed' AND "postId" IS NOT NULL`,
      [user.id]
    )

    const causesSupported = new Set([
      ...eventDonations.map((d: any) => d.eventId),
      ...postDonations.map((d: any) => d.postId),
    ]).size

    // Get donation count
    const donationCountResult = await queryOne(
      `SELECT COUNT(*) as count FROM donations
       WHERE "userId" = $1 AND status = 'completed'`,
      [user.id]
    )

    const response = {
      totalDonated: parseFloat(totalDonatedResult?.total || '0'),
      causesSupported,
      donationCount: parseInt(donationCountResult?.count || '0'),
    }

    return addCorsHeaders(
      new Response(JSON.stringify(response), {
        headers: { 'Content-Type': 'application/json' },
      })
    )
  } catch (error) {
    return addCorsHeaders(handleError(error))
  }
})

