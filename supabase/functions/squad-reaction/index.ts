/**
 * Toggle Reaction on Squad Post Edge Function
 * POST /functions/v1/squad-reaction
 * Body: { squadPostId: string, type?: 'like' }
 * Toggles like on a squad post
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

    const body = await req.json()
    const { squadPostId, commentId, type = 'like' } = body

    if (!squadPostId && !commentId) {
      throw new AppError('Post ID or Comment ID is required', 400)
    }

    // Check if already liked
    const existing = await queryOne(
      `SELECT id FROM squad_post_likes 
       WHERE "userId" = $1 AND "squadPostId" = $2 AND "commentId" = $3`,
      [user.id, squadPostId || null, commentId || null]
    )

    if (existing) {
      // Unlike
      await query(
        `DELETE FROM squad_post_likes WHERE id = $1`,
        [existing.id]
      )

      return addCorsHeaders(
        new Response(JSON.stringify({ liked: false }), {
          headers: { 'Content-Type': 'application/json' },
        })
      )
    } else {
      // Like
      await query(
        `INSERT INTO squad_post_likes ("userId", "squadPostId", "commentId", type, "createdAt")
         VALUES ($1, $2, $3, $4, NOW())`,
        [user.id, squadPostId || null, commentId || null, type]
      )

      return addCorsHeaders(
        new Response(JSON.stringify({ liked: true }), {
          headers: { 'Content-Type': 'application/json' },
        })
      )
    }
  } catch (error) {
    return addCorsHeaders(handleError(error))
  }
})

