// The App Store set, v4: three dark hook slides first (they're what shows in search), then the rest.
// Hooks: big two-line headline on black, a real person behind the phone, today's app screen in the phone.
// Needs the screens from capture-v4.cjs and the clean slides from build-iphone.cjs in the same $S.
//
//   PWP=$(npm root -g)/playwright S=/some/scratch node nenemi-handover/store/final/build-hooks.cjs
//   -> nenemi-handover/store/final/upload/iphone-6.9 and iphone-6.5, NENEMI-PHONE-01..08.png
const { chromium } = require(process.env.PWP); const fs = require('fs'), path = require('path');
const { execFileSync } = require('child_process');
const R = path.resolve(__dirname, '../../..') + '/', S = process.env.S, OUT = path.join(__dirname, 'upload');
const MARK = fs.readFileSync(R + 'photos/logo/nenemi-mark.svg', 'utf8').replace('#111312', '#F5F6F5');
const HOOKS = [
  { shot: '01-home', photo: 'photos/originals/kitchen-table.png', pos: '60% center', h: 'Every crayon.<br>No box<b>.</b>', sub: 'ADHD isn&rsquo;t missing pieces. It&rsquo;s missing a place to put them. Nenemi is the box.' },
  { shot: '03-day', photo: 'photos/originals/office-hand-in-hair.jpeg', pos: '50% center', h: 'Lost the list<br>by 10 AM<b>?</b>', sub: 'Yeah. Same. Say it all, in any order. Nenemi turns it into a day you can actually do.' },
  { shot: '04-stuck', photo: 'photos/originals/floor-mms.png', pos: '62% center', h: 'Frozen?<br>One way back in<b>.</b>', sub: 'No new plan. No guilt. Just the smallest next step.' },
];
// then the rest of the story, from the clean set: room, close the day, people, closer
// and last, the name exactly as the app shows it (screen 19b, from capture-v4.cjs)
const REST = ['02', '04', '05', '06'];
const page = (f, slot) => `<!doctype html><html><head><link href="https://fonts.googleapis.com/css2?family=Archivo:wght@500&family=Archivo+Black&display=swap" rel="stylesheet"><style>
*{margin:0;box-sizing:border-box}html,body{width:100vw;height:100vh;overflow:hidden}
body{background:#0a0b0b;position:relative;font-family:Archivo,sans-serif}
.photo{position:absolute;inset:0;background:url('file://${R}${f.photo}') ${f.pos}/cover}
.fade{position:absolute;left:0;right:0;top:0;height:12vh;background:linear-gradient(to bottom,#0a0b0b 0,rgba(10,11,11,.6) 35%,rgba(10,11,11,0) 100%)}
.eb{position:absolute;left:6vw;top:4.6vh;display:flex;align-items:center;gap:2.2vw;font:3.4vw 'Archivo Black',sans-serif;letter-spacing:.3em;color:#F5F6F5}.eb svg{width:5.6vw;height:auto}
h1{font-family:'Archivo Black',sans-serif;font-weight:400;font-size:13.2vw;line-height:.98;letter-spacing:-.035em;color:#F5F6F5}
h1 b{color:#5AA6B0}
.copy{position:absolute;left:6vw;right:6vw;top:8.8vh}.sub{margin-top:3vw;font:500 4.1vw/1.38 Archivo,sans-serif;color:#D2D5D4;max-width:84vw}
.phone{position:absolute;left:6vw;top:34vh;width:60vw;padding:1.9vw;background:#0b0b0b;border-radius:10.5vw;
 box-shadow:0 8vw 16vw -2vw rgba(0,0,0,.7),0 3vw 6vw rgba(0,0,0,.4),0 0 0 .4vw rgba(255,255,255,.16)}
.phone img{display:block;width:100%;border-radius:8.8vw}
</style></head><body><div class="photo"></div><div class="fade"></div><div class="eb">${MARK}NENEMI</div><div class="copy" id="cp"><h1>${f.h}</h1><p class="sub">${f.sub}</p></div>
<div class="phone"><img src="file://${S}/store2/${slot}/${f.shot}.png"></div></body></html>`;
(async () => {
  const b = await chromium.launch();
  for (const [slot, w, h, dir] of [['6.7', 430, 932, 'iphone-6.9'], ['6.5', 414, 896, 'iphone-6.5']]) {
    const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 3 });
    await p.route(/fonts\.(googleapis|gstatic)\.com/, r => { const u = r.request().url(); try { const body = execFileSync('curl', ['-s', '-A', 'Mozilla/5.0 Chrome/140', u]); r.fulfill({ status: 200, body, contentType: u.includes('gstatic') ? 'font/woff2' : 'text/css', headers: { 'access-control-allow-origin': '*' } }); } catch (e) { r.abort(); } });
    const out = path.join(OUT, dir); fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
    for (let i = 0; i < HOOKS.length; i++) {
      const file = path.join(S, 'frames', 'hook.html'); fs.writeFileSync(file, page(HOOKS[i], slot));
      await p.goto('file://' + file); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
      await p.evaluate(() => { const c = document.getElementById('cp'); const t = c.offsetTop + c.offsetHeight + 24; document.querySelector('.phone').style.top = t + 'px'; const pt = t - 40; document.querySelector('.photo').style.top = pt + 'px'; document.querySelector('.fade').style.top = pt + 'px'; });
      await p.screenshot({ path: path.join(out, `NENEMI-PHONE-0${i + 1}.png`) });
    }
    REST.forEach((n, j) => fs.copyFileSync(path.join(S, 'frames', 'clean-' + slot, n + '.png'), path.join(out, `NENEMI-PHONE-0${HOOKS.length + j + 1}.png`)));
    fs.copyFileSync(path.join(S, 'store2', slot, '08-name.png'), path.join(out, `NENEMI-PHONE-0${HOOKS.length + REST.length + 1}.png`));
    await p.close();
  }
  await b.close();
})();
