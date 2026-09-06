# NENEMI — handover

## prototypes/
- index.html — desktop prototype, ready to drag onto vercel.com/new
- nenemi-prototype-desktop.html — same file, original name
- nenemi-prototype-phone.html — phone-frame version

Both are single self-contained HTML files. Open in any browser, no build step.

Screens: Home (composer + "+" menu) · Rooms · Room view · Calendar (day view + Smart Cal "dump the day" + yesterday rollover) · I'm stuck · Humans heal · Focus / Friction pause

Voice: every mic button uses the browser's built-in speech-to-text (Chrome / Edge / Safari, needs https). No API key.

Storage: rooms, notes, loops and calendar events persist in the browser (`localStorage`, key `nenemi.v1`). See docs/nenemi-storage-plan.md for the path to a real backend. Reset with `resetDemo()` in the console.

## docs/
All spec, brand, positioning and feature docs. Start with nenemi-name-meaning.md and nenemi-storage-plan.md.

## Deploy
vercel.com/new → drag index.html → Deploy. No GitHub required.
