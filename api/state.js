// NENEMI sync endpoint — one row per sync code, whole app state as JSON.
// GET  /api/state?device=<code>  -> { data, updated_at } or { data: null }
// PUT  /api/state?device=<code>  body: the state object -> { ok: true }
//
// Vercel + Neon. The connection string is whatever Vercel's Neon
// integration created; all the usual names are checked. If none is set
// the endpoint answers 503 and the app keeps saving in the browser.

import { neon } from '@neondatabase/serverless';

const URL =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.STORAGE_URL ||
  process.env.NEON_DATABASE_URL ||
  process.env.DATABASE_URL_UNPOOLED ||
  '';

const CODE = /^[A-Za-z0-9_-]{4,64}$/;
const MAX_BYTES = 512 * 1024; // half a megabyte of rooms is a lot of rooms

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

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!URL) return res.status(503).json({ error: 'no database connected' });

  const code = String(req.query.device || '').trim();
  if (!CODE.test(code)) return res.status(400).json({ error: 'bad sync code' });

  try {
    const sql = await db();

    if (req.method === 'GET') {
      const rows = await sql`select data, updated_at from nenemi_state where device_id = ${code}`;
      return res.status(200).json(rows[0] ? { data: rows[0].data, updated_at: rows[0].updated_at } : { data: null });
    }

    if (req.method === 'PUT') {
      const data = req.body;
      if (!data || typeof data !== 'object' || Array.isArray(data)) return res.status(400).json({ error: 'body must be a JSON object' });
      const json = JSON.stringify(data);
      if (json.length > MAX_BYTES) return res.status(413).json({ error: 'state too large' });
      await sql`insert into nenemi_state (device_id, data, updated_at)
                values (${code}, ${json}::jsonb, now())
                on conflict (device_id) do update set data = excluded.data, updated_at = now()`;
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    console.error('nenemi /api/state', err);
    return res.status(500).json({ error: 'database error' });
  }
}
