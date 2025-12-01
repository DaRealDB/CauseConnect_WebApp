/**
 * Get Donation History Edge Function
 * GET /functions/v1/donation-history?page=1&limit=10
 * Returns detailed donation history with stats
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

    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Get donations with event info
    const donations = await query(
      `SELECT d.*, 
              e.id as event_id, e.title as event_title, e.image as event_image,
              u.id as org_id, u.username as org_username, u.avatar as org_avatar
       FROM donations d
       JOIN events e ON e.id = d."eventId"
       JOIN users u ON u.id = e."organizationId"
       WHERE d."userId" = $1
       ORDER BY d."createdAt" DESC
       LIMIT $2 OFFSET $3`,
      [user.id, limit, skip]
    )

    // Get total count
    const totalResult = await queryOne(
      `SELECT COUNT(*) as count FROM donations WHERE "userId" = $1`,
      [user.id]
    )
    const total = parseInt(totalResult?.count || '0')

    // Get aggregate stats
    const statsResult = await queryOne(
      `SELECT 
         COUNT(*) as total_donations,
         COALESCE(SUM(amount), 0) as total_amount,
         COUNT(DISTINCT "eventId") as unique_events
       FROM donations
       WHERE "userId" = $1 AND status = 'completed'`,
      [user.id]
    )

    // Format donations
    const formattedDonations = donations.map((d: any) => ({
      id: d.id,
      amount: parseFloat(d.amount),
      paymentMethod: d.paymentMethod,
      isRecurring: d.isRecurring,
      isAnonymous: d.isAnonymous,
      message: d.message,
      status: d.status,
      transactionId: d.transactionId,
      event: {
        id: d.event_id,
        title: d.event_title,
        image: d.event_image,
        organization: {
          id: d.org_id,
          username: d.org_username,
          avatar: d.org_avatar,
        },
      },
      createdAt: d.createdAt,
    }))

    const response = {
      donations: formattedDonations,
      stats: {
        totalDonations: parseInt(statsResult?.total_donations || '0'),
        totalAmount: parseFloat(statsResult?.total_amount || '0'),
        uniqueEvents: parseInt(statsResult?.unique_events || '0'),
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
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




