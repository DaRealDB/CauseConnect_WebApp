import { Router } from 'express'
import { commentController } from '../controllers/comment.controller'
import { requireAuth } from '../middleware/auth'

const router = Router()

// Get comments for an event
router.get('/events/:eventId/comments', commentController.getComments)

// Create comment
router.post('/events/:eventId/comments', requireAuth, commentController.createComment)

// Comment actions
router.post('/:id/like', requireAuth, commentController.likeComment)
router.post('/:id/dislike', requireAuth, commentController.dislikeComment)
router.post('/:id/award', requireAuth, commentController.awardComment)
router.post('/:id/save', requireAuth, commentController.saveComment)

export default router







