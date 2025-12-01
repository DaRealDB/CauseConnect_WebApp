# 🚀 Complete Edge Functions Deployment Guide

## Overview

This guide will help you deploy ALL 87 Edge Functions to Supabase and get your app running in production.

---

## 📋 Prerequisites

Before starting, ensure you have:

1. ✅ Supabase project created
2. ✅ Database migrations run (see `HOW_TO_RUN_MIGRATIONS.md`)
3. ✅ Supabase CLI installed (`npm install -g supabase`)
4. ✅ Supabase account logged in

---

## 🔧 Step 1: Install & Setup Supabase CLI

### Install CLI

```bash
npm install -g supabase
```

### Login to Supabase

```bash
supabase login
```

This will open a browser window for authentication.

### Link Your Project

```bash
# Get your project reference ID from Supabase Dashboard → Settings → General
# It looks like: abcdefghijklmnop

supabase link --project-ref your-project-ref
```

When prompted, select:
- **Database Password:** Enter your Supabase database password
- **Linked to:** Should show your project name

---

## 📦 Step 2: Deploy All Edge Functions

### Option A: Deploy Individual Functions (Recommended for Testing)

Deploy functions one by one to test each:

```bash
cd /home/daryld.bacusmo/Documents/Programming/CauseConnect_WebApp

# Core Functions
supabase functions deploy health
supabase functions deploy auth-login
supabase functions deploy auth-register
supabase functions deploy auth-me
supabase functions deploy auth-refresh
supabase functions deploy auth-logout
supabase functions deploy auth-send-verification
supabase functions deploy auth-verify-email
supabase functions deploy auth-forgot-password
supabase functions deploy auth-verify-reset
supabase functions deploy auth-reset-password

# User Functions
supabase functions deploy user-profile
supabase functions deploy user-search
supabase functions deploy user-update
supabase functions deploy user-follow
supabase functions deploy user-activity

# Event Functions
supabase functions deploy event-list
supabase functions deploy event-detail
supabase functions deploy event-create
supabase functions deploy event-update
supabase functions deploy event-delete
supabase functions deploy event-support
supabase functions deploy event-unsupport
supabase functions deploy event-bookmark
supabase functions deploy event-unbookmark
supabase functions deploy event-bookmarked

# Post Functions
supabase functions deploy post-list
supabase functions deploy post-detail
supabase functions deploy post-create
supabase functions deploy post-like
supabase functions deploy post-bookmark
supabase functions deploy post-participate

# Comment Functions
supabase functions deploy comment-list
supabase functions deploy comment-create
supabase functions deploy comment-like
supabase functions deploy comment-award
supabase functions deploy comment-save

# Donation Functions
supabase functions deploy donation-create
supabase functions deploy donation-list
supabase functions deploy donation-history

# Settings Functions
supabase functions deploy settings-get
supabase functions deploy settings-update

# Notification Functions
supabase functions deploy notification-list
supabase functions deploy notification-unread-count
supabase functions deploy notification-read
supabase functions deploy notification-read-all

# Squad Functions
supabase functions deploy squad-list
supabase functions deploy squad-detail
supabase functions deploy squad-create
supabase functions deploy squad-join
supabase functions deploy squad-leave
supabase functions deploy squad-update
supabase functions deploy squad-delete
supabase functions deploy squad-search
supabase functions deploy squad-members
supabase functions deploy squad-posts
supabase functions deploy squad-post-create

# Storage Functions
supabase functions deploy storage-upload

# Tag & Explore Functions
supabase functions deploy tag-list
supabase functions deploy explore-content

# Chat Functions
supabase functions deploy chat-user-profile

# System Functions
supabase functions deploy health
```

### Option B: Batch Deploy Script

Create a script to deploy all at once:

