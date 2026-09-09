// Stripe tells us here when someone pays, renews, or cancels. This is the only writer of the web plan.
//
// POST /api/stripe-webhook  (Stripe-Signature header, raw body)
//   checkout.session.completed      -> paid, remember the Stripe customer id
//   customer.subscription.updated   -> paid while active or trialing, else free; planUntil = period end
//   customer.subscription.deleted   -> free
//
// Body parsing is off so the signature can be checked against the exact bytes Stripe sent.

import Stripe from 'stripe';
import { setPlan } from '../lib/auth.js';

export const config = { api: { bodyParser: false } };

const SECRET = process.env.STRIPE_SECRET_KEY || '';
const WEBHOOK = process.env.STRIPE_WEBHOOK_SECRET || '';

function rawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function whenIso(sec) { return sec ? new Date(sec * 1000).toISOString() : null; }

// find the Nenemi account behind a Stripe object: the ids we planted at checkout, then the customer's metadata
async function userIdFor(stripe, obj) {
  if (obj.client_reference_id) return obj.client_reference_id;
  if (obj.metadata?.userId) return obj.metadata.userId;
  const cust = typeof obj.customer === 'string' ? obj.customer : obj.customer?.id;
  if (!cust) return null;
  const c = await stripe.customers.retrieve(cust);
  return (!c.deleted && c.metadata?.userId) || null;
}

export async function handleEvent(stripe, event, write = setPlan) {
  const obj = event.data.object;
  const customerId = typeof obj.customer === 'string' ? obj.customer : obj.customer?.id || null;
  if (event.type === 'checkout.session.completed') {
    if (obj.mode !== 'subscription') return { skipped: 'not a subscription' };
    const userId = await userIdFor(stripe, obj);
    if (!userId) return { skipped: 'no user' };
    if (customerId) { try { await stripe.customers.update(customerId, { metadata: { userId } }); } catch (e) {} }
    let until = null;
    if (obj.subscription) { try { const sub = await stripe.subscriptions.retrieve(typeof obj.subscription === 'string' ? obj.subscription : obj.subscription.id); until = whenIso(sub.current_period_end); } catch (e) {} }
    await write(userId, { plan: 'paid', planSource: 'stripe', planUntil: until, stripeCustomerId: customerId });
    return { userId, plan: 'paid' };
  }
  if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
    const userId = await userIdFor(stripe, obj);
    if (!userId) return { skipped: 'no user' };
    const active = event.type !== 'customer.subscription.deleted' && (obj.status === 'active' || obj.status === 'trialing' || obj.status === 'past_due');
    await write(userId, { plan: active ? 'paid' : 'free', planSource: 'stripe', planUntil: whenIso(obj.current_period_end), stripeCustomerId: customerId });
    return { userId, plan: active ? 'paid' : 'free' };
  }
  return { skipped: event.type };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'method not allowed' }); }
  if (!SECRET || !WEBHOOK) return res.status(503).json({ error: 'billing not configured' });
  const stripe = new Stripe(SECRET);
  let event;
  try {
    const body = await rawBody(req);
    event = stripe.webhooks.constructEvent(body, req.headers['stripe-signature'], WEBHOOK);
  } catch (err) {
    console.error('nenemi stripe-webhook bad signature', err?.message || err);
    return res.status(400).json({ error: 'bad signature' });
  }
  try {
    const out = await handleEvent(stripe, event);
    return res.status(200).json({ received: true, ...out });
  } catch (err) {
    console.error('nenemi stripe-webhook', event.type, err?.message || err);
    return res.status(500).json({ error: 'handler failed' });
  }
}
