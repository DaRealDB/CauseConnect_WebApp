"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Award,
  MoreHorizontal,
  CheckCircle,
  X,
  Clock,
  Users,
} from "lucide-react"
import { eventService } from "@/lib/api/services"
import { toast } from "sonner"
import { getImageUrl } from "@/lib/utils"
import { useCurrency } from "@/contexts/CurrencyContext"

interface EventCardProps {
  event: {
    id: number | string
    title: string
    description: string
    image: string
    tags: string[]
    supporters: number
    goal: number
    raised: number
    organization: string
    organizationId?: string | number
    organizationUsername?: string
    organizationVerified: boolean
    timeLeft: string
    urgency: "high" | "medium" | "low"
    isBookmarked?: boolean
  }
}

export function EventCard({ event }: EventCardProps) {
  const { formatAmountSimple } = useCurrency()
  const [isSupported, setIsSupported] = useState(event.isSupported || false)
  const [isBookmarked, setIsBookmarked] = useState(event.isBookmarked || false)
  const [isPassed, setIsPassed] = useState(false)
  const [supportersCount, setSupportersCount] = useState(event.supporters)
  const [isBookmarking, setIsBookmarking] = useState(false)
  const [isSupporting, setIsSupporting] = useState(false)

  // Initialize state from props (DB state)
  useEffect(() => {
    setIsSupported(event.isSupported || false)
    setIsBookmarked(event.isBookmarked || false)
    setSupportersCount(event.supporters)
  }, [event.isSupported, event.isBookmarked, event.supporters])

  const progressPercentage = event.goal > 0 ? (event.raised / event.goal) * 100 : 0

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const handleBookmark = async () => {
    // Optimistic UI update
    const previousState = isBookmarked
    setIsBookmarked(!isBookmarked)
    setIsBookmarking(true)

    try {
      if (previousState) {
        await eventService.unbookmarkEvent(event.id)
        toast.success("Removed from saved events")
      } else {
        await eventService.bookmarkEvent(event.id)
        toast.success("Saved to your events")
      }
    } catch (error: any) {
      // Revert on error
      setIsBookmarked(previousState)
      const errorMessage = error.message || "Failed to update bookmark"
      toast.error(errorMessage)
      console.error("Bookmark error:", error)
    } finally {
      setIsBookmarking(false)
    }
  }

  if (isPassed) {
    return null // Hide passed events
  }

  return (
    <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm overflow-hidden hover:shadow-xl transition-all duration-300">
      {/* Event Image */}
      <div className="relative">
        <Link href={`/event/${event.id}`}>
          <img
            src={getImageUrl(event.image)}
            alt={event.title}
            className="w-full h-48 object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/placeholder.svg"
            }}
          />
        </Link>
        {event.urgency === "high" && <Badge className="absolute top-3 left-3 bg-red-500 text-white">Urgent</Badge>}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-3 right-3 bg-black/20 hover:bg-black/40 text-white"
          onClick={async () => {
            try {
              await eventService.passEvent(event.id)
              setIsPassed(true)
              toast.success("Event passed")
            } catch (error: any) {
              toast.error(error.message || "Failed to pass event")
            }
          }}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <CardContent className="p-6">
        {/* Organization */}
        <div className="flex items-center gap-2 mb-3">
          {event.organizationUsername ? (
            <Link
              href={`/profile/${event.organizationUsername}`}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              {event.organization}
              {event.organizationVerified && <CheckCircle className="w-4 h-4 text-primary" />}
            </Link>
          ) : (
            <>
              <span className="text-sm font-medium text-muted-foreground">{event.organization}</span>
              {event.organizationVerified && <CheckCircle className="w-4 h-4 text-primary" />}
            </>
          )}
        </div>

        {/* Title and Description */}
        <Link href={`/event/${event.id}`}>
          <h3 className="text-xl font-semibold text-foreground mb-3 line-clamp-2 hover:text-primary transition-colors cursor-pointer">
            {event.title}
          </h3>
        </Link>
        <p className="text-muted-foreground mb-4 line-clamp-3">{event.description}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {event.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-foreground">{formatAmountSimple(event.raised)} raised</span>
            <span className="text-muted-foreground">{formatAmountSimple(event.goal)} goal</span>
          </div>
          {event.raised > 0 ? (
            <div className="w-full bg-secondary rounded-full h-2 mb-2">
              <div
                className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>
          ) : (
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className="bg-gray-300 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>
          )}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{supportersCount} supporters</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{event.timeLeft}</span>
            </div>
          </div>
        </div>

        {/* Engagement Toolbar */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={isSupported ? "default" : "outline"}
              className="flex items-center gap-2"
              disabled={isSupporting}
              onClick={async () => {
                if (isSupporting) return
                
                const previousState = isSupported
                const previousCount = supportersCount
                setIsSupported(!isSupported)
                setSupportersCount((prev) => (previousState ? Math.max(0, prev - 1) : prev + 1))
                setIsSupporting(true)

                try {
                  if (previousState) {
                    await eventService.passEvent(event.id)
                    toast.success("Support removed")
                  } else {
                    await eventService.supportEvent(event.id)
                    toast.success("Event supported!")
                  }
                  // Reload event data to get accurate counts from DB
                  // For now, we'll keep optimistic update since we don't have a refresh method
                } catch (error: any) {
                  // Revert on error
                  setIsSupported(previousState)
                  setSupportersCount(previousCount)
                  toast.error(error.message || "Failed to update support")
                } finally {
                  setIsSupporting(false)
                }
              }}
            >
              <Heart className={`w-4 h-4 ${isSupported ? "fill-current" : ""}`} />
              {isSupported ? "Supported" : "Support"}
            </Button>
            <Button size="sm" variant="outline" className="flex items-center gap-2 bg-transparent" asChild>
              <Link href={`/event/${event.id}#comments`}>
                <MessageCircle className="w-4 h-4" />
                Comment
              </Link>
            </Button>
          </div>

          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleBookmark}
              disabled={isBookmarking}
              className={isBookmarked ? "text-orange-500" : ""}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-current" : ""}`} />
            </Button>
            <Button size="sm" variant="ghost">
              <Share2 className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost">
              <Award className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
