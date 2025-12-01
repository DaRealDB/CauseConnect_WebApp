"use client"

import { useState, ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Camera } from "lucide-react"
import { ImageCropper } from "@/components/image-cropper"
import { userService } from "@/lib/api/services"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"

interface CoverPhotoUploaderProps {
  disabled?: boolean
  onUpdated?: (url: string) => void
}

export function CoverPhotoUploader({ disabled, onUpdated }: CoverPhotoUploaderProps) {
  const { refreshUser } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [cropperOpen, setCropperOpen] = useState(false)
  const [selectedImageSrc, setSelectedImageSrc] = useState("")

  const handleSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      if (!e.target?.result) return
      setSelectedImageSrc(e.target.result as string)
      setCropperOpen(true)
    }
    reader.readAsDataURL(file)
    event.target.value = ""
  }

  const handleCropComplete = async (croppedImageBlob: Blob) => {
    if (!croppedImageBlob) return

    try {
      setIsSaving(true)
      const file = new File([croppedImageBlob], "cover.jpg", { type: "image/jpeg" })
      const result = await userService.uploadCoverImage(file)

      if (onUpdated) {
        onUpdated(result.coverImage)
      }

      try {
        await refreshUser()
      } catch (error) {
        console.error("Failed to refresh user after cover upload:", error)
      }

      toast.success("Cover photo updated successfully!")
    } catch (error: any) {
      if (error?.status === 401) {
        toast.error("Session expired. Please log in again.")
      } else {
        toast.error(error.message || "Failed to upload cover photo")
      }
    } finally {
      setIsSaving(false)
      setCropperOpen(false)
      setSelectedImageSrc("")
    }
  }

  return (
    <>
      <input
        id="cover-upload"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleSelect}
        disabled={disabled || isSaving}
      />
      <Button
        size="sm"
        variant="secondary"
        className="bg-white/90 hover:bg-white"
        onClick={() => document.getElementById("cover-upload")?.click()}
        disabled={disabled || isSaving}
      >
        <Camera className="w-4 h-4 mr-2" />
        {isSaving ? "Uploading..." : "Change Cover Photo"}
      </Button>
      <ImageCropper
        open={cropperOpen}
        onClose={() => {
          setCropperOpen(false)
          setSelectedImageSrc("")
        }}
        imageSrc={selectedImageSrc}
        onCropComplete={handleCropComplete}
        aspectRatio={3}
        cropShape="rect"
      />
    </>
  )
}
