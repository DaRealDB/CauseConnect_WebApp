"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { FeedHeader } from "@/components/feed-header"
import { EventCard } from "@/components/event-card"
import { eventService } from "@/lib/api/services"
import type { Event } from "@/lib/api/types"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"

export default function SavedEventsPage() {
  const { isAuthenticated } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    if (isAuthenticated) {
      loadBookmarkedEvents()
    } else {
      setIsLoading(false)
    }
  }, [isAuthenticated, page])

  const loadBookmarkedEvents = async () => {
    try {
      setIsLoading(true)
      // Using the bookmarked events endpoint
      const response = await eventService.getEvents({
        page,
        limit: 10,
        filter: "bookmarked",
      })
      setEvents((prev) => (page === 1 ? response.data : [...prev, ...response.data]))
      setHasMore(response.pagination.page < response.pagination.totalPages)
    } catch (error: any) {
      toast.error(error.message || "Failed to load saved events")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoadMore = () => {
    setPage((prev) => prev + 1)
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10">
        <FeedHeader />
        <div className="container mx-auto px-4 py-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Please log in to view your saved events</p>
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
          <h1 className="text-2xl font-bold text-foreground mb-6">Saved Events</h1>

          {isLoading && page === 1 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading saved events...</p>
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
                      isBookmarked: true,
                    }}
                  />
                ))}
              </div>

              {events.length === 0 && !isLoading && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No saved events yet. Start bookmarking events to see them here!</p>
                </div>
              )}

              {hasMore && !isLoading && (
                <div className="text-center mt-12">
                  <Button variant="outline" size="lg" onClick={handleLoadMore}>
                    Load More
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
















