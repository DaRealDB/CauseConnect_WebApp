# Railway Deployment Guide for CauseConnect Backend

This guide will help you deploy the CauseConnect Express.js backend to Railway.

## 📋 Prerequisites

- [ ] GitHub account
- [ ] Railway account (free tier available at [railway.app](https://railway.app))
- [ ] All environment variables ready
- [ ] Stripe account (if using payments)
- [ ] SMTP credentials (Gmail app password or other email service)

## 🚀 Step-by-Step Deployment

### Step 1: Prepare Your Code

1. **Test local build**:
   ```bash
   cd backend
   npm run build
   # Should create dist/ folder with compiled JavaScript
   ```

2. **Verify Prisma setup**:
   ```bash
   npx prisma generate
   # Should generate Prisma Client
   ```

3. **Commit and push to GitHub**:
   ```bash
   git add .
   git commit -m "chore: prepare for Railway deployment"
   git push origin main
   ```

### Step 2: Create Railway Account & Project

1. **Sign up/Login**:
   - Go to [railway.app](https://railway.app)
   - Sign in with GitHub

2. **Create New Project**:
   - Click **"New Project"**
   - Select **"Deploy from GitHub repo"**
   - Choose your repository

### Step 3: Add PostgreSQL Database

1. **In Railway Dashboard**:
   - Click **"+ New"**
   - Select **"Database"** → **"Add PostgreSQL"**
   - Railway will automatically create a PostgreSQL database

2. **Get Database URL**:
   - Click on the PostgreSQL service
   - Go to **"Variables"** tab
   - Copy the `DATABASE_URL` value
   - ⚠️ **Save this - you'll need it!**

### Step 4: Configure Backend Service

1. **Add Backend Service**:
   - Click **"+ New"** in your project
   - Select **"GitHub Repo"**
   - Choose your repository again (this creates the backend service)

2. **Configure Service Settings**:
   - Click on the backend service
   - Go to **"Settings"** tab
   - **Root Directory**: Set to `backend`
   - **Start Command**: Leave as default (or set to `npm start`)
   - **Build Command**: Leave as default (Railway auto-detects)

3. **Connect Database**:
   - In backend service, click **"Variables"** tab
   - Click **"Add Reference"**
   - Select **PostgreSQL** → **DATABASE_URL**
   - This automatically links your database

### Step 5: Add Environment Variables

In the backend service → **Variables** tab, add:

#### Required Variables

```env
# Database (auto-added when you reference PostgreSQL)
DATABASE_URL=${PostgreSQL.DATABASE_URL}

# JWT Secrets (generate secure random strings)
JWT_ACCESS_SECRET=your-access-secret-min-32-characters
JWT_REFRESH_SECRET=your-refresh-secret-min-32-characters
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server Configuration
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://your-frontend.vercel.app

# CORS (include your frontend URLs)
CORS_ORIGINS=https://your-frontend.vercel.app,https://your-custom-domain.com

# SMTP Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_... (or sk_test_... for testing)
STRIPE_PUBLISHABLE_KEY=pk_live_... (or pk_test_... for testing)
STRIPE_WEBHOOK_SECRET=whsec_...

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./uploads
```

**Important**: Railway automatically sets `PORT` environment variable, so your server should use `process.env.PORT || 3001`.

### Step 6: Configure Build Settings

1. **In Railway Dashboard** → Backend Service → **Settings**:

   - **Build Command**: 
     ```bash
     npm install && npm run build && npx prisma generate
     ```

   - **Start Command**:
     ```bash
     npm start
     ```
     Or Railway will auto-detect from `package.json`

2. **Add Build Step for Prisma Migrations**:
   
   You can either:
   
   **Option A**: Add a custom build command (Recommended):
   ```
   npm install && npm run build && npx prisma generate && npx prisma migrate deploy
   ```
   
   **Option B**: Use Railway's post-deploy hook (see below)

### Step 7: Run Database Migrations

You have two options:

#### Option A: Manual Migration (First Time)

1. **Open Railway CLI** (or use Railway dashboard terminal):
   ```bash
   npm i -g @railway/cli
   railway login
   railway link
   ```

2. **Run migrations**:
   ```bash
   cd backend
   railway run npx prisma migrate deploy
   ```

#### Option B: Automatic Migration (Recommended)

Create a startup script that runs migrations automatically. We'll add this to your deployment.

### Step 8: Deploy

1. **Railway will automatically deploy** when you push to GitHub

2. **Or manually trigger deployment**:
   - Go to **Deployments** tab
   - Click **"Redeploy"**

3. **Check deployment logs**:
   - Go to **Deployments** tab
   - Click on the latest deployment
   - Watch build and startup logs

### Step 9: Get Your Backend URL

1. **After successful deployment**:
   - Go to backend service → **Settings**
   - Scroll to **"Networking"** section
   - Copy the **"Public Domain"** URL (e.g., `https://your-app.up.railway.app`)

2. **Your API will be available at**:
   ```
   https://your-app.up.railway.app/api
   ```

## 🔧 Configuration Files

### Create Railway-Specific Build Script

Create `backend/railway.json` (optional):

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build && npx prisma generate"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Update package.json Scripts

Ensure your `backend/package.json` has:

```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/server.js",
    "postinstall": "npx prisma generate",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate deploy"
  }
}
```

## 🔍 Post-Deployment Verification

### 1. Check Health Endpoint

```bash
curl https://your-app.up.railway.app/health
```

Should return:
```json
{"status":"ok","timestamp":"2024-..."}
```

### 2. Test API Endpoint

```bash
curl https://your-app.up.railway.app/api/auth/register
```

Should return an error (not a 404) - this means API is working.

### 3. Check Logs

- Go to Railway Dashboard → Backend Service → **Deployments**
- Click on latest deployment → **View Logs**
- Look for:
  - ✅ `Server running on port...`
  - ✅ `Prisma Client generated`
  - ❌ No database connection errors

### 4. Verify Environment Variables

- Check Railway Dashboard → Variables
- Ensure all required variables are set
- Verify `DATABASE_URL` is connected to PostgreSQL

## 🔐 Stripe Webhook Configuration

1. **Get Your Railway URL**:
   ```
   https://your-app.up.railway.app/api/payments/webhook
   ```

2. **Configure in Stripe Dashboard**:
   - Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
   - Click **"Add endpoint"**
   - URL: `https://your-app.up.railway.app/api/payments/webhook`
   - Events to listen for:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `charge.refunded`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
   - Copy the **Webhook Signing Secret** (`whsec_...`)
   - Add it to Railway environment variables as `STRIPE_WEBHOOK_SECRET`

3. **Redeploy** backend after adding webhook secret

## 🌐 Custom Domain (Optional)

1. **In Railway Dashboard**:
   - Go to backend service → **Settings**
   - Scroll to **"Networking"**
   - Click **"Generate Domain"** or **"Custom Domain"**

2. **Add Custom Domain**:
   - Enter your domain (e.g., `api.yourdomain.com`)
   - Follow DNS configuration instructions

3. **Update Environment Variables**:
   - Update `CORS_ORIGINS` to include custom domain
   - Update frontend `NEXT_PUBLIC_API_URL` to use custom domain

## 🔄 Continuous Deployment

Railway automatically deploys on every push to your connected branch (usually `main`).

To change the branch:
- Go to Settings → **"Source"**
- Select your branch

## 📊 Monitoring & Logs

### View Logs

1. **Real-time Logs**:
   - Railway Dashboard → Backend Service
   - **"Deployments"** tab → Click deployment → **Logs**

2. **Stream Logs Locally**:
   ```bash
   railway logs
   ```

### Metrics

- Railway Dashboard shows:
  - CPU usage
  - Memory usage
  - Network traffic
  - Request count

## 🐛 Troubleshooting

### Build Fails

**Error**: Build command fails
- **Solution**: Check build logs, ensure `npm run build` works locally
- Verify all dependencies are in `dependencies` (not `devDependencies`)

### Database Connection Error

**Error**: `Can't reach database server`
- **Solution**: 
  - Verify PostgreSQL service is running
  - Check `DATABASE_URL` is correctly referenced
  - Ensure database service is in same Railway project

### Prisma Client Not Generated

**Error**: `PrismaClient is not defined`
- **Solution**: 
  - Add `npx prisma generate` to build command
  - Or add `"postinstall": "prisma generate"` to package.json

### Migrations Not Applied

**Error**: Table doesn't exist
- **Solution**: 
  - Run migrations manually: `railway run npx prisma migrate deploy`
  - Or add to build command: `npx prisma migrate deploy`

### Port Binding Error

**Error**: `Port already in use`
- **Solution**: Railway sets `PORT` automatically. Your server should use:
  ```typescript
  const PORT = process.env.PORT || 3001
  ```

### CORS Errors

**Error**: CORS policy blocked
- **Solution**: 
  - Update `CORS_ORIGINS` in Railway environment variables
  - Include your frontend URL (Vercel URL)

## 💰 Railway Pricing

- **Free Tier**: $5 credit/month (enough for testing)
- **Starter Plan**: $5/month (after free credit)
- PostgreSQL: Included in Railway projects

## 📝 Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | Auto-added when referencing PostgreSQL |
| `JWT_ACCESS_SECRET` | ✅ | 32+ character random string |
| `JWT_REFRESH_SECRET` | ✅ | 32+ character random string |
| `PORT` | ✅ | Auto-set by Railway (use `process.env.PORT`) |
| `NODE_ENV` | ✅ | Set to `production` |
| `FRONTEND_URL` | ✅ | Your frontend URL (Vercel) |
| `CORS_ORIGINS` | ✅ | Comma-separated frontend URLs |
| `SMTP_*` | ✅ | Email configuration |
| `STRIPE_*` | ✅ | Stripe API keys |
| `MAX_FILE_SIZE` | ❌ | Optional (default: 5MB) |
| `UPLOAD_DIR` | ❌ | Optional (default: ./uploads) |

## ✅ Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Railway account created
- [ ] PostgreSQL database added
- [ ] Backend service created
- [ ] Root directory set to `backend`
- [ ] All environment variables added
- [ ] Database migrations run
- [ ] Health endpoint works: `/health`
- [ ] API endpoint accessible: `/api/...`
- [ ] CORS configured correctly
- [ ] Stripe webhook configured (if using)
- [ ] Frontend updated with backend URL

## 🎯 Quick Deployment Command

Once configured, Railway auto-deploys on git push:

```bash
git push origin main
```

Railway will automatically:
1. Detect changes
2. Build your application
3. Run migrations (if configured)
4. Deploy to production

## 📚 Additional Resources

- [Railway Documentation](https://docs.railway.app/)
- [Railway Discord](https://discord.gg/railway)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-railway)

---

**Need Help?** Check Railway logs and documentation, or reach out to Railway support.



image.png

