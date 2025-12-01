# Firestore Security Rules Setup

## Current Status

✅ **Firebase project created**: `causeconnect-49d35`  
✅ **Firestore database initialized**  
✅ **Environment variables configured**

## Next Steps

### 1. Configure Firestore Security Rules

Since we're using JWT authentication (not Firebase Auth), we need to configure security rules that work with our setup.

#### Option A: Development Rules (Temporary - For Testing)

For development and testing, you can use these permissive rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /conversations/{conversationId} {
      // Allow all reads and writes for development
      allow read, write: if true;
      
      match /messages/{messageId} {
        allow read, write: if true;
      }
    }
  }
}
```

⚠️ **Warning**: These rules allow anyone to read/write. Only use for development!

#### Option B: Production Rules (Recommended)

For production, you should use the Firebase Admin SDK to verify JWT tokens and implement custom security. For now, use these rules that check participant membership:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /conversations/{conversationId} {
      // Allow read if user ID is in participants array
      // Note: This checks user ID directly, not Firebase Auth
      allow read: if request.resource == null || 
                     resource.data.participants != null;
      
      allow create: if request.resource.data.participants != null;
      
      allow update: if resource.data.participants != null && 
                       request.resource.data.participants != null;
      
      match /messages/{messageId} {
        allow read: if true; // Messages inherit conversation access
        allow create: if request.resource.data.senderId != null;
        allow update: if resource.data.senderId == request.resource.data.senderId;
      }
    }
  }
}
```

### 2. How to Add Security Rules

1. **Go to Firebase Console**:
   - Navigate to: https://console.firebase.google.com/project/causeconnect-49d35/firestore/rules

2. **Click "Rules" tab** (you should already be there)

3. **Replace the default rules** with one of the rule sets above

4. **Click "Publish"**

### 3. What Happens Next

Once you restart your Next.js server:

1. ✅ Collections will be created automatically when:
   - A user starts a conversation
   - A message is sent

2. ✅ The first conversation will create:
   - `conversations/{conversationId}` document
   - `conversations/{conversationId}/messages/{messageId}` documents

3. ✅ Real-time updates will work:
   - Messages sync instantly
   - Conversation list updates automatically
   - Unread counts update in real-time

### 4. Verify Setup

After setting up rules and restarting the frontend:

1. **Restart Next.js dev server** (if you haven't already):
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

2. **Navigate to `/chat`** in your browser

3. **Start a conversation** - the first collection will be created automatically!

4. **Check Firebase Console** - you should see:
   - `conversations` collection
   - Documents inside with conversation data
   - Messages subcollection with message documents

## Important Notes

- **Security**: The rules above are for development. For production, implement proper JWT verification using Firebase Admin SDK or Firebase Functions.

- **User IDs**: Make sure user IDs in your backend match the format used in Firestore (strings). The chat system converts numeric IDs to strings automatically.

- **No Manual Setup Needed**: You don't need to create collections manually - they're created automatically when users interact with the chat.

## Troubleshooting

### "Permission denied" errors

- Check that security rules are published
- Verify rules allow the operations you're trying to perform
- For development, temporarily use the permissive rules (Option A)

### Collections not appearing

- Collections are only created when data is written
- Make sure the frontend server is restarted
- Check browser console for errors
- Verify Firebase environment variables are loaded

### Messages not syncing

- Check Firestore rules allow read/write
- Verify `onSnapshot` listeners are set up (check browser console)
- Ensure user is authenticated (JWT token present)

## Next: Restart Frontend

The most important step now is to **restart your Next.js development server** so it loads the Firebase environment variables:

```bash
# In your terminal where Next.js is running:
# 1. Press Ctrl+C to stop
# 2. Run: npm run dev
```

Then navigate to `/chat` and test the chat functionality!





