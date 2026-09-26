# Nenemi — build rules

Read `nenemi-handover/docs/nenemi-crayon-box.md` first. Then the brand book, `nenemi-handover/docs/nenemi-brand-book.html` (v3.0). It's the source of truth for the mark, colors (ink #111312, ground #F5F6F5, teal #3C8692, maíz #E9BE55 used sparingly), type (Archivo Black display), and voice. Logo files live in `photos/logo/`. It's why this exists. Short version: people with ADHD have every crayon and no box. **Nenemi is the box.** Every change is judged against that.

## The one test
Before building or changing anything, ask: **does this hand them a crayon, or make them go find one?** If it adds a decision, a step, a setting, or a wall between the user and putting something down, it's wrong, even if it's clever.

## Non-negotiables
- **Never tell the user what to do.** Copy offers, asks, or holds. No imperatives aimed at the person ("drop it here, then sleep" was removed for this reason). "Dump it here" is the one allowed exception because it's the box's name for its own lid.
- **No shame mechanics, ever.** No streaks, no red, no "overdue", no countdowns, no comments on the hour. The greeting is only ever Morning (5am to noon), Afternoon (noon to 5pm), or Evening (5pm to 5am), never "Still up".
- **Capture before organize.** The user can always say it first and sort it never. The app files it, offers a room, or holds it loose.
- **Re-entry over planning.** The first thing on any screen is "where you left off" and one small move, not a list.
- **One small move.** Stuck screens offer one thing. Never a list of options longer than the four doors.
- **The box is quiet.** No tutorials, no tooltips, no manifesto inside the app. One quiet intro line for signed-out visitors is the ceiling.
- **Dark sanctuary stays dark.** Stuck, Focus, and Friction screens are dark in both themes. No glare when someone is frozen.
- **Humans heal.** Nenemi is the nudge, not the treatment. Point to real people; never pretend to be one.

## Design standard (v4, Sep 2026, pre-launch — this is the direction, not legacy)
Reference: the FacilityFlow modular SaaS dashboard look. It all lives in one CSS layer, `DESIGN SYSTEM v4`, placed last before the phone block in `index.html`. Change the system there, not in the older passes above it.
- Canvas and cards: `--ground` #F5F6F5 behind every light screen. Cards are white, 1px `--line` #E5E7EB, `--card-shadow` (`0 1px 3px rgba(0,0,0,.04), 0 4px 12px rgba(0,0,0,.02)`), 20px padding, 12px gaps. A box inside a card is part of the card, not a second card.
- Corners: `--radius` 12px for cards, containers, and sheets. `--radius-sm` 8px for buttons, chips, and inputs. `--pill` for navigation. Use the tokens, never a hardcoded radius.
- Lines: hairlines only. No 3–4px black or teal rules.
- Pill navigation: nav items, the day strip, and the room breadcrumb are capsules. The chosen day is an ink capsule. The room breadcrumb is a white capsule with an ink back button.
- Functional color, each with its own jobs and nowhere else:
  - Ink `--ink` #111312: headlines and primary actions (Start Focus, Write, Update room).
  - Cyan `--link` #28A2C3 (text `--link-ink` #16708A): links out to the user's work (room link chip), the active nav tab, category indicators (room dots), and the "n still open" badge. The example room ships with a Figma link so the chip shows on day one.
  - Mint `--win` #0EBE82 (text `--win-ink`): completion and today. "That's done." (mint border and 5% tint at rest, solid when tapped), the "caught up" badge, checked loops and checklist items, "Finished" log lines, today's date in the day strip.
  - Brand teal stays on section eyebrows. Maíz stays for returning, never completing.
