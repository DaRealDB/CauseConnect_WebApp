# Check Backend Console Logs

## Critical: Check Your Backend Server Console

The frontend logs show tags are saved but not loaded. We need to see what the **backend** is doing.

## What to Check

### 1. Open Your Backend Terminal/Console
- Wherever you're running `npm run dev` for the backend
- Look for console.log messages

### 2. When You Complete Onboarding

You should see these logs in the **backend console**:
```
[UpdatePreferences] updatePreferences called for userId: <user_id>
[UpdatePreferences] User <user_id> - Saved tags: ["youth", "disaster-relief"]
[UpdatePreferences] Tags from DB after save: ["youth", "disaster-relief"]
[UpdatePreferences] Tags type: object
[UpdatePreferences] Tags is array: true
```

### 3. When You Navigate to Settings → Personalization

You should see these logs in the **backend console**:
```
[Settings] getSettings called for userId: <user_id>
[Settings] User <user_id> - interestTags from DB: [...]
[Settings] interestTags type: ...
[Settings] interestTags is array: ...
[Settings] Direct DB query - interestTags: [...]
[Settings] Normalized tags: [...]
```

## What We're Looking For

### ✅ Good Case:
```
[UpdatePreferences] User abc123 - Saved tags: ["youth", "disaster-relief"]
[UpdatePreferences] Tags from DB after save: ["youth", "disaster-relief"]
[Settings] getSettings called for userId: abc123  ← SAME userId
[Settings] User abc123 - interestTags from DB: ["youth", "disaster-relief"]
[Settings] Normalized tags: ["youth", "disaster-relief"]
```

### ❌ Problem Cases:

**Case 1: Different userId**
```
[UpdatePreferences] User abc123 - Saved tags: ["youth", "disaster-relief"]
[Settings] getSettings called for userId: xyz789  ← DIFFERENT userId
```
**Fix:** Authentication issue - different user session

**Case 2: Tags saved but not retrieved**
```
[UpdatePreferences] Tags from DB after save: ["youth", "disaster-relief"]
[Settings] interestTags from DB: []  ← EMPTY!
```
**Fix:** Database transaction issue or query problem

**Case 3: No logs at all**
```
(no backend logs appear)
```
**Fix:** Backend not running or logs not enabled

## Quick Check

1. **Is your backend server running?**
   - Check the terminal where you ran `cd backend && npm run dev`
   - Should show server listening on port 3001 (or your configured port)

2. **Are you seeing ANY backend logs?**
   - If yes, great - look for the `[UpdatePreferences]` and `[Settings]` logs
   - If no, check if logging is enabled or if the backend is actually processing requests

3. **Copy the backend logs here**
   - Especially around the time you:
     - Complete onboarding
     - Navigate to Settings → Personalization

## Alternative: Check Network Tab

If backend logs aren't available, check the browser Network tab:

1. Open DevTools → Network tab
2. Complete onboarding
3. Find `POST /api/users/preferences` request
   - Check Response tab - should show: `{"success": true, "tags": ["youth", "disaster-relief"]}`

4. Navigate to Settings
5. Find `GET /api/settings` request  
   - Check Response tab - should show: `{"personalization": {"interestTags": ["youth", "disaster-relief"], ...}}`

If the Response shows empty `interestTags: []`, then the backend is returning empty data, which means the database query isn't finding the tags.

## Next Steps

Please share:
1. Backend console logs (especially the `[UpdatePreferences]` and `[Settings]` lines)
2. Network tab response for `GET /api/settings` request
3. Whether the userId in both logs matches

This will tell us exactly where the problem is!

