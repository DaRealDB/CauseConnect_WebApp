"use client"

import { useEffect, useState } from "react"
import { FeedHeader } from "@/components/feed-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import { postService } from "@/lib/api/services"
import type { Post } from "@/lib/api/types"
import { toast } from "sonner"
import { VolumeX } from "lucide-react"

interface MutedPostWithState extends Post {
  _isRemoving?: boolean
}

export default function MutedPostsPage() {
  const { isAuthenticated } = useAuth()
  const [posts, setPosts] = useState<MutedPostWithState[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      loadMutedPosts(1, false)
    } else {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  const loadMutedPosts = async (targetPage: number, append: boolean) => {
    try {
      if (append) {
        setIsLoadingMore(true)
      } else {
        setIsLoading(true)
      }

      const response = await postService.getMutedPosts({
        page: targetPage,
        limit: 10,
      })

      setPosts((prev) =>
        append ? [...prev, ...response.data] : (response.data as MutedPostWithState[]),
      )
      setHasMore(response.pagination.page < response.pagination.totalPages)
      setPage(response.pagination.page)
    } catch (error: any) {
      toast.error(error.message || "Failed to load muted posts")
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }

  const handleLoadMore = () => {
    if (hasMore && !isLoadingMore) {
      loadMutedPosts(page + 1, true)
    }
  }

  const handleUnmute = async (postId: number | string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, _isRemoving: true } : p)),
    )

    try {
      await postService.unmutePost(postId)
      toast.success("Post unmuted")

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("post_unmuted", { detail: { postId } }),
        )
      }

      setTimeout(() => {
        setPosts((prev) => prev.filter((p) => p.id !== postId))
      }, 250)
    } catch (error: any) {
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, _isRemoving: false } : p)),
      )
      toast.error(error.message || "Failed to unmute post")
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10">
        <FeedHeader />
        <div className="container mx-auto px-4 py-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Please log in to view your muted posts</p>
          </div>
        </div>
      </div>
    )
  }

  const totalCount = posts.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10">
      <FeedHeader />

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <VolumeX className="w-6 h-6 text-foreground" />
            <h1 className="text-2xl font-bold text-foreground">Muted Posts</h1>
            {totalCount > 0 && (
              <span className="text-sm text-muted-foreground">({totalCount} muted)</span>
            )}
          </div>

          {isLoading && page === 1 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading muted posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
              <CardContent className="p-12 text-center">
                <VolumeX className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No muted posts</h3>
                <p className="text-muted-foreground">
                  You haven&apos;t muted any posts yet. Use the three-dot menu on a post in your
                  feed to mute it.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <Card
                  key={post.id}
                  className={`border-0 shadow-lg bg-card/80 backdrop-blur-sm overflow-hidden transition-all duration-300 ${
                    post._isRemoving ? "opacity-0 translate-y-2 scale-[0.98]" : "opacity-100"
                  }`}
                >
                  <CardContent className="p-6 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">@{post.user.username}</p>
                        <p className="font-semibold text-foreground line-clamp-2">
                          {post.content}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnmute(post.id)}
                        disabled={post._isRemoving}
                      >
                        Unmute
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {hasMore && (
                <div className="text-center mt-4">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                  >
                    {isLoadingMore ? "Loading..." : "Load More"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
