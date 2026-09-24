const {chromium}=require(process.env.PWP);const fs=require('fs');const {execFileSync}=require('child_process');
const R='/home/user/nenemi/', S=process.env.S;
const MARK=fs.readFileSync(R+'photos/logo/nenemi-mark.svg','utf8');
const HS=[
 {n:'01', fs:36, h:'Get the noise out.<br>Get a day back<b>.</b>', sub:'Type it, say it, start in the middle. You don&rsquo;t have to organize your thoughts before putting them here. NENEMI helps you see what matters today and find a place to begin.', main:'03-day', back:'01-home'},
 {n:'02', fs:42, h:'Never pretend<br>you remembered<b>.</b>', sub:'That project, the conversation you need to finish, the thing you meant to do next&mdash;give each its own Room. NENEMI keeps the context together, so you can leave when you need to and come back knowing where you were.', main:'02-room', back:'05-rooms'},
 {n:'03', fs:42, dark:true, h:'You had a plan.<br>Then the day<br>happened<b>.</b>', sub:'A plan can make sense at 9 AM and feel impossible by 1 PM. Tell NENEMI where you are right now. It helps you find one small way back in.', main:'04-stuck', back:null},
 {n:'04', fs:42, h:'The day ends.<br>What mattered<br>stays<b>.</b>', sub:'Say what happened, messy is fine. NENEMI holds what matters, gives one leftover a home, and lets the rest go. Nothing carries over unless you choose it.', main:'07-recap', back:'03-day'},
];
const page=(x,slot)=>`<!doctype html><html><head><link href="https://fonts.googleapis.com/css2?family=Archivo:wght@500&family=Archivo+Black&display=swap" rel="stylesheet"><style>
*{margin:0;box-sizing:border-box}html,body{width:414px;height:896px;overflow:hidden}
body{background:${x.dark?'#111312':'#F5F6F5'};position:relative;font-family:Archivo,sans-serif}
.eb{position:absolute;left:26px;top:36px;display:flex;align-items:center;gap:9px;font:14px 'Archivo Black',sans-serif;letter-spacing:.3em;color:${x.dark?'#F5F6F5':'#111312'};z-index:5}.eb svg{width:23px;height:auto}.eb path{fill:${x.dark?'#F5F6F5':'#111312'}}
.copy{position:absolute;left:26px;top:74px;width:362px;z-index:5}
h1{font:${x.fs}px/1 'Archivo Black',sans-serif;letter-spacing:-.02em;color:${x.dark?'#F5F6F5':'#111312'}}h1 b{color:${x.dark?'#5AA6B0':'#3C8692'}}
.sub{margin-top:12px;font:500 14.5px/1.42 Archivo,sans-serif;color:${x.dark?'#B9BEBD':'#63696A'}}
.phone{position:absolute;padding:9px;background:#0b0b0b;border-radius:54px;box-shadow:0 50px 90px -16px rgba(17,19,18,${x.dark?'.8':'.5'}),0 22px 40px -8px rgba(17,19,18,.3),0 0 0 1.5px rgba(255,255,255,${x.dark?'.22':'.1'})}
.phone img{display:block;width:100%;border-radius:45px}
.main{width:318px;left:78px;z-index:3}
.back{width:236px;left:-34px;z-index:2;transform:rotate(-7deg);opacity:.98}
</style></head><body>
<div class="eb">${MARK}NENEMI</div>
<div class="copy" id="cp"><h1>${x.h}</h1><p class="sub">${x.sub}</p></div>
${x.back?`<div class="phone back"><img src="file://${S}/store2/${slot}/${x.back}.png"></div>`:''}
<div class="phone main" style="${x.back?'':'left:48px;'}"><img src="file://${S}/store2/${slot}/${x.main}.png"></div>
</body></html>`;
(async()=>{const b=await chromium.launch();
for(const [slot,w,h] of [['6.5',414,896],['6.7',430,932]]){
 const p=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:3});
 await p.route(/fonts\.(googleapis|gstatic)\.com/, r=>{const u=r.request().url(); try{const body=execFileSync('curl',['-s','-A','Mozilla/5.0 Chrome/140',u]); r.fulfill({status:200,body,contentType:u.includes('gstatic')?'font/woff2':'text/css',headers:{'access-control-allow-origin':'*'}});}catch(e){r.abort();}});
 const dir=S+'/frames/hero3-'+slot;fs.rmSync(dir,{recursive:true,force:true});fs.mkdirSync(dir);
 for(const x of HS){const f=S+'/frames/hero3.html';fs.writeFileSync(f,page(x,slot).replace('<body>','<body style="zoom:'+(w/414)+';height:'+h+'px">'));
  await p.goto('file://'+f);await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(500);
  await p.evaluate(()=>{const c=document.getElementById('cp');const t=c.offsetTop+c.offsetHeight+28;document.querySelector('.main').style.top=t+'px';const bk=document.querySelector('.back');if(bk)bk.style.top=(t+70)+'px';});
  await p.waitForTimeout(150);await p.screenshot({path:dir+'/'+x.n+'.png'});}
}
await b.close();})();
