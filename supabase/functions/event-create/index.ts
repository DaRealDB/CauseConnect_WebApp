/**
 * Create Event Edge Function
 * POST /functions/v1/event-create
 * Body: { title, description, fullDescription?, location?, targetDate?, goalAmount?, tags[] }
 * Files: image (multipart/form-data)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors, addCorsHeaders } from '../_shared/cors.ts'
import { getUserFromRequest } from '../_shared/supabase.ts'
import { handleError, AppError } from '../_shared/errors.ts'
import { queryOne, query } from '../_shared/db.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.0'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

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

    // Handle multipart/form-data or JSON
    let data: any
    let imageFile: File | null = null

    const contentType = req.headers.get('content-type') || ''
    
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      data = {
        title: formData.get('title'),
        description: formData.get('description'),
        fullDescription: formData.get('fullDescription'),
        location: formData.get('location'),
        targetDate: formData.get('targetDate'),
        goalAmount: formData.get('goalAmount'),
        tags: formData.getAll('tags').filter(Boolean),
      }
      imageFile = formData.get('image') as File | null
    } else {
      data = await req.json()
    }

    const { title, description, fullDescription, location, targetDate, goalAmount, tags } = data

    if (!title || !description) {
      throw new AppError('Title and description are required', 400)
    }

    // Upload image to Supabase Storage if provided
    let imageUrl: string | null = null
    if (imageFile) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`
      const filePath = `events/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('events')
        .upload(filePath, imageFile, {
          contentType: imageFile.type,
          upsert: false,
        })

      if (uploadError) {
        throw new AppError(`Failed to upload image: ${uploadError.message}`, 400)
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from('events').getPublicUrl(filePath)
      imageUrl = urlData.publicUrl
    }

    // Create event
    const eventResult = await queryOne(
      `INSERT INTO events (
        title, description, "fullDescription", image, location, 
        "targetDate", "goalAmount", "organizationId", status, "createdAt", "updatedAt"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', NOW(), NOW())
      RETURNING id, title, description, image, "createdAt"`,
      [
        title,
        description,
        fullDescription || description,
        imageUrl,
        location || null,
        targetDate ? new Date(targetDate) : null,
        goalAmount ? parseFloat(goalAmount) : 0,
        user.id,
      ]
    )

    // Add tags if provided
    if (tags && Array.isArray(tags) && tags.length > 0) {
      for (const tagName of tags) {
        // Create or find tag
        let tag = await queryOne(
          `SELECT id FROM event_tags WHERE name = $1 AND "eventId" = $2`,
          [tagName.toLowerCase(), eventResult.id]
        )

        if (!tag) {
          tag = await queryOne(
            `INSERT INTO event_tags (name, "eventId", "createdAt")
             VALUES ($1, $2, NOW())
             RETURNING id`,
            [tagName.toLowerCase(), eventResult.id]
          )
        }
      }
    }

    // Get organization info
    const org = await queryOne(
      `SELECT id, "firstName", "lastName", username, avatar, verified
       FROM users WHERE id = $1`,
      [user.id]
    )

    const response = {
      event: {
        id: eventResult.id,
        title: eventResult.title,
        description: eventResult.description,
        image: eventResult.image,
        tags: tags || [],
        organization: {
          id: org.id,
          name: `${org.firstName} ${org.lastName}`.trim() || org.username,
          verified: org.verified,
        },
      },
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




