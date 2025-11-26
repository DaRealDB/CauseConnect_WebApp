import prisma from '../config/database'
import { createError } from '../middleware/errorHandler'
import { stripe } from '../config/stripe'
import { createNotification } from '../utils/notifications'

// Audit log helper
async function logPaymentAction(
  userId: string,
  action: string,
  provider: string,
  amount?: number,
  currency?: string,
  transactionId?: string,
  metadata?: any,
  errorMessage?: string
) {
  try {
    await prisma.paymentAuditLog.create({
      data: {
        userId,
        action,
        provider,
        amount,
        currency,
        transactionId,
        metadata: metadata ? JSON.stringify(metadata) : null,
        errorMessage,
      },
    })
  } catch (error) {
    console.error('Failed to log payment action:', error)
    // Don't throw - logging failures shouldn't break payment flow
  }
}

export const paymentService = {
  // ==================== PAYMENT METHODS ====================

  /**
   * Get all payment methods for a user
   */
  async getPaymentMethods(userId: string) {
    const methods = await prisma.userPaymentMethod.findMany({
      where: { userId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    return methods.map((method) => ({
      id: method.id,
      provider: method.provider,
      type: method.type,
      isDefault: method.isDefault,
      cardBrand: method.cardBrand,
      cardLast4: method.cardLast4,
      cardExpMonth: method.cardExpMonth,
      cardExpYear: method.cardExpYear,
      paypalEmail: method.paypalEmail,
      stripePaymentMethodId: method.stripePaymentMethodId,
      createdAt: method.createdAt.toISOString(),
    }))
  },

  /**
   * Get or create Stripe customer for a user
   */
  async getOrCreateStripeCustomer(userId: string): Promise<string> {
    if (!stripe) {
      throw createError('Stripe is not configured', 500)
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, firstName: true, lastName: true, stripeCustomerId: true },
    })

    if (!user) {
      throw createError('User not found', 404)
    }

    // If user already has a Stripe customer ID, verify it exists and return it
    if (user.stripeCustomerId) {
      try {
        const customer = await stripe.customers.retrieve(user.stripeCustomerId)
        if (customer && !customer.deleted) {
          return user.stripeCustomerId
        }
        // Customer was deleted in Stripe, create a new one
      } catch (error) {
        // Customer doesn't exist, create a new one
        console.log(`Stripe customer ${user.stripeCustomerId} not found, creating new one`)
      }
    }

    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email: user.email,
      name: `${user.firstName} ${user.lastName}`.trim(),
      metadata: {
        userId,
      },
    })

    // Store customer ID in database
    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customer.id },
    })

    return customer.id
  },

  /**
   * Create Stripe setup intent for adding payment method
   */
  async createSetupIntent(userId: string) {
    if (!stripe) {
      throw createError('Stripe is not configured', 500)
    }

    try {
      // Get or create Stripe customer
      const customerId = await this.getOrCreateStripeCustomer(userId)

      // Create setup intent
      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
      })

      await logPaymentAction(userId, 'setup_intent_created', 'stripe', undefined, undefined, setupIntent.id)

      return {
        clientSecret: setupIntent.client_secret,
        setupIntentId: setupIntent.id,
      }
    } catch (error: any) {
      await logPaymentAction(userId, 'setup_intent_failed', 'stripe', undefined, undefined, undefined, undefined, error.message)
      throw createError(error.message || 'Failed to create setup intent', 500)
    }
  },

  /**
   * Add payment method after setup intent is confirmed
   */
  async addPaymentMethod(userId: string, setupIntentId: string, paymentMethodId: string, isDefault: boolean = false) {
    if (!stripe) {
      throw createError('Stripe is not configured', 500)
    }

    try {
      // Retrieve the setup intent to get the payment method
      const setupIntent = await stripe.setupIntents.retrieve(setupIntentId)

      if (!setupIntent.payment_method || typeof setupIntent.payment_method !== 'string') {
        throw createError('Payment method not found in setup intent', 400)
      }

      // Retrieve payment method details
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)

      if (!paymentMethod.card) {
        throw createError('Payment method is not a card', 400)
      }

      // If this is set as default, unset other defaults
      if (isDefault) {
        await prisma.userPaymentMethod.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        })
      }

      // If this is the first payment method, make it default
      const existingMethods = await prisma.userPaymentMethod.count({
        where: { userId },
      })
      const shouldBeDefault = isDefault || existingMethods === 0

      // Create payment method record
      const savedMethod = await prisma.userPaymentMethod.create({
        data: {
          userId,
          provider: 'stripe',
          type: 'card',
          isDefault: shouldBeDefault,
          stripePaymentMethodId: paymentMethod.id,
          cardBrand: paymentMethod.card.brand,
          cardLast4: paymentMethod.card.last4,
          cardExpMonth: paymentMethod.card.exp_month,
          cardExpYear: paymentMethod.card.exp_year,
        },
      })

      await logPaymentAction(userId, 'payment_method_added', 'stripe', undefined, undefined, savedMethod.id)

      return {
        id: savedMethod.id,
        provider: savedMethod.provider,
        type: savedMethod.type,
        isDefault: savedMethod.isDefault,
        cardBrand: savedMethod.cardBrand,
        cardLast4: savedMethod.cardLast4,
        cardExpMonth: savedMethod.cardExpMonth,
        cardExpYear: savedMethod.cardExpYear,
      }
    } catch (error: any) {
      await logPaymentAction(userId, 'payment_method_add_failed', 'stripe', undefined, undefined, undefined, undefined, error.message)
      throw createError(error.message || 'Failed to add payment method', 500)
    }
  },

  /**
   * Add PayPal payment method
   */
  async addPayPalPaymentMethod(userId: string, paypalEmail: string, isDefault: boolean = false) {
    if (!paypalEmail || !paypalEmail.includes('@')) {
      throw createError('Valid PayPal email is required', 400)
    }

    try {
      // Check if PayPal method already exists for this email
      const existingPayPal = await prisma.userPaymentMethod.findFirst({
        where: {
          userId,
          provider: 'paypal',
          paypalEmail: paypalEmail.toLowerCase().trim(),
        },
      })

      if (existingPayPal) {
        throw createError('This PayPal account is already added', 409)
      }

      // If this is set as default, unset other defaults
      if (isDefault) {
        await prisma.userPaymentMethod.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        })
      }

      // If this is the first payment method, make it default
      const existingMethods = await prisma.userPaymentMethod.count({
        where: { userId },
      })
      const shouldBeDefault = isDefault || existingMethods === 0

      // Create PayPal payment method record
      const savedMethod = await prisma.userPaymentMethod.create({
        data: {
          userId,
          provider: 'paypal',
          type: 'paypal_account',
          isDefault: shouldBeDefault,
          paypalEmail: paypalEmail.toLowerCase().trim(),
        },
      })

      await logPaymentAction(userId, 'payment_method_added', 'paypal', undefined, undefined, savedMethod.id)

      return {
        id: savedMethod.id,
        provider: savedMethod.provider,
        type: savedMethod.type,
        isDefault: savedMethod.isDefault,
        paypalEmail: savedMethod.paypalEmail,
      }
    } catch (error: any) {
      if (error.statusCode === 409 || error.statusCode === 400) {
        throw error
      }
      await logPaymentAction(userId, 'payment_method_add_failed', 'paypal', undefined, undefined, undefined, undefined, error.message)
      throw createError(error.message || 'Failed to add PayPal payment method', 500)
    }
  },

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(userId: string, paymentMethodId: string) {
    const method = await prisma.userPaymentMethod.findFirst({
      where: { id: paymentMethodId, userId },
    })

    if (!method) {
      throw createError('Payment method not found', 404)
    }

    // Unset all defaults
    await prisma.userPaymentMethod.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    })

    // Set new default
    await prisma.userPaymentMethod.update({
      where: { id: paymentMethodId },
      data: { isDefault: true },
    })

    await logPaymentAction(userId, 'payment_method_set_default', method.provider, undefined, undefined, paymentMethodId)

    return { success: true }
  },

  /**
   * Remove payment method
   */
  async removePaymentMethod(userId: string, paymentMethodId: string) {
    const method = await prisma.userPaymentMethod.findFirst({
      where: { id: paymentMethodId, userId },
    })

    if (!method) {
      throw createError('Payment method not found', 404)
    }

    // If it's a Stripe payment method, detach it from Stripe
    if (method.stripePaymentMethodId && stripe) {
      try {
        await stripe.paymentMethods.detach(method.stripePaymentMethodId)
      } catch (error: any) {
        console.error('Failed to detach Stripe payment method:', error)
        // Continue with deletion even if detach fails
      }
    }

    // Delete from database
    await prisma.userPaymentMethod.delete({
      where: { id: paymentMethodId },
    })

    await logPaymentAction(userId, 'payment_method_removed', method.provider, undefined, undefined, paymentMethodId)

    // If this was the default and there are other methods, set a new default
    if (method.isDefault) {
      const remainingMethods = await prisma.userPaymentMethod.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      })

      if (remainingMethods) {
        await prisma.userPaymentMethod.update({
          where: { id: remainingMethods.id },
          data: { isDefault: true },
        })
      }
    }

    return { success: true }
  },

  // ==================== SINGLE DONATIONS ====================

  /**
   * Create Stripe Payment Intent for donation
   */
  async createStripePaymentIntent(userId: string, data: {
    eventId?: string
    postId?: string
    recipientUserId?: string
    amount: number
    currency?: string
    paymentMethodId?: string
    isAnonymous?: boolean
    message?: string
  }) {
    if (!stripe) {
      throw createError('Stripe is not configured', 500)
    }

    // At least one of eventId, postId, or recipientUserId must be provided
    if (!data.eventId && !data.postId && !data.recipientUserId) {
      throw createError('eventId, postId, or recipientUserId is required', 400)
    }

    try {
      // Get or create Stripe customer
      const customerId = await this.getOrCreateStripeCustomer(userId)

      let description = 'Donation'
      const metadata: Record<string, string> = {
        userId,
        isAnonymous: data.isAnonymous ? 'true' : 'false',
      }

      // Handle event donations
      if (data.eventId) {
        const event = await prisma.event.findUnique({
          where: { id: data.eventId },
        })
        if (!event) {
          throw createError('Event not found', 404)
        }
        description = `Donation to ${event.title}`
        metadata.eventId = data.eventId
        metadata.eventTitle = event.title
      }

      // Handle post donations
      if (data.postId) {
        const post = await prisma.post.findUnique({
          where: { id: data.postId },
          include: { user: { select: { username: true } } },
        })
        if (!post) {
          throw createError('Post not found', 404)
        }
        description = `Donation on post by @${post.user.username}`
        metadata.postId = data.postId
      }

      // Handle creator/profile donations
      if (data.recipientUserId) {
        const recipient = await prisma.user.findUnique({
          where: { id: data.recipientUserId },
          select: { username: true, firstName: true, lastName: true },
        })
        if (!recipient) {
          throw createError('Recipient not found', 404)
        }
        const recipientName = `${recipient.firstName} ${recipient.lastName}`.trim() || recipient.username
        description = `Donation to ${recipientName}`
        metadata.recipientUserId = data.recipientUserId
      }

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(data.amount * 100), // Convert to cents
        currency: (data.currency || 'usd').toLowerCase(),
        customer: customerId,
        metadata,
        ...(data.paymentMethodId && { payment_method: data.paymentMethodId }),
        ...(data.paymentMethodId && { confirm: false }),
        description,
      })

      await logPaymentAction(
        userId,
        'payment_intent_created',
        'stripe',
        data.amount,
        data.currency || 'USD',
        paymentIntent.id,
        { 
          eventId: data.eventId,
          postId: data.postId,
          recipientUserId: data.recipientUserId,
        }
      )

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      }
    } catch (error: any) {
      await logPaymentAction(userId, 'payment_intent_failed', 'stripe', data.amount, data.currency, undefined, { 
        eventId: data.eventId,
        postId: data.postId,
        recipientUserId: data.recipientUserId,
      }, error.message)
      throw createError(error.message || 'Failed to create payment intent', 500)
    }
  },

  /**
   * Confirm Stripe payment and create donation
   */
  async confirmStripePayment(userId: string, paymentIntentId: string) {
    if (!stripe) {
      throw createError('Stripe is not configured', 500)
    }

    try {
      // Retrieve payment intent to verify status and get metadata
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

      if (paymentIntent.status !== 'succeeded') {
        throw createError(`Payment not succeeded. Status: ${paymentIntent.status}`, 400)
      }

      // Extract donation details from payment intent metadata
      const metadata = paymentIntent.metadata || {}
      const eventId = metadata.eventId
      const postId = metadata.postId
      const recipientUserId = metadata.recipientUserId
      const isAnonymous = metadata.isAnonymous === 'true'
      const amount = paymentIntent.amount / 100 // Convert from cents

      // At least one recipient must be specified
      if (!eventId && !postId && !recipientUserId) {
        throw createError('Invalid payment intent: missing recipient information', 400)
      }

      // Create donation record
      const donation = await prisma.donation.create({
        data: {
          userId,
          eventId: eventId || null,
          postId: postId || null,
          recipientUserId: recipientUserId || null,
          amount,
          paymentMethod: 'stripe',
          isRecurring: false,
          isAnonymous,
          status: 'completed',
          transactionId: paymentIntent.id,
          stripePaymentIntentId: paymentIntent.id,
        },
        include: {
          event: eventId ? {
            select: {
              title: true,
              organizationId: true,
            },
          } : false,
          post: postId ? {
            select: {
              user: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          } : false,
        },
      })

      // Update event raised amount if it's an event donation
      if (eventId && donation.event) {
        await prisma.event.update({
          where: { id: eventId },
          data: {
            raisedAmount: {
              increment: amount,
            },
          },
        })
      }

      // Create notification for recipient
      const donor = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          firstName: true,
          lastName: true,
          username: true,
        },
      })

      let recipientId: string | undefined
      let notificationTitle = 'New Donation Received'
      let notificationMessage = ''
      let actionUrl = ''

      if (eventId && donation.event) {
        recipientId = donation.event.organizationId
        actionUrl = `/event/${eventId}`
        notificationMessage = `${donor ? `${donor.firstName} ${donor.lastName}`.trim() || donor.username : 'Someone'} donated $${amount.toFixed(2)} to your event "${donation.event.title}"`
      } else if (postId && donation.post) {
        recipientId = donation.post.user.id
        actionUrl = `/post/${postId}`
        notificationMessage = `${donor ? `${donor.firstName} ${donor.lastName}`.trim() || donor.username : 'Someone'} donated $${amount.toFixed(2)} on your post`
      } else if (recipientUserId) {
        recipientId = recipientUserId
        const recipient = await prisma.user.findUnique({
          where: { id: recipientUserId },
          select: { username: true },
        })
        actionUrl = `/profile/${recipient?.username || ''}`
        notificationMessage = `${donor ? `${donor.firstName} ${donor.lastName}`.trim() || donor.username : 'Someone'} donated $${amount.toFixed(2)} to you`
      }

      if (recipientId && recipientId !== userId) {
        const donorName = isAnonymous
          ? 'An anonymous donor'
          : (donor ? `${donor.firstName} ${donor.lastName}`.trim() || donor.username : 'Someone')

        await createNotification({
          userId: recipientId,
          type: 'donation',
          title: notificationTitle,
          message: notificationMessage,
          amount,
          actionUrl,
        })
      }

      await logPaymentAction(
        userId,
        'donation_completed',
        'stripe',
        amount,
        'USD',
        paymentIntent.id,
        { donationId: donation.id, eventId, postId, recipientUserId }
      )

      // Save payment method if attached to payment intent
      if (paymentIntent.payment_method && typeof paymentIntent.payment_method === 'string') {
        const existingMethod = await prisma.userPaymentMethod.findFirst({
          where: {
            userId,
            stripePaymentMethodId: paymentIntent.payment_method,
          },
        })

        if (!existingMethod) {
          try {
            const paymentMethod = await stripe.paymentMethods.retrieve(paymentIntent.payment_method as string)
            if (paymentMethod.card) {
              await prisma.userPaymentMethod.create({
                data: {
                  userId,
                  provider: 'stripe',
                  type: 'card',
                  isDefault: false,
                  stripePaymentMethodId: paymentMethod.id,
                  cardBrand: paymentMethod.card.brand,
                  cardLast4: paymentMethod.card.last4,
                  cardExpMonth: paymentMethod.card.exp_month,
                  cardExpYear: paymentMethod.card.exp_year,
                },
              })
            }
          } catch (error) {
            console.error('Failed to save payment method:', error)
            // Don't fail the donation if saving payment method fails
          }
        }
      }

      return {
        donation: {
          id: donation.id,
          amount: donation.amount,
          paymentMethod: donation.paymentMethod,
          isAnonymous: donation.isAnonymous,
          message: donation.message,
          createdAt: donation.createdAt.toISOString(),
        },
        transactionId: donation.transactionId,
      }
    } catch (error: any) {
      await logPaymentAction(
        userId,
        'donation_failed',
        'stripe',
        undefined,
        'USD',
        paymentIntentId,
        undefined,
        error.message
      )
      throw createError(error.message || 'Failed to confirm payment', 500)
    }
  },

  /**
   * Simulate PayPal payment (for demonstration purposes)
   */
  async simulatePayPalPayment(userId: string, data: {
    eventId?: string
    postId?: string
    recipientUserId?: string
    amount: number
    currency?: string
    paymentMethodId?: string
    isAnonymous?: boolean
    message?: string
  }) {
    // At least one of eventId, postId, or recipientUserId must be provided
    if (!data.eventId && !data.postId && !data.recipientUserId) {
      throw createError('eventId, postId, or recipientUserId is required', 400)
    }

    try {
      let title = 'Donation'
      let recipientId: string | undefined

      // Handle event donations
      if (data.eventId) {
        const event = await prisma.event.findUnique({
          where: { id: data.eventId },
          select: { title: true, organizationId: true },
        })
        if (!event) {
          throw createError('Event not found', 404)
        }
        title = event.title
        recipientId = event.organizationId

        // Update event raised amount
        await prisma.event.update({
          where: { id: data.eventId },
          data: {
            raisedAmount: {
              increment: data.amount,
            },
          },
        })
      }

      // Handle post donations
      if (data.postId) {
        const post = await prisma.post.findUnique({
          where: { id: data.postId },
          include: { user: { select: { username: true, id: true } } },
        })
        if (!post) {
          throw createError('Post not found', 404)
        }
        title = `Post by @${post.user.username}`
        recipientId = post.user.id
      }

      // Handle creator/profile donations
      if (data.recipientUserId) {
        const recipient = await prisma.user.findUnique({
          where: { id: data.recipientUserId },
          select: { username: true, firstName: true, lastName: true },
        })
        if (!recipient) {
          throw createError('Recipient not found', 404)
        }
        const recipientName = `${recipient.firstName} ${recipient.lastName}`.trim() || recipient.username
        title = recipientName
        recipientId = data.recipientUserId
      }

      // Create donation record directly (simulation)
      const donation = await prisma.donation.create({
        data: {
          userId,
          eventId: data.eventId || null,
          postId: data.postId || null,
          recipientUserId: data.recipientUserId || null,
          amount: data.amount,
          paymentMethod: 'paypal',
          isRecurring: false,
          isAnonymous: data.isAnonymous || false,
          message: data.message || null,
          status: 'completed', // Immediately completed for simulation
          transactionId: `paypal_sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          paymentMethodId: data.paymentMethodId || null,
        },
        include: {
          event: data.eventId ? { select: { title: true, organizationId: true } } : false,
        },
      })

      // Create notification for recipient (if different from donor)
      if (recipientId && recipientId !== userId) {
        const donor = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            firstName: true,
            lastName: true,
            username: true,
          },
        })

        const donorName = data.isAnonymous
          ? 'An anonymous donor'
          : (donor ? `${donor.firstName} ${donor.lastName}`.trim() || donor.username : 'Someone')

        await createNotification({
          userId: recipientId,
          type: 'donation',
          title: 'New Donation Received (PayPal Simulation)',
          message: `${donorName} donated $${data.amount.toFixed(2)} ${data.eventId ? `to your event "${title}"` : data.postId ? `on your post` : `to you`} (Simulated PayPal)`,
          amount: data.amount,
          actionUrl: data.eventId ? `/event/${data.eventId}` : data.postId ? `/post/${data.postId}` : `/profile/${recipient?.username || ''}`,
        })
      }

      await logPaymentAction(
        userId,
        'donation_completed_simulated',
        'paypal',
        data.amount,
        data.currency || 'USD',
        donation.transactionId,
        { donationId: donation.id, eventId: data.eventId, postId: data.postId, recipientUserId: data.recipientUserId }
      )

      return {
        donation: {
          id: donation.id,
          amount: donation.amount,
          paymentMethod: donation.paymentMethod,
          isAnonymous: donation.isAnonymous,
          message: donation.message,
          createdAt: donation.createdAt.toISOString(),
        },
        transactionId: donation.transactionId,
      }
    } catch (error: any) {
      await logPaymentAction(
        userId,
        'donation_failed_simulated',
        'paypal',
        data.amount,
        data.currency,
        undefined,
        { eventId: data.eventId, postId: data.postId, recipientUserId: data.recipientUserId },
        error.message
      )
      throw createError(error.message || 'Failed to simulate PayPal payment', 500)
    }
  },

  // ==================== RECURRING DONATIONS ====================

  /**
   * Create Stripe subscription for recurring donation
   */
  async createRecurringDonation(userId: string, data: {
    eventId?: string
    postId?: string
    recipientUserId?: string
    amount: number
    currency?: string
    interval?: 'month' | 'week' | 'year'
    paymentMethodId?: string
    isAnonymous?: boolean
    message?: string
  }) {
    if (!stripe) {
      throw createError('Stripe is not configured', 500)
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      })

      if (!user) {
        throw createError('User not found', 404)
      }

      // Recurring donations currently only support events
      if (!data.eventId) {
        throw createError('Recurring donations currently only support events. eventId is required.', 400)
      }

      const event = await prisma.event.findUnique({
        where: { id: data.eventId },
      })

      if (!event) {
        throw createError('Event not found', 404)
      }

      // Get or create Stripe customer
      const customerId = await this.getOrCreateStripeCustomer(userId)

      // Create price for subscription
      const price = await stripe.prices.create({
        unit_amount: Math.round(data.amount * 100),
        currency: (data.currency || 'usd').toLowerCase(),
        recurring: {
          interval: data.interval || 'month',
        },
        product_data: {
          name: `Monthly donation to ${event.title}`,
          description: `Recurring donation to ${event.title}`,
        },
      })

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: price.id }],
        metadata: {
          userId,
          eventId: data.eventId,
          eventTitle: event.title,
          isAnonymous: data.isAnonymous ? 'true' : 'false',
        },
        ...(data.paymentMethodId && {
          default_payment_method: data.paymentMethodId,
        }),
        expand: ['latest_invoice.payment_intent'],
      })

      // Create recurring donation record
      const recurringDonation = await prisma.recurringDonation.create({
        data: {
          userId,
          eventId: data.eventId,
          amount: data.amount,
          currency: data.currency || 'USD',
          interval: data.interval || 'month',
          status: 'active',
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: customerId,
          stripePriceId: price.id,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          paymentMethodId: data.paymentMethodId || null,
        },
      })

      // Create first donation record
      const donation = await prisma.donation.create({
        data: {
          userId,
          eventId: data.eventId,
          amount: data.amount,
          paymentMethod: 'stripe',
          isRecurring: true,
          isAnonymous: data.isAnonymous || false,
          message: data.message || null,
          status: 'completed',
          transactionId: subscription.id,
          stripePaymentIntentId: (subscription.latest_invoice as any)?.payment_intent?.id,
          recurringDonationId: recurringDonation.id,
          paymentMethodId: data.paymentMethodId || null,
        },
      })

      // Update event raised amount
      await prisma.event.update({
        where: { id: data.eventId },
        data: {
          raisedAmount: {
            increment: data.amount,
          },
        },
      })

      await logPaymentAction(
        userId,
        'recurring_donation_created',
        'stripe',
        data.amount,
        data.currency || 'USD',
        subscription.id,
        { recurringDonationId: recurringDonation.id, eventId: data.eventId }
      )

      return {
        recurringDonation: {
          id: recurringDonation.id,
          amount: recurringDonation.amount,
          interval: recurringDonation.interval,
          status: recurringDonation.status,
          currentPeriodEnd: recurringDonation.currentPeriodEnd?.toISOString(),
          createdAt: recurringDonation.createdAt.toISOString(),
        },
        donation: {
          id: donation.id,
          amount: donation.amount,
          createdAt: donation.createdAt.toISOString(),
        },
        subscriptionId: subscription.id,
      }
    } catch (error: any) {
      await logPaymentAction(
        userId,
        'recurring_donation_failed',
        'stripe',
        data.amount,
        data.currency,
        undefined,
        { eventId: data.eventId },
        error.message
      )
      throw createError(error.message || 'Failed to create recurring donation', 500)
    }
  },

  /**
   * Get all recurring donations for a user
   */
  async getRecurringDonations(userId: string) {
    const recurring = await prisma.recurringDonation.findMany({
      where: { userId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return recurring.map((rec) => ({
      id: rec.id,
      eventId: rec.eventId,
      event: rec.event,
      amount: rec.amount,
      currency: rec.currency,
      interval: rec.interval,
      status: rec.status,
      currentPeriodEnd: rec.currentPeriodEnd?.toISOString(),
      canceledAt: rec.canceledAt?.toISOString(),
      createdAt: rec.createdAt.toISOString(),
    }))
  },

  /**
   * Cancel recurring donation
   */
  async cancelRecurringDonation(userId: string, recurringDonationId: string) {
    const recurring = await prisma.recurringDonation.findFirst({
      where: { id: recurringDonationId, userId },
    })

    if (!recurring) {
      throw createError('Recurring donation not found', 404)
    }

    if (recurring.status === 'canceled') {
      throw createError('Recurring donation is already canceled', 400)
    }

    // Cancel Stripe subscription if it exists
    if (recurring.stripeSubscriptionId && stripe) {
      try {
        await stripe.subscriptions.cancel(recurring.stripeSubscriptionId)
      } catch (error: any) {
        console.error('Failed to cancel Stripe subscription:', error)
        // Continue with database update even if Stripe cancellation fails
      }
    }

    // Update database
    await prisma.recurringDonation.update({
      where: { id: recurringDonationId },
      data: {
        status: 'canceled',
        canceledAt: new Date(),
      },
    })

    await logPaymentAction(
      userId,
      'recurring_donation_canceled',
      'stripe',
      recurring.amount,
      recurring.currency,
      recurring.stripeSubscriptionId || undefined,
      { recurringDonationId }
    )

    return { success: true }
  },

  // ==================== DONATION HISTORY ====================

  /**
   * Get donation history for a user
   */
  async getDonationHistory(userId: string, params: {
    page?: number
    limit?: number
  }) {
    const page = params.page || 1
    const limit = params.limit || 20
    const skip = (page - 1) * limit

    const [donations, total] = await Promise.all([
      prisma.donation.findMany({
        where: { userId },
        skip,
        take: limit,
        include: {
          event: {
            select: {
              id: true,
              title: true,
              image: true,
            },
          },
          paypalTransaction: {
            select: {
              payerEmail: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.donation.count({ where: { userId } }),
    ])

    return {
      data: donations.map((donation) => ({
        id: donation.id,
        eventId: donation.eventId,
        event: donation.event,
        amount: donation.amount,
        paymentMethod: donation.paymentMethod,
        isRecurring: donation.isRecurring,
        isAnonymous: donation.isAnonymous,
        message: donation.message,
        status: donation.status,
        transactionId: donation.transactionId,
        createdAt: donation.createdAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  },

  // ==================== STRIPE WEBHOOK HANDLERS ====================

  /**
   * Handle successful payment intent
   */
  async handlePaymentIntentSucceeded(paymentIntent: any) {
    console.log('[Stripe Webhook] PaymentIntent succeeded:', paymentIntent.id)

    try {
      // Find donation by payment intent ID
      const donation = await prisma.donation.findFirst({
        where: { stripePaymentIntentId: paymentIntent.id },
        include: { event: true, post: true },
      })

      if (!donation) {
        console.warn(`[Stripe Webhook] Donation not found for PaymentIntent ${paymentIntent.id}`)
        return
      }

      // Update donation status
      await prisma.donation.update({
        where: { id: donation.id },
        data: { status: 'completed' },
      })

      // Update event raised amount if it's an event donation
      if (donation.eventId && donation.event) {
        await prisma.event.update({
          where: { id: donation.eventId },
          data: {
            raisedAmount: {
              increment: donation.amount,
            },
          },
        })
      }

      // Log the payment
      await logPaymentAction(
        donation.userId,
        'payment_completed',
        'stripe',
        donation.amount,
        'USD',
        paymentIntent.id,
        { donationId: donation.id }
      )

      console.log(`[Stripe Webhook] Updated donation ${donation.id} to completed`)
    } catch (error: any) {
      console.error('[Stripe Webhook] Error handling payment_intent.succeeded:', error)
      throw error
    }
  },

  /**
   * Handle failed payment intent
   */
  async handlePaymentIntentFailed(paymentIntent: any) {
    console.log('[Stripe Webhook] PaymentIntent failed:', paymentIntent.id)

    try {
      const donation = await prisma.donation.findFirst({
        where: { stripePaymentIntentId: paymentIntent.id },
      })

      if (donation) {
        await prisma.donation.update({
          where: { id: donation.id },
          data: { status: 'failed' },
        })

        await logPaymentAction(
          donation.userId,
          'payment_failed',
          'stripe',
          donation.amount,
          'USD',
          paymentIntent.id,
          { donationId: donation.id },
          paymentIntent.last_payment_error?.message || 'Payment failed'
        )
      }
    } catch (error: any) {
      console.error('[Stripe Webhook] Error handling payment_intent.payment_failed:', error)
    }
  },

  /**
   * Handle refunded charge
   */
  async handleChargeRefunded(charge: any) {
    console.log('[Stripe Webhook] Charge refunded:', charge.id)

    try {
      const donation = await prisma.donation.findFirst({
        where: { transactionId: charge.payment_intent },
      })

      if (donation) {
        await prisma.donation.update({
          where: { id: donation.id },
          data: { status: 'refunded' },
        })

        // Decrease event raised amount if applicable
        if (donation.eventId) {
          await prisma.event.update({
            where: { id: donation.eventId },
            data: {
              raisedAmount: {
                decrement: donation.amount,
              },
            },
          })
        }

        await logPaymentAction(
          donation.userId,
          'refund_issued',
          'stripe',
          donation.amount,
          charge.currency,
          charge.id,
          { donationId: donation.id, refundId: charge.refunds.data[0]?.id }
        )
      }
    } catch (error: any) {
      console.error('[Stripe Webhook] Error handling charge.refunded:', error)
    }
  },

  /**
   * Handle subscription created/updated
   */
  async handleSubscriptionUpdated(subscription: any) {
    console.log('[Stripe Webhook] Subscription updated:', subscription.id)

    try {
      const recurringDonation = await prisma.recurringDonation.findFirst({
        where: { stripeSubscriptionId: subscription.id },
      })

      if (recurringDonation) {
        await prisma.recurringDonation.update({
          where: { id: recurringDonation.id },
          data: {
            status: subscription.status === 'active' ? 'active' : 'canceled',
            currentPeriodEnd: subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000)
              : null,
          },
        })
      }
    } catch (error: any) {
      console.error('[Stripe Webhook] Error handling subscription updated:', error)
    }
  },

  /**
   * Handle subscription deleted
   */
  async handleSubscriptionDeleted(subscription: any) {
    console.log('[Stripe Webhook] Subscription deleted:', subscription.id)

    try {
      const recurringDonation = await prisma.recurringDonation.findFirst({
        where: { stripeSubscriptionId: subscription.id },
      })

      if (recurringDonation) {
        await prisma.recurringDonation.update({
          where: { id: recurringDonation.id },
          data: {
            status: 'canceled',
            canceledAt: new Date(),
          },
        })
      }
    } catch (error: any) {
      console.error('[Stripe Webhook] Error handling subscription deleted:', error)
    }
  },
}

