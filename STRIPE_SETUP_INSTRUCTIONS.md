# Stripe Setup Instructions

## Error: "Stripe is not configured" or "@npm (1-1018)"

This error occurs when Stripe environment variables are missing. Follow these steps to fix it:

## Frontend Setup (.env.local)

1. Create or edit `.env.local` in the root of your project (same directory as `package.json`)
2. Add your Stripe publishable key:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**To get your Stripe keys:**
1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy the "Publishable key" (starts with `pk_test_` for test mode)
3. Paste it into `.env.local`

## Backend Setup (backend/.env)

1. Edit `backend/.env` file
2. Add your Stripe secret key:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...  # Optional, for webhooks
```

**To get your Stripe secret key:**
1. Go to https://dashboard.stripe.com/test/apikeys
2. Click "Reveal test key" next to "Secret key"
3. Copy it (starts with `sk_test_` for test mode)
4. Paste it into `backend/.env`

## After Adding Keys

1. **Restart your development servers:**
   - Frontend: Stop and restart `npm run dev`
   - Backend: Stop and restart your backend server

2. **Clear browser cache** (or do a hard refresh: Ctrl+Shift+R or Cmd+Shift+R)

3. **Try adding a payment method again**

## Test Cards

Once Stripe is configured, you can use these test card numbers:

- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- **Requires 3D Secure:** `4000 0025 0000 3155`

Use any future expiry date (e.g., 12/34) and any 3-digit CVC (e.g., 123).

## Troubleshooting

- **"Stripe is not configured" warning still showing:**
  - Make sure you restarted both frontend and backend servers
  - Check that the keys are in the correct files (frontend: `.env.local`, backend: `backend/.env`)
  - Verify the keys start with `pk_test_` (frontend) and `sk_test_` (backend)

- **Error persists after setup:**
  - Check browser console for errors
  - Check backend logs for Stripe-related errors
  - Verify environment variables are loaded: Add `console.log(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)` temporarily to see if it's loaded

## Production

For production, use live keys (starting with `pk_live_` and `sk_live_`) and set `PAYPAL_ENVIRONMENT=live` in your backend `.env`.

