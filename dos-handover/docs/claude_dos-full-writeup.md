# DOS — Everything Built This Session

One document: the idea, the spec, the branding/tokens, and every piece of logic written, in full. Nothing summarized or trimmed out.

Status check first, so this isn't misread: **none of this code has been run.** This sandbox has no internet access to install packages, so it was hand-checked for syntax only (balanced brackets, correct imports) — never actually loaded in a browser. It also does nothing live yet — Rooms/Memory needs your own Supabase project + keys, and chat/routing needs an Anthropic API key, neither of which are connected.

---

## 1. The original idea, in your words

"It's ok, I have DOS — it's the context, the content, no more restarting the app. It holds context of your projects, holds each one in a room, so you can walk into it and it has a 'brief.' Doesn't make you restart. 'Where did I leave that?' — it knows. I can talk to it, and it will parse what I say and act on it — so if I'm walking and say 'oh, make sure we find the right logo for the memory app,' it knows to log that in the right room."

Plus two direct instructions given mid-build:
- "the main landing page should be the ai chat bot"
- "I may change the branding" (branding not finalized — see Section 3)

---

## 2. Core concept — three primitives

**Rooms** (aka Projects) — a persistent container per thing-you're-working-on. Each Room has:
- A name + a one-line identity ("the memory app," "taxes," "mom's bday")
- A **Brief** — always-current summary of where it stands, regenerated as new info lands. This is the "where did I leave that" answer.
- A memory log — timestamped entries: notes, decisions, links, files, voice captures
- Open loops — small unresolved items surfaced in the Brief

**Capture Inbox** — the always-listening front door. You type or speak a stray thought at any time. DOS:
1. Parses intent from the raw utterance (ignores "um," rambling, transcription noise)
2. Matches it to an existing Room by content, or asks once if ambiguous
3. Logs it into that Room's memory log and updates the Brief
4. Confirms briefly ("Got it — logged to Memory App")

**Walking back in** — opening a Room shows the Brief first, never a blank slate or raw log.

### Why this fits the existing app
The uploaded DailyOps app already had the tone system (Override, Catalyst, Dopa-Menu) — the executive-function *doing* layer. Rooms/Memory is the missing *context* layer underneath it.

---

## 3. Branding / design tokens

Nothing new was invented — the app already had a design system (in `DOSHub.css`); it was extracted into one shared file so a rebrand later is a palette swap, not a rewrite. **You said you may change branding — this is exactly the file that changes when you do.**

`src/styles/theme.css`:

```css
:root {
  --dos-paper: #F3F1EB;
  --dos-panel: #FAF8F2;
  --dos-green: #1E3B30;
  --dos-green-deep: #14271F;
  --dos-green-mid: #2A4F40;
  --dos-gold: #C89C4A;
  --dos-gold-deep: #A6813C;
  --dos-gold-tint: rgba(200, 156, 74, 0.16);
  --dos-gold-cream: #F7F0DF;

  --dos-ink: #1E3B30;
  --dos-text-soft: #4A5E56;
  --dos-text-quiet: #6B7872;
  --dos-text-faint: #8B8B82;
  --dos-text-faintest: #A8A89E;
  --dos-placeholder: #B8B5AB;

  --dos-rule: rgba(30, 59, 48, 0.10);
  --dos-rule-soft: rgba(30, 59, 48, 0.06);

  --dos-ease: cubic-bezier(.4, 0, .2, 1);
  --dos-ease-quiet: cubic-bezier(.2, 0, 0, 1);
  --dos-dur-fast: 140ms;
  --dos-dur-medium: 220ms;
  --dos-dur-slow: 320ms;
  --dos-dur-arrival: 600ms;

  --dos-font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --dos-font-display: 'Inter', -apple-system, sans-serif;
  --dos-font-serif: 'DM Serif Display', Georgia, serif;
  --dos-font-mono: 'JetBrains Mono', 'Courier New', monospace;
}
```

