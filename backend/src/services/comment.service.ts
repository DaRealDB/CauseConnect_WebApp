import prisma from '../config/database'
import { createError } from '../middleware/errorHandler'
import { createNotification } from '../utils/notifications'

export const commentService = {
  async getComments(targetId: string, userId?: string, type: 'event' | 'post' = 'event') {
    const where: any = {
      parentId: null, // Only top-level comments
    }

    if (type === 'event') {
      where.eventId = targetId
    } else {
      where.postId = targetId
    }

    const comments = await prisma.comment.findMany({
      where,
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
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: {
            likes: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Transform comments
    const transformedComments = await Promise.all(
      comments.map(async (comment) => {
        let liked = false
        let disliked = false
        let saved = false
        let awarded = false

        if (userId) {
          const [like, bookmark, award] = await Promise.all([
            prisma.like.findFirst({
              where: {
                userId,
                commentId: comment.id,
              },
            }),
            prisma.bookmark.findFirst({
              where: {
                userId,
                commentId: comment.id,
              },
            }),
            prisma.award.findFirst({
              where: {
                userId,
                commentId: comment.id,
              },
            }),
          ])

          liked = !!like
          saved = !!bookmark
          awarded = !!award
        }

        return {
          id: parseInt(comment.id) || comment.id,
          user: {
            id: comment.user.id,
            name: `${comment.user.firstName} ${comment.user.lastName}`,
            username: comment.user.username,
            avatar: comment.user.avatar,
            verified: comment.user.verified,
          },
          content: comment.content,
          timestamp: comment.createdAt.toISOString(),
          likes: comment._count.likes,
          dislikes: 0, // Not implemented in schema yet
          liked,
          disliked,
          saved,
          awarded,
          replies: comment.replies.map((reply) => ({
            id: parseInt(reply.id) || reply.id,
            user: {
              id: reply.user.id,
              name: `${reply.user.firstName} ${reply.user.lastName}`,
              username: reply.user.username,
              avatar: reply.user.avatar,
              verified: reply.user.verified,
            },
            content: reply.content,
            timestamp: reply.createdAt.toISOString(),
            likes: 0,
            dislikes: 0,
            liked: false,
            disliked: false,
            saved: false,
            awarded: false,
            replies: [],
          })),
        }
      }),
    )

    return transformedComments
  },

  async createComment(targetId: string, userId: string, data: any, type: 'event' | 'post' = 'event') {
    const { content, parentId } = data

    const comment = await prisma.comment.create({
      data: {
        content,
        eventId: type === 'event' ? targetId : null,
        postId: type === 'post' ? targetId : null,
        userId,
        parentId: parentId || null,
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
      },
    })

    // Get commenter info
    const commenter = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        firstName: true,
        lastName: true,
        username: true,
      },
    })

    if (type === 'event') {
      // Create notification for event organizer
      const event = await prisma.event.findUnique({
        where: { id: targetId },
        include: {
          organization: {
            select: {
              id: true,
            },
          },
        },
      })

      if (event && event.organizationId !== userId && commenter) {
        const commenterName = `${commenter.firstName} ${commenter.lastName}`.trim() || commenter.username
        await createNotification({
          userId: event.organizationId,
          type: 'comment',
          title: 'New Comment on Your Event',
          message: `${commenterName} commented on your event "${event.title}"`,
          actionUrl: `/event/${targetId}`,
        })
      }
    } else {
      // Create notification for post author
      const post = await prisma.post.findUnique({
        where: { id: targetId },
        select: { userId: true, content: true },
      })

      if (post && post.userId !== userId && commenter) {
        const commenterName = `${commenter.firstName} ${commenter.lastName}`.trim() || commenter.username
        await createNotification({
          userId: post.userId,
          type: 'post_comment',
          title: 'New Comment on Your Post',
          message: `${commenterName} commented on your post`,
          actionUrl: `/feed`,
        })
      }
    }

    // If this is a reply to another comment, notify the parent comment author
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { userId: true },
      })

      if (parentComment && parentComment.userId !== userId && commenter) {
        const commenterName = `${commenter.firstName} ${commenter.lastName}`.trim() || commenter.username
        await createNotification({
          userId: parentComment.userId,
          type: 'comment_reply',
          title: 'Reply to Your Comment',
          message: `${commenterName} replied to your comment`,
          actionUrl: type === 'event' ? `/event/${targetId}` : `/feed`,
        })
      }
    }

    return {
      comment: {
        id: parseInt(comment.id) || comment.id,
        user: {
          id: comment.user.id,
          name: `${comment.user.firstName} ${comment.user.lastName}`,
          username: comment.user.username,
          avatar: comment.user.avatar,
          verified: comment.user.verified,
        },
        content: comment.content,
        timestamp: comment.createdAt.toISOString(),
        likes: 0,
        dislikes: 0,
        liked: false,
        disliked: false,
        saved: false,
        awarded: false,
        replies: [],
      },
    }
  },

  async likeComment(commentId: string, userId: string) {
    const existing = await prisma.like.findFirst({
      where: {
        userId,
        commentId,
      },
    })

    if (existing) {
      await prisma.like.delete({
        where: { id: existing.id },
      })
    } else {
      await prisma.like.create({
        data: {
          userId,
          commentId,
        },
      })
    }
  },

  async dislikeComment(commentId: string, userId: string) {
    // For now, dislike is same as unlike
    await this.likeComment(commentId, userId)
  },

  async awardComment(commentId: string, userId: string) {
    const existing = await prisma.award.findFirst({
      where: {
        userId,
        commentId,
      },
    })

    if (existing) {
      throw createError('Comment already awarded', 400)
    }

    await prisma.award.create({
      data: {
        userId,
        commentId,
      },
    })

    // Get awarder info
    const awarder = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        firstName: true,
        lastName: true,
        username: true,
      },
    })

    // Create notification
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { userId: true },
    })

    if (comment && comment.userId !== userId && awarder) {
      const awarderName = `${awarder.firstName} ${awarder.lastName}`.trim() || awarder.username
      await createNotification({
        userId: comment.userId,
        type: 'award',
        title: 'Comment Awarded',
        message: `${awarderName} awarded your comment`,
        actionUrl: `/event/${commentId}`,
      })
    }
  },

  async saveComment(commentId: string, userId: string) {
    const existing = await prisma.bookmark.findFirst({
      where: {
        userId,
        commentId,
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
          commentId,
        },
      })
    }
  },
}



