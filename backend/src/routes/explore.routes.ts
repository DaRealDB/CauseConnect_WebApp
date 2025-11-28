import { Router } from 'express'
import { exploreController } from '../controllers/explore.controller'

const router = Router()

// Public route - explore content
router.get('/', exploreController.getExploreContent)

export default router








