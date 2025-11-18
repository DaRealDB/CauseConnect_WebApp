"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Heart,
  MessageCircle,
  Award,
  Bookmark,
  MoreHorizontal,
  ThumbsDown,
  Reply,
  Send,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

interface Comment {
  id: number
  user: {
    name: string
    username: string
    avatar: string
    verified: boolean
  }
  content: string
  timestamp: string
  likes: number
  dislikes: number
  replies: Comment[]
  liked: boolean
  disliked: boolean
  saved: boolean
  awarded: boolean
}

interface CommentSystemProps {
  postId: number
  initialComments?: Comment[]
}

const SAMPLE_COMMENTS: Comment[] = [
  {
    id: 1,
    user: {
      name: "Emma Thompson",
      username: "emma_cares",
      avatar: "/placeholder.svg?height=32&width=32&text=ET",
      verified: false,
    },
    content:
      "This is such an important cause! I've been following their work for months and they're making real impact. Just donated $50.",
    timestamp: "2 hours ago",
    likes: 24,
    dislikes: 1,
    liked: false,
    disliked: false,
    saved: false,
    awarded: true,
    replies: [
      {
        id: 2,
        user: {
          name: "David Kim",
          username: "david_impact",
          avatar: "/placeholder.svg?height=32&width=32&text=DK",
          verified: true,
        },
        content:
          "Completely agree! Their transparency reports are amazing. You can see exactly where every dollar goes.",
        timestamp: "1 hour ago",
        likes: 12,
        dislikes: 0,
        liked: true,
        disliked: false,
        saved: false,
        awarded: false,
        replies: [],
      },
    ],
  },
  {
    id: 3,
    user: {
      name: "Maria Santos",
      username: "maria_volunteer",
      avatar: "/placeholder.svg?height=32&width=32&text=MS",
      verified: false,
    },
    content:
      "I volunteered with them last year in Guatemala. The team is incredible and the work they do is life-changing. Highly recommend supporting this!",
    timestamp: "4 hours ago",
    likes: 18,
    dislikes: 0,
    liked: false,
    disliked: false,
    saved: true,
    awarded: false,
    replies: [],
  },
]

