/**
 * Update User Profile Edge Function
 * PUT /functions/v1/user-update
 * Body: { firstName?, lastName?, bio?, location?, website?, email? }
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

    const body = await req.json()
    const { firstName, lastName, bio, location, website, email } = body

    // Check if email is being updated and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await queryOne(
        `SELECT id FROM users WHERE email = $1 AND id != $2`,
        [email.toLowerCase(), user.id]
      )
      if (existingUser) {
        throw new AppError('Email already in use', 409)
      }
    }

    // Build update query
    const updates: string[] = []
    const params: any[] = []
    let paramIndex = 1

    if (firstName !== undefined) {
      updates.push(`"firstName" = $${paramIndex}`)
      params.push(firstName)
      paramIndex++
    }
    if (lastName !== undefined) {
      updates.push(`"lastName" = $${paramIndex}`)
      params.push(lastName)
      paramIndex++
    }
    if (bio !== undefined) {
      updates.push(`bio = $${paramIndex}`)
      params.push(bio)
      paramIndex++
    }
    if (location !== undefined) {
      updates.push(`location = $${paramIndex}`)
      params.push(location)
      paramIndex++
    }
    if (website !== undefined) {
      updates.push(`website = $${paramIndex}`)
      params.push(website)
      paramIndex++
    }
    if (email !== undefined) {
      updates.push(`email = $${paramIndex}`)
      params.push(email.toLowerCase())
      paramIndex++
    }

    if (updates.length === 0) {
      throw new AppError('No fields to update', 400)
    }

    updates.push(`"updatedAt" = NOW()`)
    params.push(user.id) // For WHERE clause

    const updateQuery = `
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, email, username, "firstName", "lastName", avatar, "coverImage", 
                bio, location, website, verified, "createdAt"
    `

    const updatedUser = await queryOne(updateQuery, params)

    const response = {
      id: updatedUser.id,
      email: updatedUser.email,
      username: updatedUser.username,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      name: `${updatedUser.firstName} ${updatedUser.lastName}`.trim(),
      avatar: updatedUser.avatar,
      coverImage: updatedUser.coverImage,
      bio: updatedUser.bio,
      location: updatedUser.location,
      website: updatedUser.website,
      verified: updatedUser.verified,
      createdAt: updatedUser.createdAt,
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




