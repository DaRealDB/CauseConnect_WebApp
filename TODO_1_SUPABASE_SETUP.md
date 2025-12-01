# ✅ TODO 1: Set Up Supabase Project & Run Migrations

## 📋 Complete Step-by-Step Guide

### Phase 1: Create Supabase Project (5 minutes)

#### Step 1.1: Create Account (if needed)
1. Go to https://supabase.com
2. Click **"Start your project"** or **"Sign Up"**
3. Sign up with GitHub (recommended) or email
4. Verify your email if required

#### Step 1.2: Create New Project
1. Click **"New Project"** button
2. Fill in project details:
   ```
   Name: CauseConnect
   Database Password: [Generate strong password - SAVE THIS!]
   Region: [Choose closest to you or your users]
   Pricing Plan: Free (or Pro if needed)
   ```
3. Click **"Create new project"**
4. ⏳ Wait 2-3 minutes for project to initialize

#### Step 1.3: Save Your Credentials
Once project is ready, copy these values:

**From Settings → API:**
```
Project URL: https://xxxxx.supabase.co
anon public key: eyJhbGc...
service_role key: eyJhbGc...
```

**From Settings → Database → Connection String:**
```
Connection String (URI): postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

**📝 Create a secure file to save these:**
```bash
# Create a secure credentials file (don't commit to git!)
cat > .env.supabase.local << EOF
# Supabase Credentials - DO NOT COMMIT TO GIT
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres
EOF

# Make sure it's in .gitignore
echo ".env.supabase.local" >> .gitignore
```

---

### Phase 2: Run Database Migrations (10 minutes)

#### Step 2.1: Run Initial Schema Migration
1. Go to **SQL Editor** in Supabase Dashboard
2. Click **"New Query"** button (+)
3. Open file: `supabase/migrations/001_initial_schema.sql`
4. **Copy ALL contents** (Select All → Copy)
5. **Paste** into the new query in Supabase
6. Click **"Run"** button (green, or press Ctrl/Cmd + Enter)
7. ✅ Wait for success message: **"Success. No rows returned"**
8. ⏱️ This may take 1-2 minutes

**Verify Success:**
- Go to **Table Editor** in Supabase Dashboard
- You should see tables like `users`, `events`, `posts`, etc.

#### Step 2.2: Run RLS Policies Migration
1. Still in **SQL Editor**
2. Click **"New Query"** again
3. Open file: `supabase/migrations/002_rls_policies.sql`
4. **Copy ALL contents**
5. **Paste** into new query
6. Click **"Run"**
7. ✅ Wait for success: **"Success. No rows returned"**

#### Step 2.3: Run Missing RLS Fix Migration
1. Still in **SQL Editor**
2. Click **"New Query"** again
3. Open file: `supabase/migrations/003_fix_missing_rls.sql`
4. **Copy ALL contents**
5. **Paste** into new query
6. Click **"Run"**
7. ✅ Wait for success: **"Success. No rows returned"**

#### Step 2.4: Verify Security Fix
1. Go to **Database → Security Advisor**
2. Click **"Rerun linter"** button
3. ✅ Should show: **0 errors, 0 warnings**
4. If errors remain, check which tables still need RLS

---

### Phase 3: Set Up Storage Buckets (Optional - 5 minutes)

If you need file uploads (avatars, images):

1. Go to **Storage** in Supabase Dashboard
2. Click **"Create a new bucket"**

**Create these buckets:**

**Bucket 1: `avatars`**
- Name: `avatars`
- Public bucket: ✅ Yes
- File size limit: 5 MB
- Allowed MIME types: `image/jpeg,image/png,image/gif,image/webp`

**Bucket 2: `event-images`**
- Name: `event-images`
- Public bucket: ✅ Yes
- File size limit: 10 MB
- Allowed MIME types: `image/jpeg,image/png,image/gif,image/webp`

**Bucket 3: `post-images`**
- Name: `post-images`
- Public bucket: ✅ Yes
- File size limit: 10 MB
- Allowed MIME types: `image/jpeg,image/png,image/gif,image/webp`

---

### Phase 4: Verify Database Setup (2 minutes)

#### Quick Checks:

1. **Tables Created:**
   ```sql
   -- Run in SQL Editor to check
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   ORDER BY table_name;
   ```
   Should show ~30+ tables

2. **RLS Enabled:**
   ```sql
   -- Check RLS status
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' 
   AND rowsecurity = true;
   ```
   Should show all tables with RLS enabled

3. **Security Advisor:**
   - Go to **Database → Security Advisor**
   - Should show **0 errors**

---

## ✅ Completion Checklist

- [ ] Supabase project created
- [ ] Project URL saved
- [ ] API keys saved (anon + service_role)
- [ ] Database connection string saved
- [ ] Migration 001 (initial schema) run successfully
- [ ] Migration 002 (RLS policies) run successfully
- [ ] Migration 003 (fix missing RLS) run successfully
- [ ] Security Advisor shows 0 errors
- [ ] Storage buckets created (if needed)
- [ ] All credentials saved securely

---

## 🐛 Troubleshooting

### Error: "connection timeout"
- **Solution:** Wait a bit longer, project might still be initializing
- Try refreshing the page

### Error: "table already exists"
- **Solution:** That's okay! It means migration already ran
- Continue to next migration

### Error: "permission denied"
- **Solution:** Make sure you're using the correct database role
- Check that you're logged into Supabase Dashboard

### Error: "policy already exists"
- **Solution:** That's okay! Migration 003 handles this
- It will drop and recreate policies safely

---

## 🎉 Success Indicators

✅ **All migrations completed:**
- 001: Tables created
- 002: Initial RLS policies created
- 003: Missing RLS policies fixed

✅ **Security Advisor shows:**
- 0 errors
- 0 warnings
- All tables secured

✅ **Ready for next step:**
- Database is set up
- RLS is configured
- Ready to deploy Edge Functions

---

## 📝 Notes

- **Keep your credentials safe** - never commit them to git
- **Database password** - You can't retrieve it later, only reset
- **Free tier limits** - Check Supabase pricing for limits
- **Backups** - Supabase automatically backs up your database

---

## 🚀 Next Step

Once all migrations are complete:
→ Move to **TODO 2: Deploy All 91 Edge Functions**

---

**Status:** Complete this TODO first, then move to the next one! 🎯



