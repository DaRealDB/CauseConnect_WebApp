"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  MoreVertical,
  Edit,
  Trash2,
  Reply,
  Pin,
  CheckCheck,
  Check,
  Heart,
  ThumbsUp,
  Laugh,
  Surprise,
  Frown,
} from "lucide-react"
import { formatTimestamp, getImageUrl } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"
import { useReactions } from "@/hooks/useReactions"
import type { Message } from "@/lib/firebase/chat.types"

interface MessageBubbleProps {
  message: Message & { senderData?: { name?: string; avatar?: string; username?: string } }
  conversationId: string | null
  isOwnMessage: boolean
  onEdit?: (messageId: string, currentText: string) => void
  onDelete?: (messageId: string, deleteForEveryone: boolean) => void
  onReply?: (messageId: string) => void
}

const REACTION_EMOJIS = [
  { emoji: '❤️', label: 'Love', icon: Heart },
  { emoji: '👍', label: 'Like', icon: ThumbsUp },
  { emoji: '😂', label: 'Laugh', icon: Laugh },
  { emoji: '😮', label: 'Surprised', icon: Surprise },
  { emoji: '😢', label: 'Sad', icon: Frown },
]

export function MessageBubble({
  message,
  conversationId,
  isOwnMessage,
  onEdit,
  onDelete,
  onReply,
}: MessageBubbleProps) {
  const { user } = useAuth()
  const { toggleReaction, getReactionCount, hasUserReacted } = useReactions({
    conversationId,
    userId: user?.id?.toString() || null,
  })
  const [showReactions, setShowReactions] = useState(false)

  // Skip deleted messages
  if (message.deleted && message.deletedFor?.includes(user?.id?.toString() || '')) {
    return null
  }

  const handleToggleReaction = async (emoji: string) => {
    await toggleReaction(message.id, emoji)
    setShowReactions(false)
  }

  const renderReactions = () => {
    if (!message.reactions || Object.keys(message.reactions).length === 0) {
      return null
    }

    return (
      <div className="flex gap-1 mt-1 flex-wrap">
        {Object.entries(message.reactions).map(([emoji, userIds]) => {
          if (userIds.length === 0) return null
          const isReacted = hasUserReacted(message.reactions, emoji)
          return (
            <button
              key={emoji}
              onClick={() => handleToggleReaction(emoji)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors ${
                isReacted
                  ? 'bg-primary/20 border-primary/30'
                  : 'bg-muted border-border hover:bg-muted/80'
              }`}
            >
              <span>{emoji}</span>
              <span>{userIds.length}</span>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div
      className={`flex gap-3 group ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} mb-4`}
    >
      {!isOwnMessage && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={getImageUrl(message.senderData?.avatar)} />
          <AvatarFallback>
            {message.senderData?.name?.[0] || message.senderData?.username?.[0] || 'U'}
          </AvatarFallback>
        </Avatar>
      )}

      <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[70%]`}>
        {!isOwnMessage && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-foreground">
              {message.senderData?.name || message.senderData?.username || 'Unknown User'}
            </span>
          </div>
        )}

        <div
          className={`relative px-4 py-2 rounded-lg ${
            isOwnMessage
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground'
          } ${message.deleted ? 'opacity-60' : ''}`}
        >
          {message.deleted ? (
            <p className="italic text-muted-foreground">[This message was deleted]</p>
          ) : (
            <>
              <p className="whitespace-pre-wrap break-words">{message.text}</p>
              {message.edited && (
                <span className="text-xs opacity-70 ml-1">(edited)</span>
              )}
            </>
          )}

          {/* Message Options */}
          <div
            className={`absolute ${isOwnMessage ? 'left-0' : 'right-0'} -top-8 opacity-0 group-hover:opacity-100 transition-opacity`}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isOwnMessage ? 'end' : 'start'}>
                {onReply && !message.deleted && (
                  <DropdownMenuItem onClick={() => onReply(message.id)}>
                    <Reply className="h-4 w-4 mr-2" />
                    Reply
                  </DropdownMenuItem>
                )}
                {!message.deleted && (
                  <DropdownMenuItem
                    onClick={() => setShowReactions(!showReactions)}
                  >
                    <Heart className="h-4 w-4 mr-2" />
                    React
                  </DropdownMenuItem>
                )}
                {isOwnMessage && !message.deleted && onEdit && (
                  <DropdownMenuItem
                    onClick={() => onEdit(message.id, message.text)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {isOwnMessage && onDelete && (
                  <DropdownMenuItem
                    onClick={() => onDelete(message.id, false)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete for me
                  </DropdownMenuItem>
                )}
                {isOwnMessage && onDelete && (
                  <DropdownMenuItem
                    onClick={() => onDelete(message.id, true)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete for everyone
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Reactions Picker */}
        {showReactions && (
          <div className="flex gap-1 mt-1 p-2 bg-background border rounded-lg shadow-lg">
            {REACTION_EMOJIS.map(({ emoji, label }) => (
              <button
                key={emoji}
                onClick={() => handleToggleReaction(emoji)}
                className="p-2 hover:bg-muted rounded-full transition-colors text-xl"
                title={label}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Existing Reactions */}
        {renderReactions()}

        {/* Message Footer */}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">
            {formatTimestamp(message.timestamp)}
          </span>
          {isOwnMessage && (
            <span className="text-xs">
              {message.readBy && message.readBy.length > 1 ? (
                <CheckCheck className="h-3 w-3 text-primary inline" />
              ) : (
                <Check className="h-3 w-3 inline" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}





