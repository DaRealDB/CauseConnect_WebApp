"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Award,
  MoreHorizontal,
  CheckCircle,
  UserPlus,
  UserCheck,
} from "lucide-react"
import { postService, userService, settingsService } from "@/lib/api/services"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import { getImageUrl, formatTimestamp } from "@/lib/utils"
import { CommentSystem } from "@/components/comment-system"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface UserPostProps {
  post: {
    id: number | string
    user: {
      id?: number | string
      name: string
      username: string
      avatar?: string
      verified: boolean
      following?: boolean
    }
    content: string
    image?: string
    timestamp: string
    likes: number
    comments: number
    participants?: number
    shares: number
    liked: boolean
    bookmarked: boolean
  }
}

export function UserPost({ post }: UserPostProps) {
  const { user: currentUser } = useAuth()
  const [isLiked, setIsLiked] = useState(post.liked)
  const [isBookmarked, setIsBookmarked] = useState(post.bookmarked)
  const [isFollowing, setIsFollowing] = useState(post.user.following || false)
  const [likesCount, setLikesCount] = useState(post.likes)
  const [commentsCount, setCommentsCount] = useState(post.comments)
  const [isBookmarking, setIsBookmarking] = useState(false)
  const [isFollowingLoading, setIsFollowingLoading] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isFading, setIsFading] = useState(false)

  const isOwnPost = currentUser?.id === post.user.id

  // Sync bookmark state from props
  useEffect(() => {
    setIsBookmarked(post.bookmarked)
  }, [post.bookmarked])

  useEffect(() => {
    setCommentsCount(post.comments)
  }, [post.comments])

  const handleLike = async () => {
    const previousState = isLiked
    setIsLiked(!isLiked)
    setLikesCount((prev) => (previousState ? prev - 1 : prev + 1))

    try {
      if (previousState) {
        await postService.unlikePost(post.id)
      } else {
        await postService.likePost(post.id)
      }
    } catch (error: any) {
      // Revert on error
      setIsLiked(previousState)
      setLikesCount((prev) => (previousState ? prev + 1 : prev - 1))
      toast.error(error.message || "Failed to update like")
    }
  }

  const handleBookmark = async () => {
    if (isBookmarking) return

    const previousState = isBookmarked
    setIsBookmarked(!isBookmarked)
    setIsBookmarking(true)

    try {
      if (previousState) {
        await postService.unbookmarkPost(post.id)
        toast.success("Removed from bookmarks")
      } else {
        await postService.bookmarkPost(post.id)
        toast.success("Saved to bookmarks")
      }
    } catch (error: any) {
      // Revert on error
      setIsBookmarked(previousState)
      toast.error(error.message || "Failed to update bookmark")
    } finally {
      setIsBookmarking(false)
    }
  }

  const handleFollow = async () => {
    if (isFollowingLoading || !post.user.id) return

    const previousState = isFollowing
    setIsFollowing(!isFollowing)
    setIsFollowingLoading(true)

    try {
      await userService.toggleFollow(post.user.id)
      toast.success(isFollowing ? "Unfollowed user" : "Following user")
    } catch (error: any) {
      // Revert on error
      setIsFollowing(previousState)
      toast.error(error.message || "Failed to update follow status")
    } finally {
      setIsFollowingLoading(false)
    }
  }

  const handleDeletePost = async () => {
    if (!isOwnPost) return

    try {
      await postService.deletePost(post.id)
      toast.success("Post deleted")
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("post_deleted", { detail: { postId: post.id } }))
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete post")
    }
  }

  const handleBlockAuthor = async () => {
    if (!post.user.id) return

    try {
      await settingsService.blockUser(post.user.id.toString())
      toast.success("User blocked. You may need to refresh the feed.")
    } catch (error: any) {
      toast.error(error.message || "Failed to block user")
    }
  }

  const handleMutePost = async () => {
    if (isMuted || isFading) return

    setIsFading(true)

    try {
      await postService.mutePost(post.id)
      toast.success("Post muted")

      // After fade-out animation, remove the post from the feed locally
      setTimeout(() => {
        setIsMuted(true)
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("post_muted", { detail: { postId: post.id } }))
        }
      }, 300)
    } catch (error: any) {
      setIsFading(false)
      toast.error(error.message || "Failed to mute post")
    }
  }

  if (isMuted) {
    return null
  }

  return (
    <Card
      className={`border-0 shadow-lg bg-card/80 backdrop-blur-sm overflow-hidden hover:shadow-xl transition-all duration-300 ${
        isFading ? "opacity-0 translate-y-2 scale-[0.98]" : "opacity-100"
      }`}
    >
      <CardContent className="p-6">
        {/* User Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={getImageUrl(post.user.avatar)} />
              <AvatarFallback>
                {post.user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">{post.user.name}</span>
                {post.user.verified && <CheckCircle className="w-4 h-4 text-primary" />}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>@{post.user.username}</span>
                <span>•</span>
                <span>{formatTimestamp(post.timestamp)}</span>
              </div>
            </div>
          </div>

          <Button
            size="sm"
            variant={isFollowing ? "outline" : "default"}
            onClick={handleFollow}
            disabled={isFollowingLoading}
            className="flex items-center gap-2"
          >
            {isFollowing ? (
              <>
                <UserCheck className="w-4 h-4" />
                Following
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Follow
              </>
            )}
          </Button>
        </div>

        {/* Post Content */}
        <div className="mb-4">
          <p className="text-foreground mb-4 whitespace-pre-wrap">{post.content}</p>
          {post.image && (
            <div className="rounded-lg overflow-hidden">
              <img 
                src={getImageUrl(post.image)} 
                alt="Post image" 
                className="w-full h-64 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder.svg"
                }}
              />
            </div>
          )}
        </div>

        {/* Engagement Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <span>{likesCount} likes</span>
          <span>{commentsCount} comments</span>
          <span>{post.shares} shares</span>
        </div>

        {/* Engagement Toolbar */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className={`flex items-center gap-2 ${isLiked ? "text-red-500" : ""}`}
              onClick={handleLike}
            >
              <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
              {isLiked ? "Liked" : "Like"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="flex items-center gap-2"
              onClick={() => setShowComments((prev) => !prev)}
            >
              <MessageCircle className="w-4 h-4" />
              Comment
            </Button>
            <Button size="sm" variant="ghost" className="flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </div>

          <div className="flex items-center gap-1">
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={handleBookmark}
              disabled={isBookmarking}
              className={isBookmarked ? "text-primary" : ""}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-current" : ""}`} />
            </Button>
            <Button size="sm" variant="ghost">
              <Award className="w-4 h-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isOwnPost ? (
                  <>
                    <DropdownMenuItem onClick={handleDeletePost}>Delete Post</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toast.info("Edit Post coming soon")}>Edit Post</DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem onClick={handleBlockAuthor}>Block Post</DropdownMenuItem>
                    <DropdownMenuItem onClick={handleMutePost}>Mute Post</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toast.info("Post reported. Thank you.")}>Report Post</DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {showComments && (
          <div className="mt-4">
            <CommentSystem
              postId={post.id}
              type="post"
              onCountChange={(count) => setCommentsCount(count)}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
