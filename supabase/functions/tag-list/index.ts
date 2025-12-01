/**
 * Get All Tags Edge Function
 * GET /functions/v1/tag-list
 * Returns list of all unique tags
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors, addCorsHeaders } from '../_shared/cors.ts'
import { handleError, AppError } from '../_shared/errors.ts'
import { query } from '../_shared/db.ts'

serve(async (req: Request) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    // Get unique tags from events
    const eventTags = await query(
      `SELECT DISTINCT name, COUNT(*) as count
       FROM event_tags
       GROUP BY name
       ORDER BY count DESC, name ASC`
    )

    // Get unique tags from posts
    const postTags = await query(
      `SELECT DISTINCT name, COUNT(*) as count
       FROM post_tags
       GROUP BY name
       ORDER BY count DESC, name ASC`
    )

    // Combine and deduplicate
    const tagMap = new Map<string, number>()
    
    eventTags.forEach((tag: any) => {
      const existing = tagMap.get(tag.name) || 0
      tagMap.set(tag.name, existing + parseInt(tag.count))
    })
    
    postTags.forEach((tag: any) => {
      const existing = tagMap.get(tag.name) || 0
      tagMap.set(tag.name, existing + parseInt(tag.count))
    })

    // Convert to array and sort
    const tags = Array.from(tagMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))

    return addCorsHeaders(
      new Response(JSON.stringify(tags), {
        headers: { 'Content-Type': 'application/json' },
      })
    )
  } catch (error) {
    return addCorsHeaders(handleError(error))
  }
})




