"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Upload, X, Plus, Target, Users } from "lucide-react"
import { useRouter } from "next/navigation"

export default function CreatePage() {
  const router = useRouter()
  const [postType, setPostType] = useState<"event" | "post">("event")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [date, setDate] = useState("")
  const [goalAmount, setGoalAmount] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")
  const [images, setImages] = useState<string[]>([])

  const suggestedTags = [
    "Education",
    "Healthcare",
    "Environment",
    "Poverty",
    "Clean Water",
    "Animal Welfare",
    "Disaster Relief",
    "Community Development",
    "Human Rights",
  ]

  const addTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag])
    }
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    console.log("[v0] Creating post:", { postType, title, description, location, date, goalAmount, tags, images })
    router.push("/feed")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-orange-50/30 to-peach-50/30">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Create New Content</h1>
          <p className="text-muted-foreground">Share your cause or create an event to make a difference</p>
        </div>

        {/* Post Type Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">What would you like to create?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant={postType === "event" ? "default" : "outline"}
                onClick={() => setPostType("event")}
                className="h-20 flex flex-col gap-2"
              >
                <Target className="h-6 w-6" />
                <span>Charity Event</span>
              </Button>
              <Button
                variant={postType === "post" ? "default" : "outline"}
                onClick={() => setPostType("post")}
                className="h-20 flex flex-col gap-2"
              >
                <Users className="h-6 w-6" />
                <span>Community Post</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {postType === "event" ? "Event Title" : "Post Title"}
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    postType === "event" ? "Clean Water Initiative for Rural Kenya" : "Share your thoughts..."
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell people about your cause and why it matters..."
                  rows={4}
                  required
                />
              </div>

              {postType === "event" && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        <MapPin className="inline h-4 w-4 mr-1" />
                        Location
                      </label>
                      <Input
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Kenya, East Africa"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        <Calendar className="inline h-4 w-4 mr-1" />
                        Target Date
                      </label>
                      <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <Target className="inline h-4 w-4 mr-1" />
                      Funding Goal (USD)
                    </label>
                    <Input
                      type="number"
                      value={goalAmount}
                      onChange={(e) => setGoalAmount(e.target.value)}
                      placeholder="50000"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="px-3 py-1">
                    {tag}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="ml-2 h-4 w-4 p-0"
                      onClick={() => removeTag(tag)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add custom tag..."
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      if (newTag.trim()) {
                        addTag(newTag.trim())
                        setNewTag("")
                      }
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (newTag.trim()) {
                      addTag(newTag.trim())
                      setNewTag("")
                    }
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Suggested tags:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedTags.map((tag) => (
                    <Button
                      key={tag}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addTag(tag)}
                      disabled={tags.includes(tag)}
                    >
                      {tag}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Media Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Media</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Drag and drop images here, or click to select files</p>
                <Button type="button" variant="outline">
                  Choose Files
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-4 pt-6">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {postType === "event" ? "Create Event" : "Publish Post"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
