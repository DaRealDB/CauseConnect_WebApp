# TAG SYSTEM ANALYSIS & FIX PLAN
## CauseConnect - Tags, Personalization, and Feed Filtering

**Date:** 2025-01-27  
**Status:** Comprehensive Analysis Complete

---

## 🔍 CRITICAL ISSUES IDENTIFIED

### 1. **DATABASE SCHEMA INCONSISTENCIES**

#### ❌ PROBLEM: Posts Have NO Tags
- **Current State:** `Post` model has no tag relationship
- **Impact:** Posts cannot be filtered by tags
- **Location:** `backend/prisma/schema.prisma` (Line 125-142)
- **Required Fix:** Add `PostTag` model (similar to `EventTag`)

#### ✅ GOOD: Events Have Tags
- **Current State:** `Event` → `EventTag[]` relationship exists
- **Location:** `backend/prisma/schema.prisma` (Line 88, 99-109)

#### ✅ GOOD: User Tags Storage
- **Current State:** `UserSettings.interestTags` (String[] array)
- **Location:** `backend/prisma/schema.prisma` (Line 436)
- **Note:** This is the correct source of truth

---

### 2. **ONBOARDING TAG SAVING**

#### ❌ PROBLEM: Tags May Not Persist
- **Current Flow:**
  1. User selects tags in `/onboarding/tags`
  2. Calls `userService.updatePreferences(selectedTags)`
  3. Hits `POST /users/preferences` with `{ tags: string[] }`
  4. Backend saves to `UserSettings.interestTags`
- **Potential Issues:**
  - Authentication check (`if (!isAuthenticated)`) may skip saving
  - No error handling for failed saves
  - No verification that tags were saved
- **Location:** `app/onboarding/tags/page.tsx` (Line 39-59)

---

### 3. **SETTINGS/PERSONALIZATION PAGE**

#### ⚠️ PARTIAL: Loads Tags But May Not Sync
- **Current State:**
  - Loads tags on mount from `settingsService.getSettings()`
  - Saves tags via `settingsService.updateSettings()`
  - State management with `selectedTags` and `personalization.interestTags`
- **Issues:**
  - Tags loaded correctly (Line 173-180)
  - Save function includes tags (Line 310)
  - BUT: No immediate feed refresh after save
  - BUT: No confirmation that tags match onboarding
- **Location:** `app/settings/page.tsx` (Lines 162-324)

---

### 4. **FEED FILTERING - EVENTS**

#### ❌ PROBLEM: Uses "Some" Instead of Intersection
- **Current Logic:** 
  ```typescript
  where.tags = {
    some: {
      name: { in: params.tags },
    },
  }
  ```
- **Problem:** This shows events with ANY matching tag, not ALL tags required
- **Requirement:** Show ONLY events where `event.tags ∩ user.tags ≠ empty`
- **Current Behavior:** Shows events if at least ONE tag matches
- **Location:** `backend/src/services/event.service.ts` (Line 43-49)

#### ⚠️ ISSUE: No Default Tag Filtering
- **Current:** If no tags provided, shows ALL events
- **Required:** If user has tags, MUST filter by tags (unless search is active)
- **Location:** `backend/src/services/event.service.ts` (Line 36-64)

---

### 5. **FEED FILTERING - POSTS**

#### ❌ CRITICAL: NO TAG FILTERING EXISTS
- **Current State:** Posts have NO tags in database
- **Impact:** Posts cannot be filtered by user interests
- **Location:** `backend/src/services/post.service.ts`
- **Required Fix:**
  1. Add `PostTag` model to schema
  2. Add tag filtering to `getPosts()` service
  3. Enforce intersection logic

---

### 6. **EXPLORE PAGE**

#### ❌ PROBLEM: Doesn't Filter by Non-User Tags
- **Current:** Uses `excludeUser: true` but shows ALL events
- **Required:** Should show events with tags NOT in user's interestTags
- **Location:** `app/explore/page.tsx` (Line 25-30)
- **Backend:** Uses `excludeUserTags` parameter but logic is inverted

---

### 7. **API ENDPOINT INCONSISTENCIES**