**Meaning:** green (`--dos-green`) is the primary ink/action color, gold is the accent/highlight (used for the "step complete" states and focus timers), paper/panel are the two background layers (page vs. card). Three type roles: Inter for body/UI text, DM Serif Display (italic) for the "voice" moments — the Brief text and big questions — and JetBrains Mono for labels, timers, and system-y small caps text.

---

## 4. Data model (Supabase schema)

`supabase/schema.sql` — three tables, device-scoped (no login required in v0):

```sql
create extension if not exists "pgcrypto";

create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  name text not null,
  one_liner text default '',
  status text not null default 'active' check (status in ('active','paused','archived')),
  brief_text text default '',
  brief_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists memory_entries (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  device_id text not null,
  source text not null default 'typed' check (source in ('typed','voice','auto-routed')),
  raw_text text not null,
  created_at timestamptz not null default now()
);

create table if not exists open_loops (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  device_id text not null,
  text text not null,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_rooms_device on rooms(device_id);
create index if not exists idx_memory_room on memory_entries(room_id);
create index if not exists idx_loops_room on open_loops(room_id);

create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_rooms_updated_at on rooms;
create trigger trg_rooms_updated_at before update on rooms
  for each row execute function set_updated_at();

-- RLS: v0 is device-scoped, not auth-scoped. Open policies filtered by
-- device_id from the client. Tighten when real auth lands — this is not
-- real security, just enough structure to swap in auth.uid() later.
alter table rooms enable row level security;
alter table memory_entries enable row level security;
alter table open_loops enable row level security;

create policy "device can read own rooms" on rooms for select using (true);
create policy "device can write own rooms" on rooms for all using (true) with check (true);
create policy "device can read own memory" on memory_entries for select using (true);
create policy "device can write own memory" on memory_entries for all using (true) with check (true);
create policy "device can read own loops" on open_loops for select using (true);
create policy "device can write own loops" on open_loops for all using (true) with check (true);
```

**How to actually use this:** create a free Supabase project, open its SQL editor, paste and run this file, then copy the project's URL + anon key into `.env` (see Section 8).

---

## 5. Every piece of application logic

### 5a. `src/lib/supabase.js` — connection + device identity

```js
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// In dev without keys set, we don't want a hard crash — we want the app to
// still render so the rest of the UI can be worked on. Callers should check
// `isSupabaseConfigured` before relying on persistence.
export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey)
  : null;

// v0 has no login flow — each browser/device gets a stable random id so
// rooms persist across reloads on the same machine. Swap for auth.uid()
// later without changing the shape of rooms/memory_entries/open_loops.
const DEVICE_ID_KEY = 'dos_device_id';

export function getDeviceId() {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}
```

**What this does:** gives every browser/device a stable random ID (stored in localStorage) so your Rooms are tied to your device without a login screen. `isSupabaseConfigured` lets the rest of the app render even before you've set up a database, instead of crashing.

### 5b. `src/lib/rooms.js` — all CRUD operations on Rooms/Memory/Loops

