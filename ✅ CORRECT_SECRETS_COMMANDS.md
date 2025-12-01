# ✅ Correct Supabase Secrets Commands

## 🚫 Problem

You tried:
```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=value  # ❌ Wrong!
```

**Issues:**
1. Can't use `SUPABASE_` prefix (auto-provided by Supabase)
2. Wrong syntax: `KEY=value` should be `KEY "value"`

## ✅ Correct Commands

### Set Service Role Key (Without SUPABASE_ prefix):

```bash
supabase secrets set SERVICE_ROLE_KEY "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yZ2piYmhjZG9jcHNidmRoZGZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDM0NDAzNiwiZXhwIjoyMDc5OTIwMDM2fQ.irBHxrQzeSb_2itEtwi4A1jH6Dl1kJLqaYscaJb9K5w"
```

### Set Database URL:

```bash
supabase secrets set DATABASE_URL "postgresql://postgres:[YOUR_PASSWORD]@db.orgjbbhcdocpsbvdhdfj.supabase.co:5432/postgres"
```

**Replace `[YOUR_PASSWORD]` with your actual database password!**

### Generate and Set JWT Secret:

```bash
# Generate random secret
openssl rand -base64 32

# Then set it (copy the output from above)
supabase secrets set JWT_SECRET "your-generated-secret-here"
```

### Set Supabase URL (optional - but useful):

```bash
supabase secrets set SUPABASE_URL "https://orgjbbhcdocpsbvdhdfj.supabase.co"
```

Wait - actually, `SUPABASE_URL` and `SUPABASE_ANON_KEY` are automatically available in Edge Functions, so you might not need to set them. But you CAN set custom ones.

## 📋 All Required Secrets

Run these commands in order:

```bash
# 1. Service Role Key (use your actual key)
supabase secrets set SERVICE_ROLE_KEY "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yZ2piYmhjZG9jcHNidmRoZGZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDM0NDAzNiwiZXhwIjoyMDc5OTIwMDM2fQ.irBHxrQzeSb_2itEtwi4A1jH6Dl1kJLqaYscaJb9K5w"

# 2. Database URL (replace [PASSWORD] with your password!)
supabase secrets set DATABASE_URL "postgresql://postgres:[PASSWORD]@db.orgjbbhcdocpsbvdhdfj.supabase.co:5432/postgres"

# 3. JWT Secret (generate one)
JWT_SECRET=$(openssl rand -base64 32)
supabase secrets set JWT_SECRET "$JWT_SECRET"

# 4. Supabase URL (optional - auto-provided, but explicit is fine)
supabase secrets set SUPABASE_URL "https://orgjbbhcdocpsbvdhdfj.supabase.co"
```

## ✅ Verify Secrets

```bash
supabase secrets list
```

Should show all your secrets.

## 🔑 Important Notes

1. **`SUPABASE_URL` and `SUPABASE_ANON_KEY`** are automatically injected into Edge Functions
2. **Use `SERVICE_ROLE_KEY`** (without `SUPABASE_` prefix)
3. **Command format:** `supabase secrets set KEY "value"` (space, not `=`)
4. **Quotes required** if value has special characters

---

**Try the corrected command now!** 🚀



