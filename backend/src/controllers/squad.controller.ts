import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth'
import { squadService } from '../services/squad.service'
import { squadPostService } from '../services/squadPost.service'
import { squadCommentService } from '../services/squadComment.service'
import { squadReactionService } from '../services/squadReaction.service'

export const squadController = {
  async getSquads(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const squads = await squadService.getSquads(req.userId)
      res.json(squads)
    } catch (error: any) {
      next(error)
    }
  },

  async searchSquads(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { query, limit } = req.query
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: 'Query parameter is required' })
      }
      const searchLimit = limit ? parseInt(limit as string) : 10
      const squads = await squadService.searchSquads(query, searchLimit)
      res.json(squads)
    } catch (error: any) {
      next(error)
    }
  },

  async createSquad(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const file = req.file
      const squad = await squadService.createSquad(req.userId!, req.body, file)
      res.status(201).json(squad)
    } catch (error: any) {
      next(error)
    }
  },

  async getSquadById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const squad = await squadService.getSquadById(id, req.userId)
      res.json(squad)
    } catch (error: any) {
      next(error)
    }
  },

  async getSquadMembers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 20
      const result = await squadService.getSquadMembers(id, page, limit)
      res.json(result)
    } catch (error: any) {
      next(error)
    }
  },

  async joinSquad(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      await squadService.joinSquad(id, req.userId!)
      res.json({ message: 'Joined squad successfully' })
    } catch (error: any) {
      next(error)
    }
  },

  async leaveSquad(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      await squadService.leaveSquad(id, req.userId!)
      res.json({ message: 'Left squad successfully' })
    } catch (error: any) {
      next(error)
    }
  },

  // Squad Posts
  async getSquadPosts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 20
      const result = await squadPostService.getSquadPosts(id, req.userId, page, limit)
      res.json(result)
    } catch (error: any) {
      next(error)
    }
  },

  async createSquadPost(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const file = req.file
      const image = file ? `/uploads/${file.filename}` : undefined
      const post = await squadPostService.createSquadPost(id, req.userId!, {
        content: req.body.content,
        image,
      })
      res.status(201).json(post)
    } catch (error: any) {
      next(error)
    }
  },

  async updateSquadPost(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id, postId } = req.params
      const post = await squadPostService.updateSquadPost(postId, req.userId!, {
        content: req.body.content,
      })
      res.json(post)
    } catch (error: any) {
      next(error)
    }
  },

  async deleteSquadPost(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id, postId } = req.params
      await squadPostService.deleteSquadPost(postId, req.userId!)
      res.json({ message: 'Post deleted successfully' })
    } catch (error: any) {
      next(error)
    }
  },

  async pinSquadPost(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id, postId } = req.params
      const { isPinned } = req.body
      await squadPostService.pinSquadPost(postId, req.userId!, isPinned)
      res.json({ message: isPinned ? 'Post pinned' : 'Post unpinned' })
    } catch (error: any) {
      next(error)
    }
  },

  // Squad Comments
  async getSquadPostComments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id, postId } = req.params
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 50
      const result = await squadCommentService.getSquadPostComments(postId, req.userId, page, limit)
      res.json(result)
    } catch (error: any) {
      next(error)
    }
  },

  async createSquadComment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id, postId } = req.params
      const comment = await squadCommentService.createSquadComment(postId, req.userId!, {
        content: req.body.content,
        parentId: req.body.parentId,
      })
      res.status(201).json(comment)
    } catch (error: any) {
      next(error)
    }
  },

  async updateSquadComment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id, postId, commentId } = req.params
      const comment = await squadCommentService.updateSquadComment(commentId, req.userId!, {
        content: req.body.content,
      })
      res.json(comment)
    } catch (error: any) {
      next(error)
    }
  },

  async deleteSquadComment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id, postId, commentId } = req.params
      await squadCommentService.deleteSquadComment(commentId, req.userId!)
      res.json({ message: 'Comment deleted successfully' })
    } catch (error: any) {
      next(error)
    }
  },

  // Squad Reactions
  async toggleSquadReaction(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const result = await squadReactionService.toggleReaction(req.userId!, {
        postId: req.body.postId,
        commentId: req.body.commentId,
        type: req.body.type || 'like',
      })
      res.json(result)
    } catch (error: any) {
      next(error)
    }
  },
}





