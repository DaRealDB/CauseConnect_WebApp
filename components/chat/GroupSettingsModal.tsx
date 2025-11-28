"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserPlus, UserMinus, X, Upload } from "lucide-react"
import { toast } from "sonner"
import {
  updateGroupSettings,
  addGroupMember,
  removeGroupMember,
  leaveGroupConversation,
} from "@/lib/firebase/chat-enhanced"
import { userService } from "@/lib/api/services"
import type { User } from "@/lib/api/types"
import { getImageUrl } from "@/lib/utils"

interface GroupSettingsModalProps {
  conversationId: string | null
  conversationData?: {
    id: string
    type: 'private' | 'group'
    participants: string[]
    adminId?: string
    groupName?: string
    groupAvatar?: string
  }
  participantsData?: Array<{
    id: string
    name?: string
    username?: string
    avatar?: string
  }>
  isOpen: boolean
  onClose: () => void
  onUpdate?: () => void
}

export function GroupSettingsModal({
  conversationId,
  conversationData,
  participantsData = [],
  isOpen,
  onClose,
  onUpdate,
}: GroupSettingsModalProps) {
  const [groupName, setGroupName] = useState(conversationData?.groupName || '')
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [isSearching, setIsSearching] = useState(false)

  if (!conversationData || conversationData.type !== 'group' || !conversationId) {
    return null
  }

  const isAdmin = conversationData.adminId === participantsData.find((p) => p.id)?.id // Simplified check

  const handleUpdateSettings = async () => {
    if (!conversationId || !isAdmin) return

    try {
      setIsLoading(true)
      await updateGroupSettings(conversationId, conversationData.adminId!, {
        groupName: groupName || undefined,
      })
      toast.success('Group settings updated')
      onUpdate?.()
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update group settings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddMember = async (userId: string) => {
    if (!conversationId || !isAdmin) return

    try {
      setIsLoading(true)
      await addGroupMember(conversationId, conversationData.adminId!, userId)
      toast.success('Member added')
      onUpdate?.()
      setSearchQuery('')
      setSearchResults([])
    } catch (error: any) {
      toast.error(error.message || 'Failed to add member')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (!conversationId || !isAdmin) return

    try {
      setIsLoading(true)
      await removeGroupMember(conversationId, conversationData.adminId!, userId)
      toast.success('Member removed')
      onUpdate?.()
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove member')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLeaveGroup = async () => {
    if (!conversationId) return

    if (!confirm('Are you sure you want to leave this group?')) return

    try {
      setIsLoading(true)
      await leaveGroupConversation(conversationId, conversationData.participants[0]) // Simplified
      toast.success('Left group')
      onClose()
      window.location.href = '/chat'
    } catch (error: any) {
      toast.error(error.message || 'Failed to leave group')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Group Settings</DialogTitle>
          <DialogDescription>Manage group members and settings</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Group Name */}
          {isAdmin && (
            <div className="space-y-2">
              <Label>Group Name</Label>
              <Input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name"
              />
            </div>
          )}

          {/* Members List */}
          <div className="space-y-2">
            <Label>Members ({participantsData.length})</Label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {participantsData.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={getImageUrl(participant.avatar)} />
                      <AvatarFallback>
                        {(participant.name || participant.username || 'U')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{participant.name || participant.username}</p>
                      {participant.id === conversationData.adminId && (
                        <p className="text-xs text-muted-foreground">Admin</p>
                      )}
                    </div>
                  </div>
                  {isAdmin && participant.id !== conversationData.adminId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(participant.id)}
                      disabled={isLoading}
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Add Member (Admin only) */}
          {isAdmin && (
            <div className="space-y-2">
              <Label>Add Member</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      // Trigger search
                    }
                  }}
                />
                <Button
                  onClick={async () => {
                    if (!searchQuery.trim()) return
                    setIsSearching(true)
                    try {
                      const results = await userService.searchUsers(searchQuery.trim(), 5)
                      setSearchResults(results)
                    } catch (error) {
                      toast.error('Failed to search users')
                    } finally {
                      setIsSearching(false)
                    }
                  }}
                  disabled={isSearching || !searchQuery.trim()}
                >
                  Search
                </Button>
              </div>
              {searchResults.length > 0 && (
                <div className="border rounded-lg p-2 space-y-2 max-h-40 overflow-y-auto">
                  {searchResults
                    .filter((user) => !participantsData.find((p) => p.id === user.id.toString()))
                    .map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-2 hover:bg-muted rounded"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={getImageUrl(user.avatar)} />
                            <AvatarFallback>{user.name?.[0] || user.username[0]}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{user.name || user.username}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAddMember(user.id.toString())}
                          disabled={isLoading}
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            {isAdmin && (
              <Button onClick={handleUpdateSettings} disabled={isLoading}>
                Save Changes
              </Button>
            )}
            <Button variant="destructive" onClick={handleLeaveGroup} disabled={isLoading}>
              Leave Group
            </Button>
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}


