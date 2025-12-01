# 🎯 FINAL DEPLOYMENT: Step-by-Step Complete Guide

## Overview

This is your complete, step-by-step guide to deploy **everything** to production. Follow each step in order.

---

## ✅ PREREQUISITES CHECKLIST

Before starting, verify you have:

- [ ] Supabase account (free tier is fine)
- [ ] Supabase project created
- [ ] Vercel account
- [ ] GitHub repository with your code
- [ ] All code pushed to GitHub
- [ ] Supabase CLI installed (`npm install -g supabase`)

---

## 📦 PHASE 1: Database Setup (30 minutes)

### Step 1.1: Run Database Migrations

1. Go to **Supabase Dashboard** → Your Project
2. Click **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
5. Paste into SQL Editor
6. Click **Run** (or press Ctrl+Enter)
7. Wait for "Success" message

### Step 1.2: Run RLS Policies

1. Still in **SQL Editor**
2. Click **New Query**
3. Copy the entire contents of `supabase/migrations/002_rls_policies.sql`
4. Paste into SQL Editor
5. Click **Run**
6. Wait for "Success" message

### Step 1.3: Create Storage Buckets

1. Go to **Storage** (left sidebar)
2. Click **New bucket**
3. Create these buckets (repeat for each):

   **Bucket 1: `avatars`**
   - Name: `avatars`
   - Public bucket: ✅ Yes
   - File size limit: 5 MB
   
   **Bucket 2: `covers`**
   - Name: `covers`
   - Public bucket: ✅ Yes
   - File size limit: 10 MB
   
   **Bucket 3: `events`**
   - Name: `events`
   - Public bucket: ✅ Yes
   - File size limit: 10 MB
   
   **Bucket 4: `posts`**
   - Name: `posts`
   - Public bucket: ✅ Yes
   - File size limit: 10 MB
   
   **Bucket 5: `squad-avatars`**
   - Name: `squad-avatars`
   - Public bucket: ✅ Yes
   - File size limit: 5 MB

### Step 1.4: Set Storage Policies

See `STORAGE_SETUP_GUIDE.md` for detailed SQL policies. Or run these in SQL Editor:

```sql
-- Public read access for all buckets
CREATE POLICY "Public read access for avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Repeat for: covers, events, posts, squad-avatars
-- (Update bucket_id in each policy)
```

---

## ⚡ PHASE 2: Deploy Edge Functions (45 minutes)

### Step 2.1: Setup Supabase CLI

```bash
# Install CLI (if not already)
npm install -g supabase

# Login
supabase login

# Link project (get project ref from Dashboard → Settings → General)
supabase link --project-ref your-project-ref
```

### Step 2.2: Deploy All Functions

**Option A: Use the deployment script (easiest)**

```bash
cd /home/daryld.bacusmo/Documents/Programming/CauseConnect_WebApp
./deploy-all-functions.sh
```

**Option B: Deploy manually**

```bash
# Deploy critical functions first
supabase functions deploy health
supabase functions deploy auth-login
supabase functions deploy auth-register
supabase functions deploy auth-send-verification
supabase functions deploy auth-verify-email

# Then deploy the rest (see deploy-all-functions.sh for full list)
```

### Step 2.3: Verify Deployments

1. Go to **Supabase Dashboard** → **Edge Functions**
2. You should see all functions listed
3. Click on a function to see logs and status

---

## 🌐 PHASE 3: Frontend Deployment (30 minutes)

### Step 3.1: Push Code to GitHub

```bash
cd /home/daryld.bacusmo/Documents/Programming/CauseConnect_WebApp

# Check status
git status

# Add all files
git add .

# Commit
git commit -m "Ready for production deployment"

# Push
git push origin main
```

### Step 3.2: Connect to Vercel

1. Go to **https://vercel.com**
2. Click **"New Project"**
3. Import your GitHub repository
4. Click **"Import"**

### Step 3.3: Configure Vercel Project

