// NENEMI billing — Full access, $10 a month, through Stripe on the web.
//
// All calls need a signed-in Clerk user (Authorization: Bearer <token>). Sync-code users
// get 401 { error: 'sign_in' }: a plan has to belong to an account so it can follow them.
//
// GET  /api/billing                 -> { plan, planSource, planUntil }   (the page polls this after checkout)
// POST /api/billing?action=checkout -> { url }  Stripe Checkout for the monthly price
// POST /api/billing?action=portal   -> { url }  Stripe's own portal: cancel, change card, receipts
//
// The plan itself is written by the webhook (api/stripe-webhook.js) into Clerk publicMetadata,
// never here, so a refreshed page can't talk itself into Full access.

import Stripe from 'stripe';
import { getIdentity } from '../lib/auth.js';

const SECRET = process.env.STRIPE_SECRET_KEY || '';
const PRICE = process.env.STRIPE_PRICE_MONTHLY || '';
const SITE = process.env.NENEMI_SITE_URL || 'https://www.mynenemi.com';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!SECRET || !PRICE) return res.status(503).json({ error: 'billing not configured' });

  const who = await getIdentity(req);
  if (!who) return res.status(400).json({ error: 'missing sign-in or sync code' });
  if (who.error) return res.status(who.status).json({ error: who.error });
  if (who.kind !== 'user') return res.status(401).json({ error: 'sign_in' });

  const meta = who.meta || {};
  if (req.method === 'GET') {
    return res.status(200).json({ plan: who.plan, planSource: meta.planSource || null, planUntil: meta.planUntil || null });
  }

  if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return res.status(405).json({ error: 'method not allowed' }); }

  const stripe = new Stripe(SECRET);
  const action = String(req.query?.action || '');
  try {
    if (action === 'checkout') {
      if (who.plan === 'paid') return res.status(200).json({ url: `${SITE}/?paid=1` });
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [{ price: PRICE, quantity: 1 }],
        client_reference_id: who.userId,
        ...(meta.stripeCustomerId ? { customer: meta.stripeCustomerId } : { customer_email: who.email || undefined }),
        metadata: { userId: who.userId },
        subscription_data: { metadata: { userId: who.userId } },
        allow_promotion_codes: true,
        success_url: `${SITE}/?paid=1`,
        cancel_url: `${SITE}/`,
      });
      return res.status(200).json({ url: session.url });
    }
    if (action === 'portal') {
      if (!meta.stripeCustomerId) return res.status(404).json({ error: 'no_subscription' });
      const portal = await stripe.billingPortal.sessions.create({ customer: meta.stripeCustomerId, return_url: `${SITE}/` });
      return res.status(200).json({ url: portal.url });
    }
    return res.status(400).json({ error: 'unknown action' });
  } catch (err) {
    console.error('nenemi /api/billing', err?.message || err);
    return res.status(502).json({ error: 'billing failed' });
  }
}
