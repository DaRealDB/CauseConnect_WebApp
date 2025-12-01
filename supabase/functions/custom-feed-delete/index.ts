/**
 * Delete Custom Feed Edge Function
 * DELETE /functions/v1/custom-feed-delete?id=xxx
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
    const feedId = url.searchParams.get('id')

    if (!feedId) {
      throw new AppError('Feed ID is required', 400)
    }

    // Verify feed exists and user owns it
    const feed = await queryOne(
      `SELECT id FROM custom_feeds WHERE id = $1 AND "userId" = $2`,
      [feedId, user.id]
    )

    if (!feed) {
      throw new AppError('Custom feed not found', 404)
    }

    // Delete feed
    await query(`DELETE FROM custom_feeds WHERE id = $1`, [feedId])

    return addCorsHeaders(
      new Response(JSON.stringify({ message: 'Custom feed deleted successfully' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    )
  } catch (error) {
    return addCorsHeaders(handleError(error))
  }
})



