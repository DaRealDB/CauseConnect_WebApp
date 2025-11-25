import { Router } from 'express'
import { paymentController } from '../controllers/payment.controller'
import { requireAuth } from '../middleware/auth'

const router = Router()

// Payment Methods
router.get('/payment-methods', requireAuth, paymentController.getPaymentMethods)
router.post('/payment-methods/setup-intent', requireAuth, paymentController.createSetupIntent)
router.post('/payment-methods', requireAuth, paymentController.addPaymentMethod)
router.post('/payment-methods/paypal', requireAuth, paymentController.addPayPalPaymentMethod)
router.put('/payment-methods/:paymentMethodId/default', requireAuth, paymentController.setDefaultPaymentMethod)
router.delete('/payment-methods/:paymentMethodId', requireAuth, paymentController.removePaymentMethod)

// Single Donations
router.post('/payment-intent', requireAuth, paymentController.createPaymentIntent)
router.post('/confirm-payment', requireAuth, paymentController.confirmPayment)
router.post('/paypal/order', requireAuth, paymentController.createPayPalOrder)
router.post('/paypal/capture', requireAuth, paymentController.capturePayPalPayment)

// Recurring Donations
router.post('/recurring', requireAuth, paymentController.createRecurringDonation)
router.get('/recurring', requireAuth, paymentController.getRecurringDonations)
router.delete('/recurring/:recurringDonationId', requireAuth, paymentController.cancelRecurringDonation)

// Donation History
router.get('/history', requireAuth, paymentController.getDonationHistory)

export default router

