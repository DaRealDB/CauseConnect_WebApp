/**
 * Squad List Edge Function
 * GET /functions/v1/squad-list
 * Returns list of squads user is a member of
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

    // Get squads user is a member of
    const squads = await query(
      `SELECT s.*, 
              u.id as creator_id, u."firstName" as creator_firstName, 
              u."lastName" as creator_lastName, u.username as creator_username,
              u.avatar as creator_avatar,
              sm.role as user_role,
              (SELECT COUNT(*) FROM squad_members WHERE "squadId" = s.id) as members_count
       FROM squads s
       JOIN users u ON u.id = s."creatorId"
       JOIN squad_members sm ON sm."squadId" = s.id
       WHERE sm."userId" = $1
       ORDER BY s."createdAt" DESC`,
      [user.id]
    )

    const formattedSquads = squads.map((squad: any) => ({
      id: squad.id,
      name: squad.name,
      description: squad.description,
      avatar: squad.avatar,
      members: parseInt(squad.members_count),
      role: squad.user_role,
      creator: {
        id: squad.creator_id,
        name: `${squad.creator_firstName} ${squad.creator_lastName}`.trim() || squad.creator_username,
        username: squad.creator_username,
        avatar: squad.creator_avatar,
      },
      createdAt: squad.createdAt,
    }))

    return addCorsHeaders(
      new Response(JSON.stringify(formattedSquads), {
        headers: { 'Content-Type': 'application/json' },
      })
    )
  } catch (error) {
    return addCorsHeaders(handleError(error))
  }
})




