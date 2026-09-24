const {chromium}=require('/opt/node22/lib/node_modules/playwright');const fs=require('fs');const {execFileSync}=require('child_process');
const R='/home/user/nenemi/', S='/tmp/claude-0/-home-user-nenemi/c367e670-81af-5a70-98ea-1016a98294b4/scratchpad';
const MARK=fs.readFileSync(R+'photos/logo/nenemi-mark.svg','utf8');
const P=[
 {shot:'01-home', h:'Made for<br>your brain<b>.</b>', sub:'Not their expectations.', a:'photos/originals/kitchen-table.png', ap:'62% 40%', b1:'photos/originals/jacket-messy-bed.jpg', b1p:'50% 30%', b2:'photos/prove-workbench.jpg', b2p:'75% 40%'},
 {shot:'02-room', fs:38, h:'Never pretend<br>you remembered<b>.</b>', sub:'Pick up where you left off.', a:'photos/originals/fabric-wall-designer.png', ap:'64% 30%', b1:'photos/originals/desk-stretch.png', b1p:'52% 30%', b2:'photos/contact-team.jpg', b2p:'55% 30%'},
 {shot:'03-day', h:'Get a day<br>back<b>.</b>', sub:'A half-full day you can follow.', a:'photos/originals/hallway-tote.png', ap:'52% 30%', b1:'photos/reality-market.jpeg', b1p:'55% 40%', b2:'photos/originals/garden-phone.png', b2p:'70% 30%'},
 {shot:'04-stuck', dark:true, h:'Four ways<br>back in<b>.</b>', sub:'You don&rsquo;t need a new plan.', a:'photos/originals/floor-mms.png', ap:'72% 40%', b1:'photos/originals/desk-eyes-closed.png', b1p:'72% 30%', b2:'photos/originals/man-late.png', b2p:'50% 35%'},
 {shot:'05-rooms', h:'People heal<br>people<b>.</b>', sub:'Real people, one tap away.', a:'photos/originals/living-room-two.png', ap:'78% 40%', b1:'photos/conversation-human.jpg', b1p:'55% 30%', b2:'photos/originals/couch-laundry.png', b2p:'25% 35%'},

];
const W=414,H=896;
const card=(x,y,w,h,src,pos)=>`<div class="card" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;background-image:url('file://${R}${src}');background-position:${pos}"></div>`;
const wave=()=>{let d='';for(let x=-20;x<=W*10+20;x+=12){const y=610+46*Math.sin(x/W*Math.PI*1.1)+18*Math.sin(x/W*Math.PI*0.37);d+=(d?'L':'M')+x+' '+y.toFixed(1)+' ';}return `<svg class="wave" width="${W*10}" height="${H}" viewBox="0 0 ${W*10} ${H}"><path d="${d}" fill="none" stroke="#3C8692" stroke-width="3.2" stroke-linecap="round"/></svg>`;};
const page=slot=>{let out='';P.forEach((p,i)=>{const o=i*2*W;
 if(p.dark) out+=`<div class="night" style="left:${o}px;width:${2*W}px"></div>`;
 out+=`<div class="eb${p.dark?' dk':''}" style="left:${o+24}px">${MARK}NENEMI</div>`;
 out+=`<div class="copy${p.dark?' dk':''}" style="left:${o+24}px"><h1 style="font-size:${p.fs||45}px">${p.h}</h1><p class="sub">${p.sub}</p></div>`;
 out+=card(o+18,330,250,470,p.a,p.ap);
 out+=card(o+W+150,48,246,360,p.b1,p.b1p);
 out+=card(o+W+150,428,246,420,p.b2,p.b2p);
 out+=`<div class="phone" style="left:${o+W-131}px"><img src="file://${S}/store2/${slot}/${p.shot}.png"></div>`;
});
return `<!doctype html><html><head><link href="https://fonts.googleapis.com/css2?family=Archivo:wght@500&family=Archivo+Black&display=swap" rel="stylesheet"><style>
*{margin:0;box-sizing:border-box}body{width:${W*10}px;height:${H}px;background:#F5F6F5;position:relative;overflow:hidden;font-family:Archivo,sans-serif}
.eb{position:absolute;top:36px;display:flex;align-items:center;gap:9px;font:14px 'Archivo Black',sans-serif;letter-spacing:.3em;color:#111312}.eb svg{width:23px;height:auto}.eb path{fill:#111312}
.copy{position:absolute;top:72px;width:370px}h1{font-family:'Archivo Black',sans-serif;font-weight:400;line-height:1;letter-spacing:-.02em;color:#111312}h1 b{color:#3C8692}
.sub{margin-top:10px;font:500 15.5px/1.35 Archivo,sans-serif;color:#63696A}
.night{position:absolute;top:0;bottom:0;background:#111312;z-index:0}.eb.dk{color:#F5F6F5}.eb.dk path{fill:#F5F6F5}.dk h1{color:#F5F6F5}.dk h1 b{color:#5AA6B0}.dk .sub{color:#B9BEBD}
.wave{position:absolute;left:0;top:0;z-index:2;pointer-events:none}
.card{position:absolute;z-index:1;border-radius:26px;background-size:cover;box-shadow:0 14px 34px rgba(17,19,18,.16)}
.phone{position:absolute;top:268px;width:262px;padding:7px;background:#0b0b0b;border-radius:44px;box-shadow:0 22px 50px rgba(0,0,0,.35),0 0 0 2px rgba(255,255,255,.08);z-index:3}
.phone img{display:block;width:100%;border-radius:37px}
</style></head><body>${out}</body></html>`;};
(async()=>{const b=await chromium.launch();
for(const [slot,sc] of [['6.5',1],['6.7',430/414]]){
 const p=await b.newPage({viewport:{width:Math.round(W*10*sc),height:slot==='6.5'?896:932},deviceScaleFactor:3});
 await p.route(/fonts\.(googleapis|gstatic)\.com/, r=>{const u=r.request().url(); try{const body=execFileSync('curl',['-s','-A','Mozilla/5.0 Chrome/140',u]); r.fulfill({status:200,body,contentType:u.includes('gstatic')?'font/woff2':'text/css',headers:{'access-control-allow-origin':'*'}});}catch(e){r.abort();}});
 const file=S+'/frames/pano.html';fs.writeFileSync(file,page(slot).replace('<body>','<body style="zoom:'+sc+'">'));
 await p.goto('file://'+file);await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(800);
 const dir=S+'/frames/final-'+slot;fs.rmSync(dir,{recursive:true,force:true});fs.mkdirSync(dir);
 const pw=slot==='6.5'?414:430, ph=slot==='6.5'?896:932;
 for(let k=0;k<10;k++) await p.screenshot({path:dir+'/'+String(k+1).padStart(2,'0')+'.png',clip:{x:k*pw,y:0,width:pw,height:ph}});
 if(slot==='6.5'){await p.setViewportSize({width:W*10,height:H});}
}
await b.close();})();
