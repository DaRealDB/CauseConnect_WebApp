"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { userService } from "@/lib/api/services"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"

const CAUSE_TAGS = [
  { id: "education", label: "Education", color: "bg-blue-100 text-blue-800 hover:bg-blue-200" },
  { id: "environment", label: "Environment", color: "bg-green-100 text-green-800 hover:bg-green-200" },
  { id: "health", label: "Health & Medicine", color: "bg-red-100 text-red-800 hover:bg-red-200" },
  { id: "poverty", label: "Poverty & Hunger", color: "bg-orange-100 text-orange-800 hover:bg-orange-200" },
  { id: "animals", label: "Animal Welfare", color: "bg-purple-100 text-purple-800 hover:bg-purple-200" },
  { id: "human-rights", label: "Human Rights", color: "bg-pink-100 text-pink-800 hover:bg-pink-200" },
  { id: "disaster-relief", label: "Disaster Relief", color: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200" },
  { id: "arts-culture", label: "Arts & Culture", color: "bg-indigo-100 text-indigo-800 hover:bg-indigo-200" },
  { id: "technology", label: "Technology Access", color: "bg-cyan-100 text-cyan-800 hover:bg-cyan-200" },
  { id: "elderly", label: "Elderly Care", color: "bg-gray-100 text-gray-800 hover:bg-gray-200" },
  { id: "youth", label: "Youth Development", color: "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" },
  { id: "mental-health", label: "Mental Health", color: "bg-violet-100 text-violet-800 hover:bg-violet-200" },
]

export default function OnboardingTags() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]))
  }

  const handleContinue = async () => {
    if (selectedTags.length === 0) {
      toast.error("Please select at least one interest")
      return
    }

    if (!isAuthenticated) {
      // If not authenticated, we still want to save tags when they become authenticated
      // Store in localStorage as fallback (will be synced on next auth check)
      localStorage.setItem('pending_tags', JSON.stringify(selectedTags))
      router.push("/onboarding/preferences")
      return
    }

    try {
      setIsLoading(true)
      // Save tags to backend
      const result = await userService.updatePreferences(selectedTags)
      console.log("✅ Tags saved during onboarding:", result.tags)
      // Clear any pending tags from localStorage
      localStorage.removeItem('pending_tags')
      toast.success("Interests saved successfully!")
      router.push("/onboarding/preferences")
    } catch (error: any) {
      console.error("Failed to save preferences:", error)
      toast.error(error.message || "Failed to save preferences")
      // On error, keep user on page so they can retry
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkip = () => {
    router.push("/onboarding/preferences")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-2 bg-primary rounded-full"></div>
            <div className="w-8 h-2 bg-primary rounded-full"></div>
            <div className="w-8 h-2 bg-muted rounded-full"></div>
            <div className="w-8 h-2 bg-muted rounded-full"></div>
          </div>
        </div>

        <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">What causes matter to you?</CardTitle>
            <CardDescription className="text-lg">
              Select the topics you're passionate about. We'll use this to personalize your feed.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
              {CAUSE_TAGS.map((tag) => (
                <Badge
                  key={tag.id}
                  variant={selectedTags.includes(tag.id) ? "default" : "secondary"}
                  className={`cursor-pointer p-3 text-center justify-center transition-all hover:scale-105 ${
                    selectedTags.includes(tag.id)
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary hover:bg-secondary/80"
                  }`}
                  onClick={() => toggleTag(tag.id)}
                >
                  {tag.label}
                </Badge>
              ))}
            </div>

            <div className="text-center text-sm text-muted-foreground mb-8">
              Selected {selectedTags.length} of {CAUSE_TAGS.length} topics
            </div>

            <div className="flex items-center justify-between">
              <Button variant="outline" asChild>
                <Link href="/onboarding/welcome">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Link>
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={handleSkip}>
                  Skip for now
                </Button>
                <Button disabled={selectedTags.length === 0 || isLoading} onClick={handleContinue}>
                  {isLoading ? "Saving..." : "Continue"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
