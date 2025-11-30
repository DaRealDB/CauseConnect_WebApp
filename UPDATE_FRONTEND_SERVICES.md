# 🔄 Update Frontend Services to Use Supabase Edge Functions

## Overview

This guide shows how to update `lib/api/services.ts` to route requests to Supabase Edge Functions when available, while maintaining backward compatibility with the Express backend.

---

## 🎯 Strategy

1. **Hybrid Approach:** Services will try Supabase Edge Functions first, fall back to Express if function doesn't exist
2. **Gradual Migration:** Update services incrementally as Edge Functions are deployed
3. **Backward Compatible:** Existing code continues to work during migration

---

## 📝 Update Pattern

For each service method, use this pattern:

```typescript
async getSomething(params) {
  // Try Supabase Edge Function first
  if (IS_SUPABASE && SUPABASE_FUNCTION_EXISTS) {
    try {
      return await supabaseEdgeFunctions.get('function-name', params)
    } catch (error) {
      if (error?.status === 404) {
        // Function not found, fall back to Express
      } else {
        throw error
      }
    }
  }
  
  // Fall back to Express backend
  return await apiClient.get('/express/endpoint', params)
}
```

---

## ✅ Functions Ready for Routing

These Edge Functions are ready to route to:

### Auth (5 functions)
- ✅ `auth-me` → `/auth/me`
- ✅ `auth-register` → `/auth/register`
- ✅ `auth-login` → `/auth/login`
- ✅ `auth-refresh` → `/auth/refresh`
- ✅ `auth-logout` → `/auth/logout`

### Users (4 functions)
- ✅ `user-profile` → `/users/:username`
- ✅ `user-search` → `/users/search`
- ✅ `user-update` → `/users/profile` (PUT)
- ✅ `user-follow` → `/users/:id/follow` (POST)

### Events (8 functions)
- ✅ `event-list` → `/events`
- ✅ `event-detail` → `/events/:id`
- ✅ `event-create` → `/events` (POST)
- ✅ `event-update` → `/events/:id` (PUT)
- ✅ `event-delete` → `/events/:id` (DELETE)
- ✅ `event-support` → `/events/:id/support` (POST)
- ✅ `event-bookmark` → `/events/:id/bookmark` (POST)
- ✅ `event-bookmarked` → `/events/bookmarked`

### Posts (4 functions)
- ✅ `post-list` → `/posts`
- ✅ `post-create` → `/posts` (POST)
- ✅ `post-like` → `/posts/:id/like` (POST)
- ✅ `post-bookmark` → `/posts/:id/bookmark` (POST)

### Comments (3 functions)
- ✅ `comment-list` → `/comments/events/:eventId/comments`
- ✅ `comment-create` → `/comments` (POST)
- ✅ `comment-like` → `/comments/:id/like` (POST)

### Donations (2 functions)
- ✅ `donation-create` → `/donations` (POST)
- ✅ `donation-list` → `/donations`

### Settings (2 functions)
- ✅ `settings-get` → `/settings`
- ✅ `settings-update` → `/settings` (PUT)

### Notifications (4 functions) ✅ Complete
- ✅ `notification-list` → `/notifications`
- ✅ `notification-unread-count` → `/notifications/unread-count`
- ✅ `notification-read` → `/notifications/:id/read` (PATCH)
- ✅ `notification-read-all` → `/notifications/read-all` (PATCH)

### Squads (5 functions)
- ✅ `squad-list` → `/squads`
- ✅ `squad-detail` → `/squads/:id`
- ✅ `squad-create` → `/squads` (POST)
- ✅ `squad-join` → `/squads/:id/join` (POST)
- ✅ `squad-leave` → `/squads/:id/leave` (DELETE)
- ✅ `squad-posts` → `/squads/:id/posts`
- ✅ `squad-post-create` → `/squads/:id/posts` (POST)

### Tags & Explore (2 functions)
- ✅ `tag-list` → `/tags`
- ✅ `explore-content` → `/explore`

