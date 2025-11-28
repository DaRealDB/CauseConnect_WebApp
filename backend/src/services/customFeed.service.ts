import prisma from '../config/database'
import { createError } from '../middleware/errorHandler'

export const customFeedService = {
  async createFeed(userId: string, data: { name: string; tags: string[] }) {
    const feed = await prisma.customFeed.create({
      data: {
        name: data.name,
        tags: data.tags,
        userId,
      },
    })

    return {
      id: feed.id,
      name: feed.name,
      tags: feed.tags,
      createdAt: feed.createdAt.toISOString(),
      updatedAt: feed.updatedAt.toISOString(),
    }
  },

  async getFeeds(userId: string) {
    const feeds = await prisma.customFeed.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return feeds.map((feed) => ({
      id: feed.id,
      name: feed.name,
      tags: feed.tags,
      createdAt: feed.createdAt.toISOString(),
      updatedAt: feed.updatedAt.toISOString(),
    }))
  },

  async getFeedById(userId: string, feedId: string) {
    const feed = await prisma.customFeed.findFirst({
      where: {
        id: feedId,
        userId,
      },
    })

    if (!feed) {
      throw createError('Custom feed not found', 404)
    }

    return {
      id: feed.id,
      name: feed.name,
      tags: feed.tags,
      createdAt: feed.createdAt.toISOString(),
      updatedAt: feed.updatedAt.toISOString(),
    }
  },

  async updateFeed(userId: string, feedId: string, data: { name?: string; tags?: string[] }) {
    const feed = await prisma.customFeed.findFirst({
      where: {
        id: feedId,
        userId,
      },
    })

    if (!feed) {
      throw createError('Custom feed not found', 404)
    }

    const updated = await prisma.customFeed.update({
      where: { id: feedId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.tags && { tags: data.tags }),
      },
    })

    return {
      id: updated.id,
      name: updated.name,
      tags: updated.tags,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    }
  },

  async deleteFeed(userId: string, feedId: string) {
    const feed = await prisma.customFeed.findFirst({
      where: {
        id: feedId,
        userId,
      },
    })

    if (!feed) {
      throw createError('Custom feed not found', 404)
    }

    await prisma.customFeed.delete({
      where: { id: feedId },
    })

    return { success: true }
  },
}











