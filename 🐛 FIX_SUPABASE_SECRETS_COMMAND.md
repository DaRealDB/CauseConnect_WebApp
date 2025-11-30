# 🐛 Fix: Supabase Secrets Command Error

## ❌ Error Encountered

```
Env name cannot start with SUPABASE_, skipping: SUPABASE_SERVICE_ROLE_KEY
No arguments found. Use --env-file to read from a .env file.
```

## 🔍 Root Cause

1. **Secret names starting with `SUPABASE_` are reserved** - Supabase CLI automatically provides these from your project config
2. **Wrong command syntax** - Using `KEY=value` format instead of `KEY value`

## ✅ Solution

### For Service Role Key:
Use `SERVICE_ROLE_KEY` (without `SUPABASE_` prefix):

```bash
supabase secrets set SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Correct Syntax:
```bash
# Format: supabase secrets set KEY "value"
supabase secrets set KEY "value with spaces"
supabase secrets set KEY value_without_spaces
```

**NOT:**
```bash
# ❌ Wrong format
supabase secrets set KEY=value
```

## 📋 All Secrets You Need to Set

Here are the correct commands:

```bash
# Database connection
supabase secrets set DATABASE_URL="postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres"

# Service role key (without SUPABASE_ prefix)
supabase secrets set SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# JWT secret
supabase secrets set JWT_SECRET="your-random-jwt-secret"

# Optional: Stripe
supabase secrets set STRIPE_SECRET_KEY="sk_test_xxxxx"
```

## ⚠️ Important Notes

1. **`SUPABASE_URL` and `SUPABASE_ANON_KEY`** are automatically available - don't set them as secrets
2. **Use quotes** around values with special characters
3. **Use `SERVICE_ROLE_KEY`** not `SUPABASE_SERVICE_ROLE_KEY`

## 🚀 Try Again

Run this command (with your actual service role key):

```bash
supabase secrets set SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yZ2piYmhjZG9jcHNidmRoZGZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDM0NDAzNiwiZXhwIjoyMDc5OTIwMDM2fQ.irBHxrQzeSb_2itEtwi4A1jH6Dl1kJLqaYscaJb9K5w"
```

---

**Status:** Use `SERVICE_ROLE_KEY` instead of `SUPABASE_SERVICE_ROLE_KEY`! 🚀

