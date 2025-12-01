"use client"

import { Badge } from "@/components/ui/badge"
import { useChatNotifications } from "@/hooks/useChatNotifications"

interface ChatBadgeProps {
  className?: string
}

/**
 * Chat badge component that displays unread message count
 */
export function ChatBadge({ className }: ChatBadgeProps) {
  const { totalUnread } = useChatNotifications(true)

  if (totalUnread === 0) {
    return null
  }

  return (
    <Badge
      className={`absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs bg-primary ${className || ''}`}
    >
      {totalUnread > 99 ? '99+' : totalUnread}
    </Badge>
  )
}





