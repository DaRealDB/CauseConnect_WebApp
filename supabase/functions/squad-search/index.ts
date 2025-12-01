/**
 * Search Squads Edge Function
 * GET /functions/v1/squad-search?query=xxx&limit=10
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors, addCorsHeaders } from '../_shared/cors.ts'
import { handleError, AppError } from '../_shared/errors.ts'
import { query } from '../_shared/db.ts'

serve(async (req: Request) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const url = new URL(req.url)
    const searchQuery = url.searchParams.get('query')?.trim() || ''
    const limit = parseInt(url.searchParams.get('limit') || '10')
    
    if (!searchQuery || searchQuery.length === 0) {
      return addCorsHeaders(
        new Response(JSON.stringify([]), {
          headers: { 'Content-Type': 'application/json' },
        })
      )
    }

    const squads = await query(
      `SELECT s.*, 
              u.id as creator_id, u."firstName" as creator_firstName, 
              u."lastName" as creator_lastName, u.username as creator_username,
              u.avatar as creator_avatar,
              (SELECT COUNT(*) FROM squad_members WHERE "squadId" = s.id) as members_count
       FROM squads s
       JOIN users u ON u.id = s."creatorId"
       WHERE LOWER(s.name) LIKE $1 OR LOWER(s.description) LIKE $1
       ORDER BY s."createdAt" DESC
       LIMIT $2`,
      [`%${searchQuery.toLowerCase()}%`, limit]
    )

    const formattedSquads = squads.map((squad: any) => ({
      id: squad.id,
      name: squad.name,
      description: squad.description,
      avatar: squad.avatar,
      members: parseInt(squad.members_count),
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




