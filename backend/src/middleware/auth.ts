import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../utils/jwt'

export interface AuthRequest extends Request {
  userId?: string
  user?: {
    id: string
    email: string
    username: string
  }
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'No token provided' })
      return
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    const payload = verifyAccessToken(token)

    req.userId = payload.userId
    req.user = {
      id: payload.userId,
      email: payload.email,
      username: '', // Will be populated if needed
    }

    next()
  } catch (error: any) {
    res.status(401).json({ message: error.message || 'Invalid token' })
  }
}















