# NENEMI — Brand Direction (locked v3)

Decided with Marcos, Aug 2026. Reference apps: **TaskPilot** (clean AI productivity app) for the mobile layout, **Eureeca** for the color, **Gemini's composer** for the big capture bar, **ŌLLIN AI** for the calm dark "I'm stuck" sanctuary.

## Aesthetic north star
Simple, sleek, calm — low-clutter (Marcos gets overwhelmed by busy screens). Pure white canvas, near-black ink, with a single **sage-green** accent reserved for *good* / *help* moments only. NOT hospital-y, NOT sweet, NO emojis in-app. Black-and-white driven; sage is the one warm signal.

## Form factor
Mobile app in a phone frame. Home = rotating time-aware greeting + big composer (hero) + a quiet "Feeling stuck?" link + Today's Plan (frosted overlapping "file" cards) pushed low so the top breathes. Landing must feel like a sanctuary, never a backlog ambush.

## Palette (light) — sage, swapped from lime v2
- **Pure white** background `#FFFFFF`
- Surface `#FFFFFF`, card fill `#F7F7F4`, surface-2 `#F5F5F3`
- **Ink** (near-black) `#17181A`
- Muted `#6E6E69`, faint `#ABABA4`, lines `#EEEDE9` / `#E0DFD9`
- **Sage accent** `#4E7268` (misty sage-green, sampled from the Eureeca image ~`#4B6763`) — works as both a FILL (with light text) and as text
- Pale sage tint `#DEE7E3` (chip/pill backgrounds)
- Deep sage `#365049` — accent-colored text on white
- On-sage text/icons `#F5F8F6` (light text on sage fills)

## Palette (dark)
- Near-black bg `#141412`, surface `#1C1C19`, card `#201F1C`
- Warm off-white text `#ECE7DB`
- Sage lifted for dark: accent `#7FA99C`; sage-as-text `#9DC6BA`; deep sage fill `#22332E`

## The sage rule
Sage marks positive / help moments only: capture confirmed, file saved, loop closed, live mic, the send button, the "now" plan file, the monogram dot, the "I'm stuck" sanctuary glow. Structure and primary buttons stay monochrome ink. Keeps the color meaningful, not decorative. NO highlighter behind headings. (Was a bright lime `#C2E06A` in v2 — Marcos confirmed the muted sage from the Eureeca image is the real intent.)

## Type
- Display / headers + wordmark: **Archivo** (700 bold)
- Body / UI: **Inter**
- Utility (timers, timestamps, labels): **JetBrains Mono** — a quiet nod to "NENEMI"
- All via Google Fonts.

## The composer (capture bar)
Big and roomy, modeled on Gemini's. Large input, inline **Photo or file** upload (＋ and a dedicated button) because NENEMI *holds things for people* — drop a logo/receipt/pic straight in and it's saved to a room's memory log; mic; sage waveform send button; a room dropdown to aim a drop at a specific room. Placeholder: "Dump anything here — messy is fine, we got you…". Same composer on Home and in chat.

## "I'm stuck" sanctuary
Calm dark ŌLLIN-style overlay (dark in both themes) triggered by stuck-language or a quiet Home link. Offers ONE non-pharmaceutical nudge at a time; never a task list. See `dos-stuck-mode.md`.

## Monogram
Solid ink rounded badge with **D** and a tiny sage dot. App avatar + wordmark. (Plus an ō-style ring mark used in the stuck sanctuary, echoing ŌLLIN.)

## Voice
Sharp + casual, clean. Talks like a smart friend, not a therapist or corporate PM. Time-aware rotating greeting ("Good morning / afternoon / evening", "Still up" after midnight — never "Good night", reads as goodbye). No fake urgency, no guilt, no red numbers, no emojis.

## Build note
Fully tokenized CSS variables — palette/theme tweaks are a swap, not a rewrite. Prototype is a single self-contained HTML file, published as an Artifact.
