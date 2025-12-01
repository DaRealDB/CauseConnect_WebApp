"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Search, X } from "lucide-react"
import { searchMessages } from "@/lib/firebase/chat-enhanced"
import type { Message } from "@/lib/firebase/chat.types"
import { Button } from "@/components/ui/button"

interface MessageSearchProps {
  conversationId: string | null
  onMessageSelect?: (messageId: string) => void
}

export function MessageSearch({ conversationId, onMessageSelect }: MessageSearchProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [results, setResults] = useState<Message[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const handleSearch = async () => {
    if (!conversationId || !searchQuery.trim()) {
      setResults([])
      return
    }

    setIsSearching(true)
    try {
      const searchResults = await searchMessages(conversationId, searchQuery.trim(), 20)
      setResults(searchResults)
      setIsOpen(true)
    } catch (error: any) {
      console.error("[MessageSearch] Error searching messages:", error)
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }

  if (!conversationId) return null

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search messages..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch()
            }
          }}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={() => {
              setSearchQuery("")
              setResults([])
              setIsOpen(false)
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border rounded-lg shadow-lg max-h-60 overflow-y-auto z-10">
          {results.map((message) => (
            <div
              key={message.id}
              onClick={() => {
                onMessageSelect?.(message.id)
                setIsOpen(false)
              }}
              className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
            >
              <p className="text-sm line-clamp-2">{message.text}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {message.timestamp instanceof Date
                  ? message.timestamp.toLocaleDateString()
                  : "Recent"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}





