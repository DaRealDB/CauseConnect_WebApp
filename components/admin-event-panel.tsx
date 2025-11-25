"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Settings,
  Edit,
  Trash2,
  Users,
  BarChart3,
  Image as ImageIcon,
  Save,
  X,
  Loader2,
} from "lucide-react"
import { eventService } from "@/lib/api/services"
import { toast } from "sonner"
import type { Event } from "@/lib/api/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatTimestamp } from "@/lib/utils"
import { useCurrency } from "@/contexts/CurrencyContext"
import { useRouter } from "next/navigation"

interface AdminEventPanelProps {
  event: Event
  onUpdate: () => void
}

interface Participant {
  id: string
  name: string
  username: string
  avatar?: string
  verified: boolean
  joinedAt: string
}

interface Analytics {
  overview: {
    supporters: number
    donations: number
    bookmarks: number
    comments: number
    totalRaised: number
    averageDonation: number
    donationCount: number
  }
  trends: {
    dailySupports: Array<{ date: string; count: number }>
  }
}

export function AdminEventPanel({ event, onUpdate }: AdminEventPanelProps) {
  const router = useRouter()
  const { formatAmountSimple, getSymbol } = useCurrency()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false)
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(false)
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [editData, setEditData] = useState({
    title: event.title,
    description: event.description,
    fullDescription: event.fullDescription || event.description,
    location: event.location || "",
    goalAmount: event.goal.toString(),
    tags: event.tags.join(","),
  })

  useEffect(() => {
    setEditData({
      title: event.title,
      description: event.description,
      fullDescription: event.fullDescription || event.description,
      location: event.location || "",
      goalAmount: event.goal.toString(),
      tags: event.tags.join(","),
    })
  }, [event])

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const tags = editData.tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
      
      await eventService.updateEvent(event.id, {
        title: editData.title,
        description: editData.description,
        fullDescription: editData.fullDescription,
        location: editData.location,
        goalAmount: editData.goalAmount,
        tags,
      })
      toast.success("Event updated successfully!")
      setIsEditOpen(false)
      onUpdate()
    } catch (error: any) {
      toast.error(error.message || "Failed to update event")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await eventService.deleteEvent(event.id)
      toast.success("Event deleted successfully!")
      
      // Navigate immediately to feed using Next.js router (preserves auth state)
      // Don't use window.location.href as it causes full page reload and can clear auth
      // Use replace to prevent back button from going to deleted event page
      router.replace("/feed")
    } catch (error: any) {
      console.error("Delete event error:", error)
      setIsDeleting(false) // Reset loading state on error
      
      // Handle specific error cases
      if (error.status === 401) {
        toast.error("Session expired. Please log in again.")
      } else if (error.status === 403) {
        toast.error("You don't have permission to delete this event.")
      } else {
        toast.error(error.message || "Failed to delete event")
      }
    }
  }

  const loadParticipants = async () => {
    try {
      setIsLoadingParticipants(true)
      const result = await eventService.getEventParticipants(event.id, { page: 1, limit: 50 })
      setParticipants(result.data)
    } catch (error: any) {
      toast.error(error.message || "Failed to load participants")
    } finally {
      setIsLoadingParticipants(false)
    }
  }

  const loadAnalytics = async () => {
    try {
      setIsLoadingAnalytics(true)
      const result = await eventService.getEventAnalytics(event.id)
      setAnalytics(result)
    } catch (error: any) {
      toast.error(error.message || "Failed to load analytics")
    } finally {
      setIsLoadingAnalytics(false)
    }
  }

  return (
    <Card className="border-2 border-primary/20 bg-primary/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Event Admin Panel</CardTitle>
          </div>
          <Badge variant="secondary">Owner</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-background rounded-lg">
            <div className="text-2xl font-bold text-primary">{event.supporters}</div>
            <div className="text-xs text-muted-foreground">Supporters</div>
          </div>
          <div className="text-center p-3 bg-background rounded-lg">
            <div className="text-2xl font-bold text-primary">
              {formatAmountSimple(event.raised)}
            </div>
            <div className="text-xs text-muted-foreground">Raised</div>
          </div>
          <div className="text-center p-3 bg-background rounded-lg">
            <div className="text-2xl font-bold text-primary">
              {Math.round((event.raised / event.goal) * 100)}%
            </div>
            <div className="text-xs text-muted-foreground">Progress</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                <Edit className="w-4 h-4 mr-2" />
                Edit Event Details
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Event</DialogTitle>
                <DialogDescription>Update your event information</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Title</Label>
                  <Input
                    id="edit-title"
                    value={editData.title}
                    onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Short Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editData.description}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-full-description">Full Description</Label>
                  <Textarea
                    id="edit-full-description"
                    value={editData.fullDescription}
                    onChange={(e) => setEditData({ ...editData, fullDescription: e.target.value })}
                    rows={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-location">Location</Label>
                  <Input
                    id="edit-location"
                    value={editData.location}
                    onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-goal">Goal Amount ({getSymbol()})</Label>
                  <Input
                    id="edit-goal"
                    type="number"
                    value={editData.goalAmount}
                    onChange={(e) => setEditData({ ...editData, goalAmount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
                  <Input
                    id="edit-tags"
                    value={editData.tags}
                    onChange={(e) => setEditData({ ...editData, tags: e.target.value })}
                    placeholder="education, children, health"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button variant="outline" className="w-full justify-start" disabled>
            <ImageIcon className="w-4 h-4 mr-2" />
            Manage Images
            <Badge variant="secondary" className="ml-auto">Coming Soon</Badge>
          </Button>

          <Dialog open={isParticipantsOpen} onOpenChange={setIsParticipantsOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={loadParticipants}
              >
                <Users className="w-4 h-4 mr-2" />
                View Participants
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>Event Participants</DialogTitle>
                <DialogDescription>
                  View all users who have supported this event
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[60vh]">
                {isLoadingParticipants ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : participants.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No participants yet
                  </div>
                ) : (
                  <div className="space-y-3">
                    {participants.map((participant) => (
                      <div
                        key={participant.id}
                        className="flex items-center gap-3 p-3 rounded-lg border"
                      >
                        <Avatar>
                          <AvatarImage src={participant.avatar} />
                          <AvatarFallback>
                            {participant.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{participant.name}</span>
                            {participant.verified && (
                              <Badge variant="secondary" className="text-xs">Verified</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            @{participant.username}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatTimestamp(participant.joinedAt)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </DialogContent>
          </Dialog>

          <Dialog open={isAnalyticsOpen} onOpenChange={setIsAnalyticsOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={loadAnalytics}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                View Analytics
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>Event Analytics</DialogTitle>
                <DialogDescription>
                  Detailed statistics and insights for your event
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[60vh]">
                {isLoadingAnalytics ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : analytics ? (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-3">Overview</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="text-sm text-muted-foreground">Supporters</div>
                          <div className="text-2xl font-bold">{analytics.overview.supporters}</div>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="text-sm text-muted-foreground">Donations</div>
                          <div className="text-2xl font-bold">{analytics.overview.donations}</div>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="text-sm text-muted-foreground">Bookmarks</div>
                          <div className="text-2xl font-bold">{analytics.overview.bookmarks}</div>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="text-sm text-muted-foreground">Comments</div>
                          <div className="text-2xl font-bold">{analytics.overview.comments}</div>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="text-sm text-muted-foreground">Total Raised</div>
                          <div className="text-2xl font-bold">
                            {formatAmountSimple(analytics.overview.totalRaised)}
                          </div>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="text-sm text-muted-foreground">Avg Donation</div>
                          <div className="text-2xl font-bold">
                            {formatAmountSimple(analytics.overview.averageDonation)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No analytics data available
                  </div>
                )}
              </ScrollArea>
            </DialogContent>
          </Dialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full justify-start">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Event
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your event and all
                  associated data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground"
                >
                  {isDeleting ? "Deleting..." : "Delete Event"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  )
}
