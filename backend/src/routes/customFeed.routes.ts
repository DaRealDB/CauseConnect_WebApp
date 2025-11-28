import { Router } from 'express'
import { customFeedController } from '../controllers/customFeed.controller'
import { requireAuth } from '../middleware/auth'

const router = Router()

router.post('/', requireAuth, customFeedController.createFeed)
router.get('/', requireAuth, customFeedController.getFeeds)
router.get('/:id', requireAuth, customFeedController.getFeedById)
router.put('/:id', requireAuth, customFeedController.updateFeed)
router.delete('/:id', requireAuth, customFeedController.deleteFeed)

export default router










