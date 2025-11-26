import prisma from '../config/database'
import { createError } from '../middleware/errorHandler'
import { createNotification } from '../utils/notifications'

export const donationService = {
  async createDonation(userId: string, data: any) {
    const {
      eventId,
      amount,
      paymentMethod,
      isRecurring,
      isAnonymous,
      message,
      name: _name,
      email: _email,
    } = data

    // Verify event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    })

    if (!event) {
      throw createError('Event not found', 404)
    }

    // Create donation
    const donation = await prisma.donation.create({
      data: {
        amount: parseFloat(amount),
        paymentMethod,
        isRecurring: isRecurring || false,
        isAnonymous: isAnonymous || false,
        message: message || null,
        userId,
        eventId,
        status: 'completed', // In production, this would be 'pending' until payment is verified
        transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      },
      include: {
        event: {
          select: {
            title: true,
            organizationId: true,
          },
        },
      },
    })

    // Update event raised amount
    await prisma.event.update({
      where: { id: eventId },
      data: {
        raisedAmount: {
          increment: parseFloat(amount),
        },
      },
    })

    // Get donor info for notification
    const donor = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        firstName: true,
        lastName: true,
        username: true,
      },
    })

    // Create notification for event organizer
    if (event.organizationId !== userId) {
      const donorName = isAnonymous 
        ? 'An anonymous donor' 
        : (_name || (donor ? `${donor.firstName} ${donor.lastName}`.trim() || donor.username : 'Someone'))
      
      await createNotification({
        userId: event.organizationId,
        type: 'donation',
        title: 'New Donation Received',
        message: `${donorName} donated $${amount} to your event "${event.title}"`,
        amount: parseFloat(amount),
        actionUrl: `/event/${eventId}`,
      })
    }

    return {
      donation: {
        id: donation.id,
        amount: donation.amount,
        paymentMethod: donation.paymentMethod,
        isRecurring: donation.isRecurring,
        isAnonymous: donation.isAnonymous,
        message: donation.message,
        createdAt: donation.createdAt.toISOString(),
      },
      transactionId: donation.transactionId,
    }
  },

  async getDonations(params: {
    userId?: string
    eventId?: string
    page?: number
    limit?: number
  }) {
    const page = params.page || 1
    const limit = params.limit || 10
    const skip = (page - 1) * limit

    const where: any = {}
    if (params.userId) where.userId = params.userId
    if (params.eventId) where.eventId = params.eventId

    const [donations, total] = await Promise.all([
      prisma.donation.findMany({
        where,
        skip,
        take: limit,
        include: {
          event: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.donation.count({ where }),
    ])

    return {
      data: donations.map((donation) => ({
        id: donation.id,
        eventId: donation.eventId,
        amount: donation.amount,
        paymentMethod: donation.paymentMethod,
        isRecurring: donation.isRecurring,
        isAnonymous: donation.isAnonymous,
        message: donation.message,
        createdAt: donation.createdAt.toISOString(),
        event: donation.event,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  },
}



