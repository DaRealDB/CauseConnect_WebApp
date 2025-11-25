import { Router } from 'express'
import { notificationController } from '../controllers/notification.controller'
import { requireAuth } from '../middleware/auth'

const router = Router()

router.get('/', requireAuth, notificationController.getNotifications)
router.patch('/:id/read', requireAuth, notificationController.markAsRead)
router.patch('/read-all', requireAuth, notificationController.markAllAsRead)
router.delete('/:id', requireAuth, notificationController.deleteNotification)
router.get('/unread-count', requireAuth, notificationController.getUnreadCount)

export default router







