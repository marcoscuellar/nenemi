// Who is asking? Clerk session token -> user, otherwise a legacy sync code.
// Nothing here trusts the client for identity: the token is verified with
// Clerk's public keys, and the plan comes from Clerk's user record or the
// owner list in NENEMI_ADMIN_EMAILS.

import { verifyToken, createClerkClient } from '@clerk/backend';

export const FREE_ROOMS = 2;

const SECRET = process.env.CLERK_SECRET_KEY || '';
const ADMINS = (process.env.NENEMI_ADMIN_EMAILS || '')
  .split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
const CODE = /^[A-Za-z0-9_-]{4,64}$/;
console.log('nenemi admins configured:', ADMINS.length);

export function authEnabled() { return Boolean(SECRET); }

// small per-instance cache so we don't hit Clerk's user API on every save.
// A minute, so a fresh payment shows up fast; setPlan() also drops the entry.
const planCache = new Map(); // userId -> { plan, email, meta, at }
const PLAN_TTL = 60 * 1000;
const GRACE_MS = 3 * 24 * 60 * 60 * 1000; // a card that fails on renewal day doesn't lock anyone out that day

function clerk() { return createClerkClient({ secretKey: SECRET }); }

// The switch lives in Clerk publicMetadata: { plan: 'paid'|'lifetime'|'free', planSource: 'stripe'|'apple', planUntil: ISO, stripeCustomerId }
export function planFromMeta(meta, email) {
  if (!meta) meta = {};
  if (ADMINS.includes(String(email || '').toLowerCase())) return 'paid';
  if (meta.plan === 'lifetime') return 'paid';
  if (meta.plan === 'paid') {
    if (!meta.planUntil) return 'paid';
    const until = Date.parse(meta.planUntil);
    return Number.isFinite(until) && until + GRACE_MS > Date.now() ? 'paid' : 'free';
  }
  return 'free';
}

export async function lookupPlan(userId) {
  const hit = planCache.get(userId);
  if (hit && Date.now() - hit.at < PLAN_TTL) return hit;
  let plan = 'free', email = '', meta = {};
  try {
    const u = await clerk().users.getUser(userId);
    email = (u.primaryEmailAddress?.emailAddress || u.emailAddresses?.[0]?.emailAddress || '').toLowerCase();
    meta = u.publicMetadata || {};
    plan = planFromMeta(meta, email);
  } catch (e) {
    console.error('nenemi lookupPlan', e?.message || e);
  }
  console.log('nenemi plan', userId, email || '(no email)', plan);
  const entry = { plan, email, meta, at: Date.now() };
  planCache.set(userId, entry);
  return entry;
}

// Billing webhooks write here. Merges into publicMetadata (Clerk merges one level deep) and forgets the cache.
export async function setPlan(userId, patch) {
  if (!SECRET) throw new Error('auth not configured');
  await clerk().users.updateUserMetadata(userId, { publicMetadata: patch });
  planCache.delete(userId);
  console.log('nenemi setPlan', userId, JSON.stringify(patch));
}

// Returns { kind: 'user', key, userId, plan, roomLimit }
//      or { kind: 'device', key, plan: 'free', roomLimit }
//      or null when the request carries no usable identity.
export async function getIdentity(req) {
  const header = req.headers?.authorization || req.headers?.Authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';

  if (token) {
    if (!SECRET) return { error: 'auth not configured', status: 503 };
    try {
      const claims = await verifyToken(token, { secretKey: SECRET });
      const userId = claims.sub;
      if (!userId) return { error: 'bad token', status: 401 };
      const { plan, email, meta } = await lookupPlan(userId);
      return { kind: 'user', key: `user:${userId}`, userId, email, meta, plan, roomLimit: plan === 'paid' ? Infinity : FREE_ROOMS };
    } catch (e) {
      return { error: 'invalid or expired sign-in', status: 401 };
    }
  }

  const code = String(req.query?.device || '').trim();
  if (CODE.test(code)) return { kind: 'device', key: code, plan: 'free', roomLimit: FREE_ROOMS };
  return null;
}
