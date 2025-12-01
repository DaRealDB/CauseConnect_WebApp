# 🚀 START DEPLOYMENT HERE!

## Quick Start Guide

This is your **one-page cheat sheet** to deploy everything. Follow these steps in order.

---

## ✅ Step 1: Database Setup (15 minutes)

### 1.1 Run Migrations

1. Go to **Supabase Dashboard** → Your Project
2. Click **SQL Editor**
3. Click **New Query**
4. Open file: `supabase/migrations/001_initial_schema.sql`
5. Copy ALL contents → Paste in SQL Editor → Click **Run**
6. Wait for "Success" ✅

7. Click **New Query** again
8. Open file: `supabase/migrations/002_rls_policies.sql`
9. Copy ALL contents → Paste → Click **Run**
10. Wait for "Success" ✅

### 1.2 Create Storage Buckets

1. Go to **Storage** (left sidebar)
2. Click **New bucket** (repeat 5 times)

Create these:
- `avatars` - Public ✅, 5 MB
- `covers` - Public ✅, 10 MB  
- `events` - Public ✅, 10 MB
- `posts` - Public ✅, 10 MB
- `squad-avatars` - Public ✅, 5 MB

**Done!** ✅

---

## ⚡ Step 2: Deploy Edge Functions (20 minutes)

### 2.1 Setup CLI

```bash
# Install (if needed)
npm install -g supabase

# Login
supabase login

# Link project (get project ref from Dashboard → Settings → General)
supabase link --project-ref YOUR_PROJECT_REF
```

### 2.2 Deploy All Functions

```bash
cd /home/daryld.bacusmo/Documents/Programming/CauseConnect_WebApp

# Run the automated script
./deploy-all-functions.sh

# OR deploy manually (see COMPLETE_EDGE_FUNCTIONS_DEPLOYMENT_GUIDE.md)
```

**Wait for "All functions deployed successfully!"** ✅

---

## 🌐 Step 3: Deploy Frontend (20 minutes)

### 3.1 Push to GitHub

```bash
git add .
git commit -m "Ready for production"
git push origin main
```

### 3.2 Connect to Vercel

1. Go to **https://vercel.com**
2. Click **"New Project"**
3. Import your GitHub repo
4. Click **"Deploy"** (first time - don't worry about env vars yet)

### 3.3 Set Environment Variables

After first deploy, go to **Settings** → **Environment Variables**

Add these (one by one):

1. **NEXT_PUBLIC_SUPABASE_URL**
   - Value: `https://xxxxx.supabase.co` (from Supabase Dashboard → Settings → API)

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Value: Long string from Supabase Dashboard → Settings → API → anon public

3. **NEXT_PUBLIC_API_URL**
   - Value: `https://xxxxx.supabase.co/functions/v1` (same as #1 + `/functions/v1`)

4-9. **Firebase Variables** (if using Firebase)
   - See `VERCEL_ENV_QUICK_REFERENCE.md`

**Save**, then go to **Deployments** → **Redeploy** latest deployment ✅

---

## ✅ Step 4: Test (10 minutes)

1. Go to your Vercel site URL
2. Try to **register** a new user
3. Check browser console (F12) for errors
4. Try to **login**
5. Test core features

**If everything works → You're live!** 🎉

---

## 🐛 Problems?

**"Failed to fetch":**
- Check Edge Functions are deployed (Step 2)
- Check environment variables (Step 3.3)
- Check `NEXT_PUBLIC_API_URL` is correct

**"Function not found":**
- Wait 2-3 minutes after deployment
- Check Supabase Dashboard → Edge Functions

**See:** `FIX_VERCEL_DEPLOYMENT_ERROR.md` for more help

---

## 📖 Need More Detail?

- **Detailed Steps:** `FINAL_DEPLOYMENT_STEP_BY_STEP.md`
- **Edge Functions:** `COMPLETE_EDGE_FUNCTIONS_DEPLOYMENT_GUIDE.md`
- **Environment Vars:** `VERCEL_ENV_QUICK_REFERENCE.md`
- **Storage Setup:** `STORAGE_SETUP_GUIDE.md`

---

## ✅ Quick Checklist

- [ ] Database migrations run
- [ ] Storage buckets created
- [ ] Edge Functions deployed (57 functions)
- [ ] Code pushed to GitHub
- [ ] Vercel project connected
- [ ] Environment variables set
- [ ] Site deployed and working

---

**Total Time: ~1 hour to production!** 🚀

**Follow these 4 steps and you're done!**



