import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth'
import { customFeedService } from '../services/customFeed.service'

export const customFeedController = {
  async createFeed(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { name, tags } = req.body
      if (!name || !Array.isArray(tags)) {
        return res.status(400).json({ message: 'Name and tags are required' })
      }
      const feed = await customFeedService.createFeed(req.userId!, { name, tags })
      res.status(201).json(feed)
    } catch (error: any) {
      next(error)
    }
  },

  async getFeeds(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const feeds = await customFeedService.getFeeds(req.userId!)
      res.json(feeds)
    } catch (error: any) {
      next(error)
    }
  },

  async getFeedById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const feed = await customFeedService.getFeedById(req.userId!, id)
      res.json(feed)
    } catch (error: any) {
      next(error)
    }
  },

  async updateFeed(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const { name, tags } = req.body
      const feed = await customFeedService.updateFeed(req.userId!, id, { name, tags })
      res.json(feed)
    } catch (error: any) {
      next(error)
    }
  },

  async deleteFeed(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      await customFeedService.deleteFeed(req.userId!, id)
      res.json({ success: true })
    } catch (error: any) {
      next(error)
    }
  },
}




