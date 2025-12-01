/**
 * Update Custom Feed Edge Function
 * PUT /functions/v1/custom-feed-update?id=xxx
 * Body: { name?: string, tags?: string[] }
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

    if (req.method !== 'PUT') {
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

    const body = await req.json()
    const { name, tags } = body

    // Build update query
    const updates: string[] = []
    const params: any[] = []
    let paramIndex = 1

    if (name !== undefined) {
      updates.push(`name = $${paramIndex}`)
      params.push(name)
      paramIndex++
    }

    if (tags !== undefined) {
      if (!Array.isArray(tags) || tags.length === 0) {
        throw new AppError('Tags must be a non-empty array', 400)
      }
      updates.push(`tags = $${paramIndex}`)
      params.push(JSON.stringify(tags))
      paramIndex++
    }

    if (updates.length === 0) {
      throw new AppError('No fields to update', 400)
    }

    updates.push(`"updatedAt" = NOW()`)
    params.push(feedId) // For WHERE clause

    await query(
      `UPDATE custom_feeds SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      params
    )

    // Get updated feed
    const updatedFeed = await queryOne(
      `SELECT id, name, tags, "createdAt", "updatedAt"
       FROM custom_feeds WHERE id = $1`,
      [feedId]
    )

    const response = {
      id: updatedFeed.id,
      name: updatedFeed.name,
      tags: typeof updatedFeed.tags === 'string' ? JSON.parse(updatedFeed.tags) : updatedFeed.tags,
      createdAt: updatedFeed.createdAt,
      updatedAt: updatedFeed.updatedAt,
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



