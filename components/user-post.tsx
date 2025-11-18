"use client"

import { useState } from "react"
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

interface UserPostProps {
  post: {
    id: number
    user: {
      name: string
      username: string
      avatar: string
      verified: boolean
      following: boolean
    }
    content: string
    image?: string
    timestamp: string
    likes: number
    comments: number
    shares: number
    liked: boolean
    bookmarked: boolean
  }
}

export function UserPost({ post }: UserPostProps) {
  const [isLiked, setIsLiked] = useState(post.liked)
  const [isBookmarked, setIsBookmarked] = useState(post.bookmarked)
  const [isFollowing, setIsFollowing] = useState(post.user.following)
  const [likesCount, setLikesCount] = useState(post.likes)

  const handleLike = () => {
    setIsLiked(!isLiked)
    setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1))
  }

  const handleFollow = () => {
    setIsFollowing(!isFollowing)
  }

  return (
    <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm overflow-hidden hover:shadow-xl transition-all duration-300">
      <CardContent className="p-6">
        {/* User Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={post.user.avatar || "/placeholder.svg"} />
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
                <span>{post.timestamp}</span>
              </div>
            </div>
          </div>

          <Button
            size="sm"
            variant={isFollowing ? "outline" : "default"}
            onClick={handleFollow}
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
              <img src={post.image || "/placeholder.svg"} alt="Post image" className="w-full h-64 object-cover" />
            </div>
          )}
        </div>

        {/* Engagement Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <span>{likesCount} likes</span>
          <span>{post.comments} comments</span>
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
            <Button size="sm" variant="ghost" className="flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </div>

          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={() => setIsBookmarked(!isBookmarked)}>
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
