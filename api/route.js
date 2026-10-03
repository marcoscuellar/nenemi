// NENEMI capture router — "say it anywhere, it lands in the right room."
//
// POST /api/route
//   headers: Authorization: Bearer <clerk token>   (or ?device=<sync code> while signed out)
//   body:    { text, rooms: [{ id, name, one_liner, brief, loops: [..], recent: [..] }], loose: [..],
//              mode?: 'end_of_day_recap' | 'wrap_up' | 'shrink_move' | 'room_update', pinned_room_id?: string,
//              thread?: [{ said, reply }] }
//   returns: { action, room_id, room_name, one_liner, note, loops_to_add, loops_to_resolve, brief, reply, follow_up }
//
// mode "porch" is the Porch (Home) talking: Claude is the primary router there, not a fallback.
//   body adds local_time ("14:05") and weekday; returns
//   { kind: 'day'|'project'|'mixed'|'stuck'|'go', go_to, go_room_id, items: [{ text, dest, start, end, room_id }],
//     new_room: { name, one_liner } | null, reply }
//   One dump can become many items, each with its own place: today (Today's horizon, timed or anytime),
//   room (a project's steps, grouped), parked (big-picture, a room or held loose), held (venting: heard, not stored).
//
// pinned_room_id locks the decision to that one room (used when the person is
// typing/tapping inside a room's own box, where routing is already decided) —
// enforced server-side, not just prompted for. mode "wrap_up" needs no typed
// text: it asks Claude to recap that room's own recent activity instead.
// mode "shrink_move" asks for one smaller first step for the room's current
// next move — atomic by construction: the server clears loops_to_add,
// loops_to_resolve and brief on the way out, so only "note"/"reply" carry
// anything back, whatever the model returns.
// mode "room_update" is the person typing an update inside a room: the Brief
// is rewritten from it right away, and a follow_up line keeps the conversation
// going (one question or offer about the next small move). "thread" carries
// the last few exchanges in that room so it reads as one conversation.
//
// Nothing the model writes back is trusted to be true on its own: the Brief,
// reply, follow_up and new loops go through lib/grounding.js, and any line
// naming a person, place or number nobody said is dropped (the room keeps
// what it had).
//
// Claude reads the dump plus a trimmed view of the user's rooms and decides:
// file it, start a room, hold it loose, or hand off to the stuck sanctuary.
// Answers 503 when ANTHROPIC_API_KEY isn't configured; the page falls back
// to its simple name-matching.

import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { getIdentity } from '../lib/auth.js';
import { sourceVocabulary, isGrounded, calm } from '../lib/grounding.js';

const API_KEY = process.env.ANTHROPIC_API_KEY || '';
const MODEL = 'claude-opus-5';

const MAX_TEXT = 2000;
const MAX_ROOMS = 30;

const Decision = z.object({
  action: z.enum(['file', 'new_room', 'loose', 'stuck', 'day']),
  day: z.enum(['today', 'tomorrow']).nullable(),
  room_id: z.string().nullable(),
  room_name: z.string().nullable(),
  one_liner: z.string().nullable(),
  note: z.string(),
  loops_to_add: z.array(z.string()),
  loops_to_resolve: z.array(z.string()),
  brief: z.string().nullable(),
  reply: z.string(),
  follow_up: z.string().nullable(),
});

