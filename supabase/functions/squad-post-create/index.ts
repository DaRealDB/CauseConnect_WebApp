/**
 * Create Squad Post Edge Function
 * POST /functions/v1/squad-post-create
 * Body: { squadId, content } or FormData with image
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
    let imageFile: File | null = null

    const contentType = req.headers.get('content-type') || ''
    
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      data = {
        squadId: formData.get('squadId'),
        content: formData.get('content'),
      }
      imageFile = formData.get('image') as File | null
    } else {
      data = await req.json()
    }

    const { squadId, content } = data

    if (!squadId || !content) {
      throw new AppError('Squad ID and content are required', 400)
    }

    // Verify user is member of squad
    const member = await queryOne(
      `SELECT role FROM squad_members WHERE "squadId" = $1 AND "userId" = $2`,
      [squadId, user.id]
    )

    if (!member) {
      throw new AppError('Not a member of this squad', 403)
    }

    // Upload image if provided
    let imageUrl: string | null = null
    if (imageFile) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${squadId}/${Date.now()}.${fileExt}`
      const filePath = `squad-posts/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(filePath, imageFile, {
          contentType: imageFile.type,
          upsert: false,
        })

      if (uploadError) {
        throw new AppError(`Failed to upload image: ${uploadError.message}`, 400)
      }

      const { data: urlData } = supabase.storage.from('posts').getPublicUrl(filePath)
      imageUrl = urlData.publicUrl
    }

    // Create squad post
    const postResult = await queryOne(
      `INSERT INTO squad_posts ("squadId", "userId", content, image, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING id, content, image, "createdAt"`,
      [squadId, user.id, content, imageUrl]
    )

    // Get user info
    const userInfo = await queryOne(
      `SELECT id, "firstName", "lastName", username, avatar, verified
       FROM users WHERE id = $1`,
      [user.id]
    )

    const response = {
      id: postResult.id,
      content: postResult.content,
      image: postResult.image,
      user: {
        id: userInfo.id,
        name: `${userInfo.firstName} ${userInfo.lastName}`.trim(),
        username: userInfo.username,
        avatar: userInfo.avatar,
        verified: userInfo.verified,
      },
      likes: 0,
      comments: 0,
      liked: false,
      createdAt: postResult.createdAt,
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




