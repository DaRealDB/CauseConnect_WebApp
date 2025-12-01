import prisma from '../config/database'

export const notificationService = {
  async getNotifications(userId: string, params: {
    page?: number
    limit?: number
    type?: string
  }) {
    const page = params.page || 1
    const limit = params.limit || 20
    const skip = (page - 1) * limit

    const where: any = { userId }
    if (params.type && params.type !== 'all') {
      where.type = params.type
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
    ])

    return {
      data: notifications.map((notif) => ({
        id: notif.id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        timestamp: notif.createdAt.toISOString(),
        isRead: notif.isRead,
        actionUrl: notif.actionUrl,
        amount: notif.amount,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  },

  async markAsRead(notificationId: string, userId: string) {
    await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        isRead: true,
      },
    })
  },

  async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    })
  },

  async deleteNotification(notificationId: string, userId: string) {
    await prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId,
      },
    })
  },

  async getUnreadCount(userId: string) {
    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    })

    return { count }
  },
}

















