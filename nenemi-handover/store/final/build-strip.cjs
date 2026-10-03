// The App Store set as one strip (Oct 2026, Marcos's call): big phones that run into the next slide,
// so swiping reads as one continuous piece. Backgrounds come from build-hooks.cjs and build-iphone-v2.cjs
// rendered without phones (NOPHONE=1); this lays the phones over the whole strip and cuts it into slides.
//
//   PWP=$(npm root -g)/playwright S=/some/scratch node nenemi-handover/store/final/build-strip.cjs
//   -> upload/iphone-6.9 (1290x2796) and upload/iphone-6.5 (1242x2688), NENEMI-PHONE-01..09.png
const { chromium } = require(process.env.PWP); const fs = require('fs'), path = require('path');
const S = process.env.S, OUT = path.join(__dirname, 'upload');
// each slide: its background, and the screen in its phone (null = no phone on this slide)
const SLIDES = (slot) => {
  const bg = n => path.join(S, 'frames', 'bg-' + slot, n + '.png'), cl = n => path.join(S, 'frames', 'clean-' + slot, n + '.png');
  const ht = JSON.parse(fs.readFileSync(path.join(S, 'frames', 'bg-' + slot, 'tops.json'))), ct = JSON.parse(fs.readFileSync(path.join(S, 'frames', 'clean-' + slot, 'tops.json')));
  return [
    { bg: bg('01'), shot: '00-porch', top: ht[0] },
    { bg: bg('02'), shot: '01-home', top: ht[1] },
    { bg: bg('03'), shot: '03-day', top: ht[2] },
    { bg: bg('04'), shot: '04-stuck', top: ht[3] },
    { bg: cl('02'), shot: '02-room', top: ct[1] },
    { bg: cl('04'), shot: '07-recap', top: ct[3] },
    { bg: cl('05'), shot: '06-humans', top: ct[4] },
    { bg: cl('06'), shot: null },
    { bg: path.join(S, 'store2', slot, '08-name.png'), shot: null },
  ];
};
const PW = 0.80, LEFT = 0.40; // phone width and where it starts, as a share of one slide: the last fifth runs into the next
// a phone starts below its own copy and below the next slide's copy (it runs into that slide);
// on the photo slides it sits lower still, so the person shows in the band above it
const phoneTop = (sl, i) => Math.max(sl[i].top, (sl[i + 1] && sl[i + 1].top) || 0, i < 4 ? 0.40 : 0) + 0.02;
const page = (sl, slot, w, h) => `<!doctype html><html><head><style>
*{margin:0;box-sizing:border-box}html,body{width:${w * sl.length}px;height:${h}px;overflow:hidden;background:#111312}
.cell{position:absolute;top:0;width:${w}px;height:${h}px;object-fit:cover}
.phone{position:absolute;width:${w * PW}px;padding:${w * 0.022}px;background:#0b0b0b;border-radius:${w * 0.12}px;z-index:5;
 box-shadow:0 ${w * 0.08}px ${w * 0.16}px -${w * 0.02}px rgba(0,0,0,.55),0 ${w * 0.03}px ${w * 0.06}px rgba(0,0,0,.3),0 0 0 ${w * 0.004}px rgba(255,255,255,.16)}
.phone img{display:block;width:100%;border-radius:${w * 0.1}px}
</style></head><body>
${sl.map((x, i) => `<img class="cell" style="left:${i * w}px" src="file://${x.bg}">`).join('')}
${sl.map((x, i) => x.shot ? `<div class="phone" style="left:${(i + LEFT) * w}px;top:${phoneTop(sl, i) * h}px"><img src="file://${path.join(S, 'store2', slot, x.shot + '.png')}"></div>` : '').join('')}
</body></html>`;
(async () => {
  const b = await chromium.launch();
  for (const [slot, w, h, dir] of [['6.7', 430, 932, 'iphone-6.9'], ['6.5', 414, 896, 'iphone-6.5']]) {
    const sl = SLIDES(slot);
    const p = await b.newPage({ viewport: { width: w * sl.length, height: h }, deviceScaleFactor: 3 });
    const file = path.join(S, 'frames', 'strip.html'); fs.writeFileSync(file, page(sl, slot, w, h));
    await p.goto('file://' + file); await p.waitForTimeout(500);
    const out = path.join(OUT, dir); fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
    await p.screenshot({ path: path.join(S, 'frames', 'strip-' + slot + '.png') });
    for (let i = 0; i < sl.length; i++) await p.screenshot({ path: path.join(out, `NENEMI-PHONE-0${i + 1}.png`), clip: { x: i * w, y: 0, width: w, height: h } });
    await p.close();
  }
  await b.close();
})();
