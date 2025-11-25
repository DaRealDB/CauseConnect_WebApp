import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth'
import { paymentService } from '../services/payment.service'

export const paymentController = {
  // ==================== PAYMENT METHODS ====================

  async getPaymentMethods(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const methods = await paymentService.getPaymentMethods(req.userId!)
      res.json(methods)
    } catch (error: any) {
      next(error)
    }
  },

  async createSetupIntent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await paymentService.createSetupIntent(req.userId!)
      res.json(result)
    } catch (error: any) {
      next(error)
    }
  },

  async addPaymentMethod(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { setupIntentId, paymentMethodId, isDefault } = req.body

      if (!setupIntentId || !paymentMethodId) {
        return res.status(400).json({ message: 'setupIntentId and paymentMethodId are required' })
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

  async setDefaultPaymentMethod(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { paymentMethodId } = req.params
      await paymentService.setDefaultPaymentMethod(req.userId!, paymentMethodId)
      res.json({ success: true })
    } catch (error: any) {
      next(error)
    }
  },

  async removePaymentMethod(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { paymentMethodId } = req.params
      await paymentService.removePaymentMethod(req.userId!, paymentMethodId)
      res.json({ success: true })
    } catch (error: any) {
      next(error)
    }
  },

  async addPayPalPaymentMethod(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { paypalEmail, isDefault } = req.body

      if (!paypalEmail) {
        return res.status(400).json({ message: 'paypalEmail is required' })
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

  async createPaymentIntent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { eventId, amount, currency, paymentMethodId, isAnonymous, message } = req.body

      if (!eventId || !amount) {
        return res.status(400).json({ message: 'eventId and amount are required' })
      }

      const result = await paymentService.createStripePaymentIntent(req.userId!, {
        eventId,
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

  async confirmPayment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { paymentIntentId, eventId, amount, paymentMethodId, isAnonymous, message } = req.body

      if (!paymentIntentId || !eventId || !amount) {
        return res.status(400).json({ message: 'paymentIntentId, eventId, and amount are required' })
      }

      const result = await paymentService.confirmStripePayment(req.userId!, paymentIntentId, {
        eventId,
        amount: parseFloat(amount),
        paymentMethodId,
        isAnonymous,
        message,
      })
      res.json(result)
    } catch (error: any) {
      next(error)
    }
  },

  async createPayPalOrder(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { eventId, amount, currency, isAnonymous, message } = req.body

      if (!eventId || !amount) {
        return res.status(400).json({ message: 'eventId and amount are required' })
      }

      const result = await paymentService.createPayPalOrder(req.userId!, {
        eventId,
        amount: parseFloat(amount),
        currency,
        isAnonymous,
        message,
      })
      res.json(result)
    } catch (error: any) {
      next(error)
    }
  },

  async capturePayPalPayment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { orderId } = req.body

      if (!orderId) {
        return res.status(400).json({ message: 'orderId is required' })
      }

      const result = await paymentService.capturePayPalPayment(req.userId!, orderId)
      res.json(result)
    } catch (error: any) {
      next(error)
    }
  },

  // ==================== RECURRING DONATIONS ====================

  async createRecurringDonation(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { eventId, amount, currency, interval, paymentMethodId, isAnonymous, message } = req.body

      if (!eventId || !amount) {
        return res.status(400).json({ message: 'eventId and amount are required' })
      }

      const result = await paymentService.createRecurringDonation(req.userId!, {
        eventId,
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

  async getRecurringDonations(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const recurring = await paymentService.getRecurringDonations(req.userId!)
      res.json(recurring)
    } catch (error: any) {
      next(error)
    }
  },

  async cancelRecurringDonation(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { recurringDonationId } = req.params
      await paymentService.cancelRecurringDonation(req.userId!, recurringDonationId)
      res.json({ success: true })
    } catch (error: any) {
      next(error)
    }
  },

  // ==================== DONATION HISTORY ====================

  async getDonationHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 20

      const history = await paymentService.getDonationHistory(req.userId!, {
        page,
        limit,
      })
      res.json(history)
    } catch (error: any) {
      next(error)
    }
  },
}

