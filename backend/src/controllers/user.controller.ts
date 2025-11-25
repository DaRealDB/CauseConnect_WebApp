import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth'
import { userService } from '../services/user.service'

export const userController = {
  async getUserProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { username } = req.params
      const user = await userService.getUserProfile(username, req.userId)
      res.json(user)
    } catch (error: any) {
      next(error)
    }
  },

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await userService.updateProfile(req.userId!, req.body)
      res.json(user)
    } catch (error: any) {
      next(error)
    }
  },

  async uploadAvatar(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' })
      }

      const result = await userService.uploadAvatar(req.userId!, req.file)
      res.json(result)
    } catch (error: any) {
      next(error)
    }
  },

  async uploadCoverImage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' })
      }

      const result = await userService.uploadCoverImage(req.userId!, req.file)
      res.json(result)
    } catch (error: any) {
      next(error)
    }
  },

  async toggleFollow(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const result = await userService.toggleFollow(req.userId!, id)
      res.json(result)
    } catch (error: any) {
      next(error)
    }
  },

  async isFollowing(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const isFollowing = await userService.isFollowing(req.userId!, id)
      res.json({ isFollowing })
    } catch (error: any) {
      next(error)
    }
  },

  async getUserActivity(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { username } = req.params
      const limit = parseInt(req.query.limit as string) || 20
      const activities = await userService.getUserActivity(username, limit)
      res.json(activities)
    } catch (error: any) {
      next(error)
    }
  },

  async searchUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const query = req.query.query as string
      const limit = parseInt(req.query.limit as string) || 10

      if (!query || query.trim().length === 0) {
        return res.json([])
      }

      const users = await userService.searchUsers(query.trim(), limit)
      res.json(users)
    } catch (error: any) {
      next(error)
    }
  },

  async followUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      await userService.followUser(req.userId!, id)
      res.json({ message: 'User followed successfully' })
    } catch (error: any) {
      next(error)
    }
  },

  async unfollowUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      await userService.unfollowUser(req.userId!, id)
      res.json({ message: 'User unfollowed successfully' })
    } catch (error: any) {
      next(error)
    }
  },

  async getFollowingUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 20
      const result = await userService.getFollowingUsers(req.userId!, page, limit)
      res.json(result)
    } catch (error: any) {
      next(error)
    }
  },

  async updatePreferences(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { tags } = req.body
      console.log(`[Controller] updatePreferences called - userId: ${req.userId}, tags:`, tags)
      if (!Array.isArray(tags)) {
        return res.status(400).json({ message: 'Tags must be an array' })
      }
      const result = await userService.updatePreferences(req.userId!, tags)
      console.log(`[Controller] updatePreferences result:`, result)
      res.json(result)
    } catch (error: any) {
      console.error(`[Controller] updatePreferences error:`, error)
      next(error)
    }
  },

  async getPreferences(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await userService.getPreferences(req.userId!)
      res.json(result)
    } catch (error: any) {
      next(error)
    }
  },

  async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { oldPassword, newPassword } = req.body
      if (!oldPassword || !newPassword) {
        return res.status(400).json({ message: 'Old password and new password are required' })
      }
      if (newPassword.length < 8) {
        return res.status(400).json({ message: 'New password must be at least 8 characters long' })
      }
      const result = await userService.changePassword(req.userId!, oldPassword, newPassword)
      res.json(result)
    } catch (error: any) {
      next(error)
    }
  },
}


