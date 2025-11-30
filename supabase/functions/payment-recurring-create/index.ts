/**
 * Create Recurring Donation Edge Function
 * POST /functions/v1/payment-recurring-create
 * Body: { eventId, postId, recipientUserId, amount, currency, interval, paymentMethodId, isAnonymous, message }
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

    if (req.method !== 'POST') {
      throw new AppError('Method not allowed', 405)
    }

    const body = await req.json()
    const { eventId, postId, recipientUserId, amount, currency = 'usd', interval = 'month', paymentMethodId, isAnonymous, message } = body

    if (!amount) {
      throw new AppError('amount is required', 400)
    }

    if (!eventId && !postId && !recipientUserId) {
      throw new AppError('eventId, postId, or recipientUserId is required', 400)
    }

    // Create recurring donation record
    // TODO: Integrate Stripe Subscription API for production
    const result = await queryOne(
      `INSERT INTO donations ("userId", "eventId", "postId", "recipientUserId", amount, currency, "paymentMethod", "isRecurring", "recurringInterval", "isAnonymous", status, "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, 'stripe', true, $7, $8, 'pending', NOW())
       RETURNING *`,
      [user.id, eventId || null, postId || null, recipientUserId || null, amount, currency, interval, isAnonymous || false]
    )

    return addCorsHeaders(
      new Response(
        JSON.stringify({
          success: true,
          donation: result,
          message: 'Recurring donation created (requires Stripe Subscription integration)',
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

