import prisma from '../config/database'
// import { hashPassword } from '../utils/password' // Unused import
import { createError } from '../middleware/errorHandler'
import { createNotification } from '../utils/notifications'
import path from 'path'
import fs from 'fs'

export const userService = {
  async getUserProfile(username: string, currentUserId?: string) {
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        avatar: true,
        coverImage: true,
        bio: true,
        location: true,
        website: true,
        verified: true,
        createdAt: true,
      },
    })

    if (!user) {
      throw createError('User not found', 404)
    }

    // Get stats and user settings
    const [followers, following, causesSupported, donations, isFollowing, userSettings] = await Promise.all([
      prisma.follow.count({ where: { followingId: user.id } }),
      prisma.follow.count({ where: { followerId: user.id } }),
      prisma.supportHistory.count({ where: { userId: user.id } }),
      prisma.donation.aggregate({
        where: { userId: user.id, status: 'completed' },
        _sum: { amount: true },
      }),
      currentUserId ? this.isFollowing(currentUserId, user.id) : Promise.resolve(false),
      prisma.userSettings.findUnique({
        where: { userId: user.id },
        select: { interestTags: true },
      }),
    ])

    // Get user's created events
    const createdEvents = await prisma.event.findMany({
      where: { organizationId: user.id, status: 'active' },
      select: {
        id: true,
        title: true,
        description: true,
        image: true,
        goalAmount: true,
        raisedAmount: true,
        createdAt: true,
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
    })

    // Get user's supported events
    const supportedEventsData = await prisma.supportHistory.findMany({
      where: { 
        userId: user.id,
        event: {
          status: 'active'
        }
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
            createdAt: true,
            organization: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true,
                avatar: true,
                verified: true,
              },
            },
            tags: {
              select: {
                name: true,
              },
            },
            _count: {
              select: {
                supports: true,
              },
            },
          },
        },
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
    })

    const supportedEvents = supportedEventsData
      .map((sh) => sh.event)
      .filter((e) => e !== null)
      .map((event) => ({
        id: event!.id,
        title: event!.title,
        description: event!.description,
        image: event!.image,
        goal: event!.goalAmount,
        raised: event!.raisedAmount,
        supporters: event!._count.supports,
        createdAt: event!.createdAt.toISOString(),
        organization: {
          id: event!.organization.id,
          name: `${event!.organization.firstName} ${event!.organization.lastName}`.trim() || event!.organization.username,
          username: event!.organization.username,
          verified: event!.organization.verified,
          avatar: event!.organization.avatar,
        },
        tags: (event!.tags || []).map((tag) => tag.name), // Handle empty tags array
      }))

    return {
      ...user,
      name: `${user.firstName} ${user.lastName}`,
      joinedDate: user.createdAt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      isFollowing,
      isOwnProfile: currentUserId === user.id,
      interestTags: userSettings?.interestTags || [],
      stats: {
        followers,
        following,
        causesSupported,
        totalDonated: donations._sum.amount || 0,
        impactScore: causesSupported * 10 + (donations._sum.amount || 0) / 100,
      },
      events: createdEvents.map((event) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        image: event.image,
        goal: event.goalAmount,
        raised: event.raisedAmount,
        createdAt: event.createdAt.toISOString(),
      })),
      supportedEvents,
    }
  },

  async updateProfile(userId: string, data: any) {
    const { firstName, lastName, bio, location, website, email } = data

    // Check if email is being updated and if it's already taken
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id: userId },
        },
      })
      if (existingUser) {
        throw createError('Email already in use', 409)
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(bio !== undefined && { bio }),
        ...(location !== undefined && { location }),
        ...(website !== undefined && { website }),
        ...(email && { email }),
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        coverImage: true,
        bio: true,
        location: true,
        website: true,
        verified: true,
        createdAt: true,
      },
    })

    return user
  },

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    })

    if (!user) {
      throw createError('User not found', 404)
    }

    // Verify old password
    const { comparePassword } = await import('../utils/password')
    const isPasswordValid = await comparePassword(oldPassword, user.password)
    if (!isPasswordValid) {
      throw createError('Current password is incorrect', 400)
    }

    // Hash new password
    const { hashPassword } = await import('../utils/password')
    const hashedPassword = await hashPassword(newPassword)

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    })

    return { success: true }
  },

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true },
    })

    // Delete old avatar if exists
    if (user?.avatar) {
      const oldPath = path.join(process.cwd(), user.avatar)
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath)
      }
    }

    const avatarPath = `/uploads/${file.filename}`

    await prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarPath },
    })

    return { avatar: avatarPath }
  },

  async uploadCoverImage(userId: string, file: Express.Multer.File) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { coverImage: true },
    })

    // Delete old cover image if exists
    if (user?.coverImage) {
      const oldPath = path.join(process.cwd(), user.coverImage)
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath)
      }
    }

    const coverImagePath = `/uploads/${file.filename}`

    await prisma.user.update({
      where: { id: userId },
      data: { coverImage: coverImagePath },
    })

    return { coverImage: coverImagePath }
  },

  async toggleFollow(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw createError('Cannot follow yourself', 400)
    }

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    })

    if (existingFollow) {
      // Unfollow
      await prisma.follow.delete({
        where: {
          id: existingFollow.id,
        },
      })
      return { isFollowing: false }
    } else {
      // Follow
      await prisma.follow.create({
        data: {
          followerId,
          followingId,
        },
      })

      // Get follower info
      const follower = await prisma.user.findUnique({
        where: { id: followerId },
        select: {
          firstName: true,
          lastName: true,
          username: true,
        },
      })

      // Create notification
      if (follower) {
        const followerName = `${follower.firstName} ${follower.lastName}`.trim() || follower.username
        await createNotification({
          userId: followingId,
          type: 'follow',
          title: 'New Follower',
          message: `${followerName} started following you`,
          actionUrl: `/profile/${follower.username}`,
        })
      }
      return { isFollowing: true }
    }
  },

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    if (followerId === followingId) {
      return false
    }

    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    })

    return !!follow
  },

  async followUser(followerId: string, followingId: string) {
    const result = await this.toggleFollow(followerId, followingId)
    if (!result.isFollowing) {
      throw createError('Already following this user', 400)
    }
  },

  async unfollowUser(followerId: string, followingId: string) {
    const result = await this.toggleFollow(followerId, followingId)
    if (result.isFollowing) {
      throw createError('Not following this user', 400)
    }
  },

  async searchUsers(query: string, limit: number = 10) {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        verified: true,
        bio: true,
      },
      take: limit,
    })

    return users.map((user) => ({
      id: user.id,
      username: user.username,
      name: `${user.firstName} ${user.lastName}`,
      avatar: user.avatar,
      verified: user.verified,
      bio: user.bio,
    }))
  },

  /**
   * Get user by ID (for chat participant data)
   */
  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        verified: true,
        bio: true,
        email: true,
      },
    })

    if (!user) {
      throw createError('User not found', 404)
    }

    return {
      id: user.id,
      username: user.username,
      name: `${user.firstName} ${user.lastName}`.trim() || user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      verified: user.verified,
      bio: user.bio,
    }
  },

  async getFollowingUsers(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit

    const [follows, total] = await Promise.all([
      prisma.follow.findMany({
        where: { followerId: userId },
        include: {
          following: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
              verified: true,
              bio: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.follow.count({ where: { followerId: userId } }),
    ])

    return {
      data: follows.map((follow) => ({
        id: follow.following.id,
        username: follow.following.username,
        name: `${follow.following.firstName} ${follow.following.lastName}`.trim() || follow.following.username,
        avatar: follow.following.avatar,
        verified: follow.following.verified,
        bio: follow.following.bio,
        followedAt: follow.createdAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  },

  async updatePreferences(userId: string, tags: string[]) {
    console.log(`[UpdatePreferences] updatePreferences called for userId: ${userId}`)
    // Validate tags array
    if (!Array.isArray(tags)) {
      throw createError('Tags must be an array', 400)
    }

    // Import tag service
    const { tagService } = await import('./tag.service')

    // Create or find all tags (normalizes and prevents duplicates)
    const tagPromises = tags.map((name) => tagService.createOrFindTag(name))
    const canonicalTags = await Promise.all(tagPromises)

    // Get tag IDs for UserTag join table
    const tagIds = canonicalTags.map((tag) => tag.id)
    const tagNames = canonicalTags.map((tag) => tag.name) // Use canonical display names

    // Update UserTag join table (canonical approach)
    // First, delete existing user tags
    await prisma.userTag.deleteMany({
      where: { userId },
    })

    // Then, create new UserTag entries
    if (tagIds.length > 0) {
      await prisma.userTag.createMany({
        data: tagIds.map((tagId) => ({
          userId,
          tagId,
        })),
        skipDuplicates: true,
      })
    }

    // ALSO update interestTags array for backward compatibility (during migration)
    // Keep this in sync with canonical tags
    await prisma.userSettings.upsert({
      where: { userId },
      create: {
        userId,
        interestTags: tagNames, // Use canonical display names
      },
      update: {
        interestTags: tagNames,
      },
    })

    console.log(`[UpdatePreferences] ✅ Tags successfully saved:`, {
      tagIds,
      tagNames,
      canonicalTags: canonicalTags.map((t) => ({ id: t.id, name: t.name, canonicalName: t.canonicalName })),
    })

    return { success: true, tags: tagIds } // Return tag IDs (canonical)
  },

  async getPreferences(userId: string) {
    // First, try to get tags from UserTag join table (canonical approach)
    const userTags = await prisma.userTag.findMany({
      where: { userId },
      include: {
        tag: {
          select: {
            id: true,
            name: true,
            canonicalName: true,
          },
        },
      },
    })

    // If UserTag entries exist, use them
    if (userTags.length > 0) {
      return {
        tags: userTags.map((ut) => ut.tag.id), // Return canonical tag IDs
        tagDetails: userTags.map((ut) => ({
          id: ut.tag.id,
          name: ut.tag.name,
          canonicalName: ut.tag.canonicalName,
        })),
      }
    }

    // Fallback: Get tags from interestTags array (backward compatibility)
    const settings = await prisma.userSettings.findUnique({
      where: { userId },
      select: { interestTags: true },
    })

    // If we have legacy interestTags, migrate them to UserTag
    if (settings?.interestTags && settings.interestTags.length > 0) {
      const { tagService } = await import('./tag.service')
      
      // Create or find tags and create UserTag entries
      const tagPromises = settings.interestTags.map((name) => tagService.createOrFindTag(name))
      const canonicalTags = await Promise.all(tagPromises)

      // Create UserTag entries
      await prisma.userTag.createMany({
        data: canonicalTags.map((tag) => ({
          userId,
          tagId: tag.id,
        })),
        skipDuplicates: true,
      })

      return {
        tags: canonicalTags.map((tag) => tag.id),
        tagDetails: canonicalTags.map((tag) => ({
          id: tag.id,
          name: tag.name,
          canonicalName: tag.canonicalName,
        })),
      }
    }

    return {
      tags: [],
      tagDetails: [],
    }
  },

  async getUserActivity(username: string, limit: number = 20) {
    // Get user first
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    })

    if (!user) {
      throw createError('User not found', 404)
    }

    // Fetch recent activities
    const [supports, awards, follows] = await Promise.all([
      // Recent supported events
      prisma.supportHistory.findMany({
        where: { userId: user.id },
        include: {
          event: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      // Recent awards received
      prisma.award.findMany({
        where: { userId: user.id },
        include: {
          comment: {
            select: {
              id: true,
              content: true,
              event: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      // Recent follows (users this user started following)
      prisma.follow.findMany({
        where: { followerId: user.id },
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
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
    ])

    // Format activities with type and timestamp
    const activities: Array<{
      type: 'support' | 'award' | 'follow'
      id: string
      title: string
      description: string
      timestamp: string
    }> = []

    // Add supported events
    supports.forEach((support) => {
      activities.push({
        type: 'support',
        id: support.id,
        title: `Supported ${support.event.title}`,
        description: support.event.title,
        timestamp: support.createdAt.toISOString(),
      })
    })

    // Add awards
    awards.forEach((award) => {
      const eventTitle = award.comment.event?.title || 'an event'
      activities.push({
        type: 'award',
        id: award.id,
        title: 'Received Community Champion award',
        description: eventTitle,
        timestamp: award.createdAt.toISOString(),
      })
    })

    // Add follows
    follows.forEach((follow) => {
      const followedUserName = `${follow.following.firstName} ${follow.following.lastName}`.trim() || follow.following.username
      activities.push({
        type: 'follow',
        id: follow.id,
        title: `Started following ${followedUserName}`,
        description: `@${follow.following.username}`,
        timestamp: follow.createdAt.toISOString(),
      })
    })

    // Sort by timestamp (most recent first) and limit
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    
    return activities.slice(0, limit)
  },
}