- "I'm stuck" is solid black. No red, coral, or orange anywhere, ever, including priority or overdue markers the reference uses.
- Phone clearance: `#pane-roomview`, `.rv-container`, and `#pane-calendar` use `padding-bottom: calc(120px + env(safe-area-inset-bottom)) !important` (Marcos's call). Rooms, Notes, and Human support keep `calc(178px + var(--sab))`.
- Type: page titles (My day, Rooms, room names, Close the day) are Archivo 700 at 28px (26px on phone), line-height 1.2, tracking -0.015em. No giant brutalist headlines. Task text is 15px/600 in the day list and 20px/600 for a room's next move.
- Day and Room screens are ported from Marcos's finalized reference (`gemini-code-1790440308003.html`): the `nx-` classes in the "Day + Room" block of the v4 layer, Inter type, `--cyan` #28A2C3, `--mint` #0EBE82, 12px cards. Day = "My day" header with Clear day, the gentle rollover card ("Want to bring over what's still open from yesterday? No pressure, no judgment." / Bring them over / Let them rest for now), Today's horizon as a timed schedule grouped Morning (before 12) / Afternoon (12–5) / Evening (5+) / Anytime today, each row a round check (mint when done), 14px title, subline `Room • 9:00 – 10:30 AM`, and on the right the room's link chip or a `›` jump. The block happening now gets a quiet cyan wash and a NOW tag. An open block whose start has passed shows a one-tap `+30m` that moves it later; never red, never "passed". Events keep `start`/`end` hours plus `time` ("09:00 - 10:30" or "14:00"); untimed ones are `anytime: true`. The add bar takes title, room, and optional start/end, and the quiet side cards. No week strip, no calendar grid. Room = brief with cyan context link chip + Edit (URL and optional label), What's next with Start focus and mint That's done., "Too big? Make it smaller." (the person types the smaller first step), Open in this room with add. Day's right column ends with a quiet `↗ Recap my day` text link to Close the day. The room's own capture panel and progress log stay below as cards. `go('day')` is an alias for the Day pane.
- Dark sanctuary still holds: Stuck, Human support, Focus, and Friction are dark in both themes.

## Voice
- Warm, short, specific. One sentence per line. Proper capitalization and punctuation. No exclamation marks.
- Greeting lines are the user's own list (see `greetingLines` in `index.html`). Cut before adding.
- Plans are "Full access" and "Free · n of 2 rooms". The paywall says "Unlimited rooms" (Marcos's call, Sep 2026).

## Mechanics that must stay true
- Free plan: 2 rooms of the user's own plus the example room. Calendar, voice, and re-entry are always free. Existing rooms are never taken away.
- The example room (`demo: true`) never counts toward the limit.
- A room holds 5 files (photos, PDFs) on Free and 25 on Full access (`ROOM_FILES` in `lib/auth.js`, checked in `api/upload.js` and on the page). Loose drops on Home aren't capped. Files already saved are never taken away.
- Smart routing (`api/route.js`) verifies room ids and falls back to first-word matching if Claude is unreachable. The page must work with no API key, no database, and no sign-in.
- Every save lands in `localStorage` first, then syncs. Offline is a normal state, not an error.

## Repo mechanics
- Three copies of the desktop page must stay byte-identical: `index.html`, `nenemi-handover/prototypes/index.html`, `nenemi-handover/prototypes/nenemi-prototype-desktop.html`. Patch all three; verify with `md5sum`.
- Phone CSS lives in the last `@media (max-width: 720px)` block at the end of the stylesheet, on purpose, so it wins. Add phone rules there, never above the desktop rules.
- Test with Playwright against a local mock server before pushing (see the scratchpad servers pattern used in this project; chromium headless shell is at `/opt/pw-browsers`).
- Work on `claude/code-cleanup-q9353f`, then fast-forward `main`. Vercel deploys `main` to www.mynenemi.com.
- Two addresses, one deploy: mynenemi.com and www always show the landing page (`welcome.html`); app.mynenemi.com is the app. Links into the app from www (`?start`, `?login`, `?open`, `?paid`) forward to app.mynenemi.com and carry any saved data along in `#handoff=` (browser storage is per address). The iOS shell loads app.mynenemi.com.
- Never put keys in the repo. Env vars live in Vercel: Clerk, Neon, Anthropic, Blob (`BLOB_READ_WRITE_TOKEN`, created by adding a Blob store in the Vercel Storage tab), `NENEMI_ADMIN_EMAILS`.
- Reference docs: `nenemi-handover/docs/` (external motors, way back in, storage plan, name meaning).
