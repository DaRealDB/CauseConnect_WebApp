import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth'
import { commentService } from '../services/comment.service'

export const commentController = {
  async getComments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params
      const comments = await commentService.getComments(eventId, req.userId)
      res.json(comments)
    } catch (error: any) {
      next(error)
    }
  },

  async createComment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { eventId } = req.params
      const result = await commentService.createComment(eventId, req.userId!, req.body)
      res.status(201).json(result)
    } catch (error: any) {
      next(error)
    }
  },

  async getPostComments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { postId } = req.params
      const comments = await commentService.getComments(postId, req.userId, 'post')
      res.json(comments)
    } catch (error: any) {
      next(error)
    }
  },

  async createPostComment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { postId } = req.params
      const result = await commentService.createComment(postId, req.userId!, req.body, 'post')
      res.status(201).json(result)
    } catch (error: any) {
      next(error)
    }
  },

  async likeComment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      await commentService.likeComment(id, req.userId!)
      res.json({ message: 'Comment liked' })
    } catch (error: any) {
      next(error)
    }
  },

  async dislikeComment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      await commentService.dislikeComment(id, req.userId!)
      res.json({ message: 'Comment disliked' })
    } catch (error: any) {
      next(error)
    }
  },

  async awardComment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      await commentService.awardComment(id, req.userId!)
      res.json({ message: 'Comment awarded' })
    } catch (error: any) {
      next(error)
    }
  },

  async saveComment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      await commentService.saveComment(id, req.userId!)
      res.json({ message: 'Comment saved' })
    } catch (error: any) {
      next(error)
    }
  },
}

















