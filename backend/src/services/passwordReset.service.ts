import prisma from '../config/database'
import { createError } from '../middleware/errorHandler'
import { hashPassword } from '../utils/password'
import { verificationService } from './verification.service'

export const passwordResetService = {
  /**
   * Send password reset code
   */
  async sendPasswordResetCode(email: string) {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      // Don't reveal if email exists or not (security best practice)
      return { success: true, message: 'If the email exists, a reset code has been sent.' }
    }

    // Send reset code
    await verificationService.sendVerificationCode(email, 'password_reset')

    console.log(`[Password Reset] Reset code sent to ${email}`)

    return { success: true, message: 'Password reset code sent successfully' }
  },

  /**
   * Verify password reset code
   */
  async verifyResetCode(email: string, otp: string): Promise<boolean> {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      throw createError('User not found', 404)
    }

    // Verify OTP
    const isValid = await verificationService.verifyPasswordResetCode(email, otp)
    if (!isValid) {
      throw createError('Invalid or expired reset code', 400)
    }

    console.log(`[Password Reset] Reset code verified for ${email}`)

    return true
  },

  /**
   * Reset password after verification
   */
  async resetPassword(email: string, otp: string, newPassword: string): Promise<void> {
    // Verify reset code (if OTP provided, verify it; otherwise check if already verified)
    if (otp) {
      await this.verifyResetCode(email, otp)
    } else {
      // Check if reset code was previously verified
      const verification = await prisma.verification.findFirst({
        where: {
          email,
          type: 'password_reset',
          verified: true,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      })
      if (!verification) {
        throw createError('Reset code verification required', 400)
      }
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      throw createError('User not found', 404)
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword)

    // Update password
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    })

    // Invalidate all refresh tokens (force re-login)
    await prisma.refreshToken.deleteMany({
      where: { userId: user.id },
    })

    console.log(`[Password Reset] Password reset successfully for ${email}`)
  },
}

