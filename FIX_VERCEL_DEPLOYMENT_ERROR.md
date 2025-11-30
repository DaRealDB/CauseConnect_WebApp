# 🔧 Fix "Failed to Fetch" Error in Vercel

## Problem

After deploying to Vercel, you're seeing "Failed to fetch" error when trying to send verification code.

## Root Causes

1. **Missing Edge Functions** - Verification functions not deployed
2. **Wrong API URL** - Environment variable not set correctly
3. **CORS Issues** - Edge Functions not allowing requests from Vercel domain
4. **Database Schema** - `verifications` table might not exist

---

## ✅ Solution Steps

### Step 1: Check Environment Variables in Vercel

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Verify these are set:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://xxxxx.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `eyJhbG...`
   - `NEXT_PUBLIC_API_URL` = `https://xxxxx.supabase.co/functions/v1`

3. **Important:** After adding/changing variables, you MUST **redeploy** for changes to take effect!

---

### Step 2: Deploy Missing Edge Functions

The verification functions need to be deployed:

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy the verification functions
supabase functions deploy auth-send-verification
supabase functions deploy auth-verify-email
```

**Or use Supabase Dashboard:**
1. Go to **Supabase Dashboard** → Your Project → **Edge Functions**
2. Create new function: `auth-send-verification`
3. Copy code from `supabase/functions/auth-send-verification/index.ts`
4. Create new function: `auth-verify-email`
5. Copy code from `supabase/functions/auth-verify-email/index.ts`
6. Deploy both functions

---

### Step 3: Verify Database Schema

Make sure the `verifications` table exists. Run this in **Supabase Dashboard** → **SQL Editor**:

```sql
-- Check if verifications table exists
SELECT * FROM information_schema.tables 
WHERE table_name = 'verifications';

-- If it doesn't exist, create it:
CREATE TABLE IF NOT EXISTS verifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'email_verification',
  verified BOOLEAN DEFAULT false,
  "expiresAt" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verifications_email ON verifications(email);
CREATE INDEX IF NOT EXISTS idx_verifications_type ON verifications(type);
```

---

### Step 4: Check CORS Configuration

The Edge Functions should already have CORS configured, but verify:

1. Go to **Supabase Dashboard** → **Edge Functions** → `auth-send-verification`
2. Check the function code includes CORS headers
3. The `_shared/cors.ts` file should handle this automatically

---

### Step 5: Test the Functions Directly

Test if the functions work:

```bash
# Test send verification
curl -X POST https://your-project.supabase.co/functions/v1/auth-send-verification \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{"email":"test@example.com","type":"email_verification"}'
```

You should get a response like:
```json
{
  "success": true,
  "message": "Verification code sent successfully",
  "otp": "123456"
}
```

---

### Step 6: Check Browser Console

1. Open your deployed Vercel site
2. Open **Browser DevTools** (F12)
3. Go to **Console** tab
4. Try to send verification code again
5. Look for the exact error message

Common errors:
- `Failed to fetch` = Network/CORS issue
- `404 Not Found` = Function not deployed or wrong URL
- `401 Unauthorized` = Missing API key
- `500 Internal Server Error` = Function code error

---

### Step 7: Verify API URL is Correct

In your browser console, check what URL is being called:

```javascript
// Open browser console and run:
console.log(process.env.NEXT_PUBLIC_API_URL)
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
```

If these are `undefined`, the environment variables aren't set correctly in Vercel.

---

## 🔍 Quick Diagnostic Checklist

- [ ] Environment variables set in Vercel
- [ ] Redeployed after setting variables
- [ ] Edge Functions deployed (`auth-send-verification`, `auth-verify-email`)
- [ ] `verifications` table exists in database
- [ ] CORS headers in Edge Functions
- [ ] API URL points to Supabase Edge Functions
- [ ] Browser console shows specific error (not just "Failed to fetch")

---

## 🚀 Quick Fix (If Functions Not Deployed Yet)

If you can't deploy Edge Functions right now, you can temporarily point to your Express backend:

1. In Vercel, set `NEXT_PUBLIC_API_URL` to your Express backend URL:
   ```
   http://your-express-backend.com/api
   ```

2. Make sure your Express backend is running and accessible

3. Redeploy Vercel

---

## 📝 Next Steps After Fix

1. **Deploy all Edge Functions** (see deployment guide)
2. **Set up email service** for sending OTP codes (SendGrid, Resend, etc.)
3. **Test full registration flow**
4. **Monitor Edge Function logs** in Supabase Dashboard

---

## 🆘 Still Not Working?

1. **Check Vercel build logs** - Look for errors during build
2. **Check Supabase Edge Function logs** - Go to Dashboard → Edge Functions → Logs
3. **Check browser Network tab** - See the exact request/response
4. **Verify Supabase project is active** - Free tier projects pause after inactivity

---

**Most likely issue:** Edge Functions not deployed yet. Deploy them and the error should go away! 🚀

