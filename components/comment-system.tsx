"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
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
import { commentService } from "@/lib/api/services"
import type { Comment } from "@/lib/api/types"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import { formatTimestamp, getImageUrl } from "@/lib/utils"

interface CommentSystemProps {
  postId: string | number
  initialComments?: Comment[]
  type?: 'event' | 'post'
  onCountChange?: (count: number) => void
}

export function CommentSystem({ postId, initialComments, type = 'event', onCountChange }: CommentSystemProps) {
  const { user } = useAuth()
  const [comments, setComments] = useState<Comment[]>(initialComments || [])
  const [isLoading, setIsLoading] = useState(!initialComments)
  const [newComment, setNewComment] = useState("")
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [replyText, setReplyText] = useState("")
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!initialComments) {
      loadComments()
    }
  }, [postId, type])

  const loadComments = async () => {
    try {
      setIsLoading(true)
      const loadedComments =
        type === 'event'
          ? await commentService.getComments(postId)
          : await commentService.getPostComments(postId)
      setComments(loadedComments)
      if (onCountChange) {
        onCountChange(loadedComments.length)
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load comments")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return

    try {
      const response =
        type === 'event'
          ? await commentService.createComment(postId, { content: newComment })
          : await commentService.createPostComment(postId, { content: newComment })
      const updated = [response.comment, ...comments]
      setComments(updated)
      if (onCountChange) {
        onCountChange(updated.length)
      }
      setNewComment("")
      toast.success("Comment posted!")
    } catch (error: any) {
      toast.error(error.message || "Failed to post comment")
    }
  }

  const handleSubmitReply = async (parentId: number) => {
    if (!replyText.trim()) return

    try {
      const response =
        type === 'event'
          ? await commentService.createComment(postId, {
              content: replyText,
              parentId,
            })
          : await commentService.createPostComment(postId, {
              content: replyText,
              parentId,
            })
      const updated = comments.map((comment) =>
        comment.id === parentId
          ? { ...comment, replies: [...comment.replies, response.comment] }
          : comment,
      )
      setComments(updated)
      setReplyText("")
      setReplyingTo(null)
      toast.success("Reply posted!")
    } catch (error: any) {
      toast.error(error.message || "Failed to post reply")
    }
  }

  const handleCommentAction = async (
    commentId: number,
    action: "like" | "dislike" | "save" | "award",
  ) => {
    try {
      switch (action) {
        case "like":
          await commentService.likeComment(commentId)
          setComments(
            comments.map((comment) => {
              if (comment.id === commentId) {
                return {
                  ...comment,
                  liked: !comment.liked,
                  disliked: false,
                  likes: comment.liked ? comment.likes - 1 : comment.likes + 1,
                  dislikes: comment.disliked ? comment.dislikes - 1 : comment.dislikes,
                }
              }
              return comment
            }),
          )
          break
        case "dislike":
          await commentService.dislikeComment(commentId)
          setComments(
            comments.map((comment) => {
              if (comment.id === commentId) {
                return {
                  ...comment,
                  disliked: !comment.disliked,
                  liked: false,
                  dislikes: comment.disliked ? comment.dislikes - 1 : comment.dislikes + 1,
                  likes: comment.liked ? comment.likes - 1 : comment.likes,
                }
              }
              return comment
            }),
          )
          break
        case "save":
          await commentService.saveComment(commentId)
          setComments(
            comments.map((comment) =>
              comment.id === commentId ? { ...comment, saved: !comment.saved } : comment,
            ),
          )
          break
        case "award":
          await commentService.awardComment(commentId)
          setComments(
            comments.map((comment) =>
              comment.id === commentId ? { ...comment, awarded: !comment.awarded } : comment,
            ),
          )
          toast.success("Comment awarded!")
          break
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to perform action")
    }
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
        <Link href={`/profile/${comment.user.username}`}>
          <Avatar className="w-8 h-8 flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
            <AvatarImage src={getImageUrl(comment.user.avatar)} />
            <AvatarFallback>
              {comment.user.name
                ?.split(" ")
                .map((n) => n[0])
                .join("") || comment.user.username?.[0] || "U"}
            </AvatarFallback>
          </Avatar>
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Link
              href={`/profile/${comment.user.username}`}
              className="font-semibold text-sm text-foreground hover:text-primary transition-colors"
            >
              {comment.user.name || comment.user.username}
            </Link>
            <Link
              href={`/profile/${comment.user.username}`}
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              @{comment.user.username}
            </Link>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">{formatTimestamp(comment.timestamp)}</span>
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
              <AvatarImage src={getImageUrl(user?.avatar)} />
              <AvatarFallback>
                {user?.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("") || user?.username?.[0] || user?.firstName?.[0] || "You"}
              </AvatarFallback>
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
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Loading comments...</p>
          </div>
        ) : (
          <>
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
          </>
        )}
      </CardContent>
    </Card>
  )
}
