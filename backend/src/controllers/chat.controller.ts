import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth'
import { createError } from '../middleware/errorHandler'
import { userService } from '../services/user.service'

/**
 * Get user's conversations (for sync purposes)
 * Note: Actual conversations are stored in Firebase Firestore
 * This endpoint just provides user data for chat participants
 */
export const chatController = {
  async getConversations(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Conversations are stored in Firebase, but we can return user's profile
      // for the frontend to fetch Firebase conversations
      const userId = req.userId!
      
      // Return empty array - frontend will fetch from Firebase
      // This endpoint exists for consistency with API structure
      res.json({
        conversations: [],
        message: 'Conversations are managed by Firebase Firestore',
      })
    } catch (error: any) {
      next(error)
    }
  },

  /**
   * Get messages for a conversation (for sync purposes)
   * Note: Actual messages are stored in Firebase Firestore
   */
  async getMessages(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { conversationId } = req.params
      const userId = req.userId!

      if (!conversationId) {
        throw createError('Conversation ID is required', 400)
      }

      // Messages are stored in Firebase, but we can verify user has access
      // Return empty - frontend will fetch from Firebase
      res.json({
        messages: [],
        conversationId,
        message: 'Messages are managed by Firebase Firestore',
      })
    } catch (error: any) {
      next(error)
    }
  },

  /**
   * Get user profile for chat (helper endpoint)
   * Accepts user ID and returns minimal user data for chat
   */
  async getUserProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params
      
      if (!userId) {
        throw createError('User ID is required', 400)
      }

      // Try to fetch user by ID first
      try {
        const user = await userService.getUserById(userId)
        res.json({
          id: user.id,
          username: user.username,
          name: user.name,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar,
          verified: user.verified,
        })
      } catch (error: any) {
        // If not found by ID, try by username (for backward compatibility)
        try {
          const user = await userService.getUserProfile(userId)
          res.json({
            id: user.id,
            username: user.username,
            name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            firstName: user.firstName,
            lastName: user.lastName,
            avatar: user.avatar,
            verified: user.verified,
          })
        } catch (usernameError: any) {
          // If still not found, return error
          throw createError('User not found', 404)
        }
      }
    } catch (error: any) {
      next(error)
    }
  },

  /**
   * Block user for chat
   */
  async blockUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId: blockedId } = req.params
      const blockerId = req.userId!

      // Use existing privacy service
      const { privacyService } = await import('../services/privacy.service')
      const result = await privacyService.blockUser(blockerId, blockedId)
      
      res.json(result)
    } catch (error: any) {
      next(error)
    }
  },

  /**
   * Unblock user for chat
   */
  async unblockUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId: blockedId } = req.params
      const blockerId = req.userId!

      const { privacyService } = await import('../services/privacy.service')
      await privacyService.unblockUser(blockerId, blockedId)
      
      res.json({ message: 'User unblocked successfully' })
    } catch (error: any) {
      next(error)
    }
  },

  /**
   * Check if user is blocked
   */
  async checkBlocked(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId: targetUserId } = req.params
      const userId = req.userId!

      const { privacyService } = await import('../services/privacy.service')
      const blockedUsers = await privacyService.getBlockedUsers(userId)
      
      const isBlocked = blockedUsers.some((user) => user.userId === targetUserId)
      res.json({ isBlocked })
    } catch (error: any) {
      next(error)
    }
  },
}

