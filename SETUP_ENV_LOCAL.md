# 🔐 How to Set Up .env.local with Supabase Keys

## 📋 Step-by-Step Guide

### Step 1: Get Your Supabase Keys

1. **Go to your Supabase Dashboard:**
   - Visit: https://app.supabase.com
   - Log in and select your project (or create a new one)

2. **Get API Keys:**
   - Click **Settings** (gear icon in left sidebar)
   - Click **API**
   - You'll see three important sections:

#### Section 1: Project URL
- Copy the **Project URL** (looks like: `https://xxxxx.supabase.co`)
- This goes to: `NEXT_PUBLIC_SUPABASE_URL`

#### Section 2: Project API keys
- **`anon` `public` key**: This is safe to use in frontend
  - Copy this entire key (starts with `eyJhbGci...`)
  - This goes to: `NEXT_PUBLIC_SUPABASE_ANON_KEY`

- **`service_role` `secret` key**: ⚠️ **NEVER expose this in frontend!**
  - Copy this entire key
  - This goes to: `SUPABASE_SERVICE_ROLE_KEY`
  - Only use in server-side code or Edge Functions

3. **Get Database Connection String:**
   - Still in Settings, click **Database**
   - Scroll to **Connection string**
   - Select **URI** tab
   - Copy the connection string
   - It looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres`
   - This goes to: `DATABASE_URL`
   - ⚠️ **Replace `[YOUR-PASSWORD]` with your actual database password!**

---

### Step 2: Create .env.local File

1. **In your project root directory**, create a file named `.env.local`

   ```bash
   # From project root
   touch .env.local
   ```

2. **Open `.env.local` in your editor**

---

### Step 3: Add Supabase Keys

Copy and paste this template, then replace with your actual values:

```env
# ============================================
# SUPABASE CONFIGURATION
# ============================================

# Supabase Project URL (from Settings → API → Project URL)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co

# Supabase Anon/Public Key (from Settings → API → anon public)
# This is safe to use in frontend/browser
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODk4NzY1NDMsImV4cCI6MjAwNTQ1MjU0M30.xxxxx

# Supabase Service Role Key (from Settings → API → service_role secret)
# ⚠️ SECRET: Never expose this in frontend! Only use server-side.
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY4OTg3NjU0MywiZXhwIjoyMDA1NDUyNTQzfQ.xxxxx

# Database Connection String (from Settings → Database → Connection string → URI)
# Replace [YOUR-PASSWORD] with your actual database password
DATABASE_URL=postgresql://postgres:YOUR_ACTUAL_PASSWORD@db.xxxxx.supabase.co:5432/postgres

# ============================================
# EXISTING CONFIGURATION (Keep your existing values)
# ============================================

# Firebase Configuration (for chat - keep if using Firebase)
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:xxxxx

# API URL (optional - set to Supabase Edge Functions URL if using Supabase)
# NEXT_PUBLIC_API_URL=https://xxxxx.supabase.co/functions/v1

# JWT Secret (if still using JWT auth alongside Supabase)
# JWT_SECRET=your-jwt-secret-here
```

---

### Step 4: Replace Placeholder Values

**Replace these placeholders with your actual values:**

1. `https://xxxxx.supabase.co` → Your actual Project URL
2. `eyJhbGci...` (anon key) → Your actual anon/public key
3. `eyJhbGci...` (service_role key) → Your actual service_role key
4. `YOUR_ACTUAL_PASSWORD` → Your Supabase database password
5. `xxxxx.supabase.co` (in DATABASE_URL) → Your actual project domain

---

### Step 5: Verify Your .env.local File

Your final `.env.local` should look something like this:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY4OTg3NjU0MywiZXhwIjoyMDA1NDUyNTQzfQ.abc123def456ghi789
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjg5ODc2NTQzLCJleHAiOjIwMDU0NTI1NDN9.xyz789abc123def456
DATABASE_URL=postgresql://postgres:MySecurePassword123@db.abcdefghijklmnop.supabase.co:5432/postgres

# Firebase (keep existing)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:xxxxx
```

---

### Step 6: Restart Your Development Server

After creating/updating `.env.local`:

```bash
# Stop your current dev server (Ctrl+C)

# Restart Next.js dev server
npm run dev

# Or if using a different command:
# yarn dev
# pnpm dev
```

**Important:** Environment variables are loaded when the server starts. You must restart after changing `.env.local`.

---

## 🔒 Security Checklist

- [ ] `.env.local` is in `.gitignore` (should NOT be committed to Git)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is NEVER used in frontend code
- [ ] Only `NEXT_PUBLIC_*` variables are used in browser/client code
- [ ] You haven't shared your keys publicly
- [ ] Database password is strong and secure

---

## ✅ Verify It's Working

Test your configuration:

1. **Check environment variables are loaded:**
   ```typescript
   // In any Next.js file (client or server)
   console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
   // Should log your Supabase URL
   ```

2. **Test Supabase connection:**
   ```typescript
   // In a client component or API route
   import { createClient } from '@supabase/supabase-js'
   
   const supabase = createClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL!,
     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
   )
   
   // Test connection
   const { data, error } = await supabase.from('users').select('count')
   console.log('Connection test:', error ? error : 'Success!')
   ```

---

## 🆘 Troubleshooting

### Problem: "Environment variable not found"

**Solution:**
- Make sure the variable name starts with `NEXT_PUBLIC_` for client-side use
- Restart your dev server after changing `.env.local`
- Check for typos in variable names
- Make sure `.env.local` is in the project root (same folder as `package.json`)

### Problem: "Invalid API key"

**Solution:**
- Double-check you copied the entire key (they're very long)
- Make sure there are no extra spaces or newlines
- Verify you're using the correct key type (anon vs service_role)

### Problem: "Database connection failed"

**Solution:**
- Make sure you replaced `[YOUR-PASSWORD]` with actual password
- Check that the password doesn't contain special characters that need URL encoding
- Verify the connection string format is correct
- Make sure your Supabase project is active (not paused)

### Problem: "Can't find .env.local"

**Solution:**
- Make sure the file is named exactly `.env.local` (with the dot at the start)
- Make sure it's in the project root directory
- Check if your editor is hiding dot-files (you may need to enable showing hidden files)

---

## 📝 Quick Reference

### Where to Find Each Key:

| Variable | Location in Supabase Dashboard |
|----------|-------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Settings → API → Project API keys → `anon` `public` |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API → Project API keys → `service_role` `secret` |
| `DATABASE_URL` | Settings → Database → Connection string → URI |

---

## 🎯 Next Steps

After setting up `.env.local`:

1. ✅ Restart your dev server
2. ✅ Test the connection (see "Verify It's Working" above)
3. ✅ Deploy Edge Functions (see `READY_TO_DEPLOY.md`)
4. ✅ Test your app with Supabase

---

**Need help?** Check:
- `QUICK_START_SUPABASE.md` - Quick setup guide
- `READY_TO_DEPLOY.md` - Full deployment guide
- `HOW_TO_RUN_MIGRATIONS.md` - Database setup


