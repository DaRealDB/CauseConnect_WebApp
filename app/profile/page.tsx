"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Heart, MapPin, Calendar, LinkIcon, Edit, Share2, Users, TrendingUp, Award, MessageCircle } from "lucide-react"
import Link from "next/link"
import { FeedHeader } from "@/components/feed-header"
import { EventCard } from "@/components/event-card"
import { UserPost } from "@/components/user-post"

const USER_PROFILE = {
  id: 1,
  name: "Sarah Chen",
  username: "sarahc_impact",
  bio: "Passionate about education and environmental causes. Volunteer coordinator at local schools. Making a difference one cause at a time! 🌱📚",
  avatar: "/placeholder.svg?height=120&width=120&text=SC",
  coverImage: "/placeholder.svg?height=200&width=800&text=Cover+Image",
  location: "San Francisco, CA",
  website: "https://sarahchen.org",
  joinedDate: "March 2023",
  verified: false,
  stats: {
    following: 234,
    followers: 1567,
    causesSupported: 45,
    totalDonated: 12500,
    impactScore: 892,
  },
}

const SUPPORTED_EVENTS = [
  {
    id: 1,
    title: "Clean Water Initiative in Rural Kenya",
    description: "Help us bring clean, safe drinking water to 500 families in rural Kenya.",
    image: "/clean-water-well-in-kenya-village.jpg",
    tags: ["Water", "Health", "Africa"],
    supporters: 234,
    goal: 50000,
    raised: 32000,
    organization: "Water for All",
    organizationVerified: true,
    timeLeft: "15 days left",
    urgency: "medium" as const,
  },
  {
    id: 2,
    title: "Education Scholarships for Underprivileged Youth",
    description: "Providing educational opportunities for children who cannot afford school fees.",
    image: "/children-studying-in-classroom.jpg",
    tags: ["Education", "Youth", "Scholarships"],
    supporters: 156,
    goal: 25000,
    raised: 18500,
    organization: "Future Leaders Foundation",
    organizationVerified: true,
    timeLeft: "22 days left",
    urgency: "low" as const,
  },
]

const USER_POSTS = [
  {
    id: 1,
    user: USER_PROFILE,
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
    user: USER_PROFILE,
    content:
      "Excited to announce that our scholarship program just reached 100 students! Education truly changes everything. Thank you to everyone who supported this cause. 🎓",
    image: "/children-studying-in-classroom.jpg",
    timestamp: "1 week ago",
    likes: 289,
    comments: 45,
    shares: 67,
    liked: true,
    bookmarked: true,
  },
]

