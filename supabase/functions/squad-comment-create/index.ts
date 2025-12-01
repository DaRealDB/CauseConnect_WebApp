/**
 * Create Squad Post Comment Edge Function
 * POST /functions/v1/squad-comment-create
 * Body: { squadPostId: string, content: string, parentId?: string }
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
    const { squadPostId, content, parentId } = body

    if (!squadPostId || !content) {
      throw new AppError('Post ID and content are required', 400)
    }

    // Verify post exists and user is member of squad
    const post = await queryOne(
      `SELECT sp."squadId" FROM squad_posts sp
       JOIN squad_members sm ON sm."squadId" = sp."squadId"
       WHERE sp.id = $1 AND sm."userId" = $2`,
      [squadPostId, user.id]
    )

    if (!post) {
      throw new AppError('Post not found or you are not a member', 404)
    }

    // Verify parent comment exists if provided
    if (parentId) {
      const parent = await queryOne(
        `SELECT id FROM squad_post_comments WHERE id = $1 AND "squadPostId" = $2`,
        [parentId, squadPostId]
      )

      if (!parent) {
        throw new AppError('Parent comment not found', 404)
      }
    }

    // Create comment
    const commentResult = await queryOne(
      `INSERT INTO squad_post_comments ("squadPostId", "userId", content, "parentId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING id, content, "createdAt"`,
      [squadPostId, user.id, content, parentId || null]
    )

    // Get user info
    const userInfo = await queryOne(
      `SELECT id, "firstName", "lastName", username, avatar, verified
       FROM users WHERE id = $1`,
      [user.id]
    )

    const response = {
      id: commentResult.id,
      content: commentResult.content,
      user: {
        id: userInfo.id,
        name: `${userInfo.firstName} ${userInfo.lastName}`.trim(),
        username: userInfo.username,
        avatar: userInfo.avatar,
        verified: userInfo.verified,
      },
      likes: 0,
      liked: false,
      replies: [],
      createdAt: commentResult.createdAt,
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



