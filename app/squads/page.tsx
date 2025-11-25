"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { FeedHeader } from "@/components/feed-header"
import { Plus, Users, ArrowRight } from "lucide-react"
import { squadService, type Squad } from "@/lib/api/services"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import { getImageUrl } from "@/lib/utils"

export default function SquadsPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [squads, setSquads] = useState<Squad[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isAuthenticated) {
      loadSquads()
    }
  }, [isAuthenticated])

  const loadSquads = async () => {
    try {
      setIsLoading(true)
      const data = await squadService.getSquads()
      setSquads(data)
    } catch (error: any) {
      toast.error(error.message || "Failed to load squads")
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
            <p className="text-muted-foreground">Please log in to view your squads</p>
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
              <h1 className="text-3xl font-bold text-foreground">Squads</h1>
              <p className="text-muted-foreground mt-2">Join communities and connect with like-minded supporters</p>
            </div>
            <Button onClick={() => router.push("/squads/create")}>
              <Plus className="w-4 h-4 mr-2" />
              Create Squad
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading squads...</p>
            </div>
          ) : squads.length === 0 ? (
            <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
              <CardContent className="p-12 text-center">
                <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No squads yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create or join a squad to connect with others who share your passion for causes.
                </p>
                <Button onClick={() => router.push("/squads/create")}>
                  Create Your First Squad
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {squads.map((squad) => (
                <Card
                  key={squad.id}
                  className="border-0 shadow-lg bg-card/80 backdrop-blur-sm hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => router.push(`/squads/${squad.id}/discussion`)}
                >
                  <CardHeader>
                    <div className="flex items-center gap-4 mb-4">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={getImageUrl(squad.avatar)} />
                        <AvatarFallback>{squad.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <CardTitle>{squad.name}</CardTitle>
                        {squad.role && (
                          <Badge variant="secondary" className="mt-1">
                            {squad.role}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardDescription className="line-clamp-2">{squad.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>{squad.members} {squad.members === 1 ? "member" : "members"}</span>
                      </div>
                      <Button variant="ghost" size="sm">
                        View
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
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


