const {chromium}=require('/opt/node22/lib/node_modules/playwright');const fs=require('fs');const {execFileSync}=require('child_process');
const R='/home/user/nenemi/', S='/tmp/claude-0/-home-user-nenemi/c367e670-81af-5a70-98ea-1016a98294b4/scratchpad';
const MARK=fs.readFileSync(R+'photos/logo/nenemi-mark.svg','utf8');
const F=[
 {n:'01-home', shot:'01-home', photo:'photos/originals/kitchen-table.png', pos:'56% center', h:'Made for your<br>brain. Not their<br>expectations<b>.</b>', fs:9.4, dark:false},
 {n:'02-room', shot:'02-room', photo:'photos/originals/office-hand-in-hair.jpeg', pos:'52% center', h:'Never lose<br>your place<b>.</b>', dark:false},
 {n:'03-day', shot:'03-day', photo:'photos/originals/hallway-tote.png', pos:'35% center', h:'Get a day<br>back<b>.</b>', dark:false},
 {n:'04-stuck', shot:'04-stuck', photo:'photos/originals/floor-mms.png', pos:'62% center', h:'Four ways<br>back in<b>.</b>', dark:true},
 {n:'05-rooms', shot:'05-rooms', photo:'photos/originals/living-room-two.png', pos:'60% center', h:'People heal<br>people<b>.</b>', dark:false},
];
const page=(f,slot)=>`<!doctype html><html><head><link href="https://fonts.googleapis.com/css2?family=Archivo+Black&display=swap" rel="stylesheet"><style>
*{margin:0;box-sizing:border-box}html,body{width:100vw;height:100vh;overflow:hidden}
body{background:${f.dark?'#111312':'#F5F6F5'};position:relative;font-family:Archivo,sans-serif}
.photo{position:absolute;left:0;right:0;top:25vh;bottom:0;background:url('file://${R}${f.photo}') ${f.pos}/cover;
 -webkit-mask-image:linear-gradient(to bottom,transparent 0,#000 16vh);${f.dark?'filter:brightness(.55) saturate(.8)':''}}
.eb{position:absolute;left:6vw;top:4.6vh;display:flex;align-items:center;gap:2.2vw;font:3.4vw 'Archivo Black',sans-serif;letter-spacing:.3em;color:${f.dark?'#F5F6F5':'#111312'}}.eb svg{width:5.6vw;height:auto}.eb path{fill:${f.dark?'#F5F6F5':'#111312'}}
h1{position:absolute;left:6vw;top:8.6vh;font-family:'Archivo Black',sans-serif;font-weight:400;font-size:${f.fs||11}vw;line-height:1;letter-spacing:-.02em;color:${f.dark?'#F5F6F5':'#111312'}}
h1 b{color:${f.dark?'#5AA6B0':'#3C8692'}}
.phone{position:absolute;left:6vw;top:28vh;width:60vw;padding:1.9vw;background:#0b0b0b;border-radius:10.5vw;
 box-shadow:0 4vw 10vw rgba(0,0,0,.45),0 0 0 .5vw rgba(255,255,255,.08)}
.phone img{display:block;width:100%;border-radius:8.8vw}
</style></head><body><div class="photo"></div><div class="eb">${MARK}NENEMI</div><h1>${f.h}</h1>
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
