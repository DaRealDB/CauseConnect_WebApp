/**
 * Squad Detail Edge Function
 * GET /functions/v1/squad-detail?id=xxx
 * Returns detailed squad information
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors, addCorsHeaders } from '../_shared/cors.ts'
import { getUserFromRequest } from '../_shared/supabase.ts'
import { handleError, AppError } from '../_shared/errors.ts'
import { queryOne } from '../_shared/db.ts'

serve(async (req: Request) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const { user: currentUser } = await getUserFromRequest(req)
    const url = new URL(req.url)
    const squadId = url.searchParams.get('id')
    
    if (!squadId) {
      throw new AppError('Squad ID is required', 400)
    }

    // Get squad
    const squad = await queryOne(
      `SELECT s.*, 
              u.id as creator_id, u."firstName" as creator_firstName, 
              u."lastName" as creator_lastName, u.username as creator_username,
              u.avatar as creator_avatar,
              (SELECT COUNT(*) FROM squad_members WHERE "squadId" = s.id) as members_count,
              (SELECT COUNT(*) FROM squad_posts WHERE "squadId" = s.id) as posts_count
       FROM squads s
       JOIN users u ON u.id = s."creatorId"
       WHERE s.id = $1`,
      [squadId]
    )

    if (!squad) {
      throw new AppError('Squad not found', 404)
    }

    // Get user's role in squad (if member)
    let role: string | undefined
    let isMember = false

    if (currentUser) {
      const member = await queryOne(
        `SELECT role FROM squad_members WHERE "squadId" = $1 AND "userId" = $2`,
        [squadId, currentUser.id]
      )
      if (member) {
        role = member.role
        isMember = true
      }
    }

    const response = {
      id: squad.id,
      name: squad.name,
      description: squad.description,
      avatar: squad.avatar,
      createdAt: squad.createdAt,
      creator: {
        id: squad.creator_id,
        name: `${squad.creator_firstName} ${squad.creator_lastName}`.trim() || squad.creator_username,
        username: squad.creator_username,
        avatar: squad.creator_avatar,
      },
      members: parseInt(squad.members_count),
      posts: parseInt(squad.posts_count),
      role,
      isMember,
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




