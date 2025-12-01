/**
 * Unlike Post Edge Function
 * DELETE /functions/v1/post-unlike
 * Body: { postId: string }
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
    const postId = body.postId || new URL(req.url).searchParams.get('postId')

    if (!postId) {
      throw new AppError('postId is required', 400)
    }

    // Toggle like (same as likePost - delete if exists, create if not)
    const existing = await queryOne(
      `SELECT id FROM post_likes WHERE "postId" = $1 AND "userId" = $2`,
      [postId, user.id]
    )

    if (existing) {
      await query(
        `DELETE FROM post_likes WHERE id = $1`,
        [existing.id]
      )
    }

    return addCorsHeaders(
      new Response(
        JSON.stringify({
          success: true,
          message: 'Post unliked',
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



