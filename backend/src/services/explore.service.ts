import prisma from '../config/database'
import { createError } from '../middleware/errorHandler'
import { eventService } from './event.service'
import { postService } from './post.service'
import { squadService } from './squad.service'

export type ExploreFilter = 'all' | 'groups' | 'posts' | 'events'

export interface ExploreContent {
  type: 'event' | 'post' | 'squad'
  id: string | number
  data: any
  createdAt: Date
}

// Helper function to get all squads (used internally)
async function getAllSquadsHelper(userId?: string) {
  const squads = await prisma.squad.findMany({
    include: {
      creator: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
          avatar: true,
        },
      },
      _count: {
        select: {
          members: true,
          posts: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const squadsWithMembership = await Promise.all(
    squads.map(async (squad) => {
      const membership = userId
        ? await prisma.squadMember.findFirst({
            where: {
              userId,
              squadId: squad.id,
            },
            select: { role: true },
          })
        : null

      return {
        id: squad.id,
        name: squad.name,
        description: squad.description,
        avatar: squad.avatar,
        members: squad._count.members,
        posts: squad._count.posts,
        creator: {
          id: squad.creator.id,
          name: `${squad.creator.firstName} ${squad.creator.lastName}`.trim() || squad.creator.username,
          username: squad.creator.username,
          avatar: squad.creator.avatar,
        },
        isMember: !!membership,
        role: membership?.role,
        createdAt: squad.createdAt.toISOString(),
      }
    }),
  )

  return squadsWithMembership
}

export const exploreService = {
  /**
   * Get all content for explore page (events, posts, squads)
   */
  async getAllContent(params: {
    page?: number
    limit?: number
    userId?: string
    excludeUserTags?: boolean
  }) {
    const page = params.page || 1
    const limit = params.limit || 10
    const skip = (page - 1) * limit

    // Fetch all content types in parallel
    const [eventsResult, postsResult, squadsResult] = await Promise.all([
      eventService.getEvents({
        page: 1,
        limit: 100, // Get more to merge and sort
        excludeUserId: params.userId,
        excludeUserTags: params.excludeUserTags,
        userIdForTags: params.userId,
      }),
      postService.getPosts({
        page: 1,
        limit: 100, // Get more to merge and sort
        excludeUserTags: params.excludeUserTags,
        filterUserId: params.userId,
      }),
      getAllSquadsHelper(params.userId),
    ])

    // Combine and sort by createdAt
    const allContent: ExploreContent[] = [
      ...eventsResult.data.map((event: any) => ({
        type: 'event' as const,
        id: event.id,
        data: event,
        createdAt: new Date(event.createdAt || Date.now()),
      })),
      ...postsResult.data.map((post: any) => ({
        type: 'post' as const,
        id: post.id,
        data: post,
        createdAt: new Date(post.timestamp || post.createdAt || Date.now()),
      })),
      ...squadsResult.map((squad: any) => ({
        type: 'squad' as const,
        id: squad.id,
        data: squad,
        createdAt: new Date(squad.createdAt || Date.now()),
      })),
    ]

    // Sort by createdAt (newest first)
    allContent.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    // Paginate
    const paginatedContent = allContent.slice(skip, skip + limit)
    const total = allContent.length

    return {
      data: paginatedContent,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  },

  /**
   * Get all public squads (for explore - not filtered by membership)
   */
  async getAllSquads(userId?: string) {
    return getAllSquadsHelper(userId)
  },

  /**
   * Get groups/squads for explore page
   */
  async getGroups(params: {
    page?: number
    limit?: number
    userId?: string
  }) {
    const page = params.page || 1
    const limit = params.limit || 10
    const skip = (page - 1) * limit

    const squads = await getAllSquadsHelper(params.userId)
    const total = squads.length

    // Paginate
    const paginatedSquads = squads.slice(skip, skip + limit)

    return {
      data: paginatedSquads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  },

  /**
   * Get posts for explore page
   */
  async getPosts(params: {
    page?: number
    limit?: number
    userId?: string
    excludeUserTags?: boolean
  }) {
    return postService.getPosts({
      page: params.page,
      limit: params.limit,
      excludeUserTags: params.excludeUserTags,
      filterUserId: params.userId,
    })
  },

  /**
   * Get events for explore page
   */
  async getEvents(params: {
    page?: number
    limit?: number
    userId?: string
    excludeUserTags?: boolean
  }) {
    return eventService.getEvents({
      page: params.page,
      limit: params.limit,
      excludeUserId: params.userId,
      excludeUserTags: params.excludeUserTags,
      userIdForTags: params.userId,
    })
  },
}

