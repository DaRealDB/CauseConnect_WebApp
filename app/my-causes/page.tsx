"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FeedHeader } from "@/components/feed-header"
import { EventCard } from "@/components/event-card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  Target, 
  Heart, 
  Bookmark, 
  Users, 
  DollarSign, 
  Calendar,
  ArrowRight,
  CheckCircle
} from "lucide-react"
import Link from "next/link"
import { 
  eventService, 
  donationService, 
  userService 
} from "@/lib/api/services"
import type { Event, Donation, User } from "@/lib/api/types"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import { getImageUrl, formatTimestamp } from "@/lib/utils"

export default function MyCausesPage() {
  const { user, isAuthenticated } = useAuth()
  const { formatAmountSimple } = useCurrency()
  const [activeTab, setActiveTab] = useState<"created" | "supported">("created")
  
  // Created causes
  const [createdEvents, setCreatedEvents] = useState<Event[]>([])
  const [createdEventsPage, setCreatedEventsPage] = useState(1)
  const [createdEventsHasMore, setCreatedEventsHasMore] = useState(true)
  const [isLoadingCreated, setIsLoadingCreated] = useState(true)
  
  // Supported causes
  const [donations, setDonations] = useState<Donation[]>([])
  const [bookmarkedEvents, setBookmarkedEvents] = useState<Event[]>([])
  const [followedUsers, setFollowedUsers] = useState<User[]>([])
  const [donationsPage, setDonationsPage] = useState(1)
  const [bookmarksPage, setBookmarksPage] = useState(1)
  const [followingPage, setFollowingPage] = useState(1)
  const [donationsHasMore, setDonationsHasMore] = useState(true)
  const [bookmarksHasMore, setBookmarksHasMore] = useState(true)
  const [followingHasMore, setFollowingHasMore] = useState(true)
  const [isLoadingSupported, setIsLoadingSupported] = useState(true)

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      if (activeTab === "created") {
        loadCreatedCauses()
      } else {
        loadSupportedCauses()
      }
    }
  }, [isAuthenticated, user, activeTab])

  const loadCreatedCauses = async () => {
    if (!user?.id) return
    
    try {
      setIsLoadingCreated(true)
      const response = await eventService.getEvents({
        page: createdEventsPage,
        limit: 10,
        userId: user.id,
      })
      
      setCreatedEvents((prev) => 
        createdEventsPage === 1 ? response.data : [...prev, ...response.data]
      )
      setCreatedEventsHasMore(
        response.pagination.page < response.pagination.totalPages
      )
    } catch (error: any) {
      toast.error(error.message || "Failed to load created events")
    } finally {
      setIsLoadingCreated(false)
    }
  }

  const loadSupportedCauses = async () => {
    if (!user?.id) return
    
    try {
      setIsLoadingSupported(true)
      
      // Load donations, bookmarks, and followed users in parallel
      // Use Promise.allSettled to handle individual failures gracefully
      const [donationsResult, bookmarksResult, followingResult] = await Promise.allSettled([
        donationService.getDonations({
          page: donationsPage,
          limit: 10,
        }),
        eventService.getEvents({
          page: bookmarksPage,
          limit: 10,
          filter: "bookmarked",
        }),
        userService.getFollowingUsers({
          page: followingPage,
          limit: 20,
        }),
      ])
      
      // Handle donations
      if (donationsResult.status === 'fulfilled') {
        setDonations((prev) => 
          donationsPage === 1 ? donationsResult.value.data : [...prev, ...donationsResult.value.data]
        )
        setDonationsHasMore(
          donationsResult.value.pagination.page < donationsResult.value.pagination.totalPages
        )
      } else {
        console.error('Failed to load donations:', donationsResult.reason)
        // Don't show error toast for individual failures, just log
      }
      
      // Handle bookmarks
      if (bookmarksResult.status === 'fulfilled') {
        setBookmarkedEvents((prev) => 
          bookmarksPage === 1 ? bookmarksResult.value.data : [...prev, ...bookmarksResult.value.data]
        )
        setBookmarksHasMore(
          bookmarksResult.value.pagination.page < bookmarksResult.value.pagination.totalPages
        )
      } else {
        console.error('Failed to load bookmarks:', bookmarksResult.reason)
      }
      
      // Handle following
      if (followingResult.status === 'fulfilled') {
        setFollowedUsers((prev) => 
          followingPage === 1 ? followingResult.value.data : [...prev, ...followingResult.value.data]
        )
        setFollowingHasMore(
          followingResult.value.pagination.page < followingResult.value.pagination.totalPages
        )
      } else {
        console.error('Failed to load following users:', followingResult.reason)
        // Show error toast only for following users since that's likely the issue
        if (followingResult.reason?.message?.includes('not found')) {
          toast.error('Failed to load followed users')
        }
      }
    } catch (error: any) {
      console.error('Error loading supported causes:', error)
      toast.error(error.message || "Failed to load some supported causes")
    } finally {
      setIsLoadingSupported(false)
    }
  }

  const handleLoadMoreCreated = () => {
    setCreatedEventsPage((prev) => prev + 1)
  }

  const handleLoadMoreDonations = () => {
    setDonationsPage((prev) => prev + 1)
  }

  const handleLoadMoreBookmarks = () => {
    setBookmarksPage((prev) => prev + 1)
  }

  const handleLoadMoreFollowing = () => {
    setFollowingPage((prev) => prev + 1)
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10">
        <FeedHeader />
        <div className="container mx-auto px-4 py-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Please log in to view your causes</p>
          </div>
        </div>
      </div>
    )
  }

  const totalDonated = donations.reduce((sum, d) => sum + d.amount, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10">
      <FeedHeader />

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">My Causes</h1>
            <p className="text-muted-foreground">
              Manage and track all the causes you've created and supported
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Created Events</p>
                    <p className="text-2xl font-bold text-foreground">
                      {createdEvents.length}
                    </p>
                  </div>
                  <Target className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Donated</p>
                    <p className="text-2xl font-bold text-foreground">
                      {formatAmountSimple(totalDonated)}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Bookmarked</p>
                    <p className="text-2xl font-bold text-foreground">
                      {bookmarkedEvents.length}
                    </p>
                  </div>
                  <Bookmark className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "created" | "supported")}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="created">
                <Target className="w-4 h-4 mr-2" />
                Created Causes
              </TabsTrigger>
              <TabsTrigger value="supported">
                <Heart className="w-4 h-4 mr-2" />
                Supported Causes
              </TabsTrigger>
            </TabsList>

            {/* Created Causes Tab */}
            <TabsContent value="created" className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  My Created Events
                </h2>
                
                {isLoadingCreated && createdEventsPage === 1 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Loading your events...</p>
                  </div>
                ) : createdEvents.length === 0 ? (
                  <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                    <CardContent className="p-12 text-center">
                      <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        No events created yet
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Start making a difference by creating your first event!
                      </p>
                      <Button asChild>
                        <Link href="/create">
                          Create Your First Event
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {createdEvents.map((event) => (
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
                          }}
                        />
                      ))}
                    </div>
                    {createdEventsHasMore && (
                      <div className="text-center mt-8">
                        <Button variant="outline" onClick={handleLoadMoreCreated}>
                          Load More Events
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </TabsContent>

            {/* Supported Causes Tab */}
            <TabsContent value="supported" className="space-y-8">
              {/* Donations Section */}
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  My Donations
                </h2>
                
                {donations.length === 0 ? (
                  <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                    <CardContent className="p-8 text-center">
                      <DollarSign className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">No donations yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <div className="space-y-3">
                      {donations.map((donation) => (
                        <Card key={donation.id} className="border-0 shadow-md bg-card/80 backdrop-blur-sm">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="font-semibold text-foreground">
                                  {formatAmountSimple(donation.amount)}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {formatTimestamp(donation.createdAt)}
                                </p>
                                {donation.isAnonymous && (
                                  <Badge variant="secondary" className="mt-1">
                                    Anonymous
                                  </Badge>
                                )}
                              </div>
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/event/${donation.eventId}`}>
                                  View Event
                                  <ArrowRight className="w-4 h-4 ml-2" />
                                </Link>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    {donationsHasMore && (
                      <div className="text-center">
                        <Button variant="outline" onClick={handleLoadMoreDonations}>
                          Load More Donations
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Bookmarked Events Section */}
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Bookmark className="w-5 h-5" />
                  Bookmarked Causes
                </h2>
                
                {bookmarkedEvents.length === 0 ? (
                  <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                    <CardContent className="p-8 text-center">
                      <Bookmark className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">No bookmarked events yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {bookmarkedEvents.map((event) => (
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
                    {bookmarksHasMore && (
                      <div className="text-center mt-8">
                        <Button variant="outline" onClick={handleLoadMoreBookmarks}>
                          Load More Bookmarks
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Followed Users/Organizations Section */}
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Followed Organizations
                </h2>
                
                {followedUsers.length === 0 ? (
                  <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                    <CardContent className="p-8 text-center">
                      <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">You're not following anyone yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {followedUsers.map((followedUser) => (
                        <Card 
                          key={followedUser.id} 
                          className="border-0 shadow-md bg-card/80 backdrop-blur-sm hover:shadow-lg transition-shadow"
                        >
                          <CardContent className="p-4">
                            <Link href={`/profile/${followedUser.username}`}>
                              <div className="flex items-center gap-3">
                                <Avatar className="w-12 h-12">
                                  <AvatarImage src={getImageUrl(followedUser.avatar)} />
                                  <AvatarFallback>
                                    {followedUser.name?.[0] || followedUser.username?.[0] || "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold text-foreground truncate">
                                      {followedUser.name || followedUser.username}
                                    </p>
                                    {followedUser.verified && (
                                      <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground truncate">
                                    @{followedUser.username}
                                  </p>
                                </div>
                              </div>
                            </Link>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    {followingHasMore && (
                      <div className="text-center mt-8">
                        <Button variant="outline" onClick={handleLoadMoreFollowing}>
                          Load More
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

