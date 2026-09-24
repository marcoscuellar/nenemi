const { chromium } = require(process.env.PWP); const { execFileSync } = require('child_process');
(async()=>{const b=await chromium.launch();
for (const [slot,vp] of [['6.7',{width:430,height:932}],['6.5',{width:414,height:896}]]) {
 const ctx=await b.newContext({viewport:vp, deviceScaleFactor:3, isMobile:true, hasTouch:true});
 const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.clock.install({ time: new Date(2026,8,24,10,20) });
 await p.route(/fonts\.(googleapis|gstatic)\.com/, r=>{const u=r.request().url(); try{const body=execFileSync('curl',['-s','-A','Mozilla/5.0 Chrome/140',u]); r.fulfill({status:200,body,contentType:u.includes('gstatic')?'font/woff2':'text/css',headers:{'access-control-allow-origin':'*'}});}catch(e){r.abort();}});
 await p.addInitScript(()=>{ try{localStorage.setItem('nenemi.seen','1')}catch(e){} });
 await p.goto('http://localhost:8765/',{waitUntil:'networkidle'}); await p.waitForTimeout(1200);
 await p.evaluate(()=>document.fonts.ready);
 const shot=async(name)=>{ await p.waitForTimeout(700); await p.screenshot({path:`${process.env.OUT}/${slot}/${name}.png`}); };
 await shot('01-home');
 await p.evaluate(()=>{ const h=x=>Date.now()-x*3600e3;
   const d=rooms.findIndex(r=>r.demo); if(d>=0) rooms.splice(d,1);
   rooms.push(
    {id:'r-mom', name:'Mom\'s 60th', one_liner:'Dinner at Rosa\'s on the 12th', brief:'Table for eight at Rosa\'s is booked for 7. Still need the gift. She keeps mentioning that blue scarf from the market.', loops:[{text:'Order the blue scarf',resolved:false},{text:'Ask Dani to split the cake',resolved:false}], log:[{source:'voice',ts:h(9),text:'She brought up the blue scarf again. That\'s the gift.'}], link:null},
    {id:'r-home', name:'Home', one_liner:'The lease, the leak, the landlord', brief:'Leak photos sent. No reply yet.', loops:[{text:'Follow up with the landlord',resolved:false}], log:[{source:'typed',ts:h(52),text:'Sent the photos of the ceiling.'}], link:null},
    {id:'r-tue', name:'Tuesday\'s version', one_liner:'The deck before the edits', brief:'Kept the Tuesday draft in case the new one goes sideways.', loops:[{text:'Compare slide 4 in both',resolved:false}], log:[{source:'voice',ts:h(76),text:'Tuesday had the better opener.'}], link:null},
    {id:'r-email', name:'Email I never sent', one_liner:'To Dana, about Friday', brief:'Draft is written. Hovering over send.', loops:[{text:'Read it once, then send',resolved:false}], log:[{source:'typed',ts:h(120),text:'Draft is in my notes.'}], link:null},
    {id:'r-app', name:'Car insurance', one_liner:'Comparing two quotes', brief:'Two quotes in. The cheaper one drops roadside help.', loops:[{text:'Call about roadside help',resolved:false}], log:[{source:'typed',ts:h(60),text:'Second quote came in lower.'}], link:null}
   );
   go('rooms'); openRoom('r-mom'); });
 await shot('02-room');
 await p.evaluate(()=>go('calendar')); await shot('03-day');
 await p.evaluate(()=>go('stuck')); await shot('04-stuck');
 await p.evaluate(()=>go('rooms')); await shot('05-rooms');
 await p.evaluate(()=>go('humans')); await shot('06-humans');
 console.log(slot, errs); await ctx.close();
}
await b.close();})();
