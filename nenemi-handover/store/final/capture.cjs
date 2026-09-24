const { chromium } = require(process.env.PWP); const { execFileSync } = require('child_process');
(async()=>{const b=await chromium.launch();
for (const [slot,vp] of [['6.7',{width:430,height:932}],['6.5',{width:414,height:896}]]) {
 const ctx=await b.newContext({viewport:vp, deviceScaleFactor:3, isMobile:true, hasTouch:true});
 const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.clock.install({ time: new Date(2026,8,24,20,40) });
 await p.route(/fonts\.(googleapis|gstatic)\.com/, r=>{const u=r.request().url(); try{const body=execFileSync('curl',['-s','-A','Mozilla/5.0 Chrome/140',u]); r.fulfill({status:200,body,contentType:u.includes('gstatic')?'font/woff2':'text/css',headers:{'access-control-allow-origin':'*'}});}catch(e){r.abort();}});
 await p.addInitScript(()=>{ try{localStorage.setItem('nenemi.seen','1')}catch(e){} });
 await p.goto('http://localhost:8765/',{waitUntil:'networkidle'}); await p.waitForTimeout(1200);
 await p.evaluate(()=>document.fonts.ready);
 const shot=async(name)=>{ await p.waitForTimeout(700); await p.screenshot({path:`${process.env.OUT}/${slot}/${name}.png`}); };
 await shot('01-home');
 await p.evaluate(()=>{ const h=x=>Date.now()-x*3600e3;
   const d=rooms.findIndex(r=>r.demo); if(d>=0) rooms.splice(d,1);
   rooms.push(
    {id:'r-mom', name:'Mom\'s birthday', one_liner:'Dinner on the 12th', brief:'Table booked. Gift not yet.', loops:[{text:'Pick the gift',resolved:false}], log:[{source:'typed',ts:h(30),text:'She mentioned the blue scarf.'}], link:null},
    {id:'r-home', name:'Home', one_liner:'The lease, the leak, the landlord', brief:'Leak photos sent. No reply yet.', loops:[{text:'Follow up with the landlord',resolved:false}], log:[{source:'typed',ts:h(52),text:'Sent the photos of the ceiling.'}], link:null},
    {id:'r-tue', name:'Tuesday\'s version', one_liner:'The deck before the edits', brief:'Kept the Tuesday draft in case the new one goes sideways.', loops:[{text:'Compare slide 4 in both',resolved:false}], log:[{source:'voice',ts:h(76),text:'Tuesday had the better opener.'}], link:null},
    {id:'r-email', name:'Email I never sent', one_liner:'To Dana, about Friday', brief:'Draft is written. Hovering over send.', loops:[{text:'Read it once, then send',resolved:false}], log:[{source:'typed',ts:h(120),text:'Draft is in my notes.'}], link:null},
    {id:'r-app', name:'The app I already built', one_liner:'Nenemi, third pass', brief:'Third pass of the onboarding. It already has a name. The Xcode project already exists.', loops:[{text:'Open the existing repo before making another',resolved:false},{text:'Ship the sign-up screens',resolved:false}], log:[{source:'voice',ts:h(9),text:'Onboarding copy feels right now. Screens next.'}], link:null}
   );
   go('rooms'); openRoom('r-app'); });
 await shot('02-room');
 await p.evaluate(()=>go('calendar')); await shot('03-day');
 await p.evaluate(()=>go('stuck')); await shot('04-stuck');
 await p.evaluate(()=>go('rooms')); await shot('05-rooms');
 await p.evaluate(()=>go('humans')); await shot('06-humans');
 await p.evaluate(()=>{ const k=d=>{const x=new Date(today);x.setDate(x.getDate()+d);return dkey(x);};
   notes[k(-1)]='Got the lease sorted. Skipped the gym, that is fine.';
   notes[k(-2)]='Rough morning. Afternoon came back around.';
   notes[k(0)]='Team call went better than I thought.\nOnboarding copy finally feels right.\nDidn\'t get to the follow-ups. That\'s okay.';
   dayList(today).forEach(e=>{ if(!/follow/i.test(e.name)) e.done=true; });
   go('notes'); renderNotes(); });
 await shot('07-recap');
 console.log(slot, errs); await ctx.close();
}
await b.close();})();
