// Quiet cues the planner hands back (Oct 2026, carried over from COS): a walk-in line on a block
// ("The doc open is enough.") and one intention line for the day ("The report gets the morning. The rest can wait.").
//
// Both are the model's words, so both go through the same checks as everything else it writes:
// no name, place or number nobody said (lib/grounding.js), no exclamation marks, and never an
// instruction aimed at the person (CLAUDE.md: copy offers, asks, or holds). A cue that fails is dropped,
// never rewritten; the day works the same without it.

import { isGrounded, calm } from './grounding.js';

// a sentence that opens on a verb aimed at the person is an instruction, so it doesn't ship
const BOSSY = /^(just|simply|go|do|don't|dont|open|start|begin|write|call|send|make|try|take|get|grab|pick|put|finish|stop|remember|focus|set|book|email|text|read|clean|pay|work|sit|breathe|drink|eat|walk|turn|close|check|move|keep|let's|lets|be|stay|protect|guard|block|ship|give|allow|aim|commit|tackle|knock|crush|push|hit|power|prioritize|skip|ignore|save|leave|tell|ask|reply|respond|draft|outline|jot|list|plan|schedule)\b/i;

export function cleanCue(raw, vocab, maxWords) {
  let t = calm(String(raw || '').replace(/\s+/g, ' ').trim());
  if (!t) return null;
  const sentences = t.split(/(?<=[.?])\s+/);
  if (sentences.some(s => BOSSY.test(s.trim()))) return null;
  if (/\byou (should|need|must|have to|gotta)\b/i.test(t)) return null;
  if (t.split(/\s+/).length > maxWords) return null;
  // the first word is capitalized anyway, so it isn't read as a name; anything later still has to be theirs
  if (!isGrounded(t.charAt(0).toLowerCase() + t.slice(1), vocab)) return null;
  if (!/[.?]$/.test(t)) t += '.';
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export const CUE_RULES = `walk_in: an optional quiet line for how this one begins, at most 8 words. Only for things people tend to put off or find hard to start: writing, admin, forms, money, calls, anything they sound like they dread. It names the smallest way in as a fact, never as an order: "The doc open is enough.", "One rough line counts.", "The first email is the whole job." Never open with a verb aimed at them (no "Open…", "Just…", "Start…", "Write…"), never "you should". No names, places or numbers they didn't say. null for meals, breaks, appointments, errands and anything simple.

intention: one line for the whole day, at most 14 words, from their own words, naming what matters most and letting the rest off the hook: "The report gets the morning. Everything else can wait." It is never an instruction, never praise, never therapy talk, and holds no names or numbers they didn't say. null when the day is only one or two small things.`;
