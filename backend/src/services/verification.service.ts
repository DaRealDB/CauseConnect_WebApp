import prisma from '../config/database'
import { createError } from '../middleware/errorHandler'
import { generateOTP, hashOTP, compareOTP, getOTPExpiration } from '../utils/otp'
import { emailService } from '../utils/email'

export const verificationService = {
  /**
   * Send verification code to email
   */
  async sendVerificationCode(email: string, type: 'email_verification' | 'password_reset' = 'email_verification') {
    // Generate 6-digit OTP
    const otp = generateOTP()
    const hashedOTP = await hashOTP(otp)
    const expiresAt = getOTPExpiration()

    // Delete any existing verification codes for this email and type
    await prisma.verification.deleteMany({
      where: {
        email,
        type,
      },
    })

    // Create new verification record
    await prisma.verification.create({
      data: {
        email,
        otpHash: hashedOTP,
        type,
        expiresAt,
      },
    })

    // Send email
    if (type === 'email_verification') {
      await emailService.sendVerificationCode(email, otp)
    } else {
      await emailService.sendPasswordResetCode(email, otp)
    }

    console.log(`[Verification] ${type} code sent to ${email}`)

    return { success: true, message: 'Verification code sent successfully' }
  },

  /**
   * Verify email with OTP code
   */
  async verifyEmail(email: string, otp: string): Promise<boolean> {
    // Find verification record
    const verification = await prisma.verification.findFirst({
      where: {
        email,
        type: 'email_verification',
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (!verification) {
      throw createError('Verification code not found or expired', 404)
    }

    // Check expiration
    if (new Date() > verification.expiresAt) {
      await prisma.verification.delete({
        where: { id: verification.id },
      })
      throw createError('Verification code has expired', 400)
    }

    // Verify OTP
    const isValid = await compareOTP(otp, verification.otpHash)
    if (!isValid) {
      throw createError('Invalid verification code', 400)
    }

    // Mark as verified instead of deleting (so we can check during registration)
    await prisma.verification.update({
      where: { id: verification.id },
      data: { verified: true },
    })

    console.log(`[Verification] Email ${email} verified successfully`)

    return true
  },

  /**
   * Verify password reset code
   */
  async verifyPasswordResetCode(email: string, otp: string): Promise<boolean> {
    // Find verification record
    const verification = await prisma.verification.findFirst({
      where: {
        email,
        type: 'password_reset',
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (!verification) {
      throw createError('Reset code not found or expired', 404)
    }

    // Check expiration
    if (new Date() > verification.expiresAt) {
      await prisma.verification.delete({
        where: { id: verification.id },
      })
      throw createError('Reset code has expired', 400)
    }

    // If already verified, return true (allow reuse for password reset flow)
    if (verification.verified) {
      console.log(`[Verification] Password reset code already verified for ${email}`)
      return true
    }

    // Verify OTP
    const isValid = await compareOTP(otp, verification.otpHash)
    if (!isValid) {
      throw createError('Invalid reset code', 400)
    }

    // Mark as verified instead of deleting (so we can check during password reset)
    await prisma.verification.update({
      where: { id: verification.id },
      data: { verified: true },
    })

    console.log(`[Verification] Password reset code verified for ${email}`)

    return true
  },

  /**
   * Check if email verification was completed
   */
  async isEmailVerified(email: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { emailVerified: true },
    })

    return user?.emailVerified || false
  },

  /**
   * Mark email as verified
   */
  async markEmailAsVerified(email: string): Promise<void> {
    await prisma.user.update({
      where: { email },
      data: { emailVerified: true },
    })
  },

  /**
   * Clean up expired verification codes (utility function)
   */
  async cleanupExpiredCodes(): Promise<void> {
    const deleted = await prisma.verification.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    })
    console.log(`[Verification] Cleaned up ${deleted.count} expired verification codes`)
  },
}

