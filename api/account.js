// NENEMI account deletion — Apple requires it in any app that lets people make an account.
//
// DELETE /api/account   headers: Authorization: Bearer <clerk token>
//   -> { ok: true } once everything is gone:
//      1. any Stripe subscription is cancelled, so nobody keeps paying for an account that no longer exists
//      2. every uploaded file (Blob, under the user's own prefix)
//      3. the synced rooms row in Neon
//      4. the Clerk user itself
// Each piece that isn't configured (no Stripe, no Blob, no database) is skipped, not an error.
// The page clears its own browser copy and signs out after this answers.

import Stripe from 'stripe';
import { list, del } from '@vercel/blob';
import { neon } from '@neondatabase/serverless';
import { getIdentity, deleteUser } from '../lib/auth.js';

const DB_URL =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.STORAGE_URL ||
  process.env.NEON_DATABASE_URL ||
  process.env.DATABASE_URL_UNPOOLED ||
  '';
const BLOB = process.env.BLOB_READ_WRITE_TOKEN || '';
const STRIPE = process.env.STRIPE_SECRET_KEY || '';

async function cancelStripe(customerId) {
  if (!STRIPE || !customerId) return;
  const stripe = new Stripe(STRIPE);
  const subs = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 100 });
  for (const s of subs.data) {
    if (!['canceled', 'incomplete_expired'].includes(s.status)) await stripe.subscriptions.cancel(s.id);
  }
}

async function deleteFiles(key) {
  if (!BLOB) return;
  // same prefix api/upload.js writes under
  const prefix = String(key).replace(/[^a-zA-Z0-9_-]/g, '_') + '/';
  let cursor;
  do {
    const page = await list({ prefix, cursor, limit: 1000, token: BLOB });
    if (page.blobs.length) await del(page.blobs.map(b => b.url), { token: BLOB });
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
}

async function deleteRooms(key) {
  if (!DB_URL) return;
  const sql = neon(DB_URL);
  await sql`delete from nenemi_state where device_id = ${key}`;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'DELETE') { res.setHeader('Allow', 'DELETE'); return res.status(405).json({ error: 'method not allowed' }); }

  const who = await getIdentity(req);
  if (!who) return res.status(400).json({ error: 'missing sign-in' });
  if (who.error) return res.status(who.status).json({ error: who.error });
  if (who.kind !== 'user') return res.status(401).json({ error: 'sign_in' });

  try {
    await cancelStripe(who.meta?.stripeCustomerId);
    await deleteFiles(who.key);
    await deleteRooms(who.key);
    await deleteUser(who.userId);
    console.log('nenemi account deleted', who.userId);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('nenemi /api/account', err?.message || err);
    return res.status(500).json({ error: 'delete failed' });
  }
}
