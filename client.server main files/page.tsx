"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { io, Socket } from "socket.io-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Search, Users, Paperclip, X, MessageCircle, Sparkles } from "lucide-react"

interface Message {
  room: string
  sender: string
  message?: string
  timestamp: string
  type: 'text' | 'image'
  imageData?: string
}

export default function ChatPage() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [username, setUsername] = useState<string>("")
  const [room, setRoom] = useState<string>("")
  const [currentChatUser, setCurrentChatUser] = useState<string>("")
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const [message, setMessage] = useState<string>("")
  const [allMessages, setAllMessages] = useState<Record<string, Message[]>>({})
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Get user from localStorage (set by CauseConnect login)
  useEffect(() => {
    const causeConnectUser = localStorage.getItem('causeconnect_user')
    const chatUser = localStorage.getItem('chat_user')
    
    if (causeConnectUser) {
      const userData = JSON.parse(causeConnectUser)
      setUsername(userData.username || userData.email?.split('@')[0] || '')
    } else if (chatUser) {
      const userData = JSON.parse(chatUser)
      setUsername(userData.username || '')
    }
  }, [])

  // Initialize socket connection
  useEffect(() => {
    if (!username) return

    const newSocket = io("http://localhost:3001")
    setSocket(newSocket)

    // Request notification permission
    if ("Notification" in window) {
      Notification.requestPermission()
    }

    // Emit user login
    newSocket.emit("user_login", username)

    // Socket event listeners
    newSocket.on("online_users", (users: string[]) => {
      setOnlineUsers(users)
    })

    newSocket.on("receive_message", (data: Message) => {
      const roomKey = data.room
      
      setAllMessages(prev => ({
        ...prev,
        [roomKey]: [...(prev[roomKey] || []), data]
      }))

      if (data.room !== room || !document.hasFocus()) {
        const otherUser = data.room.split('-').find(user => user !== username)
        
        if (otherUser) {
          setUnreadCounts(prev => ({
            ...prev,
            [otherUser]: (prev[otherUser] || 0) + 1
          }))
        }

        // Show notification
        if ("Notification" in window && Notification.permission === "granted") {
          const notificationText = data.type === 'image' ? "Sent an image" : data.message || ""
          new Notification(`New message from ${data.sender}`, {
            body: notificationText,
            icon: "/favicon.ico"
          })
        }
      }

      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
      }, 100)
    })

    newSocket.on("message_history", (data: { room: string; messages: Message[] }) => {
      setAllMessages(prev => ({
        ...prev,
        [data.room]: data.messages
      }))
      
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
      }, 100)
    })

    newSocket.on("user_disconnected", (users: string[]) => {
      setOnlineUsers(users)
    })

    newSocket.on("login_error", (message: string) => {
      console.error("Server Socket Login Rejected:", message)
    })

    return () => {
      newSocket.off("online_users")
      newSocket.off("receive_message")
      newSocket.off("message_history")
      newSocket.off("user_disconnected")
      newSocket.off("login_error")
      newSocket.disconnect()
    }
  }, [username, room])

  const getRoomId = (user1: string, user2: string) => {
    return [user1, user2].sort().join("-")
  }

  const joinRoom = (otherUsername: string) => {
    if (!socket) return

    if (room) {
      socket.emit("leave_room", room)
    }
    
    const roomId = getRoomId(username, otherUsername)
    setRoom(roomId)
    setCurrentChatUser(otherUsername)
    
    setUnreadCounts(prev => ({
      ...prev,
      [otherUsername]: 0
    }))
    
    socket.emit("join_room", roomId)
    socket.emit("get_message_history", roomId)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size too large. Please select an image under 5MB.')
        return
      }
      setSelectedFile(file)
    } else {
      alert('Please select an image file.')
    }
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  const sendMessage = async () => {
    if (!socket || room === "") return

    try {
      let messageData: Message = {
        room,
        sender: username,
        timestamp: new Date().toISOString(),
        type: 'text'
      }

      if (selectedFile) {
        setIsUploading(true)
        const base64 = await fileToBase64(selectedFile)
        messageData = {
          ...messageData,
          type: 'image',
          message: selectedFile.name,
          imageData: base64
        }
        setSelectedFile(null)
      } else if (message.trim() !== "") {
        messageData.message = message.trim()
      } else {
        return
      }

      socket.emit("send_message", messageData)
      
      const roomKey = getRoomId(username, currentChatUser)
      setAllMessages(prev => ({
        ...prev,
        [roomKey]: [...(prev[roomKey] || []), messageData]
      }))
      
      setMessage("")
      setIsUploading(false)

      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
      }, 100)
    } catch (error) {
      console.error('Error sending message:', error)
      setIsUploading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const filteredUsers = onlineUsers.filter(user => 
    user.toLowerCase().includes(searchTerm.toLowerCase()) && user !== username
  )

  const currentMessages = room ? (allMessages[room] || []) : []

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  // Check if user is logged in
  if (!username) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50">
        <div className="text-center space-y-6 p-8">
          <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold text-gray-800">Please log in to access chat</h2>
          <p className="text-gray-600">You need to be logged in through CauseConnect to use the chat feature.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col shadow-lg">
        {/* Sidebar Header */}
        <div className="p-6 bg-white border-b border-gray-200">
          <h3 className="text-xl font-bold mb-3 text-gray-800">Messages</h3>
          <p className="text-sm text-gray-600 mb-2">Logged in as: {username}</p>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent transition-all duration-300"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Users List */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {filteredUsers.map((user, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                  currentChatUser === user 
                    ? 'bg-orange-100 border border-orange-200 shadow-sm' 
                    : 'bg-white hover:bg-gray-50 border border-gray-200'
                }`}
                onClick={() => joinRoom(user)}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className={`font-medium ${
                    currentChatUser === user ? 'text-gray-800' : 'text-gray-700'
                  }`}>
                    {user}
                  </span>
                </div>
                
                {unreadCounts[user] > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center animate-pulse">
                    {unreadCounts[user]}
                  </span>
                )}
              </div>
            ))}
            
            {filteredUsers.length === 0 && searchTerm && (
              <div className="text-center py-8 text-gray-500">
                <Search className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>No users found</p>
              </div>
            )}
            
            {onlineUsers.length <= 1 && !searchTerm && (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>No other users online</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentChatUser ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-6 shadow-sm">
              <h3 className="text-xl font-bold text-gray-800">{currentChatUser}</h3>
              <p className="text-gray-500 text-sm mt-1">Last seen recently</p>
            </div>
            
            {/* Messages Container */}
            <ScrollArea className="flex-1">
              <div className="p-6 bg-amber-50 space-y-4">
                {currentMessages.map((msg, index) => (
                  <div 
                    key={index} 
                    className={`flex ${msg.sender === username ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm transition-all duration-300 ${
                        msg.sender === username
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-200 text-gray-800'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className={`font-semibold text-sm ${
                          msg.sender === username ? 'text-white' : 'text-gray-700'
                        }`}>
                          {msg.sender}
                        </span>
                        <span className={`text-xs ${
                          msg.sender === username ? 'text-orange-100' : 'text-gray-500'
                        }`}>
                          {formatTime(msg.timestamp)}
                        </span>
                      </div>
                      
                      {msg.type === 'image' ? (
                        <div className="space-y-2">
                          <img 
                            src={msg.imageData} 
                            alt={msg.message}
                            className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity duration-300"
                            onClick={() => window.open(msg.imageData)}
                          />
                          <p className={`text-xs ${
                            msg.sender === username ? 'text-orange-100' : 'text-gray-600'
                          }`}>
                            {msg.message}
                          </p>
                        </div>
                      ) : (
                        <p className="break-words">{msg.message}</p>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input Area */}
            <div className="bg-white border-t border-gray-200 p-4">
              {/* File Preview */}
              {selectedFile && (
                <div className="mb-4 inline-flex items-center bg-gray-100 rounded-lg p-3 relative">
                  <img 
                    src={URL.createObjectURL(selectedFile)} 
                    alt="Preview" 
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 p-0 hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
              
              {/* Input Controls */}
              <div className="flex items-center space-x-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-input"
                />
                
                <label 
                  htmlFor="file-input"
                  className="text-gray-600 hover:text-gray-800 p-3 cursor-pointer transition-all duration-300 flex items-center justify-center"
                >
                  <Paperclip className="w-5 h-5" />
                </label>
                
                <Input
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent transition-all duration-300 bg-white"
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isUploading}
                />
                
                <Button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    sendMessage()
                  }}
                  disabled={isUploading || !room}
                  className={`bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                    isUploading || !room 
                      ? 'opacity-60 cursor-not-allowed' 
                      : 'cursor-pointer'
                  }`}
                >
                  {isUploading ? (
                    <span>Sending...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* Welcome Screen */
          <div className="flex-1 flex items-center justify-center bg-amber-50">
            <div className="text-center space-y-6 p-8">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <div className="flex items-center justify-center gap-2">
                <h2 className="text-3xl font-bold text-gray-800">Welcome, {username}!</h2>
                <Sparkles className="w-6 h-6 text-orange-500" />
              </div>
              <p className="text-xl text-gray-600 max-w-md">
                Select a user from the left to start chatting
              </p>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200">
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5 text-orange-500" />
                  <p className="text-gray-700 font-medium">
                    Features: Message history, image sharing, and notifications!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
