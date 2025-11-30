/**
 * Create Payment Intent Edge Function
 * POST /functions/v1/payment-intent
 * Body: { eventId: string, amount: number, paymentMethodId?: string }
 * 
 * Note: This requires Stripe API key. For production, add Stripe SDK.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors, addCorsHeaders } from '../_shared/cors.ts'
import { getUserFromRequest } from '../_shared/supabase.ts'
import { handleError, AppError } from '../_shared/errors.ts'
import { queryOne, query } from '../_shared/db.ts'

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') || ''

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
    const { eventId, amount, paymentMethodId } = body

    if (!eventId || !amount) {
      throw new AppError('Event ID and amount are required', 400)
    }

    // Verify event exists
    const event = await queryOne(
      `SELECT id, title FROM events WHERE id = $1 AND status = 'active'`,
      [eventId]
    )

    if (!event) {
      throw new AppError('Event not found', 404)
    }

    // Get or create Stripe customer
    let stripeCustomerId = await queryOne(
      `SELECT "stripeCustomerId" FROM users WHERE id = $1`,
      [user.id]
    ).then((u: any) => u?.stripeCustomerId)

    if (!stripeCustomerId && STRIPE_SECRET_KEY) {
      // Create Stripe customer (requires Stripe SDK)
      // For now, return placeholder
      // TODO: Integrate Stripe SDK
    }

    // Create payment intent via Stripe API
    if (STRIPE_SECRET_KEY) {
      // TODO: Use Stripe SDK to create payment intent
      // const stripe = new Stripe(STRIPE_SECRET_KEY)
      // const intent = await stripe.paymentIntents.create({...})
      
      // For now, return mock response
      const mockClientSecret = `pi_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      return addCorsHeaders(
        new Response(
          JSON.stringify({
            clientSecret: mockClientSecret,
            paymentIntentId: `pi_${Date.now()}`,
            amount: parseFloat(amount),
            currency: 'usd',
          }),
          {
            headers: { 'Content-Type': 'application/json' },
          }
        )
      )
    } else {
      // Stripe not configured - return error or mock
      throw new AppError('Payment processing not configured. Please set STRIPE_SECRET_KEY.', 503)
    }
  } catch (error) {
    return addCorsHeaders(handleError(error))
  }
})

