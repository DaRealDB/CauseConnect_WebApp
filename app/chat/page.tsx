"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { ChatSidebar } from "@/components/chat/ChatSidebar"
import { ChatWindow } from "@/components/chat/ChatWindow"
import { MessageInput } from "@/components/chat/MessageInput"
import { verifyFirebaseConnection } from "@/lib/firebase/firebase.config"
import { useChat } from "@/hooks/useChat"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, ExternalLink, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { userService } from "@/lib/api/services"
import type { User } from "@/lib/api/types"
import { toast } from "sonner"
import { ChatNotificationManager } from "@/components/chat/ChatNotificationManager"
import { PermissionErrorCard } from "./permission-error"

export default function ChatPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [isFirebaseConfigured, setIsFirebaseConfigured] = useState<boolean | null>(null)
  const { conversations, startConversation, error: chatError } = useChat()
  const [hasPermissionError, setHasPermissionError] = useState(false)
  
  // Check for permission errors
  useEffect(() => {
    if (chatError) {
      const errorMsg = chatError.message || ''
      const errorCode = (chatError as any)?.code || ''
      if (
        errorCode === 'permission-denied' ||
        errorMsg.includes('Missing or insufficient permissions') ||
        errorMsg.toLowerCase().includes('permission')
      ) {
        setHasPermissionError(true)
      }
    } else {
      setHasPermissionError(false)
    }
  }, [chatError])

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [authLoading, isAuthenticated, router])

  // Verify Firebase connection on mount
  useEffect(() => {
    const isConnected = verifyFirebaseConnection()
    setIsFirebaseConfigured(isConnected)
    if (!isConnected) {
      console.error("[Chat] Firebase not configured. Please add Firebase environment variables.")
    }
  }, [])

  // Handle user query param (from profile page message button)
  useEffect(() => {
    const usernameParam = searchParams?.get("user")
    if (!usernameParam || !isAuthenticated || authLoading || !user?.id) return

    const handleUserParam = async () => {
      try {
        // Fetch user profile to get user ID
        const targetUser = await userService.getUserProfile(usernameParam)
        if (targetUser.id.toString() === user.id.toString()) {
          toast.error("You cannot message yourself")
          router.replace("/chat")
          return
        }

        // Check if conversation already exists with this user
        const existingConv = conversations.find((conv) => {
          if (conv.type === "private" && conv.participants.includes(targetUser.id.toString())) {
            return conv.participants.length === 2 && conv.participants.includes(user.id.toString())
          }
          return false
        })

        if (existingConv) {
          setSelectedConversationId(existingConv.id)
          router.replace("/chat", { scroll: false })
          return
        }

        // Start new conversation
        const conversationId = await startConversation(targetUser.id.toString())
        setSelectedConversationId(conversationId)
        router.replace("/chat", { scroll: false })
      } catch (error: any) {
        console.error("[ChatPage] Error handling user param:", error)
        toast.error(error.message || "Failed to start conversation")
        router.replace("/chat", { scroll: false })
      }
    }

    handleUserParam()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams?.get("user"), isAuthenticated, authLoading, user?.id])

  // Auto-select first conversation if available and none selected
  useEffect(() => {
    if (conversations.length > 0 && !selectedConversationId && !searchParams.get("user")) {
      setSelectedConversationId(conversations[0].id)
    }
  }, [conversations, selectedConversationId, searchParams])

  // Get selected conversation data
  const selectedConversation = conversations.find((conv) => conv.id === selectedConversationId)

  if (authLoading) {
    return (
      <div className="h-screen bg-gradient-to-br from-background via-orange-50/30 to-peach-50/30 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect
  }

  // Show permission error card if permission errors detected
  if (hasPermissionError) {
    return (
      <div className="h-screen bg-gradient-to-br from-background via-orange-50/30 to-peach-50/30 flex items-center justify-center p-4">
        <PermissionErrorCard />
      </div>
    )
  }

  // Show Firebase setup message if not configured
  if (isFirebaseConfigured === false) {
    return (
      <div className="h-screen bg-gradient-to-br from-background via-orange-50/30 to-peach-50/30 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="h-6 w-6 text-orange-500" />
              <CardTitle>Firebase Configuration Required</CardTitle>
            </div>
            <CardDescription>
              Chat functionality requires Firebase Firestore to be configured
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg space-y-3">
              <p className="font-medium">To enable chat, please:</p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Create a Firebase project at{" "}
                  <Link 
                    href="https://console.firebase.google.com/" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Firebase Console
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </li>
                <li>Enable Firestore Database in your Firebase project</li>
                <li>Add the following environment variables to your <code className="bg-background px-1 py-0.5 rounded text-xs">.env.local</code> file:</li>
              </ol>
              <div className="bg-background p-3 rounded border border-border">
                <pre className="text-xs overflow-x-auto">
{`NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id`}
                </pre>
              </div>
              <p className="text-sm text-muted-foreground">
                You can find these values in your Firebase project settings under "Your apps" → Web app config.
              </p>
              <p className="text-sm text-muted-foreground">
                After adding the environment variables, restart your development server.
              </p>
            </div>
            <div className="pt-2">
              <p className="text-xs text-muted-foreground">
                See <code className="bg-muted px-1 py-0.5 rounded">CHAT_IMPLEMENTATION.md</code> for detailed setup instructions.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

      return (
        <div className="h-screen bg-gradient-to-br from-background via-orange-50/30 to-peach-50/30 flex flex-col">
          {/* Notification Manager */}
          <ChatNotificationManager />
          
          {/* Header with back button */}
          <div className="border-b border-border bg-background/80 backdrop-blur-sm px-4 py-3 flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/feed")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Feed
            </Button>
          </div>

      <div className="flex-1 flex overflow-hidden">
        <ChatSidebar
          selectedConversationId={selectedConversationId}
          onSelectConversation={setSelectedConversationId}
        />
        <div className="flex-1 flex flex-col">
          <ChatWindow
            conversationId={selectedConversationId}
            conversationData={selectedConversation}
          />
          <MessageInput conversationId={selectedConversationId} />
        </div>
      </div>
    </div>
  )
}
