# CauseConnect

> Connect with Causes That Matter

A charity-driven social platform where users can discover, support, and engage with causes that make a difference in the world.

**By Sheenanigans**

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

CauseConnect is a full-stack web application designed to bridge the gap between charitable organizations and supporters. The platform enables users to discover causes they care about, donate to events and creators, engage with communities, and track their impact.

### Key Capabilities

- **Event Discovery**: Browse and search charity events by location, category, and tags
- **Social Engagement**: Create posts, join discussions, and build communities (Squads)
- **Secure Payments**: One-time and recurring donations via Stripe integration
- **User Profiles**: Personalized profiles with donation history and impact tracking
- **Custom Feeds**: Curated content based on interests and preferences
- **Real-time Notifications**: Stay updated on events, donations, and community activity

---

## ✨ Features

### 🔐 Authentication & Security
- Email verification with OTP
- JWT-based authentication
- Password reset flow
- Secure password hashing (bcrypt)

### 💰 Payments & Donations
- Stripe integration for secure payments
- Support for one-time and recurring donations
- Donation to events, posts, and creator profiles
- Payment method management
- Donation history tracking
- Stripe webhook integration for payment status updates

### 📱 Social Features
- **Events**: Create, discover, and support charity events
- **Posts**: Share updates and stories
- **Squads**: Join or create communities around causes
- **Comments**: Engage in discussions with reactions and awards
- **Notifications**: Real-time updates on activity
- **Follow System**: Connect with other users
- **Bookmarks**: Save events and posts for later

### 🎨 User Experience
- Responsive design for mobile and desktop
- Dark/Light theme support
- Customizable user profiles
- Interest-based content filtering
- Personalized onboarding flow
- Geolocation-based event discovery

---

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI
- **State Management**: React Context API
- **Forms**: React Hook Form + Zod validation
- **Payments**: Stripe.js
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (jsonwebtoken)
- **File Upload**: Multer
- **Email**: Nodemailer
- **Payments**: Stripe SDK

### Infrastructure
- **Database**: PostgreSQL 14+
- **Package Manager**: npm
- **Version Control**: Git

---

## 🏗 Architecture

```
┌─────────────────┐
│   Next.js App   │  (Frontend - Port 3000)
│   (React/TS)    │
└────────┬────────┘
         │
         │ HTTP/REST API
         │
┌────────▼────────┐
│  Express.js API │  (Backend - Port 3001)
│   (Node/TS)     │
└────────┬────────┘
         │
         │ Prisma ORM
         │
┌────────▼────────┐
│   PostgreSQL    │  (Database)
│    Database     │
└─────────────────┘
```

### Project Structure

```
CauseConnect/
├── app/                    # Next.js app directory (pages)
│   ├── feed/              # Main feed page
│   ├── event/             # Event detail pages
│   ├── profile/           # User profiles
│   ├── settings/          # User settings
│   ├── onboarding/        # User onboarding flow
│   └── ...
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   └── ...
├── contexts/             # React contexts (Auth, Theme, etc.)
├── lib/                  # Utilities and API client
│   ├── api/             # API service functions
│   └── utils/           # Helper functions
├── backend/              # Express.js backend
│   ├── src/
│   │   ├── config/      # Configuration files
│   │   ├── controllers/ # Route controllers
│   │   ├── middleware/  # Express middleware
│   │   ├── routes/      # API routes
│   │   ├── services/    # Business logic
│   │   └── utils/       # Utilities
│   └── prisma/          # Prisma schema and migrations
├── public/              # Static assets
└── ...
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** 14+
- **Git**

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/CauseConnect.git
cd CauseConnect
```

#### 2. Set Up Backend

```bash
cd backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env and configure:
# - DATABASE_URL
# - JWT_ACCESS_SECRET
# - JWT_REFRESH_SECRET
# - SMTP credentials (for email)
# - Stripe keys (for payments)

# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

The backend will run on `http://localhost:3001`

#### 3. Set Up Frontend

```bash
# From project root
cd ..

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local and configure:
# - NEXT_PUBLIC_API_URL=http://localhost:3001/api
# - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (if using Stripe)

# Start development server
npm run dev
```

The frontend will run on `http://localhost:3000`

### Database Setup

1. **Create PostgreSQL Database**:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE causeconnect;

# (Optional) Create dedicated user
CREATE USER causeconnect_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE causeconnect TO causeconnect_user;
```

2. **Update DATABASE_URL** in `backend/.env`:

```env
DATABASE_URL="postgresql://causeconnect_user:your_password@localhost:5432/causeconnect?schema=public"
```

3. **Run Migrations**:

```bash
cd backend
npx prisma migrate dev
```

---

## 🔧 Environment Variables

### Backend (`.env`)

See `backend/.env.example` for all required variables. Key variables:

```env
# Database
DATABASE_URL=postgresql://...

# JWT Secrets (generate secure random strings)
JWT_ACCESS_SECRET=your-secret-min-32-chars
JWT_REFRESH_SECRET=your-secret-min-32-chars

# SMTP (Email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:3004
```

### Frontend (`.env.local`)

See `.env.example` for all required variables. Key variables:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Note**: Generate secure JWT secrets using:

```bash
# Linux/Mac
openssl rand -base64 32

