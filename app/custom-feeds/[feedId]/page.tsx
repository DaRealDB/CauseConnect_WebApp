"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FeedHeader } from "@/components/feed-header"
import { EventCard } from "@/components/event-card"
import { ArrowLeft, Edit, Trash2 } from "lucide-react"
import { customFeedService, eventService, type CustomFeed, type Event } from "@/lib/api/services"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function CustomFeedViewPage() {
  const params = useParams()
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const feedId = params.feedId as string
  const [feed, setFeed] = useState<CustomFeed | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingEvents, setIsLoadingEvents] = useState(true)

  useEffect(() => {
    if (isAuthenticated && feedId) {
      loadFeed()
      loadEvents()
    }
  }, [isAuthenticated, feedId])

  const loadFeed = async () => {
    try {
      const data = await customFeedService.getFeedById(feedId)
      setFeed(data)
    } catch (error: any) {
      toast.error(error.message || "Failed to load custom feed")
      router.push("/custom-feeds")
    } finally {
      setIsLoading(false)
    }
  }

  const loadEvents = async () => {
    try {
      setIsLoadingEvents(true)
      if (feed?.tags && feed.tags.length > 0) {
        const response = await eventService.getEvents({
          page: 1,
          limit: 20,
          tags: feed.tags,
        })
        setEvents(response.data)
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load events")
    } finally {
      setIsLoadingEvents(false)
    }
  }

  const handleDelete = async () => {
    try {
      await customFeedService.deleteFeed(feedId)
      toast.success("Custom feed deleted")
      router.push("/custom-feeds")
    } catch (error: any) {
      toast.error(error.message || "Failed to delete custom feed")
    }
  }

  if (!isAuthenticated) {
    router.push("/login")
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10">
        <FeedHeader />
        <div className="container mx-auto px-4 py-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading feed...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!feed) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10">
      <FeedHeader />

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={() => router.push("/custom-feeds")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Feeds
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push(`/custom-feeds/${feedId}/edit`)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Custom Feed?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete "{feed.name}". This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm mb-6">
            <CardContent className="p-6">
              <h1 className="text-3xl font-bold text-foreground mb-2">{feed.name}</h1>
              <div className="flex flex-wrap gap-2">
                {feed.tags.map((tag) => (
                  <span key={tag} className="text-sm bg-secondary px-3 py-1 rounded-full">
                    {tag.replace("-", " ")}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          {isLoadingEvents ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading events...</p>
            </div>
          ) : events.length === 0 ? (
            <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">No events found matching your feed tags.</p>
              </CardContent>
            </Card>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  )
}











