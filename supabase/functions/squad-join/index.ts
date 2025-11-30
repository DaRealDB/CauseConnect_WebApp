/**
 * Join Squad Edge Function
 * POST /functions/v1/squad-join?id=xxx
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

    const url = new URL(req.url)
    const squadId = url.searchParams.get('id')
    if (!squadId) {
      throw new AppError('Squad ID is required', 400)
    }

    // Check if squad exists
    const squad = await queryOne(
      `SELECT id, name FROM squads WHERE id = $1`,
      [squadId]
    )

    if (!squad) {
      throw new AppError('Squad not found', 404)
    }

    // Check if already a member
    const existing = await queryOne(
      `SELECT id FROM squad_members WHERE "squadId" = $1 AND "userId" = $2`,
      [squadId, user.id]
    )

    if (existing) {
      throw new AppError('Already a member of this squad', 400)
    }

    // Add as member
    await query(
      `INSERT INTO squad_members ("squadId", "userId", role, "createdAt")
       VALUES ($1, $2, 'member', NOW())`,
      [squadId, user.id]
    )

    return addCorsHeaders(
      new Response(JSON.stringify({ message: 'Joined squad successfully' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    )
  } catch (error) {
    return addCorsHeaders(handleError(error))
  }
})


