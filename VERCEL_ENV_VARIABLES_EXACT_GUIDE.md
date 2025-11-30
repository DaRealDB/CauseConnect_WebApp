# 🎯 EXACT Vercel Environment Variables Guide

## Step-by-Step: What to Put in Each Box

For each environment variable in Vercel, here's **exactly** what to put and **where to get it**:

---

## 📋 Required Environment Variables

### 1️⃣ **NEXT_PUBLIC_SUPABASE_URL**

**What to put:**
```
https://xxxxxxxxxxxxx.supabase.co
```

**Where to get it:**
1. Go to your **Supabase Dashboard** (https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the **"Project URL"** (it looks like `https://xxxxx.supabase.co`)
5. Paste the entire URL into the Vercel box

**Example:**
```
https://abcdefghijklmnop.supabase.co
```

---

### 2️⃣ **NEXT_PUBLIC_SUPABASE_ANON_KEY**

**What to put:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjI5MDAwMCwiZXhwIjoxOTMxODY2MDAwfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Where to get it:**
1. Same page: **Supabase Dashboard** → **Settings** → **API**
2. Find **"Project API keys"**
3. Copy the **"anon public"** key (the long string starting with `eyJhbG...`)
4. Paste the entire key into the Vercel box (it's very long!)

**Important:** This key is safe to expose in client-side code (that's why it's called "anon/public")

---

### 3️⃣ **NEXT_PUBLIC_FIREBASE_API_KEY**

**What to put:**
```
AIzaSyC_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Where to get it:**
1. Go to **Firebase Console** (https://console.firebase.google.com)
2. Select your project
3. Click the **⚙️ Settings** icon → **Project settings**
4. Scroll to **"Your apps"** section
5. Find your **Web app** (or create one if you don't have it)
6. Copy the **"API Key"** (starts with `AIzaSy...`)
7. Paste into Vercel box

**Note:** If you're not using Firebase for chat, you can skip this and the other Firebase variables.

---

### 4️⃣ **NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN**

**What to put:**
```
your-project-name.firebaseapp.com
```

**Where to get it:**
1. Same Firebase Console page (Project settings)
2. In the **"Your apps"** section
3. Find **"authDomain"** in the config object
4. Copy it (format: `project-name.firebaseapp.com`)
5. Paste into Vercel box

**Example:**
```
causeconnect-abc123.firebaseapp.com
```

---

### 5️⃣ **NEXT_PUBLIC_FIREBASE_PROJECT_ID**

**What to put:**
```
your-project-id
```

**Where to get it:**
1. Same Firebase Console page
2. At the top, you'll see **"Project ID"** or find it in the config
3. Copy the project ID (usually lowercase with hyphens/numbers)
4. Paste into Vercel box

**Example:**
```
causeconnect-abc123
```

---

### 6️⃣ **NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET**

**What to put:**
```
your-project-id.appspot.com
```

**Where to get it:**
1. Same Firebase Console page
2. Find **"storageBucket"** in the config
3. Copy it (format: `project-id.appspot.com`)
4. Paste into Vercel box

**Example:**
```
causeconnect-abc123.appspot.com
```

---

### 7️⃣ **NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID**

**What to put:**
```
123456789012
```

**Where to get it:**
1. Same Firebase Console page
2. Find **"messagingSenderId"** in the config
3. Copy the number (usually 12 digits)
4. Paste into Vercel box

**Example:**
```
987654321012
```

---

### 8️⃣ **NEXT_PUBLIC_FIREBASE_APP_ID**

**What to put:**
```
1:123456789012:web:abcdefghijklmnop
```

**Where to get it:**
1. Same Firebase Console page
2. Find **"appId"** in the config
3. Copy the entire string (format: `1:numbers:web:letters`)
4. Paste into Vercel box

**Example:**
```
1:987654321012:web:1234567890abcdef
```

---

### 9️⃣ **NEXT_PUBLIC_API_URL** (Optional but Recommended)

**What to put:**
```
https://xxxxxxxxxxxxx.supabase.co/functions/v1
```

**Where to get it:**
1. Same as your Supabase URL above
2. Just add `/functions/v1` to the end
3. This tells your app to use Supabase Edge Functions

**Example:**
```
https://abcdefghijklmnop.supabase.co/functions/v1
```

**Note:** If you want to use the Express backend temporarily, you can set this to:
```
http://your-express-backend-url/api
```
or leave it blank to use the default.

---

## 🔒 Server-Side Only (Optional)

### 🔟 **SUPABASE_SERVICE_ROLE_KEY**

**What to put:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjE2Mjk4MDAwLCJleHAiOjE5MzE4NzQwMDB9.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Where to get it:**
1. **Supabase Dashboard** → **Settings** → **API**
2. Find **"Project API keys"**
3. Copy the **"service_role secret"** key
4. ⚠️ **IMPORTANT:** This key has full admin access - only use it server-side!

**Note:** Only add this if you have server-side API routes that need it. For most Next.js apps, you don't need this in Vercel.

---

## 📝 Quick Copy-Paste Checklist

Copy each value and paste into Vercel:

```
✅ NEXT_PUBLIC_SUPABASE_URL = [from Supabase Dashboard → Settings → API → Project URL]
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY = [from Supabase Dashboard → Settings → API → anon public key]
✅ NEXT_PUBLIC_FIREBASE_API_KEY = [from Firebase Console → Project Settings → API Key]
✅ NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = [from Firebase Console → Project Settings → authDomain]
✅ NEXT_PUBLIC_FIREBASE_PROJECT_ID = [from Firebase Console → Project Settings → Project ID]
✅ NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = [from Firebase Console → Project Settings → storageBucket]
✅ NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = [from Firebase Console → Project Settings → messagingSenderId]
✅ NEXT_PUBLIC_FIREBASE_APP_ID = [from Firebase Console → Project Settings → appId]
✅ NEXT_PUBLIC_API_URL = [same as SUPABASE_URL + /functions/v1]
```

---

## 🎯 Step-by-Step in Vercel UI

1. **Click "Add More"** button
2. **Key:** Type `NEXT_PUBLIC_SUPABASE_URL` (exactly like this, case-sensitive)
3. **Value:** Paste your Supabase Project URL
4. Click **"Add More"** again
5. Repeat for each variable above

---

## ✅ Verification

After adding all variables:

1. Double-check each key name is **exactly** correct (case-sensitive!)
2. Make sure all values are pasted completely (no spaces at start/end)
3. Click **"Deploy"** button
4. Check build logs - if you see errors about missing variables, you may have misspelled a key name

---

## 🔍 Troubleshooting

**"Variable not found" error:**
- Check key name spelling (case-sensitive!)
- Make sure `NEXT_PUBLIC_` prefix is included
- Verify no extra spaces

**"Invalid URL" error:**
- Check Supabase URL doesn't have trailing slash
- Verify Firebase values match your Firebase config exactly

**Build succeeds but app doesn't work:**
- Check browser console for errors
- Verify variables are available in browser (they start with `NEXT_PUBLIC_`)
- Make sure you redeployed after adding variables

---

## 💡 Pro Tip

You can also use the **"Import .env"** button:
1. Create a `.env.local` file locally with all variables
2. Click "Import .env" in Vercel
3. Paste the entire contents (without the variable names on the left)
4. Vercel will parse them automatically

---

**That's it! Add each variable one by one, then click Deploy! 🚀**

