"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Upload, Save } from "lucide-react"
import Link from "next/link"
import { FeedHeader } from "@/components/feed-header"
import { userService } from "@/lib/api/services"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import { ImageCropper } from "@/components/image-cropper"
import { getImageUrl } from "@/lib/utils"

export default function EditProfilePage() {
  const router = useRouter()
  const params = useParams()
  const username = params.username as string
  const { user: currentUser, refreshUser } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    bio: "",
    location: "",
    website: "",
    avatar: "",
  })
  const [cropperOpen, setCropperOpen] = useState(false)
  const [selectedImageSrc, setSelectedImageSrc] = useState<string>("")

  useEffect(() => {
    if (username) {
      loadUserData()
    }
  }, [username])

  const loadUserData = async () => {
    if (!username) {
      toast.error("User not found")
      router.push("/feed")
      return
    }

    // Check if user is editing their own profile
    if (currentUser?.username !== username) {
      toast.error("You can only edit your own profile")
      router.push(`/profile/${username}`)
      return
    }

    try {
      setIsLoading(true)
      const userData = await userService.getUserProfile(username)
      setFormData({
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        bio: userData.bio || "",
        location: userData.location || "",
        website: userData.website || "",
        avatar: userData.avatar || "",
      })
    } catch (error: any) {
      toast.error(error.message || "Failed to load profile data")
      router.push(`/profile/${username}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      await userService.updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        bio: formData.bio,
        location: formData.location,
        website: formData.website,
      })
      
      // Refresh user data in context to see changes immediately
      await refreshUser()
      
      // Reload profile data to see updated information
      await loadUserData()
      
      toast.success("Profile updated successfully!")
      // Stay on the same page instead of redirecting
    } catch (error: any) {
      // Check if it's a 401 error (unauthorized)
      if (error?.status === 401) {
        toast.error("Session expired. Please log in again.")
        // Don't redirect automatically - let the error handler in API client handle it
      } else {
        toast.error(error.message || "Failed to update profile")
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

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
      setCropperOpen(true)
    }
    reader.readAsDataURL(file)
  }

  const handleCropComplete = async (croppedImageBlob: Blob) => {
    try {
      setIsSaving(true)
      // Convert blob to File
      const file = new File([croppedImageBlob], "avatar.jpg", { type: "image/jpeg" })
      
      const result = await userService.uploadAvatar(file)
      
      // Update form data with new avatar URL
      setFormData((prev) => ({ ...prev, avatar: result.avatar }))
      
      // Refresh user data in context to update avatar in header/dropdown
      // Wrap in try-catch to prevent logout if refresh fails
      try {
        await refreshUser()
      } catch (refreshError) {
        // If refresh fails, don't log out - just log the error
        console.error("Failed to refresh user after avatar upload:", refreshError)
        // The avatar was still uploaded successfully, so we can continue
      }
      
      // Close cropper dialog after successful upload
      setCropperOpen(false)
      setSelectedImageSrc("")
      
      toast.success("Avatar updated successfully!")
    } catch (error: any) {
      // Check if it's a 401 error (unauthorized)
      if (error?.status === 401) {
        toast.error("Session expired. Please log in again.")
        // Close cropper on error
        setCropperOpen(false)
        setSelectedImageSrc("")
        // Don't remove token here - let the API client handle it
      } else {
        toast.error(error.message || "Failed to upload avatar")
        // Keep cropper open on non-auth errors so user can try again
      }
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10">
        <FeedHeader />
        <div className="container mx-auto px-4 py-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!currentUser || currentUser.username !== username) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10">
        <FeedHeader />
        <div className="container mx-auto px-4 py-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Please log in to edit your profile</p>
          </div>
        </div>
      </div>
    )
  }

  const displayName = `${formData.firstName} ${formData.lastName}`.trim() || currentUser.username
  const initials = formData.firstName?.[0] || formData.lastName?.[0] || currentUser.username?.[0] || "U"

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10">
      <FeedHeader />

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          {/* Back Button */}
          <Button variant="ghost" className="mb-6" asChild>
            <Link href={`/profile/${username}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Profile
            </Link>
          </Button>

          <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl">Edit Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Avatar Upload */}
                <div className="flex flex-col items-center gap-4">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={getImageUrl(formData.avatar || currentUser.avatar)} />
                    <AvatarFallback className="text-xl">{initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarSelect}
                      disabled={isSaving}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => document.getElementById("avatar-upload")?.click()}
                      disabled={isSaving}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Change Photo
                    </Button>
                  </div>
                </div>

                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      placeholder="Your first name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      placeholder="Your last name"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={currentUser.username}
                    disabled
                    className="bg-muted"
                    placeholder="Your username"
                  />
                  <p className="text-xs text-muted-foreground">Username cannot be changed</p>
                </div>

                {/* Bio */}
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => handleInputChange("bio", e.target.value)}
                    placeholder="Tell people about yourself..."
                    className="min-h-[100px]"
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground">{formData.bio.length}/500 characters</p>
                </div>

                {/* Location and Website */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleInputChange("location", e.target.value)}
                      placeholder="City, Country"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={(e) => handleInputChange("website", e.target.value)}
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button type="submit" disabled={isSaving} className="flex-1">
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <Link href={`/profile/${username}`}>
                      Cancel
                    </Link>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Image Cropper Dialog */}
      <ImageCropper
        open={cropperOpen}
        onClose={() => {
          setCropperOpen(false)
          setSelectedImageSrc("")
        }}
        imageSrc={selectedImageSrc}
        onCropComplete={handleCropComplete}
        aspectRatio={1}
        cropShape="round"
        minZoom={1}
        maxZoom={3}
      />
    </div>
  )
}


