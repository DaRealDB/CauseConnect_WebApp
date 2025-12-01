# ✅ TODO 2: Deploy All 91 Edge Functions to Supabase

## 📋 Complete Step-by-Step Guide

### Prerequisites
- ✅ TODO 1 completed (Supabase project set up)
- ✅ Have Supabase credentials saved
- ✅ Have Supabase CLI installed (or ready to install)

---

### Phase 1: Install Supabase CLI (2 minutes)

#### Step 1.1: Install CLI
```bash
# Using npm (recommended)
npm install -g supabase

# Or using Homebrew (Mac)
brew install supabase/tap/supabase

# Or using Scoop (Windows)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

#### Step 1.2: Verify Installation
```bash
supabase --version
# Should show version number like: supabase 1.x.x
```

#### Step 1.3: Login to Supabase
```bash
supabase login
```
- This will open your browser
- Sign in with your Supabase account
- ✅ You'll see "Logged in as [your-email]"

---

### Phase 2: Link Your Project (2 minutes)

#### Step 2.1: Get Your Project Reference ID
1. Go to Supabase Dashboard
2. Click on your project
3. Go to **Settings → General**
4. Copy the **Reference ID** (looks like: `abcdefghijklmnop`)

#### Step 2.2: Link Project
```bash
# Navigate to your project directory
cd /home/daryld.bacusmo/Documents/Programming/CauseConnect_WebApp

# Link your project
supabase link --project-ref YOUR_PROJECT_REF_ID
```

You'll be prompted for:
- Database password: [Enter your database password]
- ✅ Success: "Linked to project [your-project-name]"

---

### Phase 3: Set Edge Function Secrets (3 minutes)

Edge Functions need these environment variables:

```bash
# Set secrets one by one
supabase secrets set DATABASE_URL="postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres"
supabase secrets set SUPABASE_URL="https://xxxxx.supabase.co"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
supabase secrets set JWT_SECRET="your-random-jwt-secret-here"

# Optional: Stripe (if using payments)
supabase secrets set STRIPE_SECRET_KEY="sk_test_xxxxx"
```

**To generate a random JWT secret:**
```bash
# Generate secure random secret
openssl rand -base64 32
# Copy the output and use it for JWT_SECRET
```

**Verify secrets are set:**
```bash
supabase secrets list
# Should show all the secrets you just set
```

---

### Phase 4: Deploy All 91 Edge Functions (15-20 minutes)

#### Option A: Deploy All at Once (Recommended)

```bash
# Make sure you're in project root
cd /home/daryld.bacusmo/Documents/Programming/CauseConnect_WebApp

# Make deployment script executable
chmod +x deploy-all-functions.sh

# Deploy all functions
bash deploy-all-functions.sh
```

This will:
- ✅ Deploy all 91 functions automatically
- ✅ Show progress for each function
- ✅ Report any failures
- ⏱️ Takes 15-20 minutes total

#### Option B: Deploy by Category (More Control)

**Deploy Auth Functions:**
```bash
cd supabase

# Auth functions (11 total)
supabase functions deploy auth-register --no-verify-jwt
supabase functions deploy auth-login --no-verify-jwt
supabase functions deploy auth-me --no-verify-jwt
supabase functions deploy auth-refresh --no-verify-jwt
supabase functions deploy auth-logout --no-verify-jwt
supabase functions deploy auth-send-verification --no-verify-jwt
supabase functions deploy auth-verify-email --no-verify-jwt
supabase functions deploy auth-forgot-password --no-verify-jwt
supabase functions deploy auth-verify-reset --no-verify-jwt
supabase functions deploy auth-reset-password --no-verify-jwt
```

**Deploy User Functions:**
```bash
supabase functions deploy user-profile --no-verify-jwt
supabase functions deploy user-search --no-verify-jwt
supabase functions deploy user-update --no-verify-jwt
supabase functions deploy user-follow --no-verify-jwt
supabase functions deploy user-activity --no-verify-jwt
```

**Continue for all 91 functions...** (See complete list in deployment script)

#### Option C: Deploy Single Function (For Testing)

```bash
# Test with health endpoint first
supabase functions deploy health --no-verify-jwt

