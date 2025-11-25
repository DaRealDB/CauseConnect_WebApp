import prisma from '../config/database'
import { createError } from '../middleware/errorHandler'

export const privacyService = {
  /**
   * Get all active sessions (refresh tokens) for a user
   */
  async getLoginActivity(userId: string) {
    const tokens = await prisma.refreshToken.findMany({
      where: {
        userId,
        expiresAt: {
          gt: new Date(), // Only active tokens
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return tokens.map((token) => {
      const isCurrentSession = token.id === tokens[0]?.id // First one is most recent

      // Parse user agent to get browser/device info
      let deviceInfo = 'Unknown Device'
      let location = 'Unknown Location'
      
      if (token.userAgent) {
        // Simple parsing - in production, use a library like 'ua-parser-js'
        if (token.userAgent.includes('Mobile') || token.userAgent.includes('iPhone') || token.userAgent.includes('Android')) {
          deviceInfo = token.userAgent.includes('iPhone') ? 'iPhone' : 'Mobile Device'
        } else if (token.userAgent.includes('Chrome')) {
          deviceInfo = 'Chrome'
        } else if (token.userAgent.includes('Firefox')) {
          deviceInfo = 'Firefox'
        } else if (token.userAgent.includes('Safari')) {
          deviceInfo = 'Safari'
        } else if (token.userAgent.includes('Edge')) {
          deviceInfo = 'Edge'
        }

        // Try to detect OS
        if (token.userAgent.includes('Mac OS X') || token.userAgent.includes('macOS')) {
          deviceInfo += ' on macOS'
        } else if (token.userAgent.includes('Windows')) {
          deviceInfo += ' on Windows'
        } else if (token.userAgent.includes('Linux')) {
          deviceInfo += ' on Linux'
        } else if (token.userAgent.includes('Android')) {
          deviceInfo += ' on Android'
        } else if (token.userAgent.includes('iOS') || token.userAgent.includes('iPhone')) {
          deviceInfo += ' on iOS'
        }
      } else {
        deviceInfo = token.deviceType || 'Unknown Device'
      }

      // Calculate time ago
      const now = new Date()
      const diffInMs = now.getTime() - token.createdAt.getTime()
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
      const diffInDays = Math.floor(diffInHours / 24)
      
      let timeAgo = 'just now'
      if (diffInDays > 0) {
        timeAgo = `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`
      } else if (diffInHours > 0) {
        timeAgo = `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`
      } else {
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
        if (diffInMinutes > 0) {
          timeAgo = `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`
        }
      }

      return {
        id: token.id,
        device: deviceInfo,
        location: location,
        timeAgo,
        isCurrentSession,
        createdAt: token.createdAt.toISOString(),
      }
    })
  },

  /**
   * Revoke a session (delete refresh token)
   */
  async revokeSession(tokenId: string, userId: string) {
    const token = await prisma.refreshToken.findUnique({
      where: { id: tokenId },
    })

    if (!token) {
      throw createError('Session not found', 404)
    }

    // Ensure user owns this token
    if (token.userId !== userId) {
      throw createError('Unauthorized', 403)
    }

    await prisma.refreshToken.delete({
      where: { id: tokenId },
    })

    return { message: 'Session revoked successfully' }
  },

  /**
   * Get all blocked users
   */
  async getBlockedUsers(userId: string) {
    const blocks = await prisma.block.findMany({
      where: { blockerId: userId },
      include: {
        blocked: {
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
      orderBy: {
        createdAt: 'desc',
      },
    })

    return blocks.map((block) => ({
      id: block.id,
      userId: block.blocked.id,
      username: block.blocked.username,
      name: `${block.blocked.firstName} ${block.blocked.lastName}`,
      avatar: block.blocked.avatar,
      verified: block.blocked.verified,
      blockedAt: block.createdAt.toISOString(),
    }))
  },

  /**
   * Block a user
   */
  async blockUser(blockerId: string, blockedId: string) {
    // Cannot block yourself
    if (blockerId === blockedId) {
      throw createError('Cannot block yourself', 400)
    }

    // Check if user exists
    const blockedUser = await prisma.user.findUnique({
      where: { id: blockedId },
    })

    if (!blockedUser) {
      throw createError('User not found', 404)
    }

    // Check if already blocked
    const existingBlock = await prisma.block.findFirst({
      where: {
        blockerId,
        blockedId,
      },
    })

    if (existingBlock) {
      throw createError('User is already blocked', 400)
    }

    // Create block relationship
    const block = await prisma.block.create({
      data: {
        blockerId,
        blockedId,
      },
      include: {
        blocked: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    })

    // Also remove follow relationships if they exist
    await prisma.follow.deleteMany({
      where: {
        OR: [
          { followerId: blockerId, followingId: blockedId },
          { followerId: blockedId, followingId: blockerId },
        ],
      },
    })

    return {
      id: block.id,
      userId: block.blocked.id,
      username: block.blocked.username,
      name: `${block.blocked.firstName} ${block.blocked.lastName}`,
      avatar: block.blocked.avatar,
      blockedAt: block.createdAt.toISOString(),
    }
  },

  /**
   * Unblock a user
   */
  async unblockUser(blockerId: string, blockedId: string) {
    const block = await prisma.block.findFirst({
      where: {
        blockerId,
        blockedId,
      },
    })

    if (!block) {
      throw createError('User is not blocked', 404)
    }

    await prisma.block.delete({
      where: {
        id: block.id,
      },
    })

    return { message: 'User unblocked successfully' }
  },

  /**
   * Export all user data
   */
  async exportUserData(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        events: {
          include: {
            tags: true,
          },
        },
        posts: {
          include: {
            tags: true,
          },
        },
        comments: true,
        donations: true,
        supports: {
          include: {
            event: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        bookmarks: {
          include: {
            event: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        likes: true,
        following: {
          include: {
            following: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        followers: {
          include: {
            follower: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        settings: true,
        notifications: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 100,
        },
        awards: {
          include: {
            comment: {
              include: {
                event: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
              },
            },
          },
        },
        squadMembers: {
          include: {
            squad: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        createdSquads: {
          select: {
            id: true,
            name: true,
            description: true,
            createdAt: true,
          },
        },
      },
    })

    if (!user) {
      throw createError('User not found', 404)
    }

    // Format the data for export
    const exportData = {
      account: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        bio: user.bio,
        location: user.location,
        website: user.website,
        verified: user.verified,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      settings: user.settings ? {
        notifications: {
          donations: user.settings.notificationsDonations,
          comments: user.settings.notificationsComments,
          awards: user.settings.notificationsAwards,
          mentions: user.settings.notificationsMentions,
          newCauses: user.settings.notificationsNewCauses,
          email: user.settings.notificationsEmail,
          sms: user.settings.notificationsSMS,
        },
        privacy: {
          activityVisibility: user.settings.activityVisibility,
          twoFactorEnabled: user.settings.twoFactorEnabled,
        },
        personalization: {
          language: user.settings.language,
          region: user.settings.region,
          currency: user.settings.currency,
          theme: user.settings.theme,
          interestTags: user.settings.interestTags,
        },
        accessibility: {
          highContrast: user.settings.highContrast,
          screenReader: user.settings.screenReader,
          textSize: user.settings.textSize,
        },
      } : null,
      activity: {
        eventsCreated: user.events.length,
        postsCreated: user.posts.length,
        commentsMade: user.comments.length,
        donationsMade: user.donations.length,
        causesSupported: user.supports.length,
        bookmarks: user.bookmarks.length,
        likes: user.likes.length,
        following: user.following.length,
        followers: user.followers.length,
      },
      content: {
        events: user.events.map(event => ({
          id: event.id,
          title: event.title,
          description: event.description,
          status: event.status,
          createdAt: event.createdAt.toISOString(),
          tags: event.tags.map(tag => tag.name),
        })),
        posts: user.posts.map(post => ({
          id: post.id,
          content: post.content,
          createdAt: post.createdAt.toISOString(),
          tags: post.tags.map(tag => tag.name),
        })),
        comments: user.comments.map(comment => ({
          id: comment.id,
          content: comment.content,
          createdAt: comment.createdAt.toISOString(),
        })),
        donations: user.donations.map(donation => ({
          id: donation.id,
          amount: donation.amount,
          status: donation.status,
          createdAt: donation.createdAt.toISOString(),
        })),
        supportedCauses: user.supports.map(support => ({
          eventId: support.event.id,
          eventTitle: support.event.title,
          supportedAt: support.createdAt.toISOString(),
        })),
        bookmarks: user.bookmarks.map(bookmark => ({
          eventId: bookmark.event.id,
          eventTitle: bookmark.event.title,
          bookmarkedAt: bookmark.createdAt.toISOString(),
        })),
      },
      social: {
        following: user.following.map(follow => ({
          userId: follow.following.id,
          username: follow.following.username,
          name: `${follow.following.firstName} ${follow.following.lastName}`,
          followedAt: follow.createdAt.toISOString(),
        })),
        followers: user.followers.map(follow => ({
          userId: follow.follower.id,
          username: follow.follower.username,
          name: `${follow.follower.firstName} ${follow.follower.lastName}`,
          followedAt: follow.createdAt.toISOString(),
        })),
        awards: user.awards.map(award => ({
          id: award.id,
          eventTitle: award.comment.event?.title || 'Unknown',
          receivedAt: award.createdAt.toISOString(),
        })),
        squads: {
          memberships: user.squadMembers.map(member => ({
            squadId: member.squad.id,
            squadName: member.squad.name,
            role: member.role,
            joinedAt: member.joinedAt.toISOString(),
          })),
          created: user.createdSquads.map(squad => ({
            id: squad.id,
            name: squad.name,
            description: squad.description,
            createdAt: squad.createdAt.toISOString(),
          })),
        },
      },
      notifications: user.notifications.map(notification => ({
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        isRead: notification.isRead,
        createdAt: notification.createdAt.toISOString(),
      })),
      exportedAt: new Date().toISOString(),
    }

    return exportData
  },
}

