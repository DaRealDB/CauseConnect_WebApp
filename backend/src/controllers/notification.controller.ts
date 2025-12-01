import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth'
import { notificationService } from '../services/notification.service'

export const notificationController = {
  async getNotifications(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 20
      const type = req.query.type as string

      const result = await notificationService.getNotifications(req.userId!, {
        page,
        limit,
        type,
      })

      res.json(result)
    } catch (error: any) {
      next(error)
    }
  },

  async markAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      await notificationService.markAsRead(id, req.userId!)
      res.json({ message: 'Notification marked as read' })
    } catch (error: any) {
      next(error)
    }
  },

  async markAllAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await notificationService.markAllAsRead(req.userId!)
      res.json({ message: 'All notifications marked as read' })
    } catch (error: any) {
      next(error)
    }
  },

  async deleteNotification(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      await notificationService.deleteNotification(id, req.userId!)
      res.json({ message: 'Notification deleted' })
    } catch (error: any) {
      next(error)
    }
  },

  async getUnreadCount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await notificationService.getUnreadCount(req.userId!)
      res.json(result)
    } catch (error: any) {
      next(error)
    }
  },
}

















