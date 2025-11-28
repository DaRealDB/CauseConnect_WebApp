"use client"

import { Badge } from "@/components/ui/badge"
import { Bell, BellOff } from "lucide-react"

interface NotificationBadgeProps {
  count: number
  muted?: boolean
}

export function NotificationBadge({ count, muted = false }: NotificationBadgeProps) {
  if (count === 0) {
    return muted ? (
      <BellOff className="h-5 w-5 text-muted-foreground" />
    ) : (
      <Bell className="h-5 w-5 text-muted-foreground" />
    )
  }

  return (
    <div className="relative">
      <Bell className="h-5 w-5 text-muted-foreground" />
      <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-primary">
        {count > 99 ? '99+' : count}
      </Badge>
    </div>
  )
}


