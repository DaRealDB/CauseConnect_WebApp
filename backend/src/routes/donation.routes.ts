import { Router } from 'express'
import { donationController } from '../controllers/donation.controller'
import { requireAuth } from '../middleware/auth'

const router = Router()

router.post('/', requireAuth, donationController.createDonation)
router.get('/', requireAuth, donationController.getDonations)
router.get('/user/:userId', requireAuth, donationController.getDonations)
router.get('/event/:eventId', donationController.getDonations)

export default router













