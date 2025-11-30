# 🚀 Complete Supabase Migration Guide
## Step-by-Step Deployment Instructions

**This guide will walk you through migrating CauseConnect from Express.js to Supabase Edge Functions.**

---

## 📋 PRE-REQUISITES

1. **Supabase Account:** Sign up at https://supabase.com
2. **Supabase CLI:** `npm install -g supabase`
3. **Vercel Account:** Sign up at https://vercel.com
4. **GitHub Repository:** Your code pushed to GitHub

---

## 🎯 PHASE 1: SETUP SUPABASE PROJECT

### Step 1.1: Create Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in:
   - **Project Name:** `causeconnect`
   - **Database Password:** Generate strong password (save it!)
   - **Region:** Choose closest to your users
   - **Pricing Plan:** Free tier is fine to start

4. Wait ~2 minutes for provisioning

### Step 1.2: Get Your Keys

After project creation, go to **Settings → API** and copy:

- **Project URL:** `https://xxxxx.supabase.co` → `NEXT_PUBLIC_SUPABASE_URL`
- **anon public key:** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role key:** → `SUPABASE_SERVICE_ROLE_KEY` (NEVER expose in frontend)

Go to **Settings → Database** and copy:
- **Connection string:** → `DATABASE_URL`

---

## 🗄️ PHASE 2: DATABASE SETUP

### Step 2.1: Run Prisma Migrations

1. **Update `.env.local` with Supabase DATABASE_URL:**
   ```env
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres"
   ```

2. **Run migrations:**
   ```bash
   cd backend
   npx prisma migrate deploy
   ```

   This will create all tables in Supabase.

3. **Verify tables:**
   - Go to Supabase Dashboard → Table Editor
   - You should see all tables (users, events, posts, etc.)

### Step 2.2: Enable Row Level Security (RLS)

Run this SQL in Supabase Dashboard → SQL Editor:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE squad_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
```

**Note:** Full RLS policies are in `supabase/migrations/rls_policies.sql`

---

## 📦 PHASE 3: STORAGE SETUP

### Step 3.1: Create Storage Buckets

Go to Supabase Dashboard → Storage and create:

1. **`avatars`** (Public)
   - Public bucket: ✅ Yes
   - File size limit: 5MB

2. **`covers`** (Public)
   - Public bucket: ✅ Yes
   - File size limit: 10MB

3. **`events`** (Public)
   - Public bucket: ✅ Yes
   - File size limit: 10MB

4. **`posts`** (Public)
   - Public bucket: ✅ Yes
   - File size limit: 10MB

5. **`squad-avatars`** (Public)
   - Public bucket: ✅ Yes
   - File size limit: 5MB

### Step 3.2: Set Storage Policies

Run this SQL:

```sql
-- Allow public read access
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id IN ('avatars', 'covers', 'events', 'posts', 'squad-avatars'));

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' AND
  bucket_id IN ('avatars', 'covers', 'events', 'posts', 'squad-avatars')
);

-- Allow users to update their own files
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
USING (auth.uid()::text = (storage.foldername(name))[1]);
```

---

## 🔐 PHASE 4: AUTHENTICATION MIGRATION

### Step 4.1: Enable Supabase Auth

1. Go to **Authentication → Settings**
2. Enable **Email provider**
3. Configure email templates (optional for now)

### Step 4.2: Update Frontend Auth

The frontend AuthContext needs to be updated to use Supabase Auth instead of JWT. See `MIGRATION_AUTH.md` for detailed steps.

**Quick migration:**
1. Install Supabase client: `npm install @supabase/supabase-js`
2. Update `contexts/AuthContext.tsx` to use Supabase
3. Update login/register pages

---

## ⚡ PHASE 5: DEPLOY EDGE FUNCTIONS

### Step 5.1: Link Supabase Project

```bash
supabase login
supabase link --project-ref xxxxx
```

(Get project ref from Supabase Dashboard URL)

### Step 5.2: Deploy Functions

Deploy each function:

```bash
# Health check
supabase functions deploy health

# Auth functions
supabase functions deploy auth-register
supabase functions deploy auth-login

# User functions
supabase functions deploy user-profile
supabase functions deploy user-search

# Event functions
supabase functions deploy event-list
supabase functions deploy event-detail
supabase functions deploy event-create

# ... (continue for all functions)
```

### Step 5.3: Set Environment Secrets

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJ...
supabase secrets set DATABASE_URL=postgresql://...
```

---

## 🚀 PHASE 6: DEPLOY FRONTEND TO VERCEL

### Step 6.1: Push to GitHub

```bash
git add .
git commit -m "Prepare for Supabase migration"
git push origin main
```

### Step 6.2: Connect to Vercel

1. Go to https://vercel.com
2. Click "New Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset:** Next.js
   - **Root Directory:** `.`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`

### Step 6.3: Set Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_API_URL=https://xxxxx.supabase.co/functions/v1
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
```

### Step 6.4: Deploy

Click "Deploy" and wait for build to complete.

---

## ✅ PHASE 7: VERIFICATION

### Step 7.1: Health Check

Visit: `https://xxxxx.supabase.co/functions/v1/health`

Should return:
```json
{
  "status": "ok",
  "timestamp": "2024-...",
  "database": "ok"
}
```

### Step 7.2: Test Features

1. ✅ User registration
2. ✅ Login
3. ✅ Create event
4. ✅ Upload image
5. ✅ Make donation
6. ✅ Chat (Firebase)

---

## 📝 NEXT STEPS

1. **Migrate existing users** (if any) to Supabase Auth
2. **Migrate existing files** from `/uploads` to Supabase Storage
3. **Set up production Stripe keys**
4. **Configure Google Maps API**
5. **Set up email notifications**
6. **Monitor Edge Function logs**

---

## 🆘 TROUBLESHOOTING

### Database Connection Error
- Check DATABASE_URL format
- Verify password is correct
- Check Supabase project status

### Edge Function 500 Error
- Check function logs: `supabase functions logs <function-name>`
- Verify environment secrets are set
- Check CORS headers

### Storage Upload Fails
- Verify bucket exists
- Check storage policies
- Verify file size limits

---

**Status:** 🚧 Migration in progress  
**Last Updated:** Initial creation


