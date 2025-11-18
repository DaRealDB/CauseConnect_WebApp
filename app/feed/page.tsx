"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Filter } from "lucide-react"
import Link from "next/link"
import { FeedHeader } from "@/components/feed-header"
import { EventCard } from "@/components/event-card"
import { UserPost } from "@/components/user-post"

const SAMPLE_EVENTS = [
  {
    id: 1,
    title: "Emergency Relief for Flood Victims",
    description:
      "Urgent support needed for families affected by recent flooding in Southeast Asia. Providing emergency shelter, food, and medical supplies.",
    image: "/placeholder.svg?height=300&width=400&text=Flood+Relief",
    tags: ["Emergency", "Disaster Relief", "Asia"],
    supporters: 1247,
    goal: 100000,
    raised: 67500,
    organization: "Global Relief Network",
    organizationVerified: true,
    timeLeft: "12 days left",
    urgency: "high",
  },
  {
    id: 2,
    title: "Solar Power for Rural Schools",
    description:
      "Installing solar panels in 20 rural schools to provide reliable electricity for education. Clean energy for brighter futures.",
    image: "/placeholder.svg?height=300&width=400&text=Solar+Schools",
    tags: ["Education", "Environment", "Technology"],
    supporters: 892,
    goal: 75000,
    raised: 45200,
    organization: "Sustainable Education Initiative",
    organizationVerified: true,
    timeLeft: "28 days left",
    urgency: "medium",
  },
  {
    id: 3,
    title: "Mental Health Support for Veterans",
    description:
      "Providing counseling and therapy services for veterans struggling with PTSD and mental health challenges.",
    image: "/placeholder.svg?height=300&width=400&text=Veteran+Support",
    tags: ["Mental Health", "Veterans", "Healthcare"],
    supporters: 634,
    goal: 50000,
    raised: 38900,
    organization: "Veterans Care Foundation",
    organizationVerified: true,
    timeLeft: "15 days left",
    urgency: "medium",
  },
]

const SAMPLE_USER_POSTS = [
  {
    id: 1,
    user: {
      name: "Sarah Chen",
      username: "sarahc_impact",
      avatar: "/placeholder.svg?height=40&width=40&text=SC",
      verified: false,
      following: false,
    },
    content:
      "Just visited the water well project we funded last year in Kenya. Seeing 500+ families with clean water access is incredible! The impact is real. 💧",
    image: "/clean-water-well-in-kenya-village.jpg",
    timestamp: "2 hours ago",
    likes: 156,
    comments: 23,
    shares: 12,
    liked: false,
    bookmarked: false,
  },
  {
    id: 2,
    user: {
      name: "Marcus Rodriguez",
      username: "marcus_educator",
      avatar: "/placeholder.svg?height=40&width=40&text=MR",
      verified: true,
      following: true,
    },
    content:
      "Update from our scholarship program: 15 students just graduated high school and are heading to university! Education changes everything. 🎓",
    image: "/children-studying-in-classroom.jpg",
    timestamp: "5 hours ago",
    likes: 289,
    comments: 45,
    shares: 67,
    liked: true,
    bookmarked: true,
  },
]

export default function FeedPage() {
  const [activeFilter, setActiveFilter] = useState("all")

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10">
      <FeedHeader />

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-6xl mx-auto">
          {/* Feed Controls */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-foreground">Your Feed</h1>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={activeFilter === "all" ? "default" : "outline"}
                  onClick={() => setActiveFilter("all")}
                >
                  All
                </Button>
                <Button
                  size="sm"
                  variant={activeFilter === "events" ? "default" : "outline"}
                  onClick={() => setActiveFilter("events")}
                >
                  Events
                </Button>
                <Button
                  size="sm"
                  variant={activeFilter === "updates" ? "default" : "outline"}
                  onClick={() => setActiveFilter("updates")}
                >
                  Updates
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button size="sm" variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <Button size="sm" asChild>
                <Link href="/create">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Post
                </Link>
              </Button>
            </div>
          </div>

          {/* Feed Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Event Cards */}
            {(activeFilter === "all" || activeFilter === "events") &&
              SAMPLE_EVENTS.map((event) => <EventCard key={event.id} event={event} />)}

            {/* User Posts */}
            {(activeFilter === "all" || activeFilter === "updates") &&
              SAMPLE_USER_POSTS.map((post) => <UserPost key={post.id} post={post} />)}
          </div>

          {/* Load More */}
          <div className="text-center mt-12">
            <Button variant="outline" size="lg">
              Load More Content
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