# Or Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## 📚 API Documentation

### Base URL

- **Development**: `http://localhost:3001/api`
- **Production**: `https://your-api-domain.com/api`

### Authentication

Most endpoints require authentication. Include JWT token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Key Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/send-verification` - Send email verification code
- `POST /api/auth/verify-email` - Verify email with OTP
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

#### Events
- `GET /api/events` - List events (with filters)
- `GET /api/events/:id` - Get event details
- `POST /api/events` - Create event
- `POST /api/events/:id/support` - Support event
- `POST /api/events/:id/bookmark` - Bookmark event

#### Payments
- `GET /api/payments/payment-methods` - Get user payment methods
- `POST /api/payments/payment-methods/setup-intent` - Create setup intent
- `POST /api/payments/payment-intent` - Create donation payment intent
- `POST /api/payments/confirm-payment` - Confirm payment
- `GET /api/payments/history` - Get donation history
- `POST /api/payments/recurring` - Create recurring donation

For complete API documentation, see [Backend README](./backend/README.md) or import the Postman collection from `backend/postman_collection.json`.

---

## 🚢 Deployment

### Frontend (Vercel)

**📖 Quick Start:** See [DEPLOY_TO_VERCEL_QUICK_START.md](./DEPLOY_TO_VERCEL_QUICK_START.md) for a 5-minute deployment guide.

**📚 Full Guide:** See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for detailed instructions.

#### Method 1: Using Vercel Dashboard (Recommended)

1. **Go to [vercel.com](https://vercel.com)** and sign in with GitHub
2. **Click "Add New Project"** → Import your repository
3. **Configure Project**:
   - Framework: Next.js (auto-detected)
   - Root Directory: `./`
4. **Add Environment Variables**:
   - `NEXT_PUBLIC_API_URL` - Your backend API URL (e.g., `https://your-backend.onrender.com/api`)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - (Optional) Google Maps API key
5. **Click "Deploy"**

#### Method 2: Using Vercel CLI

1. **Install Vercel CLI**:
```bash
npm i -g vercel
```

2. **Login and Deploy**:
```bash
vercel login
vercel
```

3. **Add Environment Variables**:
```bash
vercel env add NEXT_PUBLIC_API_URL
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
```

4. **Deploy to Production**:
```bash
vercel --prod
```

#### Important: Update Backend CORS

After deploying, update your backend environment variables:

```env
CORS_ORIGINS=https://your-app.vercel.app,https://your-custom-domain.com
FRONTEND_URL=https://your-app.vercel.app
```

Redeploy your backend after updating CORS settings.

#### Post-Deployment Checklist

- ✅ Test homepage loads
- ✅ Test login/registration
- ✅ Verify API calls work (check browser console)
- ✅ Check for CORS errors
- ✅ Test payment flow (if using Stripe)

### Backend (Render/Railway/Heroku)

#### Using Render

1. Create a new **Web Service** on Render
2. Connect your GitHub repository
3. Configure:
   - **Build Command**: `cd backend && npm install && npm run build`
   - **Start Command**: `cd backend && npm start`
   - **Environment**: Node
4. Add environment variables in Render dashboard
5. Set up PostgreSQL database on Render
6. Update `DATABASE_URL` in environment variables

#### Using Railway

1. Create new project on Railway
2. Add PostgreSQL service
3. Add Node.js service from GitHub repo
4. Configure root directory: `backend`
5. Add environment variables
6. Deploy

### Database

**Important**: Set up PostgreSQL database before deploying backend.

- **Render**: Use Render PostgreSQL addon
- **Railway**: Create PostgreSQL service
- **Supabase**: Use Supabase PostgreSQL (free tier available)

### Environment Variables (Production)

Set these in your deployment platform:

**Backend**:
- `DATABASE_URL` - Production PostgreSQL connection string
- `JWT_ACCESS_SECRET` - Strong random secret
- `JWT_REFRESH_SECRET` - Strong random secret
- `NODE_ENV=production`
- `CORS_ORIGINS` - Your frontend URL(s)
- `FRONTEND_URL` - Your frontend URL
- `SMTP_*` - Email configuration
- `STRIPE_*` - Stripe production keys

**Frontend**:
- `NEXT_PUBLIC_API_URL` - Production backend URL
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key

### Stripe Webhooks

1. Set up webhook endpoint in Stripe dashboard
2. URL: `https://your-backend-url.com/api/payments/webhook`
3. Events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

---

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](./CONTRIBUTING.md) for details on:

- Code of conduct
- Development workflow
- Pull request process
- Coding standards

### Quick Start for Contributors

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Commit using Conventional Commits: `git commit -m "feat: add amazing feature"`
5. Push to your fork: `git push origin feature/amazing-feature`
6. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## 👥 Authors

**Sheenanigans**

---

## 🙏 Acknowledgments

- All the open-source libraries that made this project possible
- The charity organizations and supporters who inspire us

---

## 📞 Support

For support, please open an issue on GitHub or contact the maintainers.

---

## 🗺 Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Multi-currency support
- [ ] Enhanced notification system
- [ ] Integration with more payment providers

---

**Made with ❤️ for causes that matter**

