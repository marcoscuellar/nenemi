// Public, non-secret settings the page needs before it can do anything.
// The publishable key is meant to be public; the secret key never leaves the server.

import { FREE_ROOMS, authEnabled } from '../lib/auth.js';

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || null,
    authEnabled: authEnabled(),
    freeRooms: FREE_ROOMS,
    smartRouting: Boolean(process.env.ANTHROPIC_API_KEY),
    // Full access: on when Stripe is wired up. Price shown in the app comes from here so it lives in one place.
    billing: Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_MONTHLY),
    price: { monthly: Number(process.env.NENEMI_PRICE_MONTHLY || 10), currency: 'usd' },
    revenuecatIosKey: process.env.REVENUECAT_IOS_KEY || null,
  });
}
