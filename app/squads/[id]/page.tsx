"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { FeedHeader } from "@/components/feed-header"
import {
  ArrowLeft,
  Users,
  Settings,
  Camera,
  Edit,
  Save,
  X,
  UserMinus,
  Shield,
  Crown,
  Trash2,
  MessageCircle,
} from "lucide-react"
import { squadService } from "@/lib/api/services"
import type { Squad, SquadMember } from "@/lib/api/types"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import { getImageUrl } from "@/lib/utils"
import { ImageCropper } from "@/components/image-cropper"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"

export default function SquadManagePage() {
  const params = useParams()
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const squadId = params.id as string

  const [squad, setSquad] = useState<Squad | null>(null)
  const [members, setMembers] = useState<SquadMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showAvatarDialog, setShowAvatarDialog] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string>("")

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
  })

  // Check if user is admin
  const isAdmin = squad?.role === 'admin'

  // Load squad details
  useEffect(() => {
    if (!squadId) return

    const loadSquad = async () => {
      try {
        setIsLoading(true)
        const squadData = await squadService.getSquadById(squadId)
        setSquad(squadData)
        setEditForm({
          name: squadData.name || "",
          description: squadData.description || "",
        })

        // Load members
        const membersResponse = await squadService.getSquadMembers(squadId)
        setMembers(membersResponse.data || [])
      } catch (error: any) {
        console.error("Error loading squad:", error)
        toast.error(error.message || "Failed to load squad")
        router.push("/settings?section=community")
      } finally {
        setIsLoading(false)
      }
    }

    loadSquad()
  }, [squadId, router])

  const handleSaveSquad = async () => {
    if (!squad || !isAdmin) return

    try {
      setIsSaving(true)
      const updatedSquad = await squadService.updateSquad(squadId, {
        name: editForm.name,
        description: editForm.description,
      })
      setSquad(updatedSquad)
      toast.success("Squad updated successfully")
      setIsEditing(false)
    } catch (error: any) {
      console.error("Error updating squad:", error)
      toast.error(error.message || "Failed to update squad")
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!isAdmin) return

    try {
      await squadService.removeMember(squadId, memberId)
      toast.success("Member removed successfully")
      setMembers(members.filter((m) => m.id !== memberId))
      // Update squad member count
      if (squad) {
        setSquad({ ...squad, members: squad.members - 1 })
      }
    } catch (error: any) {
      console.error("Error removing member:", error)
      toast.error(error.message || "Failed to remove member")
    }
  }

  const handleChangeRole = async (memberId: string, newRole: 'admin' | 'moderator' | 'member') => {
    if (!isAdmin) return

    try {
      await squadService.changeMemberRole(squadId, memberId, newRole)
      toast.success("Member role updated")
      setMembers(
        members.map((m) => (m.id === memberId ? { ...m, role: newRole as string } : m))
      )
    } catch (error: any) {
      console.error("Error changing role:", error)
      toast.error(error.message || "Failed to update role")
    }
  }

  const handleDeleteSquad = async () => {
    if (!squad || !isAdmin) return

    try {
      await squadService.deleteSquad(squadId)
      toast.success("Squad deleted successfully")
      router.push("/settings?section=community")
    } catch (error: any) {
      console.error("Error deleting squad:", error)
      toast.error(error.message || "Failed to delete squad")
      setShowDeleteDialog(false)
    }
  }

  const handleAvatarChange = async (croppedImage: Blob) => {
    if (!squad || !isAdmin) return

    try {
      // Convert blob to File
      const file = new File([croppedImage], 'avatar.png', { type: 'image/png' })
      const updatedSquad = await squadService.updateSquad(squadId, { avatar: file })
      setSquad(updatedSquad)
      toast.success("Avatar updated successfully")
      setShowAvatarDialog(false)
      setAvatarPreview("")
    } catch (error: any) {
      console.error("Error updating avatar:", error)
      toast.error(error.message || "Failed to update avatar")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-orange-50/30 to-peach-50/30">
        <FeedHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-muted-foreground">Loading squad...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!squad) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-orange-50/30 to-peach-50/30">
        <FeedHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-muted-foreground">Squad not found</p>
            <Button onClick={() => router.push("/settings?section=community")} className="mt-4">
              Back to Settings
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-orange-50/30 to-peach-50/30">
      <FeedHeader />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/settings?section=community")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Manage Squad</h1>
            <p className="text-muted-foreground">Manage your squad settings and members</p>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false)
                      setEditForm({
                        name: squad.name || "",
                        description: squad.description || "",
                      })
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleSaveSquad} disabled={isSaving}>
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Squad
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Squad Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Squad Details Card */}
            <Card>
              <CardHeader>
                <CardTitle>Squad Details</CardTitle>
                <CardDescription>Manage your squad information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage
                        src={squad.avatar ? getImageUrl(squad.avatar) : undefined}
                        alt={squad.name}
                      />
                      <AvatarFallback>
                        {squad.name?.[0]?.toUpperCase() || "S"}
                      </AvatarFallback>
                    </Avatar>
                    {isAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                        onClick={() => setShowAvatarDialog(true)}
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">{squad.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      Created by {squad.creator?.name || squad.creator?.username}
                    </p>
                    <Badge variant="outline" className="mt-2">
                      {squad.members} {squad.members === 1 ? 'member' : 'members'}
                    </Badge>
                  </div>
                </div>

                <Separator />

                {/* Edit Form */}
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Squad Name</Label>
                      <Input
                        id="name"
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm({ ...editForm, name: e.target.value })
                        }
                        placeholder="Enter squad name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={editForm.description}
                        onChange={(e) =>
                          setEditForm({ ...editForm, description: e.target.value })
                        }
                        placeholder="Enter squad description"
                        rows={4}
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <Label>Description</Label>
                    <p className="text-sm text-muted-foreground mt-2">
                      {squad.description || "No description provided"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Members Card */}
            <Card>
              <CardHeader>
                <CardTitle>Members</CardTitle>
                <CardDescription>Manage squad members and their roles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage
                            src={member.avatar ? getImageUrl(member.avatar) : undefined}
                            alt={member.name}
                          />
                          <AvatarFallback>
                            {member.name?.[0]?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{member.name}</p>
                            {member.verified && (
                              <Badge variant="outline" className="text-xs">
                                Verified
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">@{member.username}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            member.role === 'admin'
                              ? 'default'
                              : member.role === 'moderator'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {member.role === 'admin' && <Crown className="h-3 w-3 mr-1" />}
                          {member.role === 'moderator' && <Shield className="h-3 w-3 mr-1" />}
                          {typeof member.role === 'string' ? member.role.charAt(0).toUpperCase() + member.role.slice(1) : member.role}
                        </Badge>
                        {isAdmin && member.id !== currentUser?.id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Settings className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {member.role !== 'admin' && (
                                <DropdownMenuItem
                                  onClick={() => handleChangeRole(member.id, 'admin')}
                                >
                                  <Crown className="h-4 w-4 mr-2" />
                                  Make Admin
                                </DropdownMenuItem>
                              )}
                              {member.role !== 'moderator' && (
                                <DropdownMenuItem
                                  onClick={() => handleChangeRole(member.id, 'moderator')}
                                >
                                  <Shield className="h-4 w-4 mr-2" />
                                  Make Moderator
                                </DropdownMenuItem>
                              )}
                              {member.role !== 'member' && (
                                <DropdownMenuItem
                                  onClick={() => handleChangeRole(member.id, 'member')}
                                >
                                  <Users className="h-4 w-4 mr-2" />
                                  Make Member
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleRemoveMember(member.id)}
                              >
                                <UserMinus className="h-4 w-4 mr-2" />
                                Remove Member
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Actions */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  asChild
                >
                  <Link href={`/squads/${squadId}/discussion`}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    View Discussion
                  </Link>
                </Button>
                {isAdmin && (
                  <>
                    <Separator />
                    <Button
                      variant="destructive"
                      className="w-full justify-start"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Squad
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Squad Info */}
            <Card>
              <CardHeader>
                <CardTitle>Squad Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Your Role:</span>
                  <Badge className="ml-2">
                    {squad.role === 'admin' && <Crown className="h-3 w-3 mr-1" />}
                    {squad.role?.charAt(0).toUpperCase() + squad.role?.slice(1) || 'Member'}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Total Members:</span>
                  <span className="ml-2">{squad.members}</span>
                </div>
                <div>
                  <span className="font-medium">Posts:</span>
                  <span className="ml-2">{squad.posts || 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Avatar Dialog */}
      <ImageCropper
        isOpen={showAvatarDialog}
        onClose={() => {
          setShowAvatarDialog(false)
          setAvatarPreview("")
        }}
        onCrop={handleAvatarChange}
        aspectRatio={1}
        title="Update Squad Avatar"
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Squad</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{squad.name}"? This action cannot be undone.
              All squad posts, comments, and members will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSquad}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

