# Vercel Deployment Guide for CauseConnect

This guide will help you deploy the CauseConnect frontend to Vercel and ensure everything works correctly.

## 📋 Pre-Deployment Checklist

### ✅ Before You Start

- [ ] Backend is deployed and accessible (Render, Railway, Heroku, etc.)
- [ ] Database is set up and migrations are applied
- [ ] All environment variables are ready
- [ ] Domain name is configured (optional)
- [ ] Stripe account is set up with production keys (or test keys for testing)

## 🚀 Step-by-Step Deployment

### Step 1: Prepare Your Code

1. **Remove build error ignores** (for production):
   ```bash
   # Edit next.config.mjs - Remove or comment out:
   # typescript: { ignoreBuildErrors: true }
   # eslint: { ignoreDuringBuilds: true }
   ```

2. **Test local build**:
   ```bash
   npm run build
   # Fix any TypeScript or build errors before deploying
   ```

3. **Verify environment variables** are in `.env.example` (not committed)

### Step 2: Push to GitHub

```bash
git add .
git commit -m "chore: prepare for Vercel deployment"
git push origin main
```

### Step 3: Deploy to Vercel

#### Option A: Using Vercel Dashboard (Recommended)

1. **Go to [vercel.com](https://vercel.com)** and sign in with GitHub

2. **Click "Add New Project"**

3. **Import your repository**:
   - Select your GitHub repository
   - Click "Import"

4. **Configure Project**:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (root of your repo)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

5. **Add Environment Variables** (⚠️ IMPORTANT):
   Click "Environment Variables" and add:

   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.com/api
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_... (or pk_test_... for testing)
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-key (optional)
   NODE_ENV=production
   ```

6. **Click "Deploy"**

#### Option B: Using Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```
   Follow the prompts:
   - Set up and deploy? **Yes**
   - Which scope? Select your account
   - Link to existing project? **No**
   - Project name? `causeconnect` (or your choice)
   - Directory? `./`
   - Override settings? **No**

4. **Add environment variables**:
   ```bash
   vercel env add NEXT_PUBLIC_API_URL
   vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
   vercel env add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
   ```

5. **Deploy to production**:
   ```bash
   vercel --prod
   ```

### Step 4: Configure Environment Variables

After initial deployment, add environment variables in Vercel Dashboard:

1. Go to your project → **Settings** → **Environment Variables**

2. Add each variable:
   - **Name**: `NEXT_PUBLIC_API_URL`
   - **Value**: Your backend API URL (e.g., `https://your-app.onrender.com/api`)
   - **Environment**: Production, Preview, Development (select all)

   Repeat for:
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (optional)
   - `NODE_ENV` (set to `production`)

3. **Redeploy** after adding environment variables:
   - Go to **Deployments** tab
   - Click the three dots (⋯) on the latest deployment
   - Click **Redeploy**

### Step 5: Update Backend CORS Settings

Ensure your backend allows requests from your Vercel domain:

```env
# In backend/.env
CORS_ORIGINS=https://your-app.vercel.app,https://your-custom-domain.com
FRONTEND_URL=https://your-app.vercel.app
```

Redeploy your backend after updating CORS settings.

## 🔍 Post-Deployment Verification

### 1. Check Build Logs

In Vercel Dashboard → **Deployments** → Click on deployment → Check logs for:
- ✅ Build completed successfully
- ✅ No TypeScript errors
- ✅ No build warnings (address critical ones)

### 2. Test Frontend Functionality

Visit your deployed site and test:

- [ ] **Homepage loads**
- [ ] **Login page works**
- [ ] **Registration works**
- [ ] **API calls succeed** (check browser console for errors)
- [ ] **Authentication works** (login, logout)
- [ ] **Stripe payment forms load** (if using Stripe)
- [ ] **Images load correctly**
- [ ] **Navigation works**

### 3. Check Browser Console

Open browser DevTools (F12) → Console tab:
- ❌ Should see **no CORS errors**
- ❌ Should see **no 404 errors** for API calls
- ✅ API calls should return **200 OK**

### 4. Test API Connectivity

1. Open browser DevTools → Network tab
2. Try logging in
3. Check the request to your backend:
   - **Status**: Should be 200 or 401 (not 404 or CORS error)
   - **URL**: Should match `NEXT_PUBLIC_API_URL`

### 5. Common Issues Checklist

| Issue | Solution |
|-------|----------|
| 404 errors for API calls | Check `NEXT_PUBLIC_API_URL` is correct |
| CORS errors | Update backend `CORS_ORIGINS` to include Vercel URL |
| Stripe not loading | Verify `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set |
| Images not loading | Check image paths and Next.js image config |
| Build fails | Check build logs, fix TypeScript errors |
| Authentication fails | Verify backend is accessible and CORS is configured |

## 🔧 Configuration Files

### vercel.json (Optional)

Create `vercel.json` in project root if you need custom settings:

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NEXT_PUBLIC_ENV": "production"
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### next.config.mjs for Production

Update your `next.config.mjs` for production:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove these in production:
  // eslint: {
  //   ignoreDuringBuilds: true,
  // },
  // typescript: {
  //   ignoreBuildErrors: true,
  // },
  images: {
    domains: ['your-backend-url.com'], // Add your backend domain for images
    unoptimized: false, // Enable image optimization in production
  },
  // Optional: Redirects and rewrites
  async rewrites() {
    return []
  },
}

export default nextConfig
```

## 🌐 Custom Domain (Optional)

1. Go to Vercel Dashboard → Project → **Settings** → **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `causeconnect.com`)
4. Follow DNS configuration instructions
5. Update backend `CORS_ORIGINS` to include your custom domain

