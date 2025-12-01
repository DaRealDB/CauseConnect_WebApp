import { Router } from 'express'
import { tagController } from '../controllers/tag.controller'

const router = Router()

// Public routes
router.get('/', tagController.getTags)
router.get('/:id', tagController.getTagById)

// Protected routes (require authentication)
router.post('/create-or-find', tagController.createOrFindTag)

export default router











