/**
 * Update Event Edge Function
 * PUT /functions/v1/event-update?id=xxx
 * Body: { title?, description?, fullDescription?, location?, targetDate?, goalAmount?, tags[] }
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
    const eventId = url.searchParams.get('id')
    if (!eventId) {
      throw new AppError('Event ID is required', 400)
    }

    const body = await req.json()
    const { title, description, fullDescription, location, targetDate, goalAmount, tags } = body

    // Verify event exists and user is owner
    const event = await queryOne(
      `SELECT "organizationId" FROM events WHERE id = $1`,
      [eventId]
    )

    if (!event) {
      throw new AppError('Event not found', 404)
    }

    if (event.organizationId !== user.id) {
      throw new AppError('Not authorized to update this event', 403)
    }

    // Build update query
    const updates: string[] = []
    const params: any[] = []
    let paramIndex = 1

    if (title !== undefined) {
      updates.push(`title = $${paramIndex}`)
      params.push(title)
      paramIndex++
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex}`)
      params.push(description)
      paramIndex++
    }
    if (fullDescription !== undefined) {
      updates.push(`"fullDescription" = $${paramIndex}`)
      params.push(fullDescription)
      paramIndex++
    }
    if (location !== undefined) {
      updates.push(`location = $${paramIndex}`)
      params.push(location)
      paramIndex++
    }
    if (targetDate !== undefined) {
      updates.push(`"targetDate" = $${paramIndex}`)
      params.push(targetDate ? new Date(targetDate) : null)
      paramIndex++
    }
    if (goalAmount !== undefined) {
      updates.push(`"goalAmount" = $${paramIndex}`)
      params.push(parseFloat(goalAmount))
      paramIndex++
    }

    if (updates.length === 0 && !tags) {
      throw new AppError('No fields to update', 400)
    }

    updates.push(`"updatedAt" = NOW()`)
    params.push(eventId) // For WHERE clause

    if (updates.length > 1) {
      await query(
        `UPDATE events SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
        params
      )
    }

    // Update tags if provided
    if (tags && Array.isArray(tags)) {
      // Delete existing tags
      await query(`DELETE FROM event_tags WHERE "eventId" = $1`, [eventId])

      // Add new tags
      for (const tagName of tags) {
        await queryOne(
          `INSERT INTO event_tags (name, "eventId", "createdAt")
           VALUES ($1, $2, NOW())
           ON CONFLICT DO NOTHING`,
          [tagName.toLowerCase(), eventId]
        )
      }
    }

    // Get updated event
    const updatedEvent = await queryOne(
      `SELECT e.*, u.id as org_id, u."firstName" as org_firstName, u."lastName" as org_lastName,
              u.username as org_username, u.avatar as org_avatar, u.verified as org_verified
       FROM events e
       JOIN users u ON u.id = e."organizationId"
       WHERE e.id = $1`,
      [eventId]
    )

    const eventTags = await query(
      `SELECT name FROM event_tags WHERE "eventId" = $1`,
      [eventId]
    )

    const response = {
      id: updatedEvent.id,
      title: updatedEvent.title,
      description: updatedEvent.description,
      fullDescription: updatedEvent.fullDescription,
      image: updatedEvent.image,
      tags: eventTags.map((t: any) => t.name),
      location: updatedEvent.location,
      targetDate: updatedEvent.targetDate ? new Date(updatedEvent.targetDate).toISOString() : null,
      goalAmount: parseFloat(updatedEvent.goalAmount),
      raisedAmount: parseFloat(updatedEvent.raisedAmount),
      organization: {
        id: updatedEvent.org_id,
        name: `${updatedEvent.org_firstName} ${updatedEvent.org_lastName}`.trim() || updatedEvent.org_username,
        username: updatedEvent.org_username,
        verified: updatedEvent.org_verified,
        avatar: updatedEvent.org_avatar,
      },
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


