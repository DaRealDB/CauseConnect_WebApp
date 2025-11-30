/**
 * Verify Password Reset Code Edge Function
 * POST /functions/v1/auth-verify-reset
 * Body: { email: string, otp: string }
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
    const { email, otp } = body

    if (!email || !otp) {
      throw new AppError('Email and OTP are required', 400)
    }

    // Verify user exists
    const user = await queryOne(
      `SELECT id FROM users WHERE email = $1`,
      [email.toLowerCase()]
    )

    if (!user) {
      throw new AppError('User not found', 404)
    }

    // Find verification record
    const verification = await queryOne(
      `SELECT id, code, "expiresAt"
       FROM verifications
       WHERE email = $1 AND type = 'password_reset'
       ORDER BY "createdAt" DESC
       LIMIT 1`,
      [email.toLowerCase()]
    )

    if (!verification) {
      throw new AppError('Reset code not found or expired', 404)
    }

    // Check expiration
    const expiresAt = new Date(verification.expiresAt)
    if (expiresAt < new Date()) {
      await query(`DELETE FROM verifications WHERE id = $1`, [verification.id])
      throw new AppError('Reset code has expired', 400)
    }

    // Verify OTP
    if (verification.code !== otp) {
      throw new AppError('Invalid reset code', 400)
    }

    // Mark as verified
    await query(
      `UPDATE verifications SET verified = true WHERE id = $1`,
      [verification.id]
    )

    return addCorsHeaders(
      new Response(
        JSON.stringify({
          success: true,
          message: 'Reset code verified successfully',
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