# Verify it works
curl https://YOUR_PROJECT_REF.supabase.co/functions/v1/health
# Should return: {"status":"ok"}
```

---

### Phase 5: Verify Deployment (5 minutes)

#### Step 5.1: Check in Supabase Dashboard
1. Go to **Edge Functions** in Supabase Dashboard
2. You should see all 91 functions listed
3. Each should show:
   - ✅ Status: Active
   - ✅ Version number
   - ✅ Last deployed timestamp

#### Step 5.2: Test Health Endpoint
```bash
curl https://YOUR_PROJECT_REF.supabase.co/functions/v1/health
# Expected: {"status":"ok"}
```

#### Step 5.3: Test Auth Endpoint (Should require auth)
```bash
curl https://YOUR_PROJECT_REF.supabase.co/functions/v1/auth-me
# Expected: {"message":"Unauthorized"} (401) - This is correct!
```

#### Step 5.4: Check Function Logs
1. Go to **Edge Functions** → Select a function
2. Click **"Logs"** tab
3. Should show deployment logs (no errors)

---

### Phase 6: Handle Deployment Errors (If Any)

#### Common Issues:

**Error: "Function not found"**
```bash
# Re-link project
supabase link --project-ref YOUR_PROJECT_REF_ID

# Try deploying again
supabase functions deploy FUNCTION_NAME --no-verify-jwt
```

**Error: "Missing secrets"**
```bash
# Check secrets are set
supabase secrets list

# Set missing secrets
supabase secrets set MISSING_SECRET="value"
```

**Error: "Permission denied"**
- Make sure you're logged in: `supabase login`
- Verify project is linked: Check `.supabase/config.toml`

**Error: "Deployment timeout"**
- Some functions are large and take time
- Wait 2-3 minutes and check dashboard
- If still failing, deploy individually

**Error: "Invalid function code"**
- Check function has proper imports
- Verify Deno syntax is correct
- Check function folder structure

---

## ✅ Completion Checklist

- [ ] Supabase CLI installed
- [ ] Logged into Supabase CLI
- [ ] Project linked successfully
- [ ] All secrets set (DATABASE_URL, SUPABASE_URL, etc.)
- [ ] All 91 Edge Functions deployed
- [ ] Health endpoint working
- [ ] Functions show as "Active" in dashboard
- [ ] No deployment errors in logs
- [ ] Ready to configure frontend

---

## 📊 Function Deployment List

### Total: 91 Functions

**Categories:**
- Authentication: 11 functions
- Users: 5 functions
- Events: 12 functions
- Posts: 11 functions
- Comments: 5 functions
- Donations: 3 functions
- Payments: 6 functions
- Notifications: 4 functions
- Settings: 9 functions
- Squads: 15 functions
- Custom Feeds: 5 functions
- Chat: 3 functions
- Explore & Tags: 2 functions

See `deploy-all-functions.sh` for complete list.

---

## 🎉 Success Indicators

✅ **All functions deployed:**
- Dashboard shows 91 functions
- All show "Active" status
- No errors in deployment logs

✅ **Functions responding:**
- Health endpoint returns success
- Auth endpoints require authentication (401 is correct)
- No 404 errors

✅ **Ready for next step:**
- Backend API is ready
- Edge Functions are live
- Ready to deploy frontend

---

## 📝 Important Notes

- **Deployment Time:** Expect 15-20 minutes for all functions
- **Rate Limits:** Free tier has deployment limits (should be fine)
- **Function Size:** Each function is limited to 50MB
- **Cold Starts:** First request may be slow (500ms-2s)
- **Logs:** Check function logs if issues occur

---

## 🚀 Next Step

Once all functions are deployed:
→ Move to **TODO 3: Configure Vercel & Deploy Frontend**

---

## 🔧 Quick Commands Reference

```bash
# Login
supabase login

# Link project
supabase link --project-ref PROJECT_REF

# Set secrets
supabase secrets set KEY="value"

# List secrets
supabase secrets list

# Deploy function
supabase functions deploy FUNCTION_NAME --no-verify-jwt

# Deploy all (using script)
bash deploy-all-functions.sh

# Check functions
supabase functions list

# View logs
supabase functions logs FUNCTION_NAME
```

---

**Status:** Deploy all 91 functions, then verify they're working! 🎯


