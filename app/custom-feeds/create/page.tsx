"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { FeedHeader } from "@/components/feed-header"
import { ArrowLeft, X } from "lucide-react"
import { customFeedService } from "@/lib/api/services"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"

const AVAILABLE_TAGS = [
  "education",
  "environment",
  "health",
  "poverty",
  "animals",
  "human-rights",
  "disaster-relief",
  "arts-culture",
  "technology",
  "elderly",
  "youth",
  "mental-health",
]

export default function CreateCustomFeedPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [name, setName] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Please enter a feed name")
      return
    }
    if (selectedTags.length === 0) {
      toast.error("Please select at least one tag")
      return
    }

    try {
      setIsLoading(true)
      await customFeedService.createFeed({ name, tags: selectedTags })
      toast.success("Custom feed created successfully!")
      router.push("/custom-feeds")
    } catch (error: any) {
      toast.error(error.message || "Failed to create custom feed")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isAuthenticated) {
    router.push("/login")
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10">
      <FeedHeader />

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <Button variant="ghost" onClick={() => router.back()} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-3xl">Create Custom Feed</CardTitle>
              <CardDescription>Select tags to personalize your feed content</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Feed Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., My Environmental Causes"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Select Tags</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {AVAILABLE_TAGS.map((tag) => (
                      <Badge
                        key={tag}
                        variant={selectedTags.includes(tag) ? "default" : "secondary"}
                        className={`cursor-pointer p-3 text-center justify-center transition-all hover:scale-105 ${
                          selectedTags.includes(tag)
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary hover:bg-secondary/80"
                        }`}
                        onClick={() => toggleTag(tag)}
                      >
                        {tag.replace("-", " ")}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Selected {selectedTags.length} {selectedTags.length === 1 ? "tag" : "tags"}
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading || !name.trim() || selectedTags.length === 0} className="flex-1">
                    {isLoading ? "Creating..." : "Create Feed"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}











