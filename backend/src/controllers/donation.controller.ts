import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth'
import { donationService } from '../services/donation.service'

export const donationController = {
  async createDonation(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await donationService.createDonation(req.userId!, req.body)
      res.status(201).json(result)
    } catch (error: any) {
      next(error)
    }
  },

  async getDonations(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 10
      const eventId = req.query.eventId as string
      const userId = req.query.userId as string || req.userId

      const result = await donationService.getDonations({
        userId,
        eventId,
        page,
        limit,
      })

      res.json(result)
    } catch (error: any) {
      next(error)
    }
  },
}

















