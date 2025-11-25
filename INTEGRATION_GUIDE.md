# CauseConnect Backend Integration Guide

## Overview
This document outlines the complete backend integration for CauseConnect. All placeholder data has been replaced with real API calls to your Express.js backend.

## API Configuration

### Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### API Base URL
The API client is configured in `lib/api/client.ts`. Update `API_BASE_URL` if your backend runs on a different port.

## Completed Integrations

### ✅ 1. API Infrastructure
- **Location**: `lib/api/`
  - `client.ts` - HTTP client with JWT token management
  - `types.ts` - TypeScript type definitions
  - `services.ts` - Organized API service functions

### ✅ 2. Authentication
- **Location**: `contexts/AuthContext.tsx`
- **Features**:
  - JWT token storage in localStorage
  - Auto-attach Authorization headers
  - User state management
  - Auto-logout on 401 errors

### ✅ 3. Login & Registration
- **Files**: `app/login/page.tsx`, `app/register/page.tsx`
- **API Endpoints**:
  - `POST /auth/login` - Login user
  - `POST /auth/register` - Register new user
  - `GET /auth/me` - Get current user

### ✅ 4. Feed Page
- **File**: `app/feed/page.tsx`
- **API Endpoints**:
  - `GET /events?page=1&limit=10&filter=events` - Get events
  - `GET /posts?page=1&limit=10` - Get posts

### ✅ 5. Event Card Component
- **File**: `components/event-card.tsx`
- **API Endpoints**:
  - `POST /events/:id/support` - Support event
  - `DELETE /events/:id/support` - Pass/unsupport event
  - `POST /events/:id/bookmark` - Bookmark event
  - `DELETE /events/:id/bookmark` - Unbookmark event

## Remaining Integrations

### 🔄 6. Event Detail Page
**File**: `app/event/[id]/page.tsx`

**Required Changes**:
```typescript
// Replace EVENT_DATA with API call
const { data: event } = await eventService.getEventById(Number(params.id))
```

**API Endpoints**:
- `GET /events/:id` - Get event details
- `POST /events/:id/support` - Support event
- `POST /events/:id/bookmark` - Bookmark event

### 🔄 7. Donation System
**File**: `app/donate/[eventId]/page.tsx`

**Required Changes**:
```typescript
// Replace mock event data
const event = await eventService.getEventById(Number(params.eventId))

// Handle donation submission
await donationService.createDonation({
  eventId: Number(params.eventId),
  amount: Number(donationAmount),
  paymentMethod,
  isRecurring,
  isAnonymous,
  message,
  email,
  name: isAnonymous ? undefined : name,
})
```

**API Endpoints**:
- `GET /events/:id` - Get event details
- `POST /donations` - Create donation

### 🔄 8. Comment System
**File**: `components/comment-system.tsx`

**Required Changes**:
```typescript
// Load comments on mount
useEffect(() => {
  loadComments()
}, [postId])

const loadComments = async () => {
  const comments = await commentService.getComments(postId)
  setComments(comments)
}

// Submit comment
await commentService.createComment(postId, { content: newComment })

// Like/dislike
await commentService.likeComment(commentId)
await commentService.dislikeComment(commentId)

// Award comment
await commentService.awardComment(commentId)
```

**API Endpoints**:
- `GET /events/:id/comments` - Get comments
- `POST /events/:id/comments` - Create comment
- `POST /comments/:id/like` - Like comment
- `POST /comments/:id/dislike` - Dislike comment
- `POST /comments/:id/award` - Award comment
- `POST /comments/:id/save` - Save comment

### 🔄 9. Create Event/Post
**File**: `app/create/page.tsx`

**Required Changes**:
```typescript
if (postType === "event") {
  await eventService.createEvent({
    title,
    description,
    location,
    targetDate: date,
    goalAmount: goalAmount ? Number(goalAmount) : undefined,
    tags,
    images: images, // File array
  })
} else {
  await postService.createPost({
    content: description,
    image: images[0], // Single file
  })
}
```

