import express, { Express, Request, Response } from 'express'
import cors from 'cors'
import path from 'path'
import { config } from './config/env'
import { errorHandler } from './middleware/errorHandler'

// Import routes
import authRoutes from './routes/auth.routes'
import userRoutes from './routes/user.routes'
import eventRoutes from './routes/event.routes'
import commentRoutes from './routes/comment.routes'
import donationRoutes from './routes/donation.routes'
import squadRoutes from './routes/squad.routes'
import settingsRoutes from './routes/settings.routes'
import notificationRoutes from './routes/notification.routes'
import postRoutes from './routes/post.routes'
import customFeedRoutes from './routes/customFeed.routes'
import exploreRoutes from './routes/explore.routes'
import tagRoutes from './routes/tag.routes'
import paymentRoutes from './routes/payment.routes'

const app: Express = express()

// Middleware
app.use(cors({
  origin: config.cors.origins,
  credentials: true,
}))

// Stripe webhook needs raw body for signature verification
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/events', eventRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/comments', commentRoutes)
app.use('/api/donations', donationRoutes)
app.use('/api/squads', squadRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/custom-feeds', customFeedRoutes)
app.use('/api/explore', exploreRoutes)
app.use('/api/tags', tagRoutes)
// Stripe webhook needs raw body, so we handle it separately
app.use('/api/payments', paymentRoutes)

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: 'Route not found' })
})

// Error handler (must be last)
app.use(errorHandler)

// Start server
// Railway and other platforms set PORT automatically - use that or fallback to config
const PORT = process.env.PORT || config.port

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📡 API available at http://localhost:${PORT}/api`)
  console.log(`🌍 Environment: ${config.nodeEnv}`)
})

export default app