```js
import { supabase, getDeviceId } from './supabase';

// Thin data-access layer over the rooms/memory_entries/open_loops tables.
// Everything here is scoped to the current device_id (see supabase.js for
// why: v0 has no login, so persistence is per-device rather than per-user).

export async function listRooms() {
  const deviceId = getDeviceId();
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('device_id', deviceId)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getRoom(roomId) {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', roomId)
    .single();
  if (error) throw error;
  return data;
}

export async function createRoom({ name, one_liner = '' }) {
  const deviceId = getDeviceId();
  const { data, error } = await supabase
    .from('rooms')
    .insert({ device_id: deviceId, name, one_liner })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateRoomBrief(roomId, briefText) {
  const { error } = await supabase
    .from('rooms')
    .update({ brief_text: briefText, brief_updated_at: new Date().toISOString() })
    .eq('id', roomId);
  if (error) throw error;
}

export async function listMemoryEntries(roomId) {
  const { data, error } = await supabase
    .from('memory_entries')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function addMemoryEntry(roomId, { raw_text, source = 'typed' }) {
  const deviceId = getDeviceId();
  const { data, error } = await supabase
    .from('memory_entries')
    .insert({ room_id: roomId, device_id: deviceId, raw_text, source })
    .select()
    .single();
  if (error) throw error;
  // Touch the room's updated_at so the Rooms Hub sorts by recency.
  await supabase.from('rooms').update({ updated_at: new Date().toISOString() }).eq('id', roomId);
  return data;
}

export async function listOpenLoops(roomId) {
  const { data, error } = await supabase
    .from('open_loops')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function addOpenLoop(roomId, text) {
  const deviceId = getDeviceId();
  const { error } = await supabase
    .from('open_loops')
    .insert({ room_id: roomId, device_id: deviceId, text });
  if (error) throw error;
}

export async function resolveOpenLoop(loopId, resolved = true) {
  const { error } = await supabase
    .from('open_loops')
    .update({ resolved })
    .eq('id', loopId);
  if (error) throw error;
}
```

### 5c. `src/lib/dosAssistant.js` — the "parse what I say and act on it" brain

This is the core logic behind your original request. Three Claude-powered functions:

```js
// The "parse what I say and act on it" brain. Kept as plain fetch calls to
// the Anthropic Messages API directly from the browser, matching the pattern
// already used in Session.jsx (OverrideScreen / CatalystScreen). If this ever
// moves behind a real backend, only this file needs to change.

const MODEL = 'claude-sonnet-4-20250514';

async function callClaude(system, userContent, maxTokens = 512) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
      'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: userContent }],
    }),
  });
  const json = await res.json();
  const raw = (json.content || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim();
  return raw;
}

function parseJSON(raw, fallback) {
  try {
    return JSON.parse(raw.replace(/```json|```/g, '').trim());
  } catch {
    return fallback;
  }
}

// --- 1. ROUTING: figures out which Room a stray thought belongs to ---
const ROUTE_PROMPT = `You are DOS's capture router. The user just said or typed something offhand —
possibly while walking, mid-thought, low-effort. Your job: figure out which
existing "Room" (project) this belongs to, or whether it's a brand new one.

Ignore filler ("um", "oh", "so"), rambling, and typos — extract the intent only.

You will be given the user's utterance and a list of existing rooms
(id, name, one_liner). Respond ONLY in this exact JSON shape:
{
  "matched_room_id": "<uuid or null>",
  "confidence": "high" | "low" | "none",
  "cleaned_entry": "a short, clean sentence capturing what should be logged",
  "suggested_new_room_name": "<name or null — only if no room fits and this reads like a new project>",
  "reply": "one short, warm sentence back to the user, conversational, no lecturing"
}

If confidence is "high", assume matched_room_id is correct and the caller will log it automatically.
If "low" or "none", the caller will ask the user to confirm — so suggested_new_room_name matters more in that case.`;

export async function routeCapture(utterance, rooms) {
  const roomList = rooms.map((r) => ({ id: r.id, name: r.name, one_liner: r.one_liner }));
  const raw = await callClaude(
    ROUTE_PROMPT,
    `Existing rooms:\n${JSON.stringify(roomList, null, 2)}\n\nUser said: "${utterance}"\n\nJSON only.`
  );
  return parseJSON(raw, {
    matched_room_id: null,
    confidence: 'none',
    cleaned_entry: utterance,
    suggested_new_room_name: null,
    reply: "Got it — logged.",
  });
}

// --- 2. BRIEF WRITING: keeps each Room's "where did I leave that" summary current ---
const BRIEF_PROMPT = `You write the "Brief" for a Room in DOS — a memory app for someone with ADHD.
The Brief is the FIRST thing they see when they open this room after being away.
It must answer, in a few calm sentences: where does this stand, what was the last
thing that happened, and what's still open. No headers, no bullet list — just
plain, warm, specific prose. 3-5 sentences max. Never shame, never say "you should have."

