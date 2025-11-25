"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FeedHeader } from "@/components/feed-header"
import { Input } from "@/components/ui/input"
import { Search, Sparkles, TrendingUp, Users, Heart } from "lucide-react"
import { eventService, userService, squadService } from "@/lib/api/services"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import { EventCard } from "@/components/event-card"
import type { Event, User, Squad } from "@/lib/api/types"
import { getImageUrl } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

const FLOATING_WORDS = [
  "Education",
  "Environment",
  "Health",
  "Poverty",
  "Animals",
  "Human Rights",
  "Disaster Relief",
  "Community",
  "Technology",
  "Youth",
  "Mental Health",
  "Elderly Care",
]

export default function DiscoverPage() {
  const { isAuthenticated } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [events, setEvents] = useState<Event[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [squads, setSquads] = useState<Squad[]>([])
  const [floatingWords, setFloatingWords] = useState<string[]>(FLOATING_WORDS)

  useEffect(() => {
    // Animate floating words
    const interval = setInterval(() => {
      if (!isSearching && searchQuery === "") {
        setFloatingWords((prev) => {
          const shuffled = [...prev].sort(() => Math.random() - 0.5)
          return shuffled
        })
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [isSearching, searchQuery])

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setEvents([])
      setUsers([])
      setSquads([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    try {
      const [eventsResponse, usersResponse, squadsResponse] = await Promise.allSettled([
        eventService.getEvents({ search: query, limit: 10 }),
        userService.searchUsers(query, 10),
        squadService.searchSquads(query, 10),
      ])

      if (eventsResponse.status === "fulfilled") {
        setEvents(eventsResponse.value.data)
      }
      if (usersResponse.status === "fulfilled") {
        setUsers(usersResponse.value)
      }
      if (squadsResponse.status === "fulfilled") {
        setSquads(squadsResponse.value)
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to search")
    } finally {
      setIsSearching(false)
    }
  }

  const handleInputChange = (value: string) => {
    setSearchQuery(value)
    if (value.trim()) {
      handleSearch(value)
    } else {
      setEvents([])
      setUsers([])
      setSquads([])
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10">
      <FeedHeader />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Search Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">Discover</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Find new causes, people, and opportunities to make a difference
            </p>

            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search causes, organizations, people, or squads..."
                value={searchQuery}
                onChange={(e) => handleInputChange(e.target.value)}
                className="pl-12 h-14 text-lg bg-background/50 backdrop-blur-sm border-2"
              />
            </div>

            {/* Floating Words Animation */}
            {!isSearching && searchQuery === "" && (
              <div className="relative h-64 mt-12 overflow-hidden">
                {floatingWords.slice(0, 8).map((word, index) => {
                  const delay = index * 0.2
                  const x = (index % 4) * 25 + 10
                  const y = Math.floor(index / 4) * 40 + 20
                  return (
                    <div
                      key={`${word}-${index}`}
                      className="absolute animate-pulse"
                      style={{
                        left: `${x}%`,
                        top: `${y}%`,
                        animationDelay: `${delay}s`,
                        animationDuration: `${2 + Math.random()}s`,
                      }}
                    >
                      <span className="text-2xl font-semibold text-primary/60 hover:text-primary transition-colors cursor-pointer">
                        {word}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Search Results */}
          {isSearching && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Searching...</p>
            </div>
          )}

          {!isSearching && searchQuery && (
            <div className="space-y-8">
              {/* Events Results */}
              {events.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Heart className="w-5 h-5 text-primary" />
                    <h2 className="text-2xl font-bold text-foreground">Causes</h2>
                  </div>
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
                </div>
              )}

              {/* Users Results */}
              {users.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-5 h-5 text-primary" />
                    <h2 className="text-2xl font-bold text-foreground">People</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {users.map((user) => (
                      <Card
                        key={user.id}
                        className="border-0 shadow-lg bg-card/80 backdrop-blur-sm hover:shadow-xl transition-shadow cursor-pointer"
                        onClick={() => window.location.href = `/profile/${user.username}`}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-center gap-4">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={getImageUrl(user.avatar)} />
                              <AvatarFallback>
                                {user.name?.split(" ").map((n) => n[0]).join("") || user.username?.[0] || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-foreground">{user.name || user.username}</h3>
                                {user.verified && (
                                  <Badge variant="secondary" className="text-xs px-1">✓</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">@{user.username}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Squads Results */}
              {squads.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-5 h-5 text-primary" />
                    <h2 className="text-2xl font-bold text-foreground">Squads</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {squads.map((squad) => (
                      <Card
                        key={squad.id}
                        className="border-0 shadow-lg bg-card/80 backdrop-blur-sm hover:shadow-xl transition-shadow cursor-pointer"
                        onClick={() => window.location.href = `/squads/${squad.id}/discussion`}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-center gap-4">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={getImageUrl(squad.avatar)} />
                              <AvatarFallback>{squad.name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h3 className="font-semibold text-foreground">{squad.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {squad.members} {squad.members === 1 ? "member" : "members"}
                              </p>
                              {squad.description && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {squad.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* No Results */}
              {events.length === 0 && users.length === 0 && squads.length === 0 && (
                <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                  <CardContent className="p-12 text-center">
                    <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No results found</h3>
                    <p className="text-muted-foreground">Try searching for something else.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Trending Section (when not searching) */}
          {!isSearching && !searchQuery && (
            <div className="mt-12">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">Trending Now</h2>
              </div>
              <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                <CardContent className="p-8 text-center">
                  <Sparkles className="w-16 h-16 mx-auto mb-4 text-primary opacity-50" />
                  <p className="text-muted-foreground">
                    Start typing to discover trending causes and connect with passionate supporters.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


