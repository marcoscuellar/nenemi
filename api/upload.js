// NENEMI file/photo upload — one attachment lands in one room's log as a Blob URL.
//
// POST /api/upload
//   headers: Authorization: Bearer <clerk token>   (or ?device=<sync code> while signed out)
//   body:    { name, type, dataUrl, roomId? }   (dataUrl = "data:<type>;base64,....")
//   returns: { url }
//            402 { error: 'file_limit', limit } when roomId names a room already holding its cap
//            (5 files on Free, 25 on Full access). Loose drops on Home carry no roomId and aren't capped.
//
// The page resizes photos to a max edge of 1600px before sending, so the
// data URL stays well under the request-size ceiling. Answers 503 when
// BLOB_READ_WRITE_TOKEN isn't configured — Marcos creates the Blob store
// once in Vercel (Storage tab) and the token appears by itself, no key
// ever lives in the repo.

import { put } from '@vercel/blob';
import { neon } from '@neondatabase/serverless';
import { getIdentity, fileLimitFor } from '../lib/auth.js';

const DB_URL =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.STORAGE_URL ||
  process.env.NEON_DATABASE_URL ||
  process.env.DATABASE_URL_UNPOOLED ||
  '';

// files already in this room, from the last synced state. No database, no row, or no such room -> 0,
// so the page's own check is the only gate (the page counts its local copy before it ever uploads).
async function filesInRoom(key, roomId) {
  if (!DB_URL || !roomId) return 0;
  try {
    const sql = neon(DB_URL);
    const rows = await sql`select data from nenemi_state where device_id = ${key}`;
    const room = (rows[0]?.data?.rooms || []).find(r => r && r.id === roomId);
    return Array.isArray(room?.log) ? room.log.filter(e => e && e.file).length : 0;
  } catch (e) {
    console.error('nenemi /api/upload count', e?.message || e);
    return 0;
  }
}

const TOKEN = process.env.BLOB_READ_WRITE_TOKEN || '';
const MAX_BYTES = 3 * 1024 * 1024; // 3MB raw — a resized phone photo is comfortably under this
const OK_TYPE = /^(image\/(jpeg|png|webp|gif|heic)|application\/pdf)$/;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'method not allowed' }); }
  if (!TOKEN) return res.status(503).json({ error: 'storage not connected' });

  const who = await getIdentity(req);
  if (!who) return res.status(400).json({ error: 'missing sign-in or sync code' });
  if (who.error) return res.status(who.status).json({ error: who.error });

  const body = req.body || {};
  const roomId = String(body.roomId || '').slice(0, 80);
  const limit = fileLimitFor(who.plan);
  if (roomId && (await filesInRoom(who.key, roomId)) >= limit) return res.status(402).json({ error: 'file_limit', limit });
  const name = String(body.name || 'file').trim().slice(0, 120) || 'file';
  const type = String(body.type || '').trim();
  const dataUrl = String(body.dataUrl || '');

  const m = /^data:([^;,]+)(?:;charset=[^;,]+)?;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!m) return res.status(400).json({ error: 'bad file data' });
  const mimeFromData = m[1];
  if (!OK_TYPE.test(type) && !OK_TYPE.test(mimeFromData)) return res.status(400).json({ error: 'file type not supported' });

  let buf;
  try { buf = Buffer.from(m[2], 'base64'); } catch (e) { return res.status(400).json({ error: 'bad file data' }); }
  if (!buf.length) return res.status(400).json({ error: 'bad file data' });
  if (buf.length > MAX_BYTES) return res.status(413).json({ error: 'file too large' });

  try {
    const safeName = name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const safeKey = String(who.key || 'anon').replace(/[^a-zA-Z0-9_-]/g, '_');
    const pathname = `${safeKey}/${Date.now()}-${safeName}`;
    const blob = await put(pathname, buf, {
      access: 'public',
      contentType: type || mimeFromData,
      token: TOKEN,
    });
    return res.status(200).json({ url: blob.url });
  } catch (err) {
    console.error('nenemi /api/upload', err?.message || err);
    return res.status(502).json({ error: 'upload failed' });
  }
}