Respond ONLY in this exact JSON shape:
{ "brief": "the brief text" }`;

export async function regenerateBrief(room, recentEntries) {
  const entryText = recentEntries
    .slice(0, 12)
    .map((e) => `- (${new Date(e.created_at).toLocaleString()}) ${e.raw_text}`)
    .join('\n');
  const raw = await callClaude(
    BRIEF_PROMPT,
    `Room: "${room.name}" — ${room.one_liner || 'no description yet'}\n\nMemory log (most recent first):\n${entryText || '(empty — first entry)'}\n\nJSON only.`
  );
  const parsed = parseJSON(raw, { brief: room.brief_text || '' });
  return parsed.brief;
}

// --- 3. CHAT: the conversational voice on the landing page ---
const CHAT_PROMPT = `You are DOS — a calm, warm executive-function assistant for someone with ADHD.
This is the main landing screen: a chat. The user might brain-dump, ask a question,
or just say something offhand that should be remembered for later. Keep replies
short (1-3 sentences), conversational, never clinical, never a lecture. If what they
said sounds like it should be remembered in one of their "Rooms" (projects), say so
naturally — the app handles the actual logging separately, you're just the voice.`;

export async function chatReply(message, history = []) {
  const content = [
    ...history.map((h) => `${h.role === 'user' ? 'User' : 'DOS'}: ${h.text}`),
    `User: ${message}`,
  ].join('\n');
  return callClaude(CHAT_PROMPT, content, 300);
}
```

**In plain terms:** every time you type or speak something, it's sent to Claude along with the list of your existing Rooms. Claude decides: does this belong to Room X (high confidence, auto-logs silently), does it maybe belong somewhere (low confidence, app asks you), or is this a brand new project (suggests creating a Room)? Separately, every time a new entry lands in a Room, a second Claude call rewrites that Room's Brief so it's always current. A third, simpler call handles ordinary conversational replies when nothing needs to be logged.

### 5d. `src/App.jsx` — routing between screens

```jsx
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import ChatLanding from './components/ChatLanding/ChatLanding';
import RoomsHub from './components/Rooms/RoomsHub';
import RoomView from './components/Rooms/RoomView';
import LockdownMode from './components/Focus/LockdownMode';
import DailyOps from './components/Session/Session';

function Home() {
  // The landing page is the chat itself — zero-friction capture, no
  // dashboard to parse before you can say what's on your mind. Rooms are
  // one tap away via the header link inside ChatLanding.
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ChatLanding />
    </div>
  );
}

