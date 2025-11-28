import { Router } from 'express'
import { squadController } from '../controllers/squad.controller'
import { requireAuth } from '../middleware/auth'
import { uploadSingle } from '../middleware/upload'

const router = Router()

// Squad CRUD
router.get('/search', requireAuth, squadController.searchSquads)
router.get('/', requireAuth, squadController.getSquads)
router.post('/', requireAuth, uploadSingle('avatar'), squadController.createSquad)
router.get('/:id', requireAuth, squadController.getSquadById)
router.patch('/:id', requireAuth, uploadSingle('avatar'), squadController.updateSquad)
router.delete('/:id', requireAuth, squadController.deleteSquad)

// Squad Membership
router.get('/:id/members', requireAuth, squadController.getSquadMembers)
router.post('/:id/join', requireAuth, squadController.joinSquad)
router.delete('/:id/join', requireAuth, squadController.leaveSquad)
router.delete('/:id/members/:memberId', requireAuth, squadController.removeMember)
router.patch('/:id/members/:memberId/role', requireAuth, squadController.changeMemberRole)

// Squad Posts
router.get('/:id/posts', requireAuth, squadController.getSquadPosts)
router.post('/:id/posts', requireAuth, uploadSingle('image'), squadController.createSquadPost)
router.patch('/:id/posts/:postId', requireAuth, squadController.updateSquadPost)
router.delete('/:id/posts/:postId', requireAuth, squadController.deleteSquadPost)
router.patch('/:id/posts/:postId/pin', requireAuth, squadController.pinSquadPost)

// Squad Comments
router.get('/:id/posts/:postId/comments', requireAuth, squadController.getSquadPostComments)
router.post('/:id/posts/:postId/comments', requireAuth, squadController.createSquadComment)
router.patch('/:id/posts/:postId/comments/:commentId', requireAuth, squadController.updateSquadComment)
router.delete('/:id/posts/:postId/comments/:commentId', requireAuth, squadController.deleteSquadComment)

// Squad Reactions
router.post('/:id/reactions', requireAuth, squadController.toggleSquadReaction)

export default router





