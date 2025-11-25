# Debug Steps - Tags Not Loading

## Current Status
✅ Frontend shows: Tags saved during onboarding: `['youth', 'disaster-relief']`
❌ Frontend shows: No tags found in settings. interestTags: `[]`

## Step 1: Check Backend Console Logs

Open your **backend terminal** (where `npm run dev` is running) and look for:

### When saving tags (onboarding):
```
[UpdatePreferences] updatePreferences called for userId: <id>
[UpdatePreferences] About to upsert tags for userId: <id> ['youth', 'disaster-relief']
[UpdatePreferences] User <id> - Saved tags: ['youth', 'disaster-relief']
[UpdatePreferences] Tags from DB immediately after save: [...]
[UpdatePreferences] Verification query - Tags from DB: [...]
```

### When loading settings:
```
[Settings] getSettings called for userId: <id>
[Settings] User <id> - interestTags from DB: [...]
[Settings] Direct DB query - interestTags: [...]
[Settings] Normalized tags: [...]
```

**Critical Check:** Do the userId values match in both logs?

## Step 2: Check Browser Network Tab

1. Open DevTools → Network tab
2. Complete onboarding
3. Find `POST /api/users/preferences` request
   - Click on it
   - Go to Response tab
   - Should show: `{"success": true, "tags": ["youth", "disaster-relief"]}`

4. Navigate to Settings → Personalization  
5. Find `GET /api/settings` request
   - Click on it
   - Go to Response tab
   - Check what `personalization.interestTags` contains

**What to look for:**
- If `interestTags` is `[]` in the response → Backend is returning empty array
- If `interestTags` is missing → Backend response structure issue
- If `interestTags` has the tags → Frontend is filtering them out

## Step 3: Check Frontend Console

After navigating to Settings, check the browser console for:
```
🔍 Full settings API response: {...}
🔍 personalization object: {...}
🔍 interestTags in response: [...]
```

This will show exactly what the API returned.

## Step 4: Quick Database Check

If you have database access, run:
```sql
SELECT id, "userId", "interestTags" 
FROM user_settings 
ORDER BY "updatedAt" DESC 
LIMIT 5;
```

Check if your user's record has the tags saved.

## Most Likely Issues

### Issue 1: Different userId
**Symptom:** Backend logs show different userIds for save vs load
**Fix:** Authentication/session issue

### Issue 2: Tags saved but query returns empty
**Symptom:** Save shows tags, but load query returns []
**Fix:** Database query or Prisma issue

### Issue 3: Backend returns tags but frontend filters them
**Symptom:** Network tab shows tags in response, but console shows []
**Fix:** Frontend filtering too strict

## What to Report Back

Please share:
1. Backend console logs (the `[UpdatePreferences]` and `[Settings]` lines)
2. Network tab Response for `GET /api/settings`
3. Frontend console output showing the full API response

This will pinpoint the exact issue!

