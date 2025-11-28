"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Phone, Video, MoreVertical, Settings, Volume2, VolumeX, UserX } from "lucide-react"
import { getImageUrl } from "@/lib/utils"
import { usePresence } from "@/hooks/usePresence"
import { useAuth } from "@/contexts/AuthContext"
import type { ConversationWithParticipants } from "@/hooks/useChat"
import { muteConversation, unmuteConversation, isConversationMuted } from "@/lib/firebase/chat-enhanced"
import { toast } from "sonner"

interface ChatHeaderProps {
  conversationData?: ConversationWithParticipants
  conversationId: string | null
  onGroupSettings?: () => void
}

export function ChatHeader({ conversationData, conversationId, onGroupSettings }: ChatHeaderProps) {
  const { user } = useAuth()
  const [isMuted, setIsMuted] = useState(false)
  const [isOnline, setIsOnline] = useState(false)

  // Get other participant for presence
  const otherParticipantId =
    conversationData?.type === 'private' && conversationData?.otherParticipant
      ? conversationData.otherParticipant.id
      : null

  // Subscribe to presence
  const { subscribeToUser } = usePresence({ userId: user?.id?.toString() || null })

  useEffect(() => {
    if (!otherParticipantId || !conversationId) return

    const unsubscribe = subscribeToUser(otherParticipantId, (presence) => {
      setIsOnline(presence?.isOnline || false)
    })

    return () => {
      unsubscribe()
    }
  }, [otherParticipantId, conversationId, subscribeToUser])

  // Check if muted
  useEffect(() => {
    if (!conversationId || !user?.id) return

    isConversationMuted(conversationId, user.id.toString()).then(setIsMuted).catch(console.error)
  }, [conversationId, user?.id])

  const handleToggleMute = async () => {
    if (!conversationId || !user?.id) return

    try {
      if (isMuted) {
        await unmuteConversation(conversationId, user.id.toString())
        toast.success('Conversation unmuted')
      } else {
        await muteConversation(conversationId, user.id.toString())
        toast.success('Conversation muted')
      }
      setIsMuted(!isMuted)
    } catch (error: any) {
      toast.error(error.message || 'Failed to toggle mute')
    }
  }

  const getParticipantName = (): string => {
    if (conversationData?.type === 'private' && conversationData?.otherParticipant) {
      return conversationData.otherParticipant.name || conversationData.otherParticipant.username || 'Unknown User'
    }
    if (conversationData?.type === 'group') {
      return conversationData.participantsData?.[0]?.name || 'Group Chat'
    }
    return 'Unknown'
  }

  const getParticipantAvatar = (): string | undefined => {
    if (conversationData?.type === 'private' && conversationData?.otherParticipant) {
      return conversationData.otherParticipant.avatar
    }
    if (conversationData?.type === 'group' && conversationData?.participantsData?.[0]) {
      return conversationData.participantsData[0].avatar
    }
    return undefined
  }

  const getParticipantInitials = (): string => {
    const name = getParticipantName()
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getStatusText = (): string => {
    if (conversationData?.type === 'group') {
      const count = conversationData.participantsData?.length || 0
      return `${count} member${count !== 1 ? 's' : ''}`
    }
    return isOnline ? 'Online' : 'Last seen recently'
  }

  return (
    <div className="p-4 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage src={getImageUrl(getParticipantAvatar())} />
              <AvatarFallback>{getParticipantInitials()}</AvatarFallback>
            </Avatar>
            {otherParticipantId && isOnline && (
              <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-background rounded-full" />
            )}
          </div>
          <div>
            <h2 className="font-semibold text-foreground">{getParticipantName()}</h2>
            <p className="text-sm text-muted-foreground">{getStatusText()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" title="Voice call">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" title="Video call">
            <Video className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {conversationData?.type === 'group' && onGroupSettings && (
                <DropdownMenuItem onClick={onGroupSettings}>
                  <Settings className="h-4 w-4 mr-2" />
                  Group Settings
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleToggleMute}>
                {isMuted ? (
                  <>
                    <Volume2 className="h-4 w-4 mr-2" />
                    Unmute
                  </>
                ) : (
                  <>
                    <VolumeX className="h-4 w-4 mr-2" />
                    Mute
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {conversationData?.type === 'private' && (
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={async () => {
                    if (!conversationData?.otherParticipant?.id) return
                    if (!confirm(`Block ${getParticipantName()}? You won't be able to message each other.`)) {
                      return
                    }
                    try {
                      const response = await fetch(
                        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/chat/block/${conversationData.otherParticipant.id}`,
                        {
                          method: 'POST',
                          headers: {
                            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                          },
                        }
                      )
                      if (response.ok) {
                        toast.success('User blocked')
                        window.location.href = '/chat'
                      } else {
                        throw new Error('Failed to block user')
                      }
                    } catch (error: any) {
                      toast.error(error.message || 'Failed to block user')
                    }
                  }}
                >
                  <UserX className="h-4 w-4 mr-2" />
                  Block User
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}

