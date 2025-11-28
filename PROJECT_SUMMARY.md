# CauseConnect - Project Summary

## 🎯 Project Overview

**CauseConnect** is a comprehensive charity-driven social platform that enables users to discover, support, and engage with causes that make a difference. The platform facilitates connections between charitable organizations and supporters through events, donations, communities (Squads), and social interactions.

## 📦 Project Structure

```
CauseConnect/
├── app/                      # Next.js app directory (pages)
├── components/              # React components
├── contexts/                # React contexts
├── lib/                     # Utilities and API client
├── public/                  # Static assets
├── backend/                 # Express.js backend
│   ├── src/
│   │   ├── config/         # Configuration
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utilities
│   └── prisma/             # Database schema and migrations
├── .github/                 # GitHub workflows (optional)
├── README.md               # Main documentation
├── CONTRIBUTING.md         # Contribution guidelines
├── LICENSE                 # MIT License
├── .env.example            # Frontend environment template
└── backend/.env.example    # Backend environment template
```

## 🛠 Technology Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Library**: Radix UI
- **Forms**: React Hook Form + Zod
- **Payments**: Stripe.js

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT
- **Payments**: Stripe SDK

## 🔑 Key Features

### Authentication & Security
- Email verification with OTP
- JWT-based authentication
- Password reset flow
- Secure password hashing

### Payment System
- Stripe integration
- One-time donations
- Recurring donations (subscriptions)
- Payment method management
- Donation history

### Social Features
- Event creation and discovery
- Post creation and interaction
- Community Squads
- Comments with reactions
- Notifications system
- Follow system

### User Experience
- Responsive design
- Dark/Light theme
- Customizable profiles
- Interest-based filtering
- Personalized onboarding

## 📋 Database Schema

Key models:
- **User**: User accounts and profiles
- **Event**: Charity events
- **Post**: User posts
- **Donation**: Donation records
- **Squad**: Community groups
- **Comment**: Comments on events/posts
- **Notification**: User notifications
- **PaymentMethod**: Saved payment methods
- **Verification**: Email verification codes

## 🔐 Environment Variables

### Frontend
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key

### Backend
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_ACCESS_SECRET` - JWT access token secret
- `JWT_REFRESH_SECRET` - JWT refresh token secret
- `SMTP_*` - Email configuration
- `STRIPE_*` - Stripe API keys
- `CORS_ORIGINS` - Allowed CORS origins

## 🚀 Quick Start

1. **Backend Setup**:
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Configure .env
   npx prisma generate
   npx prisma migrate dev
   npm run dev
   ```

2. **Frontend Setup**:
   ```bash
   npm install
   cp .env.example .env.local
   # Configure .env.local
   npm run dev
   ```

## 📝 Documentation

- **README.md**: Comprehensive project documentation
- **CONTRIBUTING.md**: Contribution guidelines
- **GITHUB_COMMIT_PLAN.md**: Recommended commit strategy
- **PREPARATION_CHECKLIST.md**: Pre-release checklist
- **backend/README.md**: Backend-specific documentation

## 🔒 Security Considerations

- All sensitive data in environment variables
- JWT tokens for authentication
- Password hashing with bcrypt
- Email verification required
- CORS configuration
- Input validation with express-validator
- SQL injection prevention via Prisma ORM

## 📊 API Endpoints

### Authentication
- `/api/auth/register` - User registration
- `/api/auth/login` - User login
- `/api/auth/me` - Get current user
- `/api/auth/verify-email` - Email verification

### Events
- `/api/events` - List events
- `/api/events/:id` - Get event details
- `/api/events` (POST) - Create event

### Payments
- `/api/payments/payment-intent` - Create payment intent
- `/api/payments/history` - Get donation history
- `/api/payments/webhook` - Stripe webhook handler

See `backend/README.md` for complete API documentation.

## 🎨 UI Components

Comprehensive component library including:
- Form inputs and controls
- Navigation components
- Dialog and modal components
- Data display components
- Custom feature components

## 🔄 State Management

- React Context API for global state
- Local state with React hooks
- JWT tokens stored in localStorage

## 📱 Responsive Design

- Mobile-first approach
- Tailwind CSS for responsive utilities
- Optimized for all screen sizes

## 🧪 Testing

- Postman collection included for API testing
- See `backend/POSTMAN_TESTING_GUIDE.md`

## 🚢 Deployment

### Frontend
- Recommended: Vercel
- Alternative: Netlify, AWS Amplify

### Backend
- Recommended: Render, Railway
- Alternative: Heroku, AWS, DigitalOcean

### Database
- PostgreSQL (Render, Railway, Supabase, AWS RDS)

## 📄 License

MIT License - See LICENSE file

## 👥 Authors

**Sheenanigans**

---

**Status**: Ready for GitHub release ✅

**Last Updated**: 2024




