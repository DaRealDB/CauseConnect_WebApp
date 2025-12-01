# 🚀 DEPLOY NOW - Quick Start

## 3 Simple Steps to Production

### Step 1: Database (15 min)

1. **Supabase Dashboard** → **SQL Editor**
2. Copy/paste `supabase/migrations/001_initial_schema.sql` → Run
3. Copy/paste `supabase/migrations/002_rls_policies.sql` → Run
4. **Storage** → Create 5 buckets (avatars, covers, events, posts, squad-avatars) - all public

### Step 2: Edge Functions (20 min)

```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
cd /home/daryld.bacusmo/Documents/Programming/CauseConnect_WebApp
./deploy-all-functions.sh
```

### Step 3: Frontend (20 min)

1. Push to GitHub
2. Connect to Vercel
3. Add 3 environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_API_URL`
4. Deploy!

**Total: ~1 hour to production!** ⏱️

---

## 📖 Need More Detail?

- **Complete Guide:** `DEPLOYMENT_COMPLETE_GUIDE.md`
- **Step-by-Step:** `FINAL_COMPLETE_DEPLOYMENT_GUIDE.md`
- **Quick Reference:** `START_DEPLOYMENT_HERE.md`

---

**Ready? Start with Step 1!** 🚀



