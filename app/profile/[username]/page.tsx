"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
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
  Settings,
  Edit,
  Award,
} from "lucide-react"
import Link from "next/link"
import { FeedHeader } from "@/components/feed-header"
import { EventCard } from "@/components/event-card"
import { InterestTags } from "@/components/interest-tags"
import { userService } from "@/lib/api/services"
import type { User } from "@/lib/api/types"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import { getImageUrl } from "@/lib/utils"
import { CoverPhotoUploader } from "@/components/profile/CoverPhotoUploader"

export default function UserProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { user: currentUser, isLoading: authLoading } = useAuth()
  const username = params.username as string
  const [profileUser, setProfileUser] = useState<User | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("events")
  const [activities, setActivities] = useState<Array<{
    type: 'support' | 'award' | 'follow'
    id: string
    title: string
    description: string
    timestamp: string
  }>>([])
  const [isLoadingActivities, setIsLoadingActivities] = useState(false)

  // Wait for auth to load before fetching profile
  // This prevents loading the wrong user's profile on page reload
  useEffect(() => {
    if (!authLoading && username) {
      // Clear any stale profile data before loading new profile
      setProfileUser(null)
      setActivities([])
      setIsFollowing(false)
      setFollowersCount(0)
      
      // If currentUser exists and username in URL doesn't match, 
      // but the user clicked "View Profile" (which should go to their own profile),
      // redirect to correct username
      // Note: This handles the case where URL has wrong/stale username
      // But we also allow viewing other users' profiles, so only redirect if explicitly viewing own profile
      if (currentUser && currentUser.username && currentUser.username.toLowerCase() !== username.toLowerCase()) {
        // User is viewing someone else's profile - that's fine, continue
        // We'll load that user's profile
      }
      
      loadProfile()
    }
  }, [username, authLoading, currentUser])

  useEffect(() => {
    if (activeTab === "activity" && profileUser) {
      loadActivities()
    }
  }, [activeTab, profileUser])

  const loadProfile = async () => {
    if (!username) return
    
    try {
      setIsLoading(true)
      
      // Log which profile we're loading for debugging
      console.log(`[Profile] Loading profile for username: "${username}"`)
      if (currentUser) {
        console.log(`[Profile] Current logged-in user: "${currentUser.username}" (ID: ${currentUser.id})`)
        console.log(`[Profile] Is viewing own profile: ${currentUser.username?.toLowerCase() === username.toLowerCase()}`)
      }
      
      const user = await userService.getUserProfile(username)
      
      // Verify we got the correct user (double-check username matches)
      if (user.username.toLowerCase() !== username.toLowerCase()) {
        console.error(`[Profile] CRITICAL: Username mismatch! Requested: "${username}", Got: "${user.username}"`)
        toast.error(`Error: Profile username doesn't match. Please refresh.`)
        return // Don't set profile if username doesn't match
      }
      
      console.log(`[Profile] ✅ Successfully loaded profile for: ${user.username} (ID: ${user.id})`)
      
      // Additional verification: If this is supposed to be current user's profile, verify ID matches
      if (currentUser && currentUser.username?.toLowerCase() === username.toLowerCase()) {
        if (user.id !== currentUser.id) {
          console.error(`[Profile] CRITICAL: User ID mismatch! Expected current user ID ${currentUser.id}, got ${user.id}`)
          toast.error(`Error: Profile doesn't match logged-in user. Please refresh.`)
          return // Don't set profile if ID doesn't match when viewing own profile
        }
        console.log(`[Profile] ✅ Verified: This is the current user's profile`)
      }
      
      setProfileUser(user)
      setIsFollowing(user.isFollowing || false)
      setFollowersCount(user.stats?.followers || 0)
    } catch (error: any) {
      console.error("[Profile] Error loading profile:", error)
      toast.error(error.message || "Failed to load profile")
      // Only redirect on 404 (user not found), keep trying for other errors
      if (error.status === 404) {
        router.push("/feed")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const [isFollowingLoading, setIsFollowingLoading] = useState(false)

  const loadActivities = async () => {
    if (!username) return
    try {
      setIsLoadingActivities(true)
      const activityData = await userService.getUserActivity(username, 20)
      setActivities(activityData)
    } catch (error: any) {
      console.error("Error loading activities:", error)
      // Don't show error toast - activity might be empty or user might not exist
    } finally {
      setIsLoadingActivities(false)
    }
  }

  const handleToggleFollow = async () => {
    if (!profileUser || !currentUser || isFollowingLoading) return

    // Optimistic UI update - only update the follow button state, not the count
    const previousState = isFollowing
    setIsFollowing(!isFollowing)
    setIsFollowingLoading(true)

    try {
      const result = await userService.toggleFollow(profileUser.id)
      // Update state from API response
      setIsFollowing(result.isFollowing)
      
      // Reload profile to get accurate follower count from backend
      // This ensures the count is always correct and prevents double-counting
      const updatedUser = await userService.getUserProfile(username, currentUser.id as string)
      setFollowersCount(updatedUser.stats?.followers || 0)
      
      toast.success(result.isFollowing ? "Following user" : "Unfollowed user")
    } catch (error: any) {
      // Revert on error
      setIsFollowing(previousState)
      toast.error(error.message || "Failed to update follow status")
    } finally {
      setIsFollowingLoading(false)
    }
  }

  // Wait for auth to load before showing anything to prevent showing wrong user
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10">
        <FeedHeader />
        <div className="container mx-auto px-4 py-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10">
        <FeedHeader />
        <div className="container mx-auto px-4 py-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">User not found</p>
          </div>
        </div>
      </div>
    )
  }

  const isOwnProfile = profileUser.isOwnProfile || currentUser?.id === profileUser.id

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10">
      <FeedHeader />

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm overflow-hidden mb-6">
            <div className="relative h-48 bg-gradient-to-r from-primary/20 to-accent/20">
              <img
                src={getImageUrl(profileUser.coverImage)}
                alt="Cover"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 right-4 flex gap-2">
                <Button size="sm" variant="secondary" className="bg-white/90 hover:bg-white">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                {!isOwnProfile && (
                  <Button size="sm" variant="outline" className="bg-white/90 hover:bg-white">
                    <Flag className="w-4 h-4 mr-2" />
                    Report
                  </Button>
                )}
              </div>
              {isOwnProfile && (
                <div className="absolute bottom-4 right-4">
                  <CoverPhotoUploader
                    onUpdated={(url) =>
                      setProfileUser((prev) => (prev ? { ...prev, coverImage: url } : prev))
                    }
                  />
                </div>
              )}
            </div>

            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Avatar and Basic Info */}
                <div className="flex flex-col items-center md:items-start">
                  <Avatar className="w-32 h-32 border-4 border-background -mt-16 mb-4">
                    <AvatarImage src={getImageUrl(profileUser.avatar)} />
                    <AvatarFallback className="text-2xl">
                      {profileUser.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("") || profileUser.username?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="text-center md:text-left">
                    <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                      <h1 className="text-3xl font-bold text-foreground">{profileUser.name || profileUser.username}</h1>
                      {profileUser.verified && (
                        <Badge variant="secondary" className="text-xs">
                          Verified
                        </Badge>
                      )}
                    </div>
                    <p className="text-lg text-muted-foreground mb-4">@{profileUser.username}</p>

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4 justify-center md:justify-start">
                      {profileUser.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{profileUser.location}</span>
                        </div>
                      )}
                      {profileUser.website && (
                        <div className="flex items-center gap-1">
                          <LinkIcon className="w-4 h-4" />
                          <a
                            href={profileUser.website}
                            className="text-primary hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {profileUser.website.replace("https://", "").replace("http://", "")}
                          </a>
                        </div>
                      )}
                      {profileUser.joinedDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Joined {profileUser.joinedDate}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bio and Stats */}
                <div className="flex-1">
                  {profileUser.bio && (
                    <p className="text-foreground mb-6 text-center md:text-left">{profileUser.bio}</p>
                  )}

                  {/* Interest Tags */}
                  {profileUser.interestTags && Array.isArray(profileUser.interestTags) && profileUser.interestTags.length > 0 ? (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-muted-foreground mb-3 text-center md:text-left">
                        Interests & Tags
                      </h3>
                      <InterestTags tags={profileUser.interestTags} variant="secondary" size="md" />
                    </div>
                  ) : isOwnProfile ? (
                    <div className="mb-6 p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground text-center md:text-left">
                        No interests selected yet.{" "}
                        <Link href="/settings" className="text-primary hover:underline">
                          Add interests in settings
                        </Link>
                      </p>
                    </div>
                  ) : null}

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-secondary/50 rounded-lg">
                      <div className="text-2xl font-bold text-foreground">{followersCount}</div>
                      <div className="text-sm text-muted-foreground">Followers</div>
                    </div>
                    <div className="text-center p-4 bg-secondary/50 rounded-lg">
                      <div className="text-2xl font-bold text-foreground">{profileUser.stats?.following || 0}</div>
                      <div className="text-sm text-muted-foreground">Following</div>
                    </div>
                    <div className="text-center p-4 bg-secondary/50 rounded-lg">
                      <div className="text-2xl font-bold text-foreground">
                        {profileUser.stats?.causesSupported || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Causes</div>
                    </div>
                    <div className="text-center p-4 bg-secondary/50 rounded-lg">
                      <div className="text-2xl font-bold text-foreground">
                        ${(profileUser.stats?.totalDonated || 0).toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Donated</div>
                    </div>
                    <div className="text-center p-4 bg-secondary/50 rounded-lg">
                      <div className="text-2xl font-bold text-foreground">
                        {Math.round(profileUser.stats?.impactScore || 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">Impact Score</div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 justify-center md:justify-start">
                    {isOwnProfile ? (
                      <>
                        <Button variant="default" asChild>
                          <Link href={`/profile/${username}/edit`}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Profile
                          </Link>
                        </Button>
                        <Button variant="outline" asChild>
                          <Link href="/settings">
                            <Settings className="w-4 h-4 mr-2" />
                            Settings
                          </Link>
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          onClick={handleToggleFollow}
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
                          <Link href={`/chat?user=${profileUser.username}`}>
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Message
                          </Link>
                        </Button>
                        <Button variant="outline">
                          <Share2 className="w-4 h-4 mr-2" />
                          Share
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="supported">Supported</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="events" className="space-y-6">
              {profileUser.events && profileUser.events.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {profileUser.events.map((event) => (
                    <EventCard
                      key={event.id}
                      event={{
                        id: event.id,
                        title: event.title,
                        description: event.description,
                        image: event.image || "/placeholder.svg",
                        tags: [],
                        supporters: 0,
                        goal: event.goal,
                        raised: event.raised,
                        organization: profileUser.name || profileUser.username,
                        organizationVerified: profileUser.verified,
                        timeLeft: "",
                        urgency: "medium",
                      }}
                    />
                  ))}
                </div>
              ) : (
                <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                  <CardContent className="p-12 text-center">
                    <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No events yet</h3>
                    <p className="text-muted-foreground">
                      {isOwnProfile
                        ? "Create your first event to get started!"
                        : "This user hasn't created any events yet."}
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="supported" className="space-y-6">
              {profileUser.supportedEvents && profileUser.supportedEvents.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {profileUser.supportedEvents.map((event) => (
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
                        timeLeft: "",
                        urgency: "medium",
                        isSupported: true,
                      }}
                    />
                  ))}
                </div>
              ) : (
                <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                  <CardContent className="p-12 text-center">
                    <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No supported events yet</h3>
                    <p className="text-muted-foreground">
                      {isOwnProfile
                        ? "Start supporting causes to see them here!"
                        : "This user hasn't supported any events yet."}
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="activity" className="space-y-6">
              {isLoadingActivities ? (
                <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                  <CardContent className="p-12 text-center">
                    <p className="text-muted-foreground">Loading activity...</p>
                  </CardContent>
                </Card>
              ) : activities.length > 0 ? (
                <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      {activities.map((activity) => {
                        const getIcon = () => {
                          switch (activity.type) {
                            case 'support':
                              return <Heart className="w-5 h-5 text-red-500" />
                            case 'award':
                              return <Award className="w-5 h-5 text-yellow-500" />
                            case 'follow':
                              return <Users className="w-5 h-5 text-blue-500" />
                            default:
                              return <Users className="w-5 h-5 text-gray-500" />
                          }
                        }

                        const formatTimeAgo = (timestamp: string) => {
                          const date = new Date(timestamp)
                          const now = new Date()
                          const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
                          
                          if (diffInSeconds < 60) return 'just now'
                          if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} ${Math.floor(diffInSeconds / 60) === 1 ? 'minute' : 'minutes'} ago`
                          if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ${Math.floor(diffInSeconds / 3600) === 1 ? 'hour' : 'hours'} ago`
                          if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ${Math.floor(diffInSeconds / 86400) === 1 ? 'day' : 'days'} ago`
                          if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} ${Math.floor(diffInSeconds / 604800) === 1 ? 'week' : 'weeks'} ago`
                          return `${Math.floor(diffInSeconds / 2592000)} ${Math.floor(diffInSeconds / 2592000) === 1 ? 'month' : 'months'} ago`
                        }

                        return (
                          <div key={activity.id} className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                            {getIcon()}
                            <div className="flex-1">
                              <p className="text-sm text-foreground">
                                {activity.type === 'support' && (
                                  <>
                                    Supported <strong>{activity.description}</strong>
                                  </>
                                )}
                                {activity.type === 'award' && (
                                  <>
                                    Received <strong>Community Champion</strong> award
                                  </>
                                )}
                                {activity.type === 'follow' && (
                                  <>
                                    Started following <strong>{activity.description}</strong>
                                  </>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">{formatTimeAgo(activity.timestamp)}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                  <CardContent className="p-12 text-center">
                    <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No activity yet</h3>
                    <p className="text-muted-foreground">
                      {isOwnProfile
                        ? "Your activity will appear here when you support events, receive awards, or follow users."
                        : "This user hasn't had any recent activity."}
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