```bash
# Create deploy-all.sh
cat > deploy-all-functions.sh << 'EOF'
#!/bin/bash

# List of all functions to deploy
FUNCTIONS=(
  "health"
  "auth-login" "auth-register" "auth-me" "auth-refresh" "auth-logout"
  "auth-send-verification" "auth-verify-email" "auth-forgot-password"
  "auth-verify-reset" "auth-reset-password"
  "user-profile" "user-search" "user-update" "user-follow" "user-activity"
  "event-list" "event-detail" "event-create" "event-update" "event-delete"
  "event-support" "event-unsupport" "event-bookmark" "event-unbookmark" "event-bookmarked"
  "post-list" "post-detail" "post-create" "post-like" "post-bookmark" "post-participate"
  "comment-list" "comment-create" "comment-like" "comment-award" "comment-save"
  "donation-create" "donation-list" "donation-history"
  "settings-get" "settings-update"
  "notification-list" "notification-unread-count" "notification-read" "notification-read-all"
  "squad-list" "squad-detail" "squad-create" "squad-join" "squad-leave"
  "squad-update" "squad-delete" "squad-search" "squad-members"
  "squad-posts" "squad-post-create"
  "storage-upload"
  "tag-list" "explore-content"
  "chat-user-profile"
)

# Deploy each function
for func in "${FUNCTIONS[@]}"; do
  echo "Deploying $func..."
  supabase functions deploy "$func"
  if [ $? -eq 0 ]; then
    echo "✅ $func deployed successfully"
  else
    echo "❌ Failed to deploy $func"
    exit 1
  fi
done

echo "🎉 All functions deployed!"
EOF

chmod +x deploy-all-functions.sh
./deploy-all-functions.sh
```

---

## 🔍 Step 3: Verify Deployments

### Check in Supabase Dashboard

1. Go to **Supabase Dashboard** → **Edge Functions**
2. You should see all functions listed
3. Click on any function to see:
   - Deployment status
   - Logs
   - Metrics

### Test a Function

```bash
# Test health endpoint
curl https://your-project.supabase.co/functions/v1/health

# Should return:
# {"status":"ok","timestamp":"..."}
```

---

## ⚙️ Step 4: Set Environment Variables

Edge Functions need environment variables. Set them in Supabase:

1. Go to **Supabase Dashboard** → **Project Settings** → **Edge Functions**
2. Or use CLI:

```bash
# Set database URL (automatically available, but verify)
supabase secrets list

# Set custom secrets if needed
supabase secrets set CUSTOM_SECRET=value
```

**Important:** These secrets are available to all Edge Functions.

---

## 🗄️ Step 5: Verify Database Schema

Make sure all tables exist. Run this in **Supabase Dashboard** → **SQL Editor**:

```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see all tables from your Prisma schema.

---

## 📝 Step 6: Update Frontend Environment Variables

In **Vercel Dashboard** → **Settings** → **Environment Variables**, ensure:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
NEXT_PUBLIC_API_URL=https://xxxxx.supabase.co/functions/v1
```

**After updating, redeploy Vercel!**

---

## ✅ Step 7: Test Everything

### Test Authentication Flow

1. Go to your Vercel site
2. Try to register a new user
3. Check browser console for errors
4. Check Supabase Edge Function logs

### Test API Calls

Open browser console and check Network tab:
- All API calls should go to `*.supabase.co/functions/v1/*`
- No CORS errors
- Proper authentication headers

---

## 🐛 Troubleshooting

### Error: "Function not found"

**Solution:**
- Verify function name is correct
- Check function is deployed in Supabase Dashboard
- Wait a few minutes after deployment for propagation

### Error: "CORS error"

**Solution:**
- Check `_shared/cors.ts` is included in function
- Verify CORS headers are set correctly
- Check browser console for exact error

### Error: "Database connection failed"

**Solution:**
- Verify `DATABASE_URL` is set in Supabase secrets
- Check database is running in Supabase Dashboard
- Verify RLS policies are configured

### Error: "Authentication failed"

**Solution:**
- Check `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
- Verify token is being sent in requests
- Check Edge Function logs for auth errors

---

## 📊 Deployment Checklist

- [ ] Supabase CLI installed and logged in
- [ ] Project linked
- [ ] All Edge Functions created in codebase
- [ ] All functions deployed to Supabase
- [ ] Environment variables set in Vercel
- [ ] Database migrations run
- [ ] Storage buckets created (if using)
- [ ] Frontend redeployed after env var changes
- [ ] Test registration flow works
- [ ] Test login flow works
- [ ] Test key features work
- [ ] No errors in browser console
- [ ] Edge Function logs show successful requests

---

## 🎯 Next Steps

After all functions are deployed:

1. **Monitor Logs** - Check Edge Function logs regularly
2. **Set Up Email Service** - For verification codes (SendGrid, Resend)
3. **Set Up Storage** - Create buckets for file uploads
4. **Configure Payments** - Add Stripe/PayPal keys
5. **Performance Testing** - Test with real traffic
6. **Error Monitoring** - Set up error tracking

---

**You're ready to deploy! Follow the steps above to get everything running! 🚀**



