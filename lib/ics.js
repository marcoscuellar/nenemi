// Turns Nenemi's day blocks into an iCalendar file.
//
// Blocks live as { name, start, end, kind, room?, notes? } under events['YYYY-MM-DD'],
// with start/end as fractional local hours (9.5 = 9:30). Nenemi never stores a
// timezone, so the times go out "floating": 9:30 means 9:30 wherever the person
// is, which is exactly what a personal day should mean.

function esc(s) {
  return String(s == null ? '' : s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

// "2026-09-09" + 9.5 -> "20260909T093000"; hours past midnight roll to the next day
function stamp(dk, h) {
  let [y, m, d] = dk.split('-').map(Number);
  let hr = Math.floor(h), min = Math.round((h - hr) * 60);
  if (min === 60) { hr += 1; min = 0; }
  if (hr >= 24) { const t = new Date(y, m - 1, d + Math.floor(hr / 24)); y = t.getFullYear(); m = t.getMonth() + 1; d = t.getDate(); hr = hr % 24; }
  const p = n => String(n).padStart(2, '0');
  return `${y}${p(m)}${p(d)}T${p(hr)}${p(min)}00`;
}

function utcNow() {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

// RFC 5545 folds lines longer than 75 octets: continuation lines start with a space
function fold(line) {
  const out = [];
  let s = line;
  while (s.length > 74) { out.push(s.slice(0, 74)); s = ' ' + s.slice(74); }
  out.push(s);
  return out.join('\r\n');
}

function slug(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'block'; }

/**
 * @param {Record<string, Array<{name:string,start:number,end:number,kind?:string,room?:string|null,notes?:string}>>} events
 * @param {{ rooms?: Array<{id:string,name:string}>, fromKey?: string, name?: string, feed?: boolean }} opts
 *   fromKey: only days on or after this 'YYYY-MM-DD' key; feed: add the refresh hints subscribers use
 */
export function buildIcs(events, opts = {}) {
  const rooms = new Map((opts.rooms || []).map(r => [r.id, r.name]));
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Nenemi//Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${esc(opts.name || 'Nenemi')}`,
  ];
  if (opts.feed) lines.push('REFRESH-INTERVAL;VALUE=DURATION:PT15M', 'X-PUBLISHED-TTL:PT15M');
  const now = utcNow();
  const keys = Object.keys(events || {}).filter(k => /^\d{4}-\d{2}-\d{2}$/.test(k) && (!opts.fromKey || k >= opts.fromKey)).sort();
  for (const dk of keys) {
    const list = Array.isArray(events[dk]) ? events[dk] : [];
    for (const e of list) {
      if (!e || typeof e.start !== 'number' || typeof e.end !== 'number' || !(e.end > e.start)) continue;
      const room = e.room && rooms.get(e.room);
      const desc = [e.notes, room ? `Room: ${room}` : ''].filter(Boolean).join('\n');
      lines.push(
        'BEGIN:VEVENT',
        `UID:${dk}-${Math.round(e.start * 60)}-${slug(e.name)}@mynenemi.com`,
        `DTSTAMP:${now}`,
        `DTSTART:${stamp(dk, e.start)}`,
        `DTEND:${stamp(dk, e.end)}`,
        `SUMMARY:${esc(e.name || 'Block')}`,
      );
      if (desc) lines.push(`DESCRIPTION:${esc(desc)}`);
      if (e.kind) lines.push(`CATEGORIES:${esc(e.kind === 'fixed' ? 'Fixed' : e.kind === 'buffer' ? 'Buffer' : 'Focus')}`);
      lines.push('END:VEVENT');
    }
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}

export function dayKeyDaysAgo(n) {
  const d = new Date(); d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