export default function ProfilePage() {
  const [isFollowing, setIsFollowing] = useState(false)
  const [activeTab, setActiveTab] = useState("posts")

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10">
      <FeedHeader />

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm overflow-hidden mb-6">
            {/* Cover Image */}
            <div className="relative h-48 bg-gradient-to-r from-primary/20 to-accent/20">
              <img
                src={USER_PROFILE.coverImage || "/placeholder.svg"}
                alt="Cover"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 right-4 flex gap-2">
                <Button size="sm" variant="secondary" className="bg-white/90 hover:bg-white">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Button size="sm" variant="secondary" className="bg-white/90 hover:bg-white" asChild>
                  <Link href="/profile/edit">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Link>
                </Button>
              </div>
            </div>

            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Avatar and Basic Info */}
                <div className="flex flex-col items-center md:items-start">
                  <Avatar className="w-32 h-32 border-4 border-background -mt-16 mb-4">
                    <AvatarImage src={USER_PROFILE.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="text-2xl">SC</AvatarFallback>
                  </Avatar>

                  <div className="text-center md:text-left">
                    <h1 className="text-3xl font-bold text-foreground mb-2">{USER_PROFILE.name}</h1>
                    <p className="text-lg text-muted-foreground mb-4">@{USER_PROFILE.username}</p>

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                      {USER_PROFILE.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{USER_PROFILE.location}</span>
                        </div>
                      )}
                      {USER_PROFILE.website && (
                        <div className="flex items-center gap-1">
                          <LinkIcon className="w-4 h-4" />
                          <a
                            href={USER_PROFILE.website}
                            className="text-primary hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {USER_PROFILE.website.replace("https://", "")}
                          </a>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Joined {USER_PROFILE.joinedDate}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bio and Stats */}
                <div className="flex-1">
                  <p className="text-foreground mb-6 text-center md:text-left">{USER_PROFILE.bio}</p>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-secondary/50 rounded-lg">
                      <div className="text-2xl font-bold text-foreground">{USER_PROFILE.stats.followers}</div>
                      <div className="text-sm text-muted-foreground">Followers</div>
                    </div>
                    <div className="text-center p-4 bg-secondary/50 rounded-lg">
                      <div className="text-2xl font-bold text-foreground">{USER_PROFILE.stats.following}</div>
                      <div className="text-sm text-muted-foreground">Following</div>
                    </div>
                    <div className="text-center p-4 bg-secondary/50 rounded-lg">
                      <div className="text-2xl font-bold text-foreground">{USER_PROFILE.stats.causesSupported}</div>
                      <div className="text-sm text-muted-foreground">Causes</div>
                    </div>
                    <div className="text-center p-4 bg-secondary/50 rounded-lg">
                      <div className="text-2xl font-bold text-foreground">
                        ${USER_PROFILE.stats.totalDonated.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Donated</div>
                    </div>
                    <div className="text-center p-4 bg-secondary/50 rounded-lg">
                      <div className="text-2xl font-bold text-foreground">{USER_PROFILE.stats.impactScore}</div>
                      <div className="text-sm text-muted-foreground">Impact Score</div>
                    </div>
                    <div className="text-center p-4 bg-secondary/50 rounded-lg">
                      <div className="text-2xl font-bold text-foreground">12</div>
                      <div className="text-sm text-muted-foreground">Awards</div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 justify-center md:justify-start">
                    <Button onClick={() => setIsFollowing(!isFollowing)} variant={isFollowing ? "outline" : "default"}>
                      {isFollowing ? "Following" : "Follow"}
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href="/messages/new">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Message
                      </Link>
                    </Button>
                    <Button variant="outline">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share Profile
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="supported">Supported</TabsTrigger>
              <TabsTrigger value="created">Created</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="space-y-6">
              {USER_POSTS.map((post) => (
                <UserPost key={post.id} post={post} />
              ))}
              {USER_POSTS.length === 0 && (
                <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                  <CardContent className="p-12 text-center">
                    <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No posts yet</h3>
                    <p className="text-muted-foreground">Share your first post to get started!</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="supported" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {SUPPORTED_EVENTS.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
              {SUPPORTED_EVENTS.length === 0 && (
                <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                  <CardContent className="p-12 text-center">
                    <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No supported causes yet</h3>
                    <p className="text-muted-foreground">Start supporting causes to see them here!</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="created" className="space-y-6">
              <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <TrendingUp className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No created causes yet</h3>
                  <p className="text-muted-foreground mb-4">Ready to make a difference? Create your first cause!</p>
                  <Button asChild>
                    <Link href="/create">Create Cause</Link>
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-6">
              <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                    <Heart className="w-5 h-5 text-red-500" />
                    <div className="flex-1">
                      <p className="text-sm text-foreground">
                        Supported <strong>Clean Water Initiative</strong>
                      </p>
                      <p className="text-xs text-muted-foreground">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                    <Award className="w-5 h-5 text-yellow-500" />
                    <div className="flex-1">
                      <p className="text-sm text-foreground">
                        Received <strong>Community Champion</strong> award
                      </p>
                      <p className="text-xs text-muted-foreground">1 day ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                    <Users className="w-5 h-5 text-blue-500" />
                    <div className="flex-1">
                      <p className="text-sm text-foreground">
                        Started following <strong>Global Relief Network</strong>
                      </p>
                      <p className="text-xs text-muted-foreground">3 days ago</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
