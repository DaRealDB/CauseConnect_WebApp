/**
 * Get Custom Feed Detail Edge Function
 * GET /functions/v1/custom-feed-detail?id=xxx
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
    const { user, error: authError } = await getUserFromRequest(req)
    if (authError || !user) {
      throw new AppError('Unauthorized', 401)
    }

    const url = new URL(req.url)
    const feedId = url.searchParams.get('id')

    if (!feedId) {
      throw new AppError('Feed ID is required', 400)
    }

    const feed = await queryOne(
      `SELECT id, name, tags, "createdAt", "updatedAt"
       FROM custom_feeds
       WHERE id = $1 AND "userId" = $2`,
      [feedId, user.id]
    )

    if (!feed) {
      throw new AppError('Custom feed not found', 404)
    }

    const response = {
      id: feed.id,
      name: feed.name,
      tags: typeof feed.tags === 'string' ? JSON.parse(feed.tags) : feed.tags,
      createdAt: feed.createdAt,
      updatedAt: feed.updatedAt,
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

