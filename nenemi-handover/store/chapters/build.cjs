const {chromium}=require(process.env.PWP);const fs=require('fs');const {execFileSync}=require('child_process');
const R='/home/user/nenemi/', S=process.env.S, SHOTS=S+'/store2/6.5/';
const MARK=fs.readFileSync(R+'photos/logo/nenemi-mark.svg','utf8');
const W=414,H=896;
const ph=n=>(n.includes('/')?n:'photos/originals/'+n);
// odd = product, even = life
const SL=[
 {t:'p', h:'Made for<br>your brain<b>.</b>', sub:'Not their expectations.', shot:'01-home'},
 {t:'l', hold:'You&rsquo;re not behind. You&rsquo;re paused.', cards:[
   ['kitchen-table.png',-30,100,270,350,0,'62% 40%'],['desk-stretch.png',196,84,210,250,3,'55% 30%'],
   ['photos/prove-workbench.jpg',168,350,262,320,-2,'78% 40%'],['photos/contact-team.jpg',18,520,236,290,2,'55% 30%']]},
 {t:'p', h:'Never pretend<br>you<br>remembered<b>.</b>', sub:'Pick up where you left off.', shot:'02-room'},
 {t:'l', hold:'It&rsquo;s still here.', cards:[
   ['desk-eyes-closed.png',18,86,250,320,-2,'74% 30%'],['jacket-messy-bed.jpg',208,260,220,300,3,'50% 30%'],
   ['fabric-wall-designer.png',-24,470,262,330,0,'64% 30%']], mini:{shot:'05-rooms',x:236,y:560,w:150,r:7}},
 {t:'p', h:'Get a day<br>back<b>.</b>', sub:'', shot:'03-day'},
 {t:'l', hold:'A half-full day you can follow.', cards:[
   ['photos/reality-market.jpeg',-12,86,300,380,-1,'55% 40%'],['garden-phone.png',238,300,196,260,4,'68% 30%'],
   ['hallway-tote.png',36,490,240,320,-3,'50% 30%']]},
 {t:'p', h:'Four ways<br>back in<b>.</b>', sub:'', shot:'04-stuck'},
 {t:'l', split:true, hold:'You don&rsquo;t need a new plan.', holdDark:true, cards:[
   ['floor-mms.png',22,90,240,330,-2,'70% 40%'],['photos/wall.jpg',200,210,220,260,3,'62% 30%'],
   ['man-late.png',-18,470,232,300,2,'50% 35%'],['desk-phone.png',212,500,190,262,-3,'55% 30%']]},
 {t:'p', h:'People heal<br>people<b>.</b>', sub:'', shot:'06-humans'},
 {t:'l', hold:'Real people, one tap away.', cards:[
   ['photos/conversation-human.jpg',20,86,374,420,0,'55% 30%'],['living-room-two.png',-30,530,250,290,-3,'78% 40%'],
   ['couch-laundry.png',196,480,232,330,3,'25% 35%']]},
];
const card=(o,[src,x,y,w,h,r,pos])=>`<div class="card" style="left:${o+x}px;top:${y}px;width:${w}px;height:${h}px;transform:rotate(${r}deg);background-image:url('file://${R}${ph(src)}');background-position:${pos}"></div>`;
const wave=()=>{let d='';for(let x=-20;x<=W*10+20;x+=10){const y=650+60*Math.sin(x/W*Math.PI*0.9)+22*Math.sin(x/W*Math.PI*0.31);d+=(d?'L':'M')+x+' '+y.toFixed(1)+' ';}return `<svg class="wave" width="${W*10}" height="${H}"><path d="${d}" fill="none" stroke="#3C8692" stroke-width="3.6" stroke-linecap="round"/></svg>`;};
function page(){let out='';SL.forEach((s,i)=>{const o=i*W;
 if(s.t==='p'){
  if(s.dark) out+=`<div class="bg dark" style="left:${o}px;width:${W}px"></div>`;
  out+=`<div class="eb${s.dark?' dk':''}" style="left:${o+26}px">${MARK}NENEMI</div>`;
  out+=`<div class="copy${s.dark?' dk':''}" id="c${i}" style="left:${o+26}px"><h1>${s.h}</h1>${s.sub?`<p class="sub">${s.sub}</p>`:''}</div>`;
  out+=`<div class="phone pp" data-i="${i}" data-o="${o}"><img src="file://${SHOTS}${s.shot}.png"></div>`;
 } else {
  if(s.split) out+=`<div class="bg dark" style="left:${o}px;width:${Math.round(W*0.56)}px"></div>`;
  s.cards.forEach(c=>out+=card(o,c));
  if(s.mini) out+=`<div class="phone mini" style="left:${o+s.mini.x}px;top:${s.mini.y}px;width:${s.mini.w}px;transform:rotate(${s.mini.r}deg)"><img src="file://${SHOTS}${s.mini.shot}.png"></div>`;
  out+=`<div class="hold${s.holdDark?' dk':''}" style="left:${o+26}px">${s.hold}</div>`;
 }});
return `<!doctype html><html><head><link href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600&family=Archivo+Black&display=swap" rel="stylesheet"><style>
*{margin:0;box-sizing:border-box}body{width:${W*10}px;height:${H}px;background:#F5F6F5;position:relative;overflow:hidden;font-family:Archivo,sans-serif}
.bg{position:absolute;top:0;bottom:0;z-index:0}.dark{background:#111312}
.eb{position:absolute;top:36px;display:flex;align-items:center;gap:9px;font:14px 'Archivo Black',sans-serif;letter-spacing:.3em;color:#111312;z-index:5}.eb svg{width:23px;height:auto}.eb path{fill:#111312}
.eb.dk{color:#F5F6F5}.eb.dk path{fill:#F5F6F5}
.copy{position:absolute;top:80px;width:362px;z-index:5}h1{font:44px/1 'Archivo Black',sans-serif;letter-spacing:-.02em;color:#111312}h1 b{color:#3C8692}
.sub{margin-top:12px;font:500 17px/1.35 Archivo,sans-serif;color:#63696A}
.dk h1{color:#F5F6F5}.dk h1 b{color:#5AA6B0}
.card{position:absolute;z-index:1;border-radius:22px;background-size:cover;box-shadow:0 14px 34px rgba(17,19,18,.18)}
.wave{position:absolute;left:0;top:0;z-index:2}
.phone{position:absolute;z-index:3;padding:8px;background:#0b0b0b;border-radius:46px;box-shadow:0 48px 80px -14px rgba(17,19,18,.5),0 22px 40px -6px rgba(17,19,18,.28),0 6px 12px rgba(17,19,18,.16),0 0 0 1.5px rgba(255,255,255,.1)}
.phone img{display:block;width:100%;border-radius:38px}
.mini{padding:5px;border-radius:26px;box-shadow:0 26px 44px -8px rgba(17,19,18,.5),0 10px 18px rgba(17,19,18,.25)}.mini img{border-radius:21px}
.hold{position:absolute;top:42px;z-index:5;font:600 16px Archivo,sans-serif;color:#111312;background:#F5F6F5;padding:6px 12px;border-radius:100px;margin-left:-12px}
.hold.dk{color:#F5F6F5;background:#111312}
</style></head><body>${out}${wave()}</body></html>`;}
(async()=>{const b=await chromium.launch();
for(const [slot,pw,phh] of [['6.5',414,896],['6.7',430,932]]){
 const sc=pw/414;
 const p=await b.newPage({viewport:{width:pw*10,height:phh},deviceScaleFactor:3});
 await p.route(/fonts\.(googleapis|gstatic)\.com/, r=>{const u=r.request().url(); try{const body=execFileSync('curl',['-s','-A','Mozilla/5.0 Chrome/140',u]); r.fulfill({status:200,body,contentType:u.includes('gstatic')?'font/woff2':'text/css',headers:{'access-control-allow-origin':'*'}});}catch(e){r.abort();}});
 const f=S+'/frames/ten.html';fs.writeFileSync(f,page().replace('<body>','<body style="zoom:'+sc+'">'));
 await p.goto('file://'+f);await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(700);
 await p.evaluate(({W,H})=>{document.querySelectorAll('.pp').forEach(el=>{const i=el.dataset.i,o=+el.dataset.o;const c=document.getElementById('c'+i);
   const top=c.offsetTop+c.offsetHeight+26; const avail=H-top-24; const imgH=Math.min(avail-16,640); const w=imgH/2.1643;
   el.style.top=top+'px'; el.style.width=(w+16)+'px'; el.style.left=(o+(W-(w+16))/2)+'px';});},{W,H});
 await p.waitForTimeout(300);
 const dir=S+'/frames/ten-'+slot;fs.rmSync(dir,{recursive:true,force:true});fs.mkdirSync(dir);
 for(let k=0;k<10;k++) await p.screenshot({path:dir+'/'+String(k+1).padStart(2,'0')+'.png',clip:{x:k*pw,y:0,width:pw,height:phh}});
}
await b.close();})();
