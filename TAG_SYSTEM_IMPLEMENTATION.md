# Tag System Implementation Summary

## Overview

This implementation adds a **canonical tag system** that:
- Eliminates duplicate/variant tags through normalization
- Uses canonical Tag IDs for all tag references
- Supports custom tag creation with automatic deduplication
- Maintains backward compatibility during migration

## What Was Changed

### Backend Changes

#### 1. Database Schema (`backend/prisma/schema.prisma`)
- ✅ Added `Tag` model with `canonicalName` (unique, normalized)
- ✅ Added `UserTag` join table for user interests
- ✅ Updated `PostTag` and `EventTag` to reference `Tag.id` (nullable for migration)
- ✅ Kept `name` fields for backward compatibility

#### 2. Tag Service (`backend/src/services/tag.service.ts`)
- ✅ `createOrFindTag()` - Normalizes and creates/finds canonical tags
- ✅ `normalizeTagName()` - Trims, lowercases, collapses spaces
- ✅ `getAllTags()` - Lists tags for autocomplete
- ✅ `linkTagsToEvent()` / `linkTagsToPost()` - Links content to canonical tags

#### 3. Tag Controller & Routes
- ✅ `GET /api/tags` - List all tags (for autocomplete)
- ✅ `POST /api/tags/create-or-find` - Create or find tag (prevents duplicates)
- ✅ `GET /api/tags/:id` - Get tag by ID

#### 4. User Preferences Service (`backend/src/services/user.service.ts`)
- ✅ Updated `updatePreferences()` to use canonical tags via UserTag
- ✅ Updated `getPreferences()` to return canonical tag IDs
- ✅ Automatic migration from legacy `interestTags` array to UserTag

### Migration Files

- ✅ `TAG_SYSTEM_MIGRATION.md` - Migration guide
- ✅ `normalize_tags.sql` - SQL script to normalize existing data

## What Still Needs to Be Done

### Critical (Before Deployment)

1. **Run Migration**
   ```bash
   cd backend
   npx prisma migrate dev --name add_canonical_tag_system
   npx prisma generate
   ```

2. **Run Data Normalization**
   ```bash
   # Connect to database and run:
   psql $DATABASE_URL -f prisma/migrations/normalize_tags.sql
   ```

3. **Update Feed/Event/Post Services** (TODO: #7)
   - Update `event.service.ts` to filter by `tagId` instead of `name`
   - Update `post.service.ts` to filter by `tagId` instead of `name`
   - Query UserTag to get user's tag IDs for filtering

4. **Update Settings Service** (TODO: #9)
   - Update `settings.service.ts` to use UserTag instead of `interestTags` array
   - Return tag IDs with metadata in `getSettings()`

### Frontend Changes (TODO: #10)

1. **Settings → Personalization**
   - Add "Add custom tag" input with autocomplete
   - Use tag IDs instead of strings
   - Show canonical tag names

2. **Feed Filtering**
   - Use tag IDs for filtering
   - Fetch tags from backend (not hardcoded)
   - Sync with UserTag changes

3. **Onboarding**
   - Use tag service for saving tags
   - Use canonical tag IDs

## Testing Checklist

- [ ] Run migration without errors
- [ ] Run normalization script without errors
- [ ] Create new tag via POST /api/tags/create-or-find
- [ ] Try creating duplicate tag (should return existing)
- [ ] Update user preferences with tag names → verify UserTag entries created
- [ ] Feed filtering by user tags works correctly
- [ ] Settings shows saved tags correctly
- [ ] Custom tag creation in settings works
- [ ] No duplicate filters appear in UI

## API Endpoints

### GET /api/tags?search=poverty&limit=10
List tags with optional search.

### POST /api/tags/create-or-find
Body: `{ name: "Poverty & Hunger" }`
Returns: `{ id: "...", name: "Poverty & Hunger", canonicalName: "poverty & hunger" }`

### GET /api/users/preferences
Returns: `{ tags: ["tagId1", "tagId2"], tagDetails: [...] }`

### PUT /api/users/preferences
Body: `{ tags: ["tagName1", "tagName2"] }`
Creates/finds canonical tags and updates UserTag entries.

## Normalization Rules

1. **Trim whitespace** from both ends
2. **Convert to lowercase** for canonical comparison
3. **Collapse multiple spaces** to single space
4. **Case-insensitive** matching for duplicates

Example:
- "Poverty" → canonical: "poverty"
- "poverty " → canonical: "poverty"
- "Poverty & Hunger" → canonical: "poverty & hunger"

## Next Steps

1. Run migrations
2. Update feed services to use tag IDs
3. Update frontend to use new tag system
4. Test thoroughly
5. Deploy
