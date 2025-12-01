/**
 * Leave Squad Edge Function
 * DELETE /functions/v1/squad-leave?id=xxx
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

    if (req.method !== 'DELETE') {
      throw new AppError('Method not allowed', 405)
    }

    const url = new URL(req.url)
    const squadId = url.searchParams.get('id')
    if (!squadId) {
      throw new AppError('Squad ID is required', 400)
    }

    // Check if member
    const member = await queryOne(
      `SELECT role FROM squad_members WHERE "squadId" = $1 AND "userId" = $2`,
      [squadId, user.id]
    )

    if (!member) {
      throw new AppError('Not a member of this squad', 400)
    }

    // Don't allow creator/admin to leave (they should delete squad instead)
    if (member.role === 'admin') {
      throw new AppError('Admins cannot leave. Delete the squad instead.', 400)
    }

    // Remove member
    await query(
      `DELETE FROM squad_members WHERE "squadId" = $1 AND "userId" = $2`,
      [squadId, user.id]
    )

    return addCorsHeaders(
      new Response(JSON.stringify({ message: 'Left squad successfully' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    )
  } catch (error) {
    return addCorsHeaders(handleError(error))
  }
})




