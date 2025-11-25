"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Heart, MessageCircle, UserPlus, DollarSign, Award, Bell, Check, X, Settings, ChevronLeft } from "lucide-react"
import Link from "next/link"
import { notificationService } from "@/lib/api/services"
import type { Notification } from "@/lib/api/types"
import { toast } from "sonner"
import { formatTimestamp } from "@/lib/utils"

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    loadNotifications()
  }, [activeTab])

  const loadNotifications = async () => {
    try {
      setIsLoading(true)
      const type = activeTab === "all" 
        ? undefined 
        : activeTab === "donations" 
        ? "donation" 
        : activeTab === "social" 
        ? undefined 
        : "system"
      
      const response = await notificationService.getNotifications({ 
        page: 1, 
        limit: 50,
        type 
      })
      
      // Filter for social tab
      if (activeTab === "social") {
        setNotifications(response.data.filter(n => ["like", "comment", "follow"].includes(n.type)))
      } else {
        setNotifications(response.data)
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load notifications")
      setNotifications([])
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id)
      setNotifications((prev) => prev.map((notif) => (notif.id === id ? { ...notif, isRead: true } : notif)))
    } catch (error: any) {
      toast.error(error.message || "Failed to mark as read")
    }
  }

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead()
      setNotifications((prev) => prev.map((notif) => ({ ...notif, isRead: true })))
      toast.success("All notifications marked as read")
    } catch (error: any) {
      toast.error(error.message || "Failed to mark all as read")
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      await notificationService.deleteNotification(id)
      setNotifications((prev) => prev.filter((notif) => notif.id !== id))
    } catch (error: any) {
      toast.error(error.message || "Failed to delete notification")
    }
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


  const unreadCount = notifications.filter((n) => !n.isRead).length

  const filteredNotifications = activeTab === "all" 
    ? notifications 
    : activeTab === "donations"
    ? notifications.filter((n) => n.type === "donation")
    : activeTab === "social"
    ? notifications.filter((n) => ["like", "comment", "follow"].includes(n.type))
    : notifications.filter((n) => ["award", "system"].includes(n.type))

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-orange-50/30 to-peach-50/30">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/feed">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Feed
            </Link>
          </Button>
        </div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Notifications</h1>
            <p className="text-muted-foreground">
              {isLoading ? "Loading..." : unreadCount > 0 ? `${unreadCount} unread notifications` : "All caught up!"}
            </p>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" onClick={markAllAsRead} disabled={isLoading}>
                <Check className="h-4 w-4 mr-2" />
                Mark all read
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link href="/settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Link>
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="donations">Donations</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
              <CardContent className="p-12 text-center">
                <Bell className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No notifications</h3>
                <p className="text-muted-foreground">You're all caught up! Check back later for updates.</p>
              </CardContent>
            </Card>
          ) : (
            <TabsContent value={activeTab} className="space-y-4">
              {filteredNotifications.map((notification) => (
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
                            <span className="text-xs text-muted-foreground">{formatTimestamp(notification.timestamp)}</span>
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
          )}
        </Tabs>
      </div>
    </div>
  )
}
