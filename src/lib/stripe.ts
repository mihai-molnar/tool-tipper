import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

// Initialize Stripe with secret key (server-side only)
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

// Stripe product/price configuration
export const STRIPE_CONFIG = {
  PRO_PLAN: {
    price: '$1.99/month',
    priceId: process.env.STRIPE_PRICE_ID || 'price_1QYnI4Pfnjeprj3apAf1YJnp', // Default test price ID
    features: [
      'Unlimited hotspots',
      'Priority support',
      'All current and future features'
    ]
  }
} as const;

export type StripePriceId = typeof STRIPE_CONFIG.PRO_PLAN.priceId;