/**
 * Get Custom Feeds Edge Function
 * GET /functions/v1/custom-feed-list
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

    const feeds = await query(
      `SELECT id, name, tags, "createdAt", "updatedAt"
       FROM custom_feeds
       WHERE "userId" = $1
       ORDER BY "createdAt" DESC`,
      [user.id]
    )

    const formatted = feeds.map((feed: any) => ({
      id: feed.id,
      name: feed.name,
      tags: typeof feed.tags === 'string' ? JSON.parse(feed.tags) : feed.tags,
      createdAt: feed.createdAt,
      updatedAt: feed.updatedAt,
    }))

    return addCorsHeaders(
      new Response(JSON.stringify(formatted), {
        headers: { 'Content-Type': 'application/json' },
      })
    )
  } catch (error) {
    return addCorsHeaders(handleError(error))
  }
})



