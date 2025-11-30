/**
 * User Login Edge Function
 * POST /functions/v1/auth-login
 * Body: { emailOrUsername, password }
 * 
 * Note: For production, consider using Supabase Auth.signInWithPassword() instead
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors, addCorsHeaders } from '../_shared/cors.ts'
import { handleError, AppError } from '../_shared/errors.ts'
import { queryOne, query } from '../_shared/db.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.0'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

serve(async (req: Request) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    if (req.method !== 'POST') {
      throw new AppError('Method not allowed', 405)
    }

    const body = await req.json()
    const { emailOrUsername, password } = body

    if (!emailOrUsername || !password) {
      throw new AppError('Email/username and password are required', 400)
    }

    // Find user by email or username
    const user = await queryOne(
      `SELECT id, email, username, "firstName", "lastName", password, avatar, verified
       FROM users 
       WHERE LOWER(email) = LOWER($1) OR LOWER(username) = LOWER($1)`,
      [emailOrUsername]
    )

    if (!user) {
      throw new AppError('Invalid credentials', 401)
    }

    // Verify password
    const bcrypt = await import('https://deno.land/x/bcrypt@v0.4.1/mod.ts')
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401)
    }

    // Generate JWT tokens
    const jwt = await import('https://deno.land/x/djwt@v2.9/mod.ts')
    const secret = Deno.env.get('JWT_ACCESS_SECRET') || 'your-secret-key'

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + (15 * 60), // 15 minutes
    }
    const accessToken = await jwt.create({ alg: 'HS256', typ: 'JWT' }, tokenPayload, secret)

    const refreshTokenPayload = {
      userId: user.id,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
    }
    const refreshToken = await jwt.create({ alg: 'HS256', typ: 'JWT' }, refreshTokenPayload, secret)

    // Save refresh token
    await query(
      `INSERT INTO refresh_tokens (token, "userId", "expiresAt", "createdAt")
       VALUES ($1, $2, NOW() + INTERVAL '7 days', NOW())`,
      [refreshToken, user.id]
    )

    // Also try to get Supabase session (for future migration)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false },
    })

    let supabaseSession = null
    try {
      // Try to sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password,
      })
      if (!authError && authData.session) {
        supabaseSession = authData.session
      }
    } catch (authError) {
      // If Supabase Auth fails, continue with JWT (for backward compatibility)
      console.log('Supabase Auth login not available, using JWT')
    }

    const response = {
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
      token: accessToken,
      refreshToken,
      supabaseSession, // Include if available for future use
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


