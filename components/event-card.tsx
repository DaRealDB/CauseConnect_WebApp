"use client"

import { useState } from "react"
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

interface EventCardProps {
  event: {
    id: number
    title: string
    description: string
    image: string
    tags: string[]
    supporters: number
    goal: number
    raised: number
    organization: string
    organizationVerified: boolean
    timeLeft: string
    urgency: "high" | "medium" | "low"
  }
}

export function EventCard({ event }: EventCardProps) {
  const [isSupported, setIsSupported] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isPassed, setIsPassed] = useState(false)

  const progressPercentage = (event.raised / event.goal) * 100

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

  if (isPassed) {
    return null // Hide passed events
  }

  return (
    <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm overflow-hidden hover:shadow-xl transition-all duration-300">
      {/* Event Image */}
      <div className="relative">
        <Link href={`/event/${event.id}`}>
          <img
            src={event.image || "/placeholder.svg"}
            alt={event.title}
            className="w-full h-48 object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
          />
        </Link>
        {event.urgency === "high" && <Badge className="absolute top-3 left-3 bg-red-500 text-white">Urgent</Badge>}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-3 right-3 bg-black/20 hover:bg-black/40 text-white"
          onClick={() => setIsPassed(true)}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <CardContent className="p-6">
        {/* Organization */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-medium text-muted-foreground">{event.organization}</span>
          {event.organizationVerified && <CheckCircle className="w-4 h-4 text-primary" />}
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
            <span className="font-medium text-foreground">${event.raised.toLocaleString()} raised</span>
            <span className="text-muted-foreground">${event.goal.toLocaleString()} goal</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2 mb-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{event.supporters} supporters</span>
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
              onClick={() => setIsSupported(!isSupported)}
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
            <Button size="sm" variant="ghost" onClick={() => setIsBookmarked(!isBookmarked)}>
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
