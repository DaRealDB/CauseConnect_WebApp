/**
 * Cancel Recurring Donation Edge Function
 * DELETE /functions/v1/payment-recurring-cancel
 * Body: { recurringDonationId: string }
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
    const recurringDonationId = body.recurringDonationId || new URL(req.url).searchParams.get('recurringDonationId')

    if (!recurringDonationId) {
      throw new AppError('recurringDonationId is required', 400)
    }

    // Verify ownership
    const donation = await queryOne(
      `SELECT * FROM donations WHERE id = $1 AND "userId" = $2 AND "isRecurring" = true`,
      [recurringDonationId, user.id]
    )

    if (!donation) {
      throw new AppError('Recurring donation not found', 404)
    }

    // TODO: Cancel Stripe subscription
    // Update donation status
    await query(
      `UPDATE donations SET status = 'cancelled', "updatedAt" = NOW() WHERE id = $1`,
      [recurringDonationId]
    )

    return addCorsHeaders(
      new Response(
        JSON.stringify({
          success: true,
          message: 'Recurring donation cancelled',
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



