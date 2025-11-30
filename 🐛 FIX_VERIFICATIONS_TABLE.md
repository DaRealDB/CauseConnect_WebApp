# 🐛 Fix: Verifications Table Column Error

## ❌ Error Encountered

```
ERROR: 42703: column "userId" does not exist
```

## 🔍 Root Cause

The `verifications` table does **NOT** have a `userId` column. Looking at the schema:

```sql
CREATE TABLE IF NOT EXISTS verifications (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    "otpHash" TEXT NOT NULL,
    type TEXT DEFAULT 'email_verification',
    verified BOOLEAN DEFAULT false,
    "expiresAt" TIMESTAMP NOT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW()
);
```

The `verifications` table uses `email` to link to users, not `userId`.

## ✅ Fix Applied

Updated the RLS policies for `verifications` table to:

1. **Match by email** through the users table
2. Use **case-insensitive** matching with `LOWER()`
3. Link through `users.id = auth.uid()::text AND users.email = verifications.email`

### Updated Policies:

```sql
-- Users can view verifications for their email
CREATE POLICY "Users can view own verifications"
ON verifications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid()::text 
    AND LOWER(users.email) = LOWER(verifications.email)
  )
);

-- Users can update verifications for their email
CREATE POLICY "Users can update own verifications"
ON verifications FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid()::text 
    AND LOWER(users.email) = LOWER(verifications.email)
  )
);
```

## 🚀 Solution

The migration file `003_fix_missing_rls.sql` has been **updated and fixed**.

### Next Steps:

1. **Open the updated file:** `supabase/migrations/003_fix_missing_rls.sql`
2. **Copy ALL contents** again
3. **Paste into Supabase SQL Editor** (new query)
4. **Run it** - should work now! ✅

## ✅ Verification

After running the updated migration:

1. Should complete without errors
2. Security Advisor should show 0 errors
3. All 18 tables should have RLS enabled

---

**Status:** Fixed! Run the migration again. 🚀

