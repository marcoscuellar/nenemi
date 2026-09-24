const {chromium}=require(process.env.PWP);const fs=require('fs');const {execFileSync}=require('child_process');
const R='/home/user/nenemi/', S=process.env.S, SH=S+'/store2/'+process.env.SLOT+'/';
const SL=[
 {h:'Get the noise out.<br>Get a day back<b>.</b>', sub:'Type it, say it, start in the middle. You don&rsquo;t have to organize your thoughts before putting them here. NENEMI helps you see what matters today and find a place to begin.', shot:'03-day'},
 {fs:40, h:'Never pretend<br>you remembered<b>.</b>', sub:'That project, the conversation you need to finish, the thing you meant to do next&mdash;give each its own Room. NENEMI keeps the context together, so you can leave when you need to and come back knowing where you were.', shot:'02-room'},
 {fs:40, h:'You had a plan.<br>Then the day<br>happened<b>.</b>', sub:'A plan can make sense at 9 AM and feel impossible by 1 PM. Tell NENEMI where you are right now. It helps you find one small way back in.', shot:'04-stuck', dark:true},
 {fs:40, h:'The day ends.<br>What mattered<br>stays<b>.</b>', sub:'Say what happened, messy is fine. NENEMI holds what matters, gives one leftover a home, and lets the rest go. Nothing carries over unless you choose it.', shot:'07-recap'},
 {fs:42, h:'Systems help.<br>People heal<b>.</b>', sub:'NENEMI can help you hold the day. Sometimes the next step is talking to someone who understands. Finding support should be as easy to reach as everything else here.', shot:'06-humans', photos:[['photos/reality-market.jpeg','45% 35%'],['photos/conversation-human.jpg','55% 30%']]},
 {fs:46, h:'It&rsquo;s okay.<br>Nenemi has it<b>.</b>', sub:'Whatever&rsquo;s taking up space, put it here. Start with one thought. You can figure out the rest together.', closer:true},
 {def:true},
];
const page=x=>`<!doctype html><html><head><link href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600&family=Archivo+Black&display=swap" rel="stylesheet"><style>
*{margin:0;box-sizing:border-box}html,body{width:414px;height:896px;overflow:hidden}
body{background:${x.dark||x.def?'#111312':'#F5F6F5'};position:relative;font-family:Archivo,sans-serif}
.copy{position:absolute;left:26px;right:26px;top:40px}
h1{font:${x.fs||36}px/1 'Archivo Black',sans-serif;letter-spacing:-.02em;color:${x.dark?'#F5F6F5':'#111312'}}h1 b{color:${x.dark?'#5AA6B0':'#3C8692'}}
.sub{margin-top:12px;font:500 14.5px/1.42 Archivo,sans-serif;color:${x.dark?'#B9BEBD':'#63696A'}}
.pad{position:absolute;left:48px;width:318px;padding:9px;background:#0b0b0b;border-radius:54px;z-index:3;
 box-shadow:0 50px 90px -16px rgba(17,19,18,${x.dark?'.85':'.5'}),0 22px 40px -8px rgba(17,19,18,.3),0 0 0 2px rgba(255,255,255,${x.dark?'.2':'.1'})}
.pad img{display:block;width:100%;border-radius:45px}
.card{position:absolute;border-radius:22px;background-size:cover;box-shadow:0 20px 44px rgba(17,19,18,.2);z-index:2}
.nm{position:absolute;left:26px;right:26px;bottom:30px;border-top:1px solid #D5D8D7;padding-top:14px}
.nm-l{font:600 10.5px Archivo,sans-serif;letter-spacing:.24em;color:#3C8692}.nm-w{margin-top:6px;font:22px 'Archivo Black',sans-serif;letter-spacing:.18em;color:#111312}.nm-w span{font:500 15px Archivo,sans-serif;letter-spacing:0;color:#63696A;margin-left:8px}
.nm-t{margin-top:6px;font:500 13px/1.42 Archivo,sans-serif;color:#63696A}
.def{position:absolute;left:30px;right:30px;top:50%;transform:translateY(-50%)}.d-l{font:600 11px Archivo,sans-serif;letter-spacing:.28em;color:#5AA6B0}.d-w{margin-top:16px;font:58px/1 'Archivo Black',sans-serif;letter-spacing:.06em;color:#F5F6F5}.d-p{margin-top:12px;font:500 20px Archivo,sans-serif;color:#B9BEBD}.d-p i{font-style:normal;color:#5AA6B0}.d-r{margin:28px 0;height:1px;background:#2A2D2D}.d-m{font:500 18px/1.45 Archivo,sans-serif;color:#E6E8E7}.d-m b{font-family:'Archivo Black',sans-serif;font-weight:400}.d-s{margin-top:18px;font:500 15px/1.45 Archivo,sans-serif;color:#9AA0A2}</style></head><body>
${x.def?`<div class="def"><div class="d-l">THE NAME</div><div class="d-w">NENEMI</div><div class="d-p">neh-<i>NEH</i>-mee</div><div class="d-r"></div><div class="d-m"><b>verb,</b> Nahuatl. To walk. To go about.</div><div class="d-s">From a living Indigenous language spoken by Nahua communities in Mexico. We chose it because your path doesn&rsquo;t have to be straight to keep moving.</div></div>`:`<div class="copy" id="cp"><h1>${x.h}</h1><p class="sub">${x.sub}</p></div>`}
${x.photos?x.photos.map((p,i)=>`<div class="card ph${i}" style="background-image:url('file://${R}${p[0]}');background-position:${p[1]};${i?'right:-20px':'left:-20px'};width:150px;height:230px"></div>`).join(''):''}
${x.def?'':x.closer?`<div class="card c1" style="left:18px;width:236px;height:420px;background-image:url('file://${R}photos/life-dogwalk.jpg');background-position:55% 30%"></div><div class="card c2" style="left:168px;width:230px;height:400px;background-image:url('file://${R}photos/life-dinner.webp');background-position:45% 55%;z-index:3"></div>
`:`<div class="pad" id="pd"${x.photos?' style="left:70px;width:274px;"':''}><img src="file://${SH}${x.shot}.png"></div>`}
</body></html>`;
(async()=>{const b=await chromium.launch();const W=+process.env.PW,H=+process.env.PH;const p=await b.newPage({viewport:{width:W,height:H},deviceScaleFactor:3});
 await p.route(/fonts\.(googleapis|gstatic)\.com/, r=>{const u=r.request().url(); try{const body=execFileSync('curl',['-s','-A','Mozilla/5.0 Chrome/140',u]); r.fulfill({status:200,body,contentType:u.includes('gstatic')?'font/woff2':'text/css',headers:{'access-control-allow-origin':'*'}});}catch(e){r.abort();}});
 const dir=S+'/frames/clean-'+process.env.SLOT;fs.rmSync(dir,{recursive:true,force:true});fs.mkdirSync(dir);
 for(let i=0;i<SL.length;i++){const f=S+'/frames/clean.html';fs.writeFileSync(f,page(SL[i]).replace('<body>','<body style="zoom:'+(W/414)+';height:'+(H*414/W)+'px">'));await p.goto('file://'+f);await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(400);
  await p.evaluate(()=>{const c=document.getElementById('cp');if(!c)return;const t=c.offsetTop+c.offsetHeight+26;const pd=document.getElementById('pd');if(pd)pd.style.top=t+'px';
   document.querySelectorAll('.ph0,.ph1').forEach((e,i)=>e.style.top=(t+(i?150:40))+'px');
   const c1=document.querySelector('.c1'),c2=document.querySelector('.c2');if(c1){c1.style.top=t+'px';c2.style.top=(t+210)+'px';}});
  await p.waitForTimeout(150);await p.screenshot({path:dir+'/0'+(i+1)+'.png'});}
await b.close();})();
