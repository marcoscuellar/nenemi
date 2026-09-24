const {chromium}=require('/opt/node22/lib/node_modules/playwright');const fs=require('fs');const {execFileSync}=require('child_process');
const R='/home/user/nenemi/', S='/tmp/claude-0/-home-user-nenemi/c367e670-81af-5a70-98ea-1016a98294b4/scratchpad';
const MARK=fs.readFileSync(R+'photos/logo/nenemi-mark.svg','utf8');
const F=[
 {n:'01', shot:'03-day', photo:'photos/originals/kitchen-table.png', pos:'60% center', fs:8.2, h:'Get the noise out.<br>Get a day back<b>.</b>', sub:'Type it, say it, start in the middle. You don&rsquo;t have to organize your thoughts before putting them here. NENEMI helps you see what matters today and find a place to begin.'},
 {n:'02', shot:'02-room', photo:'photos/originals/fabric-wall-designer.png', pos:'44% center', fs:9.4, h:'Never pretend<br>you remembered<b>.</b>', sub:'That project, the conversation you need to finish, the thing you meant to do next&mdash;give each its own Room. NENEMI keeps the context together, so you can leave when you need to and come back knowing where you were.'},
 {n:'03', shot:'04-stuck', photo:'photos/originals/floor-mms.png', pos:'62% center', fs:9.4, h:'You had a plan.<br>Then the day happened<b>.</b>', sub:'A plan can make sense at 9 AM and feel impossible by 1 PM. Tell NENEMI where you are right now. It helps you find one small way back in.'},
 {n:'04', shot:'07-recap', photo:'photos/originals/desk-stretch.png', pos:'38% center', fs:9.4, h:'The day ends.<br>What mattered stays<b>.</b>', sub:'Say what happened, messy is fine. NENEMI holds what matters, gives one leftover a home, and lets the rest go. Nothing carries over unless you choose it.'},
 {n:'05', shot:'06-humans', photo:'photos/originals/living-room-two.png', pos:'60% center', fs:10, h:'Systems help.<br>People heal<b>.</b>', sub:'NENEMI can help you hold the day. Sometimes the next step is talking to someone who understands. Finding support should be as easy to reach as everything else here.'},
 {n:'06', shot:'01-home', photo:'photos/midprocess.jpg', pos:'10% center', fs:10, h:'It&rsquo;s okay.<br>Nenemi has it<b>.</b>', sub:'Whatever&rsquo;s taking up space, put it here. Start with one thought. You can figure out the rest together.'},
];
const page=(f,slot)=>`<!doctype html><html><head><link href="https://fonts.googleapis.com/css2?family=Archivo:wght@500&family=Archivo+Black&display=swap" rel="stylesheet"><style>
*{margin:0;box-sizing:border-box}html,body{width:100vw;height:100vh;overflow:hidden}
body{background:#0a0b0b;position:relative;font-family:Archivo,sans-serif}
.photo{position:absolute;left:0;right:0;top:0;bottom:0;background:url('file://${R}${f.photo}') ${f.pos}/cover;
 }
.fade{position:absolute;left:0;right:0;top:0;height:11vh;background:linear-gradient(to bottom,#0a0b0b 0,rgba(10,11,11,.6) 35%,rgba(10,11,11,0) 100%)}
.eb{position:absolute;left:6vw;top:4.6vh;display:flex;align-items:center;gap:2.2vw;font:3.4vw 'Archivo Black',sans-serif;letter-spacing:.3em;color:#F5F6F5}.eb svg{width:5.6vw;height:auto}.eb path{fill:#F5F6F5}
h1{font-family:'Archivo Black',sans-serif;font-weight:400;font-size:${f.fs||11}vw;line-height:1;letter-spacing:-.02em;color:#F5F6F5}
h1 b{color:#5AA6B0}
.copy{position:absolute;left:6vw;right:6vw;top:8.6vh}.sub{margin-top:2.6vw;font:500 3.55vw/1.42 Archivo,sans-serif;color:#C9CDCC}
.phone{position:absolute;left:6vw;top:31vh;width:60vw;padding:1.9vw;background:#0b0b0b;border-radius:10.5vw;
 box-shadow:0 8vw 16vw -2vw rgba(0,0,0,.7),0 3vw 6vw rgba(0,0,0,.4),0 0 0 .4vw rgba(255,255,255,.16)}
.phone img{display:block;width:100%;border-radius:8.8vw}
</style></head><body><div class="photo"></div><div class="fade"></div><div class="eb">${MARK}NENEMI</div><div class="copy" id="cp"><h1>${f.h}</h1>${f.sub?'<p class="sub">'+f.sub+'</p>':''}</div>
<div class="phone"><img src="file://${S}/store2/${slot}/${f.shot}.png"></div></body></html>`;
(async()=>{const b=await chromium.launch();
for(const [slot,w,h] of [['6.7',430,932],['6.5',414,896]]){
 const p=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:3});
 await p.route(/fonts\.(googleapis|gstatic)\.com/, r=>{const u=r.request().url(); try{const body=execFileSync('curl',['-s','-A','Mozilla/5.0 Chrome/140',u]); r.fulfill({status:200,body,contentType:u.includes('gstatic')?'font/woff2':'text/css',headers:{'access-control-allow-origin':'*'}});}catch(e){r.abort();}});
 fs.mkdirSync(S+'/frames/dk-'+slot,{recursive:true});
 for(const f of F){const file=S+'/frames/'+f.n+'.html';fs.writeFileSync(file,page(f,slot));await p.goto('file://'+file);await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(400);
  await p.evaluate(()=>{const c=document.getElementById('cp');const t=c.offsetTop+c.offsetHeight+22;document.querySelector('.phone').style.top=t+'px';const ph=document.querySelector('.photo'),fd=document.querySelector('.fade');const pt=t-40;ph.style.top=pt+'px';fd.style.top=pt+'px';});
  await p.screenshot({path:S+'/frames/dk-'+slot+'/'+f.n+'.png'});}
}
await b.close();})();
