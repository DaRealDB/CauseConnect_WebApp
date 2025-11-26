import { Response, NextFunction, Request } from 'express'
import { AuthRequest } from '../middleware/auth'
import { paymentService } from '../services/payment.service'
import { stripe } from '../config/stripe'
// import { config } from '../config/env' // Unused import

export const paymentController = {
  // ==================== PAYMENT METHODS ====================

  async getPaymentMethods(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const methods = await paymentService.getPaymentMethods(req.userId!)
      res.json(methods)
    } catch (error: any) {
      next(error)
    }
  },

  async createSetupIntent(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await paymentService.createSetupIntent(req.userId!)
      res.json(result)
    } catch (error: any) {
      next(error)
    }
  },

  async addPaymentMethod(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { setupIntentId, paymentMethodId, isDefault } = req.body

      if (!setupIntentId || !paymentMethodId) {
        res.status(400).json({ message: 'setupIntentId and paymentMethodId are required' })
        return
      }

      const method = await paymentService.addPaymentMethod(
        req.userId!,
        setupIntentId,
        paymentMethodId,
        isDefault || false
      )
      res.json(method)
    } catch (error: any) {
      next(error)
    }
  },

  async setDefaultPaymentMethod(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { paymentMethodId } = req.params
      await paymentService.setDefaultPaymentMethod(req.userId!, paymentMethodId)
      res.json({ success: true })
    } catch (error: any) {
      next(error)
    }
  },

  async removePaymentMethod(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { paymentMethodId } = req.params
      await paymentService.removePaymentMethod(req.userId!, paymentMethodId)
      res.json({ success: true })
    } catch (error: any) {
      next(error)
    }
  },

  async addPayPalPaymentMethod(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { paypalEmail, isDefault } = req.body

      if (!paypalEmail) {
        res.status(400).json({ message: 'paypalEmail is required' })
        return
      }

      const result = await paymentService.addPayPalPaymentMethod(
        req.userId!,
        paypalEmail,
        isDefault || false
      )
      res.json(result)
    } catch (error: any) {
      next(error)
    }
  },

  // ==================== SINGLE DONATIONS ====================

  async createPaymentIntent(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { eventId, postId, recipientUserId, amount, currency, paymentMethodId, isAnonymous, message } = req.body

      if (!amount) {
        res.status(400).json({ message: 'amount is required' })
        return
      }

      // At least one of eventId, postId, or recipientUserId must be provided
      if (!eventId && !postId && !recipientUserId) {
        res.status(400).json({ message: 'eventId, postId, or recipientUserId is required' })
        return
      }

      const result = await paymentService.createStripePaymentIntent(req.userId!, {
        eventId,
        postId,
        recipientUserId,
        amount: parseFloat(amount),
        currency,
        paymentMethodId,
        isAnonymous,
        message,
      })
      res.json(result)
    } catch (error: any) {
      next(error)
    }
  },

  async confirmPayment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { paymentIntentId } = req.body

      if (!paymentIntentId) {
        res.status(400).json({ message: 'paymentIntentId is required' })
        return
      }

      const result = await paymentService.confirmStripePayment(req.userId!, paymentIntentId)
      res.json(result)
    } catch (error: any) {
      next(error)
    }
  },

  async simulatePayPalPayment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { eventId, postId, recipientUserId, amount, currency, paymentMethodId, isAnonymous, message } = req.body
      if (!eventId && !postId && !recipientUserId) {
        res.status(400).json({ message: 'eventId, postId, or recipientUserId is required' })
        return
      }
      if (!amount) {
        res.status(400).json({ message: 'eventId and amount are required' })
        return
      }
      const result = await paymentService.simulatePayPalPayment(req.userId!, {
        eventId,
        postId,
        recipientUserId,
        amount: parseFloat(amount),
        currency,
        paymentMethodId,
        isAnonymous,
        message,
      })
      res.json(result)
    } catch (error: any) {
      next(error)
    }
  },

  // ==================== RECURRING DONATIONS ====================

  async createRecurringDonation(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { eventId, postId, recipientUserId, amount, currency, interval, paymentMethodId, isAnonymous, message } = req.body

      if (!amount) {
        res.status(400).json({ message: 'amount is required' })
        return
      }

      // At least one of eventId, postId, or recipientUserId must be provided
      if (!eventId && !postId && !recipientUserId) {
        res.status(400).json({ message: 'eventId, postId, or recipientUserId is required' })
        return
      }

      const result = await paymentService.createRecurringDonation(req.userId!, {
        eventId,
        postId,
        recipientUserId,
        amount: parseFloat(amount),
        currency,
        interval,
        paymentMethodId,
        isAnonymous,
        message,
      })
      res.json(result)
    } catch (error: any) {
      next(error)
    }
  },

  async getRecurringDonations(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const donations = await paymentService.getRecurringDonations(req.userId!)
      res.json(donations)
    } catch (error: any) {
      next(error)
    }
  },

  async cancelRecurringDonation(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { recurringDonationId } = req.params
      await paymentService.cancelRecurringDonation(req.userId!, recurringDonationId)
      res.json({ success: true })
    } catch (error: any) {
      next(error)
    }
  },

  // ==================== DONATION HISTORY ====================

  async getDonationHistory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 20

      const result = await paymentService.getDonationHistory(req.userId!, { page, limit })
      res.json(result)
    } catch (error: any) {
      next(error)
    }
  },

  // ==================== STRIPE WEBHOOK ====================

  /**
   * Stripe webhook handler for payment events
   * This endpoint syncs payment status from Stripe to our database
   */
  async handleStripeWebhook(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const sig = req.headers['stripe-signature']

      if (!stripe || !sig) {
        res.status(400).send('Webhook signature missing or Stripe not configured')
        return
      }

    let event

    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
      if (!webhookSecret) {
        console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured')
        res.status(400).send('Webhook secret not configured')
        return
      }

      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret)
      } catch (err: any) {
        console.error('[Stripe Webhook] Signature verification failed:', err.message)
        res.status(400).send(`Webhook Error: ${err.message}`)
        return
      }

    console.log('[Stripe Webhook] Received event:', event.type)

    try {
      // Handle different event types
      switch (event.type) {
        case 'payment_intent.succeeded':
          await paymentService.handlePaymentIntentSucceeded(event.data.object)
          break

        case 'payment_intent.payment_failed':
          await paymentService.handlePaymentIntentFailed(event.data.object)
          break

        case 'charge.refunded':
          await paymentService.handleChargeRefunded(event.data.object)
          break

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await paymentService.handleSubscriptionUpdated(event.data.object)
          break

        case 'customer.subscription.deleted':
          await paymentService.handleSubscriptionDeleted(event.data.object)
          break

        default:
          console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`)
      }

      res.json({ received: true })
    } catch (error: any) {
      console.error('[Stripe Webhook] Error processing event:', error)
      // Return 200 to prevent Stripe from retrying
      res.status(200).json({ received: true, error: error.message })
    }
  },
}
