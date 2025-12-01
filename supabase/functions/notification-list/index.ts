/**
 * Notification List Edge Function
 * GET /functions/v1/notification-list?page=1&limit=20
 * Returns paginated list of notifications for current user
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

    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const type = url.searchParams.get('type')
    
    const skip = (page - 1) * limit

    // Build WHERE clause
    let whereClause = `"userId" = $1`
    const params: any[] = [user.id]
    let paramIndex = 2

    if (type) {
      whereClause += ` AND type = $${paramIndex}`
      params.push(type)
      paramIndex++
    }

    // Get notifications
    const notifications = await query(
      `SELECT id, type, title, message, "isRead", "actionUrl", amount, "createdAt"
       FROM notifications
       WHERE ${whereClause}
       ORDER BY "createdAt" DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, skip]
    )

    // Get total count
    const totalResult = await query(
      `SELECT COUNT(*) as count FROM notifications WHERE ${whereClause}`,
      params
    )
    const total = parseInt(totalResult[0]?.count || '0')

    // Format notifications
    const formattedNotifications = notifications.map((n: any) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      isRead: n.isRead,
      actionUrl: n.actionUrl,
      amount: n.amount ? parseFloat(n.amount) : undefined,
      timestamp: n.createdAt,
      avatar: undefined, // Would need to join with user table if needed
    }))

    return addCorsHeaders(
      new Response(
        JSON.stringify({
          data: formattedNotifications,
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




