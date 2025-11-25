"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, Share2, Bookmark, Award, CheckCircle, Clock, Users, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { CommentSystem } from "@/components/comment-system"
import { FeedHeader } from "@/components/feed-header"
import { AdminEventPanel } from "@/components/admin-event-panel"
import { eventService } from "@/lib/api/services"
import type { Event } from "@/lib/api/types"
import { toast } from "sonner"
import { useParams } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useCurrency } from "@/contexts/CurrencyContext"
import { getImageUrl, formatTimestamp } from "@/lib/utils"

export default function EventDetailPage() {
  const params = useParams()
  const { formatAmountSimple } = useCurrency()
  const { user: currentUser } = useAuth()
  const eventId = params.id as string
  const [event, setEvent] = useState<Event | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSupported, setIsSupported] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)

  useEffect(() => {
    if (eventId) {
      loadEvent()
    }
  }, [eventId])

  const loadEvent = async () => {
    try {
      setIsLoading(true)
      const eventData = await eventService.getEventById(eventId)
      setEvent(eventData)
      setIsSupported(eventData.isSupported)
      setIsBookmarked(eventData.isBookmarked)
    } catch (error: any) {
      toast.error(error.message || "Failed to load event")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSupport = async () => {
    try {
      if (isSupported) {
        await eventService.passEvent(eventId)
        setIsSupported(false)
        toast.success("Support removed")
      } else {
        await eventService.supportEvent(eventId)
        setIsSupported(true)
        toast.success("Event supported!")
      }
      // Reload event to get updated counts
      await loadEvent()
    } catch (error: any) {
      toast.error(error.message || "Failed to update support")
    }
  }

  const handleBookmark = async () => {
    try {
      if (isBookmarked) {
        await eventService.unbookmarkEvent(eventId)
        setIsBookmarked(false)
      } else {
        await eventService.bookmarkEvent(eventId)
        setIsBookmarked(true)
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update bookmark")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10">
        <FeedHeader />
        <div className="container mx-auto px-4 py-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading event...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10">
        <FeedHeader />
        <div className="container mx-auto px-4 py-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Event not found</p>
          </div>
        </div>
      </div>
    )
  }

  const EVENT_DATA = {
    id: event.id,
    title: event.title,
    description: event.description,
    fullDescription: event.fullDescription || event.description,
    image: event.image || "/placeholder.svg",
    tags: event.tags,
    supporters: event.supporters,
    goal: event.goal,
    raised: event.raised,
    organization: {
      name: event.organization.name,
      verified: event.organization.verified,
      avatar: event.organization.avatar || "/placeholder.svg",
      description: event.organization.description || "",
    },
    timeLeft: event.timeLeft || "",
    urgency: event.urgency,
    updates: event.updates || [],
  }

  const progressPercentage = (event.raised / event.goal) * 100
  const isOwner = currentUser?.id === event.organization.id

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10">
      <FeedHeader />

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Button variant="ghost" className="mb-6" asChild>
            <Link href="/feed">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Feed
            </Link>
          </Button>

          {/* Admin Panel - Only visible to event owner */}
          {isOwner && (
            <div className="mb-6">
              <AdminEventPanel event={event} onUpdate={loadEvent} />
            </div>
          )}

          {/* Event Header */}
          <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm overflow-hidden mb-6">
            <div className="relative">
              <img
                src={getImageUrl(EVENT_DATA.image)}
                alt={EVENT_DATA.title}
                className="w-full h-64 md:h-80 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder.svg"
                }}
              />
              {EVENT_DATA.urgency === "high" && (
                <Badge className="absolute top-4 left-4 bg-red-500 text-white">Urgent</Badge>
              )}
            </div>

            <CardContent className="p-8">
              {/* Organization */}
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={getImageUrl(EVENT_DATA.organization.avatar)} />
                  <AvatarFallback>GRN</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{EVENT_DATA.organization.name}</span>
                    {EVENT_DATA.organization.verified && <CheckCircle className="w-5 h-5 text-primary" />}
                  </div>
                  <p className="text-sm text-muted-foreground">{EVENT_DATA.organization.description}</p>
                </div>
              </div>

              {/* Title and Description */}
              <h1 className="text-3xl font-bold text-foreground mb-4">{EVENT_DATA.title}</h1>
              <p className="text-lg text-muted-foreground mb-6">{EVENT_DATA.description}</p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                {EVENT_DATA.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Progress */}
              <div className="mb-6">
                <div className="flex justify-between text-lg font-semibold mb-3">
                  <span className="text-foreground">{formatAmountSimple(EVENT_DATA.raised)} raised</span>
                  <span className="text-muted-foreground">{formatAmountSimple(EVENT_DATA.goal)} goal</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-3 mb-3">
                  <div
                    className="bg-primary h-3 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{EVENT_DATA.supporters} supporters</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{EVENT_DATA.timeLeft}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mb-6">
                <Button
                  size="lg"
                  className="flex items-center gap-2"
                  onClick={handleSupport}
                  variant={isSupported ? "default" : "outline"}
                >
                  <Heart className={`w-5 h-5 ${isSupported ? "fill-current" : ""}`} />
                  {isSupported ? "Supported" : "Support This Cause"}
                </Button>
                <Button size="lg" variant="outline" className="flex items-center gap-2 bg-transparent" asChild>
                  <Link href={`/donate/${event.id}`}>
                    Donate Now
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="flex items-center gap-2 bg-transparent"
                  onClick={handleBookmark}
                >
                  <Bookmark className={`w-5 h-5 ${isBookmarked ? "fill-current" : ""}`} />
                  {isBookmarked ? "Saved" : "Save"}
                </Button>
                <Button size="lg" variant="outline" className="flex items-center gap-2 bg-transparent">
                  <Share2 className="w-5 h-5" />
                  Share
                </Button>
              </div>

              {/* Full Description */}
              <div className="prose prose-sm max-w-none">
                <h3 className="text-xl font-semibold text-foreground mb-3">About this cause</h3>
                <div className="text-muted-foreground whitespace-pre-line">{EVENT_DATA.fullDescription}</div>
              </div>
            </CardContent>
          </Card>

          {/* Updates Section */}
          <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm mb-6">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-foreground mb-4">Recent Updates</h3>
              {EVENT_DATA.updates.length > 0 ? (
                EVENT_DATA.updates.map((update) => (
                  <div key={update.id} className="border-b border-border last:border-b-0 pb-4 last:pb-0 mb-4">
                    <h4 className="font-semibold text-foreground mb-2">{update.title}</h4>
                    <p className="text-muted-foreground mb-2">{update.content}</p>
                    {update.image && (
                      <img
                        src={getImageUrl(update.image)}
                        alt={update.title}
                        className="w-full rounded-lg mb-2 max-h-64 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none"
                        }}
                      />
                    )}
                    <span className="text-sm text-muted-foreground">{formatTimestamp(update.timestamp)}</span>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No updates yet</p>
              )}
            </CardContent>
          </Card>

          {/* Comment System */}
          <CommentSystem postId={event.id} />
        </div>
      </div>
    </div>
  )
}
