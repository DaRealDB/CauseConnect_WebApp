import prisma from '../config/database'
import { createError } from '../middleware/errorHandler'
import { createNotification } from '../utils/notifications'
import { normalizeTagName } from './tag.service'

export const eventService = {
  async getEvents(params: {
    page?: number
    limit?: number
    filter?: string
    tags?: string[]
    search?: string
    userId?: string // Filter by user who created the events
    excludeUserId?: string // Exclude events created by this user
    excludeUserTags?: boolean // Exclude tags the user has selected (for explore)
    requireUserTags?: boolean // If true, filter by user's tags (enforce intersection for feed)
    userIdForTags?: string // User ID to get tags from (for filtering)
  }) {
    const page = params.page || 1
    const limit = params.limit || 10
    const skip = (page - 1) * limit

    const where: any = {
      status: 'active',
    }

    // Filter by user who created the events
    if (params.userId) {
      where.organizationId = params.userId
    }

    // Exclude events created by this user (for explore page)
    if (params.excludeUserId) {
      where.organizationId = {
        not: params.excludeUserId,
      }
    }

    // CRITICAL: Tag filtering takes PRIORITY over search
    // If manual tags are provided, ALWAYS filter by them (STRICT)
    // If requireUserTags is set, filter by saved tags (STRICT)
    
    let tagFilter: any = null
    let forceEmptyResult = false
    
    // Priority 1: Manual tag filtering (user selected tags in feed)
    if (params.tags && params.tags.length > 0) {
      // Normalize all tag names for case-insensitive comparison
      const normalizedTags = params.tags.map(tag => normalizeTagName(tag))
      
      // STRICT: Show ONLY events with at least one tag matching selected tags
      // Use OR with case-insensitive matching for each tag
      tagFilter = {
        some: {
          OR: normalizedTags.map(normTag => ({
            name: { 
              equals: normTag,
              mode: 'insensitive' as const
            }
          })),
        },
      }
      console.log(`[EventService] Applying manual tag filter (case-insensitive):`, normalizedTags)
    }
    // Priority 2: Exclude user tags (for explore page)
    else if (params.excludeUserTags && params.userIdForTags) {
      const userSettings = await prisma.userSettings.findUnique({
        where: { userId: params.userIdForTags },
        select: { interestTags: true },
      })
      
      if (userSettings?.interestTags && userSettings.interestTags.length > 0) {
        // Normalize user interest tags for case-insensitive matching
        const normalizedUserTags = userSettings.interestTags.map(tag => normalizeTagName(tag))
        
        tagFilter = {
          none: {
            OR: normalizedUserTags.map(normTag => ({
              name: { 
                equals: normTag,
                mode: 'insensitive' as const
              }
            })),
          },
        }
        console.log(`[EventService] Applying excludeUserTags filter (case-insensitive):`, normalizedUserTags)
      }
    }
    // Priority 3: Require user tags (saved interest tags)
    else if (params.requireUserTags && params.userIdForTags) {
      const userSettings = await prisma.userSettings.findUnique({
        where: { userId: params.userIdForTags },
        select: { interestTags: true },
      })
      
      if (userSettings?.interestTags && userSettings.interestTags.length > 0) {
        // Normalize user interest tags for case-insensitive matching
        const normalizedUserTags = userSettings.interestTags.map(tag => normalizeTagName(tag))
        
        // STRICT: Show ONLY events with at least one tag matching user's interests (case-insensitive)
        tagFilter = {
          some: {
            OR: normalizedUserTags.map(normTag => ({
              name: { 
                equals: normTag,
                mode: 'insensitive' as const
              }
            })),
          },
        }
        console.log(`[EventService] Applying requireUserTags filter (case-insensitive):`, normalizedUserTags)
      } else {
        // User has no tags selected - show EMPTY feed (strict filtering)
        forceEmptyResult = true
        console.log(`[EventService] No user tags found - forcing empty result (strict filtering)`)
      }
    }
    
    // Apply tag filter if it was set
    if (tagFilter) {
      where.tags = tagFilter
      console.log(`[EventService] Tag filter applied to where clause`)
    }
    
    // Force empty result if needed (strict filtering with no tags)
    if (forceEmptyResult) {
      where.id = { in: [] } // Force empty result
      console.log(`[EventService] Force empty result applied (no tags)`)
    }
    
    // If search query is provided, combine with tag filtering (AND condition)
    // Search does NOT bypass tag filtering - both must match
    if (params.search && params.search.trim()) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { title: { contains: params.search, mode: 'insensitive' } },
            { description: { contains: params.search, mode: 'insensitive' } },
            { fullDescription: { contains: params.search, mode: 'insensitive' } },
          ],
        },
      ]
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take: limit,
        include: {
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
          tags: true,
          _count: {
            select: {
              supports: true,
              donations: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.event.count({ where }),
    ])

    // Transform events to match frontend format
    const transformedEvents = events.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      fullDescription: event.fullDescription,
      image: event.image,
      tags: (event.tags || []).map((tag) => tag.name), // Handle empty tags array
      supporters: event._count.supports,
      goal: event.goalAmount,
      raised: event.raisedAmount,
      organization: {
        id: event.organization.id,
        name: `${event.organization.firstName} ${event.organization.lastName}`.trim() || event.organization.username,
        username: event.organization.username,
        verified: event.organization.verified,
        avatar: event.organization.avatar,
      },
      location: event.location,
      targetDate: event.targetDate?.toISOString(),
      timeLeft: event.targetDate
        ? `${Math.ceil((event.targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left`
        : undefined,
      urgency: event.urgency as 'high' | 'medium' | 'low',
      isSupported: false, // Will be set by controller if user is authenticated
      isBookmarked: false, // Will be set by controller if user is authenticated
      createdAt: event.createdAt.toISOString(),
    }))

    return {
      data: transformedEvents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  },

  async getEventById(id: string, userId?: string) {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            avatar: true,
            verified: true,
            bio: true,
          },
        },
        tags: true,
        updates: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            supports: true,
            donations: true,
          },
        },
      },
    })

    if (!event) {
      throw createError('Event not found', 404)
    }

    // Check if user supported/bookmarked
    let isSupported = false
    let isBookmarked = false

    if (userId) {
      const [support, bookmark] = await Promise.all([
        prisma.supportHistory.findUnique({
          where: {
            userId_eventId: {
              userId,
              eventId: id,
            },
          },
        }),
        prisma.bookmark.findFirst({
          where: {
            userId,
            eventId: id,
          },
        }),
      ])

      isSupported = !!support
      isBookmarked = !!bookmark
    }

    return {
      id: event.id,
      title: event.title,
      description: event.description,
      fullDescription: event.fullDescription || event.description,
      image: event.image,
      tags: (event.tags || []).map((tag) => tag.name), // Handle empty tags array
      supporters: event._count.supports,
      goal: event.goalAmount,
      raised: event.raisedAmount,
      organization: {
        id: event.organization.id,
        name: `${event.organization.firstName} ${event.organization.lastName}`.trim() || event.organization.username,
        verified: event.organization.verified,
        avatar: event.organization.avatar,
        description: event.organization.bio,
      },
      location: event.location,
      targetDate: event.targetDate?.toISOString(),
      timeLeft: event.targetDate
        ? `${Math.ceil((event.targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left`
        : undefined,
      urgency: event.urgency as 'high' | 'medium' | 'low',
      isSupported,
      isBookmarked,
      updates: event.updates.map((update) => ({
        id: update.id,
        title: update.title,
        content: update.content,
        image: update.image,
        timestamp: update.createdAt.toISOString(),
      })),
      createdAt: event.createdAt.toISOString(),
    }
  },

  async createEvent(userId: string, data: any, files?: Express.Multer.File[]) {
    const {
      title,
      description,
      fullDescription,
      location,
      targetDate,
      goalAmount,
      tags,
    } = data

    const image = files && files.length > 0 ? `/uploads/${files[0].filename}` : undefined

    const event = await prisma.event.create({
      data: {
        title,
        description,
        fullDescription,
        image,
        location,
        targetDate: targetDate ? new Date(targetDate) : null,
        goalAmount: goalAmount ? parseFloat(goalAmount) : 0,
        organizationId: userId,
        tags: {
          create: tags
            ? (Array.isArray(tags) ? tags : [tags]).map((tag: string) => ({ name: tag }))
            : [],
        },
      },
      include: {
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
        tags: true,
      },
    })

    return {
      event: {
        id: event.id,
        title: event.title,
        description: event.description,
        image: event.image,
        tags: (event.tags || []).map((tag) => tag.name), // Handle empty tags array
        organization: {
          id: event.organization.id,
          name: `${event.organization.firstName} ${event.organization.lastName}`.trim() || event.organization.username,
          verified: event.organization.verified,
        },
      },
    }
  },

  async supportEvent(userId: string, eventId: string) {
    // Check if already supported
    const existing = await prisma.supportHistory.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    })

    if (existing) {
      throw createError('Event already supported', 400)
    }

    // Remove from pass history if exists
    await prisma.passHistory.deleteMany({
      where: {
        userId,
        eventId,
      },
    })

    // Add to support history
    await prisma.supportHistory.create({
      data: {
        userId,
        eventId,
      },
    })

    // Get event and user info for notification
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organization: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
      },
    })

    const supporter = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        firstName: true,
        lastName: true,
        username: true,
      },
    })

    // Create notification for event organizer (if not supporting own event)
    if (event && event.organizationId !== userId && supporter) {
      const supporterName = `${supporter.firstName} ${supporter.lastName}`.trim() || supporter.username
      await createNotification({
        userId: event.organizationId,
        type: 'support',
        title: 'New Supporter',
        message: `${supporterName} supported your event "${event.title}"`,
        actionUrl: `/event/${eventId}`,
      })
    }
  },

  async passEvent(userId: string, eventId: string) {
    // Remove from support history
    await prisma.supportHistory.deleteMany({
      where: {
        userId,
        eventId,
      },
    })

    // Add to pass history
    await prisma.passHistory.upsert({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
      create: {
        userId,
        eventId,
      },
      update: {},
    })
  },

  async bookmarkEvent(userId: string, eventId: string) {
    // Check if bookmark already exists
    const existing = await prisma.bookmark.findFirst({
      where: {
        userId,
        eventId,
        postId: null,
        commentId: null,
      },
    })

    if (existing) {
      // Already bookmarked, do nothing (idempotent)
      return
    }

    // Create new bookmark
    await prisma.bookmark.create({
      data: {
        userId,
        eventId,
      },
    })
  },

  async unbookmarkEvent(userId: string, eventId: string) {
    await prisma.bookmark.deleteMany({
      where: {
        userId,
        eventId,
        postId: null,
        commentId: null,
      },
    })
  },

  async getBookmarkedEvents(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit

    const [bookmarks, total] = await Promise.all([
      prisma.bookmark.findMany({
        where: {
          userId,
          eventId: { not: null },
          postId: null,
          commentId: null,
        },
        include: {
          event: {
            include: {
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
              tags: true,
              _count: {
                select: {
                  supports: true,
                  donations: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.bookmark.count({
        where: {
          userId,
          eventId: { not: null },
          postId: null,
          commentId: null,
        },
      }),
    ])

    const events = bookmarks
      .map((bookmark) => bookmark.event)
      .filter((event) => event !== null && event.status === 'active')
      .map((event) => ({
        id: event!.id,
        title: event!.title,
        description: event!.description,
        fullDescription: event!.fullDescription,
        image: event!.image,
        tags: (event!.tags || []).map((tag) => tag.name), // Handle empty tags array
        supporters: event!._count.supports,
        goal: event!.goalAmount,
        raised: event!.raisedAmount,
        organization: {
          id: event!.organization.id,
          name: `${event!.organization.firstName} ${event!.organization.lastName}`.trim() || event!.organization.username,
          username: event!.organization.username,
          verified: event!.organization.verified,
          avatar: event!.organization.avatar,
        },
        location: event!.location,
        targetDate: event!.targetDate?.toISOString(),
        timeLeft: event!.targetDate
          ? `${Math.ceil((event!.targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left`
          : undefined,
        urgency: event!.urgency as 'high' | 'medium' | 'low',
        isSupported: false,
        isBookmarked: true,
        createdAt: event!.createdAt.toISOString(),
      }))

    return {
      data: events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  },

  async updateEvent(eventId: string, userId: string, data: any) {
    // Verify ownership
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { organizationId: true },
    })

    if (!event) {
      throw createError('Event not found', 404)
    }

    if (event.organizationId !== userId) {
      throw createError('Unauthorized: Only event owner can update', 403)
    }

    const { title, description, fullDescription, location, goalAmount, tags } = data

    // Update event
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        title,
        description,
        fullDescription,
        location,
        goalAmount: goalAmount ? parseFloat(goalAmount) : undefined,
        tags: tags
          ? {
              deleteMany: {},
              create: (Array.isArray(tags) ? tags : [tags]).map((tag: string) => ({ name: tag })),
            }
          : undefined,
      },
      include: {
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
        tags: true,
        _count: {
          select: {
            supports: true,
            donations: true,
          },
        },
      },
    })

    return {
      id: updatedEvent.id,
      title: updatedEvent.title,
      description: updatedEvent.description,
      fullDescription: updatedEvent.fullDescription,
      image: updatedEvent.image,
      tags: (updatedEvent.tags || []).map((tag) => tag.name), // Handle empty tags array
      supporters: updatedEvent._count.supports,
      goal: updatedEvent.goalAmount,
      raised: updatedEvent.raisedAmount,
      organization: {
        id: updatedEvent.organization.id,
        name: `${updatedEvent.organization.firstName} ${updatedEvent.organization.lastName}`.trim() || updatedEvent.organization.username,
        username: updatedEvent.organization.username,
        verified: updatedEvent.organization.verified,
        avatar: updatedEvent.organization.avatar,
      },
      location: updatedEvent.location,
      targetDate: updatedEvent.targetDate?.toISOString(),
      timeLeft: updatedEvent.targetDate
        ? `${Math.ceil((updatedEvent.targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left`
        : undefined,
      urgency: updatedEvent.urgency as 'high' | 'medium' | 'low',
      createdAt: updatedEvent.createdAt.toISOString(),
    }
  },

  async deleteEvent(eventId: string, userId: string) {
    // Verify ownership
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { organizationId: true },
    })

    if (!event) {
      throw createError('Event not found', 404)
    }

    if (event.organizationId !== userId) {
      throw createError('Unauthorized: Only event owner can delete', 403)
    }

    await prisma.event.delete({
      where: { id: eventId },
    })
  },

  async getEventParticipants(eventId: string, userId: string, page: number = 1, limit: number = 20) {
    // Verify ownership
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { organizationId: true },
    })

    if (!event) {
      throw createError('Event not found', 404)
    }

    if (event.organizationId !== userId) {
      throw createError('Unauthorized: Only event owner can view participants', 403)
    }

    const skip = (page - 1) * limit

    const [participants, total] = await Promise.all([
      prisma.supportHistory.findMany({
        where: { eventId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              avatar: true,
              verified: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.supportHistory.count({
        where: { eventId },
      }),
    ])

    return {
      data: participants.map((p) => ({
        id: p.user.id,
        name: `${p.user.firstName} ${p.user.lastName}`.trim() || p.user.username,
        username: p.user.username,
        avatar: p.user.avatar,
        verified: p.user.verified,
        joinedAt: p.createdAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  },

  async getEventAnalytics(eventId: string, userId: string) {
    // Verify ownership
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { organizationId: true },
    })

    if (!event) {
      throw createError('Event not found', 404)
    }

    if (event.organizationId !== userId) {
      throw createError('Unauthorized: Only event owner can view analytics', 403)
    }

    const [supports, donations, bookmarks, comments] = await Promise.all([
      prisma.supportHistory.count({ where: { eventId } }),
      prisma.donation.count({ where: { eventId } }),
      prisma.bookmark.count({ where: { eventId, postId: null, commentId: null } }),
      prisma.comment.count({ where: { eventId } }),
    ])

    // Get donation stats
    const donationStats = await prisma.donation.aggregate({
      where: { eventId, status: 'completed' },
      _sum: { amount: true },
      _avg: { amount: true },
      _count: true,
    })

    // Get daily support trends (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const dailySupports = await prisma.supportHistory.groupBy({
      by: ['createdAt'],
      where: {
        eventId,
        createdAt: { gte: thirtyDaysAgo },
      },
      _count: true,
    })

    return {
      overview: {
        supporters: supports,
        donations: donations,
        bookmarks,
        comments,
        totalRaised: donationStats._sum.amount || 0,
        averageDonation: donationStats._avg.amount || 0,
        donationCount: donationStats._count,
      },
      trends: {
        dailySupports: dailySupports.map((d) => ({
          date: d.createdAt.toISOString().split('T')[0],
          count: d._count,
        })),
      },
    }
  },
}

