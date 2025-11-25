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
import { eventService, postService } from "@/lib/api/services"
import { toast } from "sonner"
import { ImageCropper } from "@/components/image-cropper"

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
  const [images, setImages] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [cropperOpen, setCropperOpen] = useState(false)
  const [selectedImageSrc, setSelectedImageSrc] = useState<string>("")
  const [pendingImageIndex, setPendingImageIndex] = useState<number | null>(null)

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // Handle multiple files for events, single file for posts
    const fileArray = Array.from(files)
    
    if (postType === "post" && fileArray.length > 0) {
      // For posts, only handle the first file
      const file = fileArray[0]
      validateAndOpenCropper(file, null)
    } else {
      // For events, handle each file
      fileArray.forEach((file, index) => {
        validateAndOpenCropper(file, images.length + index)
      })
    }
  }

  const validateAndOpenCropper = (file: File, index: number | null) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file")
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image size must be less than 10MB")
      return
    }

    // Create preview URL and open cropper
    const reader = new FileReader()
    reader.onloadend = () => {
      setSelectedImageSrc(reader.result as string)
      setPendingImageIndex(index)
      setCropperOpen(true)
    }
    reader.readAsDataURL(file)
  }

  const handleCropComplete = (croppedImageBlob: Blob) => {
    // Convert blob to File
    const file = new File([croppedImageBlob], `image-${Date.now()}.jpg`, { type: "image/jpeg" })
    
    if (pendingImageIndex === null) {
      // Add new image
      setImages((prev) => [...prev, file])
    } else {
      // Replace existing image at index
      setImages((prev) => {
        const newImages = [...prev]
        newImages[pendingImageIndex] = file
        return newImages
      })
    }
    
    // Reset state
    setPendingImageIndex(null)
    setSelectedImageSrc("")
  }

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleReplaceImage = (index: number) => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        validateAndOpenCropper(file, index)
      }
    }
    input.click()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (postType === "event") {
        await eventService.createEvent({
          title,
          description,
          location: location || undefined,
          targetDate: date || undefined,
          goalAmount: goalAmount ? Number(goalAmount) : undefined,
          tags,
          images: images.length > 0 ? images : undefined,
        })
        toast.success("Event created successfully!")
      } else {
        await postService.createPost({
          content: description,
          image: images.length > 0 ? images[0] : undefined,
          tags: tags, // Include tags when creating posts
        })
        toast.success("Post created successfully!")
      }
      
      // Clear form
      setTitle("")
      setDescription("")
      setLocation("")
      setDate("")
      setGoalAmount("")
      setTags([])
      setImages([])
      
      // Redirect to feed - it will automatically refresh
      router.push("/feed")
    } catch (error: any) {
      toast.error(error.message || "Failed to create content")
    } finally {
      setIsSubmitting(false)
    }
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
                <p className="text-muted-foreground mb-4">
                  {images.length > 0 
                    ? `${images.length} file(s) selected` 
                    : "Drag and drop images here, or click to select files"}
                </p>
                <input
                  type="file"
                  accept="image/*"
                  multiple={postType === "event"}
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => document.getElementById("image-upload")?.click()}
                >
                  Choose Files
                </Button>
                {images.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img 
                          src={URL.createObjectURL(img)} 
                          alt={`Preview ${idx + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => handleReplaceImage(idx)}
                            className="h-8"
                          >
                            Replace
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveImage(idx)}
                            className="h-8"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-4 pt-6">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting 
                ? "Creating..." 
                : postType === "event" 
                ? "Create Event" 
                : "Publish Post"}
            </Button>
          </div>
        </form>

        {/* Image Cropper Dialog */}
        {selectedImageSrc && (
          <ImageCropper
            open={cropperOpen}
            onClose={() => {
              setCropperOpen(false)
              setPendingImageIndex(null)
              setSelectedImageSrc("")
            }}
            imageSrc={selectedImageSrc}
            onCropComplete={handleCropComplete}
            {...(postType === "post" && { aspectRatio: 16 / 9 })}
            cropShape="rect"
            minZoom={1}
            maxZoom={3}
          />
        )}
      </div>
    </div>
  )
}
