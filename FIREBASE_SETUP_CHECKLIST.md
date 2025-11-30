# Firebase Chat Setup Checklist

## ✅ Completed Steps

- [x] Firebase project created (`causeconnect-49d35`)
- [x] Firebase configuration values added to `.env.local`

## 🔄 Next Steps (Required)

### 1. Enable Firestore Database

1. Go to [Firebase Console](https://console.firebase.google.com/project/causeconnect-49d35)
2. Click on "Firestore Database" in the left sidebar
3. Click "Create database"
4. Choose **"Start in test mode"** for development (you can change security rules later)
5. Select a location for your database (choose the closest region to your users)
6. Click "Enable"

### 2. Configure Firestore Security Rules

After creating the database, go to the "Rules" tab and update the rules:

**For Development (Test Mode):**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**For Production (Recommended):**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /conversations/{conversationId} {
      // Users can read/write conversations they're part of
      allow read, write: if request.auth != null && 
                           resource.data.participants.hasAny([request.auth.uid]);
      
      allow create: if request.auth != null;
      
      match /messages/{messageId} {
        // Users can read/write messages in conversations they're part of
        allow read: if request.auth != null;
        allow create: if request.auth != null && 
                         request.resource.data.senderId == request.auth.uid;
        allow update: if request.auth != null && 
                         resource.data.senderId == request.auth.uid;
      }
    }
  }
}
```

**Note:** Since we're using JWT authentication (not Firebase Auth), you may need to use more permissive rules initially or implement Firebase Admin SDK for server-side verification.

### 3. Restart Development Server

After adding environment variables, you **must** restart your Next.js development server:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

The environment variables are loaded when the server starts, so changes won't take effect until you restart.

### 4. Verify Setup

1. Navigate to `/chat` page in your app
2. You should see the chat interface (not the setup message)
3. Check browser console for: `[Firebase] Firebase initialized successfully`
4. If you see errors, check that:
   - Firestore is enabled in Firebase Console
   - Environment variables are correct
   - Dev server was restarted after adding variables

## 🔍 Troubleshooting

### Error: "Firebase is not configured"
- Make sure `.env.local` file exists and contains all Firebase variables
- Restart your Next.js dev server
- Check that variable names start with `NEXT_PUBLIC_`

### Error: "Firestore not initialized"
- Verify Firestore Database is enabled in Firebase Console
- Check Firebase Console → Firestore Database → Data tab
- Make sure you've created the database (not just the project)

### Error: "Permission denied"
- Check Firestore Security Rules
- For development, use test mode rules (allow all)
- Make sure rules are published (click "Publish" after editing)

## 📚 Additional Resources

- [Firebase Console](https://console.firebase.google.com/project/causeconnect-49d35)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- See `CHAT_IMPLEMENTATION.md` for full implementation details



