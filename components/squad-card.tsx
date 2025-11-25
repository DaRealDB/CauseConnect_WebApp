"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Users, UserPlus, CheckCircle, ArrowRight } from "lucide-react"
import { squadService } from "@/lib/api/services"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { getImageUrl } from "@/lib/utils"
import type { Squad } from "@/lib/api/types"

interface SquadCardProps {
  squad: Squad
  onJoin?: () => void
  onLeave?: () => void
}

export function SquadCard({ squad, onJoin, onLeave }: SquadCardProps) {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const [isJoining, setIsJoining] = useState(false)
  const [isMember, setIsMember] = useState(squad.isMember || false)

  const handleJoin = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isAuthenticated) {
      toast.error("Please log in to join groups")
      return
    }

    try {
      setIsJoining(true)
      if (isMember) {
        await squadService.leaveSquad(squad.id)
        setIsMember(false)
        toast.success("Left group successfully")
        onLeave?.()
      } else {
        await squadService.joinSquad(squad.id)
        setIsMember(true)
        toast.success("Joined group successfully")
        onJoin?.()
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update membership")
    } finally {
      setIsJoining(false)
    }
  }

  const handleView = () => {
    router.push(`/squads/${squad.id}/discussion`)
  }

  const initials = squad.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleView}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Avatar className="w-16 h-16">
            <AvatarImage src={getImageUrl(squad.avatar)} alt={squad.name} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate">{squad.name}</h3>
                {squad.creator && (
                  <p className="text-sm text-muted-foreground">
                    by {squad.creator.name || squad.creator.username}
                  </p>
                )}
              </div>
              {isMember && (
                <Badge variant="secondary" className="shrink-0">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Member
                </Badge>
              )}
            </div>

            {squad.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {squad.description}
              </p>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{squad.members || 0} members</span>
              </div>
              {squad.posts !== undefined && (
                <div className="flex items-center gap-1">
                  <span>{squad.posts} posts</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant={isMember ? "outline" : "default"}
                size="sm"
                onClick={handleJoin}
                disabled={isJoining || !isAuthenticated}
                className="flex-1"
              >
                {isJoining ? (
                  "Loading..."
                ) : isMember ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Joined
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Join Group
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleView}
                className="shrink-0"
              >
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


