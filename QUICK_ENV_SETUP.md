# ⚡ Quick Setup: .env.local with Supabase Keys

## 🎯 Quick Steps (2 minutes)

### Step 1: Get Your Keys from Supabase

1. Go to: https://app.supabase.com
2. Select your project (or create new one)
3. Go to **Settings** → **API**
4. Copy these 2 values:
   - **Project URL** → `https://xxxxx.supabase.co`
   - **anon public key** → `eyJhbGci...` (long string)

5. Go to **Settings** → **Database**
6. Copy **Connection string (URI)** → `postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres`

### Step 2: Create .env.local File

```bash
# In your project root
cp .env.example .env.local
# Or create new file
touch .env.local
```

### Step 3: Add Supabase Keys

Open `.env.local` and add these lines:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres

# Keep your existing Firebase config from .env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
# ... etc
```

### Step 4: Replace Placeholders

- Replace `https://xxxxx.supabase.co` with your actual Project URL
- Replace `your-anon-key-here` with your actual anon key
- Replace `your-service-role-key-here` with your actual service_role key
- Replace `YOUR_PASSWORD` in DATABASE_URL with your actual database password
- Keep all your existing Firebase variables from `.env`

### Step 5: Restart Dev Server

```bash
# Stop current server (Ctrl+C)
# Then restart:
npm run dev
```

---

## 📍 Where to Find Each Key

| Variable | Location |
|----------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Settings → API → `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API → `service_role` `secret` key |
| `DATABASE_URL` | Settings → Database → Connection string → URI |

---

## ✅ Verify It Works

After restarting your dev server, test:

```typescript
// In any component or API route
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
// Should show your Supabase URL
```

---

## 🔒 Important Security Notes

- ✅ `.env.local` is already in `.gitignore` (won't be committed)
- ⚠️ **Never commit** `.env.local` to Git
- ⚠️ **Never use** `SUPABASE_SERVICE_ROLE_KEY` in frontend code
- ✅ Only `NEXT_PUBLIC_*` variables are safe for browser

---

## 🆘 Common Issues

**"Variable not found"**
- Make sure variable starts with `NEXT_PUBLIC_` for client-side
- Restart dev server after changing `.env.local`

**"Invalid key"**
- Double-check you copied the entire key (they're very long)
- No extra spaces or newlines

**"Connection failed"**
- Replace `[YOUR-PASSWORD]` with actual password in DATABASE_URL
- Check password doesn't need URL encoding

---

**Need more details?** See `SETUP_ENV_LOCAL.md` for complete guide.


