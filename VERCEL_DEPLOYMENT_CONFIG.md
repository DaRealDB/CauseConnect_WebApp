# 🚀 Vercel Deployment Configuration

## Overview

This guide covers deploying the Next.js frontend to Vercel with Supabase backend.

---

## 📋 Pre-Deployment Setup

### 1. Prepare Build
```bash
# Test build locally first
npm run build

# Fix any build errors
# Check for:
# - Missing environment variables
# - Import errors
# - Type errors
```

### 2. Create `vercel.json` (if needed)

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key",
    "NEXT_PUBLIC_FIREBASE_API_KEY": "@firebase-api-key",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN": "@firebase-auth-domain",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID": "@firebase-project-id",
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET": "@firebase-storage-bucket",
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID": "@firebase-messaging-sender-id",
    "NEXT_PUBLIC_FIREBASE_APP_ID": "@firebase-app-id"
  }
}
```

---

## 🔧 Vercel Configuration

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### Step 2: Connect to Vercel

1. Go to https://vercel.com
2. Click **"New Project"**
3. Import your GitHub repository
4. Configure project settings

### Step 3: Set Environment Variables

In Vercel Dashboard → Project Settings → Environment Variables:

#### Required Variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... (only for server-side)

# Firebase (if using for chat)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxxxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxxxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxxxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:xxxxx

# Optional - API URL (set to Supabase Edge Functions)
NEXT_PUBLIC_API_URL=https://xxxxx.supabase.co/functions/v1
```

### Step 4: Build Settings

- **Framework Preset:** Next.js
- **Root Directory:** `./` (or leave default)
- **Build Command:** `npm run build`
- **Output Directory:** `.next` (auto-detected)
- **Install Command:** `npm install`

### Step 5: Deploy

1. Click **"Deploy"**
2. Wait for build to complete
3. Check build logs for errors
4. Fix any issues and redeploy

---

## 🔍 Post-Deployment Verification

### 1. Test Homepage
- [ ] Site loads
- [ ] No console errors
- [ ] Images load

### 2. Test Authentication
- [ ] Can access login page
- [ ] Can register new user
- [ ] Can login
- [ ] Token stored correctly

### 3. Test Features
- [ ] Can view feed
- [ ] Can view events
- [ ] Can view profiles
- [ ] Can interact with content

### 4. Test API Calls
- [ ] Edge Functions respond
- [ ] No CORS errors
- [ ] Authentication works
- [ ] Errors handled gracefully

---

## 🐛 Common Build Issues

### Issue: Build fails with module errors

**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
npm run build
```

### Issue: Environment variables not found

**Solution:**
- Verify variables are set in Vercel Dashboard
- Check variable names match code (case-sensitive)
- Ensure `NEXT_PUBLIC_` prefix for client-side vars

### Issue: Supabase connection errors

**Solution:**
- Verify Supabase URL is correct
- Check API keys are valid
- Verify Edge Functions are deployed
- Check CORS settings

### Issue: Image uploads fail

**Solution:**
- Verify storage buckets created
- Check storage policies
- Verify file size limits
- Check MIME type restrictions

---

## 📊 Performance Optimization

### Next.js Config
```javascript
// next.config.mjs
export default {
  // Enable image optimization
  images: {
    domains: ['xxxxx.supabase.co'],
  },
  // Optimize bundle
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js'],
  },
}
```

### Edge Function Optimization
- Use connection pooling
- Cache frequently accessed data
- Minimize database queries
- Use indexes efficiently

---

## 🔒 Security Checklist

- [ ] Environment variables not exposed in client code
- [ ] Service role key only in server-side
- [ ] CORS configured correctly
- [ ] RLS policies enabled
- [ ] Input validation on all endpoints
- [ ] File upload size limits set
- [ ] Rate limiting configured (future)

---

## 📝 Monitoring

### Vercel Analytics
- Enable Vercel Analytics
- Monitor page performance
- Track errors

### Supabase Monitoring
- Monitor Edge Function logs
- Track database performance
- Monitor storage usage

---

## ✅ Deployment Checklist

### Before Deployment
- [ ] All tests passing
- [ ] Build succeeds locally
- [ ] Environment variables documented
- [ ] Edge Functions deployed

### During Deployment
- [ ] Push to GitHub
- [ ] Connect to Vercel
- [ ] Set environment variables
- [ ] Trigger deployment

### After Deployment
- [ ] Verify site loads
- [ ] Test key features
- [ ] Check error logs
- [ ] Monitor performance

---

**Ready to deploy to Vercel! Follow the steps above! 🚀**




