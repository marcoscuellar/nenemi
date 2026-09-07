// NENEMI capture router — "say it anywhere, it lands in the right room."
//
// POST /api/route
//   headers: Authorization: Bearer <clerk token>   (or ?device=<sync code> while signed out)
//   body:    { text, rooms: [{ id, name, one_liner, brief, loops: [..], recent: [..] }], loose: [..] }
//   returns: { action, room_id, room_name, one_liner, note, loops_to_add, loops_to_resolve, brief, reply }
//
// Claude reads the dump plus a trimmed view of the user's rooms and decides:
// file it, start a room, hold it loose, or hand off to the stuck sanctuary.
// Answers 503 when ANTHROPIC_API_KEY isn't configured; the page falls back
// to its simple name-matching.

import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { getIdentity } from '../lib/auth.js';

const API_KEY = process.env.ANTHROPIC_API_KEY || '';
const MODEL = 'claude-opus-5';

const MAX_TEXT = 2000;
const MAX_ROOMS = 30;

const Decision = z.object({
  action: z.enum(['file', 'new_room', 'loose', 'stuck']),
  room_id: z.string().nullable(),
  room_name: z.string().nullable(),
  one_liner: z.string().nullable(),
  note: z.string(),
  loops_to_add: z.array(z.string()),
  loops_to_resolve: z.array(z.string()),
  brief: z.string().nullable(),
  reply: z.string(),
});

const SYSTEM = `You are the capture router inside NENEMI, a memory app for people with ADHD. Its name is Nahuatl for "to walk, to wander". The person just said or typed something offhand, from anywhere in the app. Your job is to figure out where it belongs and what it changes.

Why the app exists: people with ADHD have every crayon (intelligence, intention, ability) and no box (executive function). NENEMI is the box. Your job is to catch what they say and put it where it belongs so none of their energy goes to rounding up crayons. Never tell them what to do; hold, file, or offer.

The app holds Rooms. A room is one thing the person is working on. Each room has a Brief (where they left off, in plain words), open loops (small next moves), and a log of everything they've said about it.

Decide one action:
- "file": this belongs in an existing room. Use the room's id. Prefer this whenever the person names a room, points at one ("the first room", "that project", "the app"), or the content clearly matches a room's subject. "The first room" or "the one we were talking about" means the first room in the list, which is the one they touched most recently.
- "new_room": this is clearly a new project or area they don't have a room for yet. Give it a short room_name (2 to 4 words, no filler) and a one_liner in their words.
- "loose": a stray thought that doesn't fit anywhere yet and isn't a project. Hold it.
- "stuck": they're saying they can't start, feel frozen, overwhelmed, or paralyzed. Don't file anything; the app will offer one small move.

Also:
- "note": the thing worth remembering, in their own words, with the ums, ohs, sorrys and false starts removed. Keep their meaning and their phrasing. One to three sentences.
- "loops_to_add": concrete next moves they mentioned, as short imperative phrases. Empty if none.
- "loops_to_resolve": existing open loops of the target room they said are done, quoted exactly. Empty if none.
- "brief": when filing into a room or creating one, rewrite that room's Brief to include this new information. Two or three sentences, under 70 words, second person, present tense, warm, no guilt, no "you should". Say where they left off and what the next small move is. Null for loose and stuck.
- "reply": one short line back to them in NENEMI's voice. Calm, specific, shame-free, no exclamation marks. Say what you did with it, e.g. "Filed under Memory App. The Brief now mentions the blah method."

Never invent facts that aren't in what they said or in the room data. When unsure between filing and a new room, file.`;

function trim(s, n) { return typeof s === 'string' ? (s.length > n ? s.slice(0, n) + '…' : s) : ''; }

function roomsForPrompt(rooms) {
  return (Array.isArray(rooms) ? rooms : []).slice(0, MAX_ROOMS).map(r => ({
    id: String(r.id || ''),
    name: trim(r.name, 80),
    one_liner: trim(r.one_liner, 160),
    brief: trim(r.brief, 400),
    open_loops: (Array.isArray(r.loops) ? r.loops : []).slice(0, 8).map(l => trim(typeof l === 'string' ? l : l?.text, 120)),
    recent_notes: (Array.isArray(r.recent) ? r.recent : []).slice(0, 4).map(t => trim(t, 160)),
  }));
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'method not allowed' }); }
  if (!API_KEY) return res.status(503).json({ error: 'smart routing not configured' });

  const who = await getIdentity(req);
  if (!who) return res.status(400).json({ error: 'missing sign-in or sync code' });
  if (who.error) return res.status(who.status).json({ error: who.error });

  const body = req.body || {};
  const text = trim(String(body.text || '').trim(), MAX_TEXT);
  if (!text) return res.status(400).json({ error: 'nothing to route' });

  const rooms = roomsForPrompt(body.rooms);
  const loose = (Array.isArray(body.loose) ? body.loose : []).slice(0, 10).map(t => trim(typeof t === 'string' ? t : t?.text, 160));

  const client = new Anthropic({ apiKey: API_KEY });
  try {
    const response = await client.messages.parse({
      model: MODEL,
      max_tokens: 2048,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'low', format: zodOutputFormat(Decision) },
      system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
      messages: [{
        role: 'user',
        content: JSON.stringify({
          rooms,
          loose_thoughts: loose,
          they_said: text,
        }),
      }],
    });

    if (response.stop_reason === 'refusal') return res.status(200).json({ action: 'loose', room_id: null, room_name: null, one_liner: null, note: text, loops_to_add: [], loops_to_resolve: [], brief: null, reply: "Holding that one loose for now." });

    const d = response.parsed_output;
    if (!d) return res.status(502).json({ error: 'could not read the model reply' });

    // never trust a room id that isn't the user's
    if (d.action === 'file' && !rooms.some(r => r.id === d.room_id)) d.action = rooms.length ? 'loose' : 'new_room';
    if (d.action === 'new_room' && !d.room_name) d.room_name = trim(d.note.split(/\s+/).slice(0, 4).join(' '), 60);

    return res.status(200).json({ ...d, usage: { input: response.usage.input_tokens, output: response.usage.output_tokens, cached: response.usage.cache_read_input_tokens || 0 } });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) return res.status(429).json({ error: 'busy, try again in a moment' });
    if (err instanceof Anthropic.AuthenticationError) { console.error('nenemi route: bad ANTHROPIC_API_KEY'); return res.status(503).json({ error: 'smart routing misconfigured' }); }
    console.error('nenemi /api/route', err?.message || err);
    return res.status(502).json({ error: 'routing failed' });
  }
}
