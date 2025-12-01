/**
 * Refresh Token Edge Function
 * POST /functions/v1/auth-refresh
 * Body: { refreshToken: string }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors, addCorsHeaders } from '../_shared/cors.ts'
import { handleError, AppError } from '../_shared/errors.ts'
import { queryOne, query } from '../_shared/db.ts'

serve(async (req: Request) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    if (req.method !== 'POST') {
      throw new AppError('Method not allowed', 405)
    }

    const body = await req.json()
    const { refreshToken } = body

    if (!refreshToken) {
      throw new AppError('Refresh token is required', 400)
    }

    // Verify refresh token
    const jwt = await import('https://deno.land/x/djwt@v2.9/mod.ts')
    const secret = Deno.env.get('JWT_REFRESH_SECRET') || Deno.env.get('JWT_ACCESS_SECRET') || 'your-secret-key'

    let payload
    try {
      payload = await jwt.verify(refreshToken, secret, 'HS256')
    } catch (error) {
      throw new AppError('Invalid or expired refresh token', 401)
    }

    // Check if token exists in database
    const tokenRecord = await queryOne(
      `SELECT "userId", "expiresAt" FROM refresh_tokens WHERE token = $1`,
      [refreshToken]
    )

    if (!tokenRecord) {
      throw new AppError('Refresh token not found', 401)
    }

    // Check if token is expired
    const expiresAt = new Date(tokenRecord.expiresAt)
    if (expiresAt < new Date()) {
      // Delete expired token
      await query(`DELETE FROM refresh_tokens WHERE token = $1`, [refreshToken])
      throw new AppError('Refresh token expired', 401)
    }

    // Get user
    const user = await queryOne(
      `SELECT id, email, username, "firstName", "lastName", avatar, verified
       FROM users WHERE id = $1`,
      [payload.userId]
    )

    if (!user) {
      throw new AppError('User not found', 404)
    }

    // Generate new access token
    const newTokenPayload = {
      userId: user.id,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + (15 * 60), // 15 minutes
    }
    const accessToken = await jwt.create({ alg: 'HS256', typ: 'JWT' }, newTokenPayload, secret)

    const response = {
      token: accessToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: `${user.firstName} ${user.lastName}`,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        verified: user.verified,
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




