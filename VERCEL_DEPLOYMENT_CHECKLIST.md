# Vercel Deployment Pre-Flight Checklist

Use this checklist before deploying to Vercel to ensure everything works correctly.

## 🔍 Pre-Deployment Checks

### Code Quality
- [ ] **Build succeeds locally**
  ```bash
  npm run build
  ```
  - No TypeScript errors
  - No critical build warnings
  - Build completes successfully

- [ ] **Lint passes** (if not ignored)
  ```bash
  npm run lint
  ```

- [ ] **No hardcoded URLs or secrets**
  - All API URLs use `NEXT_PUBLIC_API_URL`
  - No hardcoded localhost URLs in production code
  - No API keys or secrets in code

### Environment Variables
- [ ] **All required env vars documented**
  - `NEXT_PUBLIC_API_URL` - Backend API URL
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe key
  - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Optional

- [ ] **Environment variables ready**
  - Values prepared (backend URL, Stripe keys, etc.)
  - No placeholder values will be used in production

### Backend Setup
- [ ] **Backend is deployed**
  - Backend URL is known and accessible
  - Backend health check works: `curl https://your-backend.com/health`

- [ ] **Backend CORS configured**
  - Includes your Vercel URL: `https://your-app.vercel.app`
  - Includes custom domain if applicable

- [ ] **Database is set up**
  - PostgreSQL database running
  - Migrations applied
  - Database accessible from backend

### Configuration Files
- [ ] **next.config.mjs is production-ready**
  - Build error ignores removed (or conditional)
  - Image domains configured if needed
  - Unoptimized images set to false for production

- [ ] **package.json is correct**
  - Name and version are set
  - Build script exists: `"build": "next build"`

### Dependencies
- [ ] **All dependencies installed**
  ```bash
  npm install
  ```
  - No peer dependency warnings
  - No broken dependencies

- [ ] **No unnecessary dev dependencies**
  - Production build doesn't include dev-only packages

## 🚀 Deployment Steps

### Step 1: Code Preparation
- [ ] Code is committed to Git
- [ ] Pushed to GitHub/GitLab/Bitbucket
- [ ] Main branch is stable

### Step 2: Vercel Setup
- [ ] Vercel account created
- [ ] GitHub account connected (if using)
- [ ] Project ready to import

### Step 3: Environment Variables
- [ ] `NEXT_PUBLIC_API_URL` = Backend API URL
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = Stripe key
- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` = Google Maps key (if used)
- [ ] Variables set for Production, Preview, and Development

### Step 4: Build Configuration
- [ ] Framework: Next.js (auto-detected)
- [ ] Root Directory: `./`
- [ ] Build Command: `npm run build` (default)
- [ ] Output Directory: `.next` (default)
- [ ] Install Command: `npm install` (default)

### Step 5: Initial Deployment
- [ ] Deployed successfully
- [ ] Build logs show no errors
- [ ] Deployment URL is accessible

## ✅ Post-Deployment Verification

### Basic Functionality
- [ ] **Homepage loads**
  - Visit deployed URL
  - Page renders without errors

- [ ] **Navigation works**
  - Links work
  - No 404 errors on navigation

- [ ] **API connectivity**
  - Open browser DevTools → Network tab
  - Try logging in or accessing protected route
  - API calls return 200/401 (not 404 or CORS errors)

### Authentication
- [ ] **Registration works**
  - Can create new account
  - Email verification code received (if backend email configured)

- [ ] **Login works**
  - Can log in with credentials
  - Token stored in localStorage
  - Redirected after login

- [ ] **Protected routes work**
  - Can access authenticated pages
  - Redirects to login if not authenticated

### Core Features
- [ ] **Feed page loads**
  - Events/posts display
  - No console errors

- [ ] **Event pages work**
  - Can view event details
  - Can donate (if payment configured)

- [ ] **Profile pages work**
  - Can view profiles
  - Can edit own profile (if logged in)

### Payments (if using Stripe)
- [ ] **Stripe loads**
  - Payment forms render
  - No Stripe.js errors in console
  - Can see Stripe elements

- [ ] **Payment flow works** (test mode)
  - Can complete test payment
  - Webhook receives payment (check backend logs)

### Images & Assets
- [ ] **Images load**
  - Profile images display
  - Event images display
  - No broken image icons

- [ ] **Static assets work**
  - CSS loads correctly
  - Fonts load correctly
  - Icons display

### Performance
- [ ] **Page load is acceptable**
  - First Contentful Paint < 3s
  - Time to Interactive < 5s

- [ ] **No console errors**
  - Browser console is clean
  - No JavaScript errors
  - No network errors (except expected 401s)

## 🔧 Troubleshooting Items

If issues found, check:

- [ ] **Build logs** - Any build errors or warnings?
- [ ] **Function logs** - Any serverless function errors?
- [ ] **Network tab** - Are API calls failing?
- [ ] **Console tab** - Any JavaScript errors?
- [ ] **Environment variables** - Are they set correctly?
- [ ] **Backend status** - Is backend accessible and running?

## 📊 Monitoring Setup

- [ ] **Vercel Analytics enabled**
  - Analytics dashboard shows data

- [ ] **Error tracking** (if implemented)
  - Errors are logged and visible

## 🔐 Security Checks

- [ ] **HTTPS enforced**
  - All requests use HTTPS
  - No mixed content warnings

- [ ] **Environment variables secure**
  - No secrets in client-side code
  - Only `NEXT_PUBLIC_*` vars are exposed

- [ ] **CORS properly configured**
  - Only allowed origins can access API
  - No CORS errors in production

## ✅ Final Verification

- [ ] **All critical paths tested**
  - User registration → login → use app
  - Create event → view event → donate
  - View profile → edit settings

- [ ] **Mobile responsive**
  - Test on mobile device or responsive mode
  - Layout works on small screens

- [ ] **Cross-browser tested** (at least Chrome and Firefox)
  - Works in major browsers

## 📝 Notes

After deployment, note:
- Deployment URL: `https://________________.vercel.app`
- Backend URL: `https://________________`
- Custom domain: `https://________________` (if configured)
- Issues found: ________________
- Issues resolved: ________________

---

**✅ Ready to Deploy?** Once all items are checked, proceed with deployment!

**❌ Issues Found?** Fix them before deploying to production.