### Storage (1 function)
- ✅ `storage-upload` → Generic upload endpoint

---

## 🔧 Implementation Example

Here's how to update `lib/api/services.ts`:

```typescript
import { apiClient } from './client'
import { supabaseEdgeFunctions } from './supabase-client'
import { isUsingSupabase } from './supabase-routing'

const IS_SUPABASE = isUsingSupabase()

// Helper function for routing
async function routeRequest<T>(
  supabaseFunction: string | null,
  expressEndpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    data?: any
    queryParams?: Record<string, string>
  } = {}
): Promise<T> {
  // Try Supabase first if function exists
  if (IS_SUPABASE && supabaseFunction) {
    try {
      if (options.method === 'GET') {
        return await supabaseEdgeFunctions.get<T>(supabaseFunction, options.queryParams)
      } else if (options.method === 'POST') {
        return await supabaseEdgeFunctions.post<T>(supabaseFunction, options.data)
      }
      // ... other methods
    } catch (error: any) {
      // If function not found (404), fall back to Express
      if (error?.status === 404) {
        console.warn(`Supabase function ${supabaseFunction} not found, using Express`)
      } else {
        throw error
      }
    }
  }

  // Fall back to Express
  if (options.method === 'GET') {
    return await apiClient.get<T>(expressEndpoint)
  }
  // ... other methods
}

// Updated service example
export const eventService = {
  async getEvents(params?: any) {
    const queryParams = new URLSearchParams()
    // ... build query params

    return routeRequest<PaginatedResponse<Event>>(
      'event-list', // Supabase function name
      `/events?${queryParams.toString()}`, // Express endpoint
      {
        method: 'GET',
        queryParams: Object.fromEntries(queryParams),
      }
    )
  },

  async getEventById(id: string | number) {
    return routeRequest<Event>(
      'event-detail', // Supabase function
      `/events/${id}`, // Express endpoint
      {
        method: 'GET',
        queryParams: { id: id.toString() },
      }
    )
  },
}
```

---

## 📋 Complete Service Updates

Update each service in `lib/api/services.ts`:

### 1. Auth Service ✅
```typescript
export const authService = {
  async login(credentials) {
    return routeRequest('auth-login', '/auth/login', {
      method: 'POST',
      data: credentials,
    })
  },
  async register(data) {
    return routeRequest('auth-register', '/auth/register', {
      method: 'POST',
      data,
    })
  },
  async getCurrentUser() {
    return routeRequest('auth-me', '/auth/me', { method: 'GET' })
  },
  // ... etc
}
```

### 2. User Service ✅
```typescript
export const userService = {
  async getUserProfile(username) {
    return routeRequest('user-profile', `/users/${username}`, {
      method: 'GET',
      queryParams: { username },
    })
  },
  async searchUsers(query, limit) {
    return routeRequest('user-search', `/users/search?query=${query}`, {
      method: 'GET',
      queryParams: { query, limit: limit?.toString() },
    })
  },
  // ... etc
}
```

### 3. Event Service ✅
```typescript
export const eventService = {
  async getEvents(params) {
    return routeRequest('event-list', '/events', {
      method: 'GET',
      queryParams: params,
    })
  },
  // ... etc
}
```

---

## 🚀 Deployment Steps

1. **Deploy Edge Functions first**
   ```bash
   supabase functions deploy auth-login
   supabase functions deploy event-list
   # ... etc
   ```

2. **Update services.ts** to use routing helper

3. **Test with frontend**
   - Verify requests go to Edge Functions
   - Verify fallback to Express works
   - Test all key flows

4. **Monitor logs**
   - Check Edge Function logs in Supabase Dashboard
   - Check Express backend logs
   - Fix any routing issues

---

## ✅ Verification Checklist

- [ ] All Edge Functions deployed
- [ ] Services updated with routing
- [ ] Frontend tested with Supabase
- [ ] Fallback to Express works
- [ ] No breaking changes
- [ ] All flows working

---

**After updating services, your app will automatically use Supabase Edge Functions when available!**


