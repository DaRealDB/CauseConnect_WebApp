import { Router } from 'express'
import { commentController } from '../controllers/comment.controller'
import { requireAuth } from '../middleware/auth'

const router = Router()

// Get comments for an event
router.get('/events/:eventId/comments', commentController.getComments)

// Create comment on event
router.post('/events/:eventId/comments', requireAuth, commentController.createComment)

// Get comments for a post
router.get('/posts/:postId/comments', commentController.getPostComments)

// Create comment on post
router.post('/posts/:postId/comments', requireAuth, commentController.createPostComment)

// Comment actions (work for both event and post comments by ID)
router.post('/:id/like', requireAuth, commentController.likeComment)
router.post('/:id/dislike', requireAuth, commentController.dislikeComment)
router.post('/:id/award', requireAuth, commentController.awardComment)
router.post('/:id/save', requireAuth, commentController.saveComment)

export default router

















