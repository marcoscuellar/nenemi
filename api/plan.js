// NENEMI day planner — "dump the day, get one usable day back."
//
// POST /api/plan
//   headers: Authorization: Bearer <clerk token>   (or ?device=<sync code> while signed out)
//   body:    { text, day: 'YYYY-MM-DD', weekday, is_today, now: 'HH:MM',
//              existing: [{ start:'HH:MM', end:'HH:MM', name, kind }], rooms: [{ id, name }] }
//   returns: { items: [{ name, kind, start, minutes, avoiding, room_id }], day_start, heard_but_left_out, reply }
//
// Claude reads the rambling voice dump (ums, asides, apologies, questions)
// and returns only the real things that belong on the day. The page places
// anything without a clock time around what is already there.
// Answers 503 when ANTHROPIC_API_KEY isn't configured; the page falls back
// to its simple splitter.

import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { getIdentity } from '../lib/auth.js';

const API_KEY = process.env.ANTHROPIC_API_KEY || '';
const MODEL = 'claude-opus-5';

const MAX_TEXT = 3000;
const MAX_EXISTING = 40;
const MAX_ROOMS = 30;
const MAX_ITEMS = 14;

const HHMM = /^([01]?\d|2[0-3]):[0-5]\d$/;

const Plan = z.object({
  items: z.array(z.object({
    name: z.string(),
    kind: z.enum(['fixed', 'block', 'buffer']),
    start: z.string().nullable(),
    minutes: z.number(),
    avoiding: z.boolean(),
    room_id: z.string().nullable(),
  })),
  day_start: z.string().nullable(),
  heard_but_left_out: z.array(z.string()),
  reply: z.string(),
});

const SYSTEM = `You are the day planner inside NENEMI, a memory app for people with ADHD. Its name is Nahuatl for "to walk, to wander". The person just dumped their day, usually by voice, exactly as it came out: ums, false starts, "sorry", asides, questions to you, half sentences. Your job is to hear what is actually in there and hand back one usable day. Nothing else.

Why the app exists: people with ADHD have every crayon (intelligence, intention, ability) and no box (executive function). NENEMI is the box. The person should be able to say everything at once, messy, and get a day back without organizing anything first. Never tell them what to do; offer, hold, arrange.

What counts as an item:
- A real thing to do, attend, or protect: a meeting, a call, an errand, a task, a workout, a meal, rest, a walk, picking someone up.
- Merge fragments that are one thing. "The proposal, I need to finish it, the opener part" is one item: "Finish the proposal opener".
- Name each item in their words, cleaned: 2 to 6 words, no "I need to", no "um", proper capitalization, no trailing punctuation.

What is NOT an item (put a short version in heard_but_left_out instead, or drop it):
- Filler and reactions: "yeah", "okay", "so", "sorry", "I don't know".
- Facts and context: "today is Labor Day", "which is Monday", "it's late".
- Questions or requests aimed at NENEMI: "can we start my day at 7", "can you move that". Handle them (see day_start) but never schedule them.
- Things that already exist on the day (see existing_on_the_day). Don't duplicate them. If they mention something that is already there, leave it out.

Kinds:
- "fixed": has a real clock time or is an appointment with other people. Give start as "HH:MM" 24-hour. Duration: as stated, else 60 minutes for meetings and appointments, 30 for calls.
- "block": focused work they will do on their own. start is null unless they gave a time. Duration: 25 to 60 minutes, usually 40. Big or dreaded things get shorter, not longer: the first move on something scary is 30 minutes.
- "buffer": food, rest, movement, air, transit, a break. start is null unless they said a time. 30 to 60 minutes. If they mention lunch with no time, start is null.

avoiding: true when they say they are dreading, avoiding, putting off, hate, or "ugh" about it. The app puts that one first and small.

room_id: the id of one of their rooms when the item clearly belongs to that project, else null.

day_start: "HH:MM" when they say when they want the day to begin ("start my day at 7", "I'm up at 6", "nothing before 10"), else null.

Order items the way the day should go: fixed things stay where they are, the avoided thing early, buffers where a person needs them, the rest in a sane order. Keep it to at most ${MAX_ITEMS} items; if they said more than that, keep the ones with times and the ones they sounded most serious about, and list the rest in heard_but_left_out.

reply: one short line back in NENEMI's voice. Calm, specific, no exclamation marks, no imperatives at the person. Say what the day now holds in plain words, e.g. "Built around the 2pm. Taxes goes first, 30 minutes, then lunch has air around it." If you left real things out, say so in one clause.

Never invent items that aren't in what they said.`;

