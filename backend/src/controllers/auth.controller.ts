import { Request, Response, NextFunction } from 'express'
import { validationResult } from 'express-validator'
import { authService } from '../services/auth.service'
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

      const result = await authService.register({
        firstName,
        lastName,
        email,
        username,
        password,
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
}







