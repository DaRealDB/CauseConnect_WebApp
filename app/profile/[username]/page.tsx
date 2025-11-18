"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Heart,
  MapPin,
  Calendar,
  LinkIcon,
  Share2,
  Users,
  MessageCircle,
  UserCheck,
  UserPlus,
  Flag,
} from "lucide-react"
import Link from "next/link"
import { FeedHeader } from "@/components/feed-header"
import { UserPost } from "@/components/user-post"

// Mock user data - in real app this would come from params and API
const OTHER_USER_PROFILE = {
  id: 2,
  name: "Marcus Rodriguez",
  username: "marcus_educator",
  bio: "Educator and advocate for equal access to quality education. Former teacher, now working to bridge the education gap globally. Every child deserves a chance to learn! 📚✨",
  avatar: "/placeholder.svg?height=120&width=120&text=MR",
  coverImage: "/placeholder.svg?height=200&width=800&text=Education+Cover",
  location: "Austin, TX",
  website: "https://educationforall.org",
  joinedDate: "January 2022",
  verified: true,
  stats: {
    following: 189,
    followers: 2341,
    causesSupported: 67,
    totalDonated: 25000,
    impactScore: 1456,
  },
}

const OTHER_USER_POSTS = [
  {
    id: 1,
    user: OTHER_USER_PROFILE,
    content:
      "Update from our scholarship program: 15 students just graduated high school and are heading to university! Education changes everything. 🎓",
    image: "/children-studying-in-classroom.jpg",
    timestamp: "5 hours ago",
    likes: 289,
    comments: 45,
    shares: 67,
    liked: false,
    bookmarked: false,
  },
]

export default function UserProfilePage() {
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
                src={OTHER_USER_PROFILE.coverImage || "/placeholder.svg"}
                alt="Cover"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 right-4 flex gap-2">
                <Button size="sm" variant="secondary" className="bg-white/90 hover:bg-white">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Button size="sm" variant="outline" className="bg-white/90 hover:bg-white">
                  <Flag className="w-4 h-4 mr-2" />
                  Report
                </Button>
              </div>
            </div>

            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Avatar and Basic Info */}
                <div className="flex flex-col items-center md:items-start">
                  <Avatar className="w-32 h-32 border-4 border-background -mt-16 mb-4">
                    <AvatarImage src={OTHER_USER_PROFILE.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="text-2xl">MR</AvatarFallback>
                  </Avatar>

                  <div className="text-center md:text-left">
                    <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                      <h1 className="text-3xl font-bold text-foreground">{OTHER_USER_PROFILE.name}</h1>
                      {OTHER_USER_PROFILE.verified && (
                        <Badge variant="secondary" className="text-xs">
                          Verified
                        </Badge>
                      )}
                    </div>
                    <p className="text-lg text-muted-foreground mb-4">@{OTHER_USER_PROFILE.username}</p>

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4 justify-center md:justify-start">
                      {OTHER_USER_PROFILE.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{OTHER_USER_PROFILE.location}</span>
                        </div>
                      )}
                      {OTHER_USER_PROFILE.website && (
                        <div className="flex items-center gap-1">
                          <LinkIcon className="w-4 h-4" />
                          <a
                            href={OTHER_USER_PROFILE.website}
                            className="text-primary hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {OTHER_USER_PROFILE.website.replace("https://", "")}
                          </a>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Joined {OTHER_USER_PROFILE.joinedDate}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bio and Stats */}
                <div className="flex-1">
                  <p className="text-foreground mb-6 text-center md:text-left">{OTHER_USER_PROFILE.bio}</p>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-secondary/50 rounded-lg">
                      <div className="text-2xl font-bold text-foreground">{OTHER_USER_PROFILE.stats.followers}</div>
                      <div className="text-sm text-muted-foreground">Followers</div>
                    </div>
                    <div className="text-center p-4 bg-secondary/50 rounded-lg">
                      <div className="text-2xl font-bold text-foreground">{OTHER_USER_PROFILE.stats.following}</div>
                      <div className="text-sm text-muted-foreground">Following</div>
                    </div>
                    <div className="text-center p-4 bg-secondary/50 rounded-lg">
                      <div className="text-2xl font-bold text-foreground">
                        {OTHER_USER_PROFILE.stats.causesSupported}
                      </div>
                      <div className="text-sm text-muted-foreground">Causes</div>
                    </div>
                    <div className="text-center p-4 bg-secondary/50 rounded-lg">
                      <div className="text-2xl font-bold text-foreground">
                        ${OTHER_USER_PROFILE.stats.totalDonated.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Donated</div>
                    </div>
                    <div className="text-center p-4 bg-secondary/50 rounded-lg">
                      <div className="text-2xl font-bold text-foreground">{OTHER_USER_PROFILE.stats.impactScore}</div>
                      <div className="text-sm text-muted-foreground">Impact Score</div>
                    </div>
                    <div className="text-center p-4 bg-secondary/50 rounded-lg">
                      <div className="text-2xl font-bold text-foreground">18</div>
                      <div className="text-sm text-muted-foreground">Awards</div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 justify-center md:justify-start">
                    <Button
                      onClick={() => setIsFollowing(!isFollowing)}
                      variant={isFollowing ? "outline" : "default"}
                      className="flex items-center gap-2"
                    >
                      {isFollowing ? (
                        <>
                          <UserCheck className="w-4 h-4" />
                          Following
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          Follow
                        </>
                      )}
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href={`/messages/new?user=${OTHER_USER_PROFILE.username}`}>
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Message
                      </Link>
                    </Button>
                    <Button variant="outline">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="supported">Supported</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="space-y-6">
              {OTHER_USER_POSTS.map((post) => (
                <UserPost key={post.id} post={post} />
              ))}
            </TabsContent>

            <TabsContent value="supported" className="space-y-6">
              <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Supported causes are private</h3>
                  <p className="text-muted-foreground">This user has chosen to keep their supported causes private.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-6">
              <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Activity is private</h3>
                  <p className="text-muted-foreground">This user has chosen to keep their activity private.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
