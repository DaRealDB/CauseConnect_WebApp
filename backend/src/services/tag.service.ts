import prisma from '../config/database'
import { createError } from '../middleware/errorHandler'

/**
 * Normalize tag name to canonical form:
 * - Trim whitespace
 * - Convert to lowercase
 * - Replace multiple spaces with single space
 */
export function normalizeTagName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}

/**
 * Tag Service - handles canonical tag creation and normalization
 */
export const tagService = {
  /**
   * Create or find a tag by name
   * - Normalizes the name (trim, lowercase)
   * - If tag exists (by canonical_name), returns existing tag
   * - Otherwise creates new tag with canonical_name
   * - Prevents duplicates through unique constraint on canonical_name
   */
  async createOrFindTag(name: string): Promise<{ id: string; name: string; canonicalName: string }> {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw createError('Tag name is required', 400)
    }

    const normalized = normalizeTagName(name)
    const displayName = name.trim() // Keep original formatting for display

    // Use transaction to prevent race conditions
    try {
      // Try to find existing tag by canonical name
      let tag = await prisma.tag.findUnique({
        where: { canonicalName: normalized },
      })

      if (!tag) {
        // Tag doesn't exist, create it
        // Use upsert to handle potential race condition
        tag = await prisma.tag.upsert({
          where: { canonicalName: normalized },
          update: {}, // If exists, don't update
          create: {
            name: displayName,
            canonicalName: normalized,
          },
        })
      } else {
        // Tag exists, but check if display name should be updated (if it's different and better formatted)
        // Only update if existing name is lowercase (legacy) and new one has proper formatting
        if (tag.name.toLowerCase() === tag.name && displayName !== tag.name && displayName !== normalized) {
          await prisma.tag.update({
            where: { id: tag.id },
            data: { name: displayName },
          })
          tag.name = displayName
        }
      }

      return {
        id: tag.id,
        name: tag.name,
        canonicalName: tag.canonicalName,
      }
    } catch (error: any) {
      // Handle unique constraint violation (race condition)
      if (error.code === 'P2002' && error.meta?.target?.includes('canonicalName')) {
        // Tag was created by another request, fetch it
        const tag = await prisma.tag.findUnique({
          where: { canonicalName: normalized },
        })
        if (tag) {
          return {
            id: tag.id,
            name: tag.name,
            canonicalName: tag.canonicalName,
          }
        }
      }
      throw createError(error.message || 'Failed to create or find tag', 500)
    }
  },

  /**
   * Get all tags (for autocomplete/search)
   */
  async getAllTags(limit: number = 100, search?: string): Promise<Array<{ id: string; name: string; canonicalName: string }>> {
    const where: any = {}
    if (search && search.trim()) {
      const searchNormalized = normalizeTagName(search)
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { canonicalName: { contains: searchNormalized, mode: 'insensitive' } },
      ]
    }

    const tags = await prisma.tag.findMany({
      where,
      take: limit,
      orderBy: { name: 'asc' },
    })

    return tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      canonicalName: tag.canonicalName,
    }))
  },

  /**
   * Get tag by ID
   */
  async getTagById(id: string): Promise<{ id: string; name: string; canonicalName: string } | null> {
    const tag = await prisma.tag.findUnique({
      where: { id },
    })

    if (!tag) return null

    return {
      id: tag.id,
      name: tag.name,
      canonicalName: tag.canonicalName,
    }
  },

  /**
   * Get tag by canonical name
   */
  async getTagByCanonicalName(canonicalName: string): Promise<{ id: string; name: string; canonicalName: string } | null> {
    const normalized = normalizeTagName(canonicalName)
    const tag = await prisma.tag.findUnique({
      where: { canonicalName: normalized },
    })

    if (!tag) return null

    return {
      id: tag.id,
      name: tag.name,
      canonicalName: tag.canonicalName,
    }
  },

  /**
   * Get tags by array of canonical names or IDs
   * Returns array of tag objects with IDs
   */
  async getTagsByNamesOrIds(namesOrIds: string[]): Promise<Array<{ id: string; name: string; canonicalName: string }>> {
    if (!namesOrIds || namesOrIds.length === 0) {
      return []
    }

    // Normalize names
    const normalizedNames = namesOrIds.map((item) => normalizeTagName(item))

    const tags = await prisma.tag.findMany({
      where: {
        OR: [
          { id: { in: namesOrIds } }, // Match by ID
          { canonicalName: { in: normalizedNames } }, // Match by normalized name
        ],
      },
    })

    return tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      canonicalName: tag.canonicalName,
    }))
  },

  /**
   * Link tags to event (create EventTag entries with tagId reference)
   */
  async linkTagsToEvent(eventId: string, tagNames: string[]): Promise<void> {
    if (!tagNames || tagNames.length === 0) {
      return
    }

    // Create or find all tags
    const tagPromises = tagNames.map((name) => this.createOrFindTag(name))
    const tags = await Promise.all(tagPromises)

    // Delete existing EventTag entries for this event
    await prisma.eventTag.deleteMany({
      where: { eventId },
    })

    // Create new EventTag entries with tagId references
    await prisma.eventTag.createMany({
      data: tags.map((tag) => ({
        eventId,
        name: tag.name, // Keep name for backward compatibility
        tagId: tag.id, // Reference canonical tag
      })),
      skipDuplicates: true,
    })
  },

  /**
   * Link tags to post (create PostTag entries with tagId reference)
   */
  async linkTagsToPost(postId: string, tagNames: string[]): Promise<void> {
    if (!tagNames || tagNames.length === 0) {
      return
    }

    // Create or find all tags
    const tagPromises = tagNames.map((name) => this.createOrFindTag(name))
    const tags = await Promise.all(tagPromises)

    // Delete existing PostTag entries for this post
    await prisma.postTag.deleteMany({
      where: { postId },
    })

    // Create new PostTag entries with tagId references
    await prisma.postTag.createMany({
      data: tags.map((tag) => ({
        postId,
        name: tag.name, // Keep name for backward compatibility
        tagId: tag.id, // Reference canonical tag
      })),
      skipDuplicates: true,
    })
  },
}








