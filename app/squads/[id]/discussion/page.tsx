"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { FeedHeader } from "@/components/feed-header"
import {
  ArrowLeft,
  Users,
  Pin,
  Heart,
  MessageCircle,
  MoreHorizontal,
  UserPlus,
  UserMinus,
  Edit,
  Trash2,
  Send,
  Image as ImageIcon,
} from "lucide-react"
import { squadService } from "@/lib/api/services"
import type { Squad, SquadPost, SquadComment } from "@/lib/api/types"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import { getImageUrl, formatTimestamp } from "@/lib/utils"
import { ImageCropper } from "@/components/image-cropper"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function SquadDiscussionPage() {
  const params = useParams()
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const squadId = params.id as string

  const [squad, setSquad] = useState<Squad | null>(null)
  const [posts, setPosts] = useState<SquadPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isJoining, setIsJoining] = useState(false)

  // Post creation
  const [newPostContent, setNewPostContent] = useState("")
  const [newPostImage, setNewPostImage] = useState<File | null>(null)
  const [newPostImagePreview, setNewPostImagePreview] = useState<string>("")
  const [showImageCropper, setShowImageCropper] = useState(false)
  const [isCreatingPost, setIsCreatingPost] = useState(false)

  useEffect(() => {
    loadSquad()
    loadPosts()
  }, [squadId])

  const loadSquad = async () => {
    try {
      const data = await squadService.getSquadById(squadId)
      setSquad(data)
    } catch (error: any) {
      toast.error(error.message || "Failed to load squad")
      router.push("/squads")
    } finally {
      setIsLoading(false)
    }
  }

  const loadPosts = async () => {
    try {
      const response = await squadService.getSquadPosts(squadId)
      setPosts(response.data)
    } catch (error: any) {
      toast.error(error.message || "Failed to load posts")
    }
  }

  const handleJoin = async () => {
    try {
      setIsJoining(true)
      await squadService.joinSquad(squadId)
      await loadSquad()
      toast.success("Joined squad successfully!")
    } catch (error: any) {
      toast.error(error.message || "Failed to join squad")
    } finally {
      setIsJoining(false)
    }
  }

  const handleLeave = async () => {
    try {
      setIsJoining(true)
      await squadService.leaveSquad(squadId)
      await loadSquad()
      toast.success("Left squad successfully!")
    } catch (error: any) {
      toast.error(error.message || "Failed to leave squad")
    } finally {
      setIsJoining(false)
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setNewPostImagePreview(e.target?.result as string)
        setShowImageCropper(true)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleImageCrop = (croppedImageBlob: Blob) => {
    const file = new File([croppedImageBlob], "post-image.jpg", { type: "image/jpeg" })
    setNewPostImage(file)
    setShowImageCropper(false)
    // Update preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setNewPostImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && !newPostImage) {
      toast.error("Please enter content or add an image")
      return
    }

    try {
      setIsCreatingPost(true)
      await squadService.createSquadPost(squadId, {
        content: newPostContent.trim(),
        image: newPostImage || undefined,
      })
      setNewPostContent("")
      setNewPostImage(null)
      setNewPostImagePreview("")
      await loadPosts()
      toast.success("Post created successfully!")
    } catch (error: any) {
      toast.error(error.message || "Failed to create post")
    } finally {
      setIsCreatingPost(false)
    }
  }

  const handleToggleReaction = async (postId: string) => {
    try {
      await squadService.toggleReaction(squadId, {
        postId,
        type: "like",
      })
      await loadPosts()
    } catch (error: any) {
      toast.error(error.message || "Failed to react")
    }
  }

  const handlePinPost = async (postId: string, isPinned: boolean) => {
    try {
      await squadService.pinSquadPost(squadId, postId, !isPinned)
      await loadPosts()
      toast.success(isPinned ? "Post unpinned" : "Post pinned")
    } catch (error: any) {
      toast.error(error.message || "Failed to pin post")
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return

    try {
      await squadService.deleteSquadPost(squadId, postId)
      await loadPosts()
      toast.success("Post deleted successfully")
    } catch (error: any) {
      toast.error(error.message || "Failed to delete post")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10">
        <FeedHeader />
        <div className="container mx-auto px-4 py-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading squad...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!squad) {
    return null
  }

  const isAdmin = squad.role === "admin"
  const isMember = squad.isMember || false

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10">
      <FeedHeader />

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Button variant="ghost" className="mb-6" onClick={() => router.push("/squads")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Squads
          </Button>

          {/* Squad Header */}
          <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm mb-6">
            <CardHeader>
              <div className="flex items-start gap-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={getImageUrl(squad.avatar)} />
                  <AvatarFallback className="text-2xl">{squad.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-2xl">{squad.name}</CardTitle>
                    {isAdmin && <Badge variant="secondary">Admin</Badge>}
                  </div>
                  {squad.description && (
                    <p className="text-muted-foreground mb-4">{squad.description}</p>
                  )}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>{squad.members} {squad.members === 1 ? "member" : "members"}</span>
                    </div>
                    {squad.creator && (
                      <div className="text-sm text-muted-foreground">
                        Created by {squad.creator.name}
                      </div>
                    )}
                  </div>
                </div>
                {!isMember ? (
                  <Button onClick={handleJoin} disabled={isJoining}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    {isJoining ? "Joining..." : "Join Squad"}
                  </Button>
                ) : (
                  <Button variant="outline" onClick={handleLeave} disabled={isJoining}>
                    <UserMinus className="w-4 h-4 mr-2" />
                    {isJoining ? "Leaving..." : "Leave Squad"}
                  </Button>
                )}
              </div>
            </CardHeader>
          </Card>

          {/* Post Composer */}
          {isMember && (
            <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm mb-6">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Textarea
                    placeholder="What's on your mind?"
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    className="min-h-[100px]"
                  />
                  {newPostImagePreview && (
                    <div className="relative">
                      <img
                        src={newPostImagePreview}
                        alt="Preview"
                        className="w-full max-h-64 object-cover rounded-lg"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setNewPostImage(null)
                          setNewPostImagePreview("")
                        }}
                      >
                        ×
                      </Button>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                        id="post-image-upload"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => document.getElementById("post-image-upload")?.click()}
                      >
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Add Image
                      </Button>
                    </div>
                    <Button onClick={handleCreatePost} disabled={isCreatingPost || (!newPostContent.trim() && !newPostImage)}>
                      <Send className="w-4 h-4 mr-2" />
                      {isCreatingPost ? "Posting..." : "Post"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Posts Feed */}
          <div className="space-y-4">
            {posts.length === 0 ? (
              <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">No posts yet. Be the first to post!</p>
                </CardContent>
              </Card>
            ) : (
              posts.map((post) => (
                <SquadPostCard
                  key={post.id}
                  post={post}
                  squadId={squadId}
                  isAdmin={isAdmin}
                  isAuthor={post.user.id === currentUser?.id}
                  onReaction={() => handleToggleReaction(post.id)}
                  onPin={() => handlePinPost(post.id, post.isPinned)}
                  onDelete={() => handleDeletePost(post.id)}
                  onRefresh={loadPosts}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Image Cropper */}
      {showImageCropper && (
        <ImageCropper
          open={showImageCropper}
          onClose={() => {
            setShowImageCropper(false)
            setNewPostImagePreview("")
          }}
          imageSrc={newPostImagePreview}
          onCropComplete={handleImageCrop}
          aspectRatio={16 / 9}
          cropShape="rect"
        />
      )}
    </div>
  )
}

function SquadPostCard({
  post,
  squadId,
  isAdmin,
  isAuthor,
  onReaction,
  onPin,
  onDelete,
  onRefresh,
}: {
  post: SquadPost
  squadId: string
  isAdmin: boolean
  isAuthor: boolean
  onReaction: () => void
  onPin: () => void
  onDelete: () => void
  onRefresh: () => void
}) {
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<SquadComment[]>([])
  const [newComment, setNewComment] = useState("")
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [isPostingComment, setIsPostingComment] = useState(false)

  const loadComments = async () => {
    try {
      setIsLoadingComments(true)
      const response = await squadService.getSquadPostComments(squadId, post.id)
      setComments(response.data)
    } catch (error: any) {
      toast.error(error.message || "Failed to load comments")
    } finally {
      setIsLoadingComments(false)
    }
  }

  const handleToggleComments = () => {
    if (!showComments && comments.length === 0) {
      loadComments()
    }
    setShowComments(!showComments)
  }

  const handlePostComment = async () => {
    if (!newComment.trim()) return

    try {
      setIsPostingComment(true)
      await squadService.createSquadComment(squadId, post.id, {
        content: newComment.trim(),
      })
      setNewComment("")
      await loadComments()
      toast.success("Comment posted")
    } catch (error: any) {
      toast.error(error.message || "Failed to post comment")
    } finally {
      setIsPostingComment(false)
    }
  }

  return (
    <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={getImageUrl(post.user.avatar)} />
              <AvatarFallback>{post.user.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{post.user.name}</span>
                {post.user.verified && <Badge variant="secondary" className="text-xs">✓</Badge>}
              </div>
              <p className="text-xs text-muted-foreground">{formatTimestamp(post.createdAt)}</p>
            </div>
          </div>
          {(isAdmin || isAuthor) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {isAdmin && (
                  <DropdownMenuItem onClick={onPin}>
                    <Pin className="w-4 h-4 mr-2" />
                    {post.isPinned ? "Unpin" : "Pin"} Post
                  </DropdownMenuItem>
                )}
                {isAuthor && (
                  <DropdownMenuItem>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {(isAdmin || isAuthor) && (
                  <DropdownMenuItem onClick={onDelete} className="text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        {post.isPinned && (
          <Badge variant="secondary" className="mt-2 w-fit">
            <Pin className="w-3 h-3 mr-1" />
            Pinned
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap mb-4">{post.content}</p>
        {post.image && (
          <img
            src={getImageUrl(post.image)}
            alt="Post"
            className="w-full rounded-lg mb-4"
          />
        )}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <Button
            variant="ghost"
            size="sm"
            onClick={onReaction}
            className={post.userReaction ? "text-primary" : ""}
          >
            <Heart className={`w-4 h-4 mr-1 ${post.userReaction ? "fill-current" : ""}`} />
            {post.reactionsCount}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleToggleComments}>
            <MessageCircle className="w-4 h-4 mr-1" />
            {post.commentsCount}
          </Button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 pt-4 border-t">
            {isLoadingComments ? (
              <p className="text-sm text-muted-foreground">Loading comments...</p>
            ) : (
              <>
                <div className="space-y-4 mb-4">
                  {comments.map((comment) => (
                    <SquadCommentCard
                      key={comment.id}
                      comment={comment}
                      squadId={squadId}
                      postId={post.id}
                      onRefresh={loadComments}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[60px]"
                  />
                  <Button onClick={handlePostComment} disabled={isPostingComment || !newComment.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function SquadCommentCard({
  comment,
  squadId,
  postId,
  onRefresh,
}: {
  comment: SquadComment
  squadId: string
  postId: string
  onRefresh: () => void
}) {
  const [showReplies, setShowReplies] = useState(false)
  const [newReply, setNewReply] = useState("")
  const [isPostingReply, setIsPostingReply] = useState(false)

  const handlePostReply = async () => {
    if (!newReply.trim()) return

    try {
      setIsPostingReply(true)
      await squadService.createSquadComment(squadId, postId, {
        content: newReply.trim(),
        parentId: comment.id,
      })
      setNewReply("")
      await onRefresh()
      toast.success("Reply posted")
    } catch (error: any) {
      toast.error(error.message || "Failed to post reply")
    } finally {
      setIsPostingReply(false)
    }
  }

  const handleToggleReaction = async () => {
    try {
      await squadService.toggleReaction(squadId, {
        commentId: comment.id,
        type: "like",
      })
      await onRefresh()
    } catch (error: any) {
      toast.error(error.message || "Failed to react")
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <Avatar className="w-8 h-8">
          <AvatarImage src={getImageUrl(comment.user.avatar)} />
          <AvatarFallback>{comment.user.name[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm">{comment.user.name}</span>
            {comment.user.verified && <Badge variant="secondary" className="text-xs px-1">✓</Badge>}
            <span className="text-xs text-muted-foreground">{formatTimestamp(comment.createdAt)}</span>
          </div>
          <p className="text-sm">{comment.content}</p>
          <div className="flex items-center gap-3 mt-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={handleToggleReaction}
            >
              <Heart className={`w-3 h-3 mr-1 ${comment.userReaction ? "fill-current text-primary" : ""}`} />
              {comment.reactionsCount}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={() => setShowReplies(!showReplies)}
            >
              Reply
            </Button>
          </div>
          {showReplies && (
            <div className="mt-2 ml-4 pl-4 border-l-2">
              <div className="flex gap-2 mb-2">
                <Textarea
                  placeholder="Write a reply..."
                  value={newReply}
                  onChange={(e) => setNewReply(e.target.value)}
                  className="min-h-[50px] text-sm"
                />
                <Button onClick={handlePostReply} disabled={isPostingReply || !newReply.trim()} size="sm">
                  <Send className="w-3 h-3" />
                </Button>
              </div>
              {comment.replies.map((reply) => (
                <div key={reply.id} className="mb-2">
                  <div className="flex items-start gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={getImageUrl(reply.user.avatar)} />
                      <AvatarFallback className="text-xs">{reply.user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-xs">{reply.user.name}</span>
                        <span className="text-xs text-muted-foreground">{formatTimestamp(reply.createdAt)}</span>
                      </div>
                      <p className="text-xs">{reply.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}













