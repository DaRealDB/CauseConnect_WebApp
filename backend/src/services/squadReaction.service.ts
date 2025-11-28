import prisma from '../config/database'
import { createError } from '../middleware/errorHandler'

export const squadReactionService = {
  async toggleReaction(
    userId: string,
    data: {
      postId?: string
      commentId?: string
      type: string
    },
  ) {
    if (!data.postId && !data.commentId) {
      throw createError('Either postId or commentId must be provided', 400)
    }

    if (data.postId && data.commentId) {
      throw createError('Cannot react to both post and comment', 400)
    }

    // Verify user has access (is member of squad)
    if (data.postId) {
      const post = await prisma.squadPost.findUnique({
        where: { id: data.postId },
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
        throw createError('You must be a member to react', 403)
      }
    }

    if (data.commentId) {
      const comment = await prisma.squadComment.findUnique({
        where: { id: data.commentId },
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

      if (!comment.post.squad.members.length) {
        throw createError('You must be a member to react', 403)
      }
    }

    // Check if reaction already exists
    const existing = await prisma.squadReaction.findFirst({
      where: {
        userId,
        postId: data.postId || null,
        commentId: data.commentId || null,
      },
    })

    if (existing) {
      // If same type, remove reaction (toggle off)
      if (existing.type === data.type) {
        await prisma.squadReaction.delete({
          where: { id: existing.id },
        })
        return { reaction: null, action: 'removed' }
      } else {
        // Update reaction type
        const updated = await prisma.squadReaction.update({
          where: { id: existing.id },
          data: { type: data.type },
        })
        return { reaction: updated, action: 'updated' }
      }
    } else {
      // Create new reaction
      const reaction = await prisma.squadReaction.create({
        data: {
          userId,
          postId: data.postId || null,
          commentId: data.commentId || null,
          type: data.type,
        },
      })
      return { reaction, action: 'created' }
    }
  },
}