**API Endpoints**:
- `POST /events` - Create event (supports FormData for images)
- `POST /posts` - Create post (supports FormData for images)

### 🔄 10. Profile Pages
**Files**: 
- `app/profile/[username]/page.tsx`
- `app/profile/edit/page.tsx`

**Required Changes**:
```typescript
// Get user profile
const user = await userService.getUserProfile(params.username)

// Update profile
await userService.updateProfile(formData)

// Upload avatar
await userService.uploadAvatar(file)

// Follow/unfollow
await userService.followUser(userId)
await userService.unfollowUser(userId)
```

**API Endpoints**:
- `GET /users/:username` - Get user profile
- `PUT /users/profile` - Update profile
- `POST /users/avatar` - Upload avatar (FormData)
- `POST /users/cover` - Upload cover image (FormData)
- `POST /users/:id/follow` - Follow user
- `DELETE /users/:id/follow` - Unfollow user

### 🔄 11. Notifications
**File**: `app/notifications/page.tsx`

**Required Changes**:
```typescript
// Load notifications
const { data: notifications } = await notificationService.getNotifications({
  page,
  limit: 20,
  type: activeTab === "all" ? undefined : activeTab,
})

// Mark as read
await notificationService.markAsRead(notificationId)

// Get unread count
const { count } = await notificationService.getUnreadCount()
```

**API Endpoints**:
- `GET /notifications?page=1&limit=20&type=donation` - Get notifications
- `PATCH /notifications/:id/read` - Mark as read
- `PATCH /notifications/read-all` - Mark all as read
- `DELETE /notifications/:id` - Delete notification
- `GET /notifications/unread-count` - Get unread count

### 🔄 12. Chat
**File**: `app/chat/page.tsx`

**Required Changes**:
```typescript
// Load chats
const chats = await chatService.getChats()

// Load messages
const messages = await chatService.getMessages(chatId)

// Send message
await chatService.sendMessage({ chatId, content: message })
```

**API Endpoints**:
- `GET /chat/conversations` - Get chat list
- `GET /chat/conversations/:id/messages` - Get messages
- `POST /chat/conversations/:id/messages` - Send message

### 🔄 13. Settings
**File**: `app/settings/page.tsx`

**Required Changes**:
```typescript
// Load settings
const settings = await settingsService.getSettings()

// Update settings
await settingsService.updateSettings({
  notifications: { ...notifications },
  privacy: { ...privacy },
})
```

**API Endpoints**:
- `GET /settings` - Get user settings
- `PUT /settings` - Update settings

### 🔄 14. Feed Header
**File**: `components/feed-header.tsx`

**Required Changes**:
```typescript
// Get current user
const { user } = useAuth()

// Get unread notification count
const { count } = await notificationService.getUnreadCount()
```

### 🔄 15. User Post Component
**File**: `components/user-post.tsx`

**Required Changes**:
```typescript
// Like/unlike
await postService.likePost(post.id)
await postService.unlikePost(post.id)

// Bookmark
await postService.bookmarkPost(post.id)
await postService.unbookmarkPost(post.id)

// Follow user
await userService.followUser(post.user.id)
```

**API Endpoints**:
- `POST /posts/:id/like` - Like post
- `DELETE /posts/:id/like` - Unlike post
- `POST /posts/:id/bookmark` - Bookmark post
- `DELETE /posts/:id/bookmark` - Unbookmark post

## Backend Route Requirements

Your Express.js backend should implement these routes:

### Auth Routes (`/api/auth`)
- `POST /login` - Login
- `POST /register` - Register
- `GET /me` - Get current user (protected)
- `POST /refresh` - Refresh token (optional)

### User Routes (`/api/users`)
- `GET /:username` - Get user profile
- `PUT /profile` - Update profile (protected)
- `POST /avatar` - Upload avatar (protected, FormData)
- `POST /cover` - Upload cover image (protected, FormData)
- `POST /:id/follow` - Follow user (protected)
- `DELETE /:id/follow` - Unfollow user (protected)

