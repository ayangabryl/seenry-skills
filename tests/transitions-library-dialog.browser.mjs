// Exact-gallery native Dialog evidence. Paused first-RAF PNGs are explicitly diagnostic,
// not continuous playback or a subjective motion score. Inputs are trusted; API reversal
// timers are separately identified and have asserted in-flight preconditions.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const arg=(n,d)=>{const i=process.argv.indexOf(n);return i<0?d:process.argv[i+1];};
const modulePath=arg('--playwright');if(!modulePath)throw new Error('Pass --playwright /existing/playwright/index.mjs');
const {chromium}=await import(pathToFileURL(resolve(modulePath)).href);
const gallery=resolve(arg('--gallery',fileURLToPath(new URL('../skills/seenry/assets/components/transitions/gallery.html',import.meta.url))));
const widths=arg('--widths','320,390,1100,1440').split(',').map(Number);assert(widths.length&&widths.every(w=>[320,390,1100,1440].includes(w)));
const out=resolve(arg('--out','dialog-browser-results'));mkdirSync(out,{recursive:true});
const sha=f=>createHash('sha256').update(readFileSync(f)).digest('hex');
const browser=await chromium.launch({headless:true,...(process.env.SEENRY_CHROME_PATH?{executablePath:process.env.SEENRY_CHROME_PATH}:{})});
const report={browser:browser.version(),source:Object.fromEntries(['gallery.html','gallery.js','seenry-transitions.js','seenry-transitions.css'].map(f=>[f,sha(join(dirname(gallery),f))])),scope:'320/390/1100/1440 CSS px, light/dark, native normal/reduce; ordinary and moved detail routes; trusted pointer/keyboard, first-RAF computed paint plus paused early PNG; normal-motion natural70ms attempts classified separately from required controlled native midpoint interruption; reduced cycles are immediate fresh transitions. No real deletion, device-touch claim, independent score or continuous-video claim.',runs:[]};
const save=(final=false)=>{
 const run=report.runs.at(-1);if(run){run.caseFile=`${run.width}-${run.theme}-${run.motion}-case.json`;writeFileSync(join(out,run.caseFile),JSON.stringify(run,null,2)+'\n');}
 const value=final?report:{...report,format:'incremental-profile-index',runs:report.runs.map(({width,height,theme,motion,status,phase,error,caseFile})=>({width,height,theme,motion,status,phase,error,caseFile}))};
 writeFileSync(join(out,'results.json'),JSON.stringify(value,null,2)+'\n');
};
const parse=v=>{
 const unit=(x,divisor=1)=>x.endsWith('%')?Number(x.slice(0,-1))/100:Number(x)/divisor;
 let m=/^rgba?\(([^)]+)\)$/.exec(v),values;
 if(m){const parts=m[1].trim().split(/\s*\/\s*/),bits=parts[0].trim().split(/[,\s]+/);assert(bits.length===3||bits.length===4,'Unsupported measured color '+v);values=[...bits.slice(0,3).map(x=>unit(x,255)),unit(parts[1]??bits[3]??'1')];}
 else {m=/^color\(srgb\s+([^)]*)\)$/.exec(v);assert(m,'Unsupported measured color '+v);const parts=m[1].trim().split(/\s*\/\s*/),bits=parts[0].trim().split(/\s+/);assert.equal(bits.length,3);values=[...bits.map(x=>unit(x)),unit(parts[1]??'1')];}
 assert(values.every(x=>Number.isFinite(x)&&x>=0&&x<=1),'Unsupported measured color channels '+v);return values;
};
const luminance=c=>c.slice(0,3).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
const contrast=(fg,bg)=>{const a=Array.isArray(fg)?fg:parse(fg),b=Array.isArray(bg)?bg:parse(bg);assert.equal(a[3],1,'Expected opaque text foreground');assert.equal(b[3],1,'Expected opaque text backing');const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
const inside=(a,b)=>a.width>0&&a.height>0&&a.left>=b.left-1&&a.right<=b.right+1&&a.top>=b.top-1&&a.bottom<=b.bottom+1;
const settle=page=>page.evaluate(settledDialogSnapshot,{timeoutMs:1500});
async function settledDialogSnapshot({timeoutMs=1500}={}){
 window.__dialogSettlementFailure=null;
 if(!Number.isFinite(timeoutMs)||timeoutMs<=0)throw new Error('Invalid Dialog settlement deadline');
 const d=document.querySelector('#dialog-1'),started=performance.now(),observations=[];
 return new Promise((resolve,reject)=>{
  let done=false,raf=null,timer=null,quietFrames=0,lastSnapshot=null;
  const cleanup=()=>{if(raf!==null)cancelAnimationFrame(raf);if(timer!==null)clearTimeout(timer);window.removeEventListener('error',onError);window.removeEventListener('unhandledrejection',onRejection);window.removeEventListener('pagehide',onCancel);};
  const fail=error=>{
   if(done)return;done=true;
   const cause={name:String(error?.name||'Error'),message:String(error?.message||error),stack:String(error?.stack||'')};
   try{window.__dialogSettlementFailure=JSON.parse(JSON.stringify({mode:'bounded-reobserved-snapshot',status:'failed',error:cause,elapsedMs:performance.now()-started,timeoutMs,quietFrames,state:{isConnected:!!d?.isConnected,open:!!d?.open,inert:!!d?.inert,presentation:d?.dataset?.stOpen||null},observations,lastSnapshot}));}
   catch(captureError){window.__dialogSettlementFailure={mode:'bounded-reobserved-snapshot',status:'failed',error:cause,evidenceSerializationError:String(captureError)};}
   cleanup();reject(error);
  };
  const onError=e=>fail(new Error('Page error during Dialog settlement: '+(e.message||'unknown error'))),onRejection=e=>fail(new Error('Page rejection during Dialog settlement: '+String(e.reason))),onCancel=()=>fail(new Error('Dialog settlement cancelled by navigation'));
  const record=jobs=>jobs.map(a=>({...window.dialogAnimationEvidence(a,d),playState:a.playState}));
  const check=()=>{
   if(done)return;
   try{
    if(performance.now()-started>=timeoutMs)throw new Error('Dialog settlement deadline exceeded');
    if(!d?.isConnected||!d.open||!d.matches(':modal')||d.inert||d.dataset.stOpen!=='true')throw new Error('Dialog settlement cancelled: active modal no longer owns the state');
    const jobs=d.getAnimations({subtree:true});observations.push({elapsedMs:performance.now()-started,animations:record(jobs)});
    quietFrames=jobs.length?0:quietFrames+1;
    if(quietFrames>=2){
     // Inspection can flush styles and start hover feedback. Verify its exact snapshot
     // plus the post-inspection inventory synchronously, with no protocol gap.
     const snapshot=window.__dialogInspect();lastSnapshot=snapshot;const after=d.getAnimations({subtree:true});
     if(done)return;
     if(performance.now()-started>=timeoutMs)throw new Error('Dialog settlement deadline exceeded during inspection');
     if(!d.isConnected||!snapshot.open||!snapshot.modal||snapshot.inert)throw new Error('Dialog settlement cancelled during inspection');
     if(snapshot.animations.length===0&&after.length===0){done=true;cleanup();resolve({...snapshot,settlement:{mode:'bounded-reobserved-snapshot',elapsedMs:performance.now()-started,timeoutMs,quietFrames,observations}});return;}
     observations.push({elapsedMs:performance.now()-started,inspectionAnimations:snapshot.animations,animations:record(after)});quietFrames=0;
    }
    raf=requestAnimationFrame(check);
   }catch(error){fail(error);}
  };
  window.addEventListener('error',onError);window.addEventListener('unhandledrejection',onRejection);window.addEventListener('pagehide',onCancel);
  timer=setTimeout(()=>fail(new Error('Dialog settlement deadline exceeded')),timeoutMs);raf=requestAnimationFrame(check);
 });
}

async function retainSettlementFailure(page,run){
 try{const failure=await page.evaluate(()=>window.__dialogSettlementFailure||null);if(failure)run.settlementFailure=failure;}
 catch(error){run.settlementFailureUnavailable=String(error);}
}
const waitClosed=page=>page.waitForFunction(()=>!document.querySelector('#dialog-1').open&&document.querySelector('#dialog-1').dataset.stOpen==='false');
function backdropState(style){
 const standard=style.getPropertyValue('backdrop-filter'),prefixed=style.getPropertyValue('-webkit-backdrop-filter');
 return {opacity:Number(style.opacity),background:style.backgroundColor,filter:style.filter,backdropFilter:standard,webkitBackdropFilter:prefixed,standardSupported:CSS.supports('backdrop-filter','none'),webkitSupported:CSS.supports('-webkit-backdrop-filter','none'),webkitGetterSupported:'webkitBackdropFilter' in style,position:style.position,inset:style.inset};
}
function assertBackdrop(s,motion){
 assert.equal(typeof s.backdropFilter,'string');assert.equal(typeof s.webkitBackdropFilter,'string');
 assert.equal(typeof s.standardSupported,'boolean');assert.equal(typeof s.webkitSupported,'boolean');
 assert(s.standardSupported||s.webkitSupported,'A supported native backdrop filter property must be measured');
 if(motion==='reduce'){
  for(const [value,supported] of [[s.backdropFilter,s.standardSupported],[s.webkitBackdropFilter,s.webkitSupported]])assert(supported?value==='none':['','none'].includes(value),'Reduced backdrop must not retain a supported or measured blur');
  assert.equal(s.filter,'none');
 }else assert((s.standardSupported&&s.backdropFilter.includes('6px'))||(s.webkitSupported&&s.webkitBackdropFilter.includes('6px')),'Normal backdrop has measured 6px blur');
}
function dialogAnimationEvidence(animation,surface){
 const effect=animation.effect,target=effect?.target,pseudo=effect?.pseudoElement||null;
 return {target:target?.id||target?.className||null,targetTag:target?.tagName||null,targetRelationship:target===surface?'surface':target&&surface.contains(target)?'descendant':target?'outside':'unknown',pseudo,properties:[...new Set((effect?.getKeyframes()||[]).flatMap(k=>Object.keys(k).filter(p=>!['offset','computedOffset','easing','composite'].includes(p))))]};
}
function assertInstantAnimations(animations){
 assert(Array.isArray(animations),'Complete animation inventory required');
 for(const a of animations)assert(a.targetRelationship==='descendant'&&a.pseudo===null&&Array.isArray(a.properties)&&a.properties.length>0&&a.properties.every(p=>['backgroundColor','boxShadow'].includes(p)),'Instant modal permits only explicit descendant paint feedback; surface, pseudo, geometry, opacity, filter and unknown jobs are forbidden');
}
function inspect(){
 const d=document.querySelector('#dialog-1'),trigger=document.querySelector('#dialog-trigger'),cancel=d.querySelector('[autofocus]'),confirm=d.querySelector('.dialog-destructive'),heading=d.querySelector('#dlg-title'),description=d.querySelector('#dlg-description'),stage=d.closest('.stage'),bg=stage.querySelector('.app');
 const rect=e=>e.getBoundingClientRect().toJSON();
 const paint=e=>{const s=getComputedStyle(e),chain=[];for(let n=e;n;n=n.parentElement){const c=getComputedStyle(n);chain.push({tag:n.tagName,id:n.id,opacity:Number(c.opacity),filter:c.filter,visibility:c.visibility,display:c.display,blend:c.mixBlendMode,background:c.backgroundColor,backgroundImage:c.backgroundImage});}return {text:e.textContent,rect:rect(e),layoutWidth:e.offsetWidth,layoutHeight:e.offsetHeight,color:s.color,background:s.backgroundColor,fontSize:s.fontSize,opacity:Number(s.opacity),filter:s.filter,transform:s.transform,outlineWidth:s.outlineWidth,outlineStyle:s.outlineStyle,outlineColor:s.outlineColor,focusVisible:e.matches(':focus-visible'),chain};};
 const texts=[],walk=document.createTreeWalker(d,NodeFilter.SHOW_TEXT);let n;while((n=walk.nextNode()))if(n.textContent.trim()){const r=document.createRange();r.selectNode(n);for(const b of r.getClientRects())if(b.width&&b.height)texts.push({text:n.textContent.trim(),rect:b.toJSON(),paint:paint(n.parentElement)});}
 const backdrop=getComputedStyle(d,'::backdrop');
 return {at:performance.now(),modal:d.matches(':modal'),open:d.open,inert:d.inert,presentation:d.dataset.stOpen,expanded:trigger.getAttribute('aria-expanded'),focus:document.activeElement===cancel?'Cancel':document.activeElement===confirm?'Delete':document.activeElement.id||document.activeElement.tagName,viewport:{left:0,top:0,right:innerWidth,bottom:innerHeight,width:innerWidth,height:innerHeight},dialog:paint(d),cancel:paint(cancel),confirm:paint(confirm),heading:paint(heading),description:paint(description),texts,backdrop:backdropState(backdrop),background:{filter:getComputedStyle(bg).filter,opacity:Number(getComputedStyle(bg).opacity)},reduce:matchMedia('(prefers-reduced-motion: reduce)').matches,coarse:matchMedia('(pointer: coarse)').matches,blur:document.documentElement.hasAttribute('data-st-blur'),animations:d.getAnimations({subtree:true}).map(a=>({playState:a.playState,...dialogAnimationEvidence(a,d),duration:a.effect.getComputedTiming().duration}))};
}
// Lightweight natural-motion inventory avoids walking every text/ancestor chain on every RAF.
// Full paint is still checked on first accepted and settled frames.
function inspectMotion(){
 const d=document.querySelector('#dialog-1'),trigger=document.querySelector('#dialog-trigger'),cancel=d.querySelector('[autofocus]'),style=getComputedStyle(d);
 return {at:performance.now(),modal:d.matches(':modal'),open:d.open,inert:d.inert,expanded:trigger.getAttribute('aria-expanded'),focus:document.activeElement===cancel?'Cancel':document.activeElement.id||document.activeElement.tagName,opacity:Number(style.opacity),transform:style.transform,filter:style.filter,backdropOpacity:Number(getComputedStyle(d,'::backdrop').opacity),reduce:matchMedia('(prefers-reduced-motion: reduce)').matches,animations:d.getAnimations({subtree:true}).map(a=>{const t=a.effect.getComputedTiming();return {playState:a.playState,pending:a.pending,currentTime:a.currentTime,endTime:t.endTime,duration:t.duration,...dialogAnimationEvidence(a,d)};})};
}
function naturalCoverage(reversal){
 const action=k=>reversal.actions.find(a=>a.kind===k),active=s=>s?.animations?.some(a=>a.target==='dialog-1'&&!a.pseudo&&a.properties?.includes('transform')&&a.playState==='running'&&a.pending===false&&Number.isFinite(a.currentTime)&&a.currentTime>0&&Number.isFinite(a.endTime)&&a.currentTime<a.endTime);
 const beforeClose=action('before-close'),beforeReopen=action('before-reopen');
 if(action('trusted-open')?.reduce){const result={beforeClose,afterClose:action('after-close'),afterReopen:action('after-reopen')};try{assertImmediateCycle(result);return {status:'immediate',scope:'Reduced fresh close/open cycle; no entry or outgoing interruption interval exists'};}catch{return {status:'blocked',scope:'Reduced synchronous final-state contract failed'};}}
 const openingInterrupted=!!(beforeClose?.modal&&beforeClose.open&&!beforeClose.inert&&active(beforeClose)),exitInterrupted=!!(beforeReopen?.modal&&beforeReopen.open&&beforeReopen.inert&&beforeReopen.expanded==='false'&&active(beforeReopen));
 return {status:openingInterrupted&&exitInterrupted?'covered':'blocked',openingInterrupted,exitInterrupted,scope:'Natural requested70ms API timings require nonpending, positively progressed surface geometry; pending, unstarted or missed windows remain unaccepted diagnostic coverage'};
}
function isDialogExitScale(value){
 if(typeof value!=='string')return false;
 const match=/^(scale|matrix)\(([^()]*)\)$/.exec(value.trim());if(!match)return false;
 const tokens=match[2].split(',').map(x=>x.trim()),number=/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i;
 if(!tokens.length||tokens.some(x=>!number.test(x)))return false;
 const values=tokens.map(Number),near=(a,b)=>Number.isFinite(a)&&Math.abs(a-b)<1e-8;
 if(match[1]==='scale')return (values.length===1||values.length===2)&&values.every(x=>near(x,.97));
 return values.length===6&&values.every((x,i)=>near(x,[.97,0,0,.97,0,0][i]));
}
function selectMotionJobs(animations,target,exiting=false){
 return animations.filter(a=>{const t=a.effect.getComputedTiming(),last=a.effect.getKeyframes().at(-1);return a.effect.target===target&&a.playState==='running'&&Number.isFinite(t.duration)&&t.duration>0&&Number.isFinite(a.currentTime)&&a.currentTime<t.endTime&&(!exiting||(!a.effect.pseudoElement&&isDialogExitScale(last?.transform))||(a.effect.pseudoElement==='::backdrop'&&Number(last?.opacity)===0));});
}
function sampledMidpoints(jobs,count){
 return count>0&&Array.isArray(jobs)&&jobs.length===count&&jobs.every(a=>a.target==='dialog-1'&&a.playState==='paused'&&a.pending===false&&Number.isFinite(a.currentTime)&&Number.isFinite(a.requestedMidpoint)&&Math.abs(a.currentTime-a.requestedMidpoint)<.01);
}
async function controlledInterruption(page){
 await page.evaluate(()=>{
  window.__controlled=null;const trigger=document.querySelector('#dialog-trigger');
  const observe=e=>{if(e.target!==trigger&&!trigger.contains(e.target))return;document.removeEventListener('click',observe);const d=document.querySelector('#dialog-1');
   const jobs=window.__selectDialogJobs(d.getAnimations({subtree:true}),d);
   const before=window.__dialogMotion(),requestedMidpoints=jobs.map(a=>{const t=a.effect.getTiming();return t.delay+t.duration*.5;});jobs.forEach((a,i)=>{a.pause();a.currentTime=requestedMidpoints[i];});
   window.__controlled={trusted:e.isTrusted,detail:e.detail,observedAt:'post-production-document',entryBefore:before,jobs,requestedMidpoints};
  };document.addEventListener('click',observe);
 });
 await page.locator('#dialog-trigger').click();
 return page.evaluate(async()=>{
  const c=window.__controlled,d=document.querySelector('#dialog-1'),t=document.querySelector('#dialog-trigger');
  if(!c)return {status:'blocked',reason:'Trusted opening observer did not run'};
  const stateOf=(jobs,midpoints)=>jobs.map((a,i)=>({...dialogAnimationEvidence(a,d),playState:a.playState,pending:a.pending,currentTime:a.currentTime,requestedMidpoint:midpoints[i]}));
  const result={mode:'controlled-native-paused-midpoint-api-interruption',trusted:c.trusted,detail:c.detail,observedAt:c.observedAt,entryBefore:c.entryBefore,entryJobs:c.jobs.length};
  if(c.entryBefore.reduce){result.mode='reduced-immediate-fresh-cycle';result.beforeClose=window.__dialogMotion();SeenryTransitions.close(d);result.afterClose=window.__dialogMotion();SeenryTransitions.open(d,t);result.afterReopen=window.__dialogMotion();result.status='immediate';return result;}
  if(!c.jobs.length)return {...result,status:'blocked',reason:'No running native entrance jobs to pause'};
  await new Promise(r=>requestAnimationFrame(r));result.entryMidpoint=window.__dialogInspect();result.entrySampledJobs=stateOf(c.jobs,c.requestedMidpoints);
  if(!window.__dialogMidpointReady(result.entrySampledJobs,result.entryJobs))return {...result,status:'blocked',reason:'Entrance jobs did not reach the paused native midpoint'};
  SeenryTransitions.close(d);result.exitBefore=window.__dialogMotion();result.entryRetired=c.jobs.every(a=>a.playState==='idle'&&!a.pending);
  const exits=window.__selectDialogJobs(d.getAnimations({subtree:true}),d,true);
  result.exitJobs=exits.length;
  if(!exits.length)return {...result,status:'blocked',reason:'No running native outgoing geometry/backdrop jobs to pause'};
  const exitMidpoints=exits.map(a=>{const timing=a.effect.getTiming();return timing.delay+timing.duration*.5;});exits.forEach((a,i)=>{a.pause();a.currentTime=exitMidpoints[i];});
  await new Promise(r=>requestAnimationFrame(r));result.beforeReopen=window.__dialogMotion();result.exitPaint=window.__dialogInspect();result.exitSampledJobs=stateOf(exits,exitMidpoints);
  if(!window.__dialogMidpointReady(result.exitSampledJobs,result.exitJobs))return {...result,status:'blocked',reason:'Exit jobs did not reach the paused native midpoint'};
  if(!(result.beforeReopen.modal&&result.beforeReopen.open&&result.beforeReopen.inert&&result.beforeReopen.expanded==='false'&&result.beforeReopen.opacity===1&&result.beforeReopen.transform!==result.exitBefore.transform))return {...result,status:'blocked',reason:'Required actual midpoint outgoing state was absent'};
  SeenryTransitions.open(d,t);result.afterReopen=window.__dialogMotion();result.reopenPaint=window.__dialogInspect();result.exitRetired=exits.every(a=>a.playState==='idle'&&!a.pending);result.status='observed';return result;
 });
}
function assertImmediateCycle(result){
 for(const s of [result.beforeClose,result.afterReopen]){assert(s?.reduce&&s.modal&&s.open&&!s.inert&&s.expanded==='true');assert.equal(s.opacity,1);assert.equal(s.transform,'none');assert.equal(s.filter,'none');assert.equal(s.backdropOpacity,1);assertInstantAnimations(s.animations);assert.equal(s.focus,'Cancel');}
 const s=result.afterClose;assert(s&&!s.open&&!s.modal&&s.inert&&s.expanded==='false');assert.equal(s.focus,'dialog-trigger');assertInstantAnimations(s.animations);
}
function assertControlled(result){
 if(result.mode==='reduced-immediate-fresh-cycle'){assert.equal(result.status,'immediate');assert(result.trusted&&result.detail>0);assert.equal(result.observedAt,'post-production-document');assertImmediateCycle(result);return;}
 assert.equal(result.status,'observed',result.reason||'Controlled native interruption not observed');assert(result.trusted&&result.detail>0);assert.equal(result.observedAt,'post-production-document');assert(result.entryJobs>0&&result.exitJobs>0);
 assert(sampledMidpoints(result.entrySampledJobs,result.entryJobs)&&sampledMidpoints(result.exitSampledJobs,result.exitJobs),'Every selected native job must be paused/nonpending at its measured requested midpoint');
 for(const jobs of [result.entrySampledJobs,result.exitSampledJobs]){assert(jobs.some(a=>!a.pseudo&&a.properties.includes('transform')),'Actual surface geometry job required');assert(jobs.some(a=>a.pseudo==='::backdrop'&&a.properties.includes('opacity')),'Actual backdrop owner required');}
 assert(result.entryRetired&&result.exitRetired,'Old native animation ownership must retire on each replacement');
 assert(result.entryBefore.modal&&result.entryBefore.open&&!result.entryBefore.inert);assert(result.exitBefore.modal&&result.exitBefore.open&&result.exitBefore.inert&&result.exitBefore.expanded==='false');assert(result.beforeReopen.modal&&result.beforeReopen.open&&result.beforeReopen.inert&&result.beforeReopen.expanded==='false');assert.equal(result.beforeReopen.opacity,1,'Outgoing decision shell stays opaque');assert.notEqual(result.beforeReopen.transform,result.exitBefore.transform,'Actual paused outgoing geometry must advance');assert.notEqual(result.beforeReopen.transform,'none');assert.equal(result.afterReopen.opacity,1,'Reopening decision shell stays opaque');assert.equal(result.afterReopen.transform,result.beforeReopen.transform,'Reopen starts at the actual rendered geometry');assert(result.afterReopen.modal&&result.afterReopen.open&&!result.afterReopen.inert&&result.afterReopen.expanded==='true');assert.equal(result.afterReopen.focus,'Cancel');
}
function assertPaint(s,{motion,input,settled=false,outgoing=false}){
 assert(s.modal&&s.open&&s.inert===outgoing,'Must be the owned native top-layer modal');assert.equal(s.expanded,outgoing?'false':'true');assert(inside(s.dialog.rect,s.viewport),'Positive compact dialog must fit the viewport');assert(s.dialog.rect.width<=361,'Dialog remains compact');assert(inside(s.cancel.rect,s.dialog.rect)&&inside(s.confirm.rect,s.dialog.rect),'Positive actions inside dialog');
 const clearPaint=item=>{assert(item&&item.rect.width>0&&item.rect.height>0,'Positive painted node required');assert.equal(item.opacity,1);assert.equal(item.filter,'none');for(const p of item.chain){assert.equal(p.opacity,1);assert.equal(p.filter,'none');assert.equal(p.blend,'normal');assert.equal(p.visibility,'visible');assert.notEqual(p.display,'none');}};
 for(const item of [s.dialog,s.cancel,s.confirm,s.heading,s.description])clearPaint(item);
 const modalBacking=parse(s.dialog.background);assert.equal(modalBacking[3],1,'Modal backing must be opaque');assert.equal(s.dialog.chain[0].backgroundImage,'none','Modal image backing needs separate compositing evidence');
 const backingFor=item=>{let bg=modalBacking;const end=item.chain.findIndex(p=>p.id==='dialog-1');assert(end>=0,'Text must belong to the actual modal');for(const p of item.chain.slice(0,end).reverse()){assert.equal(p.backgroundImage,'none','Text over an image needs separate compositing evidence');const fg=parse(p.background);bg=[...fg.slice(0,3).map((v,i)=>v*fg[3]+bg[i]*(1-fg[3])),1];}return bg;};
 assert(inside(s.heading.rect,s.dialog.rect)&&inside(s.description.rect,s.dialog.rect),'Decision copy stays in the compact modal');
 assert.equal(s.heading.text.trim(),'Delete Aurora website?');for(const word of ['24 pages','318 assets','30 days'])assert(s.description.text.includes(word),'Description missing '+word);
 assert(parseFloat(s.description.fontSize)>=(s.viewport.width<=650?15:16),'Readable decision consequence size');
 assert(contrast(s.heading.color,backingFor(s.heading))>=4.5,'Heading text contrast');assert(contrast(s.description.color,backingFor(s.description))>=4.5,'Description text contrast');
 assert(s.texts.length>=4);const text=s.texts.map(x=>x.text).join(' ');for(const word of ['Delete Aurora website?','24 pages','318 assets','30 days','Cancel','Delete project'])assert(text.includes(word),'Missing positive content: '+word);for(const t of s.texts){assert(inside(t.rect,s.dialog.rect),'Content outside modal: '+t.text);clearPaint(t.paint);assert(contrast(t.paint.color,backingFor(t.paint))>=4.5,'Actual text-run foreground contrast');}
 assert(contrast(s.confirm.color,s.confirm.background)>=4.5,'Destructive action text contrast');assert(contrast(s.cancel.color,s.cancel.background)>=4.5,'Cancel text contrast');assert.equal(s.coarse,false,'This matrix uses a fine pointer, not device/touch emulation');for(const action of [s.cancel,s.confirm]){assert(action.layoutHeight>=44&&action.layoutWidth>=44,'Authored action footprint is at least44px');assert(action.rect.height>=24&&action.rect.width>=24,'Moving fine-pointer target remains at least24px');if(input==='keyboard'||motion==='reduce'||settled)assert(action.rect.height>=43.99&&action.rect.width>=43.99,'Untransformed action retains44px rendered bounds');}
 assert.equal(s.reduce,motion==='reduce');assert.equal(s.background.filter,'none');assert.equal(s.background.opacity,1,'Native backdrop replaces the old stage-only dim');
 assertBackdrop(s.backdrop,motion);
 if(motion==='reduce'||input==='keyboard'){assert.equal(s.dialog.transform,'none');assert.equal(s.backdrop.opacity,1,'Instant modal scope must already be fully painted');assertInstantAnimations(s.animations);}
 if(input==='pointer')assert(s.cancel.outlineStyle==='none'||parseFloat(s.cancel.outlineWidth)===0,'Pointer autofocus must not paint a keyboard-only ring');
 if(input==='keyboard'){assert.equal(s.focus,'Cancel');assert(s.cancel.focusVisible&&parseFloat(s.cancel.outlineWidth)>=2&&s.cancel.outlineStyle!=='none','Keyboard focus visible on first paint');assert.equal(s.dialog.transform,'none');}
 if(settled)assert.equal(s.animations.length,0,'No owned effects remain after settlement');
}
function assertPointerExit(exit){
 assert(exit.start&&exit.start.trusted&&exit.start.detail>0&&exit.start.observedAt==='document-bubble'&&exit.start.currentTargetIsDocument,'Pointer exit must be observed after the delegated document handler');assert.equal(exit.start.control,'Cancel');assert(exit.start.actualTarget?.tag,'Actual pointer target must be recorded');
 if(exit.start.reduce){assert(!exit.start.open&&!exit.start.modal&&exit.start.inert&&exit.start.expanded==='false','Reduced pointer close must finish synchronously');assert.equal(exit.start.focus,'dialog-trigger');assertInstantAnimations(exit.start.animations);assert.equal(exit.keys.length,0,'No nonexistent outgoing Escape interval is claimed under reduction');return;}
 assert(exit.start.modal&&exit.start.open&&exit.start.inert&&exit.start.expanded==='false','Pointer exit must really start in the native outgoing state');assert.equal(exit.start.dialog.opacity,1,'Outgoing decision shell is opaque');assert(exit.start.animations.some(a=>!a.pseudo&&a.properties.includes('transform')),'Pointer exit requires actual owned geometry');assert.equal(exit.keys.length,2);assert(exit.keys.every(e=>e.trusted&&e.modal&&e.open&&e.inert),'Repeated Escape must really occur during pointer outgoing interval');for(const e of exit.keys)assert.equal(e.dialog.opacity,1,'Repeated Escape preserves opaque outgoing paint');
}
async function earlyOpen(page,input,path){
 await page.evaluate(()=>{window.__early=null;const t=document.querySelector('#dialog-trigger');t.addEventListener('click',e=>{window.__openInput={trusted:e.isTrusted,detail:e.detail,at:performance.now()};queueMicrotask(()=>requestAnimationFrame(()=>{window.__early=window.__dialogInspect();window.__early.input=window.__openInput;window.__early.capture='Paused at first actual RAF after trusted input';window.__paused=document.querySelector('#dialog-1').getAnimations({subtree:true});window.__paused.forEach(a=>a.pause());}));},{once:true});});
 if(input==='keyboard'){await page.locator('#dialog-trigger').focus();await page.keyboard.press('Enter');}else await page.locator('#dialog-trigger').click();
 await page.waitForFunction(()=>window.__early!==null);const s=await page.evaluate(()=>window.__early);assert(s.input.trusted);assert(input==='keyboard'?s.input.detail===0:s.input.detail>0);
 await page.screenshot({path,animations:'allow'});await page.evaluate(()=>window.__paused.forEach(a=>a.play()));return s;
}
function assertFocusStep(step){
 assert(step.modal&&step.open&&!step.inert,'Traversal must retain the active native modal');
 assert(step.inside||step.documentBoundary,'Tab reached actionable background content');
 assert(['Cancel','Delete',null].includes(step.control),'Unexpected control identity');
 if(step.control)assert(step.inside,'Target control must belong to this dialog');
}
async function traverseFocus(page,key,target,path,onStep=()=>{}){
 assert(['Tab','Shift+Tab'].includes(key));assert(['Cancel','Delete'].includes(target));
 for(let i=0;i<4;i++){
  await page.keyboard.press(key);
  const step=await page.evaluate(()=>{const d=document.querySelector('#dialog-1'),a=document.activeElement,cancel=d.querySelector('[autofocus]'),confirm=d.querySelector('.dialog-destructive');return {name:a.textContent.trim().slice(0,30),tag:a.tagName,id:a.id,inside:d.contains(a),documentBoundary:a===document.body,control:a===cancel?'Cancel':a===confirm?'Delete':null,modal:d.matches(':modal'),open:d.open,inert:d.inert};});
  path.push({key,...step});onStep();assertFocusStep(step);if(step.control===target)return path;
 }
 assert.fail('Native '+key+' traversal did not reach '+target+' within four steps');
}

try{
 for(const width of widths)for(const theme of ['light','dark'])for(const motion of ['no-preference','reduce']){
  const label=`${width}-${theme}-${motion}`,run={width,height:780,theme,motion,status:'running',routes:[]};report.runs.push(run);save();
  const context=await browser.newContext({viewport:{width,height:780},colorScheme:theme,reducedMotion:motion,serviceWorkers:'block',acceptDownloads:false}),page=await context.newPage(),errors=[];page.setDefaultTimeout(4000);page.on('pageerror',e=>errors.push(e.message));await page.route(/^https?:/,r=>r.abort());
  try{
   await page.goto(pathToFileURL(gallery).href);await page.evaluate(()=>document.fonts.ready);await page.evaluate(({inspectSource,backdropSource,motionSource,selectSource,midpointSource,scaleSource,animationSource})=>{window.backdropState=eval('('+backdropSource+')');window.dialogAnimationEvidence=eval('('+animationSource+')');window.__dialogInspect=eval('('+inspectSource+')');window.__dialogMotion=eval('('+motionSource+')');window.isDialogExitScale=eval('('+scaleSource+')');window.__selectDialogJobs=eval('('+selectSource+')');window.__dialogMidpointReady=eval('('+midpointSource+')');},{inspectSource:inspect.toString(),backdropSource:backdropState.toString(),motionSource:inspectMotion.toString(),selectSource:selectMotionJobs.toString(),midpointSource:sampledMidpoints.toString(),scaleSource:isDialogExitScale.toString(),animationSource:dialogAnimationEvidence.toString()});
   const snippet=await page.evaluate(()=>window.galleryLibrary.snippets.get('dialog'));assert(/<dialog[^>]*id="dialog-1"/.test(snippet)&&!snippet.includes('data-st-contained'),'Copied markup must use the same native modal contract');run.snippetNative=true;
   await page.locator('#library-search').fill('Dialog');if(!await page.locator('#blur-toggle').isChecked())await page.locator('label.blur-switch').click();
   for(const route of ['gallery','detail']){
    run.phase=route;save();if(route==='detail'){await page.locator('[data-detail=dialog]').click();await page.waitForFunction(()=>document.querySelector('#library-detail').matches(':modal'));await page.locator('#library-detail').evaluate(async d=>{await Promise.all(d.getAnimations({subtree:true}).filter(a=>a.effect.getComputedTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})));});}
    const r={route,inputs:[]};run.routes.push(r);
    for(const input of ['pointer','keyboard']){
     run.phase=`${route}/${input}`;save();const png=`${label}-${route}-${input}-first-raf.png`,first=await earlyOpen(page,input,join(out,png));r.inputs.push({input,png,first});save();assertPaint(first,{motion,input});assert.equal(first.focus,'Cancel');const settled=await settle(page);r.inputs.at(-1).settled=settled;save();assertPaint(settled,{motion,input,settled:true});
     const rejection=await page.evaluate(()=>{document.querySelector('[data-replay=dialog]').focus();return document.querySelector('#dialog-1').contains(document.activeElement);});assert(rejection,'Native modal must reject programmatic background focus');r.inputs.at(-1).backgroundFocusRejected=rejection;const traversal=r.inputs.at(-1).traversal={forwardToDelete:[],forwardToCancel:[],reverseToDelete:[],returnToCancel:[]};save();
     await traverseFocus(page,'Tab','Delete',traversal.forwardToDelete,save);await traverseFocus(page,'Tab','Cancel',traversal.forwardToCancel,save);await traverseFocus(page,'Shift+Tab','Delete',traversal.reverseToDelete,save);await traverseFocus(page,'Tab','Cancel',traversal.returnToCancel,save);
     await page.evaluate(()=>{window.__keyboardExit=null;document.querySelector('#dialog-1').addEventListener('cancel',()=>{window.__keyboardExit=window.__dialogInspect();},{once:true});});await page.keyboard.press('Escape');const keyboardExit=await page.evaluate(()=>window.__keyboardExit);r.inputs.at(-1).keyboardExit=keyboardExit;save();assert(keyboardExit&&!keyboardExit.open&&!keyboardExit.modal,'Keyboard cancellation must synchronously remove native modality');assert.equal(keyboardExit.focus,'dialog-trigger','Keyboard cancellation returns focus without animation wait');assertInstantAnimations(keyboardExit.animations);r.inputs.at(-1).keyboardExit=keyboardExit;assert.equal(await page.locator('#dialog-trigger').evaluate(e=>e===document.activeElement),true,'Escape restores meaningful invoker');if(route==='detail')assert(await page.locator('#library-detail').evaluate(e=>e.matches(':modal')),'Child Escape must retain parent');
    }
    // Native backdrop cancellation is a real outside pointer event, never fixture CSS.
    await page.locator('#dialog-trigger').click();await settle(page);r.backdropHit=await page.evaluate(()=>document.elementFromPoint(4,4)?.id);assert.equal(r.backdropHit,'dialog-1');await page.mouse.click(4,4);await waitClosed(page);assert(await page.locator('#dialog-trigger').evaluate(e=>e===document.activeElement));
    // Repeated Escape ownership is tested during an actual POINTER-initiated exit.
    await page.locator('#dialog-trigger').click();await settle(page);await page.evaluate(()=>{window.__pointerExit=null;window.__pointerEscape=[];const d=document.querySelector('#dialog-1'),cancel=d.querySelector('[autofocus]');window.__pointerExitListener=e=>{if(e.target!==cancel&&!cancel.contains(e.target))return;window.__pointerExit={trusted:e.isTrusted,detail:e.detail,observedAt:'document-bubble',currentTargetIsDocument:e.currentTarget===document,actualTarget:{tag:e.target.tagName,id:e.target.id||null},control:cancel.textContent.trim(),...window.__dialogInspect()};document.removeEventListener('click',window.__pointerExitListener);};document.addEventListener('click',window.__pointerExitListener);window.__escapeListener=e=>{if(e.key==='Escape')window.__pointerEscape.push({trusted:e.isTrusted,...window.__dialogInspect()});};document.addEventListener('keydown',window.__escapeListener,true);});await page.locator('#dialog-1 [autofocus]').click();if(motion==='no-preference'){await page.keyboard.press('Escape');await page.keyboard.press('Escape');}const exit=await page.evaluate(()=>{document.removeEventListener('keydown',window.__escapeListener,true);return {start:window.__pointerExit,keys:window.__pointerEscape};});r.pointerExit=exit;save();assertPointerExit(exit);await waitClosed(page);if(route==='detail')assert(await page.locator('#library-detail').evaluate(e=>e.matches(':modal')),'Pointer-interval Escape must not dismiss parent');assert(await page.locator('#dialog-trigger').evaluate(e=>e===document.activeElement));
    // Same control remains usable after a cancelled exit. Capture genuine in-flight preconditions.
    await page.evaluate(()=>{window.__reversal={mode:'natural-timed-api',actions:[],trace:[]};const trigger=document.querySelector('#dialog-trigger');const observe=e=>{if(e.target!==trigger&&!trigger.contains(e.target))return;document.removeEventListener('click',observe);const start=performance.now(),d=document.querySelector('#dialog-1'),rec=kind=>window.__reversal.actions.push({kind,...window.__dialogMotion(),elapsed:performance.now()-start});rec('trusted-open');window.__reversal.trusted=e.isTrusted;const frame=()=>{window.__reversal.trace.push({...window.__dialogMotion(),elapsed:performance.now()-start});if(performance.now()-start<500)requestAnimationFrame(frame);};requestAnimationFrame(frame);setTimeout(()=>{rec('before-close');SeenryTransitions.close(d);rec('after-close');setTimeout(()=>{rec('before-reopen');SeenryTransitions.open(d,trigger);rec('after-reopen');},70);},70);};document.addEventListener('click',observe);});
    await page.locator('#dialog-trigger').click();await page.waitForTimeout(600);r.reversal=await page.evaluate(()=>window.__reversal);r.reversal.coverage=naturalCoverage(r.reversal);save();assert(r.reversal.trusted);const action=k=>r.reversal.actions.find(a=>a.kind===k);assert(action('trusted-open').modal&&action('trusted-open').open);assert(action('after-close').inert&&action('after-close').expanded==='false');assert.equal(action('after-reopen').focus,'Cancel');assert(r.reversal.trace.length>=5);if(motion==='reduce')assert.equal(r.reversal.coverage.status,'immediate');for(const frame of r.reversal.trace)if(frame.open)assert.equal(frame.opacity,1,'Every sampled open/outgoing decision shell stays opaque');assertPaint(await settle(page),{motion,input:'pointer',settled:true});
    // Required independent interruption: actual native jobs are paused and sampled at
    // their midpoint. This proves ownership and retargeting, not natural70ms timing.
    await page.locator('#dialog-1 [autofocus]').click();await waitClosed(page);
    r.controlled=await controlledInterruption(page);save();assertControlled(r.controlled);if(motion==='no-preference'){assertPaint(r.controlled.entryMidpoint,{motion,input:'pointer'});assertPaint(r.controlled.exitPaint,{motion,input:'pointer',outgoing:true});assertPaint(r.controlled.reopenPaint,{motion,input:'pointer'});}r.controlled.settled=await settle(page);save();assertPaint(r.controlled.settled,{motion,input:'pointer',settled:true});
    if(motion==='no-preference'){await page.emulateMedia({reducedMotion:'reduce'});r.liveReduction=await settle(page);assertPaint(r.liveReduction,{motion:'reduce',input:'pointer',settled:true});}
    await page.locator('#dialog-1 [autofocus]').click();await waitClosed(page);if(motion==='no-preference')await page.emulateMedia({reducedMotion:motion});
    assert.equal(await page.locator('#dialog-1').evaluate(d=>d.getAnimations({subtree:true}).length),0);assert.equal(await page.locator('#dialog-trigger').getAttribute('aria-expanded'),'false');const project=page.locator('.stage:has(#dialog-1) > .settings-card');assert(await project.isVisible(),'The actual Dialog project mock stays visible');assert((await project.textContent()).includes('Aurora website'),'The actual Dialog stage retains Aurora content');
    if(route==='detail'){await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#library-detail').open);assert(await page.locator('[data-detail=dialog]').evaluate(e=>e===document.activeElement));assert(await page.locator('[data-key=dialog] .stage').count());}
   }
   // The native reduced contract also holds with optional foreground Blur switched off.
   await page.locator('label.blur-switch').click();assert.equal(await page.locator('#blur-toggle').isChecked(),false);await page.locator('#dialog-trigger').click();run.blurOff=await settle(page);assertPaint(run.blurOff,{motion,input:'pointer',settled:true});assert.equal(run.blurOff.blur,false);await page.evaluate(()=>{window.__demoConfirmation=null;document.querySelector('#dialog-1 .dialog-destructive').addEventListener('click',e=>{window.__demoConfirmation={trusted:e.isTrusted,label:e.target.textContent.trim(),kind:'Demo confirmation only; no backend or real deletion'};},{once:true});});await page.locator('#dialog-1 .dialog-destructive').click();await waitClosed(page);run.demoConfirmation=await page.evaluate(()=>window.__demoConfirmation);assert(run.demoConfirmation.trusted&&run.demoConfirmation.label==='Delete project');assert(await page.locator('#dialog-trigger').evaluate(e=>e===document.activeElement),'Demo confirmation returns focus to its invoker');const remainingProject=page.locator('.stage:has(#dialog-1) > .settings-card');assert(await remainingProject.isVisible());assert((await remainingProject.textContent()).includes('Aurora website'),'Demo confirmation preserves actual project mock content');
   assert.deepEqual(errors,[]);run.status='passed';
  }catch(e){run.status='failed';run.error=e.stack;await retainSettlementFailure(page,run);save();await page.screenshot({path:join(out,`${label}-FAILED.png`),animations:'allow'}).catch(()=>{});}
  finally{run.pageErrors=errors;save();await context.close();console.log(`${label}: ${run.status}`);}
 }
}finally{await browser.close();save(true);}
console.log(JSON.stringify({passed:report.runs.filter(r=>r.status==='passed').length,total:report.runs.length,naturalCovered:report.runs.flatMap(r=>r.routes).filter(r=>r.reversal?.coverage.status==='covered').length,naturalBlocked:report.runs.flatMap(r=>r.routes).filter(r=>r.reversal?.coverage.status==='blocked').length,reducedImmediate:report.runs.flatMap(r=>r.routes).filter(r=>r.controlled?.status==='immediate').length,controlledObserved:report.runs.flatMap(r=>r.routes).filter(r=>r.controlled?.status==='observed').length,out}));if(report.runs.some(r=>r.status!=='passed'))process.exitCode=1;
