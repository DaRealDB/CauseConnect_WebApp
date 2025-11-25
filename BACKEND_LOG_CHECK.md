# CRITICAL: Check Backend Console Logs

## The Problem
Frontend shows tags are saved, but API returns empty array. We need backend logs to diagnose.

## Action Required

### 1. Check Your Backend Terminal

Open the terminal where you're running the backend server (where you ran `npm run dev` in the `backend` folder).

### 2. Look for These Logs

When you complete onboarding and select tags, you should see:
```
[UpdatePreferences] updatePreferences called for userId: <id>
[UpdatePreferences] About to upsert tags for userId: <id> ['youth', 'disaster-relief']
[UpdatePreferences] User <id> - Saved tags: ['youth', 'disaster-relief']
[UpdatePreferences] Tags from DB immediately after save: [...]
[UpdatePreferences] Verification query - Tags from DB: [...]
```

When you navigate to Settings, you should see:
```
[Settings] getSettings called for userId: <id>
[Settings] User <id> - interestTags from DB: [...]
[Settings] Raw settings from DB (all fields): {...}
[Settings] Final normalized tags being returned: [...]
```

### 3. What to Look For

**If you see different userIds:**
- Save: `userId: abc123`
- Load: `userId: xyz789`
- **Problem:** Different user sessions

**If you see tags saved but query returns empty:**
- Save shows: `['youth', 'disaster-relief']`
- Load shows: `[]`
- **Problem:** Database query or data persistence issue

**If you see no logs at all:**
- **Problem:** Backend server not running or code not updated

### 4. Restart Backend Server

If you don't see the logs, restart your backend:
```bash
# Stop the current server (Ctrl+C)
cd backend
npm run dev
```

Then try the flow again and check for logs.

### 5. Share the Logs

Please copy and paste:
- All `[UpdatePreferences]` log lines
- All `[Settings]` log lines
- Any error messages

This will tell us exactly where the tags are being lost!

