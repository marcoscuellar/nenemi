const {chromium}=require(process.env.PWP);const fs=require('fs');const {execFileSync}=require('child_process');
const R='/home/user/nenemi/', S=process.env.S;
const MARK=fs.readFileSync(R+'photos/logo/nenemi-mark.svg','utf8');
const A={fs:36,h:'Get the noise out.<br>Get a day back<b>.</b>',sub:'Type it, say it, start in the middle. You don&rsquo;t have to organize your thoughts before putting them here. NENEMI helps you see what matters today and find a place to begin.'};
const B={fs:42,h:'Never pretend<br>you remembered<b>.</b>',sub:'That project, the conversation you need to finish, the thing you meant to do next&mdash;give each its own Room. NENEMI keeps the context together, so you can leave when you need to and come back knowing where you were.'};
const wave=()=>{let d='';for(let x=-20;x<=848;x+=8){const y=560+70*Math.sin((x-40)/828*Math.PI*1.6);d+=(d?'L':'M')+x+' '+y.toFixed(1)+' ';}return `<svg class="wave" width="828" height="896"><path d="${d}" fill="none" stroke="#3C8692" stroke-width="3.6" stroke-linecap="round"/></svg>`;};
const page=slot=>`<!doctype html><html><head><link href="https://fonts.googleapis.com/css2?family=Archivo:wght@500&family=Archivo+Black&display=swap" rel="stylesheet"><style>
*{margin:0;box-sizing:border-box}body{width:828px;height:896px;overflow:hidden;background:#F5F6F5;position:relative;font-family:Archivo,sans-serif}
.eb{position:absolute;top:36px;display:flex;align-items:center;gap:9px;font:14px 'Archivo Black',sans-serif;letter-spacing:.3em;color:#111312;z-index:5}.eb svg{width:23px;height:auto}.eb path{fill:#111312}
.copy{position:absolute;top:74px;width:362px;z-index:5}h1{font-family:'Archivo Black',sans-serif;line-height:1;letter-spacing:-.02em;color:#111312}h1 b{color:#3C8692}
.sub{margin-top:12px;font:500 14.5px/1.42 Archivo,sans-serif;color:#63696A}
.wave{position:absolute;left:0;top:0;z-index:1}
.phone{position:absolute;padding:9px;background:#0b0b0b;border-radius:54px;box-shadow:0 50px 90px -16px rgba(17,19,18,.5),0 22px 40px -8px rgba(17,19,18,.3),0 0 0 1.5px rgba(255,255,255,.1)}
.phone img{display:block;width:100%;border-radius:45px}
.main{width:318px;z-index:3}.back{width:236px;z-index:2;transform:rotate(-6deg)}
</style></head><body>${wave()}
<div class="eb" style="left:26px">${MARK}NENEMI</div><div class="copy" id="ca" style="left:26px"><h1 style="font-size:${A.fs}px">${A.h}</h1><p class="sub">${A.sub}</p></div>
<div class="eb" style="left:440px">${MARK}NENEMI</div><div class="copy" id="cb" style="left:440px"><h1 style="font-size:${B.fs}px">${B.h}</h1><p class="sub">${B.sub}</p></div>
<div class="phone back" id="bk" style="left:${414-118}px"><img src="file://${S}/store2/${slot}/05-rooms.png"></div>
<div class="phone main" id="ma" style="left:48px"><img src="file://${S}/store2/${slot}/03-day.png"></div>
<div class="phone main" id="mb" style="left:${414+78}px"><img src="file://${S}/store2/${slot}/02-room.png"></div>
</body></html>`;
(async()=>{const b=await chromium.launch();
for(const [slot,w,h] of [['6.5',414,896],['6.7',430,932]]){
 const sc=w/414;const p=await b.newPage({viewport:{width:w*2,height:h},deviceScaleFactor:3});
 await p.route(/fonts\.(googleapis|gstatic)\.com/, r=>{const u=r.request().url(); try{const body=execFileSync('curl',['-s','-A','Mozilla/5.0 Chrome/140',u]); r.fulfill({status:200,body,contentType:u.includes('gstatic')?'font/woff2':'text/css',headers:{'access-control-allow-origin':'*'}});}catch(e){r.abort();}});
 const f=S+'/frames/pair12.html';fs.writeFileSync(f,page(slot).replace('<body>','<body style="zoom:'+sc+';height:'+(h/sc)+'px">'));
 await p.goto('file://'+f);await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(600);
 await p.evaluate(()=>{const ta=document.getElementById('ca'),tb=document.getElementById('cb');const a=ta.offsetTop+ta.offsetHeight+28,b=tb.offsetTop+tb.offsetHeight+28;
  document.getElementById('ma').style.top=a+'px';document.getElementById('mb').style.top=b+'px';document.getElementById('bk').style.top=(Math.min(a,b)+90)+'px';});
 await p.waitForTimeout(200);
 const dir=S+'/frames/p12-'+slot;fs.rmSync(dir,{recursive:true,force:true});fs.mkdirSync(dir);
 for(let k=0;k<2;k++) await p.screenshot({path:dir+'/0'+(k+1)+'.png',clip:{x:k*w,y:0,width:w,height:h}});
}
await b.close();})();
