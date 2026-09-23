const {chromium}=require('/opt/node22/lib/node_modules/playwright');const fs=require('fs');const {execFileSync}=require('child_process');
const R='/home/user/nenemi/', S='/tmp/claude-0/-home-user-nenemi/c367e670-81af-5a70-98ea-1016a98294b4/scratchpad';
const MARK=fs.readFileSync(R+'photos/logo/nenemi-mark.svg','utf8');
const F=[
 {n:'01-home', shot:'01-home', photo:'photos/originals/kitchen-table.png', pos:'56% center', h:'Made for your<br>brain. Not their<br>expectations<b>.</b>', fs:8.4, sub:'You&rsquo;re not behind. You&rsquo;re paused.<br>There&rsquo;s a big difference.', dark:false},
 {n:'02-life', full:'photos/originals/jacket-messy-bed.jpg', pos:'53% center'},
 {n:'03-room', shot:'02-room', photo:'photos/originals/fabric-wall-designer.png', pos:'44% center', h:'Never lose<br>your place<b>.</b>', sub:'Built for the day you get pulled away.<br>Your room remembers where you were.', dark:false},
 {n:'04-life', full:'photos/originals/desk-stretch.png', pos:'57% center'},
 {n:'05-day', shot:'03-day', photo:'photos/originals/hallway-tote.png', pos:'35% center', h:'Get a day<br>back<b>.</b>', sub:'Built for the day that got away from you.<br>Nenemi makes room to move.', dark:false},
 {n:'06-life', full:'photos/originals/garden-phone.png', pos:'68% center'},
 {n:'07-stuck', shot:'04-stuck', photo:'photos/originals/floor-mms.png', pos:'62% center', h:'Four ways<br>back in<b>.</b>', sub:'Built for the moment you freeze.<br>One small move, when you&rsquo;re ready.', dark:true},
 {n:'08-life', full:'photos/originals/desk-eyes-closed.png', pos:'82% center'},
 {n:'09-rooms', shot:'05-rooms', photo:'photos/originals/living-room-two.png', pos:'60% center', h:'People heal<br>people<b>.</b>', sub:'Built for the days an app isn&rsquo;t enough.<br>Real people, one tap away.', dark:false},
 {n:'10-life', full:'photos/originals/couch-laundry.png', pos:'21% center'},
];
const life=(f)=>`<!doctype html><html><head><link href="https://fonts.googleapis.com/css2?family=Archivo+Black&display=swap" rel="stylesheet"><style>*{margin:0}html,body{width:100vw;height:100vh;overflow:hidden;background:#111312}.ph{position:absolute;inset:0;background:url('file://${R}${f.full}') ${f.pos}/cover}.sh{position:absolute;left:0;right:0;top:0;height:22vh;background:linear-gradient(rgba(17,19,18,.55),transparent)}.eb{position:absolute;left:6vw;top:4.6vh;display:flex;align-items:center;gap:2.2vw;font:3.4vw 'Archivo Black',sans-serif;letter-spacing:.3em;color:#F5F6F5}.eb svg{width:5.6vw;height:auto}.eb path{fill:#F5F6F5}</style></head><body><div class="ph"></div><div class="sh"></div><div class="eb">${MARK}NENEMI</div></body></html>`;
const page=(f,slot)=>f.full?life(f):`<!doctype html><html><head><link href="https://fonts.googleapis.com/css2?family=Archivo:wght@500&family=Archivo+Black&display=swap" rel="stylesheet"><style>
*{margin:0;box-sizing:border-box}html,body{width:100vw;height:100vh;overflow:hidden}
body{background:${f.dark?'#111312':'#F5F6F5'};position:relative;font-family:Archivo,sans-serif}
.photo{position:absolute;left:0;right:0;top:${f.sub?'28vh':'25vh'};bottom:0;background:url('file://${R}${f.photo}') ${f.pos}/cover;
 -webkit-mask-image:linear-gradient(to bottom,transparent 0,#000 16vh);${f.dark?'filter:brightness(.55) saturate(.8)':''}}
.eb{position:absolute;left:6vw;top:4.6vh;display:flex;align-items:center;gap:2.2vw;font:3.4vw 'Archivo Black',sans-serif;letter-spacing:.3em;color:${f.dark?'#F5F6F5':'#111312'}}.eb svg{width:5.6vw;height:auto}.eb path{fill:${f.dark?'#F5F6F5':'#111312'}}
h1{font-family:'Archivo Black',sans-serif;font-weight:400;font-size:${f.fs||11}vw;line-height:1;letter-spacing:-.02em;color:${f.dark?'#F5F6F5':'#111312'}}
h1 b{color:${f.dark?'#5AA6B0':'#3C8692'}}
.copy{position:absolute;left:6vw;right:6vw;top:8.6vh}.sub{margin-top:2.6vw;font:500 4vw/1.35 Archivo,sans-serif;color:${f.dark?'#B9BEBD':'#63696A'}}
.phone{position:absolute;left:6vw;top:${f.sub?'31vh':'28vh'};width:60vw;padding:1.9vw;background:#0b0b0b;border-radius:10.5vw;
 box-shadow:0 4vw 10vw rgba(0,0,0,.45),0 0 0 .5vw rgba(255,255,255,.08)}
.phone img{display:block;width:100%;border-radius:8.8vw}
</style></head><body><div class="photo"></div><div class="eb">${MARK}NENEMI</div><div class="copy"><h1>${f.h}</h1>${f.sub?'<p class="sub">'+f.sub+'</p>':''}</div>
<div class="phone"><img src="file://${S}/store/${slot}/${f.shot}.png"></div></body></html>`;
(async()=>{const b=await chromium.launch();
for(const [slot,w,h] of [['6.7',430,932],['6.5',414,896]]){
 const p=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:3});
 await p.route(/fonts\.(googleapis|gstatic)\.com/, r=>{const u=r.request().url(); try{const body=execFileSync('curl',['-s','-A','Mozilla/5.0 Chrome/140',u]); r.fulfill({status:200,body,contentType:u.includes('gstatic')?'font/woff2':'text/css',headers:{'access-control-allow-origin':'*'}});}catch(e){r.abort();}});
 fs.mkdirSync(S+'/frames/'+slot,{recursive:true});
 for(const f of F){const file=S+'/frames/'+f.n+'.html';fs.writeFileSync(file,page(f,slot));await p.goto('file://'+file);await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(400);
  await p.screenshot({path:S+'/frames/'+slot+'/'+f.n+'.png'});}
}
await b.close();})();
