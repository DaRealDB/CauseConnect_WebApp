import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth'
import { eventService } from '../services/event.service'
import prisma from '../config/database'

export const eventController = {
  async getEvents(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 10
      const filter = req.query.filter as string
      const tags = req.query.tags
        ? (req.query.tags as string).split(',').filter(Boolean)
        : undefined
      const search = req.query.search as string
      const excludeUser = req.query.excludeUser === 'true'
      const requireUserTags = req.query.requireUserTags === 'true'
      const excludeUserTags = req.query.excludeUserTags === 'true'

      const userId = req.query.userId as string // For filtering user's created events
      
      // For feed filtering: if requireUserTags is true and user is authenticated, enforce tag filtering
      // For explore page: if excludeUserTags is true, exclude user's tags
      const filterUserId = req.userId || undefined
      
      const result = await eventService.getEvents({
        page,
        limit,
        filter,
        tags,
        search,
        userId,
        excludeUserId: excludeUser && filterUserId ? filterUserId : undefined,
        excludeUserTags: excludeUserTags && filterUserId ? true : false,
        requireUserTags: requireUserTags && !!filterUserId && !search, // Only enforce if no search query
        userIdForTags: (requireUserTags || excludeUserTags) && filterUserId ? filterUserId : undefined, // User ID for tag filtering
      })

      // Mark events as supported/bookmarked if user is authenticated
      if (req.userId) {
        const userId = req.userId
        const eventIds = result.data.map((e: any) => e.id)
        
        const [supports, bookmarks] = await Promise.all([
          prisma.supportHistory.findMany({
            where: {
              userId,
              eventId: { in: eventIds },
            },
            select: { eventId: true },
          }),
          prisma.bookmark.findMany({
            where: {
              userId,
              eventId: { in: eventIds },
            },
            select: { eventId: true },
          }),
        ])

        const supportedEventIds = new Set(supports.map((s) => s.eventId))
        const bookmarkedEventIds = new Set(bookmarks.map((b) => b.eventId))

        result.data = result.data.map((event: any) => ({
          ...event,
          isSupported: supportedEventIds.has(event.id),
          isBookmarked: bookmarkedEventIds.has(event.id),
        }))
      }

      res.json(result)
    } catch (error: any) {
      next(error)
    }
  },

  async getEventById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const event = await eventService.getEventById(id, req.userId)
      res.json(event)
    } catch (error: any) {
      next(error)
    }
  },

  async createEvent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const files = req.files as Express.Multer.File[]
      const result = await eventService.createEvent(req.userId!, req.body, files)
      res.status(201).json(result)
    } catch (error: any) {
      next(error)
    }
  },

  async supportEvent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      await eventService.supportEvent(req.userId!, id)
      res.json({ message: 'Event supported successfully' })
    } catch (error: any) {
      next(error)
    }
  },

  async passEvent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      await eventService.passEvent(req.userId!, id)
      res.json({ message: 'Event passed successfully' })
    } catch (error: any) {
      next(error)
    }
  },

  async bookmarkEvent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      await eventService.bookmarkEvent(req.userId!, id)
      res.json({ message: 'Event bookmarked successfully' })
    } catch (error: any) {
      next(error)
    }
  },

  async unbookmarkEvent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      await eventService.unbookmarkEvent(req.userId!, id)
      res.json({ message: 'Event unbookmarked successfully' })
    } catch (error: any) {
      next(error)
    }
  },

  async getBookmarkedEvents(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 10
      const result = await eventService.getBookmarkedEvents(req.userId!, page, limit)
      res.json(result)
    } catch (error: any) {
      next(error)
    }
  },

  async updateEvent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const result = await eventService.updateEvent(id, req.userId!, req.body)
      res.json(result)
    } catch (error: any) {
      next(error)
    }
  },

  async deleteEvent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      await eventService.deleteEvent(id, req.userId!)
      res.json({ message: 'Event deleted successfully' })
    } catch (error: any) {
      next(error)
    }
  },

  async getEventParticipants(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 20
      const result = await eventService.getEventParticipants(id, req.userId!, page, limit)
      res.json(result)
    } catch (error: any) {
      next(error)
    }
  },

  async getEventAnalytics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const result = await eventService.getEventAnalytics(id, req.userId!)
      res.json(result)
    } catch (error: any) {
      next(error)
    }
  },
}

