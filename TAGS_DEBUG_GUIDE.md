# Debugging Guide: Onboarding Tags Not Showing in Settings

## Issue
Tags selected during onboarding are not appearing in Settings → Personalization → Interests & Tags

## Debugging Steps

### 1. Verify Tags Are Being Saved During Onboarding

**Check Browser Console:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Complete onboarding and select tags
4. Look for: `✅ Tags saved during onboarding: ["education", "health", ...]`
5. If this message appears, tags were sent to backend

**Check Network Tab:**
1. Go to Network tab in DevTools
2. Complete onboarding and select tags
3. Find `POST /api/users/preferences` request
4. Check:
   - Request payload should have: `{ "tags": ["education", "health", ...] }`
   - Response should have: `{ "success": true, "tags": ["education", "health", ...] }`
   - Status code should be 200

### 2. Verify Tags Are in Database

**Check Database Directly:**
```sql
-- Connect to your PostgreSQL database
SELECT id, "userId", "interestTags" 
FROM user_settings 
WHERE "userId" = '<your_user_id>';
```

**Expected Result:**
- `interestTags` column should be a text array like: `{"education", "health", "environment"}`

### 3. Verify Tags Are Loaded in Settings Page

**Check Browser Console:**
1. Navigate to Settings → Personalization
2. Open browser Console
3. Look for one of these messages:

**If tags exist:**
```
✅ Loaded tags from settings: ["education", "health"]
✅ Valid tags after filtering: ["education", "health"]
```

**If tags don't exist:**
```
⚠️ No tags found in settings. interestTags: undefined
```

**Check Network Tab:**
1. Go to Network tab
2. Navigate to Settings → Personalization
3. Find `GET /api/settings` request
4. Check response - it should include:
```json
{
  "personalization": {
    "interestTags": ["education", "health", "environment"],
    ...
  }
}
```

### 4. Verify Tag Filtering

The settings page filters tags to only show valid ones. Check:

1. **Valid Tag IDs** (from `AVAILABLE_TAGS`):
   - `"education"`
   - `"environment"`
   - `"health"`
   - `"poverty"`
   - `"animals"`
   - `"human-rights"`
   - `"disaster-relief"`
   - `"arts-culture"`
   - `"technology"`
   - `"elderly"`
   - `"youth"`
   - `"mental-health"`
   - `"community"` (only in settings, not onboarding)

2. If you see `✅ Loaded tags from settings: [...]` but `✅ Valid tags after filtering: []`, it means:
   - Tags exist in database
   - But they don't match any valid tag IDs
   - **Fix:** Check if tag IDs saved match the valid ones above

### 5. Common Issues and Fixes

#### Issue 1: Tags Not Saved
**Symptoms:** No console log "✅ Tags saved during onboarding"
**Fix:** 
- Check if API call to `/api/users/preferences` succeeded
- Check network tab for errors
- Verify authentication token is valid

#### Issue 2: Tags Saved But Not Loaded
**Symptoms:** Tags in database but not showing in settings
**Fix:**
- Check `GET /api/settings` response includes tags
- Verify tags aren't being filtered out
- Check console for error messages

#### Issue 3: Tags Filtered Out
**Symptoms:** Console shows tags loaded but filtered array is empty
**Fix:**
- Verify tag IDs in database match `AVAILABLE_TAGS` IDs exactly
- Check for typos or case sensitivity issues

#### Issue 4: Settings Page Cached
**Symptoms:** Old tags showing, new tags not appearing
**Fix:**
- Hard refresh page (Ctrl+Shift+R or Cmd+Shift+R)
- Clear browser cache
- The new code refreshes tags when switching to personalization section

## Testing Checklist

- [ ] Complete onboarding and select tags
- [ ] Check console for "✅ Tags saved during onboarding" message
- [ ] Verify tags in database via SQL query
- [ ] Navigate to Settings → Personalization
- [ ] Check console for "✅ Loaded tags from settings" or "⚠️ No tags found" message
- [ ] Verify tags appear in UI
- [ ] Add a new tag and save
- [ ] Verify new tag persists
- [ ] Logout and login again
- [ ] Verify tags still appear

## Quick Fix: Force Refresh Tags

If tags aren't showing, try:

1. **Hard refresh the settings page:**
   - Press `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)

2. **Manually trigger settings reload:**
   - Open browser console
   - Navigate away from Personalization section
   - Navigate back to Personalization section
   - Tags should auto-refresh

3. **Clear browser storage:**
   - Open DevTools → Application tab
   - Clear Local Storage
   - Refresh page

## Backend Verification

### Check Backend Logs

When completing onboarding, backend should log:
- `POST /api/users/preferences` request received
- Tags saved successfully

When loading settings:
- `GET /api/settings` request received
- Settings returned with interestTags array

### Test Backend API Directly

**Using curl or Postman:**

1. **Save tags:**
```bash
POST /api/users/preferences
Authorization: Bearer <your_token>
{
  "tags": ["education", "health"]
}
```

2. **Get settings:**
```bash
GET /api/settings
Authorization: Bearer <your_token>
```

Response should include:
```json
{
  "personalization": {
    "interestTags": ["education", "health"]
  }
}
```

## Still Not Working?

If tags still don't appear after checking everything above:

1. **Check backend database connection**
   - Verify PostgreSQL is running
   - Verify DATABASE_URL is correct

2. **Check Prisma schema**
   - Verify `UserSettings` model has `interestTags String[]` field
   - Run migrations if needed: `npx prisma migrate deploy`

3. **Check authentication**
   - Verify user is logged in
   - Verify JWT token is valid
   - Check if `req.userId` is set in backend

4. **Check for errors**
   - Check browser console for errors
   - Check backend logs for errors
   - Check network tab for failed requests

5. **Contact support** with:
   - Console logs
   - Network request/response details
   - Database query results
   - Backend logs