function Stub({ label }) {
  const navigate = useNavigate();
  return (
    <div style={{
      width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', background: '#F3F1EB',
      fontFamily: "'Inter', sans-serif", color: '#1E3B30', gap: 20,
    }}>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.2em', opacity: 0.4 }}>DOS</span>
      <p style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>{label}</p>
      <p style={{ fontSize: 13, color: '#8B8B82', margin: 0 }}>Coming soon.</p>
      <button
        onClick={() => navigate('/')}
        style={{ marginTop: 8, background: 'none', border: '1px solid rgba(30,59,48,0.2)', borderRadius: 999, padding: '10px 24px', color: '#1E3B30', fontSize: 13, cursor: 'pointer' }}
      >
        ← Back
      </button>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/rooms" element={<RoomsHub />} />
        <Route path="/rooms/:roomId" element={<RoomView />} />
        <Route path="/rooms/:roomId/focus" element={<LockdownMode />} />
        <Route path="/session" element={<DailyOps />} />
        <Route path="/intervention" element={<Stub label="Intervention" />} />
        <Route path="/resume" element={<Stub label="Pick Back Up" />} />
        <Route path="/override" element={<Stub label="Override" />} />
        <Route path="/support" element={<Stub label="Additional Support" />} />
      </Routes>
    </BrowserRouter>
  );
}
```

**Routes that exist:** `/` (chat landing), `/rooms` (grid of all Rooms), `/rooms/:roomId` (one Room's Brief + log + loops), `/rooms/:roomId/focus` (Lockdown Mode), `/session` (the original brain-dump-to-schedule feature from your uploaded app, untouched).

### 5e. `ChatLanding.jsx` — the chat landing page logic (structure, not full JSX)

Key behavior:
- On send: if Supabase isn't configured, falls back to plain `chatReply` (conversational only, nothing saved)
- If configured: calls `routeCapture` with the message + current room list
  - `confidence: "high"` → logs directly to that Room, regenerates its Brief, shows a confirmation bubble tagged with the Room name
  - Otherwise, if Claude suggested a new Room name → shows a "want me to start a room called X?" confirmation with Yes/Not now buttons
  - Otherwise → falls back to a plain conversational reply
- Cmd/Ctrl+Enter sends; plain Enter makes a new line (so you can ramble across multiple lines before sending)

### 5f. `RoomsHub.jsx` + `RoomView.jsx` — the Rooms/Projects UI logic

- **RoomsHub**: fetches and lists all Rooms sorted by most-recently-touched, "+ New room" card creates one and navigates straight into it
- **RoomView**: loads a Room's Brief, memory entries, and open loops in parallel on mount; quick-add box appends an entry and immediately regenerates the Brief; open loops are togglable chips (click to mark resolved); each unresolved loop has a "Focus on this →" link into Lockdown Mode

### 5g. `LockdownMode.jsx` + `FrictionPause.jsx` — the "help me stay" pair (built after you flagged impulse/friction control as the missing pillar)

```jsx
// LockdownMode.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import './Focus.css';
import FrictionPause from './FrictionPause';
import { addMemoryEntry } from '../../lib/rooms';

/**
 * LockdownMode — the "help me stay" screen.
 *
 * DOS already had strong "help me start" (Catalyst) and "help me reset"
 * (Dopa-Menu, Override) tools. This is the missing third leg: a minimalist,
 * single-task environment with every other option removed, so a mid-task
 * impulse to switch has nowhere easy to go.
 *
 * It does not trap anyone — that would just be a different kind of app
 * abandonment. Leaving is always possible. It just isn't instant: an
 * attempt to leave routes through FrictionPause first, a short grounding
 * beat that widens the gap between impulse and action without shaming it.
 */
export default function LockdownMode() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const location = useLocation();
  const taskText = location.state?.task || 'Focus session';

  const [elapsed, setElapsed] = useState(0);
  const [showPause, setShowPause] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const requestExit = useCallback(() => {
    setShowPause(true);
  }, []);

  const confirmExit = useCallback(async () => {
    if (roomId) {
      try {
        await addMemoryEntry(roomId, {
          raw_text: `Stepped out of a focus session on "${taskText}" after ${Math.round(elapsed / 60)} min.`,
          source: 'auto-routed',
        });
      } catch {
        // Memory logging is a nice-to-have here — never block the exit on it.
      }
    }
    navigate(roomId ? `/rooms/${roomId}` : '/');
  }, [roomId, taskText, elapsed, navigate]);

  const cancelExit = useCallback(() => setShowPause(false), []);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  return (
    <div className="lockdown-root">
      <div className="lockdown-anchor">
        <span className="lockdown-label">[ FOCUS · ONE THING ]</span>
        <h1 className="lockdown-task">{taskText}</h1>
        <div className="lockdown-timer">{mins}:{secs.toString().padStart(2, '0')}</div>
        <p className="lockdown-hint">Everything else is put away. This is the only thing here.</p>
      </div>

      <button className="lockdown-exit" onClick={requestExit}>
        [ step away ]
      </button>

      {showPause && <FrictionPause onStay={cancelExit} onLeave={confirmExit} />}
    </div>
  );
}
```

```jsx
// FrictionPause.jsx
import { useState, useEffect, useRef } from 'react';
import './Focus.css';

