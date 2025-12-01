# 🚀 COMPLETE DEPLOYMENT GUIDE - Follow These Steps

## Overview

This guide will get you from zero to production in **~1 hour**. Follow each step exactly.

---

## ✅ PHASE 1: Database Setup (15 minutes)

### Step 1.1: Open Supabase Dashboard

1. Go to **https://app.supabase.com**
2. Select your project (or create one if needed)
3. Click **SQL Editor** (left sidebar)

### Step 1.2: Run Schema Migration

1. In SQL Editor, click **"New Query"**
2. Open file: `supabase/migrations/001_initial_schema.sql`
3. **Copy ALL contents** (it's long - use Ctrl+A, Ctrl+C)
4. **Paste into SQL Editor**
5. Click **"Run"** button (or press Ctrl+Enter)
6. Wait for success message ✅

**If you see errors:**
- Some tables might already exist (that's OK - they'll be skipped)
- Check error messages - most are harmless if tables exist

### Step 1.3: Run RLS Policies

1. Click **"New Query"** again
2. Open file: `supabase/migrations/002_rls_policies.sql`
3. **Copy ALL contents**
4. **Paste into SQL Editor**
5. Click **"Run"**
6. Wait for success message ✅

### Step 1.4: Create Storage Buckets

1. Click **Storage** (left sidebar)
2. Click **"New bucket"** button

**Create Bucket 1:**
- Name: `avatars`
- Public bucket: ✅ **Check this box**
- Click **"Create bucket"**

**Create Bucket 2:**
- Name: `covers`
- Public: ✅
- Create

**Create Bucket 3:**
- Name: `events`
- Public: ✅
- Create

**Create Bucket 4:**
- Name: `posts`
- Public: ✅
- Create

**Create Bucket 5:**
- Name: `squad-avatars`
- Public: ✅
- Create

**Done!** ✅ Database ready!

---

## ⚡ PHASE 2: Deploy Edge Functions (20 minutes)

### Step 2.1: Install Supabase CLI

Open terminal and run:

```bash
npm install -g supabase
```

**If you get permission errors:**
```bash
sudo npm install -g supabase
```

### Step 2.2: Login to Supabase

```bash
supabase login
```

This opens a browser - click **"Authorize"**

### Step 2.3: Link Your Project

1. Go to **Supabase Dashboard** → **Settings** → **General**
2. Copy your **Reference ID** (looks like: `abcdefghijklmnop`)

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

When prompted:
- Enter your database password (from Supabase Dashboard → Settings → Database)
- Confirm linking

### Step 2.4: Deploy All Functions

```bash
cd /home/daryld.bacusmo/Documents/Programming/CauseConnect_WebApp

# Make script executable (if not already)
chmod +x deploy-all-functions.sh

# Run the deployment script
./deploy-all-functions.sh
```

**This will take 10-15 minutes** - it deploys all 57 functions.

**Watch for:**
- ✅ SUCCESS messages
- ❌ FAILED messages (if any, note which function)

**After completion:**
- Check Supabase Dashboard → Edge Functions
- You should see all functions listed

---

## 🌐 PHASE 3: Frontend Deployment (20 minutes)

### Step 3.1: Push Code to GitHub

```bash
cd /home/daryld.bacusmo/Documents/Programming/CauseConnect_WebApp

# Check what's changed
git status

# Add everything
git add .

# Commit
git commit -m "Complete migration to Supabase - ready for production"

# Push
git push origin main
```

### Step 3.2: Create Vercel Project

1. Go to **https://vercel.com**
2. Sign in (or create account)
3. Click **"Add New..."** → **"Project"**
4. Click **"Import Git Repository"**
5. Find your **CauseConnect** repository
6. Click **"Import"**

### Step 3.3: Configure Build Settings

On the import page:

- **Framework Preset:** Next.js (should auto-detect)
- **Root Directory:** `./` (leave default)
- **Build Command:** `npm run build` (leave default)
- **Output Directory:** `.next` (leave default)
- **Install Command:** `npm install` (leave default)

**Click "Deploy"** (we'll add env vars after)

Wait for first deployment to finish (2-3 minutes)

### Step 3.4: Get Your Supabase Keys

1. Go to **Supabase Dashboard** → **Settings** → **API**
2. You'll need:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJhbG...`)

Copy these somewhere safe!

### Step 3.5: Add Environment Variables

1. In Vercel, go to your project
2. Click **Settings** (top menu)
3. Click **Environment Variables** (left sidebar)

**Add Variable 1:**
- Key: `NEXT_PUBLIC_SUPABASE_URL`
- Value: Paste your Project URL from Step 3.4
- Environments: ✅ Production ✅ Preview ✅ Development
- Click **"Save"**

**Add Variable 2:**
- Key: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Value: Paste your anon public key from Step 3.4
- Environments: ✅ All
- Click **"Save"**

**Add Variable 3:**
- Key: `NEXT_PUBLIC_API_URL`
- Value: Your Project URL + `/functions/v1` 
  - Example: `https://xxxxx.supabase.co/functions/v1`
- Environments: ✅ All
- Click **"Save"**

**Optional - Add Firebase Variables (if using Firebase for chat):**
- See `VERCEL_ENV_QUICK_REFERENCE.md` for list

### Step 3.6: Redeploy with Environment Variables

1. Click **Deployments** tab (top menu)
2. Find your latest deployment
3. Click **"..."** (three dots) → **"Redeploy"**
4. Wait for deployment to complete (2-3 minutes)

**Done!** ✅ Frontend deployed!

---

## ✅ PHASE 4: Test Everything (15 minutes)

### Step 4.1: Open Your Site

1. Go to **Vercel Dashboard** → Your Project
2. Click on your **deployment URL** (looks like: `your-project.vercel.app`)
3. Your site should load! ✅

### Step 4.2: Open Browser DevTools

1. Press **F12** (or right-click → Inspect)
2. Click **Console** tab
3. Click **Network** tab (keep open to see API calls)

### Step 4.3: Test Registration

1. On your site, click **"Sign Up"** or go to `/register`
2. Fill out the form:
   - First Name: Test
   - Last Name: User
   - Username: testuser123
   - Email: your-real-email@example.com
   - Password: Test1234!
   - Confirm Password: Test1234!
3. Click **"Send Verification Code"**

**What to check:**
- ✅ No errors in Console tab
- ✅ Network tab shows request to `*.supabase.co/functions/v1/auth-send-verification`
- ✅ Success message appears OR you see OTP code (in dev mode)

**If you see "Failed to fetch":**
- Check Edge Functions are deployed (Phase 2)
- Check environment variables are set (Phase 3.5)
- Check `NEXT_PUBLIC_API_URL` is correct

### Step 4.4: Test Login (if you have an account)

1. Go to `/login`
2. Enter credentials
3. Click **"Login"**

**Should redirect to feed or dashboard** ✅

### Step 4.5: Test Core Features

Try these:
- [ ] View feed (should load events/posts)
- [ ] Click on an event (should show details)
- [ ] View your profile
- [ ] Try creating a post

**If everything works → You're live!** 🎉

---

## 🐛 Troubleshooting

### Problem: "Failed to fetch" on registration

**Solutions (try in order):**

1. **Check Edge Functions:**
   - Go to Supabase Dashboard → Edge Functions
   - Verify `auth-send-verification` exists
   - If missing, deploy it: `supabase functions deploy auth-send-verification`

2. **Check Environment Variables:**
   - Go to Vercel → Settings → Environment Variables
   - Verify all 3 variables are set
   - Check `NEXT_PUBLIC_API_URL` ends with `/functions/v1`

3. **Check API URL:**
   - In browser console, run: `console.log(process.env.NEXT_PUBLIC_API_URL)`
   - Should show your Supabase URL + `/functions/v1`
   - If `undefined`, env vars aren't loaded (redeploy Vercel)

4. **Check Function Logs:**
   - Go to Supabase Dashboard → Edge Functions → `auth-send-verification` → Logs
   - Look for errors

### Problem: Functions not deploying

**Solutions:**
- Make sure you're logged in: `supabase login`
- Make sure project is linked: `supabase link --project-ref YOUR_REF`
- Check you're in correct directory
- Try deploying one function manually first: `supabase functions deploy health`

### Problem: Database errors

**Solutions:**
- Verify migrations ran successfully (Phase 1.2, 1.3)
- Check all tables exist: Go to Supabase Dashboard → Table Editor
- Re-run migrations if needed

---

## 📊 Deployment Checklist

Use this to track progress:

### Database ✅
- [ ] Schema migration run successfully
- [ ] RLS policies run successfully
- [ ] All 5 storage buckets created
- [ ] Buckets are public

### Edge Functions ✅
- [ ] Supabase CLI installed
- [ ] Logged into Supabase
- [ ] Project linked
- [ ] All 57 functions deployed
- [ ] Functions visible in Dashboard
- [ ] Health endpoint works

### Frontend ✅
- [ ] Code pushed to GitHub
- [ ] Vercel project created
- [ ] First deployment succeeded
- [ ] Environment variables added (3 minimum)
- [ ] Redeployed with env vars
- [ ] Site loads

### Testing ✅
- [ ] Site loads without errors
- [ ] No console errors
- [ ] Registration works
- [ ] Login works (if applicable)
- [ ] Core features work

---

## 🎯 What's Next?

After successful deployment:

1. **Set Up Email Service** (for verification codes)
   - Sign up for SendGrid or Resend
   - Update Edge Functions to send real emails

2. **Configure Payments** (Stripe/PayPal)
   - Add API keys to environment variables
   - Deploy payment Edge Functions

3. **Monitor & Optimize**
   - Check Edge Function logs regularly
   - Monitor database performance
   - Optimize slow queries

---

## ✅ Success!

If all steps completed:
- ✅ Your app is live!
- ✅ All core features working
- ✅ Database configured
- ✅ Edge Functions deployed
- ✅ Frontend deployed

**Congratulations! Your CauseConnect app is now in production!** 🎉

---

## 📞 Need Help?

**Quick References:**
- Detailed deployment: `FINAL_DEPLOYMENT_STEP_BY_STEP.md`
- Edge Functions: `COMPLETE_EDGE_FUNCTIONS_DEPLOYMENT_GUIDE.md`
- Environment variables: `VERCEL_ENV_QUICK_REFERENCE.md`
- Troubleshooting: `FIX_VERCEL_DEPLOYMENT_ERROR.md`

**You've got everything you need! Let's deploy!** 🚀



