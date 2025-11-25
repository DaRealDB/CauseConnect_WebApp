"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"

export default function ProfilePage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading) {
      if (user?.username) {
        // Redirect to the logged-in user's profile
        router.replace(`/profile/${user.username}`)
      } else {
        // Not logged in, redirect to feed
        router.replace("/feed")
      }
    }
  }, [user, isLoading, router])

  // Show loading state while checking auth
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10">
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    </div>
  )
}
