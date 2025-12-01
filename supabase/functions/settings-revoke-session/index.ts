/**
 * Revoke Session Edge Function
 * DELETE /functions/v1/settings-revoke-session
 * Body: { tokenId: string }
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

    if (req.method !== 'DELETE') {
      throw new AppError('Method not allowed', 405)
    }

    const body = await req.json().catch(() => ({}))
    const tokenId = body.tokenId || new URL(req.url).searchParams.get('tokenId')

    if (!tokenId) {
      throw new AppError('tokenId is required', 400)
    }

    // Verify ownership
    const token = await queryOne(
      `SELECT * FROM tokens WHERE id = $1 AND "userId" = $2`,
      [tokenId, user.id]
    )

    if (!token) {
      throw new AppError('Session not found', 404)
    }

    // Delete token/session
    await query(
      `DELETE FROM tokens WHERE id = $1`,
      [tokenId]
    )

    return addCorsHeaders(
      new Response(
        JSON.stringify({
          success: true,
          message: 'Session revoked',
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



