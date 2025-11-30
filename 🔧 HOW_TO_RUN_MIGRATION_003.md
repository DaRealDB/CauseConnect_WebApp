# 🔧 How to Run Migration 003 - Step by Step

## ⚠️ Important: Don't Edit Existing Queries!

You see two existing SQL files in your Supabase SQL Editor:
1. "SQL Row-Level Security Policies for CauseConnect" (002_rls_policies.sql) - **DON'T EDIT**
2. "SQL CauseConnect Initial Schema" (001_initial_schema.sql) - **DON'T EDIT**

**These have already been run.** We need to create a NEW query with migration 003.

---

## ✅ Correct Steps:

### Step 1: Create a New Query

1. In the Supabase SQL Editor, look for a **"+" button** or **"New Query"** button
2. Click it to create a **brand new** SQL query
3. You should see an empty SQL editor window

### Step 2: Copy Migration 003 Content

1. Open the file: `supabase/migrations/003_fix_missing_rls.sql` in your code editor
2. Select **ALL** the contents (Ctrl+A or Cmd+A)
3. Copy it (Ctrl+C or Cmd+C)

### Step 3: Paste and Run

1. Paste the copied content into the **new** SQL query window in Supabase
2. Click the **"Run"** button (green button, usually says "Run" or has a play icon)
3. Wait for it to complete

### Step 4: Verify Success

1. You should see: **"Success. No rows returned"** or similar success message
2. Go to **Database → Security Advisor**
3. Click **"Rerun linter"**
4. You should now see **0 errors** ✅

---

## 🎯 What Each Migration Does:

- **001_initial_schema.sql** - Creates all database tables ✅ (Already run)
- **002_rls_policies.sql** - Enables RLS on initial tables ✅ (Already run)
- **003_fix_missing_rls.sql** - Fixes the 18 missing RLS policies ⚠️ **RUN THIS ONE**

---

## 📝 Quick Copy Command:

If you're in your project directory, you can quickly view the file:

```bash
cat supabase/migrations/003_fix_missing_rls.sql
```

Then copy the entire output and paste into Supabase SQL Editor.

---

## ✅ Summary:

**DON'T** edit the existing 2 queries  
**DO** create a new query and paste migration 003  
**RUN** the new query to fix all security issues

---

**Ready? Create a new query and paste migration 003!** 🚀

