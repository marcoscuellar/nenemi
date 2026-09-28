// NENEMI in-app purchase — Full access bought inside the iPhone app, through Apple, via RevenueCat.
//
// The web sells through Stripe (api/billing.js). Apple requires the iPhone app to sell through Apple,
// so there the paywall buys nenemi_monthly_1099 or nenemi_annual_5999 (7 days free) with RevenueCat.
// RevenueCat's app user id is the Clerk user id, so this endpoint can look the purchase up and switch
// the account to Full access. Like Stripe, the plan lives in Clerk publicMetadata and is written only
// here, from RevenueCat's own records, never from what the phone says.
//
// GET  /api/iap                  -> { plan, planSource, planUntil, trialEnd, roomLimit }   signed-in user
// POST /api/iap?action=sync      -> same, after asking RevenueCat (called right after a purchase or restore)
// POST /api/iap?action=webhook   -> RevenueCat webhook (Authorization header must equal REVENUECAT_WEBHOOK_AUTH)
//
// Env: REVENUECAT_SECRET_KEY (RevenueCat > Project > API keys > secret key, "sk_..."),
//      REVENUECAT_WEBHOOK_AUTH (any long random string, pasted into RevenueCat > Integrations > Webhooks),
//      REVENUECAT_ENTITLEMENT (optional, default "full_access").

import { getIdentity, lookupPlan, setPlan, planFromMeta } from '../lib/auth.js';

const RC_SECRET = process.env.REVENUECAT_SECRET_KEY || '';
const WEBHOOK_AUTH = process.env.REVENUECAT_WEBHOOK_AUTH || '';
const ENTITLEMENT = process.env.REVENUECAT_ENTITLEMENT || 'full_access';
const CLERK_ID = /^user_[A-Za-z0-9]+$/;

// Ask RevenueCat what this person owns, and write the answer into their account.
async function syncUser(userId) {
  if (!RC_SECRET) throw new Error('revenuecat not configured');
  const r = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`, {
    headers: { Authorization: `Bearer ${RC_SECRET}`, 'Content-Type': 'application/json' },
  });
  if (!r.ok) throw new Error(`revenuecat ${r.status}`);
  const sub = (await r.json()).subscriber || {};
  const ent = (sub.entitlements || {})[ENTITLEMENT];
  const { meta } = await lookupPlan(userId);

  if (ent) {
    const until = ent.expires_date || null; // null = never expires
    const live = !until || Date.parse(until) > Date.now();
    const s = (sub.subscriptions || {})[ent.product_identifier] || {};
    const trialEnd = s.period_type === 'trial' && s.expires_date ? s.expires_date : null;
    if (live) {
      await setPlan(userId, { plan: 'paid', planSource: 'apple', planUntil: until, trialEnd });
    } else if (meta.planSource === 'apple') {
      await setPlan(userId, { plan: 'free', planSource: 'apple', planUntil: until, trialEnd: null });
    }
  } else if (meta.planSource === 'apple' && meta.plan === 'paid') {
    // Apple no longer shows an entitlement (refund, or a transfer to another account)
    await setPlan(userId, { plan: 'free', planSource: 'apple', planUntil: null, trialEnd: null });
  }
  // a paid Stripe plan is never touched from here
  return lookupPlan(userId);
}

function out(entry) {
  const m = entry.meta || {};
  const plan = entry.plan;
  return { plan, planSource: m.planSource || null, planUntil: m.planUntil || null, trialEnd: m.trialEnd || null, roomLimit: plan === 'paid' ? null : undefined };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const action = String(req.query?.action || '');

  if (action === 'webhook') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
    if (!WEBHOOK_AUTH || (req.headers?.authorization || '') !== WEBHOOK_AUTH) return res.status(401).json({ error: 'unauthorized' });
    const ev = (req.body && req.body.event) || {};
    // everyone this event touches: the buyer, their aliases, and both sides of a transfer
    const ids = new Set([ev.app_user_id, ev.original_app_user_id, ...(ev.aliases || []), ...(ev.transferred_from || []), ...(ev.transferred_to || [])]
      .filter(id => typeof id === 'string' && CLERK_ID.test(id)));
    const done = [];
    for (const id of ids) {
      try { await syncUser(id); done.push(id); } catch (e) { console.error('nenemi iap webhook', id, e?.message || e); }
    }
    console.log('nenemi iap webhook', ev.type, [...ids].join(','), 'synced', done.length);
    return res.status(200).json({ ok: true, synced: done.length });
  }

  const who = await getIdentity(req);
  if (!who) return res.status(400).json({ error: 'missing sign-in' });
  if (who.error) return res.status(who.status).json({ error: who.error });
  if (who.kind !== 'user') return res.status(401).json({ error: 'sign_in' });

  if (req.method === 'GET') return res.status(200).json(out({ plan: planFromMeta(who.meta, who.email), meta: who.meta }));

  if (req.method === 'POST' && action === 'sync') {
    try { return res.status(200).json(out(await syncUser(who.userId))); }
    catch (e) {
      console.error('nenemi iap sync', e?.message || e);
      return res.status(503).json({ error: 'iap not available', ...out({ plan: who.plan, meta: who.meta }) });
    }
  }
  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'method not allowed' });
}
