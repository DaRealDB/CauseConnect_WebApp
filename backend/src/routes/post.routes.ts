import { Router } from 'express'
import { postController } from '../controllers/post.controller'
import { requireAuth } from '../middleware/auth'
import { uploadSingle } from '../middleware/upload'

const router = Router()

router.get('/', postController.getPosts)
router.get('/bookmarked', requireAuth, postController.getBookmarkedPosts)
router.post('/', requireAuth, uploadSingle('image'), postController.createPost)
router.post('/:id/like', requireAuth, postController.likePost)
router.delete('/:id/like', requireAuth, postController.unlikePost)
router.post('/:id/bookmark', requireAuth, postController.bookmarkPost)
router.delete('/:id/bookmark', requireAuth, postController.unbookmarkPost)
router.post('/:id/participate', requireAuth, postController.participateInPost)
router.get('/:id/participants', requireAuth, postController.getPostParticipants)

export default router


