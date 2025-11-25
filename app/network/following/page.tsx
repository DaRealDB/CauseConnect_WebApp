"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FeedHeader } from "@/components/feed-header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { userService } from "@/lib/api/services"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import { Users, UserCheck, CheckCircle } from "lucide-react"
import Link from "next/link"
import { getImageUrl } from "@/lib/utils"
import type { User } from "@/lib/api/types"

export default function FollowingPage() {
  const { user: currentUser, isAuthenticated } = useAuth()
  const [following, setFollowing] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      if (page === 1) {
        setFollowing([]) // Reset on initial load
      }
      loadFollowing()
    } else {
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, currentUser, page])

  const loadFollowing = async () => {
    if (!currentUser?.id) return
    
    try {
      setIsLoading(true)
      const response = await userService.getFollowingUsers({
        page,
        limit: 20,
      })
      
      setFollowing((prev) => 
        page === 1 ? response.data : [...prev, ...response.data]
      )
      setHasMore(response.pagination.page < response.pagination.totalPages)
    } catch (error: any) {
      toast.error(error.message || "Failed to load following list")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoadMore = () => {
    setPage((prev) => prev + 1)
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10">
        <FeedHeader />
        <div className="container mx-auto px-4 py-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Please log in to view your following list</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10">
      <FeedHeader />

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <UserCheck className="w-6 h-6 text-foreground" />
            <h1 className="text-2xl font-bold text-foreground">Following</h1>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : following.length === 0 ? (
            <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
              <CardContent className="p-12 text-center">
                <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Not following anyone yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start following users to see their updates in your feed.
                </p>
                <Button asChild>
                  <Link href="/network">Find People to Follow</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {following.map((user) => (
                  <Card 
                    key={user.id} 
                    className="border-0 shadow-lg bg-card/80 backdrop-blur-sm hover:shadow-xl transition-shadow"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Link href={`/profile/${user.username}`}>
                          <Avatar className="w-16 h-16">
                            <AvatarImage src={getImageUrl(user.avatar)} />
                            <AvatarFallback>
                              {user.name?.[0] || user.username?.[0] || "U"}
                            </AvatarFallback>
                          </Avatar>
                        </Link>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Link href={`/profile/${user.username}`}>
                              <h3 className="font-semibold text-foreground hover:text-primary transition-colors truncate">
                                {user.name || user.username}
                              </h3>
                            </Link>
                            {user.verified && (
                              <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                            )}
                          </div>
                          <Link href={`/profile/${user.username}`}>
                            <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
                          </Link>
                          {user.bio && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                              {user.bio}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {hasMore && (
                <div className="text-center mt-8">
                  <Button variant="outline" onClick={handleLoadMore} disabled={isLoading}>
                    {isLoading ? "Loading..." : "Load More"}
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


