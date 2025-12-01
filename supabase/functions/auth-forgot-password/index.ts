/**
 * Send Password Reset Code Edge Function
 * POST /functions/v1/auth-forgot-password
 * Body: { email: string }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors, addCorsHeaders } from '../_shared/cors.ts'
import { handleError, AppError } from '../_shared/errors.ts'
import { queryOne, query } from '../_shared/db.ts'

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

serve(async (req: Request) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    if (req.method !== 'POST') {
      throw new AppError('Method not allowed', 405)
    }

    const body = await req.json()
    const { email } = body

    if (!email) {
      throw new AppError('Email is required', 400)
    }

    // Check if user exists (don't reveal if not - security best practice)
    const user = await queryOne(
      `SELECT id FROM users WHERE email = $1`,
      [email.toLowerCase()]
    )

    if (!user) {
      // Return success even if user doesn't exist (don't reveal email existence)
      return addCorsHeaders(
        new Response(
          JSON.stringify({
            success: true,
            message: 'If the email exists, a reset code has been sent.',
          }),
          {
            headers: { 'Content-Type': 'application/json' },
          }
        )
      )
    }

    // Generate OTP
    const otp = generateOTP()
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes

    // Delete existing reset codes
    await query(
      `DELETE FROM verifications WHERE email = $1 AND type = 'password_reset'`,
      [email.toLowerCase()]
    )

    // Create verification record
    await query(
      `INSERT INTO verifications (email, code, type, "expiresAt", "createdAt")
       VALUES ($1, $2, $3, $4, NOW())`,
      [email.toLowerCase(), otp, 'password_reset', expiresAt]
    )

    // TODO: Send email with reset code
    console.log(`[Password Reset] Reset code for ${email}: ${otp}`)
    
    const isDevelopment = Deno.env.get('ENVIRONMENT') === 'development'

    return addCorsHeaders(
      new Response(
        JSON.stringify({
          success: true,
          message: 'Password reset code sent successfully',
          ...(isDevelopment && { otp }),
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      )
    )
  } catch (error) {
    return addCorsHeaders(handleError(error))
  }
})



