// App Store slides v3 (Sep 2026, Marcos's call): five slides, one short headline each, no paragraphs,
// two angled phones per slide (the back one tells what happened, the front one where it landed), soft drop shadows,
// pure white backgrounds (the Stuck slide stays dark). Story order: outcome, workflow, differentiator, objection, proof.
//   PWP=$(npm root -g)/playwright S=/scratch SLOT=6.7 PW=1290 PH=2796 node build-iphone.cjs   (capture-v4.cjs first)
//   -> $S/frames/clean-$SLOT/0N.png at 3x; scale to the slot size before upload
const {chromium}=require(process.env.PWP);const fs=require('fs');const {execFileSync}=require('child_process');
const S=process.env.S, SH=S+'/store2/'+process.env.SLOT+'/';
const SL=[
 {h:'Get the noise<br>out<b>.</b>', back:'01-home', front:'03-day'},
 {h:'Pick up where<br>you left off<b>.</b>', back:'05-rooms', front:'02-room'},
 {h:'Frozen?<br>One small step<b>.</b>', back:'04-stuck', front:'04b-stuck-start', dark:true},
 {h:'No streaks.<br>No guilt<b>.</b>', back:'07-recap', front:'09-focus'},
 {h:'Real people,<br>one tap away<b>.</b>', back:'10-second-home', front:'06-humans'},
];
const page=x=>`<!doctype html><html><head><link href="https://fonts.googleapis.com/css2?family=Archivo+Black&display=swap" rel="stylesheet"><style>
*{margin:0;box-sizing:border-box}html,body{width:414px;height:896px;overflow:hidden}
body{background:${x.dark?'#111312':'#FFFFFF'};position:relative}
h1{position:absolute;left:28px;right:24px;top:52px;font:46px/1.02 'Archivo Black',sans-serif;letter-spacing:-.025em;color:${x.dark?'#FFFFFF':'#111312'}}
h1 b{color:${x.dark?'#5AA6B0':'#3C8692'}}
.stage{position:absolute;left:0;right:0;top:214px;bottom:-60px}
.pad{position:absolute;width:214px;padding:6px;background:#0b0b0b;border-radius:36px;box-shadow:inset 0 0 0 1.5px rgba(255,255,255,${x.dark?'.22':'.14'});
 filter:drop-shadow(0 28px 26px rgba(17,19,18,${x.dark?'.7':'.34'})) drop-shadow(0 6px 8px rgba(17,19,18,.22))}
.pad img{display:block;width:100%;border-radius:30px}
.back{left:22px;top:0;transform:rotate(-6deg);z-index:1}
.front{left:180px;top:150px;transform:rotate(6deg);z-index:2;filter:drop-shadow(-14px 30px 30px rgba(17,19,18,${x.dark?'.75':'.42'})) drop-shadow(0 6px 8px rgba(17,19,18,.25))}
</style></head><body><h1>${x.h}</h1>
<div class="stage"><div class="pad back"><img src="file://${SH}${x.back}.png"></div><div class="pad front"><img src="file://${SH}${x.front}.png"></div></div>
</body></html>`;
(async()=>{const b=await chromium.launch();const W=+process.env.PW,H=+process.env.PH;const p=await b.newPage({viewport:{width:W,height:H},deviceScaleFactor:3});
 await p.route(/fonts\.(googleapis|gstatic)\.com/, r=>{const u=r.request().url(); try{const body=execFileSync('curl',['-s','-A','Mozilla/5.0 Chrome/140',u]); r.fulfill({status:200,body,contentType:u.includes('gstatic')?'font/woff2':'text/css',headers:{'access-control-allow-origin':'*'}});}catch(e){r.abort();}});
 const dir=S+'/frames/clean-'+process.env.SLOT;fs.rmSync(dir,{recursive:true,force:true});fs.mkdirSync(dir,{recursive:true});
 for(let i=0;i<SL.length;i++){const f=S+'/frames/clean.html';fs.writeFileSync(f,page(SL[i]).replace('<body>','<body style="zoom:'+(W/414)+';height:'+(H*414/W)+'px">'));await p.goto('file://'+f);await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(500);
  await p.screenshot({path:dir+'/0'+(i+1)+'.png'});}
await b.close();})();
