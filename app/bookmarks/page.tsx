"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FeedHeader } from "@/components/feed-header"
import { EventCard } from "@/components/event-card"
import { UserPost } from "@/components/user-post"
import { eventService, postService } from "@/lib/api/services"
import type { Event, Post } from "@/lib/api/types"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import { Bookmark, Calendar, FileText } from "lucide-react"

export default function BookmarksPage() {
  const { isAuthenticated } = useAuth()
  const [activeTab, setActiveTab] = useState<"all" | "events" | "posts">("all")
  const [events, setEvents] = useState<Event[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [eventsPage, setEventsPage] = useState(1)
  const [postsPage, setPostsPage] = useState(1)
  const [eventsHasMore, setEventsHasMore] = useState(true)
  const [postsHasMore, setPostsHasMore] = useState(true)

  useEffect(() => {
    if (isAuthenticated) {
      loadBookmarks()
    } else {
      setIsLoading(false)
    }
  }, [isAuthenticated, activeTab, eventsPage, postsPage])

  const loadBookmarks = async () => {
    try {
      setIsLoading(true)

      // Load events if tab is "all" or "events"
      if (activeTab === "all" || activeTab === "events") {
        const eventsResponse = await eventService.getEvents({
          page: eventsPage,
          limit: 10,
          filter: "bookmarked",
        })
        setEvents((prev) => (eventsPage === 1 ? eventsResponse.data : [...prev, ...eventsResponse.data]))
        setEventsHasMore(eventsResponse.pagination.page < eventsResponse.pagination.totalPages)
      }

      // Load posts if tab is "all" or "posts"
      if (activeTab === "all" || activeTab === "posts") {
        const postsResponse = await postService.getBookmarkedPosts({
          page: postsPage,
          limit: 10,
        })
        setPosts((prev) => (postsPage === 1 ? postsResponse.data : [...prev, ...postsResponse.data]))
        setPostsHasMore(postsResponse.pagination.page < postsResponse.pagination.totalPages)
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load bookmarks")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoadMoreEvents = () => {
    setEventsPage((prev) => prev + 1)
  }

  const handleLoadMorePosts = () => {
    setPostsPage((prev) => prev + 1)
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10">
        <FeedHeader />
        <div className="container mx-auto px-4 py-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Please log in to view your bookmarks</p>
          </div>
        </div>
      </div>
    )
  }

  const totalCount = events.length + posts.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10">
      <FeedHeader />

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Bookmark className="w-6 h-6 text-foreground" />
            <h1 className="text-2xl font-bold text-foreground">Bookmarks</h1>
            {totalCount > 0 && (
              <span className="text-sm text-muted-foreground">({totalCount} saved)</span>
            )}
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "all" | "events" | "posts")}>
            <TabsList className="mb-6">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="events">
                <Calendar className="w-4 h-4 mr-2" />
                Events ({events.length})
              </TabsTrigger>
              <TabsTrigger value="posts">
                <FileText className="w-4 h-4 mr-2" />
                Posts ({posts.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-6">
              {isLoading && eventsPage === 1 && postsPage === 1 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Loading bookmarks...</p>
                </div>
              ) : totalCount === 0 ? (
                <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                  <CardContent className="p-12 text-center">
                    <Bookmark className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No bookmarks yet</h3>
                    <p className="text-muted-foreground">
                      Start bookmarking events and posts to see them here!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Events Section */}
                  {events.length > 0 && (
                    <div>
                      <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Saved Events
                      </h2>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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
                              isBookmarked: true,
                            }}
                          />
                        ))}
                      </div>
                      {eventsHasMore && (
                        <div className="text-center mb-8">
                          <Button variant="outline" onClick={handleLoadMoreEvents}>
                            Load More Events
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Posts Section */}
                  {posts.length > 0 && (
                    <div>
                      <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Saved Posts
                      </h2>
                      <div className="space-y-4 mb-8">
                        {posts.map((post) => (
                          <UserPost key={post.id} post={post} />
                        ))}
                      </div>
                      {postsHasMore && (
                        <div className="text-center mb-8">
                          <Button variant="outline" onClick={handleLoadMorePosts}>
                            Load More Posts
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="events" className="space-y-6">
              {isLoading && eventsPage === 1 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Loading events...</p>
                </div>
              ) : events.length === 0 ? (
                <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                  <CardContent className="p-12 text-center">
                    <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No saved events</h3>
                    <p className="text-muted-foreground">Start bookmarking events to see them here!</p>
                  </CardContent>
                </Card>
              ) : (
                <>
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
                          isBookmarked: true,
                        }}
                      />
                    ))}
                  </div>
                  {eventsHasMore && (
                    <div className="text-center mt-12">
                      <Button variant="outline" size="lg" onClick={handleLoadMoreEvents}>
                        Load More Events
                      </Button>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="posts" className="space-y-6">
              {isLoading && postsPage === 1 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Loading posts...</p>
                </div>
              ) : posts.length === 0 ? (
                <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                  <CardContent className="p-12 text-center">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No saved posts</h3>
                    <p className="text-muted-foreground">Start bookmarking posts to see them here!</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="space-y-4">
                    {posts.map((post) => (
                      <UserPost key={post.id} post={post} />
                    ))}
                  </div>
                  {postsHasMore && (
                    <div className="text-center mt-12">
                      <Button variant="outline" size="lg" onClick={handleLoadMorePosts}>
                        Load More Posts
                      </Button>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}












