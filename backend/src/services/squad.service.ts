import prisma from '../config/database'
import { createError } from '../middleware/errorHandler'

export const squadService = {
  async getSquads(userId?: string) {
    const where: any = {}
    if (userId) {
      where.members = {
        some: {
          userId,
        },
      }
    }

    const squads = await prisma.squad.findMany({
      where,
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
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const squadsWithRoles = await Promise.all(
      squads.map(async (squad) => {
        const role = userId
          ? (await prisma.squadMember.findFirst({
              where: {
                userId,
                squadId: squad.id,
              },
              select: { role: true },
            }))?.role || 'member'
          : undefined

        return {
          id: squad.id,
          name: squad.name,
          description: squad.description,
          avatar: squad.avatar,
          members: squad._count.members,
          role,
        }
      }),
    )

    return squadsWithRoles
  },

  async searchSquads(query: string, limit: number = 10) {
    const squads = await prisma.squad.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
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
          },
        },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    })

    return squads.map((squad) => ({
      id: squad.id,
      name: squad.name,
      description: squad.description,
      avatar: squad.avatar,
      members: squad._count.members,
      creator: {
        id: squad.creator.id,
        name: `${squad.creator.firstName} ${squad.creator.lastName}`.trim() || squad.creator.username,
        username: squad.creator.username,
        avatar: squad.creator.avatar,
      },
    }))
  },

  async createSquad(userId: string, data: any, file?: Express.Multer.File) {
    const { name, description } = data
    const avatar = file ? `/uploads/${file.filename}` : undefined

    const squad = await prisma.squad.create({
      data: {
        name,
        description,
        avatar,
        creatorId: userId,
        members: {
          create: {
            userId,
            role: 'admin',
          },
        },
      },
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
      },
    })

    return {
      id: squad.id,
      name: squad.name,
      description: squad.description,
      avatar: squad.avatar,
      members: 1,
      role: 'admin',
    }
  },

  async joinSquad(squadId: string, userId: string) {
    const existing = await prisma.squadMember.findFirst({
      where: {
        userId,
        squadId,
      },
    })

    if (existing) {
      throw createError('Already a member of this squad', 400)
    }

    await prisma.squadMember.create({
      data: {
        userId,
        squadId,
        role: 'member',
      },
    })
  },

  async leaveSquad(squadId: string, userId: string) {
    await prisma.squadMember.deleteMany({
      where: {
        userId,
        squadId,
      },
    })
  },

  async getSquadById(squadId: string, userId?: string) {
    const squad = await prisma.squad.findUnique({
      where: { id: squadId },
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
    })

    if (!squad) {
      throw createError('Squad not found', 404)
    }

    const role = userId
      ? (await prisma.squadMember.findFirst({
          where: {
            userId,
            squadId: squad.id,
          },
          select: { role: true },
        }))?.role || undefined
      : undefined

    return {
      id: squad.id,
      name: squad.name,
      description: squad.description,
      avatar: squad.avatar,
      createdAt: squad.createdAt,
      creator: {
        id: squad.creator.id,
        name: `${squad.creator.firstName} ${squad.creator.lastName}`.trim() || squad.creator.username,
        username: squad.creator.username,
        avatar: squad.creator.avatar,
      },
      members: squad._count.members,
      posts: squad._count.posts,
      role,
      isMember: !!role,
    }
  },

  async getSquadMembers(squadId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit

    const [members, total] = await Promise.all([
      prisma.squadMember.findMany({
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
        },
        orderBy: [
          { role: 'asc' }, // admin first, then moderator, then member
          { joinedAt: 'asc' },
        ],
        skip,
        take: limit,
      }),
      prisma.squadMember.count({ where: { squadId } }),
    ])

    return {
      data: members.map((member) => ({
        id: member.user.id,
        name: `${member.user.firstName} ${member.user.lastName}`.trim() || member.user.username,
        username: member.user.username,
        avatar: member.user.avatar,
        verified: member.user.verified,
        role: member.role,
        joinedAt: member.joinedAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  },
}

