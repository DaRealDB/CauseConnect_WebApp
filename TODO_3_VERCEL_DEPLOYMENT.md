# ✅ TODO 3: Configure Vercel & Deploy Frontend

## 📋 Complete Step-by-Step Guide

### Prerequisites
- ✅ TODO 1 completed (Supabase set up)
- ✅ TODO 2 completed (Edge Functions deployed)
- ✅ GitHub repository with your code
- ✅ Vercel account (or ready to create)

---

### Phase 1: Set Up Vercel Account (5 minutes)

#### Step 1.1: Create Vercel Account (if needed)
1. Go to https://vercel.com
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"** (recommended)
4. Authorize Vercel to access your GitHub
5. ✅ You're now logged in!

#### Step 1.2: Install Vercel CLI (Optional but Recommended)
```bash
# Install globally
npm install -g vercel

# Verify installation
vercel --version
```

---

### Phase 2: Push Code to GitHub (5 minutes)

#### Step 2.1: Initialize Git (if not already done)
```bash
cd /home/daryld.bacusmo/Documents/Programming/CauseConnect_WebApp

# Check if git is initialized
git status

# If not initialized:
git init
git add .
git commit -m "Complete Supabase migration - ready for deployment"
```

#### Step 2.2: Create GitHub Repository
1. Go to https://github.com/new
2. Repository name: `CauseConnect` (or your preferred name)
3. Description: "Social platform for causes and community impact"
4. Choose: **Private** (recommended) or **Public**
5. **Don't** initialize with README, .gitignore, or license
6. Click **"Create repository"**

#### Step 2.3: Push Code to GitHub
```bash
# Add GitHub remote (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/CauseConnect.git

# Push code
git branch -M main
git push -u origin main
```

✅ Code is now on GitHub!

---

### Phase 3: Connect Repository to Vercel (3 minutes)

#### Step 3.1: Import Project
1. Go to https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. Click **"Import Git Repository"**
4. Find your `CauseConnect` repository
5. Click **"Import"**

#### Step 3.2: Configure Project
Vercel will auto-detect Next.js settings:

**Project Settings:**
```
Framework Preset: Next.js ✅ (auto-detected)
Root Directory: ./
Build Command: npm run build ✅ (auto-detected)
Output Directory: .next ✅ (auto-detected)
Install Command: npm install ✅ (auto-detected)
```

**Leave these as default** (Vercel auto-detects Next.js)

---

### Phase 4: Set Environment Variables (10 minutes)

**⚠️ CRITICAL: Set ALL environment variables before deploying!**

#### Step 4.1: Add Frontend Variables

Click **"Environment Variables"** and add:

**Supabase Variables:**
```
NEXT_PUBLIC_SUPABASE_URL
Value: https://YOUR_PROJECT_REF.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: your-anon-key-from-supabase

NEXT_PUBLIC_API_URL
Value: https://YOUR_PROJECT_REF.supabase.co/functions/v1
```

**Firebase Variables (if using chat):**
```
NEXT_PUBLIC_FIREBASE_API_KEY
Value: your-firebase-api-key

NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
Value: your-project.firebaseapp.com

NEXT_PUBLIC_FIREBASE_PROJECT_ID
Value: your-firebase-project-id

NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
Value: your-project.appspot.com

NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
Value: your-sender-id

NEXT_PUBLIC_FIREBASE_APP_ID
Value: your-firebase-app-id
```

#### Step 4.2: Add Backend Variables (for Edge Functions)

**Optional but recommended for full functionality:**
```
DATABASE_URL
Value: postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres
Environment: Production, Preview, Development

SUPABASE_SERVICE_ROLE_KEY
Value: your-service-role-key
Environment: Production, Preview, Development

JWT_SECRET
Value: your-jwt-secret
Environment: Production, Preview, Development
```

**Stripe (if using payments):**
```
STRIPE_SECRET_KEY
Value: sk_live_xxxxx (or sk_test_xxxxx for testing)
Environment: Production
```

#### Step 4.3: Apply to All Environments
For each variable, check:
- ✅ Production
- ✅ Preview
- ✅ Development

Then click **"Save"**

---

### Phase 5: Deploy to Vercel (5 minutes)

#### Step 5.1: Start Deployment
1. Review all settings
2. Click **"Deploy"** button
3. ⏳ Wait for build to complete (2-5 minutes)