#### ✅ EXISTS: User Preferences
- `GET /users/preferences` - Returns user tags
- `POST /users/preferences` - Saves user tags
- **Location:** `backend/src/routes/user.routes.ts` (Line 16-17)

#### ❌ MISSING: Dedicated Feed Endpoint
- No `/feed` endpoint - uses separate `/events` and `/posts`
- Should have unified feed endpoint with tag filtering

#### ⚠️ ISSUE: Feed Endpoints Don't Enforce Tags
- `GET /events` - Tag filtering is optional
- `GET /posts` - No tag filtering at all
- Should enforce tag filtering when user has tags selected

---

## 📋 REQUIRED FIXES

### PRIORITY 1: DATABASE SCHEMA
1. ✅ Add `PostTag` model to schema
2. ✅ Create migration for PostTag table
3. ✅ Update Post model to include tags relation

### PRIORITY 2: BACKEND SERVICES
1. ✅ Fix `eventService.getEvents()` - enforce tag intersection
2. ✅ Add tag filtering to `postService.getPosts()`
3. ✅ Ensure default behavior: if user has tags, filter by tags
4. ✅ Fix explore page logic (exclude user's tags)

### PRIORITY 3: API ENDPOINTS
1. ✅ Verify `/users/preferences` works correctly
2. ✅ Ensure feed endpoints enforce tag filtering
3. ✅ Add userId parameter to getEvents/getPosts for tag filtering

### PRIORITY 4: FRONTEND
1. ✅ Fix onboarding to ensure tags save
2. ✅ Fix settings to load/save tags correctly
3. ✅ Add feed refresh after settings save
4. ✅ Fix explore page to show non-user tags

---

## 🗂️ FILES TO MODIFY

### Backend:
1. `backend/prisma/schema.prisma` - Add PostTag model
2. `backend/src/services/post.service.ts` - Add tag filtering
3. `backend/src/services/event.service.ts` - Fix tag intersection logic
4. `backend/src/controllers/post.controller.ts` - Pass userId for filtering
5. `backend/src/controllers/event.controller.ts` - Enforce tag filtering
6. `backend/src/services/user.service.ts` - Verify updatePreferences works

### Frontend:
1. `app/onboarding/tags/page.tsx` - Ensure tags persist
2. `app/settings/page.tsx` - Add feed refresh after save
3. `app/feed/page.tsx` - Ensure tags are sent to backend
4. `app/explore/page.tsx` - Filter by non-user tags
5. `lib/api/services.ts` - Verify API calls include userId

---

## 🔄 DATA FLOW REQUIREMENTS

### Tag Selection → Save Flow:
1. **Onboarding:** Select tags → `POST /users/preferences` → Save to `UserSettings.interestTags`
2. **Settings:** Load tags → Display → Modify → `POST /users/preferences` → Save
3. **Verification:** Both paths save to same source (`UserSettings.interestTags`)

### Feed Loading Flow:
1. **Load User Tags:** Fetch from `UserSettings.interestTags`
2. **Filter Events:** Show only where `event.tags ∩ user.tags ≠ empty`
3. **Filter Posts:** Show only where `post.tags ∩ user.tags ≠ empty`
4. **Default:** If no user tags, show trending/global feed

### Explore Flow:
1. **Load User Tags:** Fetch from `UserSettings.interestTags`
2. **Filter Events:** Show only where `event.tags ∩ user.tags = empty`
3. **Purpose:** Discover content from tags user hasn't selected

---

## ✅ ACCEPTANCE CRITERIA

1. ✅ Tags selected in onboarding appear in Settings → Personalization
2. ✅ Tags saved in Settings persist and load correctly
3. ✅ Feed shows ONLY posts/events matching user's selected tags
4. ✅ Feed refreshes immediately after updating tags in Settings
5. ✅ Explore page shows content from tags user has NOT selected
6. ✅ If user has no tags, show global/trending feed
7. ✅ Search queries bypass tag filtering (current behavior is correct)

---

## 🚀 NEXT STEPS

1. Generate migration for PostTag
2. Update backend services with proper filtering
3. Fix frontend to ensure tag persistence
4. Test end-to-end flow
5. Verify intersection logic works correctly


