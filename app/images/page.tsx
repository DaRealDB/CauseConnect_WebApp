"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FeedHeader } from "@/components/feed-header"
import { Image as ImageIcon, Download, Share2, Heart } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import { eventService } from "@/lib/api/services"
import type { Event } from "@/lib/api/types"

export default function ImagesPage() {
  const { isAuthenticated } = useAuth()
  const [images, setImages] = useState<Array<{ id: string; url: string; title: string; eventId: string }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  useEffect(() => {
    loadImages()
  }, [page])

  const loadImages = async () => {
    try {
      setIsLoading(true)
      // Fetch events with images
      const response = await eventService.getEvents({
        page,
        limit: 20,
        filter: "events",
      })

      // Extract images from events
      const eventImages = response.data
        .filter((event) => event.image)
        .map((event) => ({
          id: `${event.id}-img`,
          url: event.image || "",
          title: event.title,
          eventId: event.id.toString(),
        }))

      setImages((prev) => (page === 1 ? eventImages : [...prev, ...eventImages]))
      setHasMore(response.pagination.page < response.pagination.totalPages)
    } catch (error: any) {
      toast.error(error.message || "Failed to load images")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoadMore = () => {
    setPage((prev) => prev + 1)
  }

  const handleDownload = (url: string, title: string) => {
    const link = document.createElement("a")
    link.href = url
    link.download = `${title.replace(/\s+/g, "-")}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("Image downloaded")
  }

  const handleShare = async (url: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Image from CauseConnect",
          url: url,
        })
      } catch (error) {
        // User cancelled or error occurred
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(url)
      toast.success("Image URL copied to clipboard")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10">
      <FeedHeader />

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <ImageIcon className="w-6 h-6 text-foreground" />
            <h1 className="text-2xl font-bold text-foreground">Event Images</h1>
          </div>

          {isLoading && page === 1 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading images...</p>
            </div>
          ) : images.length === 0 ? (
            <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
              <CardContent className="p-12 text-center">
                <ImageIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No images found</h3>
                <p className="text-muted-foreground">Images from events will appear here.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((image) => (
                  <Card
                    key={image.id}
                    className="border-0 shadow-lg bg-card/80 backdrop-blur-sm overflow-hidden group cursor-pointer hover:shadow-xl transition-all"
                    onClick={() => setSelectedImage(image.url)}
                  >
                    <div className="relative aspect-square overflow-hidden">
                      <img
                        src={image.url}
                        alt={image.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDownload(image.url, image.title)
                          }}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleShare(image.url)
                          }}
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <CardContent className="p-3">
                      <p className="text-sm font-medium text-foreground line-clamp-2">{image.title}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {hasMore && !isLoading && (
                <div className="text-center mt-12">
                  <Button variant="outline" size="lg" onClick={handleLoadMore}>
                    Load More Images
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-7xl max-h-[90vh]">
            <img
              src={selectedImage}
              alt="Full size"
              className="max-w-full max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white"
              onClick={() => setSelectedImage(null)}
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}









