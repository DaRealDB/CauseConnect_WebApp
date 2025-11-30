/**
 * Create Post Edge Function
 * POST /functions/v1/post-create
 * Body: { content, tags[] } or FormData with image
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
        content: formData.get('content'),
        tags: formData.get('tags') ? JSON.parse(formData.get('tags') as string) : [],
      }
      imageFile = formData.get('image') as File | null
    } else {
      data = await req.json()
    }

    const { content, tags } = data

    if (!content) {
      throw new AppError('Content is required', 400)
    }

    // Upload image if provided
    let imageUrl: string | null = null
    if (imageFile) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`
      const filePath = `posts/${fileName}`

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

    // Create post
    const postResult = await queryOne(
      `INSERT INTO posts (content, image, "userId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING id, content, image, "createdAt"`,
      [content, imageUrl, user.id]
    )

    // Add tags if provided
    const tagArray = Array.isArray(tags) ? tags : (tags ? [tags] : [])
    if (tagArray.length > 0) {
      for (const tagName of tagArray) {
        await queryOne(
          `INSERT INTO post_tags (name, "postId", "createdAt")
           VALUES ($1, $2, NOW())
           ON CONFLICT DO NOTHING`,
          [tagName.toLowerCase(), postResult.id]
        )
      }
    }

    // Get user info
    const userInfo = await queryOne(
      `SELECT id, "firstName", "lastName", username, avatar, verified
       FROM users WHERE id = $1`,
      [user.id]
    )

    const response = {
      post: {
        id: postResult.id,
        user: {
          id: userInfo.id,
          name: `${userInfo.firstName} ${userInfo.lastName}`.trim(),
          username: userInfo.username,
          avatar: userInfo.avatar,
          verified: userInfo.verified,
        },
        content: postResult.content,
        image: postResult.image,
        tags: tagArray,
        timestamp: postResult.createdAt,
        likes: 0,
        comments: 0,
        shares: 0,
        liked: false,
        bookmarked: false,
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


