"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Pin, X } from "lucide-react"
import { getConversation } from "@/lib/firebase/chat"
import { getMessages } from "@/lib/firebase/chat"
import type { Message } from "@/lib/firebase/chat.types"
import { formatTimestamp } from "@/lib/utils"

interface PinnedMessagesProps {
  conversationId: string | null
}

export function PinnedMessages({ conversationId }: PinnedMessagesProps) {
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([])

  useEffect(() => {
    if (!conversationId) {
      setPinnedMessages([])
      return
    }

    const loadPinnedMessages = async () => {
      try {
        const conversation = await getConversation(conversationId)
        if (!conversation || !conversation.pinnedMessages || conversation.pinnedMessages.length === 0) {
          setPinnedMessages([])
          return
        }

        // Fetch all messages and filter pinned ones
        const allMessages = await getMessages(conversationId, 100)
        const pinned = allMessages.filter((msg) =>
          conversation.pinnedMessages?.includes(msg.id)
        )
        setPinnedMessages(pinned)
      } catch (error) {
        console.error("[PinnedMessages] Error loading pinned messages:", error)
        setPinnedMessages([])
      }
    }

    loadPinnedMessages()
  }, [conversationId])

  if (pinnedMessages.length === 0) {
    return null
  }

  return (
    <Card className="mb-4 border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Pin className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm">Pinned Messages</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {pinnedMessages.map((message) => (
          <div
            key={message.id}
            className="p-2 bg-background rounded border text-sm"
          >
            <p className="line-clamp-2">{message.text}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatTimestamp(message.timestamp)}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}


