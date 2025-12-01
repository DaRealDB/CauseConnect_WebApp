# 🚀 QUICK START - Deploy CauseConnect in 10 Minutes

## ✅ Pre-Deployment Checklist

Before starting, ensure you have:
- [ ] Supabase account created
- [ ] Vercel account created  
- [ ] GitHub repository set up
- [ ] Stripe account (optional, for payments)
- [ ] Firebase account (optional, for chat)

---

## 📋 STEP 1: Set Up Supabase (5 min)

### 1.1 Create Supabase Project
1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in:
   - Name: `CauseConnect`
   - Database Password: (save this!)
   - Region: Choose closest to you
4. Click "Create new project"
5. Wait 2-3 minutes for project to initialize

### 1.2 Get Your Keys
Once project is ready:
1. Go to **Settings → API**
2. Copy these values:
   ```
   Project URL: https://xxxxx.supabase.co
   anon public key: eyJhbGc...
   service_role key: eyJhbGc...
   ```

3. Go to **Settings → Database**
4. Copy **Connection String (URI)**:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```

---

## 📋 STEP 2: Run Database Migrations (2 min)

### 2.1 Apply Schema
1. In Supabase Dashboard, go to **SQL Editor**
2. Click **New Query**
3. Open file: `supabase/migrations/001_initial_schema.sql`
4. Copy ALL contents
5. Paste into SQL Editor
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. ✅ Verify: You should see "Success. No rows returned"

### 2.2 Apply RLS Policies
1. Still in SQL Editor
2. Open file: `supabase/migrations/002_rls_policies.sql`
3. Copy ALL contents
4. Paste into SQL Editor
5. Click **Run**
6. ✅ Verify: "Success. No rows returned"

---

## 📋 STEP 3: Install Supabase CLI (1 min)

```bash
# Install Supabase CLI globally
npm install -g supabase

# Login to Supabase
supabase login

# Link your project (replace with your project reference ID)
supabase link --project-ref your-project-ref-id
```

**To find your project ref:**
- In Supabase Dashboard, check URL: `https://supabase.com/dashboard/project/xxxxx`
- The `xxxxx` is your project ref

---

## 📋 STEP 4: Set Edge Function Secrets (2 min)

```bash
# Set required secrets
supabase secrets set DATABASE_URL="postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres"
supabase secrets set SUPABASE_URL="https://xxxxx.supabase.co"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
supabase secrets set JWT_SECRET="your-random-jwt-secret-here"

# Optional: Stripe (if using payments)
supabase secrets set STRIPE_SECRET_KEY="sk_test_xxxxx"
```

**Generate a random JWT secret:**
```bash
openssl rand -base64 32
```

---

## 📋 STEP 5: Deploy Edge Functions (3 min)

```bash
# Make sure you're in project root
cd /home/daryld.bacusmo/Documents/Programming/CauseConnect_WebApp

# Make script executable
chmod +x deploy-all-functions.sh

# Deploy all 91 functions
bash deploy-all-functions.sh
```

**Alternative: Deploy by category**
```bash
# Deploy auth functions
cd supabase
supabase functions deploy auth-register --no-verify-jwt
supabase functions deploy auth-login --no-verify-jwt
# ... continue for all functions
```

**⚠️ Note:** Deployment may take 5-10 minutes for all 91 functions.

---

## 📋 STEP 6: Set Up Vercel (3 min)

### 6.1 Connect Repository
1. Go to https://vercel.com/dashboard
2. Click **Add New → Project**
3. Import your GitHub repository
4. Select `CauseConnect_WebApp`

### 6.2 Configure Build
- Framework Preset: **Next.js**
- Root Directory: `./`
- Build Command: `npm run build`
- Output Directory: `.next`

### 6.3 Add Environment Variables
Click **Environment Variables** and add:

#### Frontend Variables:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_API_URL=https://xxxxx.supabase.co/functions/v1
```

#### Firebase Variables (if using chat):
```
NEXT_PUBLIC_FIREBASE_API_KEY=your-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

#### Backend Variables (for Edge Functions):
```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-jwt-secret
```

**Apply to:** Production, Preview, Development

### 6.4 Deploy
1. Click **Deploy**
2. Wait for build to complete
3. ✅ Your app is live!

---

## 📋 STEP 7: Verify Deployment (2 min)

### 7.1 Test Edge Functions
```bash
# Test health endpoint
curl https://xxxxx.supabase.co/functions/v1/health

# Should return: {"status":"ok"}
```

### 7.2 Test Frontend
1. Open your Vercel deployment URL
2. Try to:
   - Register a new account
   - Login
   - Create an event
   - Create a post

### 7.3 Check Logs
- **Vercel:** Dashboard → Deployments → View Function Logs
- **Supabase:** Dashboard → Edge Functions → View Logs

---

## 🔧 Troubleshooting

### Edge Functions Not Deploying
```bash
# Re-link project
supabase link --project-ref your-project-ref

# Check secrets
supabase secrets list

# Try deploying one function manually
supabase functions deploy health --no-verify-jwt
```

### Database Connection Errors
- Verify `DATABASE_URL` format is correct
- Check password doesn't have special characters (use URL encoding)
- Ensure database is accessible

### Frontend Build Errors
- Check all environment variables are set in Vercel
- Verify `NEXT_PUBLIC_*` variables are set
- Check build logs for specific errors

### "Failed to fetch" Errors
- Verify Edge Functions are deployed
- Check CORS headers in function code
- Verify `NEXT_PUBLIC_API_URL` is correct

---

## ✅ Success Indicators

Your deployment is successful when:
- ✅ All 91 Edge Functions show "Active" in Supabase Dashboard
- ✅ Vercel deployment completes without errors
- ✅ Homepage loads without errors
- ✅ Registration form works
- ✅ Login works
- ✅ You can create events/posts

---

## 📚 Next Steps

1. **Enable Storage** (for images):
   - Supabase Dashboard → Storage
   - Create buckets: `avatars`, `event-images`, `post-images`

2. **Set Up Custom Domain** (optional):
   - Vercel Dashboard → Settings → Domains
   - Add your domain

3. **Configure Email** (for auth):
   - Supabase Dashboard → Authentication → Email Templates
   - Customize templates

4. **Monitor Usage**:
   - Supabase Dashboard → Usage
   - Vercel Dashboard → Analytics

---

## 🎉 You're Done!

Your CauseConnect app is now live on:
- **Frontend:** `https://your-app.vercel.app`
- **Backend:** `https://xxxxx.supabase.co/functions/v1`
- **Database:** Supabase PostgreSQL

**All 91 Edge Functions are deployed and ready!** 🚀

---

## 📞 Need Help?

- **Supabase Docs:** https://supabase.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **Edge Functions Docs:** https://supabase.com/docs/guides/functions

---

**Total Deployment Time: ~10 minutes** ⚡



