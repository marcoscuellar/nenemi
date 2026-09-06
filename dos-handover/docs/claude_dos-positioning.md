# DOS — Positioning & Competitive Strategy

## The core bet
DOS targets the single biggest failure point of traditional productivity apps for neurodivergent users: **backlog guilt and context collapse.**

When people with ADHD abandon an app, it's usually because an uncompleted list piles up, creates shame, and turns the tool from an assistant into a source of anxiety. Designing around a low-friction brain dump, an anti-guilt rollover, and a project memory holder solves genuine user pain.

## Competitive landscape

| Competitor | Core positioning | Strengths | Where DOS wins |
|---|---|---|---|
| **Tiimo** | Visual routines & timeline | Great visual time blocks; neurodivergent branding | Tiimo is heavily routine-based; lacks deep context/project memory storage |
| **Motion** | Automated AI scheduling | Zero scheduling decision fatigue | Expensive, rigid, feels like high-pressure corporate PM |
| **Sunsama** | Guided morning/evening rituals | Calm interface; prevents overcommitment | Costly ($16–20/mo); geared to desk workers, not fast chaotic mobile capture |
| **Goblin Tools** | Micro-task breakdown ("Magic ToDo") | Extremely low friction; breaks paralysis | No integrated scheduling, day planning, or persistent memory bank |

## Key differentiators

**1. The "Zero-Shame Purge" (anti-guilt rollover)**
Standard to-do apps turn red or pile yesterday's undone tasks into a 40-item mountain. DOS gives explicit, judgment-free permission: "Let's leave that in the past — it wasn't that important." Prevents the debt buildup that makes users delete the app.

**2. Context anchoring (preventing the "reset loop")**
ADHD brains struggle with working memory and object permanence (out of sight, out of mind). A persistent "where you left off" state per project means users don't spend the first 30 minutes just figuring out where to start. → This is the Rooms + Brief system already in the prototype.

**3. Frictionless brain dump → schedule**
Convert an unfiltered morning text/voice dump into 2–3 realistic calendar slots. Removes the executive-function load of sorting and time-estimating.

## Critical design risks to watch

- **The Novelty Cliff:** ADHD users engage heavily for 7–14 days before dopamine fades. Interface must need near-zero setup and work cleanly even after someone skips three days and returns.
- **Security & raw brain dumps:** Users dumping unfiltered personal/work/emotional thoughts → end-to-end encryption or local-first storage (Apple Keychain, encrypted SQLite) is a major trust/marketing selling point.
- **Over-scheduling trap:** Auto-schedulers cram 8 hours into an 8-hour day. DOS planner should enforce buffer time — schedule only 60–70% of available hours — to prevent immediate plan failure.

## How this maps to the current build
- **Context anchoring** → already built: Rooms Hub + auto-Brief ("here's where you left it").
- **Zero-Shame Purge** → not yet built. New feature: a judgment-free rollover / "leave it in the past" flow for stale loops.
- **Brain dump → schedule** → not yet built. New feature: morning dump parsed into 2–3 realistic slots with enforced 60–70% buffer.
- **Voice/casual tone** → in progress: app copy rewritten to "sharp + casual," no clinical language, no emojis.
