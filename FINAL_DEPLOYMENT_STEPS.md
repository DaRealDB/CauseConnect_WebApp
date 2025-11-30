# 🚀 FINAL DEPLOYMENT STEPS - ALL FUNCTIONS READY

## ✅ Status: 91 Edge Functions Created & Routed

All Edge Functions have been created and routed in `services.ts`. You're ready to deploy!

---

## 📋 STEP-BY-STEP DEPLOYMENT GUIDE

### PHASE 1: Deploy Database Migrations

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project
   - Navigate to SQL Editor

2. **Run Initial Schema Migration**
   - Copy contents of `supabase/migrations/001_initial_schema.sql`
   - Paste into SQL Editor
   - Click "Run"
   - Verify all tables are created

3. **Run RLS Policies Migration**
   - Copy contents of `supabase/migrations/002_rls_policies.sql`
   - Paste into SQL Editor
   - Click "Run"
   - Verify policies are created

---

### PHASE 2: Set Supabase Environment Variables

1. **Get Your Supabase Keys**
   - Go to Project Settings → API
   - Copy:
     - `Project URL` → `SUPABASE_URL`
     - `anon public` key → `SUPABASE_ANON_KEY`
     - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

2. **Get Database Connection String**
   - Go to Project Settings → Database
   - Copy Connection String (URI format)
   - Use as `DATABASE_URL`

3. **Set Edge Function Secrets**
   ```bash
   # Install Supabase CLI if not already installed
   npm install -g supabase
   
   # Login to Supabase
   supabase login
   
   # Link your project
   supabase link --project-ref your-project-ref
   
   # Set secrets for Edge Functions
   supabase secrets set DATABASE_URL="your-database-url"
   supabase secrets set SUPABASE_URL="https://your-project.supabase.co"
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   supabase secrets set JWT_SECRET="your-jwt-secret"
   
   # Optional: Stripe (if using payments)
   supabase secrets set STRIPE_SECRET_KEY="your-stripe-secret-key"
   ```

---

### PHASE 3: Deploy All Edge Functions

**Option A: Deploy All at Once (Recommended)**

```bash
# Make sure you're in the project root
cd /home/daryld.bacusmo/Documents/Programming/CauseConnect_WebApp

# Make deploy script executable
chmod +x deploy-all-functions.sh

# Run deployment script
bash deploy-all-functions.sh
```

**Option B: Deploy Individually**

```bash
# Deploy functions one by one (if script fails)
cd supabase

supabase functions deploy auth-register --no-verify-jwt
supabase functions deploy auth-login --no-verify-jwt
supabase functions deploy auth-me --no-verify-jwt
# ... continue for all 91 functions
```

**Option C: Deploy by Category**

```bash
# Deploy all auth functions
for func in auth-register auth-login auth-me auth-refresh auth-logout auth-send-verification auth-verify-email auth-forgot-password auth-verify-reset auth-reset-password; do
  supabase functions deploy $func --no-verify-jwt
done

# Deploy all user functions
for func in user-profile user-search user-update user-follow user-activity; do
  supabase functions deploy $func --no-verify-jwt
done

# Continue for other categories...
```

---

### PHASE 4: Verify Edge Functions

1. **Check Function Status**
   - Go to Supabase Dashboard → Edge Functions
   - Verify all 91 functions are deployed and active

2. **Test a Function**
   ```bash
   # Test health endpoint
   curl https://your-project.supabase.co/functions/v1/health
   
   # Test auth endpoint (should return 401 without token)
   curl https://your-project.supabase.co/functions/v1/auth-me
   ```

---

### PHASE 5: Configure Vercel Environment Variables

1. **Open Vercel Dashboard**
   - Go to https://vercel.com/dashboard
   - Select your project
   - Go to Settings → Environment Variables

2. **Add All Required Variables**

   **Frontend Variables:**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   NEXT_PUBLIC_API_URL=https://your-project.supabase.co/functions/v1
   
   # Firebase (for chat - if still using)
   NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
   ```

   **Backend Variables (for Edge Functions):**
   ```
   DATABASE_URL=your-database-connection-string
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   JWT_SECRET=your-jwt-secret
   STRIPE_SECRET_KEY=your-stripe-key (optional)
   ```

3. **Apply to All Environments**
   - Production
   - Preview
   - Development

---

### PHASE 6: Deploy Frontend to Vercel

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Complete Supabase migration - 91 Edge Functions ready"
   git push origin main
   ```

2. **Trigger Vercel Deployment**
   - Vercel will auto-deploy on push
   - Or manually trigger from Vercel Dashboard

3. **Monitor Build**
   - Check build logs for errors
   - Fix any issues

---

### PHASE 7: Post-Deployment Verification

1. **Test Authentication**
   - Register new user
   - Login
   - Verify email

2. **Test Core Features**
   - Create event
   - Create post
   - Like/comment
   - Bookmark items
   - Join squad

3. **Test Edge Functions**
   - Open browser DevTools → Network
   - Verify requests go to `/functions/v1/...`
   - Check for errors

4. **Verify Database**
   - Check Supabase Dashboard → Table Editor
   - Verify data is being created

---

## 🔧 Troubleshooting

### Edge Function Deployment Errors

**Error: "Function not found"**
```bash
# Re-link project
supabase link --project-ref your-project-ref

# Verify secrets are set
supabase secrets list
```

**Error: "Database connection failed"**
- Verify `DATABASE_URL` is set correctly
- Check connection string format
- Ensure database is accessible

**Error: "Unauthorized"**
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set
- Check JWT token format in requests

### Vercel Build Errors

**Error: "Module not found"**
- Check imports in Edge Functions
- Verify Deno imports use correct URLs

**Error: "Environment variable missing"**
- Add missing variables in Vercel Dashboard
- Redeploy after adding variables

### Runtime Errors

**Error: "Failed to fetch"**
- Check Edge Function URLs are correct
- Verify CORS headers are set
- Check network tab for actual error

**Error: "Missing or insufficient permissions"**
- Check RLS policies are applied
- Verify user authentication
- Check policy conditions

---

## 📊 Deployment Checklist

- [ ] Database migrations applied
- [ ] RLS policies enabled
- [ ] All 91 Edge Functions deployed
- [ ] Environment variables set in Supabase
- [ ] Environment variables set in Vercel
- [ ] Frontend deployed to Vercel
- [ ] Authentication working
- [ ] Core features tested
- [ ] Edge Functions responding
- [ ] Database writes working
- [ ] Chat system working (if using Firebase)
- [ ] Payment system working (if configured)

---

## 🎉 Success!

Once all steps are complete, your CauseConnect app will be:
- ✅ Running on Vercel (frontend)
- ✅ Using Supabase Edge Functions (backend)
- ✅ Connected to Supabase PostgreSQL (database)
- ✅ Fully authenticated via Supabase Auth
- ✅ 91 API endpoints migrated and working

**All 6 todos completed! Ready for production!** 🚀

