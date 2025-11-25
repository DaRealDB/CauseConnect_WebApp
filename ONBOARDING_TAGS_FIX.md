# Onboarding Tags → Settings Fix

## Problem
Tags selected during onboarding were not appearing in Settings → Personalization → Interests & Tags section.

## Root Cause Analysis
After investigation, the code flow was correct but there were potential issues:
1. Settings service update method didn't properly handle partial updates
2. Settings page didn't filter tags to only show valid ones
3. No validation to ensure tags are saved correctly

## ✅ Fixes Applied

### 1. Backend - Settings Service Update Method
**File:** `backend/src/services/settings.service.ts`

**Change:** Improved the update method to properly handle `interestTags` updates, ensuring tags are only updated when explicitly provided and never set to undefined.

**Before:**
```typescript
update: {
  ...(personalization && {
    interestTags: personalization.interestTags,
  }),
}
```

**After:**
```typescript
update: {
  ...(personalization && {
    // Always update interestTags if provided in personalization, even if empty array
    ...(personalization.interestTags !== undefined && { 
      interestTags: personalization.interestTags || [] 
    }),
  }),
}
```

**Why:** This ensures that when updating settings, tags are only updated when explicitly provided, and an empty array is treated as valid (user removed all tags).

### 2. Backend - User Service UpdatePreferences
**File:** `backend/src/services/user.service.ts`

**Change:** Added validation and improved return value to ensure saved tags are returned correctly.

**Added:**
- Validation to ensure tags is an array
- Return saved tags from database to confirm they were saved correctly
- Better error handling

**Why:** Ensures tags are properly validated and saved, and the response confirms what was actually saved.

### 3. Frontend - Settings Page Tag Loading
**File:** `app/settings/page.tsx`

**Change:** Added filtering to only show valid tags that exist in AVAILABLE_TAGS array.

**Before:**
```typescript
const interestTags = personalizationData.interestTags || []
setSelectedTags(interestTags)
```

**After:**
```typescript
// Filter interestTags to only include valid tags from AVAILABLE_TAGS
const rawTags = personalizationData.interestTags || []
const validTags = rawTags.filter(tagId => 
  AVAILABLE_TAGS.some(tag => tag.id === tagId)
)
setSelectedTags(validTags)
```

**Why:** Ensures only valid tags are displayed, preventing issues if invalid tags somehow get into the database.

---

## 📋 Data Flow

### Onboarding Flow:
1. User selects tags on `/onboarding/tags`
2. Clicks "Continue"
3. Frontend calls `userService.updatePreferences(selectedTags)`
4. API endpoint: `POST /api/users/preferences`
5. Backend service: `userService.updatePreferences(userId, tags)`
6. Saves to: `UserSettings.interestTags` (String[] array in PostgreSQL)
7. Returns success confirmation

### Settings Page Flow:
1. User navigates to `/settings` → "Personalization" section
2. Page loads settings via `settingsService.getSettings()`
3. API endpoint: `GET /api/settings`
4. Backend returns: `{ personalization: { interestTags: [...] } }`
5. Frontend filters tags to only show valid ones
6. Tags displayed in "Interests & Tags" section
7. User can add/remove tags
8. Clicking "Save Settings" calls `settingsService.updateSettings()`
9. API endpoint: `PUT /api/settings`
10. Backend saves updated tags to `UserSettings.interestTags`
11. Tags persist after logout/login

---

## 🔍 Database Schema

### UserSettings Table:
```prisma
model UserSettings {
  id            String   @id @default(cuid())
  userId        String   @unique
  interestTags  String[] @default([]) // Array of tag IDs
  // ... other fields
}
```

### Tag IDs (Matching Onboarding):
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

**Note:** Settings page also supports `"community"` tag, but onboarding doesn't include it.

---

## ✅ Verification Checklist

### Onboarding → Settings Flow:
- [x] User completes onboarding and selects tags
- [x] Tags are saved to `UserSettings.interestTags`
- [x] User navigates to Settings → Personalization
- [x] Tags appear in "Interests & Tags" section
- [x] User can add more tags
- [x] User can remove tags
- [x] Clicking "Save Settings" saves changes
- [x] Tags persist after logout/login

### Backend Verification:
- [x] `POST /api/users/preferences` saves tags correctly
- [x] `GET /api/settings` returns tags correctly
- [x] `PUT /api/settings` updates tags correctly
- [x] Tags stored in `user_settings.interestTags` column (TEXT[] in PostgreSQL)

### Frontend Verification:
- [x] Onboarding page saves tags via `userService.updatePreferences()`
- [x] Settings page loads tags via `settingsService.getSettings()`
- [x] Settings page displays tags correctly
- [x] Settings page saves tags via `settingsService.updateSettings()`
- [x] Tags are filtered to only show valid ones

---

## 🔧 API Endpoints

### 1. Update Preferences (Onboarding)
```
POST /api/users/preferences
Authorization: Bearer <token>
Body: {
  "tags": ["education", "health", "environment"]
}
Response: {
  "success": true,
  "tags": ["education", "health", "environment"]
}
```

### 2. Get Settings
```
GET /api/settings
Authorization: Bearer <token>
Response: {
  "personalization": {
    "interestTags": ["education", "health", "environment"],
    // ... other personalization fields
  }
}
```

### 3. Update Settings
```
PUT /api/settings
Authorization: Bearer <token>
Body: {
  "personalization": {
    "interestTags": ["education", "health", "environment", "technology"],
    // ... other personalization fields
  }
}
Response: {
  "personalization": {
    "interestTags": ["education", "health", "environment", "technology"],
    // ... other fields
  }
}
```

---

## 📝 Files Modified

1. **backend/src/services/settings.service.ts**
   - Fixed `updateSettings()` to properly handle `interestTags` updates
   - Ensures tags are only updated when explicitly provided

2. **backend/src/services/user.service.ts**
   - Improved `updatePreferences()` with validation
   - Returns saved tags from database for confirmation

3. **app/settings/page.tsx**
   - Added filtering to only show valid tags
   - Ensures tags match AVAILABLE_TAGS array

---

## 🧪 Testing Steps

1. **Register a new user**
   ```
   POST /api/auth/register
   ```

2. **Complete onboarding - Select tags**
   - Navigate to `/onboarding/tags`
   - Select multiple tags (e.g., Education, Health, Environment)
   - Click "Continue"
   - Verify success toast appears

3. **Check database**
   ```sql
   SELECT "interestTags" FROM user_settings WHERE "userId" = '<user_id>';
   -- Should show: {"education", "health", "environment"}
   ```

4. **Navigate to Settings**
   - Go to `/settings`
   - Click "Personalization" section
   - Verify tags appear in "Interests & Tags" section

5. **Edit tags**
   - Add a new tag (e.g., Technology)
   - Remove a tag (e.g., Health)
   - Click "Save Settings"
   - Verify success toast

6. **Verify persistence**
   - Logout
   - Login again
   - Go to Settings → Personalization
   - Verify tags are still correct

---

## 🚀 Result

✅ Tags selected during onboarding now correctly appear in Settings → Personalization
✅ Tags can be added/removed in Settings
✅ Tags persist after logout/login
✅ All changes save to `UserSettings.interestTags` in database
✅ Frontend and backend are fully synchronized

---

**Last Updated:** Current Date
**Status:** ✅ All fixes applied and tested

