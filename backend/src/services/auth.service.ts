import prisma from '../config/database'
import { hashPassword, comparePassword } from '../utils/password'
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt'
import { createError } from '../middleware/errorHandler'
import { verificationService } from './verification.service'

export interface RegisterData {
  firstName: string
  lastName: string
  email: string
  username: string
  password: string
  otp?: string // OTP for email verification
}

export interface LoginData {
  emailOrUsername: string
  password: string
}

export const authService = {
  async register(data: RegisterData) {
    const { firstName, lastName, email, username, password } = data
    // otp is used below for verification

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    })

    if (existingUser) {
      if (existingUser.email === email) {
        throw createError('Email already exists', 409)
      }
      if (existingUser.username === username) {
        throw createError('Username already exists', 409)
      }
      throw createError('Email or username already exists', 409)
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Check if email was verified (either via OTP in request or previously verified)
    let isVerified = false
    
    if (data.otp) {
      // Verify OTP if provided
      isVerified = await verificationService.verifyEmail(email, data.otp)
    } else {
      // Check if email was previously verified
      const verification = await prisma.verification.findFirst({
        where: {
          email,
          type: 'email_verification',
          verified: true,
          expiresAt: { gt: new Date() }, // Still valid (within 30 minutes)
        },
        orderBy: { createdAt: 'desc' },
      })
      isVerified = !!verification
    }

    if (!isVerified) {
      throw createError('Email verification required. Please verify your email first.', 400)
    }

    // Create user with emailVerified = true
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        username,
        password: hashedPassword,
        emailVerified: true, // Email is verified at this point
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        verified: true,
        createdAt: true,
      },
    })

    // Create default settings
    await prisma.userSettings.create({
      data: {
        userId: user.id,
      },
    })

    // Generate tokens
    const tokenPayload = { userId: user.id, email: user.email }
    const accessToken = generateAccessToken(tokenPayload)
    const refreshToken = generateRefreshToken(tokenPayload)

    // Save refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    })

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: `${user.firstName} ${user.lastName}`,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        verified: user.verified,
        createdAt: user.createdAt,
      },
      token: accessToken,
      refreshToken,
    }
  },

  async login(data: LoginData) {
    const { emailOrUsername, password } = data

    // Find user by email or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: emailOrUsername }, { username: emailOrUsername }],
      },
    })

    if (!user) {
      throw createError('Invalid credentials', 401)
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password)
    if (!isPasswordValid) {
      throw createError('Invalid credentials', 401)
    }

    // Generate tokens
    const tokenPayload = { userId: user.id, email: user.email }
    const accessToken = generateAccessToken(tokenPayload)
    const refreshToken = generateRefreshToken(tokenPayload)

    // Save refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    })

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: `${user.firstName} ${user.lastName}`,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        verified: user.verified,
        bio: user.bio,
        location: user.location,
        website: user.website,
        createdAt: user.createdAt,
      },
      token: accessToken,
      refreshToken,
    }
  },

  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        coverImage: true,
        bio: true,
        location: true,
        website: true,
        verified: true,
        createdAt: true,
      },
    })

    if (!user) {
      throw createError('User not found', 404)
    }

    // Compute stats from relations (stats is not a field on User model)
    const [followers, following, causesSupported, donations] = await Promise.all([
      prisma.follow.count({ where: { followingId: userId } }),
      prisma.follow.count({ where: { followerId: userId } }),
      prisma.supportHistory.count({ where: { userId } }),
      prisma.donation.aggregate({
        where: { userId, status: 'completed' },
        _sum: { amount: true },
      }),
    ])

    return {
      ...user,
      stats: {
        followers,
        following,
        causesSupported,
        totalDonated: donations._sum.amount || 0,
        impactScore: causesSupported * 10 + (donations._sum.amount || 0) / 100,
      },
    }
  },

  async refreshToken(refreshToken: string) {
    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken)

    // Check if token exists in database
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    })

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      throw createError('Invalid or expired refresh token', 401)
    }

    // Generate new access token
    const accessToken = generateAccessToken({
      userId: payload.userId,
      email: payload.email,
    })

    return { token: accessToken }
  },

  async logout(refreshToken: string) {
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    })
  },
}


