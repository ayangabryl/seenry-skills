// Three-case discovery only. No score, publication, product edits or acceptance matrix.
// Native execution is explicitly CI-only; --verify-only performs no browser import/launch.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,renameSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {platform,release} from 'node:os';
import {sha256,verifyPins,timingWindow,finiteState,classifyObservation,escapeOwnership,effectivePaint,keyboardFirstPaint,reducedMotionFindings,trustedActionEvidence,parentOwnedOpen,canSendParentEscape,nativeClipGeometry,collectionSummary,collectNativeAction,boundedOperation,makeBoundedFinalizer,lifecycleObservation,nativeBoundaryReady,createClockedEventListeners,inputEventBoundary} from './transitions-library-menu-discovery-helpers.mjs';
const here=dirname(fileURLToPath(import.meta.url));
const arg=(name,fallback)=>{const i=process.argv.indexOf(name);return i<0?fallback:process.argv[i+1];};
const gallery=resolve(arg('--gallery',join(here,'../skills/seenry/assets/components/transitions/gallery.html')));
const pins=JSON.parse(readFileSync(join(here,'transitions-library-menu-discovery.pins.json'),'utf8'));
const sources=verifyPins(gallery,pins,here);
if(process.argv.includes('--verify-only')) { console.log(JSON.stringify({scope:'source-and-harness-pins-only',sources},null,2));process.exit(0); }
if(process.env.GITHUB_ACTIONS!=='true'||process.env.CI!=='true')throw new Error('Native execution blocked: use the existing authorized pinned CI route; do not launch local Chromium');
const pw=arg('--playwright');assert(pw,'Pass --playwright to the existing pinned CI module');
const modulePath=resolve(pw),pkg=JSON.parse(readFileSync(join(dirname(modulePath),'package.json'),'utf8'));
if(pkg.name!=='playwright'||pkg.version!=='1.63.0')throw new Error('Pinned CI Playwright must be exactly 1.63.0');
if(process.env.SEENRY_CHROME_PATH)throw new Error('Alternate browser binaries are outside this pinned discovery route');
const out=resolve(arg('--out','menu-discovery-evidence'));mkdirSync(out,{recursive:true});
const profiles=[{id:'D1',width:390,theme:'light',motion:'no-preference',route:'gallery'},{id:'D2',width:320,theme:'dark',motion:'reduce',route:'gallery'},{id:'D3',width:390,theme:'light',motion:'no-preference',route:'detail'}];
const index={scope:'discovery-only',status:'running',source:sources,playwright:{version:pkg.version,moduleSHA256:sha256(modulePath)},os:{platform:platform(),release:release()},startedUtc:new Date().toISOString(),cases:profiles.map(p=>({...p,status:'not-attempted',json:`${p.id}/case.json`})),unverified:['full matrix','touch input','Tab departure','interruption/reversal','spacing','actual browser zoom','native assistive technology','copied-popover route','normal-speed and slow playback review','native pixel readability and focus-cue contrast review'],clockContract:'Input/event/rAF use document performance.now; host request/completion use host performance.now and UTC; video packet PTS are media-relative. No exact cross-clock alignment is asserted. rAF is pre-paint; late PNG acquisition never becomes time zero.'};
try{index.commit=execFileSync('git',['rev-parse','HEAD'],{cwd:dirname(gallery),encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();}catch{index.commit=null;}
const saveIndex=()=>writeFileSync(join(out,'index.json'),JSON.stringify(index,null,2)+'\n');saveIndex();
let browser,current,activeCapture,stopping=false;
const ensureRunning=()=>{if(stopping)throw new Error('Discovery deadline reached; new input withheld');};
const saveCase=()=>{if(current){const {dir,...serial}=current;writeFileSync(join(dir,'case.json'),JSON.stringify(serial,null,2)+'\n');}saveIndex();};
let rejectDeadline;
const deadline=new Promise((_,reject)=>{rejectDeadline=reject;});
const watchdog=setTimeout(()=>{stopping=true;index.deadline='105-second collection budget exhausted; bounded trace/context/video finalization begins';saveCase();rejectDeadline(new Error(index.deadline));},105_000);
const hardStop=setTimeout(()=>{index.status='incomplete';index.hardStop='115-second hard limit; any unfinished finalization remains blocked';if(current){current.status='incomplete';current.blocked.push({kind:'hard-deadline',reason:index.hardStop});}saveCase();process.exit(2);},115_000);

function installObserver(){
 const menu=document.querySelector('#menu-1'),trigger=document.querySelector('#menu-trigger'),parent=document.querySelector('#library-detail');
 const trace=window.__menuDiscovery={events:[],actions:[],lifecycle:[],active:null,originalPoint:null,raf:null,droppedEvents:0};
 const control=e=>{if(!e?.closest)return 'outside';if(e===trigger||trigger.contains(e))return 'menu-trigger';const item=e.closest('[role="menuitem"]');if(item&&menu.contains(item))return 'menuitem:'+Array.from(menu.querySelectorAll('[role="menuitem"]')).indexOf(item);if(e===menu)return 'menu-root';if(e.closest('[data-detail="menu"]'))return 'detail-title';return parent.contains(e)?'parent-control':'outside';};
 const identify=e=>e?{tag:e.tagName,id:e.id||null,role:e.getAttribute?.('role')||null,detail:e.dataset?.detail||null,control:control(e),inParent:parent.contains(e),text:(e.getAttribute?.('aria-label')||e.textContent||'').trim().replace(/\s+/g,' ').slice(0,70)}:null;
 const rect=e=>e?.getBoundingClientRect().toJSON()||null;
 const paint=e=>{
  if(!e)return null;const s=getComputedStyle(e),range=document.createRange();range.selectNodeContents(e);
  const chain=[];for(let n=e;n;n=n.parentElement){const c=getComputedStyle(n);chain.push({node:n.id||n.tagName,background:c.backgroundColor,backgroundImage:c.backgroundImage,opacity:c.opacity,filter:c.filter,backdropFilter:c.backdropFilter,mixBlendMode:c.mixBlendMode,visibility:c.visibility,display:c.display,overflowX:c.overflowX,overflowY:c.overflowY,clipPath:c.clipPath,rect:rect(n)});}
  return {node:identify(e),rect:rect(e),focused:document.activeElement===e,focusVisible:e.matches(':focus-visible'),glyphs:[...range.getClientRects()].filter(r=>r.width>0&&r.height>0).map(r=>r.toJSON()),color:s.color,fontSize:s.fontSize,opacity:s.opacity,filter:s.filter,transform:s.transform,cue:{background:s.backgroundColor,adjacentBackground:getComputedStyle(e.parentElement).backgroundColor,outlineColor:s.outlineColor,outlineWidth:s.outlineWidth,outlineStyle:s.outlineStyle,boxShadow:s.boxShadow},chain};
 };
 const animations=()=>[...new Set([...menu.getAnimations({subtree:true}),...parent.getAnimations({subtree:true})])].map(a=>{const t=a.effect?.getTiming()||{},ct=a.effect?.getComputedTiming()||{},frames=a.effect?.getKeyframes()||[];const values=Object.fromEntries(['transform','translate','scale','rotate','filter'].map(key=>[key,[...new Set(frames.map(f=>f[key]).filter(v=>v!==undefined))].slice(0,12)]));return {target:identify(a.effect?.target),playState:a.playState,pending:a.pending,currentTime:typeof a.currentTime==='number'?a.currentTime:null,iterations:t.iterations===Infinity?'Infinity':t.iterations??null,fill:t.fill,duration:t.duration,delay:t.delay,values,endTime:ct.endTime===Infinity?'Infinity':ct.endTime,properties:[...new Set((a.effect?.getKeyframes()||[]).flatMap(k=>Object.keys(k).filter(p=>!['offset','computedOffset','easing','composite'].includes(p))))]};});
 const clipMetrics=e=>{
  const c=getComputedStyle(e),r=rect(e);let axisAligned=true;
  for(let n=e;n;n=n.parentElement){const cs=getComputedStyle(n),m=new DOMMatrixReadOnly(cs.transform==='none'?undefined:cs.transform);if(!m.is2D||Math.abs(m.b)>1e-8||Math.abs(m.c)>1e-8||m.a<=0||m.d<=0||!['none','0deg'].includes(cs.rotate)||cs.scale.split(/\s+/).some(v=>v!=='none'&&Number(v)<=0))axisAligned=false;}
  return {node:e.id||e.tagName,rect:r,offsetWidth:e.offsetWidth,offsetHeight:e.offsetHeight,clientLeft:e.clientLeft,clientTop:e.clientTop,clientWidth:e.clientWidth,clientHeight:e.clientHeight,axisAligned,clipX:/hidden|clip|scroll|auto/.test(c.overflowX),clipY:/hidden|clip|scroll|auto/.test(c.overflowY),unsupportedClip:c.clipPath!=='none'||c.maskImage!=='none'};
 };
 function state(withPaint=true){
  const snapshotStartedAt=performance.now();
  const stage=menu.closest('.stage'),s=getComputedStyle(menu),r=rect(menu),t=rect(trigger),point=trace.originalPoint||{x:t.left+t.width/2,y:t.top+t.height/2};
  const stack=document.elementsFromPoint(point.x,point.y),hit=stack[0],items=menu.querySelectorAll('[role="menuitem"]'),ps=getComputedStyle(parent);
  const ancestors=[];for(let n=menu.parentElement;n;n=n.parentElement)ancestors.push(clipMetrics(n));const clipGeometry=window.__menuClipGeometry(clipMetrics(menu),ancestors,{left:0,top:0,right:innerWidth,bottom:innerHeight});
  const result={at:snapshotStartedAt,snapshotStartedAt,expanded:trigger.getAttribute('aria-expanded'),presentation:menu.dataset.stOpen??null,hidden:menu.hidden,inert:menu.inert,ariaHidden:menu.getAttribute('aria-hidden'),visibility:s.visibility,display:s.display,opacity:s.opacity,filter:s.filter,transform:s.transform,origin:s.transformOrigin,side:menu.dataset.stSide||null,focus:{...identify(document.activeElement),visible:!!document.activeElement?.matches(':focus-visible')},triggerPoint:point,triggerHit:{isTrigger:hit===trigger||trigger.contains(hit),top:identify(hit),stack:stack.slice(0,6).map(identify)},rects:{trigger:t,menu:r,stage:rect(stage),offsetParent:rect(menu.offsetParent),replay:rect(stage?.querySelector('[data-replay="menu"]'))},anchor:{bottomGap:r.top-t.bottom,topGap:t.top-r.bottom,rightDelta:r.right-t.right},clipGeometry,menuClip:clipGeometry.rect,scroll:{top:menu.scrollTop,clientHeight:menu.clientHeight,scrollHeight:menu.scrollHeight},first:withPaint?paint(items[0]):null,last:withPaint?paint(items[items.length-1]):{rect:rect(items[items.length-1]),focused:document.activeElement===items[items.length-1]},parent:{tag:parent.tagName,nativeOpen:parent.open,modal:parent.matches(':modal'),presentation:parent.dataset.stOpen??null,inert:parent.inert,hidden:parent.hidden,display:ps.display,visibility:ps.visibility},stageOwner:parent.contains(stage)?'detail':stage?.closest('[data-key="menu"]')?'gallery':'other',hash:location.hash,animations:animations()};
  result.snapshotCompletedAt=performance.now();return result;
 }
 window.__menuState=state;
 window.__menuArm=(request)=>{
  const {id,name,originalPoint}=typeof request==='string'?{name:request}:request;
  if(trace.raf)cancelAnimationFrame(trace.raf);
  const t=rect(trigger);const a={id,name,requestedAt:performance.now(),originalPoint:originalPoint||{x:t.left+t.width/2,y:t.top+t.height/2},events:[],accepted:[],frames:[],sampleOverflow:false};trace.actions.push(a);trace.active=a;trace.originalPoint=a.originalPoint;a.before=state();return {requestedAt:a.requestedAt,originalPoint:a.originalPoint,triggerHit:a.before.triggerHit};
 };
 const tick=rafTimestamp=>{
  const rafCallbackAt=performance.now();const a=trace.active;if(!a)return;const dt=performance.now()-(a.accepted[0]?.at||a.requestedAt),near=[30,70,120,200,320,600,1000];
  a.frameCount=(a.frameCount||0)+1;
  if(a.frames.length<8||near.some(x=>dt>=x&&!a.marks?.includes(x))){const sample=state(a.frames.length<3);sample.rafCallbackAt=rafCallbackAt;sample.rafTimestamp=rafTimestamp;sample.at=rafCallbackAt;a.frames.push(sample);a.marks??=[];for(const x of near)if(dt>=x)a.marks.push(x);}
  if(a.frameCount<180)trace.raf=requestAnimationFrame(tick);else a.sampleOverflow=true;
 };
 const relevant=e=>e.target===trigger||trigger.contains(e.target)||menu.contains(e.target)||parent.contains(e.target)||['Escape','End','Enter',' '].includes(e.key)||e.target?.closest?.('[data-detail="menu"]');
 const eventListeners=window.__menuCreateClockedEventListeners({now:()=>performance.now(),describe:identify,snapshot:(e,phase)=>state(phase==='document-bubble-after-production-js'&&e.type==='click')});
 for(const type of ['pointerdown','pointerup','click','keydown','keyup','focusin','focusout','scroll','cancel','close'])document.addEventListener(type,e=>{const row=eventListeners.capture(e);if(!relevant(e))return;if(trace.events.length<400)trace.events.push(row);else trace.droppedEvents++;if(trace.active&&trace.active.events.length<30)trace.active.events.push(row);},true);
 // After production JS delegation, not necessarily after native default behavior. Capture-event time precedes snapshot work.
 const accepted=e=>{if(!trace.active||!relevant(e))return;const a=trace.active;if(a.accepted.length<10){const row=eventListeners.accepted(e);a.accepted.push({...window.__menuLifecycleObservation(row.phase,e,row.state),...row});}if(!trace.raf)trace.raf=requestAnimationFrame(tick);};
 for(const type of ['click','keydown','keyup','pointerdown'])document.addEventListener(type,accepted);
 const recordLifecycle=e=>{const measured=eventListeners.lifecycle(e),row={...window.__menuLifecycleObservation(measured.phase,e,measured.state),...measured};if(trace.lifecycle.length<40)trace.lifecycle.push(row);if(trace.active){trace.active.lifecycle??=[];if(trace.active.lifecycle.length<12)trace.active.lifecycle.push(row);}requestAnimationFrame(rafTimestamp=>{const measured=eventListeners.later(e,rafTimestamp),post={...window.__menuLifecycleObservation(measured.phase,e,measured.state),...measured};if(trace.lifecycle.length<40)trace.lifecycle.push(post);if(trace.active){trace.active.lifecycle??=[];if(trace.active.lifecycle.length<12)trace.active.lifecycle.push(post);}});};
 for(const type of ['cancel','close'])parent.addEventListener(type,recordLifecycle);

 window.__menuFinish=()=>{if(trace.raf)cancelAnimationFrame(trace.raf);trace.raf=null;const a=trace.active;if(!a)return null;a.after=state();trace.active=null;return a;};
 window.__menuSettle=async()=>{
  const start=performance.now();let stable=0,last;
  while(performance.now()-start<2800){
   const live=[...new Set([...menu.getAnimations({subtree:true}),...parent.getAnimations({subtree:true})])].filter(a=>Number.isFinite(a.effect?.getTiming().iterations)&&(a.pending||a.playState==='running'));
   if(live.length){stable=0;await Promise.race([Promise.all(live.map(a=>a.finished.catch(()=>{}))),new Promise(r=>setTimeout(r,100))]);}
   else{if(window.__menuBoundaryReady(trace.active,{parent:{nativeOpen:parent.open,modal:parent.matches(':modal')}}))stable++;else stable=0;if(stable>=2){last=state();return {status:'native-finite-settlement-observed',elapsedMs:performance.now()-start,state:last};}}
   await new Promise(r=>requestAnimationFrame(r));
  }
  return {status:'blocked',reason:'Native finite completion did not settle within bounded observation window',elapsedMs:performance.now()-start,state:state()};
 };
}

async function prepare(context,run,capture){
 ensureRunning();const page=await context.newPage();capture.page=page;capture.video=page.video();ensureRunning();page.setDefaultTimeout(3500);
 await page.addInitScript({content:`window.__menuClipGeometry=${nativeClipGeometry.toString()};window.__menuLifecycleObservation=${lifecycleObservation.toString()};window.__menuBoundaryReady=${nativeBoundaryReady.toString()};window.__menuCreateClockedEventListeners=${createClockedEventListeners.toString()};window.__menuInputEventBoundary=${inputEventBoundary.toString()};`});
 page.on('pageerror',e=>{run.errors.push({kind:'pageerror',message:e.message});});
 page.on('console',m=>{if(m.type()==='error')run.errors.push({kind:'console',message:m.text().slice(0,500)});});
 await page.route(/^https?:/,r=>r.abort());
 await page.goto(pathToFileURL(gallery).href);await page.evaluate(()=>document.fonts.ready);
 await page.locator(`[data-theme-choice="${run.theme}"]`).click();await page.locator('#library-search').fill('Menu');
 await page.waitForFunction(()=>[...document.querySelectorAll('#library-grid > [data-key]')].filter(e=>!['menu','morph'].includes(e.dataset.key)).every(e=>e.hidden));
 await page.locator('#menu-trigger').scrollIntoViewIfNeeded();
 await page.evaluate(installObserver);await page.evaluate(()=>window.__menuSettle());
 run.environment=await page.evaluate(()=>({url:location.href,viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio,visualScale:visualViewport?.scale},theme:document.documentElement.dataset.theme,themeSelected:document.querySelector('[data-theme-choice][aria-selected="true"]')?.dataset.themeChoice,computedBodyBackground:getComputedStyle(document.body).backgroundColor,reduced:matchMedia('(prefers-reduced-motion:reduce)').matches,coarse:matchMedia('(pointer:coarse)').matches,fine:matchMedia('(pointer:fine)').matches,hover:matchMedia('(hover:hover)').matches,touchPoints:navigator.maxTouchPoints,blur:document.querySelector('#blur-toggle').checked,userAgent:navigator.userAgent}));
 assert.equal(run.environment.theme,run.theme);assert.equal(run.environment.reduced,run.motion==='reduce');assert.equal(run.environment.blur,false,'Fresh default Blur must be off');
 return page;
}
const contextOptions=run=>({viewport:{width:run.width,height:780},deviceScaleFactor:1,colorScheme:run.theme,reducedMotion:run.motion,hasTouch:false,isMobile:false,serviceWorkers:'block',acceptDownloads:false});
async function tabTo(page,selector){
 ensureRunning();for(let n=0;n<45;n++){if(await page.locator(selector).evaluate(e=>e===document.activeElement))return n;await page.keyboard.press('Tab');}
 throw new Error(`Keyboard traversal blocked: ${selector} not reached in bounded Tab sequence`);
}
async function blur(page,on){if(await page.locator('#blur-toggle').isChecked()!==on)await page.locator('label.blur-switch').click();await page.locator('#menu-trigger').scrollIntoViewIfNeeded();}
function publishFindings(run,action){
 for(const s of [action.before,...(action.accepted||[]).map(e=>e.state),...(action.frames||[]),action.after].filter(Boolean))for(const finding of classifyObservation(s)){
  if(run.findings.some(x=>x.kind===finding.kind&&x.action===action.name))continue;
  const row={...finding,action:action.name,at:s.at};run.findings.push(row);saveCase();console.log(`${run.id}: discovery finding ${finding.kind} (${action.name}); preserving evidence, no acceptance verdict`);
 }
}
async function action(page,run,name,input,expected,originalPoint,afterInput){
 ensureRunning();
 const record=await collectNativeAction({run,name,persist:saveCase,
  arm:r=>page.evaluate(request=>window.__menuArm(request),{id:r.id,name,originalPoint}),
  input:armed=>{ensureRunning();return input(armed);},afterInput,settle:()=>page.evaluate(()=>window.__menuSettle()),finish:()=>page.evaluate(()=>window.__menuFinish())});
 if(record.after){record.finite=finiteState(record.after.animations);if(record.finite.held.length)run.findings.push({kind:'finite-animation-retained',action:name,animations:record.finite.held});if(expected&&!expected(record.after)){record.predicate='not-observed';run.findings.push({kind:'expected-state-not-observed',action:name,at:record.after.at});}else record.predicate='observed';}
 if(name.includes('keyboard-open')){record.firstPaint=keyboardFirstPaint(record);if(record.firstPaint.status==='blocked')run.blocked.push({action:name,reason:record.firstPaint.reason,window:record.firstPaint.window});}
 for(const state of [...(record.frames||[]),record.after].filter(Boolean))if(state.last?.focused&&state.clipGeometry?.status==='blocked')run.blocked.push({action:name,reason:state.clipGeometry.reason});
 if(run.motion==='reduce'){record.reduction=reducedMotionFindings([...(record.accepted||[]).map(e=>e.state),...(record.frames||[]),record.after].filter(Boolean));for(const finding of record.reduction)run.findings.push({...finding,action:name});}
 publishFindings(run,record);saveCase();return record;
}
async function closed(page,run){const s=await page.evaluate(()=>window.__menuState(false));if(s.expanded==='true')await action(page,run,'safe-reset-Escape',()=>page.keyboard.press('Escape'),s=>s.expanded==='false');return (await page.evaluate(()=>window.__menuState(false))).expanded!=='true';}
async function pointerCycle(page,run,label){
 if(!await closed(page,run))return;
 const opened=await action(page,run,`${label}-pointer-open`,p=>{if(!p.triggerHit.isTrigger)throw new Error('Original trigger hit target is unavailable; pointer action withheld');return page.mouse.click(p.originalPoint.x,p.originalPoint.y);},s=>s.expanded==='true');
 const s=await page.evaluate(()=>window.__menuState(false));
 if(s.expanded==='true'&&s.triggerHit.isTrigger)await action(page,run,`${label}-original-point-close`,p=>{if(!p.triggerHit.isTrigger)throw new Error('Original trigger hit target is unavailable; pointer action withheld');return page.mouse.click(p.originalPoint.x,p.originalPoint.y);},s=>s.expanded==='false',opened.originalPoint);
 else{run.blocked.push({action:`${label}-original-point-close`,reason:'Original trigger is covered or open state missing; no click was sent to the covering menu item'});await closed(page,run);saveCase();}
}
async function keyboardCycle(page,run,label,key='Enter',end=false){
 if(!await closed(page,run))return;await tabTo(page,'#menu-trigger');
 await action(page,run,`${label}-keyboard-open-${key}`,()=>page.keyboard.press(key),s=>s.expanded==='true'&&s.first?.focused);
 const open=await page.evaluate(()=>window.__menuState(false));
 if(open.expanded!=='true'){run.blocked.push({action:`${label}-End/Escape`,reason:'Keyboard open was not observed'});return;}
 if(end)await action(page,run,`${label}-End`,()=>page.keyboard.press('End'),s=>s.last?.focused&&s.last?.node?.text==='Delete');
 await action(page,run,`${label}-keyboard-Escape`,()=>page.keyboard.press('Escape'),s=>s.expanded==='false'&&s.focus.id==='menu-trigger');
}
async function runVideo(page,run){
 if(run.id==='D1'){for(const enabled of [false,true]){await blur(page,enabled);const label=enabled?'blur-on':'blur-off';await pointerCycle(page,run,label);await keyboardCycle(page,run,label,'Enter');await keyboardCycle(page,run,label,'Space');}}
 if(run.id==='D2'){await blur(page,true);await keyboardCycle(page,run,'native-reduce-blur-on','Enter',true);}
 if(run.id==='D3'){
  await action(page,run,'open-parent-detail',()=>page.locator('[data-detail="menu"]').click(),s=>s.stageOwner==='detail'&&s.hash==='#t/menu');
  await tabTo(page,'#menu-trigger');await action(page,run,'detail-keyboard-open-Enter',()=>page.keyboard.press('Enter'),s=>s.expanded==='true'&&s.first?.focused);
  const child=await action(page,run,'detail-child-Escape',()=>page.keyboard.press('Escape'));
  child.ownership=child.before&&child.after?escapeOwnership(child.before,child.after,'child'):false;
  if(!child.ownership)run.findings.push({kind:'child-Escape-ownership-not-observed',action:child.name});
  const preParent=await page.evaluate(()=>window.__menuState());
  if(canSendParentEscape(child,preParent)){
   const parent=await action(page,run,'detail-parent-Escape',()=>page.keyboard.press('Escape'));parent.ownership=parent.before&&parent.after?escapeOwnership(parent.before,parent.after,'parent'):false;
   if(!parent.ownership)run.findings.push({kind:'parent-Escape-ownership-not-observed',action:parent.name});
  }else run.blocked.push({action:'detail-parent-Escape',reason:'Child dismissal did not establish safe independent parent Escape starting state'});
 }
}
async function png(page,run,name,intendedAfter){
 ensureRunning();const entry={name,file:`${name}.png`,status:'requested',hostRequest:{monotonicMs:performance.now(),utc:new Date().toISOString()}};run.pngs.push(entry);saveCase();
 try{entry.before=await page.evaluate(()=>window.__menuState());await page.screenshot({path:join(run.dir,entry.file),animations:'allow',timeout:3500});entry.sha256=sha256(join(run.dir,entry.file));entry.bytes=readFileSync(join(run.dir,entry.file)).length;entry.status='captured';}
 catch(error){entry.status='blocked';entry.error=String(error);run.blocked.push({action:name,kind:'png-capture',reason:entry.error});}
 finally{entry.hostCompleted={monotonicMs:performance.now(),utc:new Date().toISOString()};entry.after=await page.evaluate(()=>window.__menuState()).catch(()=>null);if(intendedAfter!==undefined){entry['first-paint-window']={request:timingWindow((entry.before?.snapshotStartedAt??NaN)-intendedAfter),completion:timingWindow((entry.after?.snapshotCompletedAt??NaN)-intendedAfter),interpretation:'Both brackets must be in-window; still no proof this is the actual first painted frame'};if(entry['first-paint-window'].request.status==='blocked'||entry['first-paint-window'].completion.status==='blocked')run.blocked.push({action:name,reason:'Intended first-paint PNG bracket missed; diagnostic PNG retained, no product verdict',window:entry['first-paint-window']});}saveCase();}
}
async function rasterCompanion(run){
 ensureRunning();const capture=await newCapture(run,false);const ctx=capture.context;let page;
 try{
  const temp={...run,errors:run.errors};page=await prepare(ctx,temp,capture);
  if(run.id==='D3'){await action(page,run,'raster-open-parent-detail',()=>page.locator('[data-detail="menu"]').click(),parentOwnedOpen);}
  await blur(page,run.id!=='D3');await tabTo(page,'#menu-trigger');await png(page,run,'diagnostic-keyboard-trigger');
  await action(page,run,'diagnostic-keyboard-open-Enter',()=>page.keyboard.press('Enter'),s=>s.expanded==='true'&&s.first?.focused,undefined,async()=>{
   const inputBoundary=await page.evaluate(()=>{const action=window.__menuDiscovery.active,accepted=action?.accepted.find(e=>e.type==='click'&&e.trusted&&e.detail===0&&e.target?.control==='menu-trigger');return action&&window.__menuInputEventBoundary(action,accepted);});
   await png(page,run,'diagnostic-first-available-open',inputBoundary?.eventAt??NaN);
  });
  const raster=run.actions.at(-1);raster.modeledPaint=effectivePaint(raster.after?.first);await png(page,run,'diagnostic-settled-open');
  if(run.id==='D2'){await action(page,run,'diagnostic-End',()=>page.keyboard.press('End'),s=>s.last?.focused);await png(page,run,'diagnostic-End-Delete');}
  run.rasterCompleted=true;
 }catch(error){run.blocked.push({action:'raster-companion',reason:String(error)});}finally{await capture.finalize();}
}
function videoMetadata(path){
 const metadata={file:path.split(/[\\/]/).pop(),sha256:sha256(path),bytes:readFileSync(path).length,finalized:true,playback:'unpaused native recording; unreviewed',screenshotsDuringSequence:false,clock:'media-relative packet PTS; no asserted offset to browser input/rAF'};
 try{const data=JSON.parse(execFileSync('ffprobe',['-v','error','-select_streams','v:0','-show_entries','format=duration:stream=codec_name,width,height,r_frame_rate:packet=pts_time,duration_time','-of','json',path],{encoding:'utf8',timeout:4000,maxBuffer:2*1024*1024}));if(!data.packets?.length)throw new Error('No native video packet timestamps returned');metadata.format=data.format;metadata.streams=data.streams;metadata.packets=(data.packets||[]).map(p=>({ptsSeconds:Number(p.pts_time),durationSeconds:Number(p.duration_time)}));}catch(error){metadata.probe={status:'blocked',reason:String(error).slice(0,300)};}
 return metadata;
}
async function newCapture(run,recordVideo){
 ensureRunning();const capture={run,recordVideo,context:null,page:null,video:null};activeCapture=capture;
 capture.finalize=makeBoundedFinalizer([
  {name:'retrieve-browser-trace',run:async()=>{if(!capture.page)return;const snapshot=await capture.page.evaluate(()=>({active:window.__menuFinish?.(),final:window.__menuState?.(),events:window.__menuDiscovery?.events,lifecycle:window.__menuDiscovery?.lifecycle}));if(snapshot.active){const existing=run.actions.find(a=>a.id===snapshot.active.id);if(existing){Object.assign(existing,snapshot.active);existing.interruptedTraceRecovered=true;}}run.traces??={};run.traces[recordVideo?'video':'raster']={final:snapshot.final,events:snapshot.events,lifecycle:snapshot.lifecycle};}},
  {name:'close-context',timeoutMs:2500,run:async()=>{if(capture.context)await capture.context.close();}},
  {name:'finalize-native-video',timeoutMs:2500,run:async()=>{if(recordVideo){if(!capture.video)throw new Error('No native video handle');const path=join(run.dir,'native-speed.webm');renameSync(await capture.video.path(),path);run.video=videoMetadata(path);}}}
 ],{persist:rows=>{run.finalization??=[];const slot=recordVideo?'video':'raster';const previous=run.finalization.find(x=>x.phase===slot);if(previous)previous.steps=rows;else run.finalization.push({phase:slot,steps:rows});saveCase();},onError:row=>run.blocked.push({kind:'finalization',action:row.name,reason:row.error}),timeoutMs:1500});
 try{capture.context=await browser.newContext({...contextOptions(run),...(recordVideo?{recordVideo:{dir:join(run.dir,'raw'),size:{width:run.width,height:780}}}:{})});if(stopping){await boundedOperation(()=>capture.context.close(),1000,'late-context-close');throw new Error('Context became available after deadline');}return capture;}catch(error){await capture.finalize();throw error;}
}
async function execute(){
 // Import is inside the guarded execution path so import/launch failure persists the prewritten index.
 const {chromium}=await import(pathToFileURL(modulePath).href);ensureRunning();browser=await chromium.launch({headless:true});if(stopping){await boundedOperation(()=>browser.close(),1000,'late-browser-close');throw new Error('Browser became available after deadline');}index.browser=browser.version();saveIndex();
 for(const profile of profiles){
  ensureRunning();const entry=index.cases.find(c=>c.id===profile.id),dir=join(out,profile.id);mkdirSync(dir,{recursive:true});current={...profile,dir,status:'running',height:780,source:sources,actions:[],pngs:[],errors:[],blocked:[],findings:[],nativeSequenceCompleted:false,rasterCompleted:false};entry.status='running';saveCase();
  const run=current;let capture,page;
  try{
   capture=await newCapture(run,true);page=await prepare(capture.context,run,capture);run.nativeSequenceStarted={hostMonotonicMs:performance.now(),utc:new Date().toISOString(),browser:await page.evaluate(()=>({performanceNow:performance.now(),timeOrigin:performance.timeOrigin}))};
   await runVideo(page,run);run.nativeSequenceCompleted=true;
   run.nativeSequenceEnded={hostMonotonicMs:performance.now(),utc:new Date().toISOString(),browser:await page.evaluate(()=>({performanceNow:performance.now(),timeOrigin:performance.timeOrigin}))};
  }catch(error){run.blocked.push({action:'native-sequence',reason:error.stack||String(error)});}
  finally{if(capture)await capture.finalize();saveCase();}
  ensureRunning();await rasterCompanion(run);
  const summary=collectionSummary(run);run.collection=summary;run.status=summary.status;entry.status=run.status;entry.findings=run.findings.length;entry.blocked=summary.issues.length;entry.errors=run.errors.length;saveCase();console.log(`${run.id}: ${run.status}; discovery only, no score or acceptance`);
 }
 index.endSource=verifyPins(gallery,pins,here);index.status=index.cases.some(c=>c.status!=='collected')?'incomplete':'collected';
}
let executionFinished=false;const execution=execute().finally(()=>{executionFinished=true;});
try{await Promise.race([execution,deadline]);}
catch(error){stopping=true;index.status='incomplete';index.error=error.stack||String(error);if(current)current.blocked.push({kind:'execution-interrupted',reason:String(error)});saveCase();}
finally{
 stopping=true;if(activeCapture)await activeCapture.finalize();
 if(browser)try{await boundedOperation(()=>browser.close(),1500,'close-browser');}catch(error){index.status='incomplete';index.browserCloseError=String(error);}
 if(current){const summary=collectionSummary(current);current.collection=summary;current.status=summary.status;const entry=index.cases.find(c=>c.id===current.id);entry.status=current.status;entry.blocked=summary.issues.length;if(summary.status!=='collected')index.status='incomplete';}
 if(index.cases.some(c=>c.status!=='collected'))index.status='incomplete';
 clearTimeout(watchdog);if(executionFinished)clearTimeout(hardStop);index.finalizationFinished=true;index.finishedUtc=new Date().toISOString();saveCase();
}
if(index.status!=='collected')process.exitCode=2;
