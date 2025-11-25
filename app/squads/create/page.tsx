"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FeedHeader } from "@/components/feed-header"
import { ArrowLeft, Upload } from "lucide-react"
import { squadService } from "@/lib/api/services"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import { ImageCropper } from "@/components/image-cropper"

export default function CreateSquadPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>("")
  const [showAvatarDialog, setShowAvatarDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string)
        setShowAvatarDialog(true)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAvatarCrop = (croppedImageBlob: Blob) => {
    const file = new File([croppedImageBlob], "squad-avatar.jpg", { type: "image/jpeg" })
    setAvatarFile(file)
    setShowAvatarDialog(false)
    // Update preview with cropped image
    const reader = new FileReader()
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Please enter a squad name")
      return
    }

    try {
      setIsLoading(true)
      const newSquad = await squadService.createSquad({
        name: name.trim(),
        description: description.trim() || undefined,
        avatar: avatarFile || undefined,
      })
      toast.success("Squad created successfully!")
      router.push(`/squads/${newSquad.id}/discussion`)
    } catch (error: any) {
      toast.error(error.message || "Failed to create squad")
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
              <CardTitle className="text-3xl">Create Squad</CardTitle>
              <CardDescription>Create a community for like-minded supporters</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Avatar Upload */}
                <div className="space-y-2">
                  <Label>Squad Avatar</Label>
                  <div className="flex items-center gap-4">
                    {avatarPreview ? (
                      <div className="relative">
                        <img
                          src={avatarPreview}
                          alt="Squad avatar preview"
                          className="w-20 h-20 rounded-full object-cover border-2 border-border"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute -top-2 -right-2"
                          onClick={() => {
                            setAvatarPreview("")
                            setAvatarFile(null)
                          }}
                        >
                          ×
                        </Button>
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center">
                        <Upload className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarSelect}
                        className="hidden"
                        id="avatar-upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById("avatar-upload")?.click()}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {avatarPreview ? "Change Avatar" : "Upload Avatar"}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-1">Optional. JPG, PNG or GIF. Max size 2MB.</p>
                    </div>
                  </div>
                </div>

                {/* Squad Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Squad Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Environmental Warriors"
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell people what this squad is about..."
                    className="min-h-[100px]"
                  />
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading || !name.trim()} className="flex-1">
                    {isLoading ? "Creating..." : "Create Squad"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Avatar Cropper Dialog */}
      {avatarPreview && (
        <ImageCropper
          open={showAvatarDialog}
          onClose={() => {
            setShowAvatarDialog(false)
            setAvatarPreview("")
          }}
          imageSrc={avatarPreview}
          onCropComplete={handleAvatarCrop}
          aspectRatio={1}
          cropShape="round"
        />
      )}
    </div>
  )
}


