import prisma from '../config/database'
import { createError } from '../middleware/errorHandler'
import { createNotification } from '../utils/notifications'
import { normalizeTagName } from './tag.service'

export const postService = {
  async getPosts(params: {
    page?: number
    limit?: number
    userId?: string
    tags?: string[]
    requireUserTags?: boolean
    filterUserId?: string // User ID to get tags from for filtering
    excludeUserTags?: boolean // For explore: exclude user's tags
    excludeMutedForUserId?: string // Exclude posts muted by this user
  }) {
    const page = params.page || 1
    const limit = params.limit || 10
    const skip = (page - 1) * limit

    const where: any = {}
    if (params.userId) where.userId = params.userId

    // CRITICAL: Tag filtering is STRICT and takes PRIORITY
    // Priority order: Manual tags > Exclude tags > Require tags
    
    let tagFilter: any = null
    let forceEmptyResult = false
    
    // Priority 1: Manual tag filtering (user selected tags in feed)
    if (params.tags && params.tags.length > 0) {
      // Normalize all tag names for case-insensitive comparison
      const normalizedTags = params.tags.map(tag => normalizeTagName(tag))
      
      // STRICT: Show ONLY posts with at least one tag matching selected tags (case-insensitive)
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
      console.log(`[PostService] Applying manual tag filter (case-insensitive):`, normalizedTags)
    }
    // Priority 2: Exclude user tags (for explore page)
    else if (params.excludeUserTags && params.filterUserId) {
      const userSettings = await prisma.userSettings.findUnique({
        where: { userId: params.filterUserId },
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
        console.log(`[PostService] Applying excludeUserTags filter (case-insensitive):`, normalizedUserTags)
      }
    }
    // Priority 3: Require user tags (saved interest tags)
    else if (params.requireUserTags && params.filterUserId) {
      const userSettings = await prisma.userSettings.findUnique({
        where: { userId: params.filterUserId },
        select: { interestTags: true },
      })
      
      if (userSettings?.interestTags && userSettings.interestTags.length > 0) {
        // Normalize user interest tags for case-insensitive matching
        const normalizedUserTags = userSettings.interestTags.map(tag => normalizeTagName(tag))
        
        // STRICT: Show ONLY posts with at least one tag matching user's interests (case-insensitive)
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
        console.log(`[PostService] Applying requireUserTags filter (case-insensitive):`, normalizedUserTags)
      } else {
        // User has no tags selected - show EMPTY feed (strict filtering)
        forceEmptyResult = true
        console.log(`[PostService] No user tags found - forcing empty result (strict filtering)`)
      }
    }
    
    // Apply tag filter if it was set
    if (tagFilter) {
      where.tags = tagFilter
      console.log(`[PostService] Tag filter applied to where clause`)
    }

    // Force empty result if needed (strict filtering with no tags)
    if (forceEmptyResult) {
      where.id = { in: [] } // Force empty result
      console.log(`[PostService] Force empty result applied (no tags)`)
    }

    // Exclude posts the user has muted (server-side), if requested and not already forced empty
    if (!forceEmptyResult && params.excludeMutedForUserId) {
      const muted = await prisma.mutedPost.findMany({
        where: { userId: params.excludeMutedForUserId },
        select: { postId: true },
      })

      if (muted.length > 0) {
        const mutedIds = muted.map((m: { postId: string }) => m.postId)
        where.id = {
          ...(where.id || {}),
          notIn: mutedIds,
        }
        console.log(`[PostService] Excluding muted posts for user`, params.excludeMutedForUserId)
      }
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip,
        take: limit,
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
          tags: true, // Include post tags
          _count: {
            select: {
              likes: true,
              comments: true,
              participants: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.post.count({ where }),
    ])

    return {
      data: posts.map((post) => ({
        id: parseInt(post.id) || post.id,
        user: {
          id: post.user.id,
          name: `${post.user.firstName} ${post.user.lastName}`,
          username: post.user.username,
          avatar: post.user.avatar,
          verified: post.user.verified,
          following: false, // Will be set by controller
        },
        content: post.content,
        image: post.image,
        tags: (post.tags || []).map((tag) => tag.name), // Include tags in response, handle empty array
        timestamp: post.createdAt.toISOString(),
        likes: post._count.likes,
        comments: post._count.comments,
        participants: post._count.participants,
        shares: 0,
        liked: false, // Will be set by controller
        bookmarked: false, // Will be set by controller
        isParticipating: false, // Will be set by controller
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  },

  async createPost(userId: string, data: any, file?: Express.Multer.File) {
    const { content, tags } = data
    const image = file ? `/uploads/${file.filename}` : undefined
    const tagArray = Array.isArray(tags) ? tags : (tags ? [tags] : [])

    const post = await prisma.post.create({
      data: {
        content,
        image,
        userId,
        tags: {
          create: tagArray.map((tagName: string) => ({
            name: tagName,
          })),
        },
      },
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
        tags: true,
      },
    })

    return {
      post: {
        id: parseInt(post.id) || post.id,
        user: {
          id: post.user.id,
          name: `${post.user.firstName} ${post.user.lastName}`,
          username: post.user.username,
          avatar: post.user.avatar,
          verified: post.user.verified,
        },
        content: post.content,
        image: post.image,
        tags: (post.tags || []).map((tag) => tag.name), // Handle empty tags array
        timestamp: post.createdAt.toISOString(),
        likes: 0,
        comments: 0,
        shares: 0,
        liked: false,
        bookmarked: false,
      },
    }
  },

  async likePost(postId: string, userId: string) {
    const existing = await prisma.like.findFirst({
      where: {
        userId,
        postId,
      },
    })

    if (existing) {
      // Unlike - remove notification is not needed
      await prisma.like.delete({
        where: { id: existing.id },
      })
    } else {
      // Like - create notification
      await prisma.like.create({
        data: {
          userId,
          postId,
        },
      })

      // Get post and liker info for notification
      const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { userId: true },
      })

      const liker = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          firstName: true,
          lastName: true,
          username: true,
        },
      })

      // Notify post author (if not liking own post)
      if (post && post.userId !== userId && liker) {
        const likerName = `${liker.firstName} ${liker.lastName}`.trim() || liker.username
        await createNotification({
          userId: post.userId,
          type: 'post_like',
          title: 'Post Liked',
          message: `${likerName} liked your post`,
          actionUrl: `/feed`,
        })
      }
    }
  },

  async bookmarkPost(postId: string, userId: string) {
    const existing = await prisma.bookmark.findFirst({
      where: {
        userId,
        postId,
        eventId: null,
        commentId: null,
      },
    })

    if (existing) {
      await prisma.bookmark.delete({
        where: { id: existing.id },
      })
    } else {
      await prisma.bookmark.create({
        data: {
          userId,
          postId,
        },
      })
    }
  },

  async getBookmarkedPosts(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit

    const [bookmarks, total] = await Promise.all([
      prisma.bookmark.findMany({
        where: {
          userId,
          postId: { not: null },
          eventId: null,
          commentId: null,
        },
        include: {
          post: {
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
              tags: true, // Include post tags
              _count: {
                select: {
                  likes: true,
                  comments: true,
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
          postId: { not: null },
          eventId: null,
          commentId: null,
        },
      }),
    ])

    const posts = bookmarks
      .map((bookmark) => bookmark.post)
      .filter((post) => post !== null)
      .map((post) => ({
        id: parseInt(post!.id) || post!.id,
        user: {
          id: post!.user.id,
          name: `${post!.user.firstName} ${post!.user.lastName}`,
          username: post!.user.username,
          avatar: post!.user.avatar,
          verified: post!.user.verified,
          following: false,
        },
        content: post!.content,
        image: post!.image,
        tags: (post!.tags || []).map((tag) => tag.name), // Include tags, handle empty array
        timestamp: post!.createdAt.toISOString(),
        likes: post!._count.likes,
        comments: post!._count.comments,
        shares: 0,
        liked: false,
        bookmarked: true,
      }))

    return {
      data: posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  },

  async mutePost(postId: string, userId: string) {
    const existing = await prisma.mutedPost.findFirst({
      where: {
        userId,
        postId,
      },
    })

    if (!existing) {
      await prisma.mutedPost.create({
        data: {
          userId,
          postId,
        },
      })
    }
  },

  async unmutePost(postId: string, userId: string) {
    const existing = await prisma.mutedPost.findFirst({
      where: {
        userId,
        postId,
      },
    })

    if (existing) {
      await prisma.mutedPost.delete({
        where: { id: existing.id },
      })
    }
  },

  async getMutedPosts(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit

    const [mutedPosts, total] = await Promise.all([
      prisma.mutedPost.findMany({
        where: { userId },
        include: {
          post: {
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
              tags: true,
              _count: {
                select: {
                  likes: true,
                  comments: true,
                  participants: true,
                },
              },
            },
          },
        },
        orderBy: { mutedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.mutedPost.count({ where: { userId } }),
    ])

    const posts = mutedPosts
      .map((mp) => mp.post)
      .filter((post) => post !== null)
      .map((post) => ({
        id: parseInt(post!.id) || post!.id,
        user: {
          id: post!.user.id,
          name: `${post!.user.firstName} ${post!.user.lastName}`,
          username: post!.user.username,
          avatar: post!.user.avatar,
          verified: post!.user.verified,
          following: false,
        },
        content: post!.content,
        image: post!.image,
        tags: (post!.tags || []).map((tag) => tag.name),
        timestamp: post!.createdAt.toISOString(),
        likes: post!._count.likes,
        comments: post!._count.comments,
        participants: post!._count.participants,
        shares: 0,
        liked: false,
        bookmarked: false,
        isParticipating: false,
      }))

    return {
      data: posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  },

  async participateInPost(postId: string, userId: string) {
    // Check if user is the post creator
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { userId: true },
    })

    if (!post) {
      throw new Error('Post not found')
    }

    if (post.userId === userId) {
      throw new Error('Post creator cannot participate in their own post')
    }

    // Check if already participating
    const existing = await prisma.postParticipant.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    })

    if (existing) {
      // Remove participation
      await prisma.postParticipant.delete({
        where: { id: existing.id },
      })
      return { isParticipating: false }
    } else {
      // Add participation
      await prisma.postParticipant.create({
        data: {
          userId,
          postId,
        },
      })

      // Get participant info for notification
      const participant = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          firstName: true,
          lastName: true,
          username: true,
        },
      })

      // Notify post author
      if (post && participant) {
        const participantName = `${participant.firstName} ${participant.lastName}`.trim() || participant.username
        await createNotification({
          userId: post.userId,
          type: 'post_participate',
          title: 'New Participant',
          message: `${participantName} is participating in your post`,
          actionUrl: `/feed`,
        })
      }

      return { isParticipating: true }
    }
  },

  async getPostParticipants(postId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit

    const [participants, total] = await Promise.all([
      prisma.postParticipant.findMany({
        where: { postId },
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
      prisma.postParticipant.count({
        where: { postId },
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

  async deletePost(postId: string, userId: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { userId: true },
    })

    if (!post) {
      throw createError('Post not found', 404)
    }

    if (post.userId !== userId) {
      throw createError('Unauthorized: Only post owner can delete', 403)
    }

    await prisma.post.delete({
      where: { id: postId },
    })
  },
}
