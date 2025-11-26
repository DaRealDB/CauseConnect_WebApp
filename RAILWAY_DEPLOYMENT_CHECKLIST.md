# Railway Deployment Pre-Flight Checklist

Use this checklist before deploying to Railway to ensure everything works correctly.

## 🔍 Pre-Deployment Checks

### Code Preparation
- [ ] **Build succeeds locally**
  ```bash
  cd backend
  npm run build
  ```
  - Creates `dist/` folder
  - No TypeScript errors
  - Build completes successfully

- [ ] **Prisma Client generates**
  ```bash
  npx prisma generate
  ```
  - No errors
  - Prisma Client generated

- [ ] **Code pushed to GitHub**
  - All changes committed
  - Pushed to main branch (or your deployment branch)

### Environment Variables Ready
- [ ] **JWT Secrets prepared**
  - `JWT_ACCESS_SECRET` - 32+ character random string
  - `JWT_REFRESH_SECRET` - 32+ character random string
  - Generate with: `openssl rand -base64 32`

- [ ] **SMTP credentials ready**
  - Gmail app password or other SMTP credentials
  - `SMTP_USER` - Email address
  - `SMTP_PASS` - App password

- [ ] **Stripe keys ready** (if using payments)
  - `STRIPE_SECRET_KEY` - Stripe secret key
  - `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key

- [ ] **Frontend URL known**
  - Vercel URL or custom domain
  - For `FRONTEND_URL` and `CORS_ORIGINS`

### Railway Account
- [ ] **Railway account created**
  - Signed up at [railway.app](https://railway.app)
  - GitHub account connected

## 🚀 Deployment Steps

### Step 1: Create Project
- [ ] Project created in Railway
- [ ] GitHub repository connected

### Step 2: Database Setup
- [ ] PostgreSQL service added
- [ ] Database provisioned and running
- [ ] `DATABASE_URL` copied (for reference)

### Step 3: Backend Service
- [ ] Backend service created
- [ ] Root directory set to `backend`
- [ ] Start command: `npm start` (or auto-detected)

### Step 4: Database Connection
- [ ] PostgreSQL service connected to backend
- [ ] `DATABASE_URL` referenced in backend variables
- [ ] Connection verified (will test on deploy)

### Step 5: Environment Variables
Add all required variables in Railway:

- [ ] `DATABASE_URL` - Referenced from PostgreSQL (auto-added)
- [ ] `JWT_ACCESS_SECRET` - Added
- [ ] `JWT_REFRESH_SECRET` - Added
- [ ] `JWT_ACCESS_EXPIRES_IN` - Added (default: 15m)
- [ ] `JWT_REFRESH_EXPIRES_IN` - Added (default: 7d)
- [ ] `PORT` - Auto-set by Railway (or set to 3001)
- [ ] `NODE_ENV` - Set to `production`
- [ ] `FRONTEND_URL` - Your frontend URL
- [ ] `CORS_ORIGINS` - Comma-separated frontend URLs
- [ ] `SMTP_HOST` - Added (e.g., smtp.gmail.com)
- [ ] `SMTP_PORT` - Added (e.g., 587)
- [ ] `SMTP_SECURE` - Added (false for 587)
- [ ] `SMTP_USER` - Added
- [ ] `SMTP_PASS` - Added
- [ ] `STRIPE_SECRET_KEY` - Added (if using)
- [ ] `STRIPE_PUBLISHABLE_KEY` - Added (if using)
- [ ] `STRIPE_WEBHOOK_SECRET` - Added (after webhook setup)
- [ ] `MAX_FILE_SIZE` - Added (optional, default: 5242880)
- [ ] `UPLOAD_DIR` - Added (optional, default: ./uploads)

### Step 6: Build Configuration
- [ ] Build command configured (or auto-detected)
  - Recommended: `npm install && npm run build && npx prisma generate`
- [ ] Start command: `npm start`

### Step 7: Database Migrations
- [ ] Migrations ready to run
- [ ] Railway CLI installed (for running migrations)
  ```bash
  npm i -g @railway/cli
  ```

### Step 8: Initial Deployment
- [ ] Deployment triggered (automatic or manual)
- [ ] Build logs show success
- [ ] No build errors in logs
- [ ] Server starts successfully

## ✅ Post-Deployment Verification

### Database
- [ ] Migrations run successfully
  ```bash
  railway run npx prisma migrate deploy
  ```
- [ ] Database connection works
- [ ] Tables created (check logs)

### API Health
- [ ] Health endpoint works:
  ```bash
  curl https://your-app.up.railway.app/health
  ```
  Returns: `{"status":"ok","timestamp":"..."}`

- [ ] API endpoints accessible:
  ```bash
  curl https://your-app.up.railway.app/api/auth/register
  ```
  Should return error (not 404) - means API is working

### Logs
- [ ] No database connection errors
- [ ] No missing environment variable errors
- [ ] Server running message appears
- [ ] Port binding successful

### Functionality
- [ ] Can register new user (if frontend connected)
- [ ] Can login (if frontend connected)
- [ ] API returns expected responses

## 🔐 Stripe Webhook Setup (if using)

- [ ] Stripe webhook endpoint created:
  - URL: `https://your-app.up.railway.app/api/payments/webhook`
- [ ] Webhook events configured:
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `charge.refunded`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
- [ ] Webhook signing secret copied (`whsec_...`)
- [ ] `STRIPE_WEBHOOK_SECRET` added to Railway variables
- [ ] Backend redeployed after adding webhook secret

## 🌐 Frontend Integration

- [ ] Backend URL obtained: `https://your-app.up.railway.app`
- [ ] Frontend `NEXT_PUBLIC_API_URL` updated
- [ ] Frontend redeployed with new backend URL
- [ ] CORS allows frontend URL
- [ ] Frontend can communicate with backend

## 📊 Monitoring Setup

- [ ] Railway dashboard shows metrics
- [ ] Logs are accessible
- [ ] Deployment history visible

## 🔄 Continuous Deployment

- [ ] Auto-deploy on git push enabled
- [ ] Correct branch connected (usually `main`)
- [ ] Test deployment after push

## 🐛 Troubleshooting Items

If issues found, check:

- [ ] **Build logs** - Any build errors?
- [ ] **Deployment logs** - Server startup errors?
- [ ] **Environment variables** - All required vars set?
- [ ] **Database connection** - PostgreSQL running?
- [ ] **Migrations** - Run successfully?
- [ ] **Port binding** - Using `process.env.PORT`?
- [ ] **CORS** - Frontend URL allowed?

## 📝 Notes

After deployment, note:
- Railway URL: `https://________________.up.railway.app`
- API URL: `https://________________.up.railway.app/api`
- Database status: ________________
- Issues found: ________________
- Issues resolved: ________________

---

**✅ Ready to Deploy?** Once all items are checked, proceed with deployment!

**❌ Issues Found?** Fix them before deploying to production.

