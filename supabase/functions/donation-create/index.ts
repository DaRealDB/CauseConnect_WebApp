/**
 * Create Donation Edge Function
 * POST /functions/v1/donation-create
 * Body: { eventId, amount, paymentMethod, isRecurring?, isAnonymous?, message? }
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

    if (req.method !== 'POST') {
      throw new AppError('Method not allowed', 405)
    }

    const body = await req.json()
    const { eventId, amount, paymentMethod, isRecurring, isAnonymous, message } = body

    if (!eventId || !amount || !paymentMethod) {
      throw new AppError('Event ID, amount, and payment method are required', 400)
    }

    // Verify event exists
    const event = await queryOne(
      `SELECT id, title, "organizationId" FROM events WHERE id = $1 AND status = 'active'`,
      [eventId]
    )

    if (!event) {
      throw new AppError('Event not found', 404)
    }

    // Create donation record
    const donationResult = await queryOne(
      `INSERT INTO donations (
        amount, "paymentMethod", "isRecurring", "isAnonymous", message,
        "userId", "eventId", status, "transactionId", "createdAt", "updatedAt"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'completed', $8, NOW(), NOW())
      RETURNING id, amount, status, "transactionId", "createdAt"`,
      [
        parseFloat(amount),
        paymentMethod,
        isRecurring || false,
        isAnonymous || false,
        message || null,
        user.id,
        eventId,
        `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ]
    )

    // Update event raised amount
    await query(
      `UPDATE events 
       SET "raisedAmount" = COALESCE("raisedAmount", 0) + $1,
           "updatedAt" = NOW()
       WHERE id = $2`,
      [parseFloat(amount), eventId]
    )

    // Create notification for event organizer (if not donating to own event)
    if (event.organizationId !== user.id) {
      const donor = await queryOne(
        `SELECT "firstName", "lastName", username FROM users WHERE id = $1`,
        [user.id]
      )

      if (donor) {
        const donorName = isAnonymous
          ? 'An anonymous donor'
          : `${donor.firstName} ${donor.lastName}`.trim() || donor.username

        await query(
          `INSERT INTO notifications ("userId", type, title, message, amount, "actionUrl", "createdAt")
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [
            event.organizationId,
            'donation',
            'New Donation',
            `${donorName} donated $${parseFloat(amount).toFixed(2)} to your event "${event.title}"`,
            parseFloat(amount),
            `/event/${eventId}`,
          ]
        )
      }
    }

    const response = {
      donation: {
        id: donationResult.id,
        amount: parseFloat(donationResult.amount),
        paymentMethod,
        isRecurring: isRecurring || false,
        isAnonymous: isAnonymous || false,
        status: donationResult.status,
        transactionId: donationResult.transactionId,
        createdAt: donationResult.createdAt,
      },
    }

    return addCorsHeaders(
      new Response(JSON.stringify(response), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      })
    )
  } catch (error) {
    return addCorsHeaders(handleError(error))
  }
})


