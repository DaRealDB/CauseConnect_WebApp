import prisma from '../config/database'

interface CreateNotificationParams {
  userId: string
  type: 'like' | 'comment' | 'follow' | 'donation' | 'award' | 'system' | 'support' | 'post_like' | 'post_comment' | 'post_participate' | 'comment_reply' | 'event_update'
  title: string
  message: string
  actionUrl?: string
  amount?: number
}

/**
 * Creates a notification for a user, respecting their notification preferences
 */
export async function createNotification(params: CreateNotificationParams): Promise<void> {
  const { userId, type, title, message, actionUrl, amount } = params

  // Get user settings to check notification preferences
  const settings = await prisma.userSettings.findUnique({
    where: { userId },
    select: {
      notificationsDonations: true,
      notificationsComments: true,
      notificationsAwards: true,
      notificationsMentions: true,
      notificationsNewCauses: true,
    },
  })

  // Check if user has disabled this type of notification
  if (settings) {
    if (type === 'donation' && !settings.notificationsDonations) {
      return // User has disabled donation notifications
    }
    if ((type === 'comment' || type === 'post_comment' || type === 'comment_reply') && !settings.notificationsComments) {
      return // User has disabled comment notifications
    }
    if (type === 'award' && !settings.notificationsAwards) {
      return // User has disabled award notifications
    }
    // For support, post_like, post_participate, event_update - use general new causes setting
    if ((type === 'support' || type === 'post_like' || type === 'post_participate' || type === 'event_update') && !settings.notificationsNewCauses) {
      return // User has disabled new causes notifications
    }
  }

  // Create the notification
  await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      actionUrl,
      amount,
    },
  })
}