function trim(s, n) { return typeof s === 'string' ? (s.length > n ? s.slice(0, n) + '…' : s) : ''; }
function hhmm(s) { return typeof s === 'string' && HHMM.test(s.trim()) ? s.trim() : null; }

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'method not allowed' }); }
  if (!API_KEY) return res.status(503).json({ error: 'day planning not configured' });

  const who = await getIdentity(req);
  if (!who) return res.status(400).json({ error: 'missing sign-in or sync code' });
  if (who.error) return res.status(who.status).json({ error: who.error });

  const body = req.body || {};
  const text = trim(String(body.text || '').trim(), MAX_TEXT);
  if (!text) return res.status(400).json({ error: 'nothing to plan' });

  const rooms = (Array.isArray(body.rooms) ? body.rooms : []).slice(0, MAX_ROOMS).map(r => ({ id: String(r.id || ''), name: trim(r.name, 80) }));
  const existing = (Array.isArray(body.existing) ? body.existing : []).slice(0, MAX_EXISTING).map(e => ({
    start: hhmm(e.start), end: hhmm(e.end), name: trim(e.name, 80), kind: ['fixed', 'block', 'buffer'].includes(e.kind) ? e.kind : 'block',
  })).filter(e => e.start && e.name);

  const client = new Anthropic({ apiKey: API_KEY });
  try {
    const response = await client.messages.parse({
      model: MODEL,
      max_tokens: 3000,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'low', format: zodOutputFormat(Plan) },
      system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
      messages: [{
        role: 'user',
        content: JSON.stringify({
          the_day: { date: trim(String(body.day || ''), 10), weekday: trim(String(body.weekday || ''), 12), is_today: Boolean(body.is_today), local_time_now: hhmm(body.now) },
          existing_on_the_day: existing,
          rooms,
          they_said: text,
        }),
      }],
    });

    if (response.stop_reason === 'refusal') return res.status(200).json({ items: [], day_start: null, heard_but_left_out: [], reply: "Couldn't make a day out of that one. Say it again, any way you like." });

    const p = response.parsed_output;
    if (!p) return res.status(502).json({ error: 'could not read the model reply' });

    // keep the page safe from anything odd the model hands back
    const items = (p.items || []).slice(0, MAX_ITEMS).map(it => ({
      name: trim(String(it.name || '').trim(), 80),
      kind: ['fixed', 'block', 'buffer'].includes(it.kind) ? it.kind : 'block',
      start: hhmm(it.start),
      minutes: Math.min(240, Math.max(10, Math.round(Number(it.minutes) || 40))),
      avoiding: Boolean(it.avoiding),
      room_id: rooms.some(r => r.id === it.room_id) ? it.room_id : null,
    })).filter(it => it.name);
    items.forEach(it => { if (it.kind === 'fixed' && !it.start) it.kind = 'block'; });

    return res.status(200).json({
      items,
      day_start: hhmm(p.day_start),
      heard_but_left_out: (p.heard_but_left_out || []).slice(0, 10).map(s => trim(String(s), 80)),
      reply: trim(String(p.reply || ''), 240),
      usage: { input: response.usage.input_tokens, output: response.usage.output_tokens, cached: response.usage.cache_read_input_tokens || 0 },
    });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) return res.status(429).json({ error: 'busy, try again in a moment' });
    if (err instanceof Anthropic.AuthenticationError) { console.error('nenemi plan: bad ANTHROPIC_API_KEY'); return res.status(503).json({ error: 'day planning misconfigured' }); }
    console.error('nenemi /api/plan', err?.message || err);
    return res.status(502).json({ error: 'planning failed' });
  }
}
