import { Router } from 'express'
import { settingsController } from '../controllers/settings.controller'
import { requireAuth } from '../middleware/auth'

const router = Router()

router.get('/', requireAuth, settingsController.getSettings)
router.put('/', requireAuth, settingsController.updateSettings)

// Privacy & Security endpoints
router.get('/login-activity', requireAuth, settingsController.getLoginActivity)
router.delete('/login-activity/:tokenId', requireAuth, settingsController.revokeSession)
router.get('/blocked-users', requireAuth, settingsController.getBlockedUsers)
router.post('/block-user/:userId', requireAuth, settingsController.blockUser)
router.delete('/block-user/:userId', requireAuth, settingsController.unblockUser)
router.get('/export-data', requireAuth, settingsController.exportUserData)

// Impact statistics
router.get('/impact', requireAuth, settingsController.getImpactStats)

export default router







