# 🚀 CauseConnect: Complete Deployment Guide
## Vercel + Supabase Migration

---

## 📋 TABLE OF CONTENTS

1. [Pre-Deployment Analysis](#pre-deployment-analysis)
2. [Phase 1: Pre-Deployment Preparation](#phase-1-pre-deployment-preparation)
3. [Phase 2: Supabase Setup](#phase-2-supabase-setup)
4. [Phase 3: Frontend Deployment on Vercel](#phase-3-frontend-deployment-on-vercel)
5. [Phase 4: Deploy](#phase-4-deploy)
6. [Phase 5: Post-Deployment](#phase-5-post-deployment)

---

## 🔍 PRE-DEPLOYMENT ANALYSIS

### Current Architecture

**Frontend:**
- Next.js 15.0.0
- React 18.3.1
- TypeScript
- Tailwind CSS
- Firebase (for chat: Firestore + Storage)

**Backend:**
- Express.js 5.1.0
- PostgreSQL (via Prisma)
- JWT Authentication
- 14 route modules (auth, user, event, post, comment, donation, squad, settings, notification, chat, customFeed, explore, tag, payment)

**Database:**
- Prisma ORM
- PostgreSQL
- Complex schema with 30+ models

**Storage:**
- Firebase Storage (for chat files)
- Express/multer (for profile/event images)

### Target Architecture

**Frontend:**
- Vercel (Next.js hosting)
- Firebase (keep for chat - Firestore + Storage)

**Backend:**
- Supabase Edge Functions (Deno runtime)
- Supabase PostgreSQL (migrate from current PostgreSQL)
- Supabase Auth (migrate from JWT)
- Supabase Storage (for profile/event images)

**Database:**
- Supabase PostgreSQL (same Prisma schema)
- Row Level Security (RLS) policies

---

## 🎯 PHASE 1: PRE-DEPLOYMENT PREPARATION

### ✅ 1.1 Validate Folder Structure

**Required Structure:**
```
CauseConnect_WebApp/
├── app/                    # Next.js app directory ✓
├── components/             # React components ✓
├── lib/                    # Utilities ✓
│   ├── api/               # API client ✓
│   ├── firebase/          # Firebase config ✓
│   └── utils/             # Helpers ✓
├── prisma/                # Prisma schema ✓
│   └── schema.prisma
├── supabase/              # ⚠️ NEEDS TO BE CREATED
│   ├── functions/         # Edge Functions
│   ├── migrations/        # SQL migrations
│   └── config.toml        # Supabase config
├── contexts/              # React contexts ✓
├── hooks/                 # React hooks ✓
├── public/                # Static assets ✓
├── .env.example           # ⚠️ NEEDS TO BE CREATED
├── .gitignore             # ✓
├── next.config.mjs        # ✓
├── package.json           # ✓
└── tsconfig.json          # ✓
```

**Action:** Create `/supabase` directory structure.

### ✅ 1.2 Environment Variables Audit

**Current Variables Needed:**

**Frontend (.env.local):**
- `NEXT_PUBLIC_API_URL` → Will change to Supabase Edge Functions URL
- `NEXT_PUBLIC_FIREBASE_API_KEY` → Keep for chat
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` → Keep for chat
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` → Keep for chat
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` → Keep for chat
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` → Keep for chat
- `NEXT_PUBLIC_FIREBASE_APP_ID` → Keep for chat
- `NEXT_PUBLIC_SUPABASE_URL` → NEW: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → NEW: Supabase anonymous key
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → Keep if using Stripe

**Backend/Supabase:**
- `SUPABASE_SERVICE_ROLE_KEY` → For Edge Functions
- `DATABASE_URL` → Supabase PostgreSQL connection string
- `JWT_SECRET` → Can use Supabase JWT secret
- `STRIPE_SECRET_KEY` → Keep if using Stripe
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` → For email

**Action:** Create comprehensive `.env.example` file.

### ✅ 1.3 Route Migration Map

**14 Route Modules to Convert:**

1. **auth** → Supabase Auth (mostly built-in) + Edge Function for custom logic
2. **user** → Edge Functions: `/api/user-*`
3. **event** → Edge Functions: `/api/event-*`
4. **post** → Edge Functions: `/api/post-*`
5. **comment** → Edge Functions: `/api/comment-*`
6. **donation** → Edge Functions: `/api/donation-*`
7. **squad** → Edge Functions: `/api/squad-*`
8. **settings** → Edge Functions: `/api/settings-*`
9. **notification** → Edge Functions: `/api/notification-*`
10. **chat** → Edge Functions: `/api/chat-*` (helper endpoints for Firebase chat)
11. **customFeed** → Edge Functions: `/api/custom-feed-*`
12. **explore** → Edge Functions: `/api/explore-*`
13. **tag** → Edge Functions: `/api/tag-*`
14. **payment** → Edge Functions: `/api/payment-*`

**Action:** Document all endpoints in each route file.

### ✅ 1.4 Prisma Compatibility

**Current Setup:**
- PostgreSQL provider ✓
- CUID IDs ✓
- Relations with cascade deletes ✓

**Supabase Compatibility:**
- Uses PostgreSQL ✓ (fully compatible)
- Same Prisma schema works
- Need to run migrations in Supabase

**Action:** Create migration guide for Supabase.

---

## 🎯 PHASE 2: SUPABASE SETUP

### ✅ 2.1 Create Supabase Project

**Steps:**
1. Go to https://supabase.com
2. Sign up / Log in
3. Click "New Project"
4. Fill in:
   - Project Name: `causeconnect`
   - Database Password: (generate strong password)
   - Region: Choose closest to users
5. Wait for provisioning (~2 minutes)

**After Creation:**
- Copy `Project URL` → This is `NEXT_PUBLIC_SUPABASE_URL`
- Copy `anon public` key → This is `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Copy `service_role` key → This is `SUPABASE_SERVICE_ROLE_KEY`
- Copy `Database URL` → This is `DATABASE_URL` (connection string)

### ✅ 2.2 Database Migration

**Steps:**
1. Update `.env` with Supabase `DATABASE_URL`
2. Run Prisma migrations:
   ```bash
   npx prisma migrate deploy
   ```
3. Verify tables in Supabase Dashboard → Table Editor

### ✅ 2.3 Enable Supabase Features

**Storage:**
1. Go to Storage → Create buckets:
   - `avatars` (public)
   - `covers` (public)
   - `events` (public)
   - `posts` (public)
   - `squad-avatars` (public)

**Auth:**
1. Go to Authentication → Settings
2. Enable Email provider
3. Configure email templates (optional)

**Edge Functions:**
1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```
2. Link project:
   ```bash
   supabase login
   supabase link --project-ref <your-project-ref>
   ```

### ✅ 2.4 Row Level Security (RLS)

**RLS Policies Needed:**
- Users table: Users can read all, update own
- Events table: All can read, owners can write
- Posts table: All can read, authors can write
- Comments table: All can read, authors can write
- Donations table: Users can read own
- Squads table: Members can read, admins can write
- Settings table: Users can read/write own

**Action:** Generate SQL policies file.

---

## 🎯 PHASE 3: FRONTEND DEPLOYMENT ON VERCEL

### ✅ 3.1 Prepare for Vercel

**Checklist:**
- [ ] Fix build errors
- [ ] Update API URLs to Supabase Edge Functions
- [ ] Update environment variables
- [ ] Test production build locally
- [ ] Verify no Node.js server-only APIs in client components

**Action:** Create build checklist and fix issues.

### ✅ 3.2 Update API Client

**Current:** Points to `http://localhost:3001/api`
**New:** Points to Supabase Edge Functions:
- `https://<project-ref>.supabase.co/functions/v1/<function-name>`

**Action:** Update `lib/api/client.ts` to support Supabase Edge Functions.

### ✅ 3.3 Environment Variables in Vercel

**Required Variables:**
- All `NEXT_PUBLIC_*` variables
- No backend secrets (handled by Supabase)

---

## 🎯 PHASE 4: DEPLOY

### ✅ 4.1 Deploy Frontend to Vercel

**Steps:**
1. Push code to GitHub
2. Go to vercel.com
3. Import GitHub repository
4. Configure:
   - Framework: Next.js
   - Root Directory: `.`
   - Build Command: `npm run build`
   - Output Directory: `.next`
5. Add environment variables
6. Deploy

### ✅ 4.2 Deploy Edge Functions

**Steps:**
1. Install Supabase CLI
2. Deploy functions:
   ```bash
   supabase functions deploy <function-name>
   ```
3. Set secrets:
   ```bash
   supabase secrets set STRIPE_SECRET_KEY=sk_...
   ```

---

## 🎯 PHASE 5: POST-DEPLOYMENT

### ✅ 5.1 Health Checks

**Endpoints to Create:**
- `/api/health` → Database + Edge Functions
- Frontend health page → `/health`

### ✅ 5.2 Verification Checklist

- [ ] Login/Signup works
- [ ] Profile creation works
- [ ] Event creation works
- [ ] Donations work
- [ ] Chat works (Firebase)
- [ ] Images upload (Supabase Storage)
- [ ] Feed loads
- [ ] Notifications work
- [ ] Squads work

---

## 📝 NEXT STEPS

This guide will be populated with:
1. Detailed route conversion examples
2. Edge Function templates
3. RLS policy SQL
4. Step-by-step deployment commands
5. Troubleshooting guide

---

**Status:** 🚧 IN PROGRESS
**Last Updated:** Initial creation