const SYSTEM = `You are the capture router inside NENEMI, a memory app for people with ADHD. Its name is Nahuatl for "to walk, to wander". The person just said or typed something offhand, from anywhere in the app. Your job is to figure out where it belongs and what it changes.

Why the app exists: people with ADHD have every crayon (intelligence, intention, ability) and no box (executive function). NENEMI is the box. Your job is to catch what they say and put it where it belongs so none of their energy goes to rounding up crayons. Never tell them what to do; hold, file, or offer.

The app holds Rooms. A room is one thing the person is working on. Each room has a Brief (where they left off, in plain words), open loops (small next moves), and a log of everything they've said about it.

Decide one action:
- "file": this belongs in an existing room. Use the room's id. Prefer this whenever the person names a room, points at one ("the first room", "that project", "the app"), or the content clearly matches a room's subject. "The first room" or "the one we were talking about" means the first room in the list, which is the one they touched most recently.
- "new_room": this is clearly a new project or area they don't have a room for yet. Give it a short room_name (2 to 4 words, no filler) and a one_liner in their words.
- "loose": a stray thought that doesn't fit anywhere yet and isn't a project. Hold it.
- "stuck": they're saying they can't start, feel frozen, overwhelmed, or paralyzed. Don't file anything; the app will offer one small move.
- "day": they are laying out their day, not a project: two or more things to do or go to, with clock times, deadlines ("by 5"), or day words ("today", "tonight", "this afternoon", "tomorrow"). Errands, appointments, calls, pickups, a workout, "I need to X and then Y by 3". The app builds it on the calendar; do not make a room for it and do not file it. Set "day" to "tomorrow" when they say tomorrow, else "today". A single timed thing that clearly belongs to a room ("the Ollin call moved to 3") is still "file". Never "day" in end_of_day_recap mode.

Also:
- "day": "today" or "tomorrow" when action is "day", else null.
- "note": the thing worth remembering, in their own words, with the ums, ohs, sorrys and false starts removed. Keep their meaning and their phrasing. One to three sentences. For "day", keep every item they mentioned, with its time or deadline, so the planner can read it.
- "loops_to_add": concrete next moves they mentioned, as short imperative phrases. Empty if none.
- "loops_to_resolve": existing open loops of the target room they said are done, quoted exactly. Empty if none.
- "brief": when filing into a room or creating one, rewrite that room's Brief to include this new information. Two or three sentences, under 70 words, second person, present tense, warm, no guilt, no "you should". Say where they left off and what the next small move is. Null for loose and stuck.
- "reply": one short line back to them in NENEMI's voice. Calm, specific, shame-free, no exclamation marks. Say what you did with it, e.g. "Filed under Memory App. The Brief now mentions the blah method."
- "follow_up": null, except in room_update mode (below).

When mode is "end_of_day_recap": they are emptying their head at the end of the day so they don't carry it to bed. Sort what they said: things still open become loops_to_add on the right room (or a new room if it's clearly a project); worries and half-thoughts with nowhere to go are "loose"; anything they say is done, doesn't matter, or they want to drop is let go and not stored anywhere. If most of it is done or venting, action is "loose" with a short note of only what's worth keeping. The reply says, in one line, what's held and what was let go, e.g. "Held the two things for Ollin. The rest can go. Nothing to carry."

If the request includes "pinned_room_id", the person is typing directly inside that room's own box, not from Home — action must be "file" targeting that room_id, unless they're unmistakably saying they're stuck ("stuck"). Never propose "new_room" or file elsewhere when pinned_room_id is set.

When mode is "wrap_up", the person tapped a "wrap up today's progress" button inside pinned_room_id's own room — they typed nothing new. Look only at that room's recent_notes and open_loops already provided: action is "file" targeting pinned_room_id; note is a one or two sentence recap of today's activity in the room, written like a log entry ("Wrapped up: ..."); brief is the refreshed Where-you-left-off text, same rules as always; reply is one short warm confirmation line, e.g. "Today's saved. Pick up here next time."; loops_to_add/loops_to_resolve only when the recent notes clearly imply a change, otherwise empty. Never invent progress that isn't in recent_notes.

When mode is "shrink_move", the person tapped "Too big? Make it smaller" on one specific next move inside pinned_room_id, given as "they_said". It feels too big to start. note must be exactly one smaller physical first step that takes under about a minute to start or finish — concrete, no preamble, no "you could", just the move itself in a few words (e.g. "Open the file and read the first paragraph"). reply can repeat the same move warmly in one short line. Nothing else about the room changes.

When mode is "room_update", the person is typing an update inside pinned_room_id's own room. It's a running conversation: "thread" holds the last few things they said here and what NENEMI said back, oldest first. Action is "file" to pinned_room_id (or "stuck" if they're unmistakably frozen).
- brief: rewrite it from scratch so the first sentence is where things stand right now, after this update. If they finished something, say it's done. If they talked to someone or started something, say where it stands. Then, if still useful for picking back up, one sentence of what came before. End with the next small move, taken from what they said or the open loops. Don't describe what the room is or what it's for (e.g. "This room holds..."); that lives in the room's one_liner, shown on its own line, so drop that kind of line even if the current brief has it. Two or three sentences, under 60 words. Never add a detail, name, time, number, feeling or outcome that isn't in they_said, the thread, or the room data. If they were vague, stay vague. Shorter is better than padded.
- loops_to_resolve: open loops their update says are done, quoted exactly. loops_to_add: only next moves they actually named.
- reply: one short line that acknowledges what they said, specifically and warmly, in their terms, e.g. "The login flow is done." or "Nice, the menu's fixed." No praise inflation, no "great job", no exclamation marks, and nothing about how long it took.
- follow_up: one short line that keeps the conversation going toward one next small move. It's a question or an offer, never an instruction: "Want the menu fix to be next?" or "What's the piece that's still open on the menu?" Point at one thing, never a list. If they said they're done for now or stepping away, follow_up is a quiet close with no question, e.g. "It's all here when you come back."

Never invent facts that aren't in what they said or in the room data. When unsure between filing and a new room, file.`;

