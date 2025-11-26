import { Response, NextFunction } from 'express'
import { AuthRequest } from './auth'
import prisma from '../config/database'
import { createError } from './errorHandler'

/**
 * Middleware to ensure user has verified their email
 * Use this on routes that require email verification (e.g., donations)
 */
export const requireEmailVerification = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ message: 'Authentication required' })
      return
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { emailVerified: true },
    })

    if (!user) {
      res.status(404).json({ message: 'User not found' })
      return
    }

    if (!user.emailVerified) {
      res.status(403).json({ 
        message: 'Email verification required. Please verify your email before making donations.',
        requiresVerification: true,
      })
      return
    }

    next()
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to verify email status' })
  }
}




