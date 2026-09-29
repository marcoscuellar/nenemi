// App Store screens from today's app (v4 monochrome, Front Porch, ink completion), for build-iphone.cjs.
// Serves this repo as https://app.mynenemi.com with every request intercepted (no network except Google Fonts),
// seeds one believable day, and shoots each screen at both App Store iPhone sizes.
//
//   PWP=$(npm root -g)/playwright S=/some/scratch node nenemi-handover/store/final/capture-v4.cjs
//   -> $S/store2/6.7/*.png (430x932 @3x = 1290x2796) and $S/store2/6.5/*.png (414x896 @3x = 1242x2688)
const { chromium } = require(process.env.PWP);
const fs = require('fs'), path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '../../..');
const ORIGIN = 'https://app.mynenemi.com';
const TYPES = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2' };

async function serve(ctx) {
  await ctx.route('**/*', async route => {
    const u = new URL(route.request().url());
    if (/fonts\.(googleapis|gstatic)\.com/.test(u.hostname)) {
      try { const body = execFileSync('curl', ['-s', '-A', 'Mozilla/5.0 Chrome/140', u.href]); return route.fulfill({ status: 200, body, contentType: u.hostname.includes('gstatic') ? 'font/woff2' : 'text/css', headers: { 'access-control-allow-origin': '*' } }); }
      catch (e) { return route.abort(); }
    }
    if (u.origin !== ORIGIN) return route.fulfill({ status: 200, body: '' });
    if (u.pathname === '/api/config') return route.fulfill({ json: { authEnabled: false, freeRooms: 2, smartRouting: false, billing: false } });
    if (u.pathname.startsWith('/api/')) return route.fulfill({ json: {} });
    const f = path.join(ROOT, u.pathname === '/' ? 'index.html' : decodeURIComponent(u.pathname));
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) return route.fulfill({ status: 200, body: '' });
    return route.fulfill({ body: fs.readFileSync(f), contentType: TYPES[path.extname(f)] || 'application/octet-stream' });
  });
}

// one believable Tuesday: a name, rooms with real context, a day with one thing done and one happening now
const SEED = () => {
  const h = x => Date.now() - x * 3600e3;
  profile.name = 'Maya';
  auth.plan = 'paid'; auth.roomLimit = null; // Full access, so no free-plan note in the shots
  toastTick = () => {}; const tq = document.getElementById('nxToasts'); if (tq) { tq.innerHTML = ''; tq.style.display = 'none'; } // no pop-ups over the screens
  const d = rooms.findIndex(r => r.demo); if (d >= 0) rooms.splice(d, 1);
  rooms.push(
    { id: 'r-mom', name: 'Mom\'s 60th', one_liner: 'Dinner at Rosa\'s on the 12th', brief: 'Table for eight at Rosa\'s is booked for 7. Still need the gift. She keeps mentioning that blue scarf from the market.', loops: [{ text: 'Order the blue scarf', resolved: false }, { text: 'Ask Dani to split the cake', resolved: false }, { text: 'Book the table', resolved: true }], log: [{ source: 'voice', ts: h(9), text: 'She brought up the blue scarf again. That\'s the gift.' }], link: null, lastVisited: h(9) },
    { id: 'r-pitch', name: 'Pitch deck', one_liner: 'Friday with the Harbor team', brief: 'Tuesday\'s draft had the better opener. Slides 4 to 7 need the new numbers.', loops: [{ text: 'Swap in the new numbers on slide 4', resolved: false }], log: [{ source: 'typed', ts: h(20), text: 'Kept the Tuesday draft in case the new one goes sideways.' }], link: { url: 'https://figma.com/', title: 'Deck in Figma' }, lastVisited: h(20) },
    { id: 'r-home', name: 'Home', one_liner: 'The lease, the leak, the landlord', brief: 'Leak photos sent. No reply yet.', loops: [{ text: 'Follow up with the landlord', resolved: false }], log: [{ source: 'typed', ts: h(52), text: 'Sent the photos of the ceiling.' }], link: null, lastVisited: h(52) },
    { id: 'r-email', name: 'Email I never sent', one_liner: 'To Dana, about Friday', brief: 'Draft is written. Hovering over send.', loops: [{ text: 'Read it once, then send', resolved: false }], log: [{ source: 'typed', ts: h(120), text: 'Draft is in my notes.' }], link: null, lastVisited: h(120) },
  );
  const k = dkey(today);
  events[k] = [
    { name: 'Reply to Ana', kind: 'block', start: 8.5, end: 9, done: true, room: 'r-email' },
    { name: 'Swap in the new numbers', kind: 'block', start: 10, end: 11.5, room: 'r-pitch' },
    { name: 'Lunch, away from the desk', kind: 'block', start: 12.5, end: 13.25 },
    { name: 'Client call', kind: 'fixed', start: 14, end: 14.75 },
    { name: 'Order the blue scarf', kind: 'block', anytime: true, start: 0, end: 0, room: 'r-mom' },
  ];
  events[k].forEach(normalizeEvent);
  save(); renderRoomList(); renderSideRooms(); renderHomeReturn(); renderCal(); renderGreeting();
};

(async () => {
  const S = process.env.S; if (!S) throw new Error('set S to a scratch folder');
  const b = await chromium.launch();
  for (const [slot, vp] of [['6.7', { width: 430, height: 932 }], ['6.5', { width: 414, height: 896 }]]) {
    const out = path.join(S, 'store2', slot); fs.mkdirSync(out, { recursive: true });
    const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 3, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
    await serve(ctx);
    await ctx.addInitScript(() => { try { localStorage.setItem('nenemi.onboarded', '1'); localStorage.setItem('nenemi.seen', '1'); } catch (e) {} });
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.clock.install({ time: new Date(2026, 8, 29, 10, 20) }); // a Tuesday morning, 10:20
    await p.goto(ORIGIN + '/', { waitUntil: 'domcontentloaded' });
    await p.locator('#nxSplash').waitFor({ state: 'detached', timeout: 8000 });
    await p.evaluate(SEED); await p.evaluate(() => document.fonts.ready);
    const shot = async (name) => { await p.waitForTimeout(700); await p.screenshot({ path: path.join(out, name + '.png') }); };

    await p.evaluate(() => { go('home'); porchFresh(); renderGreeting(); }); await shot('01-home');
    await p.evaluate(() => openRoom('r-mom')); await shot('02-room');
    await p.evaluate(() => go('calendar')); await shot('03-day');
    await p.evaluate(() => go('stuck')); await shot('04-stuck');
    await p.evaluate(() => go('rooms')); await shot('05-rooms');
    await p.evaluate(() => go('humans')); await shot('06-humans');
    await p.evaluate(() => { go('notes'); const t = document.getElementById('notesInput'); if (t) { t.value = 'The client call went better than I thought.\nOnboarding copy finally feels right.\nStill need to order the scarf.'; t.dispatchEvent(new Event('input', { bubbles: true })); } });
    await shot('07-recap');
    console.log(slot, 'page errors:', errs.length ? errs : 'none');
    await ctx.close();
  }
  await b.close();
})();
