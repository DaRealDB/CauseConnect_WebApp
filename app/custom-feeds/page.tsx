"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FeedHeader } from "@/components/feed-header"
import { Plus, Trash2, Edit, ArrowRight } from "lucide-react"
import { customFeedService, type CustomFeed } from "@/lib/api/services"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function CustomFeedsPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [feeds, setFeeds] = useState<CustomFeed[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isAuthenticated) {
      loadFeeds()
    }
  }, [isAuthenticated])

  const loadFeeds = async () => {
    try {
      setIsLoading(true)
      const data = await customFeedService.getFeeds()
      setFeeds(data)
    } catch (error: any) {
      toast.error(error.message || "Failed to load custom feeds")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await customFeedService.deleteFeed(id)
      toast.success("Custom feed deleted")
      loadFeeds()
    } catch (error: any) {
      toast.error(error.message || "Failed to delete custom feed")
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10">
        <FeedHeader />
        <div className="container mx-auto px-4 py-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Please log in to view your custom feeds</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10">
      <FeedHeader />

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Custom Feeds</h1>
              <p className="text-muted-foreground mt-2">Create personalized feeds based on your interests</p>
            </div>
            <Button onClick={() => router.push("/custom-feeds/create")}>
              <Plus className="w-4 h-4 mr-2" />
              Create Feed
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading feeds...</p>
            </div>
          ) : feeds.length === 0 ? (
            <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
              <CardContent className="p-12 text-center">
                <Plus className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No custom feeds yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first custom feed to personalize your content discovery.
                </p>
                <Button onClick={() => router.push("/custom-feeds/create")}>
                  Create Your First Feed
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {feeds.map((feed) => (
                <Card key={feed.id} className="border-0 shadow-lg bg-card/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{feed.name}</span>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/custom-feeds/${feed.id}`)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Custom Feed?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete "{feed.name}". This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(feed.id)}
                                className="bg-destructive text-destructive-foreground"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardTitle>
                    <CardDescription>
                      {feed.tags.length} {feed.tags.length === 1 ? "tag" : "tags"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {feed.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-xs bg-secondary px-2 py-1 rounded">
                          {tag}
                        </span>
                      ))}
                      {feed.tags.length > 3 && (
                        <span className="text-xs text-muted-foreground">+{feed.tags.length - 3} more</span>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push(`/custom-feeds/${feed.id}`)}
                    >
                      View Feed
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}














