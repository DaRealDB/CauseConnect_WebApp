import { Router } from 'express'
import { body } from 'express-validator'
import { authController } from '../controllers/auth.controller'
import { requireAuth } from '../middleware/auth'

const router = Router()

// Validation rules
const registerValidation = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('username')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('confirmPassword')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Passwords do not match'),
]

const loginValidation = [
  body('emailOrUsername').trim().notEmpty().withMessage('Email or username is required'),
  body('password').notEmpty().withMessage('Password is required'),
]

// Routes
router.post('/send-verification', authController.sendVerificationCode)
router.post('/verify-email', authController.verifyEmail)
router.post('/register', registerValidation, authController.register)
router.post('/login', loginValidation, authController.login)
router.get('/me', requireAuth, authController.getCurrentUser)
router.post('/refresh', authController.refreshToken)
router.post('/logout', authController.logout)
router.post('/forgot-password', authController.forgotPassword)
router.post('/verify-reset', authController.verifyResetCode)
router.post('/reset-password', authController.resetPassword)

export default router







