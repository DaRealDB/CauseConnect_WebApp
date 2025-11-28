import { Request, Response, NextFunction } from 'express'
import { validationResult } from 'express-validator'
import { authService } from '../services/auth.service'
import { verificationService } from '../services/verification.service'
import { passwordResetService } from '../services/passwordReset.service'
import { createError } from '../middleware/errorHandler'

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw createError('Validation failed', 400)
      }

      const { firstName, lastName, email, username, password, confirmPassword } = req.body

      if (password !== confirmPassword) {
        throw createError('Passwords do not match', 400)
      }

      // Verify email first
      if (!req.body.otp) {
        throw createError('Email verification required. Please verify your email first.', 400)
      }

      const result = await authService.register({
        firstName,
        lastName,
        email,
        username,
        password,
        otp: req.body.otp,
      })

      res.status(201).json(result)
    } catch (error: any) {
      next(error)
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw createError('Validation failed', 400)
      }

      const { emailOrUsername, password } = req.body

      const result = await authService.login({ emailOrUsername, password })

      res.json(result)
    } catch (error: any) {
      next(error)
    }
  },

  async getCurrentUser(req: any, res: Response, next: NextFunction) {
    try {
      const user = await authService.getCurrentUser(req.userId)
      res.json(user)
    } catch (error: any) {
      next(error)
    }
  },

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body

      if (!refreshToken) {
        throw createError('Refresh token is required', 400)
      }

      const result = await authService.refreshToken(refreshToken)
      res.json(result)
    } catch (error: any) {
      next(error)
    }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body

      if (refreshToken) {
        await authService.logout(refreshToken)
      }

      res.json({ message: 'Logged out successfully' })
    } catch (error: any) {
      next(error)
    }
  },

  async sendVerificationCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, type } = req.body

      if (!email) {
        throw createError('Email is required', 400)
      }

      const result = await verificationService.sendVerificationCode(
        email,
        type || 'email_verification'
      )
      res.json(result)
    } catch (error: any) {
      next(error)
    }
  },

  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otp } = req.body

      if (!email || !otp) {
        throw createError('Email and OTP are required', 400)
      }

      const isValid = await verificationService.verifyEmail(email, otp)
      res.json({ success: isValid, message: 'Email verified successfully' })
    } catch (error: any) {
      next(error)
    }
  },

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body

      if (!email) {
        throw createError('Email is required', 400)
      }

      const result = await passwordResetService.sendPasswordResetCode(email)
      res.json(result)
    } catch (error: any) {
      next(error)
    }
  },

  async verifyResetCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otp } = req.body

      if (!email || !otp) {
        throw createError('Email and OTP are required', 400)
      }

      const isValid = await passwordResetService.verifyResetCode(email, otp)
      res.json({ success: isValid, message: 'Reset code verified successfully' })
    } catch (error: any) {
      next(error)
    }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, otp, newPassword, confirmPassword } = req.body

      if (!email || !newPassword) {
        throw createError('Email and new password are required', 400)
      }

      if (newPassword !== confirmPassword) {
        throw createError('Passwords do not match', 400)
      }

      if (newPassword.length < 8) {
        throw createError('Password must be at least 8 characters long', 400)
      }

      await passwordResetService.resetPassword(email, otp || '', newPassword)
      res.json({ success: true, message: 'Password reset successfully' })
    } catch (error: any) {
      next(error)
    }
  },
}







