"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FeedHeader } from "@/components/feed-header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { userService } from "@/lib/api/services"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import { getImageUrl } from "@/lib/utils"
import { Users, UserPlus, Plus } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function NetworkPage() {
  const router = useRouter()
  const { user: currentUser, isAuthenticated } = useAuth()
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isAuthenticated) {
      loadSuggestedUsers()
    } else {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  const loadSuggestedUsers = async () => {
    try {
      setIsLoading(true)
      // For now, show empty - backend should implement user suggestions
      setSuggestedUsers([])
    } catch (error: any) {
      toast.error(error.message || "Failed to load suggestions")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10">
        <FeedHeader />
        <div className="container mx-auto px-4 py-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Please log in to view suggested users</p>
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
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-foreground" />
              <h1 className="text-2xl font-bold text-foreground">Find People</h1>
            </div>
            <Button onClick={() => router.push("/squads/create")}>
              <Plus className="w-4 h-4 mr-2" />
              Create Squad
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading suggestions...</p>
            </div>
          ) : suggestedUsers.length === 0 ? (
            <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
              <CardContent className="p-12 text-center">
                <UserPlus className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No suggestions available</h3>
                <p className="text-muted-foreground">
                  User suggestions will appear here based on your interests and activity.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {suggestedUsers.map((user) => (
                <Card key={user.id} className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <Link href={`/profile/${user.username}`}>
                        <Avatar className="w-16 h-16">
                          <AvatarImage src={getImageUrl(user.avatar)} />
                          <AvatarFallback>{user.name?.[0] || user.username[0]}</AvatarFallback>
                        </Avatar>
                      </Link>
                      <div className="flex-1">
                        <Link href={`/profile/${user.username}`}>
                          <h3 className="font-semibold text-foreground hover:text-primary transition-colors">
                            {user.name || user.username}
                          </h3>
                        </Link>
                        <p className="text-sm text-muted-foreground">@{user.username}</p>
                        {user.bio && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{user.bio}</p>}
                      </div>
                    </div>
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