export function CommentSystem({ postId, initialComments = SAMPLE_COMMENTS }: CommentSystemProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [newComment, setNewComment] = useState("")
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [replyText, setReplyText] = useState("")
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set())

  const handleSubmitComment = () => {
    if (!newComment.trim()) return

    const comment: Comment = {
      id: Date.now(),
      user: {
        name: "You",
        username: "your_username",
        avatar: "/placeholder.svg?height=32&width=32&text=You",
        verified: false,
      },
      content: newComment,
      timestamp: "Just now",
      likes: 0,
      dislikes: 0,
      liked: false,
      disliked: false,
      saved: false,
      awarded: false,
      replies: [],
    }

    setComments([comment, ...comments])
    setNewComment("")
  }

  const handleSubmitReply = (parentId: number) => {
    if (!replyText.trim()) return

    const reply: Comment = {
      id: Date.now(),
      user: {
        name: "You",
        username: "your_username",
        avatar: "/placeholder.svg?height=32&width=32&text=You",
        verified: false,
      },
      content: replyText,
      timestamp: "Just now",
      likes: 0,
      dislikes: 0,
      liked: false,
      disliked: false,
      saved: false,
      awarded: false,
      replies: [],
    }

    setComments(
      comments.map((comment) =>
        comment.id === parentId ? { ...comment, replies: [...comment.replies, reply] } : comment,
      ),
    )
    setReplyText("")
    setReplyingTo(null)
  }

  const handleCommentAction = (commentId: number, action: "like" | "dislike" | "save" | "award") => {
    setComments(
      comments.map((comment) => {
        if (comment.id === commentId) {
          switch (action) {
            case "like":
              return {
                ...comment,
                liked: !comment.liked,
                disliked: comment.liked ? comment.disliked : false,
                likes: comment.liked ? comment.likes - 1 : comment.likes + 1,
                dislikes: comment.disliked && !comment.liked ? comment.dislikes - 1 : comment.dislikes,
              }
            case "dislike":
              return {
                ...comment,
                disliked: !comment.disliked,
                liked: comment.disliked ? comment.liked : false,
                dislikes: comment.disliked ? comment.dislikes - 1 : comment.dislikes + 1,
                likes: comment.liked && !comment.disliked ? comment.likes - 1 : comment.likes,
              }
            case "save":
              return { ...comment, saved: !comment.saved }
            case "award":
              return { ...comment, awarded: !comment.awarded }
            default:
              return comment
          }
        }
        return comment
      }),
    )
  }

  const toggleCommentExpansion = (commentId: number) => {
    const newExpanded = new Set(expandedComments)
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId)
    } else {
      newExpanded.add(commentId)
    }
    setExpandedComments(newExpanded)
  }

  const CommentComponent = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
    <div className={`${isReply ? "ml-8 border-l-2 border-border pl-4" : ""}`}>
      <div className="flex gap-3">
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage src={comment.user.avatar || "/placeholder.svg"} />
          <AvatarFallback>
            {comment.user.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm text-foreground">{comment.user.name}</span>
            <span className="text-xs text-muted-foreground">@{comment.user.username}</span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
            {comment.awarded && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                <Award className="w-3 h-3 mr-1" />
                Awarded
              </Badge>
            )}
          </div>

          <p className="text-sm text-foreground mb-3">{comment.content}</p>

          <div className="flex items-center gap-1 mb-3">
            <Button
              size="sm"
              variant="ghost"
              className={`h-7 px-2 text-xs ${comment.liked ? "text-red-500" : "text-muted-foreground"}`}
              onClick={() => handleCommentAction(comment.id, "like")}
            >
              <Heart className={`w-3 h-3 mr-1 ${comment.liked ? "fill-current" : ""}`} />
              {comment.likes > 0 && comment.likes}
            </Button>

            <Button
              size="sm"
              variant="ghost"
              className={`h-7 px-2 text-xs ${comment.disliked ? "text-blue-500" : "text-muted-foreground"}`}
              onClick={() => handleCommentAction(comment.id, "dislike")}
            >
              <ThumbsDown className={`w-3 h-3 mr-1 ${comment.disliked ? "fill-current" : ""}`} />
              Not Helpful
            </Button>

            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs text-muted-foreground"
              onClick={() => setReplyingTo(comment.id)}
            >
              <Reply className="w-3 h-3 mr-1" />
              Reply
            </Button>

            <Button
              size="sm"
              variant="ghost"
              className={`h-7 px-2 text-xs ${comment.awarded ? "text-yellow-500" : "text-muted-foreground"}`}
              onClick={() => handleCommentAction(comment.id, "award")}
            >
              <Award className={`w-3 h-3 mr-1 ${comment.awarded ? "fill-current" : ""}`} />
              Award
            </Button>

            <Button
              size="sm"
              variant="ghost"
              className={`h-7 px-2 text-xs ${comment.saved ? "text-primary" : "text-muted-foreground"}`}
              onClick={() => handleCommentAction(comment.id, "save")}
            >
              <Bookmark className={`w-3 h-3 mr-1 ${comment.saved ? "fill-current" : ""}`} />
              Save
            </Button>

            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-muted-foreground">
              <MoreHorizontal className="w-3 h-3" />
            </Button>
          </div>

          {replyingTo === comment.id && (
            <div className="mb-4">
              <div className="flex gap-2">
                <Avatar className="w-6 h-6 flex-shrink-0">
                  <AvatarImage src="/placeholder.svg?height=24&width=24&text=You" />
                  <AvatarFallback>You</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    placeholder={`Reply to ${comment.user.name}...`}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="min-h-[60px] text-sm"
                  />
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" onClick={() => handleSubmitReply(comment.id)} disabled={!replyText.trim()}>
                      <Send className="w-3 h-3 mr-1" />
                      Reply
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setReplyingTo(null)
                        setReplyText("")
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {comment.replies.length > 0 && (
            <div className="mt-3">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs text-muted-foreground mb-3"
                onClick={() => toggleCommentExpansion(comment.id)}
              >
                {expandedComments.has(comment.id) ? (
                  <>
                    <ChevronUp className="w-3 h-3 mr-1" />
                    Hide {comment.replies.length} replies
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3 mr-1" />
                    Show {comment.replies.length} replies
                  </>
                )}
              </Button>

              {expandedComments.has(comment.id) && (
                <div className="space-y-4">
                  {comment.replies.map((reply) => (
                    <CommentComponent key={reply.id} comment={reply} isReply={true} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Comments ({comments.length})</h3>

        {/* Comment Input */}
        <div className="mb-6">
          <div className="flex gap-3">
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarImage src="/placeholder.svg?height=32&width=32&text=You" />
              <AvatarFallback>You</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                placeholder="Share your thoughts or ask a question..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[80px] mb-3"
              />
              <Button onClick={handleSubmitComment} disabled={!newComment.trim()} className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                Submit Comment
              </Button>
            </div>
          </div>
        </div>

        {/* Comments List */}
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentComponent key={comment.id} comment={comment} />
          ))}
        </div>

        {comments.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No comments yet. Be the first to share your thoughts!</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
