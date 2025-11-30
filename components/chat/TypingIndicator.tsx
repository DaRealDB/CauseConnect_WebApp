"use client"

import { useTyping } from "@/hooks/useTyping"
import { useAuth } from "@/contexts/AuthContext"
import { userService } from "@/lib/api/services"
import { useState, useEffect } from "react"
import type { TypingIndicator as TypingIndicatorType } from "@/lib/firebase/chat-enhanced"

interface TypingIndicatorProps {
  conversationId: string | null
}

interface TypingUser {
  id: string
  name: string
}

export function TypingIndicator({ conversationId }: TypingIndicatorProps) {
  const { user } = useAuth()
  const { typingUsers } = useTyping({
    conversationId,
    userId: user?.id?.toString() || null,
    enabled: !!conversationId,
  })
  const [typingUserNames, setTypingUserNames] = useState<TypingUser[]>([])

  useEffect(() => {
    if (typingUsers.length === 0) {
      setTypingUserNames([])
      return
    }

    const fetchUserNames = async () => {
      try {
        const names = await Promise.all(
          typingUsers.map(async (typingUser) => {
            try {
              const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/chat/user/${typingUser.userId}`,
                {
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
                  },
                }
              )
              if (response.ok) {
                const userData = await response.json()
                return { id: typingUser.userId, name: userData.name || userData.username }
              }
            } catch (error) {
              console.error(`Failed to fetch user ${typingUser.userId}:`, error)
            }
            return { id: typingUser.userId, name: 'Someone' }
          })
        )
        setTypingUserNames(names.filter(Boolean))
      } catch (error) {
        console.error('[TypingIndicator] Error fetching user names:', error)
      }
    }

    fetchUserNames()
  }, [typingUsers])

  if (typingUserNames.length === 0) {
    return null
  }

  const getTypingText = () => {
    if (typingUserNames.length === 1) {
      return `${typingUserNames[0].name} is typing...`
    } else if (typingUserNames.length === 2) {
      return `${typingUserNames[0].name} and ${typingUserNames[1].name} are typing...`
    } else {
      return `${typingUserNames[0].name} and ${typingUserNames.length - 1} others are typing...`
    }
  }

  return (
    <div className="px-4 py-2 text-sm text-muted-foreground italic">
      <span className="flex items-center gap-2">
        <span className="flex gap-1">
          <span className="animate-bounce" style={{ animationDelay: '0ms' }}>●</span>
          <span className="animate-bounce" style={{ animationDelay: '150ms' }}>●</span>
          <span className="animate-bounce" style={{ animationDelay: '300ms' }}>●</span>
        </span>
        {getTypingText()}
      </span>
    </div>
  )
}



