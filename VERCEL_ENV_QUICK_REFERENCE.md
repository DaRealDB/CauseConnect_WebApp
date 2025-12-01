# ⚡ Vercel Environment Variables - Quick Reference Card

## 📋 Copy-Paste This List (Fill in Your Values)

Add these one by one in Vercel's Environment Variables section:

---

## ✅ REQUIRED - Add These First

### 1. NEXT_PUBLIC_SUPABASE_URL
```
Key: NEXT_PUBLIC_SUPABASE_URL
Value: https://[your-project-ref].supabase.co
📍 Get from: Supabase Dashboard → Settings → API → Project URL
```

### 2. NEXT_PUBLIC_SUPABASE_ANON_KEY
```
Key: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...[very long string]
📍 Get from: Supabase Dashboard → Settings → API → anon public key
```

### 3. NEXT_PUBLIC_API_URL
```
Key: NEXT_PUBLIC_API_URL
Value: https://[your-project-ref].supabase.co/functions/v1
📍 Same as SUPABASE_URL but add /functions/v1 at the end
```

---

## 🔥 FIREBASE - Add These if Using Firebase Chat

### 4. NEXT_PUBLIC_FIREBASE_API_KEY
```
Key: NEXT_PUBLIC_FIREBASE_API_KEY
Value: AIzaSy...[your-api-key]
📍 Get from: Firebase Console → Project Settings → Your apps → API Key
```

### 5. NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
```
Key: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
Value: [your-project].firebaseapp.com
📍 Get from: Firebase Console → Project Settings → authDomain
```

### 6. NEXT_PUBLIC_FIREBASE_PROJECT_ID
```
Key: NEXT_PUBLIC_FIREBASE_PROJECT_ID
Value: [your-project-id]
📍 Get from: Firebase Console → Project Settings → Project ID
```

### 7. NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
```
Key: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
Value: [your-project-id].appspot.com
📍 Get from: Firebase Console → Project Settings → storageBucket
```

### 8. NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
```
Key: NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
Value: [12-digit-number]
📍 Get from: Firebase Console → Project Settings → messagingSenderId
```

### 9. NEXT_PUBLIC_FIREBASE_APP_ID
```
Key: NEXT_PUBLIC_FIREBASE_APP_ID
Value: 1:[numbers]:web:[letters]
📍 Get from: Firebase Console → Project Settings → appId
```

---

## 📝 Example Values (What They Look Like)

```
NEXT_PUBLIC_SUPABASE_URL = https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjI5MDAwMCwiZXhwIjoxOTMxODY2MDAwfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_API_URL = https://abcdefghijklmnop.supabase.co/functions/v1
NEXT_PUBLIC_FIREBASE_API_KEY = AIzaSyC_1234567890abcdefghijklmnopqrstuv
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = myproject-abc123.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID = myproject-abc123
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = myproject-abc123.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = 987654321012
NEXT_PUBLIC_FIREBASE_APP_ID = 1:987654321012:web:1234567890abcdef
```

---

## 🎯 Step-by-Step in Vercel UI

For EACH variable:

1. **Click "Add More"** button (or use the "+" icon)
2. In the **"Key"** field: Type the exact key name (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
3. In the **"Value"** field: Paste your value from Supabase/Firebase
4. The variable is now added
5. Repeat for the next variable

---

## ⚠️ Important Notes

- ✅ Key names are **case-sensitive** - type exactly as shown
- ✅ All keys starting with `NEXT_PUBLIC_` are safe for client-side
- ✅ Don't add spaces before/after values
- ✅ Values can be very long (especially the keys) - that's normal
- ⚠️ Don't share these values publicly

---

## 🚀 After Adding All Variables

1. **Double-check** all keys are spelled correctly
2. **Click "Deploy"** button at the bottom
3. **Watch the build logs** - if you see "undefined" errors, you may have misspelled a key

---

**Need help finding your values? See `VERCEL_ENV_VARIABLES_EXACT_GUIDE.md` for detailed instructions!**



