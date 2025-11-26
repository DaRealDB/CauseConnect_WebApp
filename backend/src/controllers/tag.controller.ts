import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth'
import { tagService } from '../services/tag.service'

export const tagController = {
  /**
   * GET /tags - List all tags (for autocomplete/search)
   */
  async getTags(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 100
      const search = req.query.search as string | undefined

      const tags = await tagService.getAllTags(limit, search)
      res.json(tags)
    } catch (error: any) {
      next(error)
    }
  },

  /**
   * POST /tags/create-or-find - Create or find a tag by name
   * Accepts: { name: string }
   * Returns: { id: string, name: string, canonicalName: string }
   */
  async createOrFindTag(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { name } = req.body

      if (!name || typeof name !== 'string') {
        return res.status(400).json({ message: 'Tag name is required' })
      }

      const tag = await tagService.createOrFindTag(name)
      res.json(tag)
    } catch (error: any) {
      next(error)
    }
  },

  /**
   * GET /tags/:id - Get tag by ID
   */
  async getTagById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const tag = await tagService.getTagById(id)

      if (!tag) {
        return res.status(404).json({ message: 'Tag not found' })
      }

      res.json(tag)
    } catch (error: any) {
      next(error)
    }
  },
}