#### Step 5.2: Monitor Build
Watch the build logs:
- ✅ Installing dependencies
- ✅ Building Next.js app
- ✅ Deploying to Vercel edge network
- ✅ Build complete!

#### Step 5.3: Get Deployment URL
Once complete, you'll see:
- ✅ Production URL: `https://your-app.vercel.app`
- ✅ Deployment successful!

---

### Phase 6: Fix Build Errors (If Any)

#### Common Build Errors:

**Error: "Module not found"**
- **Solution:** Check `package.json` dependencies
- Run `npm install` locally to verify
- Ensure all imports are correct

**Error: "Environment variable missing"**
- **Solution:** Check all `NEXT_PUBLIC_*` variables are set
- Redeploy after adding variables

**Error: "Build failed - TypeScript errors"**
- **Solution:** Fix TypeScript errors locally first
- Run `npm run build` locally to check

**Error: "Failed to fetch"**
- **Solution:** Check `NEXT_PUBLIC_API_URL` is correct
- Verify Edge Functions are deployed

**Error: "Prisma client not generated"**
- **Solution:** Add build command: `prisma generate && npm run build`
- Or use Vercel's Prisma integration

---

### Phase 7: Configure Custom Domain (Optional - 10 minutes)

#### Step 7.1: Add Domain
1. Go to **Settings → Domains**
2. Enter your domain: `yourdomain.com`
3. Click **"Add"**

#### Step 7.2: Configure DNS
Vercel will show DNS records to add:
- **CNAME** record pointing to Vercel
- **A** record (if needed)

Add these in your domain registrar (GoDaddy, Namecheap, etc.)

#### Step 7.3: Wait for Propagation
- DNS changes take 5-60 minutes
- Vercel will auto-detect when ready
- ✅ Domain active!

---

### Phase 8: Enable Preview Deployments (Optional)

Preview deployments automatically create URLs for every pull request:

1. Go to **Settings → Git**
2. Ensure **"Automatic deployments from Git"** is enabled
3. ✅ Every PR gets a preview URL!

---

## ✅ Completion Checklist

- [ ] Vercel account created
- [ ] Code pushed to GitHub
- [ ] Repository connected to Vercel
- [ ] All environment variables set
- [ ] Variables applied to all environments
- [ ] First deployment successful
- [ ] Production URL working
- [ ] Build logs show no errors
- [ ] Custom domain configured (if applicable)
- [ ] Preview deployments enabled (optional)

---

## 🎉 Success Indicators

✅ **Deployment successful:**
- Build completes without errors
- Production URL is accessible
- Homepage loads correctly

✅ **Environment variables:**
- All `NEXT_PUBLIC_*` variables set
- API URL points to Edge Functions
- No "undefined" values in logs

✅ **App functionality:**
- Pages load without errors
- API calls work
- Authentication flow works

---

## 📝 Important Notes

### Environment Variable Naming:
- **Frontend:** Must use `NEXT_PUBLIC_` prefix
- **Backend:** No prefix needed (only used in Edge Functions)
- **Secrets:** Never commit `.env.local` to git

### Vercel Limits (Free Tier):
- 100GB bandwidth/month
- 100 builds/day
- Serverless functions: 10s timeout (Hobby)
- Edge Functions: Unlimited

### Build Optimization:
- Vercel auto-optimizes Next.js builds
- Static pages are pre-rendered
- API routes run as serverless functions

---

## 🚀 Next Step

Once frontend is deployed:
→ Move to **TODO 4: Verify All Features Working**

---

## 🔧 Quick Commands Reference

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from CLI (alternative to GitHub)
vercel

# Deploy to production
vercel --prod

# Check deployment status
vercel ls

# View deployment logs
vercel logs [deployment-url]
```

---

## 📊 Deployment Checklist

Before deploying:
- [ ] All environment variables documented
- [ ] Build succeeds locally (`npm run build`)
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] `.env.local` is in `.gitignore`
- [ ] All secrets removed from code

After deploying:
- [ ] Production URL accessible
- [ ] All pages load
- [ ] API endpoints respond
- [ ] Authentication works
- [ ] No console errors

---

**Status:** Configure Vercel, set all environment variables, and deploy! 🎯

