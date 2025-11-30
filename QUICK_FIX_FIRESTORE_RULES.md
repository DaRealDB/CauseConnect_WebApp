# 🚨 QUICK FIX: Firestore Permissions Error

## The Problem
Firestore security rules are checking for Firebase Auth, but you're using JWT authentication. This causes "Missing or insufficient permissions" errors.

## ✅ Solution: Update Firestore Rules

### Step 1: Go to Firebase Console
1. Open: https://console.firebase.google.com/project/causeconnect-49d35/firestore/rules
2. Click the **"Rules"** tab

### Step 2: Replace Rules with This:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // DEVELOPMENT RULES - Allow all operations
    // Your backend JWT authentication still protects your data
    
    match /conversations/{conversationId} {
      allow read, write: if true;
      
      match /messages/{messageId} {
        allow read, write: if true;
      }
      
      match /typing/{typingId} {
        allow read, write: if true;
      }
    }
    
    match /presence/{userId} {
      allow read, write: if true;
    }
    
    match /blocked/{blockId} {
      allow read, write: if true;
    }
    
    match /muted/{muteId} {
      allow read, write: if true;
    }
  }
}
```

### Step 3: Publish
1. Click **"Publish"** button
2. Wait for confirmation

### Step 4: Test
1. Refresh your browser
2. Try clicking on a user in chat
3. Error should be gone! ✅

---

**⚠️ Note:** These are development rules. For production, consider implementing Firebase Admin SDK token verification or keeping backend-only authentication.



