# Nenemi — project handoff

Last updated: 2026-09-21. Written so someone new can run, deploy, and ship Nenemi without a call.

Start with the box: read `docs/nenemi-crayon-box.md`. It is the "why," and every product decision is judged against it. `../CLAUDE.md` holds the build rules (the non-negotiables, the voice, the repo mechanics). This file is the "where things live and how to ship."

## TL;DR

- Nenemi is a calm memory app for ADHD brains. One app, no build step.
- **Live:** https://www.mynenemi.com — a Vercel deploy of `main`. Push to `main` → it's live in ~1–2 min.
- **Repo:** https://github.com/marcoscuellar/nenemi
- The whole product is one file, `index.html`, plus a handful of serverless functions in `api/`.
- It works with **no API key, no database, and no sign-in** — those only add sync and the day-builder.
- The iPhone app is a thin native shell around the live site. To submit it, follow `docs/app-store.md`.

## Where everything lives

| Thing | Where |
|---|---|
| The app (UI + all logic) | `index.html` — one file, CSS + JS inline, ~3,800 lines |
| Landing / onboarding | `welcome.html`; legal at `privacy.html` / `terms.html`; help at `support.html` |
| Serverless backend | `api/*.js` (Vercel functions) + `lib/*.js` |
| iOS native shell | `app/` (Capacitor project; `app/ios` is the Xcode project) |
| Reference docs | `nenemi-handover/docs/` |
| Store submission guide | `nenemi-handover/docs/app-store.md` |
| Store screenshots | `nenemi-handover/store/screenshots/` (6.7" and 6.5") |
| Icons / brand assets | `photos/icon/`, `icons/`, `photos/originals/` |

## Architecture in one breath

- **Front end:** a single static `index.html`. No framework, no bundler. Panes are shown/hidden by `go(name)`; state renders through functions like `renderCal()`, `renderRoomList()`, `renderChecklist()`.
- **State model:** `{ rooms, events, carried, loose, notes, checklist }`. Every change calls `save()` → writes `localStorage` first → debounced `pushState()` → `PUT /api/state`. **Offline is a normal state, not an error.**
- **Auth (optional):** Clerk. `initAuth()` fetches `/api/config`; if a publishable key is present it loads Clerk and shows Sign in. Signed-out users still sync via a **sync code** (`/api/state?device=<code>`).
- **Data:** Neon Postgres, one JSON blob per identity, via `api/state.js`.
- **Smart routing / day-builder:** `api/route.js` + `api/plan.js` call Anthropic to file dumps and build the day. If Claude is unreachable it falls back to first-word matching. The page must always work with the AI off.
- **Billing:** `api/billing.js` + `api/stripe-webhook.js` — Stripe on the web only, $10/mo "Full access." **Not in the iOS app** (see app-store.md).
- **Uploads:** `api/upload.js` → Vercel Blob. **Calendar:** `api/calendar.js` + `lib/ics.js`.

## Environment variables (set in Vercel — never in the repo)

Names only; the values live in Vercel project settings.

- **Clerk:** `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
- **Neon:** the Postgres connection string (e.g. `DATABASE_URL`)
- **Anthropic:** `ANTHROPIC_API_KEY`
- **Vercel Blob:** `BLOB_READ_WRITE_TOKEN` (created by adding a Blob store in the Vercel Storage tab)
- **Stripe (web billing):** `STRIPE_SECRET_KEY`, `STRIPE_PRICE_MONTHLY`, and the webhook signing secret; billing turns on only when these are set. Optional `NENEMI_PRICE_MONTHLY` overrides the shown price.
- **Admin:** `NENEMI_ADMIN_EMAILS`

## How to release (web)

1. Work on the branch `claude/code-cleanup-q9353f`, never straight on `main`.
2. Keep the **three desktop copies byte-identical** — `index.html`, `nenemi-handover/prototypes/index.html`, `nenemi-handover/prototypes/nenemi-prototype-desktop.html` — and verify with `md5sum`.
3. Test locally (Playwright against a small static server; chromium headless shell at `/opt/pw-browsers`).
4. Push the branch → Vercel builds a **preview** URL (add `?open=1` to skip the first-visit landing redirect). Verify sign-in + save there.
5. When it's good, fast-forward `main` and push. That is the production deploy.

## How to ship the iPhone app

Everything is in **`nenemi-handover/docs/app-store.md`** — a step-by-step, one-screen-at-a-time guide with the store listing copy, the privacy-answers table, and the reviewer notes all ready to paste. The only work left before submitting is switching Clerk to production and adding Sign in with Apple.

## Gotchas learned the hard way

- **Never edit `main` from the GitHub web editor.** It skips the preview and the checks. A web edit once replaced the `<div class="app">` wrapper (which the whole UI and its JS depend on) and it reached production; it had to be caught and repaired by hand.
- **Phone CSS** lives in the **last** `@media (max-width: 720px)` block at the end of the stylesheet, on purpose, so it wins. Add phone rules there, never above the desktop rules.
- **The dark screens** (Stuck, Focus, Human support) stay dark in both themes. Don't "fix" them to light.
- **No hardcoded rooms/tasks in the UI** — style the real rendered data.
- Secrets never go in the repo. Env vars live in Vercel.

## Product guardrails (the short version — full list in CLAUDE.md)

- Never tell the user what to do. Copy offers, asks, or holds — no imperatives aimed at the person.
- No shame mechanics, ever: no streaks, no red, no "overdue," no countdowns.
- Capture before organize. Re-entry over planning. One small move, never a long list.
- Humans heal — point to real people; never pretend to be one.
