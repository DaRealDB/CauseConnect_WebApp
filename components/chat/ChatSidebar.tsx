"use client"

import { useState, useEffect, useCallback } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Search, UserPlus, MessageCircle } from "lucide-react"
import { formatTimestamp, getImageUrl } from "@/lib/utils"
import { useChat } from "@/hooks/useChat"
import type { ConversationWithParticipants } from "@/hooks/useChat"
import { userService } from "@/lib/api/services"
import type { User } from "@/lib/api/types"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface ChatSidebarProps {
  selectedConversationId: string | null
  onSelectConversation: (conversationId: string) => void
}

export function ChatSidebar({ selectedConversationId, onSelectConversation }: ChatSidebarProps) {
  const { conversations, isLoading, startConversation } = useChat()
  const { user: currentUser } = useAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)

  // Debounced user search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true)
      try {
        const results = await userService.searchUsers(searchQuery.trim(), 10)
        // Filter out current user
        const filtered = results.filter(
          (user) => user.id.toString() !== currentUser?.id?.toString()
        )
        setSearchResults(filtered)
        setShowSearchResults(true)
      } catch (error: any) {
        console.error("[ChatSidebar] Error searching users:", error)
        toast.error("Failed to search users")
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, currentUser?.id])

  // Filter conversations by search query
  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery.trim() || showSearchResults) return !showSearchResults

    const query = searchQuery.toLowerCase()
    if (conv.type === "private" && conv.otherParticipant) {
      const name = conv.otherParticipant.name || conv.otherParticipant.username || ""
      return name.toLowerCase().includes(query)
    } else if (conv.type === "group" && conv.participantsData) {
      return conv.participantsData.some(
        (p) => (p.name || p.username || "").toLowerCase().includes(query)
      )
    }
    return false
  })

  // Handle starting a conversation with a user
  const handleStartConversation = useCallback(
    async (user: User) => {
      if (!currentUser) {
        toast.error("You must be logged in to start a conversation")
        return
      }

      if (user.id.toString() === currentUser.id?.toString()) {
        toast.error("You cannot message yourself")
        return
      }

      try {
        // Check if conversation already exists
        const existingConv = conversations.find((conv) => {
          if (conv.type === "private" && conv.participants.includes(user.id.toString())) {
            return conv.participants.length === 2
          }
          return false
        })

        if (existingConv) {
          onSelectConversation(existingConv.id)
          setSearchQuery("")
          setShowSearchResults(false)
          return
        }

        // Start new conversation
        const conversationId = await startConversation(user.id.toString())
        onSelectConversation(conversationId)
        setSearchQuery("")
        setShowSearchResults(false)
        toast.success(`Started conversation with ${user.name || user.username}`)
      } catch (error: any) {
        console.error("[ChatSidebar] Error starting conversation:", error)
        toast.error(error.message || "Failed to start conversation")
      }
    },
    [currentUser, conversations, startConversation, onSelectConversation]
  )

  const getConversationName = (conv: ConversationWithParticipants): string => {
    if (conv.type === "private" && conv.otherParticipant) {
      return conv.otherParticipant.name || conv.otherParticipant.username || "Unknown User"
    } else if (conv.type === "group" && conv.participantsData) {
      const names = conv.participantsData
        .slice(0, 3)
        .map((p) => p.name || p.username)
        .join(", ")
      return names || "Group Chat"
    }
    return "Unknown"
  }

  const getConversationAvatar = (conv: ConversationWithParticipants): string | undefined => {
    if (conv.type === "private" && conv.otherParticipant) {
      return conv.otherParticipant.avatar
    }
    if (conv.type === "group" && conv.participantsData && conv.participantsData.length > 0) {
      return conv.participantsData[0].avatar
    }
    return undefined
  }

  const getConversationInitials = (conv: ConversationWithParticipants): string => {
    if (conv.type === "private" && conv.otherParticipant) {
      const name = conv.otherParticipant.name || conv.otherParticipant.username || ""
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }
    if (conv.type === "group") {
      return "GC"
    }
    return "?"
  }

  if (isLoading) {
    return (
      <div className="w-80 border-r border-border bg-background/80 backdrop-blur-sm flex flex-col">
        <div className="p-4 border-b border-border">
          <h1 className="text-xl font-bold text-foreground mb-4">Messages</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading conversations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-80 border-r border-border bg-background/80 backdrop-blur-sm flex flex-col">
      <div className="p-4 border-b border-border">
        <h1 className="text-xl font-bold text-foreground mb-4">Messages</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users or conversations..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              if (e.target.value.trim()) {
                setShowSearchResults(true)
              } else {
                setShowSearchResults(false)
              }
            }}
            className="pl-10"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {showSearchResults ? (
            // Show user search results
            <div>
              {isSearching ? (
                <div className="p-8 text-center text-muted-foreground">
                  <p>Searching users...</p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <p>No users found</p>
                  <p className="text-sm mt-2">Try a different search term</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
                    Users
                  </div>
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => handleStartConversation(user)}
                      className="p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50 flex items-center gap-3"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={getImageUrl(user.avatar)} />
                        <AvatarFallback>
                          {(user.name || user.username || "U")
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-foreground truncate">
                            {user.name || user.username}
                          </h3>
                          {user.verified && (
                            <Badge variant="secondary" className="text-xs">
                              Verified
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          @{user.username}
                        </p>
                      </div>
                      <MessageCircle className="h-5 w-5 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>No conversations found</p>
              {searchQuery && (
                <p className="text-sm mt-2">Type to search for users to message</p>
              )}
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`p-3 rounded-lg cursor-pointer transition-colors mb-1 ${
                  selectedConversationId === conv.id
                    ? "bg-primary/10 border border-primary/20"
                    : "hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={getImageUrl(getConversationAvatar(conv))} />
                      <AvatarFallback>{getConversationInitials(conv)}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-foreground truncate">
                        {getConversationName(conv)}
                        {conv.type === "group" && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            Group
                          </Badge>
                        )}
                      </h3>
                      {conv.lastMessageTime && (
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(conv.lastMessageTime)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground truncate">
                        {conv.lastMessage || "No messages yet"}
                      </p>
                      {conv.unreadCountForUser && conv.unreadCountForUser > 0 && (
                        <Badge className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                          {conv.unreadCountForUser}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
