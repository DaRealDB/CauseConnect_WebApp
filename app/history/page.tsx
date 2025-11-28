"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FeedHeader } from "@/components/feed-header"
import { EventCard } from "@/components/event-card"
import { eventService } from "@/lib/api/services"
import type { Event } from "@/lib/api/types"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import { History as HistoryIcon } from "lucide-react"

export default function HistoryPage() {
  const { isAuthenticated } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isAuthenticated) {
      loadHistory()
    } else {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  const loadHistory = async () => {
    try {
      setIsLoading(true)
      // For now, we'll show events the user has supported or interacted with
      // In the future, this could track viewed events
      const response = await eventService.getEvents({
        page: 1,
        limit: 20,
        filter: "events",
      })
      // Filter to show only events user has interacted with
      // This is a simplified version - ideally backend would track view history
      setEvents(response.data.filter((event) => event.isSupported || event.isBookmarked))
    } catch (error: any) {
      toast.error(error.message || "Failed to load history")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10">
        <FeedHeader />
        <div className="container mx-auto px-4 py-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Please log in to view your history</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10">
      <FeedHeader />

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <HistoryIcon className="w-6 h-6 text-foreground" />
            <h1 className="text-2xl font-bold text-foreground">History</h1>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading history...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {events.map((event) => (
                  <EventCard
                    key={event.id}
                    event={{
                      id: event.id,
                      title: event.title,
                      description: event.description,
                      image: event.image || "/placeholder.svg",
                      tags: event.tags,
                      supporters: event.supporters,
                      goal: event.goal,
                      raised: event.raised,
                      organization: event.organization.name,
                      organizationId: event.organization.id,
                      organizationUsername: event.organization.username,
                      organizationVerified: event.organization.verified,
                      timeLeft: event.timeLeft || "",
                      urgency: event.urgency,
                      isBookmarked: event.isBookmarked,
                    }}
                  />
                ))}
              </div>

              {events.length === 0 && !isLoading && (
                <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                  <CardContent className="p-12 text-center">
                    <HistoryIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No history yet</h3>
                    <p className="text-muted-foreground">
                      Your interaction history with events will appear here.
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}













