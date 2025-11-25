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
  Users,
} from "lucide-react"
import { postService } from "@/lib/api/services"
import { userService } from "@/lib/api/services"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import { getImageUrl, formatTimestamp } from "@/lib/utils"

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
    isParticipating?: boolean
  }
}

export function UserPost({ post }: UserPostProps) {
  const { user: currentUser } = useAuth()
  const [isLiked, setIsLiked] = useState(post.liked)
  const [isBookmarked, setIsBookmarked] = useState(post.bookmarked)
  const [isFollowing, setIsFollowing] = useState(post.user.following || false)
  const [isParticipating, setIsParticipating] = useState(post.isParticipating || false)
  const [likesCount, setLikesCount] = useState(post.likes)
  const [participantsCount, setParticipantsCount] = useState(post.participants || 0)
  const [isBookmarking, setIsBookmarking] = useState(false)
  const [isFollowingLoading, setIsFollowingLoading] = useState(false)
  const [isParticipatingLoading, setIsParticipatingLoading] = useState(false)

  const isOwnPost = currentUser?.id === post.user.id

  // Sync bookmark state from props
  useEffect(() => {
    setIsBookmarked(post.bookmarked)
  }, [post.bookmarked])

  // Sync participation state from props
  useEffect(() => {
    setIsParticipating(post.isParticipating || false)
    setParticipantsCount(post.participants || 0)
  }, [post.isParticipating, post.participants])

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

  const handleParticipate = async () => {
    if (isParticipatingLoading || isOwnPost) return

    const previousState = isParticipating
    setIsParticipating(!isParticipating)
    setParticipantsCount((prev) => (previousState ? prev - 1 : prev + 1))
    setIsParticipatingLoading(true)

    try {
      const result = await postService.participateInPost(post.id)
      setIsParticipating(result.isParticipating)
      toast.success(result.isParticipating ? "Joined!" : "Left")
    } catch (error: any) {
      // Revert on error
      setIsParticipating(previousState)
      setParticipantsCount((prev) => (previousState ? prev + 1 : prev - 1))
      toast.error(error.message || "Failed to update participation")
    } finally {
      setIsParticipatingLoading(false)
    }
  }

  return (
    <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm overflow-hidden hover:shadow-xl transition-all duration-300">
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
          <span>{post.comments} comments</span>
          {participantsCount > 0 && <span>{participantsCount} participants</span>}
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
            <Button size="sm" variant="ghost" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Comment
            </Button>
            {!isOwnPost && (
              <Button
                size="sm"
                variant={isParticipating ? "default" : "ghost"}
                className={`flex items-center gap-2 ${isParticipating ? "" : ""}`}
                onClick={handleParticipate}
                disabled={isParticipatingLoading}
              >
                <Users className={`w-4 h-4 ${isParticipating ? "fill-current" : ""}`} />
                {isParticipating ? "Participating" : "Participate"}
              </Button>
            )}
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
            <Button size="sm" variant="ghost">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
