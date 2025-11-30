import prisma from '../config/database'
import { createError } from '../middleware/errorHandler'

export const impactService = {
  /**
   * Get user impact statistics
   */
  async getUserImpactStats(userId: string) {
    try {
      // Get total donated amount (from completed donations)
      const totalDonatedResult = await prisma.donation.aggregate({
        where: {
          userId,
          status: 'completed',
        },
        _sum: {
          amount: true,
        },
      })

      const totalDonated = totalDonatedResult._sum.amount || 0

      // Get unique causes supported (events, posts, or recipients)
      const [eventDonations, postDonations, recipientDonations] = await Promise.all([
        prisma.donation.findMany({
          where: {
            userId,
            status: 'completed',
            eventId: { not: null },
          },
          select: {
            eventId: true,
          },
          distinct: ['eventId'],
        }),
        prisma.donation.findMany({
          where: {
            userId,
            status: 'completed',
            postId: { not: null },
          },
          select: {
            postId: true,
          },
          distinct: ['postId'],
        }),
        prisma.donation.findMany({
          where: {
            userId,
            status: 'completed',
            recipientUserId: { not: null },
          },
          select: {
            recipientUserId: true,
          },
          distinct: ['recipientUserId'],
        }),
      ])

      // Count unique causes
      const uniqueEventIds = new Set(eventDonations.map(d => d.eventId).filter(Boolean))
      const uniquePostIds = new Set(postDonations.map(d => d.postId).filter(Boolean))
      const uniqueRecipientIds = new Set(recipientDonations.map(d => d.recipientUserId).filter(Boolean))

      const causesSupported = uniqueEventIds.size + uniquePostIds.size + uniqueRecipientIds.size

      // Get donation count
      const donationCount = await prisma.donation.count({
        where: {
          userId,
          status: 'completed',
        },
      })

      return {
        totalDonated: Number(totalDonated.toFixed(2)),
        causesSupported,
        donationCount,
      }
    } catch (error: any) {
      throw createError(error.message || 'Failed to fetch impact statistics', 500)
    }
  },
}