## 🔄 Continuous Deployment

Vercel automatically deploys on every push to your main branch.

- **Production**: Deploys from `main` branch
- **Preview**: Deploys from pull requests and other branches

## 📊 Monitoring

1. **Vercel Analytics** (already included):
   - Already configured with `@vercel/analytics`
   - View in Vercel Dashboard → Analytics

2. **Error Tracking**:
   - Check Vercel Dashboard → Deployments → Function Logs
   - Check browser console for client-side errors

## 🔐 Security Checklist

- [ ] Environment variables are set in Vercel (not hardcoded)
- [ ] `NEXT_PUBLIC_*` variables are safe to expose (only public keys)
- [ ] No secrets in client-side code
- [ ] HTTPS is enforced (Vercel default)
- [ ] Security headers are configured (see vercel.json example)

## 🐛 Troubleshooting

### Build Fails

1. Check build logs in Vercel Dashboard
2. Test local build: `npm run build`
3. Fix TypeScript errors locally
4. Push fixes and redeploy

### API Calls Fail

1. Verify `NEXT_PUBLIC_API_URL` is correct
2. Check backend is deployed and running
3. Verify CORS settings in backend
4. Check browser Network tab for actual error

### Environment Variables Not Working

1. Variables must start with `NEXT_PUBLIC_` for client-side access
2. Redeploy after adding/updating variables
3. Check variable names match exactly (case-sensitive)
4. Verify they're set for correct environment (Production/Preview)

### Images Not Loading

1. Update `next.config.mjs` with image domains
2. Check image paths are correct
3. Verify images exist in `public/` or backend uploads

## 📝 Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | ✅ Yes | Backend API URL (e.g., `https://api.yourdomain.com/api`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ✅ Yes | Stripe publishable key (starts with `pk_`) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | ❌ Optional | Google Maps API key for location features |
| `NODE_ENV` | ✅ Yes | Set to `production` |

## 🎯 Quick Deployment Command

Once set up, you can deploy with:

```bash
vercel --prod
```

Or simply push to `main` branch for automatic deployment.

## ✅ Final Checklist

- [ ] Build succeeds locally: `npm run build`
- [ ] All environment variables added to Vercel
- [ ] Backend is deployed and accessible
- [ ] CORS configured on backend
- [ ] Custom domain configured (if applicable)
- [ ] Tested all major features after deployment
- [ ] No console errors in browser
- [ ] Analytics working (if enabled)

---

**Need Help?** Check Vercel documentation: https://vercel.com/docs






