# NENEMI — Storage plan (Rooms are the storage)

Rooms *are* the product's memory. This is how storage grows from what the prototype does today to a real backend, in three steps. Each step keeps the same data shape so nothing gets rewritten.

## The data shape (already in the prototype)

```
Room        { id, name, one_liner, brief, link, loops[], log[] }
Loop        { text, resolved }
LogEntry    { source: 'typed' | 'voice' | 'auto-routed', ts, text }
Event       { start, end, name, kind: 'fixed' | 'block' | 'buffer' }   keyed by day (yyyy-mm-dd)
Carried     [{ name }]                                                   yesterday's leftovers
```

This matches the Supabase tables in `claude_dos-full-writeup.md` §4 (`rooms`, `memory_entries`, `open_loops`). Calendar events need one more table (below).

## Step 0 — today: browser storage (done)

- Everything above is saved to `localStorage` under the key `nenemi.v1` on every change and restored on load.
- Survives refresh and redeploys. Lives only in that browser on that device.
- Reset: open DevTools console and run `resetDemo()`, or clear site data.
- Good for: demoing, dogfooding on one laptop. Not good for: phone + laptop, sharing, backups.

## Step 1 — device-scoped cloud (1 to 2 days)

Make the same data live in Supabase, no login yet.

1. Create a free Supabase project. Paste the schema from the full write-up §4 into the SQL editor and run it. Add:
   ```sql
   create table if not exists day_events (
     id uuid primary key default gen_random_uuid(),
     device_id text not null,
     day date not null,
     start_h numeric not null, end_h numeric not null,
     name text not null,
     kind text not null default 'block' check (kind in ('fixed','block','buffer')),
     created_at timestamptz not null default now()
   );
   create index if not exists idx_day_events_device_day on day_events(device_id, day);
   ```
2. Generate a `device_id` once per browser (random UUID in `localStorage`) and send it with every row.
3. Swap the two functions in the prototype: `save()` writes rows, `restore()` reads them. Keep `localStorage` as an offline cache so the app opens instantly and works on a plane.
4. Vercel: add `SUPABASE_URL` and `SUPABASE_ANON_KEY` as environment variables and read them in the page. Never put a service key in the browser.

Good for: your own phone + laptop sharing one brain. Still no accounts.

## Step 2 — real accounts (2 to 3 days)

1. Turn on Supabase Auth with magic link or Apple / Google sign-in.
2. Replace `device_id` with `user_id` (`auth.uid()`) on every table and tighten the RLS policies to `user_id = auth.uid()`. The write-up already flags this as the swap point.
3. Migration: on first sign-in, adopt any rows carrying that browser's `device_id`.

Good for: multiple people, real privacy, a future paid tier.

## Step 3 — the Brief and routing get smart (after storage is real)

Only worth doing once rooms persist, because both need history.

- **Auto-brief**: when a room gets a new entry, call Claude with the last N entries and rewrite `brief`. Runs server-side (a Vercel serverless function) so the API key stays off the client.
- **Capture routing**: the Home composer sends the raw text to the same function; it returns which room to file it in. Today the prototype matches on the first word of a room name.
- **Voice**: today it uses the browser's built-in speech recognition (free, no key, Chrome / Edge / Safari, needs https). If accuracy or Firefox support matters later, send audio to a server-side transcription model instead. The `source: 'voice'` tag is already recorded, so nothing else changes.

## What to decide

- Solo tool first, or accounts from day one? Step 1 is the fastest way to use it on both devices this week. Step 2 is the right base if anyone else will ever log in.
- Supabase is the default because the schema is already written. Vercel Postgres or Firebase would work the same way; the data shape does not change.
