/**
 * User Search Edge Function
 * GET /functions/v1/user-search?query=john&limit=10
 * Returns list of users matching search query
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors, addCorsHeaders } from '../_shared/cors.ts'
import { handleError } from '../_shared/errors.ts'
import { query } from '../_shared/db.ts'

serve(async (req: Request) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const url = new URL(req.url)
    const searchQuery = url.searchParams.get('query')?.trim() || ''
    const limit = parseInt(url.searchParams.get('limit') || '10')
    
    if (!searchQuery || searchQuery.length === 0) {
      return addCorsHeaders(
        new Response(JSON.stringify([]), {
          headers: { 'Content-Type': 'application/json' },
        })
      )
    }
    
    const users = await query(
      `SELECT id, username, "firstName", "lastName", email, avatar, verified
       FROM users
       WHERE LOWER(username) LIKE $1
          OR LOWER(email) LIKE $1
          OR LOWER("firstName") LIKE $1
          OR LOWER("lastName") LIKE $1
          OR LOWER(CONCAT("firstName", ' ', "lastName")) LIKE $1
       LIMIT $2`,
      [`%${searchQuery.toLowerCase()}%`, limit]
    )
    
    const formattedUsers = users.map((user: any) => ({
      id: user.id,
      username: user.username,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      avatar: user.avatar,
      verified: user.verified,
    }))
    
    return addCorsHeaders(
      new Response(JSON.stringify(formattedUsers), {
        headers: { 'Content-Type': 'application/json' },
      })
    )
  } catch (error) {
    return addCorsHeaders(handleError(error))
  }
})




