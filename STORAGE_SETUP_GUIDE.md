# 📦 Supabase Storage Setup Guide

## Overview

This guide will help you set up Supabase Storage buckets for file uploads (avatars, covers, events, posts, squad avatars).

---

## 🚀 Step-by-Step Setup

### Step 1: Create Storage Buckets

1. Go to your Supabase Dashboard
2. Navigate to **Storage** (left sidebar)
3. Click **"New bucket"**

Create the following buckets:

#### 1. `avatars` (Public)
- **Name:** `avatars`
- **Public bucket:** ✅ Yes
- **File size limit:** 5 MB
- **Allowed MIME types:** `image/jpeg, image/png, image/gif, image/webp`

#### 2. `covers` (Public)
- **Name:** `covers`
- **Public bucket:** ✅ Yes
- **File size limit:** 10 MB
- **Allowed MIME types:** `image/jpeg, image/png, image/gif, image/webp`

#### 3. `events` (Public)
- **Name:** `events`
- **Public bucket:** ✅ Yes
- **File size limit:** 10 MB
- **Allowed MIME types:** `image/jpeg, image/png, image/gif, image/webp`

#### 4. `posts` (Public)
- **Name:** `posts`
- **Public bucket:** ✅ Yes
- **File size limit:** 10 MB
- **Allowed MIME types:** `image/jpeg, image/png, image/gif, image/webp`

#### 5. `squad-avatars` (Public)
- **Name:** `squad-avatars`
- **Public bucket:** ✅ Yes
- **File size limit:** 5 MB
- **Allowed MIME types:** `image/jpeg, image/png, image/gif, image/webp`

---

### Step 2: Set Storage Policies

Go to **Storage** → **Policies** and create the following policies:

#### Policy 1: Public Read Access

**For all buckets:**

```sql
-- Run this in SQL Editor for each bucket

-- For avatars bucket
CREATE POLICY "Public read access for avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- For covers bucket
CREATE POLICY "Public read access for covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'covers');

-- For events bucket
CREATE POLICY "Public read access for events"
ON storage.objects FOR SELECT
USING (bucket_id = 'events');

-- For posts bucket
CREATE POLICY "Public read access for posts"
ON storage.objects FOR SELECT
USING (bucket_id = 'posts');

-- For squad-avatars bucket
CREATE POLICY "Public read access for squad-avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'squad-avatars');
```

#### Policy 2: Authenticated Upload

**For all buckets:**

```sql
-- Run this in SQL Editor for each bucket

-- For avatars bucket
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated'
);

-- For covers bucket
CREATE POLICY "Authenticated users can upload covers"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'covers' AND
  auth.role() = 'authenticated'
);

-- For events bucket
CREATE POLICY "Authenticated users can upload events"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'events' AND
  auth.role() = 'authenticated'
);

-- For posts bucket
CREATE POLICY "Authenticated users can upload posts"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'posts' AND
  auth.role() = 'authenticated'
);

-- For squad-avatars bucket
CREATE POLICY "Authenticated users can upload squad-avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'squad-avatars' AND
  auth.role() = 'authenticated'
);
```

#### Policy 3: Users Can Update Own Files

**For all buckets:**

```sql
-- Users can update files they own (based on path structure: userId/filename)
-- For avatars bucket
CREATE POLICY "Users can update own avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- For covers bucket
CREATE POLICY "Users can update own covers"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'covers' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- For events bucket
CREATE POLICY "Users can update own events"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'events' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- For posts bucket
CREATE POLICY "Users can update own posts"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'posts' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- For squad-avatars bucket
CREATE POLICY "Users can update own squad-avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'squad-avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

#### Policy 4: Users Can Delete Own Files

**For all buckets:**

```sql
-- Users can delete files they own
-- For avatars bucket
CREATE POLICY "Users can delete own avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- For covers bucket
CREATE POLICY "Users can delete own covers"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'covers' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- For events bucket
CREATE POLICY "Users can delete own events"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'events' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- For posts bucket
CREATE POLICY "Users can delete own posts"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'posts' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- For squad-avatars bucket
CREATE POLICY "Users can delete own squad-avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'squad-avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## ✅ Verification

After setup, verify:

1. ✅ All 5 buckets created
2. ✅ All buckets are public
3. ✅ Policies are applied (check Storage → Policies)
4. ✅ Test upload via Edge Function `storage-upload`

---

## 📝 Usage in Edge Functions

Your Edge Functions already use Supabase Storage:

- `event-create` - Uploads to `events` bucket
- `post-create` - Uploads to `posts` bucket
- `squad-create` - Uploads to `squad-avatars` bucket
- `storage-upload` - Generic upload function for all buckets

**Example usage:**

```typescript
// In any Edge Function
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const { error } = await supabase.storage
  .from('avatars')
  .upload(`${userId}/${filename}`, file, {
    contentType: file.type,
  })

const { data } = supabase.storage
  .from('avatars')
  .getPublicUrl(`${userId}/${filename}`)
```

---

## 🔒 Security Notes

- ✅ Public buckets allow anyone to read files (needed for public URLs)
- ✅ Only authenticated users can upload
- ✅ Users can only update/delete their own files (based on path structure)
- ⚠️ File size limits are enforced at bucket level
- ⚠️ MIME type restrictions help prevent malicious uploads

---

**Storage is ready to use after completing this setup!**


