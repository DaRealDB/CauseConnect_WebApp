"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { FeedHeader } from "@/components/feed-header"
import { EventCard } from "@/components/event-card"
import { UserPost } from "@/components/user-post"
import { SquadCard } from "@/components/squad-card"
import { exploreService, eventService, postService, squadService } from "@/lib/api/services"
import type { Event, Post, Squad, ExploreContent } from "@/lib/api/types"
import { toast } from "sonner"
import { Compass } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useSearchParams, useRouter } from "next/navigation"

type ExploreFilter = 'all' | 'groups' | 'posts' | 'events'

export default function ExplorePage() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Get filter from URL or default to 'all'
  const initialFilter = (searchParams.get('filter') as ExploreFilter) || 'all'
  const [activeFilter, setActiveFilter] = useState<ExploreFilter>(initialFilter)
  
  // Content state
  const [allContent, setAllContent] = useState<ExploreContent[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [squads, setSquads] = useState<Squad[]>([])
  
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  // Update filter from URL changes
  useEffect(() => {
    const filter = (searchParams.get('filter') as ExploreFilter) || 'all'
    setActiveFilter(filter)
  }, [searchParams])

  useEffect(() => {
    loadContent()
  }, [page, activeFilter, isAuthenticated])

  const loadContent = async () => {
    try {
      setIsLoading(true)

      switch (activeFilter) {
        case 'all':
          await loadAllContent()
          break
        case 'groups':
          await loadGroups()
          break
        case 'posts':
          await loadPosts()
          break
        case 'events':
          await loadEvents()
          break
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load content")
    } finally {
      setIsLoading(false)
    }
  }

  const loadAllContent = async () => {
    const response = await exploreService.getExploreContent({
      filter: 'all',
      page,
      limit: 10,
      excludeUserTags: isAuthenticated,
    })
    
    setAllContent((prev) => (page === 1 ? response.data : [...prev, ...response.data]))
    setHasMore(response.pagination.page < response.pagination.totalPages)
  }

  const loadGroups = async () => {
    const response = await exploreService.getExploreContent({
      filter: 'groups',
      page,
      limit: 10,
    })
    
    // When filter is 'groups', data is already Squad[] directly (not wrapped in ExploreContent)
    // Check if items are ExploreContent objects or Squad objects directly
    const squadsData = response.data.map((item: any) => {
      // If item has .data property, it's ExploreContent wrapper, extract it
      // Otherwise, it's already a Squad object
      return (item.data || item) as Squad
    }).filter((squad): squad is Squad => squad !== null && squad !== undefined && squad.id !== undefined)
    
    setSquads((prev) => (page === 1 ? squadsData : [...prev, ...squadsData]))
    setHasMore(response.pagination.page < response.pagination.totalPages)
  }

  const loadPosts = async () => {
    const response = await exploreService.getExploreContent({
      filter: 'posts',
      page,
      limit: 10,
      excludeUserTags: isAuthenticated,
    })
    
    // When filter is 'posts', data is already Post[] directly (not wrapped in ExploreContent)
    const postsData = response.data.map((item: any) => {
      return (item.data || item) as Post
    }).filter((post): post is Post => post !== null && post !== undefined && post.id !== undefined)
    
    setPosts((prev) => (page === 1 ? postsData : [...prev, ...postsData]))
    setHasMore(response.pagination.page < response.pagination.totalPages)
  }

  const loadEvents = async () => {
    const response = await exploreService.getExploreContent({
      filter: 'events',
      page,
      limit: 10,
      excludeUserTags: isAuthenticated,
    })
    
    // When filter is 'events', data is already Event[] directly (not wrapped in ExploreContent)
    const eventsData = response.data.map((item: any) => {
      return (item.data || item) as Event
    }).filter((event): event is Event => event !== null && event !== undefined && event.id !== undefined)
    
    setEvents((prev) => (page === 1 ? eventsData : [...prev, ...eventsData]))
    setHasMore(response.pagination.page < response.pagination.totalPages)
  }

  const handleFilterChange = (filter: ExploreFilter) => {
    setActiveFilter(filter)
    setPage(1)
    setAllContent([])
    setEvents([])
    setPosts([])
    setSquads([])
    setHasMore(true)
    
    // Update URL without navigation
    const params = new URLSearchParams(searchParams.toString())
    params.set('filter', filter)
    router.push(`/explore?${params.toString()}`, { scroll: false })
  }

  const handleLoadMore = () => {
    setPage((prev) => prev + 1)
  }

  const renderContent = () => {
    if (activeFilter === 'all') {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {allContent.map((item) => {
            if (item.type === 'event') {
              const event = item.data as Event
              return (
                <EventCard
                  key={`event-${item.id}`}
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
                    isBookmarked: event.isBookmarked,
                  }}
                />
              )
            } else if (item.type === 'post') {
              const post = item.data as Post
              return (
                <UserPost
                  key={`post-${item.id}`}
                  post={{
                    id: post.id,
                    user: post.user,
                    content: post.content,
                    image: post.image,
                    timestamp: post.timestamp,
                    likes: post.likes,
                    comments: post.comments,
                    participants: post.participants,
                    shares: post.shares || 0,
                    liked: post.liked,
                    bookmarked: post.bookmarked,
                    isParticipating: post.isParticipating,
                  }}
                />
              )
            } else if (item.type === 'squad') {
              const squad = item.data as Squad
              return (
                <SquadCard
                  key={`squad-${item.id}`}
                  squad={squad}
                />
              )
            }
            return null
          })}
        </div>
      )
    } else if (activeFilter === 'groups') {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {squads
            .filter((squad): squad is Squad => squad !== null && squad !== undefined && squad.id !== undefined)
            .map((squad) => (
              <SquadCard key={squad.id} squad={squad} />
            ))}
        </div>
      )
    } else if (activeFilter === 'posts') {
      return (
        <div className="space-y-6">
          {posts.map((post) => (
            <UserPost
              key={post.id}
              post={{
                id: post.id,
                user: post.user,
                content: post.content,
                image: post.image,
                timestamp: post.timestamp,
                likes: post.likes,
                comments: post.comments,
                participants: post.participants,
                shares: post.shares || 0,
                liked: post.liked,
                bookmarked: post.bookmarked,
                isParticipating: post.isParticipating,
              }}
            />
          ))}
        </div>
      )
    } else if (activeFilter === 'events') {
      return (
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
                isBookmarked: event.isBookmarked,
              }}
            />
          ))}
        </div>
      )
    }
    return null
  }

  const getEmptyMessage = () => {
    switch (activeFilter) {
      case 'all':
        return 'No content found'
      case 'groups':
        return 'No groups found'
      case 'posts':
        return 'No posts found'
      case 'events':
        return 'No events found'
    }
  }

  const hasContent = () => {
    switch (activeFilter) {
      case 'all':
        return allContent.length > 0
      case 'groups':
        return squads.length > 0
      case 'posts':
        return posts.length > 0
      case 'events':
        return events.length > 0
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10">
      <FeedHeader />

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Compass className="w-6 h-6 text-foreground" />
            <h1 className="text-2xl font-bold text-foreground">Explore</h1>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            <Button
              size="sm"
              variant={activeFilter === 'all' ? 'default' : 'outline'}
              onClick={() => handleFilterChange('all')}
            >
              All
            </Button>
            <Button
              size="sm"
              variant={activeFilter === 'groups' ? 'default' : 'outline'}
              onClick={() => handleFilterChange('groups')}
            >
              Groups
            </Button>
            <Button
              size="sm"
              variant={activeFilter === 'posts' ? 'default' : 'outline'}
              onClick={() => handleFilterChange('posts')}
            >
              Posts
            </Button>
            <Button
              size="sm"
              variant={activeFilter === 'events' ? 'default' : 'outline'}
              onClick={() => handleFilterChange('events')}
            >
              Events
            </Button>
          </div>

          {isLoading && page === 1 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading content...</p>
            </div>
          ) : !hasContent() ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{getEmptyMessage()}</p>
            </div>
          ) : (
            <>
              {renderContent()}

              {hasMore && !isLoading && (
                <div className="text-center mt-12">
                  <Button variant="outline" size="lg" onClick={handleLoadMore}>
                    Load More
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}



