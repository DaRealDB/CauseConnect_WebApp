"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Heart, MessageCircle, UserPlus, DollarSign, Award, Bell, Check, X, Settings } from "lucide-react"
import Link from "next/link"

interface Notification {
  id: string
  type: "like" | "comment" | "follow" | "donation" | "award" | "system"
  title: string
  message: string
  timestamp: Date
  isRead: boolean
  avatar?: string
  actionUrl?: string
  amount?: number
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      type: "donation",
      title: "New Donation Received",
      message: "Sarah Johnson donated $50 to your Clean Water Initiative",
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      isRead: false,
      avatar: "/placeholder.svg?key=sarah",
      actionUrl: "/event/clean-water-kenya",
      amount: 50,
    },
    {
      id: "2",
      type: "comment",
      title: "New Comment",
      message: "Michael Chen commented on your Education for All post",
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      isRead: false,
      avatar: "/placeholder.svg?key=michael",
      actionUrl: "/event/education-for-all",
    },
    {
      id: "3",
      type: "follow",
      title: "New Follower",
      message: "Emma Wilson started following you",
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      isRead: false,
      avatar: "/placeholder.svg?key=emma",
      actionUrl: "/profile/emma-wilson",
    },
    {
      id: "4",
      type: "like",
      title: "Post Liked",
      message: "Alex Rodriguez and 12 others liked your post",
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
      isRead: true,
      avatar: "/placeholder.svg?key=alex",
      actionUrl: "/post/community-garden",
    },
    {
      id: "5",
      type: "award",
      title: "Achievement Unlocked",
      message: 'You earned the "Community Builder" badge for organizing 5 events',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      isRead: true,
      actionUrl: "/profile/achievements",
    },
    {
      id: "6",
      type: "system",
      title: "Event Milestone",
      message: "Your Clean Water Initiative reached 75% of its funding goal!",
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      isRead: true,
      actionUrl: "/event/clean-water-kenya",
    },
  ])

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((notif) => (notif.id === id ? { ...notif, isRead: true } : notif)))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, isRead: true })))
  }

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id))
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="h-4 w-4 text-red-500" />
      case "comment":
        return <MessageCircle className="h-4 w-4 text-blue-500" />
      case "follow":
        return <UserPlus className="h-4 w-4 text-green-500" />
      case "donation":
        return <DollarSign className="h-4 w-4 text-yellow-500" />
      case "award":
        return <Award className="h-4 w-4 text-purple-500" />
      case "system":
        return <Bell className="h-4 w-4 text-orange-500" />
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    if (diff < 60 * 1000) return "Just now"
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}m ago`
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}h ago`
    return date.toLocaleDateString()
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-orange-50/30 to-peach-50/30">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Notifications</h1>
            <p className="text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread notifications` : "All caught up!"}
            </p>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" onClick={markAllAsRead}>
                <Check className="h-4 w-4 mr-2" />
                Mark all read
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link href="/settings/notifications">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Link>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="donations">Donations</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`transition-all hover:shadow-md ${
                  !notification.isRead ? "border-primary/20 bg-primary/5" : ""
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {notification.avatar ? (
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={notification.avatar || "/placeholder.svg"} />
                          <AvatarFallback>{notification.title[0]}</AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                          {getNotificationIcon(notification.type)}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-medium text-foreground mb-1">
                            {notification.title}
                            {notification.amount && (
                              <Badge variant="secondary" className="ml-2">
                                ${notification.amount}
                              </Badge>
                            )}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                          <div className="flex items-center gap-4">
                            <span className="text-xs text-muted-foreground">{formatTime(notification.timestamp)}</span>
                            {notification.actionUrl && (
                              <Button variant="link" size="sm" className="p-0 h-auto" asChild>
                                <Link href={notification.actionUrl}>View</Link>
                              </Button>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {!notification.isRead && (
                            <Button variant="ghost" size="sm" onClick={() => markAsRead(notification.id)}>
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => deleteNotification(notification.id)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="donations" className="space-y-4">
            {notifications
              .filter((n) => n.type === "donation")
              .map((notification) => (
                <Card key={notification.id} className="transition-all hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={notification.avatar || "/placeholder.svg"} />
                        <AvatarFallback>{notification.title[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground mb-1">
                          {notification.title}
                          <Badge variant="secondary" className="ml-2">
                            ${notification.amount}
                          </Badge>
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                        <span className="text-xs text-muted-foreground">{formatTime(notification.timestamp)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </TabsContent>

          <TabsContent value="social" className="space-y-4">
            {notifications
              .filter((n) => ["like", "comment", "follow"].includes(n.type))
              .map((notification) => (
                <Card key={notification.id} className="transition-all hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={notification.avatar || "/placeholder.svg"} />
                        <AvatarFallback>{notification.title[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground mb-1">{notification.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                        <span className="text-xs text-muted-foreground">{formatTime(notification.timestamp)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            {notifications
              .filter((n) => ["award", "system"].includes(n.type))
              .map((notification) => (
                <Card key={notification.id} className="transition-all hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground mb-1">{notification.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                        <span className="text-xs text-muted-foreground">{formatTime(notification.timestamp)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
