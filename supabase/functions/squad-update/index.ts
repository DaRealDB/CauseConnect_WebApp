/**
 * Update Squad Edge Function
 * PATCH /functions/v1/squad-update?id=xxx
 * Body: { name?, description? } or FormData with avatar
 * Admin only
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

    if (req.method !== 'PATCH') {
      throw new AppError('Method not allowed', 405)
    }

    const url = new URL(req.url)
    const squadId = url.searchParams.get('id')
    if (!squadId) {
      throw new AppError('Squad ID is required', 400)
    }

    // Verify user is admin
    const member = await queryOne(
      `SELECT role FROM squad_members WHERE "squadId" = $1 AND "userId" = $2`,
      [squadId, user.id]
    )

    if (!member || member.role !== 'admin') {
      throw new AppError('Only squad admins can update the squad', 403)
    }

    let data: any
    let avatarFile: File | null = null

    const contentType = req.headers.get('content-type') || ''
    
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      data = {
        name: formData.get('name'),
        description: formData.get('description'),
      }
      avatarFile = formData.get('avatar') as File | null
    } else {
      data = await req.json()
    }

    const { name, description } = data

    // Build update query
    const updates: string[] = []
    const params: any[] = []
    let paramIndex = 1

    // Upload avatar if provided
    if (avatarFile) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
      const fileExt = avatarFile.name.split('.').pop()
      const fileName = `${squadId}/${Date.now()}.${fileExt}`
      const filePath = `squad-avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('squad-avatars')
        .upload(filePath, avatarFile, {
          contentType: avatarFile.type,
          upsert: false,
        })

      if (uploadError) {
        throw new AppError(`Failed to upload avatar: ${uploadError.message}`, 400)
      }

      const { data: urlData } = supabase.storage.from('squad-avatars').getPublicUrl(filePath)
      updates.push(`avatar = $${paramIndex}`)
      params.push(urlData.publicUrl)
      paramIndex++
    }

    if (name !== undefined) {
      updates.push(`name = $${paramIndex}`)
      params.push(name)
      paramIndex++
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex}`)
      params.push(description)
      paramIndex++
    }

    if (updates.length === 0) {
      throw new AppError('No fields to update', 400)
    }

    updates.push(`"updatedAt" = NOW()`)
    params.push(squadId) // For WHERE clause

    await query(
      `UPDATE squads SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      params
    )

    // Get updated squad
    const updatedSquad = await queryOne(
      `SELECT s.*, 
              u.id as creator_id, u."firstName" as creator_firstName, 
              u."lastName" as creator_lastName, u.username as creator_username,
              u.avatar as creator_avatar,
              (SELECT COUNT(*) FROM squad_members WHERE "squadId" = s.id) as members_count,
              (SELECT COUNT(*) FROM squad_posts WHERE "squadId" = s.id) as posts_count
       FROM squads s
       JOIN users u ON u.id = s."creatorId"
       WHERE s.id = $1`,
      [squadId]
    )

    const response = {
      id: updatedSquad.id,
      name: updatedSquad.name,
      description: updatedSquad.description,
      avatar: updatedSquad.avatar,
      members: parseInt(updatedSquad.members_count),
      posts: parseInt(updatedSquad.posts_count),
      role: 'admin',
      creator: {
        id: updatedSquad.creator_id,
        name: `${updatedSquad.creator_firstName} ${updatedSquad.creator_lastName}`.trim() || updatedSquad.creator_username,
        username: updatedSquad.creator_username,
        avatar: updatedSquad.creator_avatar,
      },
      createdAt: updatedSquad.createdAt,
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




