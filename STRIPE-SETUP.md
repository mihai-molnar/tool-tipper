# Stripe Payment Integration Setup Guide

This guide walks you through setting up Stripe payments for Tool-Tipper's Pro subscription feature.

## 🎯 Overview

Tool-Tipper integrates with Stripe to handle:
- $1.99/month Pro plan subscriptions
- Automatic plan upgrades/downgrades
- Subscription management via Customer Portal
- Webhook-driven status updates

## 📋 Prerequisites

1. A Stripe account (create at [stripe.com](https://stripe.com))
2. Supabase database with auth schema set up
3. Environment variables configured

## 🔧 Setup Steps

### 1. Stripe Account Setup

1. **Create a Stripe Account** or log into your existing account
2. **Get your API keys**:
   - Go to Developers > API keys
   - Copy your **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - Copy your **Secret key** (starts with `sk_test_` or `sk_live_`)

3. **Create a Product and Price**:
   ```
   Product Name: Tool-Tipper Pro
   Description: Unlimited hotspots and priority support
   
   Price: $1.99 USD
   Billing Period: Monthly
   Price ID: Copy this (starts with price_...)
   ```

4. **Set up Webhooks**:
   - Go to Developers > Webhooks
   - Click "Add endpoint"
   - Endpoint URL: `https://your-domain.com/api/stripe/webhook`
   - Events to send:
     - `customer.subscription.created`
     - `customer.subscription.updated` 
     - `customer.subscription.deleted`
     - `checkout.session.completed`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Copy the **Webhook signing secret** (starts with `whsec_`)

### 2. Environment Variables

Update your `.env.local` file:

```env
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### 3. Update Stripe Configuration

Edit `src/lib/stripe.ts` and replace the placeholder price ID:

```typescript
export const STRIPE_CONFIG = {
  PRO_PLAN: {
    price: '$1.99/month',
    priceId: 'price_YOUR_ACTUAL_PRICE_ID_HERE', // Replace this!
    features: [
      'Unlimited hotspots',
      'Priority support', 
      'All current and future features'
    ]
  }
} as const;
```

### 4. Database Schema (if not already done)

Run the auth schema to create required tables:

```sql
-- Run this in your Supabase SQL Editor
-- See database/auth-schema.sql for complete setup
```

## 🧪 Testing

### Test Payment Flow

1. Start your development server: `npm run dev`
2. Sign up for a new account
3. Try to create more than 10 hotspots
4. Click "Upgrade Now" in the modal
5. Use Stripe test card: `4242 4242 4242 4242`
6. Complete checkout and verify you're redirected to `/billing?success=true`

### Test Webhooks Locally

1. Install Stripe CLI: `brew install stripe/stripe-cli/stripe` (macOS)
2. Login: `stripe login`
3. Forward webhooks: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
4. Copy the webhook signing secret from CLI output
5. Update your `.env.local` with the new secret
6. Test subscription events

### Test Cards

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002` 
- **Requires Authentication**: `4000 0025 0000 3155`

## 🚀 Production Deployment

### 1. Update Environment Variables

In your production environment (Vercel/etc):

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key
STRIPE_SECRET_KEY=sk_live_your_live_key  
STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret
```

### 2. Update Stripe Configuration

- Switch to live API keys
- Update webhook endpoint to production URL
- Update price ID to live price (create in live mode)

### 3. Test in Production

- Use real payment methods
- Verify webhooks are being received
- Test the complete user journey

## 🔍 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/stripe/create-checkout-session` | POST | Create Stripe checkout session |
| `/api/stripe/webhook` | POST | Handle Stripe webhooks |
| `/api/stripe/create-portal-session` | POST | Create customer portal session |

## 🎛️ User Flow

1. **Free User** → Creates 10 hotspots → Hits limit → Sees upgrade modal
2. **Click "Upgrade Now"** → Redirects to Stripe Checkout
3. **Complete Payment** → Webhook updates database → User becomes Pro
4. **Pro User** → Can create unlimited hotspots
5. **Manage Subscription** → `/billing` page → Customer Portal

## 🔒 Security Notes

- Webhook signatures are verified for security
- User authentication is required for checkout
- Subscription status is validated server-side
- Database updates are atomic via webhook events

## 🐛 Troubleshooting

### Common Issues

**"Invalid signature" webhook errors:**
- Verify webhook secret is correct
- Ensure webhook endpoint URL is correct
- Check that webhook is receiving POST requests

**Checkout session creation fails:**
- Verify Stripe secret key is valid
- Check that price ID exists and is active
- Ensure user has a valid profile in database

**User not upgraded after payment:**
- Check webhook logs in Stripe dashboard
- Verify webhook endpoint is reachable
- Look for errors in application logs

### Debug Tips

- Enable Stripe webhook logs: Developers > Webhooks > Select endpoint > Events
- Check Supabase logs for database errors
- Use browser dev tools to inspect API responses
- Test with different cards and scenarios

## 📞 Support

- **Stripe Documentation**: [stripe.com/docs](https://stripe.com/docs)
- **Stripe Support**: Available in Stripe Dashboard
- **Tool-Tipper Issues**: Create a GitHub issue

---

🎉 **You're all set!** Your users can now upgrade to Pro and enjoy unlimited hotspots.