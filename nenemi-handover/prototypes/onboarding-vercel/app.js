const app = document.querySelector('#app');

const state = {
  stage: 'signup',
  email: '', password: '', code: '', firstName: '', lastName: '',
  capture: '', need: '', destination: ''
};

const accountStages = ['signup','confirm','name','plan','welcome'];
const productStages = ['capture','need','destination','ready'];

const copy = {
  signup: ['Your context, kept', 'Right where<br>you left off.', 'NENEMI holds the thread, plans your day with room to move, and helps when you’re stuck.'],
  confirm: ['One quick check', 'Check your<br><span class="accent">email.</span>', 'A six-digit code, just to be sure it’s you. Then you’re in.'],
  name: ['Just so it feels like yours', 'First, <span class="accent">your</span> name.', 'A name on the space. That’s all we need to get you in.'],
  plan: ['Yours, and only yours', 'This is all <span class="accent">yours.</span>', 'A quiet space only you can open. Free to keep, for as long as you like.'],
  welcome: ['A quick look inside', 'Welcome to your<br><span class="accent">place.</span>', 'A few simple places for what’s on your mind. Then the space is yours.'],
  capture: ['Your first real move', 'Give NENEMI<br>the <span class="accent">mess.</span>', 'Nothing to organize first. Start in the middle.'],
  need: ['One useful question', 'What would help<br><span class="accent">right now?</span>', 'NENEMI adapts the next move to the moment you’re actually in.'],
  destination: ['A place to return', 'Put it where<br>it <span class="accent">belongs.</span>', 'Your thought stays findable without asking you to remember the whole context.'],
  ready: ['The handoff', 'It’s okay.<br><span class="accent">NENEMI has it.</span>', 'You don’t need to hold everything at once.']
};

function save(){ localStorage.setItem('nenemi-demo', JSON.stringify(state)); }
function setStage(stage){ state.stage=stage; save(); render(); window.scrollTo(0,0); }
function progress(){
  const list = accountStages.includes(state.stage) ? accountStages.filter(x=>x!=='confirm') : productStages;
  const current = state.stage==='confirm' ? 0 : Math.max(0,list.indexOf(state.stage));
  return `<div class="progress">${[0,1,2,3].map(i=>`<i class="${i===current?'active':''}"></i>`).join('')}</div>`;
}
function chip(){
  if(state.stage==='confirm') return 'ACCOUNT CHECK — CONFIRM EMAIL';
  const account=accountStages.includes(state.stage); const list=account ? accountStages.filter(x=>x!=='confirm') : productStages;
  const n=Math.max(0,list.indexOf(state.stage))+1;
  return `${account?'STEP':'LOOK'} ${n} OF ${list.length} — ${state.stage.replaceAll('-',' ')}`;
}
function layout(content){ const c=copy[state.stage]; return `<section class="shell"><aside class="brand"><div class="logo"><span class="mark"></span>NENEMI</div><div class="brand-copy"><div class="eyebrow">${c[0]}</div><h1>${c[1]}</h1><p>${c[2]}</p></div><div class="brand-foot">NENEMI — WHERE YOUR HEAD GETS QUIET</div></aside><section class="work"><span class="step-chip">${chip()}</span><div class="panel">${progress()}${content}</div></section></section>`; }
const heading=(t,p)=>`<h2>${t}</h2><p class="lede">${p}</p>`;
const primary=(label,action,disabled=false)=>`<button class="btn primary" data-action="${action}" ${disabled?'disabled':''}>${label}</button>`;