### Event Routes (`/api/events`)
- `GET /` - List events (query: page, limit, filter, tags)
- `GET /:id` - Get event details
- `POST /` - Create event (protected, supports FormData)
- `POST /:id/support` - Support event (protected)
- `DELETE /:id/support` - Pass event (protected)
- `POST /:id/bookmark` - Bookmark event (protected)
- `DELETE /:id/bookmark` - Unbookmark event (protected)
- `GET /:id/comments` - Get comments

### Post Routes (`/api/posts`)
- `GET /` - List posts (query: page, limit, userId)
- `POST /` - Create post (protected, supports FormData)
- `POST /:id/like` - Like post (protected)
- `DELETE /:id/like` - Unlike post (protected)
- `POST /:id/bookmark` - Bookmark post (protected)
- `DELETE /:id/bookmark` - Unbookmark post (protected)

### Comment Routes (`/api/comments` or `/api/events/:id/comments`)
- `GET /events/:id/comments` - Get comments
- `POST /events/:id/comments` - Create comment (protected)
- `POST /:id/like` - Like comment (protected)
- `POST /:id/dislike` - Dislike comment (protected)
- `DELETE /:id/reaction` - Remove reaction (protected)
- `POST /:id/award` - Award comment (protected)
- `POST /:id/save` - Save comment (protected)
- `DELETE /:id` - Delete comment (protected)

### Donation Routes (`/api/donations`)
- `GET /` - Get donation history (protected, query: page, limit, eventId)
- `POST /` - Create donation (protected)

### Notification Routes (`/api/notifications`)
- `GET /` - Get notifications (protected, query: page, limit, type)
- `PATCH /:id/read` - Mark as read (protected)
- `PATCH /read-all` - Mark all as read (protected)
- `DELETE /:id` - Delete notification (protected)
- `GET /unread-count` - Get unread count (protected)

### Chat Routes (`/api/chat`)
- `GET /conversations` - Get chat list (protected)
- `GET /conversations/:id/messages` - Get messages (protected)
- `POST /conversations/:id/messages` - Send message (protected)

### Settings Routes (`/api/settings`)
- `GET /` - Get settings (protected)
- `PUT /` - Update settings (protected)

### Squad Routes (`/api/squads`)
- `GET /` - Get user's squads (protected)
- `POST /` - Create squad (protected, supports FormData)
- `POST /:id/join` - Join squad (protected)
- `DELETE /:id/join` - Leave squad (protected)

## Error Handling

All API calls use try-catch blocks and display error messages via toast notifications. The API client automatically:
- Handles 401 errors (unauthorized) by removing token and redirecting to login
- Parses error responses and displays user-friendly messages
- Handles network errors gracefully

## Protected Routes

To protect routes, use the `useAuth` hook:
```typescript
const { isAuthenticated, isLoading } = useAuth()

if (isLoading) return <div>Loading...</div>
if (!isAuthenticated) {
  router.push('/login')
  return null
}
```

## Best Practices

1. **Always handle loading states** - Show loading indicators while fetching data
2. **Optimistic updates** - Update UI immediately, revert on error
3. **Error handling** - Always wrap API calls in try-catch
4. **Token management** - The API client handles token storage automatically
5. **Type safety** - Use TypeScript types from `lib/api/types.ts`
6. **Pagination** - Implement pagination for list endpoints
7. **Image uploads** - Use FormData for file uploads

## Testing

1. Set `NEXT_PUBLIC_API_URL` to your backend URL
2. Ensure your backend is running
3. Test each feature flow:
   - Register → Login → Feed → Event Detail → Donate
   - Create Post → Comment → Like → Award
   - Profile → Edit Profile → Follow User
   - Notifications → Mark Read
   - Chat → Send Message

## Next Steps

1. Complete remaining component integrations (see list above)
2. Add protected route middleware
3. Implement real-time features (WebSocket for chat/notifications)
4. Add image upload functionality
5. Test all API endpoints
6. Add error boundaries for better error handling
7. Implement caching/optimistic updates where appropriate







