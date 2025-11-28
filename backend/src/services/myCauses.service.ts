import prisma from '../config/database'
import { createError } from '../middleware/errorHandler'

export const myCausesService = {
  /**
   * Get all causes a user has supported, grouped by type with impact stats
   */
  async getUserCauses(userId: string) {
    try {
      // Get all completed donations
      const donations = await prisma.donation.findMany({
        where: {
          userId,
          status: 'completed',
        },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              description: true,
              image: true,
              goalAmount: true,
              raisedAmount: true,
              location: true,
              targetDate: true,
              organization: {
                select: {
                  id: true,
                  username: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                  verified: true,
                },
              },
            },
          },
          post: postId ? {
            select: {
              id: true,
              content: true,
              image: true,
              raisedAmount: true,
              user: {
                select: {
                  id: true,
                  username: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                  verified: true,
                },
              },
            },
          } : false,
          recipient: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
              verified: true,
              totalDonated: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      // Group donations by cause type and aggregate stats
      const causeMap = new Map<string, {
        id: string
        type: 'event' | 'post' | 'recipient'
        title: string
        description?: string
        image?: string
        organization?: {
          id: string
          username: string
          name: string
          avatar?: string
          verified: boolean
        }
        totalDonated: number
        donationCount: number
        firstDonationDate: Date
        lastDonationDate: Date
        goalAmount?: number
        raisedAmount?: number
        location?: string
        targetDate?: Date
      }>()

      donations.forEach((donation) => {
        if (donation.eventId && donation.event) {
          const causeId = `event-${donation.eventId}`
          const existing = causeMap.get(causeId)
          
          if (existing) {
            existing.totalDonated += donation.amount
            existing.donationCount += 1
            if (donation.createdAt < existing.firstDonationDate) {
              existing.firstDonationDate = donation.createdAt
            }
            if (donation.createdAt > existing.lastDonationDate) {
              existing.lastDonationDate = donation.createdAt
            }
          } else {
            causeMap.set(causeId, {
              id: donation.eventId,
              type: 'event',
              title: donation.event.title,
              description: donation.event.description,
              image: donation.event.image || undefined,
              organization: {
                id: donation.event.organization.id,
                username: donation.event.organization.username,
                name: `${donation.event.organization.firstName} ${donation.event.organization.lastName}`.trim() || donation.event.organization.username,
                avatar: donation.event.organization.avatar || undefined,
                verified: donation.event.organization.verified,
              },
              totalDonated: donation.amount,
              donationCount: 1,
              firstDonationDate: donation.createdAt,
              lastDonationDate: donation.createdAt,
              goalAmount: donation.event.goalAmount,
              raisedAmount: donation.event.raisedAmount,
              location: donation.event.location || undefined,
              targetDate: donation.event.targetDate || undefined,
            })
          }
        } else if (donation.postId && donation.post) {
          const causeId = `post-${donation.postId}`
          const existing = causeMap.get(causeId)
          
          if (existing) {
            existing.totalDonated += donation.amount
            existing.donationCount += 1
            if (donation.createdAt < existing.firstDonationDate) {
              existing.firstDonationDate = donation.createdAt
            }
            if (donation.createdAt > existing.lastDonationDate) {
              existing.lastDonationDate = donation.createdAt
            }
          } else {
            // Type guard to check if post has user relation
            const post = donation.post as { 
              id: string
              content: string
              image?: string | null
              raisedAmount: number
              user?: { 
                id: string
                username: string
                firstName: string
                lastName: string
                avatar?: string | null
                verified: boolean
              }
            }
            
            causeMap.set(causeId, {
              id: donation.postId,
              type: 'post',
              title: post.content.substring(0, 100) + (post.content.length > 100 ? '...' : ''),
              description: post.content,
              image: post.image || undefined,
              organization: post.user ? {
                id: post.user.id,
                username: post.user.username,
                name: `${post.user.firstName} ${post.user.lastName}`.trim() || post.user.username,
                avatar: post.user.avatar || undefined,
                verified: post.user.verified || false,
              } : undefined,
              totalDonated: donation.amount,
              donationCount: 1,
              firstDonationDate: donation.createdAt,
              lastDonationDate: donation.createdAt,
              raisedAmount: post.raisedAmount,
            })
          }
        } else if (donation.recipientUserId && donation.recipient) {
          const causeId = `recipient-${donation.recipientUserId}`
          const existing = causeMap.get(causeId)
          
          if (existing) {
            existing.totalDonated += donation.amount
            existing.donationCount += 1
            if (donation.createdAt < existing.firstDonationDate) {
              existing.firstDonationDate = donation.createdAt
            }
            if (donation.createdAt > existing.lastDonationDate) {
              existing.lastDonationDate = donation.createdAt
            }
          } else {
            causeMap.set(causeId, {
              id: donation.recipientUserId,
              type: 'recipient',
              title: `${donation.recipient.firstName} ${donation.recipient.lastName}`.trim() || donation.recipient.username,
              organization: {
                id: donation.recipient.id,
                username: donation.recipient.username,
                name: `${donation.recipient.firstName} ${donation.recipient.lastName}`.trim() || donation.recipient.username,
                avatar: donation.recipient.avatar || undefined,
                verified: donation.recipient.verified,
              },
              totalDonated: donation.amount,
              donationCount: 1,
              firstDonationDate: donation.createdAt,
              lastDonationDate: donation.createdAt,
              raisedAmount: donation.recipient.totalDonated,
            })
          }
        }
      })

      // Convert map to array and sort by last donation date (most recent first)
      const causes = Array.from(causeMap.values())
        .map(cause => ({
          ...cause,
          totalDonated: Number(cause.totalDonated.toFixed(2)),
          firstDonationDate: cause.firstDonationDate.toISOString(),
          lastDonationDate: cause.lastDonationDate.toISOString(),
          targetDate: cause.targetDate ? cause.targetDate.toISOString() : undefined,
        }))
        .sort((a, b) => new Date(b.lastDonationDate).getTime() - new Date(a.lastDonationDate).getTime())

      return {
        causes,
        totalCauses: causes.length,
        totalDonated: causes.reduce((sum, cause) => sum + cause.totalDonated, 0),
        totalDonations: donations.length,
      }
    } catch (error: any) {
      throw createError(error.message || 'Failed to fetch user causes', 500)
    }
  },
}

