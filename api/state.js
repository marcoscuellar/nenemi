// NENEMI sync endpoint — one row per identity, whole app state as JSON.
//
// Identity is either a signed-in Clerk user (Authorization: Bearer <token>)
// or, for the pre-login flow, a sync code (?device=<code>).
//
// GET  /api/state  -> { data, updated_at, plan, roomLimit, signedIn } or data: null
// PUT  /api/state  body: the state object -> { ok: true }
//                  402 { error: 'room_limit', limit } when a free plan tries to
//                  grow past its room limit (existing rooms are never taken away)
//
// Vercel + Neon. The connection string is whatever Vercel's Neon integration
// created; the usual names are checked. If none is set the endpoint answers
// 503 and the app keeps saving in the browser.

import { neon } from '@neondatabase/serverless';
import { getIdentity } from '../lib/auth.js';

const URL =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.STORAGE_URL ||
  process.env.NEON_DATABASE_URL ||
  process.env.DATABASE_URL_UNPOOLED ||
  '';

const MAX_BYTES = 512 * 1024; // half a megabyte of rooms is a lot of rooms
const FIRST_SAVE_SLACK = 5;    // rooms made before signing in come along on the first save

let ready = null;
function db() {
  const sql = neon(URL);
  if (!ready) {
    ready = sql`create table if not exists nenemi_state (
      device_id  text primary key,
      data       jsonb not null,
      updated_at timestamptz not null default now()
    )`;
  }
  return ready.then(() => sql);
}

// the example room shipped with the app doesn't count against anyone's limit
function roomCount(data) { return Array.isArray(data?.rooms) ? data.rooms.filter(r => !(r && r.demo)).length : 0; }

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!URL) return res.status(503).json({ error: 'no database connected' });

  const who = await getIdentity(req);
  if (!who) return res.status(400).json({ error: 'missing sign-in or sync code' });
  if (who.error) return res.status(who.status).json({ error: who.error });

  const limitOut = who.roomLimit === Infinity ? null : who.roomLimit;

  try {
    const sql = await db();

    if (req.method === 'GET') {
      const rows = await sql`select data, updated_at from nenemi_state where device_id = ${who.key}`;
      return res.status(200).json({
        data: rows[0] ? rows[0].data : null,
        updated_at: rows[0] ? rows[0].updated_at : null,
        plan: who.plan, roomLimit: limitOut, signedIn: who.kind === 'user',
        planSource: who.meta?.planSource || null, planUntil: who.meta?.planUntil || null,
      });
    }

    if (req.method === 'PUT') {
      const data = req.body;
      if (!data || typeof data !== 'object' || Array.isArray(data)) return res.status(400).json({ error: 'body must be a JSON object' });
      const json = JSON.stringify(data);
      if (json.length > MAX_BYTES) return res.status(413).json({ error: 'state too large' });

      if (who.roomLimit !== Infinity && roomCount(data) > who.roomLimit) {
        // Rooms are never taken away: the first save brings whatever you already had,
        // and after that you can't *add* a room past the limit.
        const prev = await sql`select data from nenemi_state where device_id = ${who.key}`;
        const firstSave = prev.length === 0;
        const before = firstSave ? 0 : roomCount(prev[0].data);
        const ceiling = firstSave ? who.roomLimit + FIRST_SAVE_SLACK : Math.max(before, who.roomLimit);
        if (roomCount(data) > ceiling) {
          return res.status(402).json({ error: 'room_limit', limit: who.roomLimit });
        }
      }

      await sql`insert into nenemi_state (device_id, data, updated_at)
                values (${who.key}, ${json}::jsonb, now())
                on conflict (device_id) do update set data = excluded.data, updated_at = now()`;
      return res.status(200).json({ ok: true, plan: who.plan, roomLimit: limitOut, planSource: who.meta?.planSource || null, planUntil: who.meta?.planUntil || null });
    }

    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    console.error('nenemi /api/state', err);
    return res.status(500).json({ error: 'database error' });
  }
}
