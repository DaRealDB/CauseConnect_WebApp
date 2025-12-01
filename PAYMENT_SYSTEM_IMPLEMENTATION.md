# Payment System Implementation - Complete Guide

## Overview
Full-stack payment system with Stripe (credit/debit cards) and PayPal integration for CauseConnect charity platform.

## ✅ Completed Features

### Backend
- ✅ Stripe integration (PaymentIntent, SetupIntent, Subscriptions)
- ✅ PayPal integration (REST API)
- ✅ Payment methods management
- ✅ Single donations
- ✅ Recurring donations (Stripe subscriptions)
- ✅ Donation history
- ✅ Payment audit logging
- ✅ All database models and migrations

### Frontend
- ✅ Payment methods component (add, remove, set default)
- ✅ Donation history component
- ✅ Recurring donations component
- ✅ Settings page integration
- ✅ Stripe Payment Element integration
- ✅ Frontend API services

## 📁 File Structure

### Backend Files
```
backend/
├── prisma/
│   ├── schema.prisma (updated with payment models)
│   └── migrations/
│       └── 20251126140000_add_payment_system/
│           └── migration.sql
├── src/
│   ├── config/
│   │   ├── stripe.ts
│   │   └── paypal.ts
│   ├── services/
│   │   └── payment.service.ts
│   ├── controllers/
│   │   └── payment.controller.ts
│   ├── routes/
│   │   └── payment.routes.ts
│   └── server.ts (updated)
```

### Frontend Files
```
app/
├── settings/
│   └── page.tsx (updated with real payment components)
components/
├── payment-methods.tsx (new)
├── donation-history.tsx (new)
└── recurring-donations.tsx (new)
lib/
└── api/
    ├── services.ts (updated with paymentService)
    └── types.ts (updated with payment types)
```

## 🔧 Environment Variables Required

### Backend (.env)
```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# PayPal
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_ENVIRONMENT=sandbox  # or 'live' for production

# Frontend URL (for PayPal redirects)
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## 🚀 Setup Instructions

### 1. Install Dependencies
```bash
# Backend
cd backend
npm install stripe

# Frontend
cd ..
npm install @stripe/stripe-js @stripe/react-stripe-js
```

### 2. Set Up Stripe Account
1. Create account at https://stripe.com
2. Get API keys from Dashboard → Developers → API keys
3. Add keys to backend `.env`:
   - `STRIPE_SECRET_KEY` (starts with `sk_test_` or `sk_live_`)
   - `STRIPE_PUBLISHABLE_KEY` (starts with `pk_test_` or `pk_live_`)
4. Add publishable key to frontend `.env.local`:
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

### 3. Set Up PayPal Developer Account
1. Create account at https://developer.paypal.com
2. Create a new app in Dashboard
3. Get credentials:
   - Client ID
   - Client Secret
4. Add to backend `.env`:
   - `PAYPAL_CLIENT_ID`
   - `PAYPAL_CLIENT_SECRET`
   - `PAYPAL_ENVIRONMENT=sandbox` (or `live` for production)

### 4. Run Database Migration
```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

### 5. Test the System

#### Test Stripe Cards
Use Stripe test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires 3D Secure: `4000 0025 0000 3155`
- Any future expiry date (e.g., 12/34)
- Any CVC (e.g., 123)
- Any ZIP code

#### Test PayPal Sandbox
1. Use PayPal sandbox test accounts from https://developer.paypal.com
2. Create buyer and seller accounts
3. Use buyer account credentials to test payments

## 📡 API Endpoints

### Payment Methods
- `GET /api/payments/payment-methods` - Get user's payment methods
- `POST /api/payments/payment-methods/setup-intent` - Create setup intent for adding card
- `POST /api/payments/payment-methods` - Add payment method
- `PUT /api/payments/payment-methods/:id/default` - Set default payment method
- `DELETE /api/payments/payment-methods/:id` - Remove payment method

### Single Donations
- `POST /api/payments/payment-intent` - Create Stripe payment intent
- `POST /api/payments/confirm-payment` - Confirm Stripe payment
- `POST /api/payments/paypal/order` - Create PayPal order
- `POST /api/payments/paypal/capture` - Capture PayPal payment

### Recurring Donations
- `POST /api/payments/recurring` - Create recurring donation (subscription)
- `GET /api/payments/recurring` - Get user's recurring donations
- `DELETE /api/payments/recurring/:id` - Cancel recurring donation

### Donation History
- `GET /api/payments/history?page=1&limit=20` - Get donation history

## 🎨 Frontend Components

### PaymentMethods Component
- Displays saved payment methods
- Add new payment method via Stripe Payment Element
- Set default payment method
- Remove payment methods

### DonationHistory Component
- Lists all user donations
- Shows event details, amount, status
- Pagination support

### RecurringDonations Component
- Lists active subscriptions
- Cancel recurring donations
- Shows next payment date

## 🔐 Security Features

- ✅ All payment routes protected with `requireAuth` middleware
- ✅ No raw card data stored (Stripe handles it)
- ✅ Input validation on all endpoints
- ✅ Payment audit logging
- ✅ Secure payment intent/client secret handling

## 🧪 Testing Checklist

- [ ] Add payment method (Stripe)
- [ ] Set default payment method
- [ ] Remove payment method
- [ ] Make single donation (Stripe)
- [ ] Make single donation (PayPal)
- [ ] Create recurring donation
- [ ] Cancel recurring donation
- [ ] View donation history
- [ ] Test with Stripe test cards
- [ ] Test with PayPal sandbox

## 🔄 Next Steps

1. **Update Donation Page**: Integrate Stripe Payment Element and PayPal checkout buttons on `/app/donate/[eventId]/page.tsx`
2. **Webhook Handlers**: Add Stripe webhook endpoints for subscription updates and payment confirmations
3. **Email Receipts**: Send donation receipts via email
4. **Payment Failures**: Handle failed payments gracefully with retry logic
5. **Refunds**: Implement refund functionality for admins

## 📝 Notes

- Stripe uses test mode by default (use test API keys)
- PayPal uses sandbox mode by default (set `PAYPAL_ENVIRONMENT=live` for production)
- All amounts are in cents for Stripe (multiply by 100)
- PayPal amounts are in dollars
- Payment methods are automatically saved after successful donation (optional)
- Recurring donations create Stripe subscriptions with automatic billing

## 🐛 Troubleshooting

### Stripe Payment Element Not Showing
- Check `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set
- Verify Stripe publishable key is correct
- Check browser console for errors

### PayPal Orders Failing
- Verify PayPal credentials are correct
- Check PayPal environment (sandbox vs live)
- Ensure `FRONTEND_URL` is set correctly

### Database Errors
- Run `npx prisma generate` after schema changes
- Verify migration was applied: `npx prisma migrate status`

## 📞 Support

For issues:
1. Check payment audit logs in `payment_audit_logs` table
2. Review server logs for errors
3. Test with Stripe/PayPal test credentials
4. Verify environment variables are set correctly











