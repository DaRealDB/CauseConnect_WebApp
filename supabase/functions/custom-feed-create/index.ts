/**
 * Create Custom Feed Edge Function
 * POST /functions/v1/custom-feed-create
 * Body: { name: string, tags: string[] }
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
    const { name, tags } = body

    if (!name) {
      throw new AppError('Feed name is required', 400)
    }

    if (!tags || !Array.isArray(tags) || tags.length === 0) {
      throw new AppError('At least one tag is required', 400)
    }

    // Create custom feed
    const feedResult = await queryOne(
      `INSERT INTO custom_feeds (name, tags, "userId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING id, name, tags, "createdAt"`,
      [name, JSON.stringify(tags), user.id]
    )

    const response = {
      id: feedResult.id,
      name: feedResult.name,
      tags: typeof feedResult.tags === 'string' ? JSON.parse(feedResult.tags) : feedResult.tags,
      createdAt: feedResult.createdAt,
    }

    return addCorsHeaders(
      new Response(JSON.stringify(response), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      })
    )
  } catch (error) {
    return addCorsHeaders(handleError(error))
  }
})

