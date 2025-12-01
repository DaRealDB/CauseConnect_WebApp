/**
 * Event List Edge Function
 * GET /functions/v1/event-list?page=1&limit=10&filter=events&tags=tag1,tag2
 * Returns paginated list of events with filtering
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
    const { user: currentUser } = await getUserFromRequest(req)
    const url = new URL(req.url)
    
    // Parse query parameters
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const filter = url.searchParams.get('filter')
    const tags = url.searchParams.get('tags')?.split(',').filter(Boolean) || []
    const search = url.searchParams.get('search') || ''
    const userId = url.searchParams.get('userId')
    const excludeUser = url.searchParams.get('excludeUser') === 'true'
    const requireUserTags = url.searchParams.get('requireUserTags') === 'true'
    const excludeUserTags = url.searchParams.get('excludeUserTags') === 'true'
    
    const skip = (page - 1) * limit
    
    // Build WHERE clause
    let whereConditions = ['e.status = $1']
    const params: any[] = ['active']
    let paramIndex = 2
    
    // User filtering
    if (userId) {
      whereConditions.push(`e."organizationId" = $${paramIndex}`)
      params.push(userId)
      paramIndex++
    }
    
    if (excludeUser && currentUser) {
      whereConditions.push(`e."organizationId" != $${paramIndex}`)
      params.push(currentUser.id)
      paramIndex++
    }
    
    // Tag filtering
    if (tags.length > 0) {
      whereConditions.push(`EXISTS (
        SELECT 1 FROM event_tags et 
        WHERE et."eventId" = e.id 
        AND LOWER(et.name) = ANY($${paramIndex}::text[])
      )`)
      params.push(tags.map(t => t.toLowerCase()))
      paramIndex++
    } else if (requireUserTags && currentUser) {
      // Get user's interest tags
      const userSettings = await query(
        `SELECT "interestTags" FROM user_settings WHERE "userId" = $1`,
        [currentUser.id]
      )
      
      if (userSettings.length > 0 && userSettings[0].interestTags?.length > 0) {
        whereConditions.push(`EXISTS (
          SELECT 1 FROM event_tags et 
          WHERE et."eventId" = e.id 
          AND LOWER(et.name) = ANY($${paramIndex}::text[])
        )`)
        params.push(userSettings[0].interestTags.map((t: string) => t.toLowerCase()))
        paramIndex++
      } else {
        // No tags - return empty result
        whereConditions.push('1 = 0')
      }
    } else if (excludeUserTags && currentUser) {
      const userSettings = await query(
        `SELECT "interestTags" FROM user_settings WHERE "userId" = $1`,
        [currentUser.id]
      )
      
      if (userSettings.length > 0 && userSettings[0].interestTags?.length > 0) {
        whereConditions.push(`NOT EXISTS (
          SELECT 1 FROM event_tags et 
          WHERE et."eventId" = e.id 
          AND LOWER(et.name) = ANY($${paramIndex}::text[])
        )`)
        params.push(userSettings[0].interestTags.map((t: string) => t.toLowerCase()))
        paramIndex++
      }
    }
    
    // Search filtering
    if (search) {
      whereConditions.push(`(
        LOWER(e.title) LIKE $${paramIndex} OR
        LOWER(e.description) LIKE $${paramIndex} OR
        LOWER(e."fullDescription") LIKE $${paramIndex}
      )`)
      params.push(`%${search.toLowerCase()}%`)
      paramIndex++
    }
    
    const whereClause = whereConditions.join(' AND ')
    
    // Get events
    const events = await query(
      `SELECT e.*, 
              u.id as org_id, u."firstName" as org_firstName, u."lastName" as org_lastName,
              u.username as org_username, u.avatar as org_avatar, u.verified as org_verified,
              (SELECT COUNT(*) FROM support_history WHERE "eventId" = e.id) as supporters,
              (SELECT COUNT(*) FROM donations WHERE "eventId" = e.id) as donation_count
       FROM events e
       JOIN users u ON u.id = e."organizationId"
       WHERE ${whereClause}
       ORDER BY e."createdAt" DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, skip]
    )
    
    // Get total count
    const totalResult = await query(
      `SELECT COUNT(*) as count FROM events e WHERE ${whereClause}`,
      params
    )
    const total = parseInt(totalResult[0]?.count || '0')
    
    // Get tags for each event
    const eventsWithTags = await Promise.all(
      events.map(async (event: any) => {
        const eventTags = await query(
          `SELECT name FROM event_tags WHERE "eventId" = $1`,
          [event.id]
        )
        
        // Check if current user supported/bookmarked
        let isSupported = false
        let isBookmarked = false
        
        if (currentUser) {
          const [supportCheck, bookmarkCheck] = await Promise.all([
            query(`SELECT id FROM support_history WHERE "userId" = $1 AND "eventId" = $2`, [currentUser.id, event.id]),
            query(`SELECT id FROM bookmarks WHERE "userId" = $1 AND "eventId" = $2`, [currentUser.id, event.id]),
          ])
          isSupported = supportCheck.length > 0
          isBookmarked = bookmarkCheck.length > 0
        }
        
        return {
          id: event.id,
          title: event.title,
          description: event.description,
          fullDescription: event.fullDescription,
          image: event.image,
          tags: eventTags.map((t: any) => t.name),
          supporters: parseInt(event.supporters),
          goal: parseFloat(event.goalAmount),
          raised: parseFloat(event.raisedAmount),
          organization: {
            id: event.org_id,
            name: `${event.org_firstName} ${event.org_lastName}`.trim() || event.org_username,
            username: event.org_username,
            verified: event.org_verified,
            avatar: event.org_avatar,
          },
          location: event.location,
          targetDate: event.targetDate ? new Date(event.targetDate).toISOString() : null,
          timeLeft: event.targetDate
            ? `${Math.ceil((new Date(event.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left`
            : undefined,
          urgency: event.urgency,
          isSupported,
          isBookmarked,
          createdAt: event.createdAt,
        }
      })
    )
    
    return addCorsHeaders(
      new Response(
        JSON.stringify({
          data: eventsWithTags,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
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




