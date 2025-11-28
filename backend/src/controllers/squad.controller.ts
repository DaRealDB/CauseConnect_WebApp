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

  async searchSquads(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { query, limit } = req.query
      if (!query || typeof query !== 'string') {
        res.status(400).json({ message: 'Query parameter is required' })
        return
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
      const { id: _id, postId } = req.params
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
      const { id: _id, postId } = req.params
      await squadPostService.deleteSquadPost(postId, req.userId!)
      res.json({ message: 'Post deleted successfully' })
    } catch (error: any) {
      next(error)
    }
  },

  async pinSquadPost(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id: _id, postId } = req.params
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
      const { id: _id, postId } = req.params
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
      const { id: _id, postId } = req.params
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
      const { id: _id, postId: _postId, commentId } = req.params
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
      const { id: _id, postId: _postId, commentId } = req.params
      await squadCommentService.deleteSquadComment(commentId, req.userId!)
      res.json({ message: 'Comment deleted successfully' })
    } catch (error: any) {
      next(error)
    }
  },

  // Squad Reactions
  async toggleSquadReaction(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id: _id } = req.params
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

  // Squad Management (Admin only)
  async updateSquad(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params
      const file = req.file
      const { name, description } = req.body
      
      const updateData: { name?: string; description?: string } = {}
      if (name !== undefined) updateData.name = name
      if (description !== undefined) updateData.description = description

      const squad = await squadService.updateSquad(id, req.userId!, updateData, file)
      res.json(squad)
    } catch (error: any) {
      next(error)
    }
  },

  async deleteSquad(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params
      await squadService.deleteSquad(id, req.userId!)
      res.json({ message: 'Squad deleted successfully' })
    } catch (error: any) {
      next(error)
    }
  },

  async removeMember(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: squadId, memberId } = req.params
      await squadService.removeMember(squadId, req.userId!, memberId)
      res.json({ message: 'Member removed successfully' })
    } catch (error: any) {
      next(error)
    }
  },

  async changeMemberRole(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: squadId, memberId } = req.params
      const { role } = req.body

      if (!role || !['admin', 'moderator', 'member'].includes(role)) {
        res.status(400).json({ message: 'Invalid role. Must be admin, moderator, or member' })
        return
      }

      await squadService.changeMemberRole(squadId, req.userId!, memberId, role as 'admin' | 'moderator' | 'member')
      res.json({ message: 'Member role updated successfully' })
    } catch (error: any) {
      next(error)
    }
  },
}





