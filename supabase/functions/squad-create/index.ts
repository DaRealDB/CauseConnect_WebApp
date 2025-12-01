/**
 * Create Squad Edge Function
 * POST /functions/v1/squad-create
 * Body: { name, description } or FormData with avatar
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

    if (!name) {
      throw new AppError('Squad name is required', 400)
    }

    // Upload avatar if provided
    let avatarUrl: string | null = null
    if (avatarFile) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
      const fileExt = avatarFile.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
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
      avatarUrl = urlData.publicUrl
    }

    // Create squad
    const squadResult = await queryOne(
      `INSERT INTO squads (name, description, avatar, "creatorId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING id, name, description, avatar, "createdAt"`,
      [name, description || null, avatarUrl, user.id]
    )

    // Add creator as admin member
    await query(
      `INSERT INTO squad_members ("squadId", "userId", role, "createdAt")
       VALUES ($1, $2, 'admin', NOW())`,
      [squadResult.id, user.id]
    )

    // Get creator info
    const creator = await queryOne(
      `SELECT id, "firstName", "lastName", username, avatar
       FROM users WHERE id = $1`,
      [user.id]
    )

    const response = {
      id: squadResult.id,
      name: squadResult.name,
      description: squadResult.description,
      avatar: squadResult.avatar,
      members: 1,
      role: 'admin',
      creator: {
        id: creator.id,
        name: `${creator.firstName} ${creator.lastName}`.trim() || creator.username,
        username: creator.username,
        avatar: creator.avatar,
      },
      createdAt: squadResult.createdAt,
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




