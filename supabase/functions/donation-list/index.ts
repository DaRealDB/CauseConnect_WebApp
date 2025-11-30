/**
 * List Donations Edge Function
 * GET /functions/v1/donation-list?page=1&limit=10&eventId=xxx?
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
    const eventId = url.searchParams.get('eventId')
    
    const skip = (page - 1) * limit

    // Build WHERE clause
    let whereClause = 'd."userId" = $1'
    const params: any[] = [user.id]
    let paramIndex = 2

    if (eventId) {
      whereClause += ` AND d."eventId" = $${paramIndex}`
      params.push(eventId)
      paramIndex++
    }

    // Get donations
    const donations = await query(
      `SELECT d.*, 
              e.id as event_id, e.title as event_title,
              u.id as user_id, u."firstName" as user_firstName, u."lastName" as user_lastName,
              u.username as user_username, u.avatar as user_avatar
       FROM donations d
       JOIN events e ON e.id = d."eventId"
       LEFT JOIN users u ON u.id = d."userId"
       WHERE ${whereClause}
       ORDER BY d."createdAt" DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, skip]
    )

    // Get total count
    const totalResult = await queryOne(
      `SELECT COUNT(*) as count FROM donations d WHERE ${whereClause}`,
      params
    )
    const total = parseInt(totalResult?.count || '0')

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
      },
      donor: d.isAnonymous ? null : {
        id: d.user_id,
        name: `${d.user_firstName} ${d.user_lastName}`.trim() || d.user_username,
        username: d.user_username,
        avatar: d.user_avatar,
      },
      createdAt: d.createdAt,
    }))

    return addCorsHeaders(
      new Response(
        JSON.stringify({
          data: formattedDonations,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
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