1. **Framework Preset:** Next.js (auto-detected)
2. **Root Directory:** `./` (default)
3. **Build Command:** `npm run build` (default)
4. **Output Directory:** `.next` (auto-detected)

Click **"Deploy"** (don't worry about env vars yet)

### Step 3.4: Set Environment Variables

After first deployment, go to **Settings** → **Environment Variables**

Add these one by one:

**1. NEXT_PUBLIC_SUPABASE_URL**
- Key: `NEXT_PUBLIC_SUPABASE_URL`
- Value: `https://xxxxx.supabase.co` (from Supabase Dashboard → Settings → API)

**2. NEXT_PUBLIC_SUPABASE_ANON_KEY**
- Key: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Value: Long string starting with `eyJhbG...` (from Supabase Dashboard → Settings → API → anon public)

**3. NEXT_PUBLIC_API_URL**
- Key: `NEXT_PUBLIC_API_URL`
- Value: `https://xxxxx.supabase.co/functions/v1` (same as SUPABASE_URL + `/functions/v1`)

**4-9. Firebase Variables (if using Firebase for chat)**
- See `VERCEL_ENV_QUICK_REFERENCE.md` for complete list

After adding all variables:
1. Click **"Save"**
2. Go to **Deployments** tab
3. Click **"..."** on latest deployment → **"Redeploy"**
4. Wait for new deployment

---

## ✅ PHASE 4: Verification & Testing (30 minutes)

### Step 4.1: Test Homepage

1. Go to your Vercel site URL
2. Should load without errors
3. Open browser console (F12) - check for errors

### Step 4.2: Test Registration

1. Click **"Sign Up"** or go to `/register`
2. Fill out the form
3. Click **"Send Verification Code"**
4. Check browser console for errors
5. Check Supabase Edge Function logs

**Expected:** Code sent successfully (or OTP shown in dev mode)

### Step 4.3: Test Login

1. Go to `/login`
2. Enter credentials
3. Click **"Login"**

**Expected:** Redirects to feed or dashboard

### Step 4.4: Test Core Features

- [ ] View feed
- [ ] View events
- [ ] Create a post
- [ ] View profile
- [ ] Update settings

---

## 🐛 PHASE 5: Troubleshooting

### Common Issues

**"Failed to fetch" error:**
- ✅ Check Edge Functions are deployed
- ✅ Check environment variables are set
- ✅ Check `NEXT_PUBLIC_API_URL` is correct
- ✅ Check browser console for specific error

**"Function not found" (404):**
- ✅ Verify function name in Supabase Dashboard
- ✅ Wait a few minutes after deployment
- ✅ Check function logs for errors

**"Authentication failed":**
- ✅ Check `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
- ✅ Verify tokens are being sent
- ✅ Check Edge Function logs

**"CORS error":**
- ✅ Edge Functions have CORS configured
- ✅ Check browser console for exact error
- ✅ Verify request headers

---

## 📊 Final Checklist

### Database ✅
- [ ] Migrations run successfully
- [ ] All tables created
- [ ] RLS policies enabled
- [ ] Storage buckets created

### Edge Functions ✅
- [ ] All functions deployed
- [ ] Functions visible in Dashboard
- [ ] Test function works (health check)

### Frontend ✅
- [ ] Code pushed to GitHub
- [ ] Connected to Vercel
- [ ] Environment variables set
- [ ] Build succeeds
- [ ] Site loads

### Testing ✅
- [ ] Registration works
- [ ] Login works
- [ ] Core features work
- [ ] No console errors

---

## 🎉 Success!

If everything passes:
- ✅ Your app is live!
- ✅ All Edge Functions working
- ✅ Database configured
- ✅ Storage ready

**Next Steps:**
1. Monitor Edge Function logs
2. Set up email service for verification codes
3. Configure payment integrations
4. Add error monitoring

---

## 📞 Need Help?

1. Check function logs in Supabase Dashboard
2. Check browser console for errors
3. Check Vercel build logs
4. Review `FIX_VERCEL_DEPLOYMENT_ERROR.md`

---

**You're ready! Follow these steps and your app will be live! 🚀**



