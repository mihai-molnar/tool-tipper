# 🎣 Stripe Webhook Testing Guide

Your Stripe CLI is now set up and ready for testing! Here's how to use it.

## 🏃‍♂️ Quick Start

You now have:
- ✅ **Stripe CLI installed and authenticated**
- ✅ **Webhook forwarding active** to `localhost:3000/api/stripe/webhook`
- ✅ **Environment variables updated** with real webhook secret
- ✅ **Development server running** on `localhost:3000`

## 🔄 Keep These Running

**Terminal 1 - Stripe CLI** (keep running):
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

**Terminal 2 - Next.js Server** (keep running):
```bash
npm run dev
```

## 🧪 Testing Webhook Events

### Test Subscription Events
```bash
# Test subscription creation (simulates successful checkout)
stripe trigger customer.subscription.created

# Test subscription update
stripe trigger customer.subscription.updated

# Test subscription cancellation
stripe trigger customer.subscription.deleted
```

### Test Payment Events
```bash
# Test successful payment
stripe trigger invoice.payment_succeeded

# Test failed payment
stripe trigger invoice.payment_failed

# Test checkout completion
stripe trigger checkout.session.completed
```

### Test with Specific Customer Data
```bash
# Create a subscription with custom metadata
stripe trigger customer.subscription.created --add customer.metadata.userId=test-user-123
```

## 📊 What You'll See

When you trigger events:

1. **Stripe CLI Terminal**: Shows the event being sent
2. **Next.js Terminal**: Shows your webhook handler processing the event
3. **Database**: Check Supabase to see user_profiles updates

## 🎯 Full Payment Flow Test

1. **Go to your app**: `http://localhost:3000`
2. **Sign up** for a new account
3. **Create 10 hotspots** to hit the limit
4. **Click "Upgrade Now"** → Goes to Stripe Checkout
5. **Use test card**: `4242 4242 4242 4242`
6. **Complete checkout** → Webhook automatically processes subscription
7. **Return to app** → You're now a Pro user!

## 🔍 Debugging

### Check Webhook Logs
```bash
# See recent webhook events
stripe events list --limit 10

# Get details of a specific event
stripe events retrieve evt_1234567890
```

### Check Database
In Supabase SQL Editor:
```sql
SELECT * FROM user_profiles ORDER BY updated_at DESC LIMIT 5;
```

### Check Console Logs
Look for these logs in your Next.js terminal:
- `Received webhook event: customer.subscription.created`
- `Updated user xyz to active status`

## ⚠️ Important Notes

- **Keep both terminals running** during testing
- **Webhook secret changes** each time you restart `stripe listen`
- **Update .env.local** with new secret if you restart CLI
- **Restart Next.js server** after changing environment variables

## 🚀 Ready for Production

When deploying to production:
1. Create webhook endpoint in Stripe Dashboard
2. Point to `https://yourdomain.com/api/stripe/webhook`
3. Select same events as tested locally
4. Update `STRIPE_WEBHOOK_SECRET` with production secret

---

**🎉 Your webhook testing setup is complete!**