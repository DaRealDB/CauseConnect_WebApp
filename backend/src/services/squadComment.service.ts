import prisma from '../config/database'
import { createError } from '../middleware/errorHandler'

export const squadCommentService = {
  async getSquadPostComments(postId: string, userId?: string, page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit

    const [comments, total] = await Promise.all([
      prisma.squadComment.findMany({
        where: {
          postId,
          parentId: null, // Only top-level comments
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
          replies: {
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
                  reactions: true,
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
          _count: {
            select: {
              reactions: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.squadComment.count({
        where: {
          postId,
          parentId: null,
        },
      }),
    ])

    // Get user's reactions for each comment and reply
    const commentsWithReactions = await Promise.all(
      comments.map(async (comment) => {
        const userReaction = userId
          ? await prisma.squadReaction.findFirst({
              where: {
                commentId: comment.id,
                userId,
              },
            })
          : null

        const repliesWithReactions = await Promise.all(
          comment.replies.map(async (reply) => {
            const replyUserReaction = userId
              ? await prisma.squadReaction.findFirst({
                  where: {
                    commentId: reply.id,
                    userId,
                  },
                })
              : null

            return {
              id: reply.id,
              content: reply.content,
              createdAt: reply.createdAt.toISOString(),
              updatedAt: reply.updatedAt.toISOString(),
              user: {
                id: reply.user.id,
                name: `${reply.user.firstName} ${reply.user.lastName}`.trim() || reply.user.username,
                username: reply.user.username,
                avatar: reply.user.avatar,
                verified: reply.user.verified,
              },
              reactionsCount: reply._count.reactions,
              userReaction: replyUserReaction
                ? {
                    type: replyUserReaction.type,
                    id: replyUserReaction.id,
                  }
                : null,
            }
          }),
        )

        return {
          id: comment.id,
          content: comment.content,
          createdAt: comment.createdAt.toISOString(),
          updatedAt: comment.updatedAt.toISOString(),
          user: {
            id: comment.user.id,
            name: `${comment.user.firstName} ${comment.user.lastName}`.trim() || comment.user.username,
            username: comment.user.username,
            avatar: comment.user.avatar,
            verified: comment.user.verified,
          },
          replies: repliesWithReactions,
          reactionsCount: comment._count.reactions,
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
      data: commentsWithReactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  },

  async createSquadComment(postId: string, userId: string, data: { content: string; parentId?: string }) {
    // Verify post exists and user is member
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

    if (!post.squad.members.length) {
      throw createError('You must be a member to comment', 403)
    }

    // If parentId is provided, verify it exists and belongs to the same post
    if (data.parentId) {
      const parent = await prisma.squadComment.findUnique({
        where: { id: data.parentId },
      })

      if (!parent || parent.postId !== postId) {
        throw createError('Invalid parent comment', 400)
      }
    }

    const comment = await prisma.squadComment.create({
      data: {
        content: data.content,
        postId,
        userId,
        parentId: data.parentId,
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
            reactions: true,
          },
        },
      },
    })

    return {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      user: {
        id: comment.user.id,
        name: `${comment.user.firstName} ${comment.user.lastName}`.trim() || comment.user.username,
        username: comment.user.username,
        avatar: comment.user.avatar,
        verified: comment.user.verified,
      },
      parentId: comment.parentId,
      replies: [],
      reactionsCount: comment._count.reactions,
      userReaction: null,
    }
  },

  async updateSquadComment(commentId: string, userId: string, data: { content: string }) {
    const comment = await prisma.squadComment.findUnique({
      where: { id: commentId },
    })

    if (!comment) {
      throw createError('Comment not found', 404)
    }

    if (comment.userId !== userId) {
      throw createError('You do not have permission to edit this comment', 403)
    }

    const updatedComment = await prisma.squadComment.update({
      where: { id: commentId },
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
            reactions: true,
          },
        },
      },
    })

    return {
      id: updatedComment.id,
      content: updatedComment.content,
      createdAt: updatedComment.createdAt.toISOString(),
      updatedAt: updatedComment.updatedAt.toISOString(),
      user: {
        id: updatedComment.user.id,
        name: `${updatedComment.user.firstName} ${updatedComment.user.lastName}`.trim() || updatedComment.user.username,
        username: updatedComment.user.username,
        avatar: updatedComment.user.avatar,
        verified: updatedComment.user.verified,
      },
      parentId: updatedComment.parentId,
      reactionsCount: updatedComment._count.reactions,
    }
  },

  async deleteSquadComment(commentId: string, userId: string) {
    const comment = await prisma.squadComment.findUnique({
      where: { id: commentId },
      include: {
        post: {
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
        },
      },
    })

    if (!comment) {
      throw createError('Comment not found', 404)
    }

    // Check if user is the author or an admin
    const isAuthor = comment.userId === userId
    const isAdmin = comment.post.squad.members.some((m) => m.userId === userId && m.role === 'admin')

    if (!isAuthor && !isAdmin) {
      throw createError('You do not have permission to delete this comment', 403)
    }

    await prisma.squadComment.delete({
      where: { id: commentId },
    })
  },
}









