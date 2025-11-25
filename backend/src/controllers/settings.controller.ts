import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth'
import { settingsService } from '../services/settings.service'
import { privacyService } from '../services/privacy.service'

export const settingsController = {
  async getSettings(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      console.log(`[Controller] getSettings called - userId: ${req.userId}`)
      const settings = await settingsService.getSettings(req.userId!)
      console.log(`[Controller] getSettings response - interestTags:`, settings.personalization?.interestTags)
      console.log(`[Controller] getSettings response - interestTags count:`, settings.personalization?.interestTags?.length || 0)
      console.log(`[Controller] Full personalization object:`, JSON.stringify(settings.personalization))
      res.json(settings)
    } catch (error: any) {
      console.error(`[Controller] getSettings error:`, error)
      next(error)
    }
  },

  async updateSettings(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      console.log(`[Controller] updateSettings called - userId: ${req.userId}`)
      console.log(`[Controller] updateSettings body:`, JSON.stringify(req.body))
      console.log(`[Controller] updateSettings personalization.interestTags:`, req.body.personalization?.interestTags)
      const settings = await settingsService.updateSettings(req.userId!, req.body)
      res.json(settings)
    } catch (error: any) {
      console.error(`[Controller] updateSettings error:`, error)
      next(error)
    }
  },

  // Privacy & Security endpoints
  async getLoginActivity(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const activity = await privacyService.getLoginActivity(req.userId!)
      res.json(activity)
    } catch (error: any) {
      next(error)
    }
  },

  async revokeSession(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { tokenId } = req.params
      await privacyService.revokeSession(tokenId, req.userId!)
      res.json({ message: 'Session revoked successfully' })
    } catch (error: any) {
      next(error)
    }
  },

  async getBlockedUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const blockedUsers = await privacyService.getBlockedUsers(req.userId!)
      res.json(blockedUsers)
    } catch (error: any) {
      next(error)
    }
  },

  async blockUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId: blockedId } = req.params
      const result = await privacyService.blockUser(req.userId!, blockedId)
      res.json(result)
    } catch (error: any) {
      next(error)
    }
  },

  async unblockUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId: blockedId } = req.params
      await privacyService.unblockUser(req.userId!, blockedId)
      res.json({ message: 'User unblocked successfully' })
    } catch (error: any) {
      next(error)
    }
  },

  async exportUserData(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const exportData = await privacyService.exportUserData(req.userId!)
      
      // Set headers for file download
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Content-Disposition', `attachment; filename="causeconnect-data-${new Date().toISOString().split('T')[0]}.json"`)
      res.json(exportData)
    } catch (error: any) {
      next(error)
    }
  },
}






