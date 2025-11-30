/**
 * Get Squad Members Edge Function
 * GET /functions/v1/squad-members?id=xxx&page=1&limit=20
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors, addCorsHeaders } from '../_shared/cors.ts'
import { handleError, AppError } from '../_shared/errors.ts'
import { query, queryOne } from '../_shared/db.ts'

serve(async (req: Request) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const url = new URL(req.url)
    const squadId = url.searchParams.get('id')
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    if (!squadId) {
      throw new AppError('Squad ID is required', 400)
    }

    // Get members
    const members = await query(
      `SELECT sm.role, sm."joinedAt",
              u.id, u."firstName", u."lastName", u.username, u.avatar, u.verified
       FROM squad_members sm
       JOIN users u ON u.id = sm."userId"
       WHERE sm."squadId" = $1
       ORDER BY 
         CASE sm.role
           WHEN 'admin' THEN 1
           WHEN 'moderator' THEN 2
           WHEN 'member' THEN 3
         END,
         sm."joinedAt" ASC
       LIMIT $2 OFFSET $3`,
      [squadId, limit, skip]
    )

    // Get total count
    const totalResult = await queryOne(
      `SELECT COUNT(*) as count FROM squad_members WHERE "squadId" = $1`,
      [squadId]
    )
    const total = parseInt(totalResult?.count || '0')

    // Format members
    const formattedMembers = members.map((m: any) => ({
      id: m.id,
      name: `${m.firstName} ${m.lastName}`.trim() || m.username,
      username: m.username,
      avatar: m.avatar,
      verified: m.verified,
      role: m.role,
      joinedAt: m.joinedAt,
    }))

    return addCorsHeaders(
      new Response(
        JSON.stringify({
          data: formattedMembers,
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


