import { Router } from 'express'
import { eventController } from '../controllers/event.controller'
import { requireAuth } from '../middleware/auth'
import { uploadMultiple } from '../middleware/upload'

const router = Router()

// Public routes
router.get('/', eventController.getEvents)

// Protected routes - must come before /:id to avoid route conflicts
router.get('/bookmarked', requireAuth, eventController.getBookmarkedEvents)

// Public routes
router.get('/:id', eventController.getEventById)

// Protected routes
router.post('/', requireAuth, uploadMultiple('images', 5), eventController.createEvent)
router.put('/:id', requireAuth, eventController.updateEvent)
router.delete('/:id', requireAuth, eventController.deleteEvent)
router.get('/:id/participants', requireAuth, eventController.getEventParticipants)
router.get('/:id/analytics', requireAuth, eventController.getEventAnalytics)
router.post('/:id/support', requireAuth, eventController.supportEvent)
router.delete('/:id/support', requireAuth, eventController.passEvent)
router.post('/:id/bookmark', requireAuth, eventController.bookmarkEvent)
router.delete('/:id/bookmark', requireAuth, eventController.unbookmarkEvent)

export default router


