/**
 * Get Payment Methods Edge Function
 * GET /functions/v1/payment-methods
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

    const methods = await query(
      `SELECT id, provider, type, "isDefault", "cardBrand", "cardLast4",
              "cardExpMonth", "cardExpYear", "paypalEmail", "stripePaymentMethodId", "createdAt"
       FROM user_payment_methods
       WHERE "userId" = $1
       ORDER BY "isDefault" DESC, "createdAt" DESC`,
      [user.id]
    )

    const formatted = methods.map((m: any) => ({
      id: m.id,
      provider: m.provider,
      type: m.type,
      isDefault: m.isDefault,
      cardBrand: m.cardBrand,
      cardLast4: m.cardLast4,
      cardExpMonth: m.cardExpMonth,
      cardExpYear: m.cardExpYear,
      paypalEmail: m.paypalEmail,
      stripePaymentMethodId: m.stripePaymentMethodId,
      createdAt: m.createdAt,
    }))

    return addCorsHeaders(
      new Response(JSON.stringify(formatted), {
        headers: { 'Content-Type': 'application/json' },
      })
    )
  } catch (error) {
    return addCorsHeaders(handleError(error))
  }
})



