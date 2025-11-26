import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth'
import { exploreService } from '../services/explore.service'

export const exploreController = {
  async getExploreContent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const filter = (req.query.filter as string) || 'all'
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 10
      const excludeUserTags = req.query.excludeUserTags === 'true'

      const userId = req.userId || undefined

      let result

      switch (filter) {
        case 'all':
          result = await exploreService.getAllContent({
            page,
            limit,
            userId,
            excludeUserTags: excludeUserTags && !!userId,
          })
          break

        case 'groups':
          result = await exploreService.getGroups({
            page,
            limit,
            userId,
          })
          break

        case 'posts':
          result = await exploreService.getPosts({
            page,
            limit,
            userId,
            excludeUserTags: excludeUserTags && !!userId,
          })
          break

        case 'events':
          result = await exploreService.getEvents({
            page,
            limit,
            userId,
            excludeUserTags: excludeUserTags && !!userId,
          })
          break

        default:
          return res.status(400).json({ message: 'Invalid filter. Must be: all, groups, posts, or events' })
      }

      res.json(result)
    } catch (error: any) {
      next(error)
    }
  },
}





