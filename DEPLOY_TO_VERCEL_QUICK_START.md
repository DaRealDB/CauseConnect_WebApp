# 🚀 Quick Start: Deploy to Vercel

This is a condensed guide to get CauseConnect deployed on Vercel quickly.

## Prerequisites ✅

1. **Backend deployed** (Render, Railway, Heroku, etc.)
   - Backend URL: `https://your-backend-url.com`
   - Backend is accessible and running
   - CORS allows your Vercel domain

2. **Environment variables ready**:
   - Backend API URL
   - Stripe publishable key (if using payments)

## 🎯 5-Minute Deployment

### Step 1: Test Local Build (2 min)

```bash
npm run build
```

**If build fails**, fix errors before deploying.

### Step 2: Push to GitHub (1 min)

```bash
git add .
git commit -m "chore: prepare for Vercel deployment"
git push origin main
```

### Step 3: Deploy to Vercel (2 min)

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repository
3. Configure:
   - Framework: **Next.js** (auto-detected)
   - Root Directory: `./`
4. **Add Environment Variables**:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.com/api
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... (or pk_live_...)
   ```
5. Click **Deploy**

### Step 4: Update Backend CORS

Update your backend `.env`:
```env
CORS_ORIGINS=https://your-app.vercel.app
FRONTEND_URL=https://your-app.vercel.app
```

Redeploy backend after updating CORS.

### Step 5: Verify (1 min)

Visit your deployed site: `https://your-app.vercel.app`

✅ Test:
- Homepage loads
- Can log in
- API calls work (check browser console)

## 🔍 Common Issues & Quick Fixes

| Problem | Quick Fix |
|---------|-----------|
| Build fails | Run `npm run build` locally, fix errors |
| 404 API errors | Check `NEXT_PUBLIC_API_URL` is correct |
| CORS errors | Update backend `CORS_ORIGINS` with Vercel URL |
| Images don't load | Update `next.config.mjs` image domains |

## 📋 Checklist Before Deploying

- [ ] `npm run build` succeeds locally
- [ ] Backend is deployed and accessible
- [ ] Environment variables ready
- [ ] Code pushed to GitHub

## 📚 Need More Details?

- Full guide: See `VERCEL_DEPLOYMENT.md`
- Pre-deployment checklist: See `VERCEL_DEPLOYMENT_CHECKLIST.md`

## 🎉 Done!

Your app should now be live at: `https://your-app.vercel.app`

---

**Next Steps:**
1. Test all features
2. Set up custom domain (optional)
3. Monitor Vercel dashboard for errors





