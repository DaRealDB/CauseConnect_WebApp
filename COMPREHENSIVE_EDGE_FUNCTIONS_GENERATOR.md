# 🔧 Edge Functions Generator Script

## Overview

This document provides templates and patterns for generating all 87 Edge Functions needed for the CauseConnect migration.

---

## 📋 FUNCTION TEMPLATES

### Template 1: Simple GET Endpoint

```typescript
// supabase/functions/[function-name]/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors, addCorsHeaders } from '../_shared/cors.ts'
import { getUserFromRequest } from '../_shared/supabase.ts'
import { handleError, AppError } from '../_shared/errors.ts'
import { query } from '../_shared/db.ts'

serve(async (req: Request) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    // Optional: Require authentication
    const { user, error: authError } = await getUserFromRequest(req)
    if (authError || !user) {
      throw new AppError('Unauthorized', 401)
    }

    // Parse query params
    const url = new URL(req.url)
    const param1 = url.searchParams.get('param1')

    // Query database
    const results = await query(
      `SELECT * FROM table WHERE condition = $1`,
      [param1]
    )

    return addCorsHeaders(
      new Response(JSON.stringify(results), {
        headers: { 'Content-Type': 'application/json' },
      })
    )
  } catch (error) {
    return addCorsHeaders(handleError(error))
  }
})
```

### Template 2: POST Endpoint with Body

```typescript
serve(async (req: Request) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const { user, error: authError } = await getUserFromRequest(req)
    if (authError || !user) {
      throw new AppError('Unauthorized', 401)
    }

    // Parse request body
    const body = await req.json()
    const { field1, field2 } = body

    // Validate
    if (!field1) {
      throw new AppError('field1 is required', 400)
    }

    // Insert/Update database
    const result = await query(
      `INSERT INTO table (field1, field2, "userId") 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [field1, field2, user.id]
    )

    return addCorsHeaders(
      new Response(JSON.stringify(result[0]), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      })
    )
  } catch (error) {
    return addCorsHeaders(handleError(error))
  }
})
```

---

## 🗂️ FUNCTION LIST BY CATEGORY

### Authentication (6 functions)
1. `auth-register` - POST - User registration
2. `auth-login` - POST - User login  
3. `auth-me` - GET - Get current user (can use Supabase Auth directly)
4. `auth-refresh` - POST - Refresh token
5. `auth-logout` - POST - Logout
6. `auth-verify-email` - POST - Verify email

### Users (8 functions)
1. `user-profile` ✅ - GET - Get user by username
2. `user-search` ✅ - GET - Search users
3. `user-update` - PUT - Update profile
4. `user-avatar` - POST - Upload avatar
5. `user-cover` - POST - Upload cover
6. `user-follow` - POST - Follow user
7. `user-unfollow` - DELETE - Unfollow user
8. `user-activity` - GET - Get user activity

### Events (10 functions)
1. `event-list` ✅ - GET - List events
2. `event-detail` - GET - Get event by ID
3. `event-create` - POST - Create event
4. `event-update` - PUT - Update event
5. `event-delete` - DELETE - Delete event
6. `event-support` - POST - Support event
7. `event-unsupport` - DELETE - Unsupport event
8. `event-bookmark` - POST - Bookmark event
9. `event-unbookmark` - DELETE - Unbookmark event
10. `event-bookmarked` - GET - Get bookmarked events

### Posts (7 functions)
1. `post-list` - GET - List posts
2. `post-detail` - GET - Get post by ID
3. `post-create` - POST - Create post
4. `post-like` - POST - Like post
5. `post-unlike` - DELETE - Unlike post
6. `post-bookmark` - POST - Bookmark post
7. `post-participate` - POST - Participate in post

### Comments (6 functions)
1. `comment-list` - GET - Get comments
2. `comment-create` - POST - Create comment
3. `comment-like` - POST - Like comment
4. `comment-dislike` - POST - Dislike comment
5. `comment-award` - POST - Award comment
6. `comment-save` - POST - Save comment

### Donations (3 functions)
1. `donation-create` - POST - Create donation
2. `donation-list` - GET - Get donations
3. `donation-history` - GET - Get donation history

### Payments (6 functions)
1. `payment-intent` - POST - Create Stripe payment intent
2. `payment-confirm` - POST - Confirm payment
3. `payment-webhook` - POST - Stripe webhook
4. `payment-methods` - GET/POST - Manage payment methods
5. `payment-recurring` - GET/POST/DELETE - Manage recurring donations
6. `payment-paypal` - POST - PayPal integration

### Squads (15 functions)
1. `squad-list` - GET - List squads
2. `squad-detail` - GET - Get squad by ID
3. `squad-create` - POST - Create squad
4. `squad-update` - PATCH - Update squad
5. `squad-delete` - DELETE - Delete squad
6. `squad-search` - GET - Search squads
7. `squad-join` - POST - Join squad
8. `squad-leave` - DELETE - Leave squad
9. `squad-members` - GET - Get squad members
10. `squad-posts` - GET - Get squad posts
11. `squad-post-create` - POST - Create squad post
12. `squad-comments` - GET - Get comments
13. `squad-comment-create` - POST - Create comment
14. `squad-reaction` - POST - Toggle reaction
15. `squad-manage-member` - DELETE/PATCH - Remove/change role

### Settings (5 functions)
1. `settings-get` - GET - Get settings
2. `settings-update` - PUT - Update settings
3. `settings-impact` - GET - Get impact stats
4. `settings-export` - GET - Export user data
5. `settings-blocked-users` - GET/POST/DELETE - Manage blocked users

### Notifications (4 functions)
1. `notification-list` - GET - Get notifications
2. `notification-read` - PATCH - Mark as read
3. `notification-read-all` - PATCH - Mark all as read
4. `notification-unread-count` - GET - Get unread count

### Tags (2 functions)
1. `tag-list` - GET - Get all tags
2. `tag-create-or-find` - POST - Create or find tag

### Explore (1 function)
1. `explore-content` - GET - Get explore content

### Custom Feeds (4 functions)
1. `custom-feed-list` - GET - List custom feeds
2. `custom-feed-create` - POST - Create custom feed
3. `custom-feed-update` - PUT - Update custom feed
4. `custom-feed-delete` - DELETE - Delete custom feed

### Chat Helpers (3 functions)
1. `chat-user-profile` ✅ - GET - Get user profile for chat
2. `chat-block-user` - POST - Block user
3. `chat-unblock-user` - DELETE - Unblock user

**Total: 87 functions**
**Completed: 3**
**Remaining: 84**

---

## 🚀 BATCH GENERATION STRATEGY

Given the large number of functions, here's a systematic approach:

1. **Create function generator script** (optional)
2. **Generate functions by category** (easier to test)
3. **Use templates** to ensure consistency
4. **Test each category** before moving to next

---

## 📝 NEXT STEPS

1. Continue creating critical functions manually
2. Create generator script for batch creation
3. Focus on most-used endpoints first


