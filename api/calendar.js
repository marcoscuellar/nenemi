// NENEMI calendar feed — subscribe once, every built day shows up in your calendar app.
//
// POST /api/calendar            (signed in, or ?device=<sync code>)
//        -> { token }            makes a feed link key for this identity, or hands back the existing one
// POST /api/calendar?rotate=1   -> { token }  replaces the key (old links stop working)
// GET  /api/calendar?t=<token>  (no auth; the token is the secret)
//        -> text/calendar with every block from 30 days ago onward, floating local times
//
// The token is separate from the sync code and from sign-in, so a calendar app
// holding the link can read the days and nothing else.

import { neon } from '@neondatabase/serverless';
import { randomBytes } from 'node:crypto';
import { getIdentity } from '../lib/auth.js';
import { buildIcs, dayKeyDaysAgo } from '../lib/ics.js';

const URL =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.STORAGE_URL ||
  process.env.NEON_DATABASE_URL ||
  process.env.DATABASE_URL_UNPOOLED ||
  '';

const TOKEN = /^[a-f0-9]{32}$/;

let ready = null;
function db() {
  const sql = neon(URL);
  if (!ready) {
    ready = sql`create table if not exists nenemi_state (
      device_id  text primary key,
      data       jsonb not null,
      updated_at timestamptz not null default now()
    )`.then(() => sql`alter table nenemi_state add column if not exists feed_token text`)
      .then(() => sql`create unique index if not exists nenemi_state_feed_token on nenemi_state (feed_token)`);
  }
  return ready.then(() => sql);
}

export default async function handler(req, res) {
  if (!URL) return res.status(503).json({ error: 'no database connected' });

  try {
    const sql = await db();

    if (req.method === 'GET') {
      const t = String(req.query?.t || '').trim();
      res.setHeader('Cache-Control', 'private, max-age=300');
      if (!TOKEN.test(t)) return res.status(404).send('not found');
      const rows = await sql`select data from nenemi_state where feed_token = ${t}`;
      if (!rows[0]) return res.status(404).send('not found');
      const data = rows[0].data || {};
      const text = buildIcs(data.events || {}, { rooms: Array.isArray(data.rooms) ? data.rooms : [], fromKey: dayKeyDaysAgo(30), feed: true });
      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', 'inline; filename="nenemi.ics"');
      return res.status(200).send(text);
    }

    res.setHeader('Cache-Control', 'no-store');

    if (req.method === 'POST') {
      const who = await getIdentity(req);
      if (!who) return res.status(400).json({ error: 'missing sign-in or sync code' });
      if (who.error) return res.status(who.status).json({ error: who.error });
      const fresh = randomBytes(16).toString('hex');
      const rotate = String(req.query?.rotate || '') === '1';
      const rows = rotate
        ? await sql`insert into nenemi_state (device_id, data, feed_token) values (${who.key}, '{}'::jsonb, ${fresh})
                    on conflict (device_id) do update set feed_token = excluded.feed_token
                    returning feed_token`
        : await sql`insert into nenemi_state (device_id, data, feed_token) values (${who.key}, '{}'::jsonb, ${fresh})
                    on conflict (device_id) do update set feed_token = coalesce(nenemi_state.feed_token, excluded.feed_token)
                    returning feed_token`;
      return res.status(200).json({ token: rows[0].feed_token });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    console.error('nenemi /api/calendar', err);
    return res.status(500).json({ error: 'database error' });
  }
}
