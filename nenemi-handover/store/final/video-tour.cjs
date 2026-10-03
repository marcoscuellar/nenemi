// A short silent tour of the real app (Oct 2026), recorded in the browser with the same sample day as the
// screenshots: splash, the Porch sorting a messy thought, My day, a room, Stuck, Focus, back to the Porch.
// Reuses serve() and SEED from capture-v4.cjs.
//
//   PWP=$(npm root -g)/playwright S=/some/scratch node nenemi-handover/store/final/video-tour.cjs
//   -> $S/video/tour.webm (then ffmpeg it to mp4; see the commit that added this)
const { chromium } = require(process.env.PWP);
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, 'capture-v4.cjs'), 'utf8');
const { serve, SEED, ORIGIN } = new Function('require', '__dirname', src.split('(async () => {')[0].replace(/^const \{ chromium \}.*$/m, '') + '; return { serve, SEED, ORIGIN };')(require, __dirname);

(async () => {
  const S = process.env.S, out = path.join(S, 'video'); fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, serviceWorkers: 'block', recordVideo: { dir: out, size: { width: 860, height: 1864 } } });
  await serve(ctx);
  await ctx.addInitScript(() => { try { localStorage.setItem('nenemi.onboarded', '1'); localStorage.setItem('nenemi.seen', '1'); } catch (e) {} });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.clock.install({ time: new Date(2026, 8, 29, 10, 20) });
  await p.goto(ORIGIN + '/', { waitUntil: 'domcontentloaded' });
  await p.evaluate(SEED).catch(() => {}); // may land before the splash ends; seeded again below
  await p.locator('#nxSplash').waitFor({ state: 'detached', timeout: 8000 });
  await p.evaluate(SEED); await p.evaluate(() => { go('home'); porchFresh(); renderGreeting(); });
  await p.waitForTimeout(1600);
  // the Porch: a messy thought, sorted
  await p.locator('#composerInput').click();
  await p.locator('#composerInput').pressSequentially('ugh ok. call the dentist at 3, text dani back, and make sure the blue scarf is still in stock for mom', { delay: 28 });
  await p.press('#composerInput', 'Enter'); await p.waitForTimeout(2600);
  // My day: one thing checked off
  await p.evaluate(() => go('calendar')); await p.waitForTimeout(1400);
  await p.locator('.nx-task-check:not(.completed)').nth(1).click(); await p.waitForTimeout(1600);
  // a room: where you left off
  await p.evaluate(() => openRoom('r-mom')); await p.waitForTimeout(2200);
  await p.mouse.wheel(0, 380); await p.waitForTimeout(1400);
  // Stuck: one small way back in
  await p.evaluate(() => go('stuck')); await p.waitForTimeout(1600);
  await p.evaluate(() => openDoor('start')); await p.waitForTimeout(2600);
  // Focus: one task, the clock counting up
  await p.evaluate(() => { const d = document.getElementById('doors'); if (d) d.hidden = false; const m = document.getElementById('stuckMove'); if (m) m.hidden = true; openRoom('r-pitch'); focusOnLoop('Swap in the new numbers on slide 4'); });
  await p.waitForTimeout(3200);
  // back where it started
  await p.evaluate(() => { clearInterval(lockdownInterval); go('home'); porchFresh(); renderGreeting(); }); await p.waitForTimeout(2000);
  const v = p.video(); await ctx.close(); fs.renameSync(await v.path(), path.join(out, 'tour.webm'));
  console.log('page errors:', errs.length ? errs : 'none');
  await b.close();
})();
