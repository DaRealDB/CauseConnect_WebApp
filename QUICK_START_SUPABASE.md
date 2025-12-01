# ⚡ Quick Start: Supabase Setup (5 Minutes)

## 🎯 Goal

Get your Supabase project set up and migrations running in 5 minutes.

---

## Step 1: Create Supabase Project (2 minutes)

1. Go to: **https://supabase.com/dashboard**
2. Click **"New Project"**
3. Fill in:
   - **Name:** `causeconnect`
   - **Database Password:** (create & save this!)
   - **Region:** Choose closest
4. Click **"Create new project"**
5. Wait 2-3 minutes

---

## Step 2: Get Your Keys (1 minute)

1. Go to **Settings** → **API**
2. Copy these (save them):
   ```
   Project URL: https://xxxxx.supabase.co
   anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. Go to **Settings** → **Database**
4. Copy **Connection string (URI)**:
   ```
   postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```

---

## Step 3: Run Migrations (1 minute)

1. Go to **SQL Editor** in Supabase Dashboard
2. Click **"New query"**
3. Open file: `supabase/migrations/001_initial_schema.sql`
4. **Copy entire file** → Paste in SQL Editor
5. Click **"Run"** ✅
6. Wait for "Success. No rows returned"

7. Click **"New query"** again
8. Open file: `supabase/migrations/002_rls_policies.sql`
9. **Copy entire file** → Paste in SQL Editor
10. Click **"Run"** ✅

---

## Step 4: Create `.env.local` (1 minute)

Create file: `.env.local` in project root:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database (optional - only if using direct psql)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres

# Keep existing Firebase config if using Firebase for chat
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
# ... etc
```

---

## Step 5: Verify Tables (30 seconds)

1. Go to **Table Editor** in Supabase Dashboard
2. You should see tables:
   - ✅ users
   - ✅ events
   - ✅ posts
   - ✅ comments
   - ✅ donations
   - ✅ squads
   - ✅ notifications
   - ✅ etc.

---

## ✅ Done!

Your database is ready! 

**Next:** Deploy Edge Functions (see `COMPLETE_MIGRATION_GUIDE.md`)

---

## 🆘 Troubleshooting

**"Can't find SQL Editor"**
- Make sure you're logged into Supabase
- Project must be fully initialized (wait 2-3 min)

**"Error running SQL"**
- Copy the ENTIRE file, not just part
- Make sure you're pasting in the SQL Editor (not elsewhere)
- Check error message - it will tell you what's wrong

**"Tables don't show up"**
- Wait 10-20 seconds and refresh Table Editor
- Check SQL Editor for any errors

---

**Questions?** See `HOW_TO_RUN_MIGRATIONS.md` for detailed instructions.