function screen(){
  switch(state.stage){
    case 'signup': return `${heading('Create your account','Free to start — 2 Rooms, no card. Your space, private to you.')}<div class="stack"><button class="btn" data-action="social">Continue with Apple</button><button class="btn" data-action="social">Continue with Google</button><div class="divider">or</div></div><label class="field"><span class="label">EMAIL</span><input id="email" type="email" autocomplete="email" value="${escapeHtml(state.email)}" placeholder="you@email.com"></label><label class="field"><span class="label">PASSWORD</span><input id="password" type="password" autocomplete="new-password" value="${escapeHtml(state.password)}" placeholder="8+ characters"></label>${primary('Start free →','signup',!(state.email.includes('@')&&state.password.length>=8))}<p class="support-note">Already have a space? <button class="link">Sign in</button></p><p class="tiny">FREE FOR 2 ROOMS · NO CARD TO START</p>`;
    case 'confirm': return `${heading('Check your email.',`We sent a 6-digit code to ${escapeHtml(state.email)||'your email'}. Enter it to confirm it’s you.`)}<label class="field"><span class="label">CODE</span><input id="code" inputmode="numeric" maxlength="6" value="${escapeHtml(state.code)}" placeholder="123456"></label>${primary('Confirm →','confirm',state.code.length!==6)}<button class="link" data-action="resend">Resend the code</button>`;
    case 'name': return `${heading('Nice to meet you.','What should we call you? Just so it feels like yours.')}<div class="two" style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><label class="field"><span class="label">FIRST NAME</span><input id="firstName" autocomplete="given-name" value="${escapeHtml(state.firstName)}" placeholder="Marcos"></label><label class="field"><span class="label">LAST NAME</span><input id="lastName" autocomplete="family-name" value="${escapeHtml(state.lastName)}" placeholder="Cuellar"></label></div>${primary('Continue →','name',!state.firstName.trim())}`;
    case 'plan': return `${heading('Free, starting now.','A quiet place only you can open. Here’s what’s yours.')}<div class="plan free"><h3>Free <span>— for as long as you like</span></h3><ul><li>2 Rooms of your own</li><li>My Day, voice capture, and your way back in</li><li>Saved to your device and synced across devices</li></ul></div><div class="plan"><h3>Full access <span>— $10/mo, whenever you want</span></h3><ul><li>Everything in Free</li><li>Rooms without a cap</li><li>More space for every Room</li></ul></div>${primary('Continue free →','plan')}<button class="btn" data-action="upgrade">See full access</button>`;
    case 'welcome': return `${heading('Welcome in.','Your place is ready. A quick look at what’s inside — then it’s yours.')}<div class="welcome-row"><b>01</b><b>Home</b><p>Say what’s in your head. It lands where it belongs.</p></div><div class="welcome-row"><b>02</b><b>Rooms</b><p>One thing each. Held between visits, so you never restart from zero.</p></div><div class="welcome-row"><b>03</b><b>A way back in</b><p>Stuck or scattered? A calm screen and one small move.</p></div>${primary('Take me in →','welcome')}<button class="link" data-action="welcome">Skip the look</button>`;
    case 'capture': return `${heading('Whatever’s in your head, put it here.','Messy is fine. Start in the middle.')}<label class="field"><span class="label">YOUR FIRST CAPTURE</span><textarea id="capture" placeholder="I need to finish the proposal, call the dentist…">${escapeHtml(state.capture)}</textarea></label>${primary('Continue →','capture',!state.capture.trim())}`;
    case 'need': return `${heading('What would help most right now?','Choose what feels closest. You can change it later.')}<div class="choices">${['Get something out of my head','Plan today','Pick something back up','I’m stuck'].map(x=>`<button class="choice ${state.need===x?'selected':''}" data-choice="need" data-value="${x}">${x}</button>`).join('')}</div>${primary('Continue →','need',!state.need)}`;
    case 'destination': return `${heading('Where should NENEMI hold this?','Nothing gets scheduled until you approve it.')}<div class="choices">${['Add it to My Day','Create a Room','Keep it as a note','Help me decide'].map(x=>`<button class="choice ${state.destination===x?'selected':''}" data-choice="destination" data-value="${x}">${x}</button>`).join('')}</div>${primary('Show me →','destination',!state.destination)}`;
    case 'ready': return `${heading('It’s okay. NENEMI has it.','You don’t need to hold everything at once.')}<div class="result"><small>YOUR FIRST CAPTURE</small><p>${escapeHtml(state.capture)}</p><ul><li>${state.need}</li><li>${state.destination}</li></ul></div>${primary('Enter My Day →','notify')}<button class="link" data-action="reset">Restart demo</button>`;
  }
}
function escapeHtml(v=''){ return v.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function render(){ app.innerHTML=layout(screen()); bindInputs(); }
function bindInputs(){ ['email','password','code','firstName','lastName','capture'].forEach(id=>{const el=document.getElementById(id); if(el)el.addEventListener('input',e=>{state[id]=e.target.value;save(); const btn=document.querySelector('[data-action="'+({email:'signup',password:'signup',code:'confirm',firstName:'name',capture:'capture'}[id]||'')+'"]'); if(btn){ const ok=id==='code'?state.code.length===6:id==='firstName'?!!state.firstName.trim():id==='capture'?!!state.capture.trim():(state.email.includes('@')&&state.password.length>=8); btn.disabled=!ok; }});});}
document.addEventListener('click', async e=>{
  const choice=e.target.closest('[data-choice]'); if(choice){state[choice.dataset.choice]=choice.dataset.value;save();render();return;}
  const action=e.target.closest('[data-action]')?.dataset.action; if(!action)return;
  const next={social:'name',signup:'confirm',confirm:'name',name:'plan',plan:'welcome',welcome:'capture',capture:'need',need:'destination',destination:'ready'}[action];
  if(next){setStage(next);return;}
  if(action==='resend') alert('Demo: verification code resent.');
  if(action==='upgrade') alert('Demo: connect this button to StoreKit or your web checkout.');
  if(action==='reset'){localStorage.removeItem('nenemi-demo');Object.assign(state,{stage:'signup',email:'',password:'',code:'',firstName:'',lastName:'',capture:'',need:'',destination:''});render();}
  if(action==='notify') showNotificationSheet();
});
function showNotificationSheet(){ const modal=document.createElement('div'); modal.className='notification'; modal.innerHTML=`<div class="sheet"><h2>Want NENEMI to hold the timing too?</h2><p>Get a quiet reminder when it’s time to return. You control when and how often.</p><button class="btn primary" id="allow">Turn on reminders</button><button class="btn" id="later">Not now</button></div>`;document.body.append(modal);modal.querySelector('#later').onclick=()=>modal.remove();modal.querySelector('#allow').onclick=async()=>{if('Notification'in window){await Notification.requestPermission();}modal.remove();alert('Demo complete. Connect this to the app notification settings.');};}
try{Object.assign(state,JSON.parse(localStorage.getItem('nenemi-demo')||'{}'));}catch{}
render();