const PorchItem = z.object({
  text: z.string(),
  dest: z.enum(['today', 'room', 'parked', 'held']),
  start: z.string().nullable(),
  end: z.string().nullable(),
  room_id: z.string().nullable(),
});
const PorchPlan = z.object({
  kind: z.enum(['day', 'project', 'mixed', 'stuck', 'go']),
  go_to: z.enum(['day', 'rooms', 'room']).nullable(),
  go_room_id: z.string().nullable(),
  items: z.array(PorchItem),
  new_room: z.object({ name: z.string(), one_liner: z.string() }).nullable(),
  reply: z.string(),
});

const PORCH_SYSTEM = `You are the router on the Porch, the home screen of NENEMI, an app for people with ADHD. The person types or says whatever is in their head, in any shape: one thing, a list, a timed plan, a run-on stream with no commas. Read it for meaning, context and intent, the way a friend who knows their life would. Never rely on punctuation or keywords; a messy sentence can hold five separate things.

NENEMI never tells them what to do and never asks where something goes. You decide.

Pick one kind:
- "day": they want to plan or organize today, or they list things to do today, with or without times. Every to-do becomes an item with dest "today".
- "project": the dump is the steps or pieces of one piece of work (e.g. "rebrand the pitch deck, gather assets, draft copy"). Every step becomes an item with dest "room". Use room_id of the existing room it clearly belongs to. If none fits, set room_id null on each step and fill new_room with a short name (2 to 4 words, their words) and a one_liner.
- "mixed": a stream of consciousness. Pull out every separate to-do. Things to do today or soon go to "today". Steps that clearly belong to one of their rooms go to "room" with that room_id. Big-picture ideas, someday plans and backlog go to "parked" (with a room_id if one clearly fits, else null). Feelings, venting, worries and commentary are "held": they are heard, never turned into a task.
- "stuck": they say they are frozen, overwhelmed, can't start, spiralling. items empty.
- "go": a short request to open something ("my day", "show my rooms", "open the pitch deck"). go_to is "day", "rooms" or "room" (with go_room_id). items empty.

Each item:
- text: one short task in their own words, fillers removed, starting with a capital letter, no trailing period. Keep names, places and times they said. Never add anything they didn't say.
- start / end: 24-hour "HH:MM" only when they gave a time for that item ("at 3" in the afternoon context means "15:00"; "by 5" is a deadline, not a start, so leave start null). Use local_time to read "in an hour" or "after lunch" only when it's clear. Otherwise null.
- room_id: only ids from the rooms list, else null.

today_cap: when set, it's how many things this person can hold on Today. If more do-now items come up than fit, the most pressing ones go to "today" and the rest become "parked".

reply: what NENEMI says back, calm, short, specific, no exclamation marks, no therapy language, no praise, never a question, under 40 words. For "day": "Got it. Slotted into Today." For "project": "Grouped these N steps into ROOM." (N and ROOM real). For "mixed": one tight summary of where things went, e.g. "Two things on Today, the app idea is parked in Side projects. The rest I heard, not filing it." For "stuck" and "go": one short line.`;

function hhmm(v) { const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(String(v || '').trim()); return m ? `${m[1].padStart(2, '0')}:${m[2]}` : null; }

