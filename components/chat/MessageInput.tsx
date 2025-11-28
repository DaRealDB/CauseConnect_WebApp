"use client"

import { useState, FormEvent, KeyboardEvent, useRef, ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Paperclip, Smile, Send, Loader2, X, Image as ImageIcon } from "lucide-react"
import { useConversation } from "@/hooks/useConversation"
import { useTyping } from "@/hooks/useTyping"
import { useAuth } from "@/contexts/AuthContext"
import { uploadChatFile, verifyStorageConnection, isStorageAvailable } from "@/lib/firebase/storage"
import { toast } from "sonner"
import { sendMessage } from "@/lib/firebase/chat-enhanced"
import type { MessageAttachment } from "@/lib/firebase/chat.types"

interface MessageInputProps {
  conversationId: string | null
}

export function MessageInput({ conversationId }: MessageInputProps) {
  const { user } = useAuth()
  const { sendMessage: sendMessageHook, isSending } = useConversation(conversationId)
  const { startTyping, stopTyping } = useTyping({
    conversationId,
    userId: user?.id?.toString() || null,
    enabled: !!conversationId,
  })
  const [message, setMessage] = useState("")
  const [attachments, setAttachments] = useState<MessageAttachment[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const storageAvailable = isStorageAvailable()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if ((!message.trim() && attachments.length === 0) || !conversationId || isSending || uploading) {
      return
    }

    const messageText = message.trim()
    setMessage("")
    
    // Stop typing
    stopTyping()

    try {
      // Upload attachments if any
      let attachmentUrls: string[] = []
      if (attachments.length > 0) {
        setUploading(true)
        try {
          // Attachments are already uploaded (previewed first), just get URLs
          attachmentUrls = attachments.map((att) => att.url)
        } catch (error: any) {
          toast.error("Failed to upload attachments")
          setUploading(false)
          setMessage(messageText) // Restore message
          return
        }
        setUploading(false)
      }

      await sendMessageHook(messageText, attachmentUrls.length > 0 ? attachmentUrls : undefined)
      setAttachments([])
    } catch (error: any) {
      console.error("[MessageInput] Error sending message:", error)
      toast.error(error.message || "Failed to send message. Please try again.")
      setMessage(messageText) // Restore message
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Start typing indicator
    startTyping()

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set timeout to stop typing after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping()
    }, 3000)

    // Enter to send, Shift+Enter for new line
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) {
      return
    }

    if (!conversationId) {
      toast.error('Please select a conversation first')
      return
    }

    if (!user?.id) {
      toast.error('You must be logged in to upload files')
      return
    }

    // Check if Storage is available
    if (!storageAvailable) {
      toast.info('File uploads are not available. Firebase Storage requires a paid plan. Text messaging will work normally.', {
        duration: 5000,
      })
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    const file = files[0]
    
    // Validate file type
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toast.error('Please select an image or video file')
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    try {
      setUploading(true)
      console.log('[MessageInput] Starting file upload:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        conversationId,
        userId: user.id.toString(),
      })

      // Create a timeout for upload (30 seconds)
      const uploadTimeout = setTimeout(() => {
        setUploading(false)
        toast.error('Upload timed out. Please try again with a smaller file.', {
          duration: 5000,
        })
      }, 30000)

      const uploaded = await uploadChatFile(file, conversationId, user.id.toString())
      
      clearTimeout(uploadTimeout)
      
      console.log('[MessageInput] File upload successful:', uploaded.url)
      
      setAttachments([...attachments, {
        type: uploaded.type as 'image' | 'video',
        url: uploaded.url,
        fileName: uploaded.fileName,
        fileSize: uploaded.fileSize,
      }])
      
      toast.success('File uploaded successfully')
    } catch (error: any) {
      console.error('[MessageInput] Error uploading file:', error)
      
      // Show detailed error message
      let errorMessage = 'Failed to upload file'
      if (error.message) {
        errorMessage = error.message
      } else if (error.code) {
        errorMessage = `Upload error: ${error.code}`
      }
      
      toast.error(errorMessage, {
        duration: 5000,
      })
    } finally {
      setUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  if (!conversationId) {
    return null
  }

  return (
    <div className="p-4 border-t border-border bg-background/80 backdrop-blur-sm">
      {/* Attachment Previews */}
      {attachments.length > 0 && (
        <div className="flex gap-2 mb-2 flex-wrap">
          {attachments.map((attachment, index) => (
            <div key={index} className="relative">
              {attachment.type === 'image' ? (
                <div className="relative w-20 h-20 rounded-lg overflow-hidden border">
                  <img
                    src={attachment.url}
                    alt={attachment.fileName}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removeAttachment(index)}
                    className="absolute top-1 right-1 p-1 bg-background/80 rounded-full hover:bg-background"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2 border rounded-lg bg-muted">
                  <span className="text-sm">{attachment.fileName}</span>
                  <button
                    onClick={() => removeAttachment(index)}
                    className="p-1 hover:bg-background rounded"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        {storageAvailable && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending || uploading}
            title="Attach file"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Paperclip className="h-4 w-4" />
            )}
          </Button>
        )}
        <div className="flex-1 relative">
          <Textarea
            value={message}
            onChange={(e) => {
              setMessage(e.target.value)
              if (e.target.value.trim()) {
                startTyping()
              }
            }}
            onKeyDown={handleKeyDown}
            onBlur={stopTyping}
            placeholder="Type a message... (Shift+Enter for new line)"
            className="min-h-[44px] max-h-32 resize-none pr-10"
            disabled={isSending || uploading}
            rows={1}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-2 bottom-2"
            disabled={isSending || uploading}
          >
            <Smile className="h-4 w-4" />
          </Button>
        </div>
        <Button
          type="submit"
          size="sm"
          disabled={(!message.trim() && attachments.length === 0) || isSending || uploading}
        >
          {isSending || uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  )
}
