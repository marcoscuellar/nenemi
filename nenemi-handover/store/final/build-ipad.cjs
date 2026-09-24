const {chromium}=require(process.env.PWP);const fs=require('fs');const {execFileSync}=require('child_process');
const R='/home/user/nenemi/', S=process.env.S, SH=S+'/store2/ipad/';
const SL=[
 {h:'Get the noise out.<br>Get a day back<b>.</b>', sub:'Type it, say it, start in the middle. You don&rsquo;t have to organize your thoughts before putting them here. NENEMI helps you see what matters today and find a place to begin.', shot:'03-day'},
 {h:'Never pretend you remembered<b>.</b>', sub:'That project, the conversation you need to finish, the thing you meant to do next&mdash;give each its own Room. NENEMI keeps the context together, so you can leave when you need to and come back knowing where you were.', shot:'02-room'},
 {h:'You had a plan.<br>Then the day happened<b>.</b>', sub:'A plan can make sense at 9 AM and feel impossible by 1 PM. Tell NENEMI where you are right now. It helps you find one small way back in.', shot:'04-stuck', dark:true},
 {h:'The day ends.<br>What mattered stays<b>.</b>', sub:'Say what happened, messy is fine. NENEMI holds what matters, gives one leftover a home, and lets the rest go. Nothing carries over unless you choose it.', shot:'07-recap'},
 {h:'Systems help.<br>People heal<b>.</b>', sub:'NENEMI can help you hold the day. Sometimes the next step is talking to someone who understands. Finding support should be as easy to reach as everything else here.', shot:'06-humans', photos:[['photos/reality-market.jpeg','45% 35%'],['photos/conversation-human.jpg','55% 30%']]},
 {h:'It&rsquo;s okay.<br>Nenemi has it<b>.</b>', sub:'Whatever&rsquo;s taking up space, put it here. Start with one thought. You can figure out the rest together.', closer:true},
];
const page=x=>`<!doctype html><html><head><link href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600&family=Archivo+Black&display=swap" rel="stylesheet"><style>
*{margin:0;box-sizing:border-box}html,body{width:1032px;height:1376px;overflow:hidden}
body{background:${x.dark?'#111312':'#F5F6F5'};position:relative;font-family:Archivo,sans-serif}
.copy{position:absolute;left:72px;right:72px;top:72px}
h1{font:76px/1 'Archivo Black',sans-serif;letter-spacing:-.02em;color:${x.dark?'#F5F6F5':'#111312'}}h1 b{color:${x.dark?'#5AA6B0':'#3C8692'}}
.sub{margin-top:22px;max-width:820px;font:500 24px/1.42 Archivo,sans-serif;color:${x.dark?'#B9BEBD':'#63696A'}}
.pad{position:absolute;left:96px;width:840px;padding:16px;background:#0b0b0b;border-radius:48px;z-index:3;
 box-shadow:0 60px 110px -20px rgba(17,19,18,${x.dark?'.85':'.5'}),0 26px 50px -10px rgba(17,19,18,.3),0 0 0 2px rgba(255,255,255,${x.dark?'.2':'.1'})}
.pad img{display:block;width:100%;border-radius:32px}
.card{position:absolute;border-radius:32px;background-size:cover;box-shadow:0 20px 44px rgba(17,19,18,.2);z-index:2}
.nm{position:absolute;left:72px;right:72px;bottom:72px;border-top:1px solid #D5D8D7;padding-top:24px}
.nm-l{font:600 16px Archivo,sans-serif;letter-spacing:.24em;color:#3C8692}.nm-w{margin-top:10px;font:40px 'Archivo Black',sans-serif;letter-spacing:.18em;color:#111312}.nm-w span{font:500 26px Archivo,sans-serif;letter-spacing:0;color:#63696A;margin-left:14px}
.nm-t{margin-top:10px;font:500 22px/1.42 Archivo,sans-serif;color:#63696A;max-width:820px}
</style></head><body>
<div class="copy" id="cp"><h1>${x.h}</h1><p class="sub">${x.sub}</p></div>
${x.photos?x.photos.map((p,i)=>`<div class="card ph${i}" style="background-image:url('file://${R}${p[0]}');background-position:${p[1]};${i?'right:40px':'left:40px'};width:330px;height:460px"></div>`).join(''):''}
${x.closer?`<div class="card c1" style="left:72px;width:430px;height:600px;background-image:url('file://${R}photos/life-dogwalk.jpg');background-position:55% 30%"></div><div class="card c2" style="left:470px;width:490px;height:560px;background-image:url('file://${R}photos/life-dinner.webp');background-position:45% 55%;z-index:3"></div>
<div class="nm"><div class="nm-l">THE NAME</div><div class="nm-w">NENEMI <span>neh-NEH-mee</span></div><div class="nm-t">From Nahuatl, a living Indigenous language. It means &ldquo;to walk&rdquo; or &ldquo;to go about.&rdquo; Your path doesn&rsquo;t have to be straight to keep moving.</div></div>`:`<div class="pad" id="pd"${x.photos?' style="left:196px;width:640px"':''}><img src="file://${SH}${x.shot}.png"></div>`}
</body></html>`;
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1032,height:1376},deviceScaleFactor:2});
 await p.route(/fonts\.(googleapis|gstatic)\.com/, r=>{const u=r.request().url(); try{const body=execFileSync('curl',['-s','-A','Mozilla/5.0 Chrome/140',u]); r.fulfill({status:200,body,contentType:u.includes('gstatic')?'font/woff2':'text/css',headers:{'access-control-allow-origin':'*'}});}catch(e){r.abort();}});
 const dir=S+'/frames/ipad';fs.rmSync(dir,{recursive:true,force:true});fs.mkdirSync(dir);
 for(let i=0;i<SL.length;i++){const f=S+'/frames/ipad.html';fs.writeFileSync(f,page(SL[i]));await p.goto('file://'+f);await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(400);
  await p.evaluate(()=>{const c=document.getElementById('cp');const t=c.offsetTop+c.offsetHeight+48;const pd=document.getElementById('pd');if(pd)pd.style.top=t+'px';
   document.querySelectorAll('.ph0,.ph1').forEach((e,i)=>e.style.top=(t+(i?220:60))+'px');
   const c1=document.querySelector('.c1'),c2=document.querySelector('.c2');if(c1){c1.style.top=t+'px';c2.style.top=(t+140)+'px';}});
  await p.waitForTimeout(150);await p.screenshot({path:dir+'/0'+(i+1)+'.png'});}
await b.close();})();