async function porchRoute(client, { text, rooms, loose, localTime, weekday, todayCap }) {
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 4096,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'low', format: zodOutputFormat(PorchPlan) },
    system: [{ type: 'text', text: PORCH_SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: JSON.stringify({ rooms, loose_thoughts: loose, local_time: localTime, weekday, today_cap: todayCap, they_said: text }) }],
  });
  if (response.stop_reason === 'refusal') return { kind: 'mixed', go_to: null, go_room_id: null, items: [], new_room: null, reply: 'Heard. Holding that one.' };
  const d = response.parsed_output;
  if (!d) return null;

  // nothing the model says is trusted on its own: real room ids, real times, only words they (or their rooms) used
  const ids = new Set(rooms.map(r => r.id));
  const vocab = sourceVocabulary([text, rooms.map(r => [r.name, r.one_liner]), d.new_room ? [d.new_room.name, d.new_room.one_liner] : []]);
  if (d.go_room_id && !ids.has(d.go_room_id)) d.go_room_id = null;
  if (d.go_to === 'room' && !d.go_room_id) d.go_to = 'rooms';
  if (d.kind !== 'go') { d.go_to = null; d.go_room_id = null; }
  if (d.kind === 'stuck' || d.kind === 'go') d.items = [];
  d.items = d.items.slice(0, 20).map(it => {
    const t = trim(String(it.text || '').trim(), 140);
    const start = hhmm(it.start), end = start ? hhmm(it.end) : null;
    let room_id = it.room_id && ids.has(it.room_id) ? it.room_id : null;
    let dest = it.dest;
    if (dest === 'room' && !room_id && !d.new_room) dest = 'parked';
    if (dest !== 'room' && dest !== 'parked') room_id = null;
    return { text: t, dest, start: dest === 'today' ? start : null, end: dest === 'today' && end && end > start ? end : null, room_id };
  });
  // a task's first word is capitalized by the model ("Pick up the kids"), so it isn't a name; names later in the line still have to be theirs
  const kept = d.items.filter(it => it.text && (it.dest === 'held' || isGrounded(it.text.charAt(0).toLowerCase() + it.text.slice(1), vocab)));
  d.dropped = d.items.filter(it => it.text && it.dest !== 'held').length - kept.filter(it => it.dest !== 'held').length;
  d.items = kept;
  if (todayCap) { let n = 0; d.items.forEach(it => { if (it.dest === 'today' && ++n > todayCap) it.dest = 'parked'; }); } // their own limit, held even if the model forgets it
  if (d.new_room) {
    if (!d.items.some(it => it.dest === 'room' && !it.room_id)) d.new_room = null;
    else d.new_room = { name: trim(d.new_room.name, 60) || trim(text.split(/\s+/).slice(0, 4).join(' '), 60), one_liner: trim(d.new_room.one_liner, 160) };
  }
  // the reply may also use the app's own words and small counts ("3 steps", "Today")
  const replyVocab = new Set([...vocab, ...rooms.map(r => r.name.toLowerCase()), 'today', 'tomorrow', 'room', 'rooms', 'parked', 'loose', 'day',
    ...Array.from({ length: 21 }, (_, i) => String(i))]);
  d.reply = calm(isGrounded(d.reply, replyVocab) ? trim(d.reply, 280) : '');
  return d;
}

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
  const MODES = ['end_of_day_recap', 'wrap_up', 'shrink_move', 'room_update', 'porch'];
  const mode = MODES.includes(body.mode) ? body.mode : null;
  const pinnedRoomId = body.pinned_room_id ? String(body.pinned_room_id) : null;
  const text = trim(String(body.text || '').trim(), MAX_TEXT);
  if (!text && mode !== 'wrap_up') return res.status(400).json({ error: 'nothing to route' });
  if ((mode === 'shrink_move' || mode === 'room_update') && !pinnedRoomId) return res.status(400).json({ error: 'missing pinned room' });

  const rooms = roomsForPrompt(body.rooms);
  const loose = (Array.isArray(body.loose) ? body.loose : []).slice(0, 10).map(t => trim(typeof t === 'string' ? t : t?.text, 160));
  if (pinnedRoomId && !rooms.some(r => r.id === pinnedRoomId)) return res.status(400).json({ error: 'unknown room' });
  const thread = mode === 'room_update' ? (Array.isArray(body.thread) ? body.thread : []).slice(-4).map(t => ({ said: trim(t?.said, 400), reply: trim(t?.reply, 240) })) : [];

  const client = new Anthropic({ apiKey: API_KEY });
  if (mode === 'porch') {
    try {
      const d = await porchRoute(client, { text, rooms, loose, localTime: hhmm(body.local_time), todayCap: [3, 5].includes(Number(body.today_cap)) ? Number(body.today_cap) : null, weekday: trim(String(body.weekday || ''), 12) || null });
      if (!d) return res.status(502).json({ error: 'could not read the model reply' });
      return res.status(200).json(d);
    } catch (err) {
      if (err instanceof Anthropic.RateLimitError) return res.status(429).json({ error: 'busy, try again in a moment' });
      if (err instanceof Anthropic.AuthenticationError) { console.error('nenemi route: bad ANTHROPIC_API_KEY'); return res.status(503).json({ error: 'smart routing misconfigured' }); }
      console.error('nenemi /api/route porch', err?.message || err);
      return res.status(502).json({ error: 'routing failed' });
    }
  }
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
          mode,
          pinned_room_id: pinnedRoomId,
          ...(mode === 'room_update' ? { thread } : {}),
          they_said: text || null,
        }),
      }],
    });

    if (response.stop_reason === 'refusal') return res.status(200).json({ action: 'loose', day: null, room_id: null, room_name: null, one_liner: null, note: text, loops_to_add: [], loops_to_resolve: [], brief: null, reply: "Holding that one loose for now.", follow_up: null });

    const d = response.parsed_output;
    if (!d) return res.status(502).json({ error: 'could not read the model reply' });

    // a pinned room is a hard constraint, not a suggestion — the model never gets to move or lose it
    if (pinnedRoomId && d.action !== 'stuck') { d.action = 'file'; d.room_id = pinnedRoomId; }

    // never trust a room id that isn't the user's
    if (d.action === 'file' && !rooms.some(r => r.id === d.room_id)) d.action = rooms.length ? 'loose' : 'new_room';
    if (d.action === 'new_room' && !d.room_name) d.room_name = trim(d.note.split(/\s+/).slice(0, 4).join(' '), 60);
    if (d.action === 'day' && mode === 'end_of_day_recap') d.action = 'loose';
    if (d.action !== 'day') d.day = null; else if (d.day !== 'tomorrow') d.day = 'today';

    // shrink_move is atomic: only the replacement step text leaves this endpoint, whatever else the model returned
    if (mode === 'shrink_move') { d.action = 'file'; d.room_id = pinnedRoomId; d.loops_to_add = []; d.loops_to_resolve = []; d.brief = null; d.day = null; }
    if (mode !== 'room_update') d.follow_up = null;

    // no made-up stories: whatever comes back may only name people, places and numbers the person or their rooms already did
    if (mode !== 'shrink_move') {
      const vocab = sourceVocabulary([text, loose, thread.map(t => [t.said, t.reply]),
        rooms.map(r => [r.name, r.one_liner, r.brief, r.open_loops, r.recent_notes]), d.action === 'new_room' ? [d.room_name] : []]);
      const dropped = [];
      if (d.brief && !isGrounded(d.brief, vocab)) { d.brief = null; dropped.push('brief'); }
      if (d.follow_up && !isGrounded(d.follow_up, vocab)) { d.follow_up = null; dropped.push('follow_up'); }
      if (d.reply && !isGrounded(d.reply, vocab)) { d.reply = ''; dropped.push('reply'); }
      const before = d.loops_to_add.length;
      d.loops_to_add = d.loops_to_add.filter(l => isGrounded(l, vocab));
      if (d.loops_to_add.length < before) dropped.push('loops');
      if (dropped.length) console.warn('nenemi /api/route: dropped ungrounded', dropped.join(','));
    }
    d.brief = calm(d.brief); d.reply = calm(d.reply); d.follow_up = calm(d.follow_up);

    return res.status(200).json({ ...d, usage: { input: response.usage.input_tokens, output: response.usage.output_tokens, cached: response.usage.cache_read_input_tokens || 0 } });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) return res.status(429).json({ error: 'busy, try again in a moment' });
    if (err instanceof Anthropic.AuthenticationError) { console.error('nenemi route: bad ANTHROPIC_API_KEY'); return res.status(503).json({ error: 'smart routing misconfigured' }); }
    console.error('nenemi /api/route', err?.message || err);
    return res.status(502).json({ error: 'routing failed' });
  }
}
export { porchRoute }; // exported for local checks
