import { Router } from 'express'
import { chatController } from '../controllers/chat.controller'
import { requireAuth } from '../middleware/auth'

const router = Router()

// All chat routes require authentication
router.get('/conversations', requireAuth, chatController.getConversations)
router.get('/messages/:conversationId', requireAuth, chatController.getMessages)
router.get('/user/:userId', requireAuth, chatController.getUserProfile)
router.post('/block/:userId', requireAuth, chatController.blockUser)
router.delete('/block/:userId', requireAuth, chatController.unblockUser)
router.get('/blocked/:userId', requireAuth, chatController.checkBlocked)

export default router

