// Evidence helpers only. No product styles, runtime, clock, or input are replaced.
import assert from 'node:assert/strict';
export const fixturePins = Object.freeze({
 'gallery.html':'39551a459e9d12a60c7478e0c140c6fb3fa7d1ad03112056c021ed5f4bd41ff6',
 'gallery.js':'c18397f5d7cb07cb9b7df9b86e34196a5e2f8ade7c32b1766173df02d6b18763',
 'seenry-transitions.css':'f406e5bc49f5fa7f991336c8c433386f4f19597100ed8b8b93dd0ccc35c7cf4f',
 'seenry-transitions.js':'b7124d8c148a5b0d42a09b03c815b17a26be603d4c76f6f6ef487fb6f7ce3025',
});
export const spacingCSS = ':root:not(#seenry-dialog-spacing-probe) *{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}:root:not(#seenry-dialog-spacing-probe) p{margin-block-end:2em!important}';
export function within(a,b){return !!a&&!!b&&[a.left,a.right,a.top,a.bottom,a.width,a.height,b.left,b.right,b.top,b.bottom].every(Number.isFinite)&&a.width>0&&a.height>0&&a.left>=b.left-1&&a.right<=b.right+1&&a.top>=b.top-1&&a.bottom<=b.bottom+1;}
export function scale97(transform){const m=/^matrix\(([^()]*)\)$/.exec(transform||'');if(!m)return false;const fields=m[1].split(',').map(s=>s.trim());if(fields.length!==6||fields.some(s=>!/^[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?$/i.test(s)))return false;return fields.map(Number).every((n,i)=>Math.abs(n-[.97,0,0,.97,0,0][i])<.001);}
export function nativeCloseRetirement(job,result){return result.requireOpen===false&&result.snapshot?.open===false&&result.snapshot?.modal===false&&result.snapshot?.inert===true&&job.outcome==='cancelled'&&job.disposition==='native-close-retired'&&job.retirementState?.open===false&&job.retirementState?.modal===false&&job.retirementState?.inert===true&&['Cancel','Delete'].includes(job.owner)&&job.kind==='CSSTransition'&&job.pseudo===null&&Array.isArray(job.properties)&&job.properties.length>0&&job.properties.every(p=>['transform','backgroundColor','color','boxShadow'].includes(p));}
export function assertSettlement(result){
 assert.equal(result?.status,'settled','Bounded native settlement must succeed');assert(result.quietFrames>=2);assert(Array.isArray(result.quietRAFAt)&&result.quietRAFAt.length>=2&&result.quietRAFAt.every((t,i)=>Number.isFinite(t)&&(i===0||t>result.quietRAFAt[i-1])),'Two distinct actual RAF callbacks required');assert.equal(result.quietFrames,result.quietRAFAt.length);assert(Array.isArray(result.jobs));assert.equal(result.afterJobs.length,0);assert(Number.isFinite(result.startedAt)&&Number.isFinite(result.finishedAt)&&result.finishedAt>=result.startedAt);assert(result.finishedAt-result.startedAt<result.timeoutMs);
 for(const j of result.jobs){assert(['Invoker','Cancel','Delete','Dialog','Blur'].includes(j.owner),'Actual owned target required');assert(Array.isArray(j.properties)&&j.properties.length>0);assert(Number.isFinite(j.duration)&&j.duration>=0&&Number.isFinite(j.endTime)&&j.endTime>=0,'Finite native job timing required');assert(j.outcome==='finished'||nativeCloseRetirement(j,result),'Only an observed descendant feedback retirement at native close is allowed; held or modal-owner cancellation fails');assert.equal(j.pending,false);assert(['finished','idle'].includes(j.playState));}
}
export function opaqueComputedColor(value){
 if(typeof value!=='string')return false;
 const text=value.trim();let match=/^rgba?\(([^()]*)\)$/.exec(text);if(!match)match=/^color\(srgb\s+([^()]*)\)$/.exec(text);if(!match)return false;
 const halves=match[1].split('/');if(halves.length>2)return false;const bits=halves[0].trim().split(/[,\s]+/);if(![3,4].includes(bits.length)||(bits.length===4&&halves.length===2))return false;const alpha=halves[1]?.trim()??bits[3]??'1';
 if([...bits.slice(0,3),alpha].some(t=>!/^[-+]?(?:\d+\.?\d*|\.\d+)%?$/.test(t)))return false;
 const n=alpha.endsWith('%')?Number(alpha.slice(0,-1))/100:Number(alpha);return n===1;
}
export function appendBounded(run,key,value,limit=100){
 assert(Number.isInteger(limit)&&limit>0);run.inventory??={};const meta=run.inventory[key]??={limit,total:0,dropped:0,overflow:false};assert.equal(meta.limit,limit);run[key]??=[];meta.total++;if(run[key].length<limit)run[key].push(value);else{meta.dropped++;meta.overflow=true;run.inventoryIncomplete=true;}
}
export async function boundedFontsReady({timeoutMs=2500}={}){
 if(!Number.isFinite(timeoutMs)||timeoutMs<=0)throw Error('Invalid font readiness deadline');
 const r=window.__dialogFontsReadiness={status:'waiting',startedAt:performance.now(),timeoutMs};let timer;
 try{await Promise.race([document.fonts.ready,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Font readiness deadline exceeded')),timeoutMs);})]);r.status='ready';return r;}catch(error){r.status='failed';r.error=String(error);throw error;}finally{clearTimeout(timer);r.finishedAt=performance.now();}
}
export function assertControl(state,name,phase){
 const c=state.controls[name];assert(c&&c.identity===name);assert(c.connected&&c.enabled&&c.hitOwned,'Intended control owns the native hit point');assert(within(c.rect,state.viewport),'Control must be inside current visible viewport');assert(c.textRects.length>0&&c.textRects.every(r=>within(r,c.rect)),'Control text fits actual control');assert(c.chain.length>0&&c.chain.every(s=>s.opacity===1&&s.filter==='none'&&s.visibility==='visible'&&s.display!=='none'),'Control paint is actually visible');assert(c.rect.width>=24&&c.rect.height>=24);assert(state.pointer.fine&&state.pointer.hover&&!state.pointer.coarse,'Labeled pointer evidence must use native fine hover input');
 if(name!=='Invoker'){assert(state.open&&state.modal&&!state.inert&&state.expanded==='true');assert(within(c.rect,state.dialog.rect));}
 if(phase==='rest'){assert.equal(c.active,false);assert.equal(c.hover,false);assert.equal(c.transform,'none');}
 if(phase==='hover'){assert.equal(c.hover,true);assert.equal(c.active,false);assert.equal(c.transform,'none','Ordinary hover stays stationary');}
 if(phase==='held'){assert.equal(c.active,true,'Pointer is still held on actual intended control');assert.equal(c.hover,true);assert.equal(c.focused,true);assert(scale97(c.transform),'Authored .97 native held transform must finish');}
 if(phase==='keyboard-focus'){assert(c.focused&&c.focusVisible&&parseFloat(c.outlineWidth)>=2&&c.outlineStyle!=='none'&&opaqueComputedColor(c.outlineColor),'Opaque computed focus outline required; this does not establish raster contrast');}
}
export function assertTrustedSequence(events,name){
 assert(Array.isArray(events));const sequence=events.filter(e=>['pointerdown','pointerup','click'].includes(e.type));assert.equal(sequence.length,3,'Exactly one intended pointer cycle required');
 for(const [i,type] of ['pointerdown','pointerup','click'].entries()){const e=sequence[i];assert(e.type===type&&e.control===name&&e.trusted===true&&e.boundary==='post-production-document-bubble','Intended trusted down/up/click order required');assert([e.eventAt,e.eventTimeStamp,e.snapshotStartAt,e.snapshotEndAt].every(Number.isFinite)&&e.snapshotStartAt>=e.eventAt&&e.snapshotEndAt>=e.snapshotStartAt,'Event timestamp precedes snapshot work');if(i){const prior=sequence[i-1];assert(e.eventAt>=prior.snapshotEndAt&&e.eventTimeStamp>=prior.eventTimeStamp,'Native event clocks must be monotonic');}assert.equal(e.button,0);if(type==='click')assert(e.detail>0);else {assert(Number.isInteger(e.pointerId)&&e.pointerId>0);assert.equal(e.buttons,type==='pointerdown'?1:0);}}
 assert.equal(sequence[0].pointerId,sequence[1].pointerId,'Release must belong to the held native pointer');
}
export function assertClosedOutcome(s){assert(!s.open&&!s.modal&&s.inert&&s.expanded==='false');assert.equal(s.focus,'Invoker');assert.equal(s.controls.Invoker.active,false);assert.equal(s.controls.Invoker.transform,'none');assert(s.controls.Invoker.hitOwned&&within(s.controls.Invoker.rect,s.viewport));}
export function assertSpacing(s){
 assert.equal(s.viewport.width,320);assert(s.open&&s.modal&&!s.inert);assert(within(s.dialog.rect,s.viewport));
 for(const p of [s.heading,s.description,s.controls.Cancel,s.controls.Delete]){const f=parseFloat(p.fontSize);assert(f>0);for(const [actual,multiplier] of [[p.lineHeight,1.5],[p.letterSpacing,.12],[p.wordSpacing,.16]])assert(Math.abs(parseFloat(actual)-f*multiplier)<.06,'Actual four-property spacing must be applied');}
 assert(Math.abs(parseFloat(s.description.marginBlockEnd)-2*parseFloat(s.description.fontSize))<.06);
 for(const name of ['Cancel','Delete']){const c=s.controls[name];assert(c.hitOwned&&c.enabled&&within(c.rect,s.dialog.rect)&&within(c.rect,s.viewport));assert(c.textRects.length&&c.textRects.every(r=>within(r,c.rect)));}
 assert(s.heading.textRects.length&&s.description.textRects.length);assert([...s.heading.textRects,...s.description.textRects].every(r=>within(r,s.dialog.rect)),'Decision copy must remain reachable');
}
export function assertZoom200(before,after){
 assert(before&&after&&[before.dpr,after.dpr,before.innerWidth,after.innerWidth,before.outerWidth,after.outerWidth,before.outerHeight,after.outerHeight,before.visualScale,after.visualScale].every(Number.isFinite));
 assert([before.dpr,after.dpr,before.innerWidth,after.innerWidth,before.outerWidth,after.outerWidth,before.outerHeight,after.outerHeight].every(v=>v>0),'Positive native window metrics required');
 assert(Math.abs(after.dpr/before.dpr-2)<.01,'Actual layout zoom must double DPR');assert(Math.abs(before.innerWidth/after.innerWidth-2)<.01,'Actual browser zoom must halve the CSS viewport at a fixed window');assert.equal(after.outerWidth,before.outerWidth);assert.equal(after.outerHeight,before.outerHeight);assert.equal(before.visualScale,1);assert.equal(after.visualScale,1,'Pinch/page scale is not browser zoom');assert.equal(after.cssZoom,before.cssZoom);assert.equal(after.cssZoom,'1');
}
// Runs in the page AFTER production scripts and their event delegates are installed.
export function installSupplement(){
 const d=document.querySelector('#dialog-1'),t=document.querySelector('#dialog-trigger'),cancel=d.querySelector('[autofocus]'),del=d.querySelector('.dialog-destructive'),blur=document.querySelector('#blur-toggle');
 const controlEntries=[['Invoker',t],['Cancel',cancel],['Delete',del],['Blur',blur]];
 const identity=e=>controlEntries.find(([,n])=>n===e||n.contains(e))?.[0]||null;
 const log=window.__dialogSupplement={phase:'setup',events:[],settlements:[],overflow:false};
 const cheap=()=>({open:d.open,modal:d.matches(':modal'),inert:d.inert,expanded:t.getAttribute('aria-expanded'),presentation:d.dataset.stOpen,focus:identity(document.activeElement)||document.activeElement?.tagName,active:controlEntries.filter(([,n])=>n.matches(':active')).map(([name])=>name)});
 const push=(e,boundary)=>{const eventAt=performance.now(),entry={type:e.type,eventAt,eventTimeStamp:e.timeStamp,phase:log.phase,control:identity(e.target),trusted:e.isTrusted,detail:e.detail??null,pointerId:e.pointerId??null,button:e.button??null,buttons:e.buttons??null,key:e.key||null,boundary,defaultPrevented:e.defaultPrevented,snapshotStartAt:performance.now()};entry.state=cheap();entry.snapshotEndAt=performance.now();if(log.events.length<200)log.events.push(entry);else log.overflow=true;};
 for(const type of ['pointerdown','pointerup','click','keydown','change'])document.addEventListener(type,e=>{if(identity(e.target)||(e.key==='Escape'&&d.open))push(e,'post-production-document-bubble');});
 // cancel listeners run after the production listener, but still before any unprevented UA default.
 d.addEventListener('cancel',e=>push(e,'post-production-cancel-listener-before-UA-default'));
 d.addEventListener('close',e=>push(e,'native-close-event-after-UA-close'));
 const rect=e=>e.getBoundingClientRect().toJSON();
 const paint=e=>{const c=getComputedStyle(e),r=rect(e),x=(r.left+r.right)/2,y=(r.top+r.bottom)/2,hit=document.elementFromPoint(x,y),range=document.createRange();range.selectNodeContents(e);const chain=[];for(let n=e;n;n=n.parentElement){const s=getComputedStyle(n);chain.push({tag:n.tagName,id:n.id,display:s.display,visibility:s.visibility,opacity:Number(s.opacity),filter:s.filter,background:s.backgroundColor});}return {identity:identity(e),text:e.textContent.trim(),connected:e.isConnected,enabled:!e.disabled,rect:r,textRects:[...range.getClientRects()].filter(r=>r.width&&r.height).map(r=>r.toJSON()),hitOwned:hit===e||e.contains(hit),hit:hit?.id||hit?.className||hit?.tagName,hover:e.matches(':hover'),active:e.matches(':active'),focused:document.activeElement===e,focusVisible:e.matches(':focus-visible'),color:c.color,background:c.backgroundColor,boxShadow:c.boxShadow,opacity:Number(c.opacity),filter:c.filter,transform:c.transform,outlineWidth:c.outlineWidth,outlineStyle:c.outlineStyle,outlineColor:c.outlineColor,outlineOffset:c.outlineOffset,fontSize:c.fontSize,lineHeight:c.lineHeight,letterSpacing:c.letterSpacing,wordSpacing:c.wordSpacing,marginBlockEnd:c.marginBlockEnd,chain};};
 const jobRecord=a=>{const effect=a.effect,target=effect?.target,timing=effect?.getComputedTiming();return {kind:a.constructor?.name||null,owner:target===d?'Dialog':identity(target)||(blur.closest('label').contains(target)?'Blur':null),pseudo:effect?.pseudoElement||null,properties:[...new Set((effect?.getKeyframes()||[]).flatMap(k=>Object.keys(k).filter(p=>!['offset','computedOffset','easing','composite'].includes(p))))],playState:a.playState,pending:a.pending,currentTime:a.currentTime,duration:timing?.duration,endTime:timing?.endTime};};
 const ownedJobs=()=>[...new Set([t,d,blur.closest('label')].flatMap(n=>n.getAnimations({subtree:true})))];
 window.__supplementState=()=>{const snapshotStartAt=performance.now(),backdrop=getComputedStyle(d,'::backdrop'),state={snapshotStartAt,...cheap(),viewport:{left:0,top:0,right:innerWidth,bottom:innerHeight,width:innerWidth,height:innerHeight},pointer:{fine:matchMedia('(pointer:fine)').matches,coarse:matchMedia('(pointer:coarse)').matches,hover:matchMedia('(hover:hover)').matches},dialog:paint(d),controls:Object.fromEntries(controlEntries.slice(0,3).map(([name,n])=>[name,paint(n)])),heading:paint(d.querySelector('#dlg-title')),description:paint(d.querySelector('#dlg-description')),backdrop:{opacity:backdrop.opacity,background:backdrop.backgroundColor,filter:backdrop.filter,backdropFilter:backdrop.getPropertyValue('backdrop-filter'),webkitBackdropFilter:backdrop.getPropertyValue('-webkit-backdrop-filter')},blur:{visibleLabel:blur.closest('label').querySelector('span').textContent.trim(),ariaLabel:blur.getAttribute('aria-label'),role:blur.getAttribute('role'),checked:blur.checked,rootAttribute:document.documentElement.hasAttribute('data-st-blur')},animations:ownedJobs().map(jobRecord)};state.snapshotEndAt=performance.now();return state;};
 window.__supplementSettle=({timeoutMs=1800,requireOpen=null}={})=>new Promise((resolve,reject)=>{
  const startedAt=performance.now(),seen=new Map(),observations=[];let quietFrames=0,quietRAFAt=[],lastRAFAt=null,done=false,raf,timer;
  const result={status:'running',startedAt,timeoutMs,requireOpen,quietFrames:0,jobs:[],observations};
  log.settlements.push(result);
  const cleanup=()=>{cancelAnimationFrame(raf);clearTimeout(timer);};
  const finish=(status,error)=>{if(done)return;done=true;cleanup();result.status=status;result.error=error?String(error):null;result.finishedAt=performance.now();result.quietFrames=quietFrames;result.quietRAFAt=[...quietRAFAt];result.jobs=[...seen.values()];result.afterJobs=ownedJobs().map(jobRecord);if(status==='settled')resolve(result);else reject(new Error(result.error||status));};
  const register=jobs=>{for(const a of jobs)if(!seen.has(a)){const row={...jobRecord(a),firstObservedAt:performance.now(),outcome:'pending'};seen.set(a,row);a.finished.then(()=>{Object.assign(row,jobRecord(a),{outcome:'finished',completedAt:performance.now()});},error=>{Object.assign(row,jobRecord(a),{outcome:'cancelled',completedAt:performance.now(),error:String(error),retirementState:{open:d.open,modal:d.matches(':modal'),inert:d.inert}});if(requireOpen===false&&!d.open&&!d.matches(':modal')&&d.inert&&['Cancel','Delete'].includes(row.owner)&&row.kind==='CSSTransition'&&row.pseudo===null&&row.properties.length&&row.properties.every(p=>['transform','backgroundColor','color','boxShadow'].includes(p)))row.disposition='native-close-retired';});}};
  const check=(rafAt=null)=>{if(done)return;try{if(performance.now()-startedAt>=timeoutMs)throw Error('Native settlement deadline exceeded');if(!d.isConnected||!t.isConnected)throw Error('Owned Dialog or invoker disconnected');if(requireOpen===true&&(!d.open||!d.matches(':modal')||d.inert))throw Error('Active native modal ownership lost');if(requireOpen===false&&(d.open||d.matches(':modal'))) {quietFrames=0;}const jobs=ownedJobs();register(jobs);if(observations.length<130)observations.push({at:performance.now(),boundary:rafAt===null?'synchronous-inventory':'actual-RAF',rafAt,jobs:jobs.map(jobRecord)});else throw Error('Bounded observation budget exceeded');const clean=jobs.length===0&&[...seen.values()].every(j=>j.outcome==='finished'||j.disposition==='native-close-retired')&&(requireOpen===null||(requireOpen===true?d.open&&!d.inert:!d.open));if(!clean){quietFrames=0;quietRAFAt=[];}else if(Number.isFinite(rafAt)&&(lastRAFAt===null||rafAt>lastRAFAt)){quietFrames++;quietRAFAt.push(rafAt);}if(Number.isFinite(rafAt))lastRAFAt=lastRAFAt===null?rafAt:Math.max(lastRAFAt,rafAt);if([...seen.values()].some(j=>j.outcome==='cancelled'&&j.disposition!=='native-close-retired'))throw Error('Owned native job cancelled during endpoint settlement');if(quietFrames>=2){const s=window.__supplementState();register(ownedJobs());if(performance.now()-startedAt>=timeoutMs)throw Error('Native settlement deadline exceeded during snapshot');if(s.animations.length===0&&ownedJobs().length===0){result.snapshot=s;finish('settled');return;}quietFrames=0;quietRAFAt=[];}raf=requestAnimationFrame(check);}catch(error){finish('failed',error);}};
  timer=setTimeout(()=>finish('failed','Native settlement deadline exceeded'),timeoutMs);check();
 });
}
// Standalone in-page observer so its lifecycle is executable without a browser.
export function startPerformanceProbe({rafLimit=500,longTaskLimit=128,deadlineMs=8000}={}){
 if(!Number.isInteger(rafLimit)||rafLimit<3||!Number.isInteger(longTaskLimit)||longTaskLimit<1||!Number.isFinite(deadlineMs)||deadlineMs<=0)throw Error('Invalid performance budgets');
 const p=window.__supplementPerf={status:'running',startedAt:performance.now(),finishedAt:null,rafTimes:[],longTasks:[],supported:PerformanceObserver.supportedEntryTypes.includes('longtask'),stopped:false,incomplete:false,limits:{raf:rafLimit,longTasks:longTaskLimit,deadlineMs},limitsReached:{raf:false,longTasks:false},overflow:{raf:false,longTasks:false},dropped:{raf:0,longTasks:0}};
 let observer=null,raf=null,timer=null;
 const append=entries=>{const room=Math.max(0,longTaskLimit-p.longTasks.length),keep=Math.min(room,entries.length);for(let i=0;i<keep;i++){const e=entries[i];p.longTasks.push({startTime:e.startTime,duration:e.duration,name:e.name,attribution:(e.attribution||[]).map(a=>({name:a.name,containerType:a.containerType}))});}if(entries.length>keep){p.dropped.longTasks+=entries.length-keep;p.overflow.longTasks=true;p.incomplete=true;}if(p.longTasks.length>=longTaskLimit){p.limitsReached.longTasks=true;p.incomplete=true;}};
 const finish=(reason='completed')=>{if(p.stopped)return p;p.stopped=true;p.finishedAt=performance.now();p.stopReason=reason;p.incomplete ||= reason!=='completed';cancelAnimationFrame(raf);clearTimeout(timer);p.drainStartedAt=performance.now();try{if(observer)append(observer.takeRecords());}catch(error){p.drainError=String(error);p.incomplete=true;}finally{if(observer)try{observer.disconnect();p.observerDisconnected=true;}catch(error){p.disconnectError=String(error);p.incomplete=true;}else p.observerDisconnected=true;p.drainFinishedAt=performance.now();window.removeEventListener('pagehide',onHide);}p.status=p.incomplete?'incomplete':'complete';return p;};
 const onHide=()=>finish('pagehide');window.addEventListener('pagehide',onHide);
 window.__supplementStopPerf=finish;
 if(p.supported){observer=new PerformanceObserver(list=>{if(p.stopped)return;append(list.getEntries());if(p.limitsReached.longTasks)finish('long-task-cap');});observer.observe({type:'longtask',buffered:false});}
 const tick=at=>{if(p.stopped)return;if(p.rafTimes.length<rafLimit)p.rafTimes.push(at);else{p.dropped.raf++;p.overflow.raf=true;}if(p.rafTimes.length>=rafLimit){p.limitsReached.raf=true;finish('raf-cap');return;}raf=requestAnimationFrame(tick);};raf=requestAnimationFrame(tick);timer=setTimeout(()=>finish('deadline'),deadlineMs);
 return {startedAt:p.startedAt,longTasksSupported:p.supported,limits:p.limits};
}
// Host-side finally owns stop/drain/save BEFORE detaching CDP, for every flow outcome.
export async function collectPerformanceFlow({page,session,run,save,flow}){
 let flowError=null,completed=false;run.performanceFinalizationErrors=[];let before=null,after=null;
 try{await session.send('Performance.enable');before=await session.send('Performance.getMetrics');run.perfStart=await page.evaluate(startPerformanceProbe);await flow();completed=true;}catch(error){flowError=error;run.performanceFlowError=error.stack||String(error);}
 finally{
  try{try{run.performance=await page.evaluate(completed=>window.__supplementStopPerf?.(completed?'completed':'flow-failed')??window.__supplementPerf??null,completed);if(!run.performance)run.performanceFinalizationErrors.push('Performance probe was unavailable or never started');}catch(error){run.performanceFinalizationErrors.push('Stop/drain unavailable: '+String(error));}
   try{after=await session.send('Performance.getMetrics');}catch(error){run.performanceFinalizationErrors.push('Final CDP metrics unavailable: '+String(error));}
   run.cdpMetrics={before,after,deltas:before&&after?Object.fromEntries(['TaskDuration','ScriptDuration','LayoutDuration','RecalcStyleDuration','LayoutCount','RecalcStyleCount'].map(name=>[name,after.metrics.find(m=>m.name===name)?.value-before.metrics.find(m=>m.name===name)?.value])):null};save();
  }finally{try{await session.detach();}catch(error){run.performanceFinalizationErrors.push('CDP detach failed: '+String(error));}save();}
 }
 if(flowError)throw flowError;
 assert.equal(run.performanceFinalizationErrors.length,0,'Performance finalization incomplete');assert.equal(run.performance?.status,'complete','Performance budget/observer incomplete');assert(run.performance.stopped&&run.performance.observerDisconnected&&Number.isFinite(run.performance.finishedAt));
 return run.performance;
}

// Host finalization reconciles late native page errors after each awaited close.
export function reconcileSupplementCase(run){
 const reasons=[];
 if(run.pageErrors?.length)reasons.push('Page errors recorded through finalization');
 if(run.inventoryIncomplete)reasons.push('Console/error/request inventory incomplete after finalization');
 if(run.closeError)reasons.push('Context close failed');
 if(!run.collectionComplete)reasons.push('Case collection did not complete');
 if(run.status==='failed'||run.error||reasons.length){run.status='failed';run.error??=reasons.join('; ')||'Case failed';}
 else if(run.status==='running')run.status='captured';
 else if(!['captured','blocked'].includes(run.status)){run.status='failed';run.error='Unexpected nonterminal case status';}
 return run.status;
}
export async function finalizeSupplementCase(run,closeContext){
 try{await closeContext();}catch(error){run.closeError=error.stack||String(error);}
 return reconcileSupplementCase(run);
}
export async function finalizeSupplementReport(report,closeBrowser){
 try{await closeBrowser();}catch(error){report.browserCloseError=error.stack||String(error);}
 for(const run of report.runs)reconcileSupplementCase(run);
 const failed=!!(report.fatalError||report.bootstrapError||report.browserCloseError||!report.runs.length||report.runs.some(run=>run.status==='failed'));
 report.status=failed?'failed':'collected';
 return {status:report.status,exitCode:failed?1:0};
}
