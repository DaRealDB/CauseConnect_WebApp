# 🚀 Quick Start: Deploy Backend to Railway

This is a condensed guide to get CauseConnect backend deployed on Railway quickly.

## Prerequisites ✅

- [ ] GitHub repository with code
- [ ] Railway account ([railway.app](https://railway.app))
- [ ] Environment variables ready

## 🎯 10-Minute Deployment

### Step 1: Push to GitHub (1 min)

```bash
git add .
git commit -m "chore: prepare for Railway deployment"
git push origin main
```

### Step 2: Create Railway Project (2 min)

1. Go to [railway.app](https://railway.app) → Sign in with GitHub
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your repository

### Step 3: Add PostgreSQL (2 min)

1. In Railway dashboard → Click **"+ New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Wait for database to provision
4. Copy the `DATABASE_URL` (you'll need it)

### Step 4: Add Backend Service (2 min)

1. Click **"+ New"** → **"GitHub Repo"** → Select your repo
2. **Configure service**:
   - Click on the backend service
   - **Settings** → **Root Directory**: Set to `backend`
   - **Settings** → **Start Command**: `npm start`

### Step 5: Connect Database (1 min)

1. Backend service → **Variables** tab
2. Click **"Add Reference"**
3. Select **PostgreSQL** → **DATABASE_URL**
4. ✅ Database is now connected!

### Step 6: Add Environment Variables (2 min)

In backend service → **Variables** tab, add:

```
JWT_ACCESS_SECRET=your-32-char-secret-here
JWT_REFRESH_SECRET=your-32-char-secret-here
NODE_ENV=production
FRONTEND_URL=https://your-frontend.vercel.app
CORS_ORIGINS=https://your-frontend.vercel.app
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Step 7: Run Migrations (1 min)

```bash
# Install Railway CLI (one time)
npm i -g @railway/cli

# Run migrations
cd backend
railway login
railway link
railway run npx prisma migrate deploy
```

### Step 8: Deploy!

Railway automatically deploys. Check:
- **Deployments** tab → Watch build logs
- Wait for ✅ "Deployed successfully"

### Step 9: Get Your URL

Backend service → **Settings** → **Networking** → Copy **Public Domain**

Your API: `https://your-app.up.railway.app/api`

## 🔍 Verify It Works

```bash
curl https://your-app.up.railway.app/health
```

Should return: `{"status":"ok","timestamp":"..."}`

## ⚙️ Configure Build

Railway auto-detects your build. If you need custom:

**Settings** → **Build Command**:
```
npm install && npm run build && npx prisma generate && npx prisma migrate deploy
```

## 🔐 Stripe Webhook Setup

1. Get your Railway URL: `https://your-app.up.railway.app/api/payments/webhook`
2. Add to Stripe Dashboard → Webhooks
3. Copy webhook secret (`whsec_...`)
4. Add to Railway variables: `STRIPE_WEBHOOK_SECRET`

## ✅ Done!

Your backend is live! Update your frontend's `NEXT_PUBLIC_API_URL` to:
```
https://your-app.up.railway.app/api
```

---

**📚 Full Guide**: See [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) for detailed instructions.

**🐛 Troubleshooting**: Check deployment logs in Railway dashboard.








