// Grounding check for anything the model writes back into a room (the Brief, the reply, the follow-up).
//
// The Brief is the person's own record of where they left off. It can reword, but it can't add.
// This catches the two ways a summary most often makes a story up: a name, place or product
// nobody mentioned, and a number (a time, a date, a count) nobody said. If either shows up,
// the caller drops that line and the room keeps what it already had.
//
// A word at the start of a sentence is capitalized anyway, so it only counts as a name
// when it's not an ordinary way to open a sentence.

const ALWAYS_OK = new Set(['i', "i'm", "i've", "i'll", "i'd", 'nenemi', 'ok', 'okay']);
const OPENERS = new Set(('you your you\'re you\'ve the a an and but so or then next now that this those these it it\'s its there here '
  + 'after before once since while when what which who how where why if maybe still both all one two nothing something anything '
  + 'everything today tonight tomorrow later last first also just right sounds nice good great glad cool got done want ready '
  + 'noted saved filed logged updated looks love up back with from for to in on at of by as no yes not only more less another other '
  + 'same whatever whenever either neither each every some any much many most few such let\'s thanks').split(' '));

function words(text) {
  return String(text || '').toLowerCase().match(/[a-z0-9À-ɏ][a-z0-9À-ɏ'’-]*/g) || [];
}

// every word and number the model was actually given
export function sourceVocabulary(parts) {
  const vocab = new Set();
  for (const p of parts.flat(Infinity)) {
    for (const w of words(p)) {
      vocab.add(w);
      // "Ollin's" and "Ollin" are the same name; "follow-up" is also "follow" and "up"
      vocab.add(w.replace(/['’]s$/, ''));
      w.split(/[-'’]/).forEach(x => x && vocab.add(x));
    }
  }
  return vocab;
}

// returns the names and numbers in `text` that appear nowhere in the source
export function ungrounded(text, vocab) {
  const out = [];
  const sentences = String(text || '').split(/(?<=[.?!:;])\s+|\n+/);
  for (const s of sentences) {
    const tokens = s.match(/[A-Za-z0-9À-ɏ][A-Za-z0-9À-ɏ'’-]*/g) || [];
    tokens.forEach((tok, i) => {
      const low = tok.toLowerCase();
      const bare = low.replace(/['’]s$/, '');
      const isNumber = /\d/.test(tok);
      const isName = /^[A-ZÀ-Þ]/.test(tok) && (i > 0 || !(OPENERS.has(low) || /(ing|ed|ly)$/.test(low)));
      if (!isNumber && !isName) return;
      if (ALWAYS_OK.has(low) || vocab.has(low) || vocab.has(bare)) return;
      // a number is fine if each digit run was said ("3pm" when they said "3")
      if (isNumber && (tok.match(/\d+/g) || []).every(n => vocab.has(n))) return;
      out.push(tok);
    });
  }
  return out;
}

export function isGrounded(text, vocab) { return ungrounded(text, vocab).length === 0; }

// the voice has no exclamation marks
export function calm(text) { return typeof text === 'string' ? text.replace(/!+/g, '.').replace(/\.{2,}/g, '.').trim() : text; }
