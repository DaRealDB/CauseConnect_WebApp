/**
 * Reset Password Edge Function
 * POST /functions/v1/auth-reset-password
 * Body: { email: string, otp: string, newPassword: string, confirmPassword: string }
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
    const { email, otp, newPassword, confirmPassword } = body

    if (!email || !newPassword) {
      throw new AppError('Email and new password are required', 400)
    }

    if (newPassword !== confirmPassword) {
      throw new AppError('Passwords do not match', 400)
    }

    if (newPassword.length < 8) {
      throw new AppError('Password must be at least 8 characters long', 400)
    }

    // Verify user exists
    const user = await queryOne(
      `SELECT id FROM users WHERE email = $1`,
      [email.toLowerCase()]
    )

    if (!user) {
      throw new AppError('User not found', 404)
    }

    // Check if reset code was verified
    let verification = await queryOne(
      `SELECT id FROM verifications
       WHERE email = $1 AND type = 'password_reset' AND verified = true AND "expiresAt" > NOW()
       ORDER BY "createdAt" DESC
       LIMIT 1`,
      [email.toLowerCase()]
    )

    // If not verified yet, verify the OTP now
    if (!verification && otp) {
      const verificationRecord = await queryOne(
        `SELECT id, code, "expiresAt"
         FROM verifications
         WHERE email = $1 AND type = 'password_reset'
         ORDER BY "createdAt" DESC
         LIMIT 1`,
        [email.toLowerCase()]
      )

      if (!verificationRecord) {
        throw new AppError('Reset code not found', 404)
      }

      if (new Date(verificationRecord.expiresAt) < new Date()) {
        throw new AppError('Reset code has expired', 400)
      }

      if (verificationRecord.code !== otp) {
        throw new AppError('Invalid reset code', 400)
      }

      await query(
        `UPDATE verifications SET verified = true WHERE id = $1`,
        [verificationRecord.id]
      )
      verification = verificationRecord
    }

    if (!verification) {
      throw new AppError('Reset code verification required', 400)
    }

    // Hash new password
    const bcrypt = await import('https://deno.land/x/bcrypt@v0.4.1/mod.ts')
    const hashedPassword = await bcrypt.hash(newPassword)

    // Update password
    await query(
      `UPDATE users SET password = $1, "updatedAt" = NOW() WHERE id = $2`,
      [hashedPassword, user.id]
    )

    // Invalidate all refresh tokens
    await query(
      `DELETE FROM refresh_tokens WHERE "userId" = $1`,
      [user.id]
    )

    // Delete verification record (one-time use)
    await query(
      `DELETE FROM verifications WHERE id = $1`,
      [verification.id]
    ).catch(() => {
      // Ignore deletion errors
    })

    return addCorsHeaders(
      new Response(
        JSON.stringify({
          success: true,
          message: 'Password reset successfully',
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



