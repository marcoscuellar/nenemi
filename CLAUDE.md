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
