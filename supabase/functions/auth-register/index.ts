/**
 * User Registration Edge Function
 * POST /functions/v1/auth-register
 * Body: { firstName, lastName, email, username, password, confirmPassword, otp? }
 * 
 * Note: For production, consider using Supabase Auth.signUp() instead
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors, addCorsHeaders } from '../_shared/cors.ts'
import { handleError, AppError } from '../_shared/errors.ts'
import { query, queryOne } from '../_shared/db.ts'
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
    const { firstName, lastName, email, username, password, confirmPassword, otp } = body

    // Validation
    if (!firstName || !lastName || !email || !username || !password) {
      throw new AppError('All fields are required', 400)
    }

    if (password !== confirmPassword) {
      throw new AppError('Passwords do not match', 400)
    }

    if (password.length < 8) {
      throw new AppError('Password must be at least 8 characters', 400)
    }

    // Check if user exists
    const existingUser = await queryOne(
      `SELECT id, email, username FROM users WHERE email = $1 OR username = $2`,
      [email.toLowerCase(), username.toLowerCase()]
    )

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        throw new AppError('Email already exists', 409)
      }
      if (existingUser.username === username.toLowerCase()) {
        throw new AppError('Username already exists', 409)
      }
    }

    // Email verification check
    if (otp) {
      const verification = await queryOne(
        `SELECT id, verified FROM verifications 
         WHERE email = $1 AND code = $2 AND type = 'email_verification' AND expires_at > NOW()`,
        [email.toLowerCase(), otp]
      )

      if (!verification || !verification.verified) {
        throw new AppError('Invalid or expired verification code', 400)
      }
    } else {
      // Check if email was previously verified
      const verification = await queryOne(
        `SELECT id FROM verifications 
         WHERE email = $1 AND type = 'email_verification' AND verified = true AND expires_at > NOW()
         ORDER BY created_at DESC LIMIT 1`,
        [email.toLowerCase()]
      )

      if (!verification) {
        throw new AppError('Email verification required. Please verify your email first.', 400)
      }
    }

    // Hash password (using bcrypt via Supabase Edge Function environment)
    // For production, use Supabase Auth.signUp() which handles this automatically
    const bcrypt = await import('https://deno.land/x/bcrypt@v0.4.1/mod.ts')
    const hashedPassword = await bcrypt.hash(password)

    // Create user in database
    const userResult = await queryOne(
      `INSERT INTO users (email, username, "firstName", "lastName", password, "emailVerified", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
       RETURNING id, email, username, "firstName", "lastName", avatar, verified, "createdAt"`,
      [email.toLowerCase(), username.toLowerCase(), firstName, lastName, hashedPassword]
    )

    // Create default settings
    await query(
      `INSERT INTO user_settings ("userId", "createdAt", "updatedAt")
       VALUES ($1, NOW(), NOW())`,
      [userResult.id]
    )

    // Also create user in Supabase Auth for future migration
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false },
    })

    try {
      // Create auth user (optional - for future Supabase Auth migration)
      await supabase.auth.admin.createUser({
        email: email.toLowerCase(),
        password: password,
        user_metadata: {
          firstName,
          lastName,
          username: username.toLowerCase(),
        },
        email_confirm: true, // Mark email as confirmed
      })
    } catch (authError) {
      // Log but don't fail registration if Supabase Auth creation fails
      console.error('Failed to create Supabase Auth user:', authError)
      // Continue with registration
    }

    // Generate JWT token (using existing system)
    // For production, use Supabase session tokens instead
    const jwt = await import('https://deno.land/x/djwt@v2.9/mod.ts')
    const secret = Deno.env.get('JWT_ACCESS_SECRET') || 'your-secret-key'
    
    const tokenPayload = {
      userId: userResult.id,
      email: userResult.email,
      exp: Math.floor(Date.now() / 1000) + (15 * 60), // 15 minutes
    }
    const accessToken = await jwt.create({ alg: 'HS256', typ: 'JWT' }, tokenPayload, secret)

    const refreshTokenPayload = {
      userId: userResult.id,
      email: userResult.email,
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
    }
    const refreshToken = await jwt.create({ alg: 'HS256', typ: 'JWT' }, refreshTokenPayload, secret)

    // Save refresh token
    await query(
      `INSERT INTO refresh_tokens (token, "userId", "expiresAt", "createdAt")
       VALUES ($1, $2, NOW() + INTERVAL '7 days', NOW())`,
      [refreshToken, userResult.id]
    )

    const response = {
      user: {
        id: userResult.id,
        email: userResult.email,
        username: userResult.username,
        name: `${userResult.firstName} ${userResult.lastName}`,
        firstName: userResult.firstName,
        lastName: userResult.lastName,
        avatar: userResult.avatar,
        verified: userResult.verified,
        createdAt: userResult.createdAt,
      },
      token: accessToken,
      refreshToken,
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


