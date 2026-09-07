# Nenemi — build rules

Read `nenemi-handover/docs/nenemi-crayon-box.md` first. It's why this exists. Short version: people with ADHD have every crayon and no box. **Nenemi is the box.** Every change is judged against that.

## The one test
Before building or changing anything, ask: **does this hand them a crayon, or make them go find one?** If it adds a decision, a step, a setting, or a wall between the user and putting something down, it's wrong, even if it's clever.

## Non-negotiables
- **Never tell the user what to do.** Copy offers, asks, or holds. No imperatives aimed at the person ("drop it here, then sleep" was removed for this reason). "Dump it here" is the one allowed exception because it's the box's name for its own lid.
- **No shame mechanics, ever.** No streaks, no red, no "overdue", no countdowns, no comments on the hour. Late-night greeting is "Hey", not "Still up".
- **Capture before organize.** The user can always say it first and sort it never. The app files it, offers a room, or holds it loose.
- **Re-entry over planning.** The first thing on any screen is "where you left off" and one small move, not a list.
- **One small move.** Stuck screens offer one thing. Never a list of options longer than the four doors.
- **The box is quiet.** No tutorials, no tooltips, no manifesto inside the app. One quiet intro line for signed-out visitors is the ceiling.
- **Dark sanctuary stays dark.** Stuck, Focus, and Friction screens are dark in both themes. No glare when someone is frozen.
- **Humans heal.** Nenemi is the nudge, not the treatment. Point to real people; never pretend to be one.

## Voice
- Warm, short, specific. One sentence per line. Proper capitalization and punctuation. No exclamation marks.
- Greeting lines are the user's own list (see `greetingLines` in `index.html`). Cut before adding.
- Product copy never says "unlimited rooms". Plans are "Full access" and "Free · n of 2 rooms".

## Mechanics that must stay true
- Free plan: 2 rooms of the user's own plus the example room. Calendar, voice, and re-entry are always free. Existing rooms are never taken away.
- The example room (`demo: true`) never counts toward the limit.
- Smart routing (`api/route.js`) verifies room ids and falls back to first-word matching if Claude is unreachable. The page must work with no API key, no database, and no sign-in.
- Every save lands in `localStorage` first, then syncs. Offline is a normal state, not an error.

## Repo mechanics
- Three copies of the desktop page must stay byte-identical: `index.html`, `nenemi-handover/prototypes/index.html`, `nenemi-handover/prototypes/nenemi-prototype-desktop.html`. Patch all three; verify with `md5sum`.
- Phone CSS lives in the last `@media (max-width: 720px)` block at the end of the stylesheet, on purpose, so it wins. Add phone rules there, never above the desktop rules.
- Test with Playwright against a local mock server before pushing (see the scratchpad servers pattern used in this project; chromium headless shell is at `/opt/pw-browsers`).
- Work on `claude/code-cleanup-q9353f`, then fast-forward `main`. Vercel deploys `main` to www.mynenemi.com.
- Never put keys in the repo. Env vars live in Vercel: Clerk, Neon, Anthropic, `NENEMI_ADMIN_EMAILS`.
- Reference docs: `nenemi-handover/docs/` (external motors, way back in, storage plan, name meaning).
