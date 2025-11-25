"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Search, Phone, Video, MoreVertical, Paperclip, Smile, Circle } from "lucide-react"
import { formatTimestamp } from "@/lib/utils"

interface Message {
  id: string
  senderId: string
  senderName: string
  senderAvatar: string
  content: string
  timestamp: Date
  isRead: boolean
}

interface Chat {
  id: string
  name: string
  avatar: string
  lastMessage: string
  lastMessageTime: Date
  unreadCount: number
  isOnline: boolean
  isGroup?: boolean
}

export default function ChatPage() {
  const [selectedChat, setSelectedChat] = useState<string | null>("1")
  const [message, setMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const chats: Chat[] = [
    {
      id: "1",
      name: "Sarah Johnson",
      avatar: "/diverse-woman-smiling.png",
      lastMessage: "Thanks for organizing the clean water event!",
      lastMessageTime: new Date(Date.now() - 5 * 60 * 1000),
      unreadCount: 2,
      isOnline: true,
    },
    {
      id: "2",
      name: "Clean Water Kenya Team",
      avatar: "/water-drop-logo.png",
      lastMessage: "Meeting scheduled for tomorrow at 3 PM",
      lastMessageTime: new Date(Date.now() - 30 * 60 * 1000),
      unreadCount: 0,
      isOnline: false,
      isGroup: true,
    },
    {
      id: "3",
      name: "Michael Chen",
      avatar: "/asian-professional-man.png",
      lastMessage: "Great work on the fundraising campaign",
      lastMessageTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
      unreadCount: 1,
      isOnline: true,
    },
    {
      id: "4",
      name: "Education Initiative",
      avatar: "/books-education-logo.jpg",
      lastMessage: "New volunteer applications received",
      lastMessageTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
      unreadCount: 0,
      isOnline: false,
      isGroup: true,
    },
  ]

  const messages: Message[] = [
    {
      id: "1",
      senderId: "2",
      senderName: "Sarah Johnson",
      senderAvatar: "/diverse-woman-smiling.png",
      content: "Hi! I saw your clean water initiative and I'm really interested in helping out.",
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
      isRead: true,
    },
    {
      id: "2",
      senderId: "1",
      senderName: "You",
      senderAvatar: "/diverse-user-avatars.png",
      content: "That's wonderful! We can always use more volunteers. What kind of skills do you have?",
      timestamp: new Date(Date.now() - 55 * 60 * 1000),
      isRead: true,
    },
    {
      id: "3",
      senderId: "2",
      senderName: "Sarah Johnson",
      senderAvatar: "/diverse-woman-smiling.png",
      content: "I have experience in project management and I've worked with water purification systems before.",
      timestamp: new Date(Date.now() - 50 * 60 * 1000),
      isRead: true,
    },
    {
      id: "4",
      senderId: "1",
      senderName: "You",
      senderAvatar: "/diverse-user-avatars.png",
      content:
        "Perfect! That's exactly what we need. Would you be available for a call this week to discuss the project details?",
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      isRead: true,
    },
    {
      id: "5",
      senderId: "2",
      senderName: "Sarah Johnson",
      senderAvatar: "/diverse-woman-smiling.png",
      content: "I'm free Tuesday or Wednesday afternoon.",
      timestamp: new Date(Date.now() - 10 * 60 * 1000),
      isRead: false,
    },
    {
      id: "6",
      senderId: "2",
      senderName: "Sarah Johnson",
      senderAvatar: "/diverse-woman-smiling.png",
      content: "Thanks for organizing the clean water event!",
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      isRead: false,
    },
  ]

  const selectedChatData = chats.find((chat) => chat.id === selectedChat)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim()) {
      console.log("[v0] Sending message:", message)
      setMessage("")
    }
  }


  return (
    <div className="h-screen bg-gradient-to-br from-background via-orange-50/30 to-peach-50/30 flex">
      {/* Chat List Sidebar */}
      <div className="w-80 border-r border-border bg-background/80 backdrop-blur-sm flex flex-col">
        <div className="p-4 border-b border-border">
          <h1 className="text-xl font-bold text-foreground mb-4">Messages</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => setSelectedChat(chat.id)}
                className={`p-3 rounded-lg cursor-pointer transition-colors mb-1 ${
                  selectedChat === chat.id ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={chat.avatar || "/placeholder.svg"} />
                      <AvatarFallback>
                        {chat.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    {chat.isOnline && (
                      <Circle className="absolute -bottom-1 -right-1 h-4 w-4 fill-green-500 text-green-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-foreground truncate">
                        {chat.name}
                        {chat.isGroup && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            Group
                          </Badge>
                        )}
                      </h3>
                      <span className="text-xs text-muted-foreground">{formatTimestamp(chat.lastMessageTime)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                      {chat.unreadCount > 0 && (
                        <Badge className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                          {chat.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChatData ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border bg-background/80 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedChatData.avatar || "/placeholder.svg"} />
                      <AvatarFallback>
                        {selectedChatData.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    {selectedChatData.isOnline && (
                      <Circle className="absolute -bottom-1 -right-1 h-3 w-3 fill-green-500 text-green-500" />
                    )}
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground">{selectedChatData.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {selectedChatData.isOnline ? "Online" : "Last seen recently"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex gap-3 ${msg.senderId === "1" ? "flex-row-reverse" : "flex-row"}`}>
                    {msg.senderId !== "1" && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={msg.senderAvatar || "/placeholder.svg"} />
                        <AvatarFallback>{msg.senderName[0]}</AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                        msg.senderId === "1" ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          msg.senderId === "1" ? "text-primary-foreground/70" : "text-muted-foreground"
                        }`}
                      >
                        {formatTimestamp(msg.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-border bg-background/80 backdrop-blur-sm">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <Button type="button" variant="ghost" size="sm">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <div className="flex-1 relative">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                </div>
                <Button type="submit" size="sm" disabled={!message.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-lg font-medium text-foreground mb-2">Select a conversation</h3>
              <p className="text-muted-foreground">Choose a chat from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
