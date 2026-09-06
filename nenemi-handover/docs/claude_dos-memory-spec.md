# NENEMI — Memory & Rooms Spec

## The pitch (in Marcos's words)
"It's ok, I have NENEMI — it's the context, the content, no more restarting the app. It holds context of your projects, holds each one in a room, so you can walk into it and it has a 'brief.' Doesn't make you restart. 'Where did I leave that?' — it knows. I can talk to it, and it will parse what I say and act on it — so if I'm walking and say 'oh, make sure we find the right logo for the memory app,' it knows to log that in the right room."

## Core concept: three primitives

**Rooms** (aka Projects) — a persistent container per thing-you're-working-on. Each Room has:
- A name + a one-line identity ("the memory app," "taxes," "mom's bday")
- A **Brief** — always-current summary of where it stands, regenerated as new info lands. This is the "where did I leave that" answer.
- A memory log — timestamped entries: notes, decisions, links, files, voice captures
- Open loops — small unresolved items surfaced in the Brief

**Capture Inbox** — the always-listening front door. Marcos types or speaks a stray thought at any time, from anywhere in the app (not just inside a Room). NENEMI:
1. Parses intent from the raw utterance (ignores "um," rambling, transcription noise — same philosophy as the existing SCHEDULE_PROMPT)
2. Matches it to an existing Room by content ("logo," "memory app" → matches the Memory App room) or asks once if ambiguous
3. Logs it into that Room's memory log and updates the Brief
4. Confirms briefly ("Got it — logged to Memory App") so Marcos never wonders if it landed

**Walking back in** — opening a Room shows the Brief first, not a blank slate or a raw log. No "catch myself up" tax.

## Why this fits the existing app
DailyOps already has the tone system (Override, Catalyst, Dopa-Menu) — the executive-function *doing* layer. Rooms/Memory is the missing *context* layer underneath it: the reason you don't have to reconstruct your brain state every time you open the app.

## Data model (Supabase)

```
rooms
  id, user_id, name, one_liner, status (active/paused/archived),
  brief_text, brief_updated_at, created_at

memory_entries
  id, room_id, user_id, source (typed/voice/auto-routed),
  raw_text, created_at

open_loops
  id, room_id, text, resolved (bool), created_at
```

Auth: Supabase magic-link or anonymous device ID for v0 (single user, no login friction — matches "doesn't make you restart" ethos).

## Capture → routing flow (v0)
1. User submits text (typed or transcribed voice) via the existing DOSHub input or a new global capture bar.
2. Claude call: given the utterance + list of existing Room names/one-liners, return `{ room_id | null, cleaned_entry, is_new_room_suggestion }`.
3. If confident match → auto-log, toast confirmation.
4. If no match and text implies a new project → ask once: "New room for this, or fold into [closest guess]?"
5. Brief regeneration: on each new entry, a lightweight Claude call updates that Room's `brief_text` (a few sentences: status, last thing done, open loops).

## UI additions
- **Landing page = the AI chat itself.** Not a static threshold — the main screen IS the conversational capture surface. User lands, types or speaks anything, NENEMI responds and routes it. Rooms Hub is one tap/rail away, not the front door.
- **Rooms Hub**: grid/list of Room cards (name, one-liner, last-touched), reachable from the chat landing page.
- **Room view**: Brief at top, memory log below (reverse chron), open loops as checkable chips, quick-add box.
- **Branding**: keep visual identity (colors, wordmark, fonts) isolated in one theme layer — Marcos is still deciding on branding, so build components against tokens/CSS variables, not hardcoded hex, so a rebrand later is a palette swap, not a rewrite.

## Phasing
- **v0 (this session)**: Supabase schema + client, Rooms Hub, Room view with manual entries, Claude-based routing from the capture bar, auto-brief regeneration.
- **v1 (later)**: voice capture wired to routing (mic already exists in DOSHub, currently a no-op), ambient "walking mode" voice capture, cross-room search.

## Positioning notes (from market context Marcos shared)
- ADHD tool users are burned by fake urgency (countdown timers, guilt-based streaks) — NENEMI should never use those patterns anywhere, including Rooms/Memory.
- Progressive complexity: v0 ships with almost no setup (no login, one text box). More structure (multiple rooms, open loops) reveals itself only as it's used, never demanded up front.
- Shame-free by default: no "you haven't touched this room in 12 days" red flags. A quiet Brief, not a guilt trip.
- Separate note: Marcos also shared a full spec for a spaced-repetition study-card app (FSRS-6 scheduler, exam decks, "Not yet / Got it" grading). That's a distinct product from NENEMI's memory/rooms feature — flagging so it doesn't get silently merged in. Worth its own conversation on whether it's a second app, a future NENEMI module, or unrelated.

## v0.2 addition — Friction Pause + Lockdown Mode
Built as a pair to fill the one gap the other pillars didn't cover: helping someone *stay* mid-task, not just start or reset.

- **Lockdown Mode** (`/rooms/:roomId/focus`): full-screen, single-task view — task name, elapsed timer, nothing else. Reached via "Focus on this →" next to any open loop in a Room.
- **Friction Pause**: triggered by the quiet "[ step away ]" link in Lockdown Mode. A 10-second grounding prompt ("what's pulling you away, in one breath"), never a hard lock — leaving is always one tap once the 10 seconds pass, no guilt copy, no lost streak. This is deliberate: per the safety principles Marcos shared ("safe to disappear," no fake urgency), friction creates a pause, not a wall.
- Stepping away logs a neutral note to the Room's memory log (e.g. "stepped out of a focus session on X after 4 min") so it's visible in the Brief later — not flagged as a failure, just part of the record.

## Open decisions Marcos may want to weigh in on later
- Single-user vs multi-user auth (v0 assumes single user)
- How aggressive auto-routing should be before it asks vs. just logs and lets Marcos correct it later
