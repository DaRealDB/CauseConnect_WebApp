/**
 * Send Verification Code Edge Function
 * POST /functions/v1/auth-send-verification
 * Body: { email: string, type?: 'email_verification' | 'password_reset' }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors, addCorsHeaders } from '../_shared/cors.ts'
import { handleError, AppError } from '../_shared/errors.ts'
import { queryOne, query } from '../_shared/db.ts'

// Simple OTP generator
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
    const { email, type = 'email_verification' } = body

    if (!email) {
      throw new AppError('Email is required', 400)
    }

    // Generate 6-digit OTP
    const otp = generateOTP()
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes

    // Delete any existing verification codes for this email and type
    await query(
      `DELETE FROM verifications WHERE email = $1 AND type = $2`,
      [email.toLowerCase(), type]
    )

    // Create new verification record
    // Note: In production, you should hash the OTP. For now, storing plain text for simplicity.
    // You'll need to implement email sending service (SendGrid, Resend, etc.)
    await query(
      `INSERT INTO verifications (email, code, type, "expiresAt", "createdAt")
       VALUES ($1, $2, $3, $4, NOW())`,
      [email.toLowerCase(), otp, type, expiresAt]
    )

    // TODO: Send email with OTP
    // For now, we'll log it (in production, use email service)
    console.log(`[Verification] ${type} code for ${email}: ${otp}`)
    
    // In development, you might want to return the OTP for testing
    // In production, remove this and only send via email
    const isDevelopment = Deno.env.get('ENVIRONMENT') === 'development'

    return addCorsHeaders(
      new Response(
        JSON.stringify({
          success: true,
          message: 'Verification code sent successfully',
          // Only include OTP in development
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

