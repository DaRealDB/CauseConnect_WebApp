# 🐛 Fix: Squad Comments Table Column Error

## ❌ Error Encountered

```
ERROR: 42703: column squad_comments.squadId does not exist
```

## 🔍 Root Cause

The `squad_comments` table does **NOT** have a `squadId` column. Looking at the schema:

```sql
CREATE TABLE IF NOT EXISTS squad_comments (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    "postId" TEXT NOT NULL REFERENCES squad_posts(id) ON DELETE CASCADE,
    "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "parentId" TEXT REFERENCES squad_comments(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);
```

**Structure:**
- `squad_comments` → links to `squad_posts` via `postId`
- `squad_posts` → links to `squads` via `squadId`

To get the `squadId`, we need to **join through `squad_posts`**.

## ✅ Fix Applied

Updated the RLS policies to join through the `squad_posts` table:

### Before (Incorrect):
```sql
WHERE squad_members."squadId" = squad_comments."squadId"  -- ❌ squadId doesn't exist
```

### After (Correct):
```sql
SELECT 1 FROM squad_posts sp
JOIN squad_members sm ON sm."squadId" = sp."squadId"
WHERE sp.id = squad_comments."postId"  -- ✅ Join through squad_posts
AND sm."userId" = auth.uid()::text
```

## 🔄 Updated Policies

### View Comments:
- Joins `squad_comments` → `squad_posts` → `squad_members`
- Checks if user is a member of the squad that owns the post

### Create Comments:
- Verifies user is author (`userId`)
- Verifies user is member of the squad (via join)

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
4. Squad comments policies should work correctly

---

**Status:** Fixed! Run the migration again. 🚀

