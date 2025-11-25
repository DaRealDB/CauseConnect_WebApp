"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Filter, X } from "lucide-react"
import Link from "next/link"
import { FeedHeader } from "@/components/feed-header"
import { EventCard } from "@/components/event-card"
import { UserPost } from "@/components/user-post"
import { eventService, postService, settingsService } from "@/lib/api/services"
import type { Event, Post } from "@/lib/api/types"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"

export default function FeedPage() {
  const { user, isAuthenticated } = useAuth()
  const [activeFilter, setActiveFilter] = useState<"all" | "events" | "updates">("all")
  const [events, setEvents] = useState<Event[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [userInterestTags, setUserInterestTags] = useState<string[]>([])
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [filterFollowing, setFilterFollowing] = useState(false)

  // Check URL params for filter
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const filter = params.get('filter')
      if (filter === 'following') {
        setFilterFollowing(true)
      }
    }
  }, [])

  const [tagsLoaded, setTagsLoaded] = useState(false)

  // Fetch user settings to get interest tags
  useEffect(() => {
    if (isAuthenticated) {
      const fetchUserSettings = async () => {
        try {
          const settings = await settingsService.getSettings()
          const interestTags = settings.personalization?.interestTags || []
          setUserInterestTags(interestTags)
          // DO NOT auto-select tags in filters - filters are for manual use only
          // Feed will still filter by userInterestTags in the background (strict filtering)
          // But filter UI remains empty until user manually selects tags
          setTagsLoaded(true) // Mark tags as loaded
        } catch (error) {
          // Silently fail - user might not have settings yet
          console.error("Failed to fetch user settings:", error)
          setTagsLoaded(true) // Mark as loaded even on error (to prevent infinite waiting)
        }
      }
      fetchUserSettings()
    } else {
      setTagsLoaded(true) // If not authenticated, mark as loaded (no filtering needed)
    }
  }, [isAuthenticated])

  // Refresh feed when userInterestTags change (e.g., after settings update)
  // BUT don't auto-select tags in filters - filters are for manual use only
  useEffect(() => {
    // Just update userInterestTags, don't change selectedTags
    // Feed filtering will use userInterestTags in background
    // Filters remain independent for user to manually select
  }, [userInterestTags])

  // Listen for custom events and storage events to detect when tags are updated in settings
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const handleSettingsUpdate = async () => {
      // Reload settings if tags were updated
      if (isAuthenticated) {
        try {
          const settings = await settingsService.getSettings()
          const interestTags = settings.personalization?.interestTags || []
          console.log("🔄 Feed: Tags updated in settings, refreshing feed with tags:", interestTags)
          setUserInterestTags(interestTags)
          // Don't update selectedTags - filters remain independent
          // Feed will use userInterestTags for background filtering
          // Reload feed with new tags
          setPage(1)
          setEvents([])
          setPosts([])
        } catch (error) {
          console.error("Failed to refresh settings:", error)
        }
      }
    }
    
    // Listen for custom event dispatched from settings page
    window.addEventListener('settings_updated', handleSettingsUpdate)
    // Also listen for storage events (cross-tab sync)
    window.addEventListener('storage', (e) => {
      if (e.key === 'settings_updated' || e.key === 'interest_tags_updated') {
        handleSettingsUpdate()
      }
    })
    
    return () => {
      window.removeEventListener('settings_updated', handleSettingsUpdate)
      window.removeEventListener('storage', handleSettingsUpdate)
    }
  }, [isAuthenticated])

  // Extract all available tags from events and posts
  useEffect(() => {
    const allTags = new Set<string>()
    events.forEach((event) => {
      event.tags?.forEach((tag) => allTags.add(tag))
    })
    posts.forEach((post) => {
      post.tags?.forEach((tag) => allTags.add(tag))
    })
    setAvailableTags(Array.from(allTags).sort())
  }, [events, posts])

  useEffect(() => {
    // CRITICAL: Don't load feed until tags are loaded (for authenticated users)
    // This ensures we always filter by tags when they exist
    if (!isAuthenticated || tagsLoaded) {
      loadFeed()
    }
  }, [activeFilter, page, searchQuery, selectedTags, userInterestTags, tagsLoaded, isAuthenticated])

  // Refresh feed when page becomes visible (user returns from create page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setPage(1)
        setEvents([])
        setPosts([])
        loadFeed()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [activeFilter, searchQuery, selectedTags])

  const loadFeed = async () => {
    try {
      setIsLoading(true)

      // STRICT FILTERING: Always filter by user's saved interest tags by default
      // UNLESS user manually selects different tags in the feed filter
      
      // Check if we're using user's default tags or manually selected tags
      const tagsMatch = selectedTags.length === userInterestTags.length &&
                        selectedTags.length > 0 &&
                        selectedTags.every(tag => userInterestTags.includes(tag)) &&
                        userInterestTags.every(tag => selectedTags.includes(tag))
      
      // CRITICAL: Always enforce strict filtering (unless search is active)
      // Search bypasses tag filtering to allow discovery
      const shouldFilterByTags = isAuthenticated && !searchQuery.trim()
      
      // Determine which tags to use for filtering:
      // CRITICAL: If user has selected tags, ALWAYS pass them explicitly (more reliable than DB query)
      // This ensures strict filtering with the exact tags the user selected
      const hasSavedTags = userInterestTags.length > 0
      const hasSelectedTags = selectedTags.length > 0
      
      // If user has selected tags, use them directly (even if they match saved tags)
      // This avoids any timing issues with DB queries
      const useManualTags = hasSelectedTags && shouldFilterByTags
      const manualTags = useManualTags ? [...selectedTags] : undefined
      
      // Only use requireUserTags if no tags are selected but saved tags exist
      // This handles the case where tags haven't been explicitly selected yet
      const useBackendTagFilter = !hasSelectedTags && hasSavedTags && shouldFilterByTags

      // Load events if filter is "all" or "events"
      if (activeFilter === "all" || activeFilter === "events") {
        // CRITICAL: Log filtering parameters for debugging
        console.log("🔍 [Feed] Loading events with filters:", {
          manualTags,
          useBackendTagFilter,
          selectedTags,
          userInterestTags,
          shouldFilterByTags,
        })
        
        const eventsResponse = await eventService.getEvents({
          page,
          limit: filterFollowing ? 50 : 10,
          filter: "events",
          search: searchQuery.trim() || undefined,
          tags: manualTags, // Pass manually selected tags if different from saved tags (STRICT)
          requireUserTags: useBackendTagFilter, // Use backend tag filtering for saved tags (STRICT)
        })
        
        console.log("📊 [Feed] Events received:", eventsResponse.data.length, "events")
        if (eventsResponse.data.length > 0) {
          eventsResponse.data.forEach(event => {
            console.log("  - Event:", event.title, "| Tags:", event.tags)
          })
        }
        
        setEvents((prev) => (page === 1 ? eventsResponse.data : [...prev, ...eventsResponse.data]))
        setHasMore(eventsResponse.pagination.page < eventsResponse.pagination.totalPages)
      }

      // Load posts if filter is "all" or "updates"
      if (activeFilter === "all" || activeFilter === "updates") {
        // CRITICAL: Log filtering parameters for debugging
        console.log("🔍 [Feed] Loading posts with filters:", {
          manualTags,
          useBackendTagFilter,
          selectedTags,
          userInterestTags,
          shouldFilterByTags,
        })
        
        const postsResponse = await postService.getPosts({
          page,
          limit: 10,
          tags: manualTags, // Pass manually selected tags if different from saved tags (STRICT)
          requireUserTags: useBackendTagFilter, // Use backend tag filtering for saved tags (STRICT)
        })
        
        console.log("📊 [Feed] Posts received:", postsResponse.data.length, "posts")
        if (postsResponse.data.length > 0) {
          postsResponse.data.forEach(post => {
            console.log("  - Post:", post.content?.substring(0, 50), "| Tags:", post.tags)
          })
        }
        
        setPosts((prev) => (page === 1 ? postsResponse.data : [...prev, ...postsResponse.data]))
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load feed")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoadMore = () => {
    setPage((prev) => prev + 1)
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setPage(1) // Reset to first page on search
    setEvents([])
    setPosts([])
  }

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tag)) {
        return prev.filter((t) => t !== tag)
      } else {
        return [...prev, tag]
      }
    })
    setPage(1) // Reset to first page when tags change
    setEvents([])
    setPosts([])
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedTags([]) // Clear filter selection - filters are independent
    setPage(1)
    setEvents([])
    setPosts([])
  }

  // Combine all unique tags for filter dropdown
  const allFilterTags = useMemo(() => {
    const tags = new Set<string>(availableTags)
    userInterestTags.forEach((tag) => tags.add(tag))
    return Array.from(tags).sort()
  }, [availableTags, userInterestTags])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10">
      <FeedHeader searchQuery={searchQuery} onSearchChange={handleSearchChange} />

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-6xl mx-auto">
          {/* Feed Controls */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-foreground">Your Feed</h1>
              <div className="flex items-center gap-3">
                <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                  <PopoverTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Filter className="w-4 h-4 mr-2" />
                      Filter
                      {selectedTags.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {selectedTags.length}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="end">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Filter by Tags</h3>
                        {(selectedTags.length > 0 || searchQuery) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearFilters}
                            className="h-7 text-xs"
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {allFilterTags.length > 0 ? (
                          allFilterTags.map((tag) => (
                            <div key={tag} className="flex items-center space-x-2">
                              <Checkbox
                                id={tag}
                                checked={selectedTags.includes(tag)}
                                onCheckedChange={() => handleTagToggle(tag)}
                              />
                              <label
                                htmlFor={tag}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {tag}
                              </label>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No tags available</p>
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                <Button size="sm" asChild>
                  <Link href="/create">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Post
                  </Link>
                </Button>
              </div>
            </div>

            {/* Filter Tabs */}
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

            {/* Active Filters Display */}
            {(searchQuery || (selectedTags.length > 0 && selectedTags.length !== userInterestTags.length)) && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {searchQuery && (
                  <Badge variant="secondary" className="gap-1">
                    Search: {searchQuery}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => handleSearchChange("")}
                    />
                  </Badge>
                )}
                {selectedTags.length > 0 && selectedTags.length !== userInterestTags.length && (
                  <Badge variant="secondary" className="gap-1">
                    {selectedTags.length} tag{selectedTags.length !== 1 ? 's' : ''}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => setSelectedTags(userInterestTags)}
                    />
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Feed Content */}
          {isLoading && page === 1 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading feed...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Event Cards */}
              {(activeFilter === "all" || activeFilter === "events") &&
                events.map((event) => (
                  <EventCard
                    key={event.id}
                    event={{
                      id: event.id,
                      title: event.title,
                      description: event.description,
                      image: event.image,
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
                      isSupported: event.isSupported,
                    }}
                  />
                ))}

              {/* User Posts */}
              {(activeFilter === "all" || activeFilter === "updates") &&
                posts.map((post) => <UserPost key={post.id} post={post} />)}
            </div>
          )}

          {/* Load More */}
          {hasMore && !isLoading && (
            <div className="text-center mt-12">
              <Button variant="outline" size="lg" onClick={handleLoadMore} disabled={isLoading}>
                {isLoading ? "Loading..." : "Load More Content"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
