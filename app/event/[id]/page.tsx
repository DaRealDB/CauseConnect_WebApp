"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, Share2, Bookmark, Award, CheckCircle, Clock, Users, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { CommentSystem } from "@/components/comment-system"
import { FeedHeader } from "@/components/feed-header"

// Mock event data - in real app this would come from params and API
const EVENT_DATA = {
  id: 1,
  title: "Emergency Relief for Flood Victims",
  description:
    "Urgent support needed for families affected by recent flooding in Southeast Asia. Our team is on the ground providing emergency shelter, food, and medical supplies to over 2,000 displaced families. The situation is critical and every donation helps save lives.",
  fullDescription: `The recent flooding in Southeast Asia has displaced thousands of families, leaving them without basic necessities. Our emergency response team has been working around the clock to provide:

• Emergency shelter and temporary housing
• Clean water and food supplies
• Medical care and supplies
• Clothing and hygiene kits
• Psychological support services

We've already helped over 2,000 families, but there are still many more in need. Your donation will go directly to purchasing supplies and supporting our relief efforts on the ground.

Our team has been working in disaster relief for over 15 years and has a proven track record of getting aid to those who need it most. We provide regular updates and full transparency on how funds are used.`,
  image: "/placeholder.svg?height=400&width=600&text=Flood+Relief+Efforts",
  tags: ["Emergency", "Disaster Relief", "Asia", "Urgent"],
  supporters: 1247,
  goal: 100000,
  raised: 67500,
  organization: {
    name: "Global Relief Network",
    verified: true,
    avatar: "/placeholder.svg?height=40&width=40&text=GRN",
    description: "International humanitarian organization providing emergency relief worldwide since 2008.",
  },
  timeLeft: "12 days left",
  urgency: "high" as const,
  updates: [
    {
      id: 1,
      title: "Relief supplies delivered to 500 more families",
      content: "Today we successfully delivered emergency kits to 500 additional families in the hardest-hit areas.",
      timestamp: "2 days ago",
      image: "/placeholder.svg?height=200&width=300&text=Relief+Delivery",
    },
  ],
}

export default function EventDetailPage() {
  const progressPercentage = (EVENT_DATA.raised / EVENT_DATA.goal) * 100

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

          {/* Event Header */}
          <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm overflow-hidden mb-6">
            <div className="relative">
              <img
                src={EVENT_DATA.image || "/placeholder.svg"}
                alt={EVENT_DATA.title}
                className="w-full h-64 md:h-80 object-cover"
              />
              {EVENT_DATA.urgency === "high" && (
                <Badge className="absolute top-4 left-4 bg-red-500 text-white">Urgent</Badge>
              )}
            </div>

            <CardContent className="p-8">
              {/* Organization */}
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={EVENT_DATA.organization.avatar || "/placeholder.svg"} />
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
                  <span className="text-foreground">${EVENT_DATA.raised.toLocaleString()} raised</span>
                  <span className="text-muted-foreground">${EVENT_DATA.goal.toLocaleString()} goal</span>
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
                <Button size="lg" className="flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  Support This Cause
                </Button>
                <Button size="lg" variant="outline" className="flex items-center gap-2 bg-transparent">
                  <Share2 className="w-5 h-5" />
                  Share
                </Button>
                <Button size="lg" variant="outline" className="flex items-center gap-2 bg-transparent">
                  <Bookmark className="w-5 h-5" />
                  Save
                </Button>
                <Button size="lg" variant="outline" className="flex items-center gap-2 bg-transparent">
                  <Award className="w-5 h-5" />
                  Award
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
              {EVENT_DATA.updates.map((update) => (
                <div key={update.id} className="border-b border-border last:border-b-0 pb-4 last:pb-0">
                  <h4 className="font-semibold text-foreground mb-2">{update.title}</h4>
                  <p className="text-muted-foreground mb-2">{update.content}</p>
                  <span className="text-sm text-muted-foreground">{update.timestamp}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Comment System */}
          <CommentSystem postId={EVENT_DATA.id} />
        </div>
      </div>
    </div>
  )
}
