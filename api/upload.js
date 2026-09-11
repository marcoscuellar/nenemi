// NENEMI file/photo upload — one attachment lands in one room's log as a Blob URL.
//
// POST /api/upload
//   headers: Authorization: Bearer <clerk token>   (or ?device=<sync code> while signed out)
//   body:    { name, type, dataUrl }   (dataUrl = "data:<type>;base64,....")
//   returns: { url }
//
// The page resizes photos to a max edge of 1600px before sending, so the
// data URL stays well under the request-size ceiling. Answers 503 when
// BLOB_READ_WRITE_TOKEN isn't configured — Marcos creates the Blob store
// once in Vercel (Storage tab) and the token appears by itself, no key
// ever lives in the repo.

import { put } from '@vercel/blob';
import { getIdentity } from '../lib/auth.js';

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