/**
 * FrictionPause — a 10-second grounding beat between "I want to leave"
 * and actually leaving.
 *
 * Deliberately NOT a hard lock. Per the safety principles: "safe to
 * disappear," never punitive. The countdown creates space, not a wall —
 * once it hits zero, leaving is one tap, no guilt copy, no streak lost.
 * The goal is just to interrupt the automatic switch-away impulse long
 * enough for the user to notice it's happening.
 */
export default function FrictionPause({ onStay, onLeave }) {
  const [secondsLeft, setSecondsLeft] = useState(10);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const canLeave = secondsLeft === 0;

  return (
    <div className="friction-pause-overlay">
      <div className="friction-pause-card">
        <span className="friction-pause-label">[ QUICK PAUSE ]</span>
        <p className="friction-pause-prompt">
          What's pulling you away, right now — in one breath?
        </p>
        <p className="friction-pause-sub">
          No judgment either way. Just naming it sometimes changes the pull.
        </p>

        <div className="friction-pause-actions">
          <button className="friction-pause-stay" onClick={onStay}>
            Actually, I'll stay
          </button>
          <button
            className="friction-pause-leave"
            onClick={onLeave}
            disabled={!canLeave}
          >
            {canLeave ? "Leave — that's okay" : `Leave in ${secondsLeft}s`}
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Logic in plain terms:** clicking "Focus on this →" on any open loop opens a full-screen view showing only that task and an elapsed timer. The only way out is a quiet "[ step away ]" link, which doesn't exit immediately — it opens a 10-second countdown asking what's pulling you away. You can cancel and stay at any point. Once the 10 seconds pass, leaving is one tap, no guilt, no streak broken — and it quietly logs a neutral note to the Room ("stepped out after 4 min") so it's part of the record, not hidden.

---

## 6. What existed already (from your uploaded zip, not built this session)

For completeness — these were already in `DailyOps-main/src/components/Session/Session.jsx` before I touched anything:
- **Brain dump → schedule**: paste your day's thoughts, Claude turns it into a time-blocked schedule, exportable to Google Calendar/Apple Calendar/Outlook/ICS/PDF/CSV
- **Executive Override**: "battery at zero" mode — gives one tiny physical step at a time with a 2-minute timer per step
- **Task Initiation Catalyst**: breaks any single task into 3-8 micro-steps
- **Dopa-Menu**: a menu of quick resets (appetizers/sides/entrees/desserts framing) — jumping jacks, brown noise, a walk, a nap — with hard-capped timers and a shame-free exit flow

---

## 7. Positioning notes you shared (kept for reference, not code)

- ADHD tool users are burned by fake urgency (countdown timers, guilt-based streaks) — DOS should never use those patterns.
- Progressive complexity: ship with almost no setup required; more structure reveals itself only as it's used.
- Shame-free by default: no "you haven't touched this in 12 days" red flags.
- You separately pasted a full spec for a spaced-repetition study-card app (FSRS-6 scheduler, exam decks, "Not yet / Got it" grading). That is a **different product** — it was not built or merged into any of this.

---

## 8. How to actually run this (since it's never been run)

```bash
# 1. unzip the project, then inside it:
npm install

# 2. copy the env template and fill in real keys
cp .env.example .env
# edit .env:
#   VITE_ANTHROPIC_API_KEY=...      (from console.anthropic.com)
#   VITE_SUPABASE_URL=...           (from your Supabase project settings)
#   VITE_SUPABASE_ANON_KEY=...      (same place)

# 3. set up the database — paste supabase/schema.sql into your
#    Supabase project's SQL editor and run it once

# 4. run it
npm run dev
```

Without step 2/3, the app still loads and the chat still replies conversationally, but nothing persists across reloads (Rooms/Memory require Supabase; smart replies require the Anthropic key).

---

## 9. What's honestly still missing

- Never actually run/tested — see the status note at the top
- Voice input: mic button exists in the old DOSHub UI, is currently a no-op — not wired to anything
- Shame-free streak/rolling-win tracking — discussed, not built
- Body-doubling / pace-matching — discussed, not built
- The spaced-repetition study app — separate product, not touched
