# 🔧 Fix: "role does not exist" Error

## ❌ The Problem

You're seeing:
```
psql: error: connection to server on socket "/var/run/postgresql/.s.PGSQL.5432" failed: 
FATAL:  role "daryld.bacusmo" does not exist
```

**Why?** You're trying to connect to a **local PostgreSQL server** on your machine, but:
1. You probably don't have PostgreSQL installed locally, OR
2. The local PostgreSQL doesn't have your user account set up, OR  
3. `$DATABASE_URL` is not set (so psql defaults to local connection)

**For Supabase, you DON'T need local PostgreSQL!**

---

## ✅ The Solution: Use Supabase Dashboard

**Easiest way - no CLI needed:**

1. **Go to your Supabase Dashboard:**
   - https://app.supabase.com
   - Log in and select your project

2. **Click "SQL Editor"** (in left sidebar)

3. **Create a new query:**
   - Click "New query" button

4. **Copy the migration file:**
   ```bash
   cat supabase/migrations/001_initial_schema.sql
   ```
   - Copy the ENTIRE output

5. **Paste into SQL Editor** and click "Run"

6. **Repeat for the second migration:**
   - New query → Copy `002_rls_policies.sql` → Paste → Run

**That's it! No local PostgreSQL needed.**

---

## ✅ Alternative: Set DATABASE_URL (if you want to use psql)

If you really want to use `psql`, you need your Supabase connection string:

### Step 1: Get Connection String

1. Go to Supabase Dashboard → **Settings** → **Database**
2. Find **Connection string** section
3. Select **URI** tab
4. Copy the string (looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```

### Step 2: Set Environment Variable

```bash
export DATABASE_URL="postgresql://postgres:YOUR_ACTUAL_PASSWORD@db.xxxxx.supabase.co:5432/postgres"
```

⚠️ **Replace `YOUR_ACTUAL_PASSWORD` with your real Supabase database password!**

### Step 3: Run Migration

```bash
psql "$DATABASE_URL" -f supabase/migrations/001_initial_schema.sql
psql "$DATABASE_URL" -f supabase/migrations/002_rls_policies.sql
```

---

## 🎯 Recommended Approach

**Use the Supabase Dashboard SQL Editor** (Method 1 above).

It's:
- ✅ No setup required
- ✅ No CLI installation
- ✅ Visual feedback
- ✅ Error messages are clear
- ✅ You can see tables created immediately

---

## 📝 Next Steps

1. ✅ Run migrations via Supabase Dashboard
2. ✅ Verify tables in Table Editor
3. ✅ Set up `.env.local` with Supabase keys
4. ✅ Deploy Edge Functions

See `QUICK_START_SUPABASE.md` for step-by-step guide!

---

**Questions?** The Dashboard method is foolproof - just copy/paste the SQL files!
