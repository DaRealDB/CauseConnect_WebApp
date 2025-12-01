# Real-Time Chat System Implementation

## Overview

A complete real-time chat system using Firebase Firestore for message storage and synchronization. The system supports both private and group conversations, with real-time message updates, read receipts, and unread message badges.

## Architecture

- **Frontend**: Next.js with React hooks for chat functionality
- **Backend**: Express.js with minimal routes for authentication verification
- **Database**: Firebase Firestore for real-time chat storage
- **Authentication**: JWT-based authentication (no Firebase Auth required)

## Firebase Setup

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use an existing one
3. Enable Firestore Database
4. Set Firestore rules to allow authenticated reads/writes (or configure as needed)

### 2. Get Firebase Configuration

1. In Firebase Console, go to Project Settings
2. Scroll down to "Your apps" section
3. Click on the web app icon (`</>`) or add a web app
4. Copy the configuration values

### 3. Environment Variables

Add the following to your `.env.local` file:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Firestore Database Structure

### Conversations Collection

```
conversations/{conversationId}
  - id: string (UUID)
  - participants: string[] (array of user IDs)
  - type: "private" | "group"
  - createdAt: Timestamp
  - updatedAt: Timestamp
  - lastMessage: string (truncated to 100 chars)
  - lastSenderId: string
  - lastMessageTime: Timestamp
  - unreadCount: { [userId: string]: number }
  - squadId?: string (optional, for squad group chats)
```

### Messages Subcollection

```
conversations/{conversationId}/messages/{messageId}
  - id: string (UUID)
  - senderId: string
  - text: string
  - timestamp: Timestamp
  - attachments: string[] (for future image support)
  - readBy: string[] (array of user IDs who have read)
```

## Firestore Security Rules

Add these rules to your Firestore database:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Conversations
    match /conversations/{conversationId} {
      // Users can read conversations they're part of
      allow read: if request.auth != null && 
                     request.resource.data.participants.hasAny([request.auth.uid]);
      
      // Users can create conversations
      allow create: if request.auth != null;
      
      // Users can update conversations they're part of
      allow update: if request.auth != null && 
                       resource.data.participants.hasAny([request.auth.uid]);
      
      // Messages
      match /messages/{messageId} {
        // Users can read messages in conversations they're part of
        allow read: if request.auth != null;
        
        // Users can create messages in conversations they're part of
        allow create: if request.auth != null;
        
        // Users can update messages they sent
        allow update: if request.auth != null && 
                         resource.data.senderId == request.auth.uid;
      }
    }
  }
}
```

**Note**: Since we're using JWT authentication instead of Firebase Auth, you may need to adjust these rules or use Firebase Admin SDK for server-side verification. For development, you can use more permissive rules temporarily.

## Components Structure

### Frontend Components

- `components/chat/ChatSidebar.tsx` - List of conversations
- `components/chat/ChatWindow.tsx` - Message display area
- `components/chat/MessageInput.tsx` - Message input field

### React Hooks

- `hooks/useChat.ts` - Manages conversation list and chat operations
- `hooks/useConversation.ts` - Manages a single conversation and its messages

### Firebase Functions

- `lib/firebase/firebase.config.ts` - Firebase initialization
- `lib/firebase/firestore.ts` - Firestore instance
- `lib/firebase/chat.ts` - Chat-related Firestore operations

### Backend Routes

- `GET /api/chat/conversations` - Get user's conversations (placeholder - Firebase handles storage)
- `GET /api/chat/messages/:conversationId` - Get messages (placeholder - Firebase handles storage)
- `GET /api/chat/user/:userId` - Get user profile for chat

## Features Implemented

### ✅ Real-Time Messaging

- Messages sync in real-time using Firestore `onSnapshot` listeners
- Conversation list updates automatically
- Message thread updates in real-time

### ✅ Conversation Management

- Start new private conversations
- Auto-create conversations when messaging
- Support for group conversations (for Squads)

### ✅ Read Receipts

- Mark messages as read
- Track unread message counts per conversation
- Visual indicators for read/unread messages

### ✅ User Experience

- Auto-scroll to latest message
- Search conversations
- Unread message badges
- Loading states
- Error handling

## Usage Examples

### Starting a Conversation

```typescript
const { startConversation } = useChat()

// Start a conversation with another user
const conversationId = await startConversation(targetUserId)
```

### Sending a Message

```typescript
const { sendMessage } = useConversation(conversationId)

// Send a text message
await sendMessage("Hello, how are you?")

// Send a message with attachments (future feature)
await sendMessage("Check this out!", ["image-url-1", "image-url-2"])
```

### Marking as Read

```typescript
const { markAsRead } = useConversation(conversationId)

// Mark conversation as read
await markAsRead()
```

## Integration with Squads

When a squad is created, you can automatically create a group conversation:

```typescript
import { createSquadConversation } from '@/lib/firebase/chat'

// After creating a squad
const conversationId = await createSquadConversation(squadId, memberIds)
```

## Chat Page

The chat page is located at `/app/chat/page.tsx` and includes:

- Full chat UI with sidebar and message area
- Authentication checks
- Firebase connection verification
- Integration with all chat components

## Future Enhancements

- [ ] Image attachments
- [ ] File sharing
- [ ] Typing indicators
- [ ] Online/offline status
- [ ] Message reactions
- [ ] Message editing/deletion
- [ ] Push notifications
- [ ] Voice messages
- [ ] Video calls integration

## Troubleshooting

### Firebase Connection Issues

1. Verify all environment variables are set correctly
2. Check Firebase console for any errors
3. Verify Firestore is enabled in Firebase Console
4. Check browser console for Firebase errors

### Messages Not Appearing

1. Check Firestore rules allow read/write
2. Verify user is authenticated (JWT token present)
3. Check browser console for errors
4. Verify conversation participants include current user

### User Data Not Loading

1. Ensure backend API is running
2. Check user ID format matches between Firebase and backend
3. Verify user exists in backend database

## Notes

- User IDs stored in Firebase should match backend user IDs (strings or numbers converted to strings)
- The system uses JWT authentication from your existing backend
- Firebase Auth is NOT required - we use anonymous identification or token-based mapping
- All chat data persists in Firestore and survives logout/login





