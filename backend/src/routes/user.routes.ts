import { Router } from 'express'
import { userController } from '../controllers/user.controller'
import { requireAuth } from '../middleware/auth'
import { uploadSingle } from '../middleware/upload'

const router = Router()

// Public routes
router.get('/search', userController.searchUsers)

// Protected routes - must come before /:username to avoid route conflicts
router.put('/profile', requireAuth, userController.updateProfile)
router.post('/avatar', requireAuth, uploadSingle('avatar'), userController.uploadAvatar)
router.post('/cover', requireAuth, uploadSingle('coverImage'), userController.uploadCoverImage)
router.get('/following', requireAuth, userController.getFollowingUsers)
router.post('/preferences', requireAuth, userController.updatePreferences)
router.get('/preferences', requireAuth, userController.getPreferences)
router.post('/change-password', requireAuth, userController.changePassword)
router.get('/me/my-causes', requireAuth, userController.getMyCauses)

// Public routes
router.get('/:username', userController.getUserProfile)
router.get('/:username/activity', userController.getUserActivity)

// Protected routes with :id parameter
router.get('/:id/isFollowing', requireAuth, userController.isFollowing)
router.post('/:id/follow', requireAuth, userController.toggleFollow)
router.delete('/:id/follow', requireAuth, userController.unfollowUser)

export default router


