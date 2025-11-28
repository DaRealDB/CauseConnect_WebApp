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
    // Check if user exists first
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      throw createError('User not found', 404)
    }

    // Check if reset code was previously verified (most common case)
    let verification = await prisma.verification.findFirst({
      where: {
        email,
        type: 'password_reset',
        verified: true,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    })

    // If not already verified, verify the OTP if provided
    if (!verification) {
      if (!otp) {
        throw createError('Reset code verification required', 400)
      }
      
      // Verify the OTP
      await this.verifyResetCode(email, otp)
      
      // Get the verified verification record
      verification = await prisma.verification.findFirst({
        where: {
          email,
          type: 'password_reset',
          verified: true,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      })

      if (!verification) {
        throw createError('Reset code verification failed', 400)
      }
    }

    // Hash new password
    console.log(`[Password Reset] Hashing new password for ${email}`)
    const hashedPassword = await hashPassword(newPassword)
    console.log(`[Password Reset] Password hashed successfully for ${email}`)

    // Update password
    console.log(`[Password Reset] Updating password in database for ${email}`)
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    })

    if (!updatedUser) {
      console.error(`[Password Reset] Failed to update password for ${email} - user update returned null`)
      throw createError('Failed to update password', 500)
    }

    console.log(`[Password Reset] Password updated successfully in database for ${email} (userId: ${updatedUser.id})`)

    // Invalidate all refresh tokens (force re-login)
    await prisma.refreshToken.deleteMany({
      where: { userId: user.id },
    })

    // Delete the verification record after successful password reset (one-time use)
    await prisma.verification.delete({
      where: { id: verification.id },
    }).catch((err) => {
      // Log but don't fail if deletion fails
      console.error(`[Password Reset] Failed to delete verification record: ${err.message}`)
    })

    console.log(`[Password Reset] Password reset successfully for ${email}`)
  },
}

