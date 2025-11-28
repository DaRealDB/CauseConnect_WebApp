# 🔍 Diagnostic: Tags Not Loading

## Current Status
✅ Tags saved during onboarding: `['youth', 'disaster-relief', 'health']`  
❌ Settings API returns: `interestTags: Array(0)`

## 🎯 Most Likely Causes

### 1. userId Mismatch (Most Likely)
Tags saved with one `userId`, but loaded with a different `userId`.

**How to check:**
- Compare backend logs when saving vs loading
- Look for `[UpdatePreferences] updatePreferences called for userId: xxx`
- Look for `[Settings] getSettings called for userId: xxx`
- They should be **identical**

### 2. Settings Record Overwritten
When `getSettings` runs, it might be creating a new settings record that overwrites the one with tags.

**Check:** Look for this log:
```
[Settings] No settings found for userId xxx, creating new record
```
If you see this AFTER tags were saved, that's the problem!

### 3. Database Transaction Issue
Tags might not be committed to the database yet when settings are loaded.

**Check:** Look for:
```
[UpdatePreferences] Verification query - Tags from DB: [...]
```
This shows what's actually in the DB right after save.

### 4. Prisma Serialization Issue
PostgreSQL array might not be serialized correctly by Prisma.

**Check:** Look for:
```
[Settings] Raw SQL query result: [...]
```
This bypasses Prisma and shows the raw PostgreSQL value.

## 📋 What to Check in Backend Logs

### When Tags Are Saved (Onboarding):
Look for these logs:
```
[Controller] updatePreferences called - userId: xxx, tags: [...]
[UpdatePreferences] updatePreferences called for userId: xxx
[UpdatePreferences] Saved tags: ['youth', 'disaster-relief', 'health']
[UpdatePreferences] Tags from DB immediately after save: [...]
[UpdatePreferences] Verification query - Tags from DB: [...]
```

### When Settings Are Loaded:
Look for these logs:
```
[Controller] getSettings called - userId: xxx
[Settings] getSettings called for userId: xxx
[Settings] Found existing settings record for userId: xxx  ← Should see this, NOT "creating new record"
[Settings] Raw SQL query result: [...]  ← This is the KEY log!
[Settings] Direct tags query result: [...]
[Settings] Final normalized tags being returned: [...]
```

## 🔧 Quick Diagnostic Command

If you have database access, you can check directly:

```sql
-- Find your user ID
SELECT id, username, email FROM users WHERE username = 'your_username';

-- Check if tags are actually in the database
SELECT "userId", "interestTags", "updatedAt" 
FROM "user_settings" 
WHERE "userId" = 'your_user_id_here';
```

The `interestTags` column should show: `{"youth","disaster-relief","health"}`

## 🎯 Next Steps

1. **Check Backend Console** - Look for the logs above
2. **Compare userIds** - Save vs Load should be identical
3. **Check Raw SQL Result** - This tells us what's actually in PostgreSQL
4. **Share Backend Logs** - Paste the relevant log entries

**The backend logs will reveal exactly where the tags are being lost!**









