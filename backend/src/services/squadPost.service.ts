import prisma from '../config/database'
import { createError } from '../middleware/errorHandler'

export const squadPostService = {
  async getSquadPosts(squadId: string, userId?: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit

    // Check if user is member
    if (userId) {
      const isMember = await prisma.squadMember.findFirst({
        where: {
          squadId,
          userId,
        },
      })

      if (!isMember) {
        throw createError('You must be a member to view posts', 403)
      }
    }

    const [posts, total] = await Promise.all([
      prisma.squadPost.findMany({
        where: { squadId },
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
          _count: {
            select: {
              comments: true,
              reactions: true,
            },
          },
        },
        orderBy: [
          { isPinned: 'desc' }, // Pinned posts first
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      prisma.squadPost.count({ where: { squadId } }),
    ])

    // Get user's reactions for each post
    const postsWithReactions = await Promise.all(
      posts.map(async (post) => {
        const userReaction = userId
          ? await prisma.squadReaction.findFirst({
              where: {
                postId: post.id,
                userId,
              },
            })
          : null

        return {
          id: post.id,
          content: post.content,
          image: post.image,
          isPinned: post.isPinned,
          createdAt: post.createdAt.toISOString(),
          updatedAt: post.updatedAt.toISOString(),
          user: {
            id: post.user.id,
            name: `${post.user.firstName} ${post.user.lastName}`.trim() || post.user.username,
            username: post.user.username,
            avatar: post.user.avatar,
            verified: post.user.verified,
          },
          commentsCount: post._count.comments,
          reactionsCount: post._count.reactions,
          userReaction: userReaction
            ? {
                type: userReaction.type,
                id: userReaction.id,
              }
            : null,
        }
      }),
    )

    return {
      data: postsWithReactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  },

  async createSquadPost(squadId: string, userId: string, data: { content: string; image?: string }) {
    // Check if user is member
    const isMember = await prisma.squadMember.findFirst({
      where: {
        squadId,
        userId,
      },
    })

    if (!isMember) {
      throw createError('You must be a member to create posts', 403)
    }

    const post = await prisma.squadPost.create({
      data: {
        content: data.content,
        image: data.image,
        squadId,
        userId,
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
        _count: {
          select: {
            comments: true,
            reactions: true,
          },
        },
      },
    })

    return {
      id: post.id,
      content: post.content,
      image: post.image,
      isPinned: post.isPinned,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      user: {
        id: post.user.id,
        name: `${post.user.firstName} ${post.user.lastName}`.trim() || post.user.username,
        username: post.user.username,
        avatar: post.user.avatar,
        verified: post.user.verified,
      },
      commentsCount: post._count.comments,
      reactionsCount: post._count.reactions,
      userReaction: null,
    }
  },

  async updateSquadPost(postId: string, userId: string, data: { content?: string }) {
    const post = await prisma.squadPost.findUnique({
      where: { id: postId },
      include: {
        squad: {
          include: {
            members: {
              where: {
                userId,
              },
            },
          },
        },
      },
    })

    if (!post) {
      throw createError('Post not found', 404)
    }

    // Check if user is the author or an admin
    const isAuthor = post.userId === userId
    const isAdmin = post.squad.members.some((m) => m.userId === userId && m.role === 'admin')

    if (!isAuthor && !isAdmin) {
      throw createError('You do not have permission to edit this post', 403)
    }

    const updatedPost = await prisma.squadPost.update({
      where: { id: postId },
      data: {
        content: data.content,
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
        _count: {
          select: {
            comments: true,
            reactions: true,
          },
        },
      },
    })

    return {
      id: updatedPost.id,
      content: updatedPost.content,
      image: updatedPost.image,
      isPinned: updatedPost.isPinned,
      createdAt: updatedPost.createdAt.toISOString(),
      updatedAt: updatedPost.updatedAt.toISOString(),
      user: {
        id: updatedPost.user.id,
        name: `${updatedPost.user.firstName} ${updatedPost.user.lastName}`.trim() || updatedPost.user.username,
        username: updatedPost.user.username,
        avatar: updatedPost.user.avatar,
        verified: updatedPost.user.verified,
      },
      commentsCount: updatedPost._count.comments,
      reactionsCount: updatedPost._count.reactions,
    }
  },

  async deleteSquadPost(postId: string, userId: string) {
    const post = await prisma.squadPost.findUnique({
      where: { id: postId },
      include: {
        squad: {
          include: {
            members: {
              where: {
                userId,
              },
            },
          },
        },
      },
    })

    if (!post) {
      throw createError('Post not found', 404)
    }

    // Check if user is the author or an admin
    const isAuthor = post.userId === userId
    const isAdmin = post.squad.members.some((m) => m.userId === userId && m.role === 'admin')

    if (!isAuthor && !isAdmin) {
      throw createError('You do not have permission to delete this post', 403)
    }

    await prisma.squadPost.delete({
      where: { id: postId },
    })
  },

  async pinSquadPost(postId: string, userId: string, isPinned: boolean) {
    const post = await prisma.squadPost.findUnique({
      where: { id: postId },
      include: {
        squad: {
          include: {
            members: {
              where: {
                userId,
              },
            },
          },
        },
      },
    })

    if (!post) {
      throw createError('Post not found', 404)
    }

    // Only admins can pin/unpin posts
    const isAdmin = post.squad.members.some((m) => m.userId === userId && m.role === 'admin')

    if (!isAdmin) {
      throw createError('Only admins can pin posts', 403)
    }

    await prisma.squadPost.update({
      where: { id: postId },
      data: { isPinned },
    })
  },
}






