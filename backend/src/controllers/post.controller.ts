import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth'
import { postService } from '../services/post.service'
import prisma from '../config/database'

export const postController = {
  async getPosts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 10
      const userId = req.query.userId as string
      const tags = req.query.tags
        ? (req.query.tags as string).split(',').filter(Boolean)
        : undefined
      const requireUserTags = req.query.requireUserTags === 'true'
      const excludeUserTags = req.query.excludeUserTags === 'true'

      // If authenticated and tags are required, enforce filtering by user's tags
      const filterUserId = req.userId || undefined
      
      const result = await postService.getPosts({
        page,
        limit,
        userId,
        tags,
        requireUserTags: requireUserTags && !!filterUserId,
        filterUserId: (requireUserTags || excludeUserTags) ? filterUserId : undefined,
        excludeUserTags: excludeUserTags && !!filterUserId,
      })

      // Mark posts as liked/bookmarked/participating if user is authenticated
      if (req.userId) {
        for (const post of result.data) {
          const [like, bookmark, follow, participant] = await Promise.all([
            prisma.like.findFirst({
              where: {
                userId: req.userId,
                postId: post.id.toString(),
              },
            }),
            prisma.bookmark.findFirst({
              where: {
                userId: req.userId,
                postId: post.id.toString(),
              },
            }),
            prisma.follow.findFirst({
              where: {
                followerId: req.userId,
                followingId: post.user.id,
              },
            }),
            prisma.postParticipant.findFirst({
              where: {
                userId: req.userId,
                postId: post.id.toString(),
              },
            }),
          ])

          post.liked = !!like
          post.bookmarked = !!bookmark
          post.user.following = !!follow
          post.isParticipating = !!participant
        }
      }

      res.json(result)
    } catch (error: any) {
      next(error)
    }
  },

  async createPost(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const file = req.file
      // Parse tags from body (could be string from FormData or array from JSON)
      let tags: string[] = []
      if (req.body.tags) {
        try {
          // If tags is a JSON string (from FormData), parse it
          tags = typeof req.body.tags === 'string' ? JSON.parse(req.body.tags) : req.body.tags
          // Ensure it's an array
          tags = Array.isArray(tags) ? tags : []
        } catch {
          // If parsing fails, try as comma-separated string
          tags = typeof req.body.tags === 'string' 
            ? req.body.tags.split(',').map(t => t.trim()).filter(Boolean)
            : Array.isArray(req.body.tags) ? req.body.tags : []
        }
      }
      
      const result = await postService.createPost(req.userId!, {
        ...req.body,
        tags,
      }, file)
      res.status(201).json(result)
    } catch (error: any) {
      next(error)
    }
  },

  async likePost(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      await postService.likePost(id, req.userId!)
      res.json({ message: 'Post liked' })
    } catch (error: any) {
      next(error)
    }
  },

  async unlikePost(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      await postService.likePost(id, req.userId!) // Same as like (toggle)
      res.json({ message: 'Post unliked' })
    } catch (error: any) {
      next(error)
    }
  },

  async bookmarkPost(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      await postService.bookmarkPost(id, req.userId!)
      res.json({ message: 'Post bookmarked' })
    } catch (error: any) {
      next(error)
    }
  },

  async unbookmarkPost(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      await postService.bookmarkPost(id, req.userId!) // Same as bookmark (toggle)
      res.json({ message: 'Post unbookmarked' })
    } catch (error: any) {
      next(error)
    }
  },

  async getBookmarkedPosts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 10
      const result = await postService.getBookmarkedPosts(req.userId!, page, limit)
      res.json(result)
    } catch (error: any) {
      next(error)
    }
  },

  async participateInPost(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const result = await postService.participateInPost(id, req.userId!)
      res.json(result)
    } catch (error: any) {
      next(error)
    }
  },

  async getPostParticipants(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 20
      const result = await postService.getPostParticipants(id, page, limit)
      res.json(result)
    } catch (error: any) {
      next(error)
    }
  },
}


