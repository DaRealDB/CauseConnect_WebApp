"use client"

import { useEffect, useRef } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useConversation } from "@/hooks/useConversation"
import { useAuth } from "@/contexts/AuthContext"
import { MessageBubble } from "./MessageBubble"
import { TypingIndicator } from "./TypingIndicator"
import { ChatHeader } from "./ChatHeader"
import { PinnedMessages } from "./PinnedMessages"
import { MessageSearch } from "./MessageSearch"
import type { ConversationWithParticipants } from "@/hooks/useChat"
import { editMessage, deleteMessage } from "@/lib/firebase/chat-enhanced"
import { toast } from "sonner"

interface ChatWindowProps {
  conversationId: string | null
  conversationData?: ConversationWithParticipants
}

export function ChatWindow({ conversationId, conversationData }: ChatWindowProps) {
  const { user } = useAuth()
  const { messages, isLoading, conversation } = useConversation(conversationId)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  if (!conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-foreground mb-2">Select a conversation</h3>
          <p className="text-muted-foreground">Choose a chat from the sidebar to start messaging</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading conversation...</p>
        </div>
      </div>
    )
  }

  const isOwnMessage = (senderId: string): boolean => {
    return user?.id?.toString() === senderId
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Chat Header */}
      <ChatHeader
        conversationData={conversationData}
        conversationId={conversationId}
        onGroupSettings={() => {
          // TODO: Open group settings modal
        }}
      />

      {/* Message Search */}
      {conversationId && (
        <div className="px-4 pt-2 border-b border-border">
          <MessageSearch
            conversationId={conversationId}
            onMessageSelect={(messageId) => {
              // Scroll to message
              const element = document.getElementById(`message-${messageId}`)
              element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }}
          />
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {/* Pinned Messages */}
          {conversation?.type === 'group' && (
            <PinnedMessages conversationId={conversationId} />
          )}

          {messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isOwn = isOwnMessage(msg.senderId)
                  return (
                  <div key={msg.id} id={`message-${msg.id}`}>
                    <MessageBubble
                      message={msg}
                      conversationId={conversationId}
                      isOwnMessage={isOwn}
                  onEdit={async (messageId, currentText) => {
                    const newText = prompt('Edit message:', currentText)
                    if (newText !== null && newText !== currentText && conversationId && user?.id) {
                      try {
                        await editMessage(conversationId, messageId, user.id.toString(), newText)
                        toast.success('Message edited')
                      } catch (error: any) {
                        toast.error(error.message || 'Failed to edit message')
                      }
                    }
                  }}
                  onDelete={async (messageId, deleteForEveryone) => {
                    if (
                      !confirm(
                        deleteForEveryone
                          ? 'Delete this message for everyone?'
                          : 'Delete this message for you?'
                      )
                    )
                      return
                    if (conversationId && user?.id) {
                      try {
                        await deleteMessage(conversationId, messageId, user.id.toString(), deleteForEveryone)
                        toast.success('Message deleted')
                      } catch (error: any) {
                        toast.error(error.message || 'Failed to delete message')
                      }
                    }
                  }}
                  onReply={() => {
                    // TODO: Implement reply functionality
                      toast.info('Reply feature coming soon')
                    }}
                    />
                  </div>
                )
              })
          )}
          <TypingIndicator conversationId={conversationId} />
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
    </div>
  )
}

