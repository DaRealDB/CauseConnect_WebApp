# 🚀 How to Run Database Migrations for Supabase

## ⚠️ Important Note

**DO NOT run migrations using `psql` directly on your local machine!**

The migrations are designed to run inside your Supabase project. Here are the correct methods:

---

## ✅ Method 1: Supabase Dashboard (Recommended - Easiest)

### Step 1: Create Your Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click **"New Project"**
4. Fill in:
   - **Name:** `causeconnect` (or your preferred name)
   - **Database Password:** (create a strong password - save it!)
   - **Region:** Choose closest to your users
5. Click **"Create new project"**
6. Wait 2-3 minutes for project to initialize

### Step 2: Get Your Connection Details

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy these values (you'll need them for `.env.local`):
   - **Project URL:** `https://xxxxx.supabase.co`
   - **anon/public key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

3. Go to **Settings** → **Database**
4. Copy the **Connection string** (use the URI format)
   - It looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres`

### Step 3: Run Migrations in SQL Editor

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **"New query"**
3. Open `supabase/migrations/001_initial_schema.sql` from your project
4. Copy **ALL** the contents (the entire file)
5. Paste into the SQL Editor
6. Click **"Run"** (or press Ctrl+Enter / Cmd+Enter)
7. Wait for it to complete (should take 10-30 seconds)
8. You should see "Success. No rows returned"

### Step 4: Run RLS Policies

1. Click **"New query"** again
2. Open `supabase/migrations/002_rls_policies.sql`
3. Copy **ALL** the contents
4. Paste into the SQL Editor
5. Click **"Run"**
6. Wait for it to complete

### Step 5: Verify Tables Were Created

1. In Supabase dashboard, go to **Table Editor**
2. You should see all your tables:
   - `users`
   - `events`
   - `posts`
   - `comments`
   - `donations`
   - `squads`
   - `notifications`
   - etc.

---

## ✅ Method 2: Supabase CLI (For Developers)

### Step 1: Install Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Linux
curl -fsSL https://supabase.com/install.sh | sh

# Windows
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Step 2: Login to Supabase

```bash
supabase login
```

This will open your browser to authenticate.

### Step 3: Link Your Project

```bash
# Get your project reference ID from Supabase Dashboard → Settings → General
supabase link --project-ref your-project-ref-id
```

### Step 4: Run Migrations

```bash
supabase db push
```

This will push all migrations in `supabase/migrations/` to your Supabase project.

---

## ✅ Method 3: Direct Connection (Advanced)

If you want to use `psql` directly, you need the Supabase connection string:

### Step 1: Get Connection String

1. Go to Supabase Dashboard → **Settings** → **Database**
2. Under **Connection string**, select **URI**
3. Copy the connection string (looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```

### Step 2: Set Environment Variable

```bash
export DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres"
```

**⚠️ WARNING:** Replace `YOUR_PASSWORD` with your actual database password!

### Step 3: Run Migration

```bash
psql "$DATABASE_URL" -f supabase/migrations/001_initial_schema.sql
psql "$DATABASE_URL" -f supabase/migrations/002_rls_policies.sql
```

---

## 🔒 Security Note

**NEVER commit your actual `DATABASE_URL` or passwords to Git!**

Always use environment variables in `.env.local`:

```bash
# .env.local (DO NOT COMMIT THIS FILE)
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## ❌ Common Errors

### Error: "role does not exist"
- **Cause:** Trying to connect to local PostgreSQL instead of Supabase
- **Solution:** Use Supabase Dashboard SQL Editor (Method 1) or set correct `DATABASE_URL`

### Error: "connection refused"
- **Cause:** Wrong connection string or network issue
- **Solution:** Verify connection string in Supabase Dashboard → Settings → Database

### Error: "password authentication failed"
- **Cause:** Wrong password in connection string
- **Solution:** Reset password in Supabase Dashboard → Settings → Database → Reset database password

---

## ✅ Recommended Approach

**For first-time setup, use Method 1 (Supabase Dashboard).**

It's the easiest and doesn't require any CLI setup. You can:
- See results immediately
- See any errors clearly
- Verify tables were created in the Table Editor
- Run migrations step-by-step

---

## 📝 Next Steps After Migrations

Once migrations are complete:

1. ✅ Verify tables exist in Supabase Dashboard → Table Editor
2. ✅ Set up environment variables in `.env.local`
3. ✅ Deploy Edge Functions
4. ✅ Test the connection

---

**Need help? Check `SUPABASE_MIGRATION_COMPLETE_GUIDE.md` for full setup instructions!**


