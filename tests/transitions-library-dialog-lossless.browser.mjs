// CI-only, source-unchanged native PNG evidence. This is not a quality/performance gate.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,copyFileSync,readdirSync} from 'node:fs';
import {resolve,dirname,join,relative} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {atNaturalOwnedTransformProgress} from './dialog-lossless-progress.mjs';
import {FrameArchive,finalizeCase,finalizeDiagnosticReport,SOURCE_PINS,PRODUCT_BASELINE,sha256,hostClock,statistics,naturalCoverage} from './dialog-lossless-core.mjs';
const arg=(name,fallback)=>{const n=process.argv.indexOf(name);return n<0?fallback:process.argv[n+1];};
// No local launch, installation, browser fallback or new grants are supported here.
assert.equal(process.env.GITHUB_ACTIONS,'true','This diagnostic may only launch inside the existing authorized GitHub Actions job');
assert.equal(process.env.CI,'true','CI=true required');
const width=Number(arg('--width','320'));assert([320,1440].includes(width),'Only a single 320 or 1440 light/normal profile per invocation');
const height=780,modulePath=resolve(arg('--playwright','node_modules/playwright/index.mjs'));
const gallery=resolve(arg('--gallery',fileURLToPath(new URL('../skills/seenry/assets/components/transitions/gallery.html',import.meta.url))));
const out=resolve(arg('--out',`dialog-lossless-${width}`));mkdirSync(out,{recursive:true});
const report={schema:'seenry-dialog-native-lossless-v1',profile:{width,height,deviceScaleFactor:1,theme:'light',motion:'no-preference'},productBaselineCommit:PRODUCT_BASELINE,started:hostClock(),status:'initializing',runs:[],errors:[],scope:'Trusted pointer entry/Cancel, then trusted pointer entry with labeled timed API close/reopen and final API exit. A third, separately labeled unpaused progress-gated API cycle supplements the requested70ms route. No pauses, animation writes, product edits, resampling or codec conversion. Lossless PNGs describe received CDP frames, not complete display coverage. No performance 9 or quality score.',clockContract:{browser:'performance.now milliseconds with reported performance.timeOrigin; RAF and long-task values use browser timeline',nativeFrames:'Unchanged CDP metadata; timestamp epoch seconds and optional monotonicTimestamp native seconds',host:'Node performance.now and Date.now sampled separately at receive, ACK, write and action-call boundaries',alignment:'not calibrated; no cross-domain subtraction or frame-to-action synchronization claims'},limits:{softProfileMs:65000,hardProfileMs:80000,captureMs:15000,maxFrames:600,maxPngBytes:100663296,maxPendingWrites:8}};
const save=()=>writeFileSync(join(out,'results.json'),JSON.stringify(report,null,2)+'\n');
let browser,softTimer,hardTimer;
function error(kind,e){report.errors.push({kind,host:hostClock(),error:e?.stack||String(e)});save();}
function filesIn(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?filesIn(join(dir,e.name)):[join(dir,e.name)]);}
function installObserver(){
 const d=document.querySelector('#dialog-1'),t=document.querySelector('#dialog-trigger');
 const ids=new WeakMap();let next=1,raf,observer;
 const log=window.__dialogLossless={timeOrigin:performance.timeOrigin,startedAt:performance.now(),phase:'rest',actions:[],accepted:[],input:[],raf:[],longTasks:[],observerCallbackMs:[],overflow:false,apiDone:false};
 const bounded=(array,value,max=2048)=>{if(array.length<max)array.push(value);else log.overflow=true;};
 const animations=()=>d.getAnimations({subtree:true}).map(a=>{
  if(!ids.has(a))ids.set(a,next++);const effect=a.effect,timing=effect?.getComputedTiming(),keys=effect?.getKeyframes()||[],target=effect?.target;
  return {id:ids.get(a),target:target?.id||target?.tagName||null,targetRelationship:target===d?'surface':target&&d.contains(target)?'descendant':'outside',pseudo:effect?.pseudoElement||null,properties:[...new Set(keys.flatMap(k=>Object.keys(k).filter(p=>!['offset','computedOffset','easing','composite'].includes(p))))],playState:a.playState,pending:a.pending,currentTime:a.currentTime,startTime:a.startTime,playbackRate:a.playbackRate,duration:timing?.duration,endTime:timing?.endTime,progress:timing?.progress,endTransform:keys.at(-1)?.transform||null,keyframes:keys};
 });
 window.__dialogLosslessSnapshot=()=>{const started=performance.now(),s=getComputedStyle(d),b=getComputedStyle(d,'::backdrop'),a=document.activeElement;const state={at:started,phase:log.phase,open:d.open,modal:d.matches(':modal'),inert:d.inert,presentation:d.dataset.stOpen,expanded:t.getAttribute('aria-expanded'),focus:a===t?'trigger':a===d.querySelector('[autofocus]')?'Cancel':a===d.querySelector('.dialog-destructive')?'Delete':a.tagName,focusVisible:a.matches(':focus-visible'),opacity:Number(s.opacity),filter:s.filter,transform:s.transform,rect:d.getBoundingClientRect().toJSON(),backdropOpacity:Number(b.opacity),backdropFilter:b.getPropertyValue('backdrop-filter'),reduce:matchMedia('(prefers-reduced-motion:reduce)').matches,animations:animations()};state.snapshotEndAt=performance.now();return state;};
 window.__dialogLosslessMark=kind=>{const value={kind,state:window.__dialogLosslessSnapshot()};value.elapsedSinceTimerOriginMs=Number.isFinite(log.timerOrigin)?value.state.at-log.timerOrigin:null;bounded(log.actions,value,100);return value.state;};
 document.addEventListener('click',e=>{
  const isTrigger=e.target===t||t.contains(e.target),control=e.target.closest('[data-st-close]');
  if(!isTrigger&&!(control&&d.contains(control)))return;
  bounded(log.accepted,{kind:isTrigger?'open':'Cancel',trusted:e.isTrusted,detail:e.detail,control:isTrigger?'trigger':control.textContent.trim(),state:window.__dialogLosslessSnapshot()},24);
 });
 for(const type of ['pointerdown','pointerup','click'])document.addEventListener(type,e=>{if(e.target===t||t.contains(e.target)||d.contains(e.target))bounded(log.input,{type,at:performance.now(),phase:log.phase,trusted:e.isTrusted,detail:e.detail,target:e.target===t?'trigger':e.target.closest('[data-st-close]')?.textContent.trim()||e.target.tagName},80);},true);
 const tick=timestamp=>{const start=performance.now();bounded(log.raf,{timestamp,callbackAt:start});bounded(log.observerCallbackMs,performance.now()-start);raf=requestAnimationFrame(tick);};
 raf=requestAnimationFrame(tick);
 log.longTaskSupported=PerformanceObserver.supportedEntryTypes.includes('longtask');
 if(log.longTaskSupported){observer=new PerformanceObserver(list=>{for(const e of list.getEntries())bounded(log.longTasks,{startTime:e.startTime,duration:e.duration,name:e.name},100);});observer.observe({type:'longtask',buffered:false});}
 window.__dialogLosslessFinish=()=>{cancelAnimationFrame(raf);if(observer){for(const e of observer.takeRecords())bounded(log.longTasks,{startTime:e.startTime,duration:e.duration,name:e.name},100);observer.disconnect();}log.endedAt=performance.now();return log;};
}
async function phase(page,name){await page.evaluate(name=>{window.__dialogLossless.phase=name;},name);}
async function mark(page,name){return page.evaluate(name=>window.__dialogLosslessMark(name),name);}
const waitOpen=page=>page.waitForFunction(()=>{const d=document.querySelector('#dialog-1');return d.open&&d.matches(':modal')&&!d.inert&&d.dataset.stOpen==='true';});
const waitClosed=page=>page.waitForFunction(()=>{const d=document.querySelector('#dialog-1');return !d.open&&!d.matches(':modal')&&d.dataset.stOpen==='false';});
async function action(run,name,fn){const item={name,hostCall:hostClock()};run.hostActions.push(item);try{return await fn();}finally{item.hostReturn=hostClock();}}
async function scenario(page,run){
 await page.evaluate(()=>{const l=window.__dialogLossless;l.raf=[];l.longTasks=[];l.observerCallbackMs=[];l.startedAt=performance.now();});
 await mark(page,'rest');await page.waitForTimeout(150);
 await phase(page,'trusted-pointer-entry');await action(run,'trusted-pointer-entry',()=>page.locator('#dialog-trigger').click());await waitOpen(page);await page.waitForTimeout(400);await mark(page,'pointer-entry-settled');
 await phase(page,'trusted-pointer-Cancel');await action(run,'trusted-pointer-Cancel',()=>page.locator('#dialog-1 [autofocus]').click());await waitClosed(page);await page.waitForTimeout(200);await mark(page,'pointer-closed');
 await phase(page,'trusted-entry-then-timed-API-close-reopen');
 await page.evaluate(()=>{
  const d=document.querySelector('#dialog-1'),t=document.querySelector('#dialog-trigger'),log=window.__dialogLossless;
  const owners=s=>s.animations.filter(a=>a.targetRelationship==='surface'&&!a.pseudo&&a.properties.includes('transform')).map(a=>a.id);
  const handler=e=>{
   if(e.target!==t&&!t.contains(e.target))return;document.removeEventListener('click',handler);
   log.reversalTrusted=e.isTrusted&&e.detail>0;log.timerOrigin=performance.now();
   const opening=window.__dialogLosslessMark('after-trusted-reversal-entry');log.entryOwnerIds=owners(opening);
   setTimeout(()=>{log.phase='timed-API-close';window.__dialogLosslessMark('before-API-close');SeenryTransitions.close(d);log.exitOwnerIds=owners(window.__dialogLosslessMark('after-API-close'));
    setTimeout(()=>{log.phase='timed-API-reopen';window.__dialogLosslessMark('before-API-reopen');SeenryTransitions.open(d,t);window.__dialogLosslessMark('after-API-reopen');log.apiDone=true;},70);
   },70);
  };
  document.addEventListener('click',handler); // After production document delegation.
 });
 await action(run,'trusted-reversal-entry',()=>page.locator('#dialog-trigger').click());await page.waitForFunction(()=>window.__dialogLossless.apiDone);await waitOpen(page);await page.waitForTimeout(450);await mark(page,'API-reopen-settled');
 await phase(page,'API-final-exit');await action(run,'API-final-exit',()=>page.evaluate(()=>{window.__dialogLosslessMark('before-API-final-exit');SeenryTransitions.close(document.querySelector('#dialog-1'));window.__dialogLosslessMark('after-API-final-exit');}));
 await waitClosed(page);await page.waitForTimeout(200);await mark(page,'timed-cycle-closed');
 await phase(page,'trusted-entry-then-progress-gated-API');
 await page.evaluate(()=>{
  const d=document.querySelector('#dialog-1'),t=document.querySelector('#dialog-trigger'),log=window.__dialogLossless;
  const owned=()=>d.getAnimations({subtree:false}).filter(a=>a.effect?.target===d&&!a.effect.pseudoElement&&a.effect.getKeyframes().some(k=>'transform' in k));
  const handler=async e=>{
   if(e.target!==t&&!t.contains(e.target))return;document.removeEventListener('click',handler);log.progressTrusted=e.isTrusted&&e.detail>0;log.progressActions=[];
   try{
    const entryOwners=owned();
    const close=await window.__naturalDialogProgress(d,entryOwners,()=>SeenryTransitions.close(d),{label:'progress-gated-API-close',expected:'entry',snapshot:window.__dialogLosslessSnapshot});log.progressActions.push(close);
    if(close.acted&&close.status==='observed')log.progressActions.push(await window.__naturalDialogProgress(d,owned(),()=>SeenryTransitions.open(d,t),{label:'progress-gated-API-reopen',expected:'exit',snapshot:window.__dialogLosslessSnapshot}));
   }catch(e){log.progressError=e.stack||String(e);}finally{log.progressDone=true;}
  };document.addEventListener('click',handler);
 });
 await action(run,'trusted-progress-gated-entry',()=>page.locator('#dialog-trigger').click());await page.waitForFunction(()=>window.__dialogLossless.progressDone);await page.waitForTimeout(450);await mark(page,'progress-cycle-settled');
 // Explicit API cleanup is separate from any blocked progress-gated observation.
 await phase(page,'API-progress-cycle-final-exit');await action(run,'API-progress-cycle-final-exit',()=>page.evaluate(()=>{window.__dialogLosslessMark('before-progress-final-exit');SeenryTransitions.close(document.querySelector('#dialog-1'));window.__dialogLosslessMark('after-progress-final-exit');}));
 await waitClosed(page);await page.waitForTimeout(200);await mark(page,'final-closed');
}
function verifyLifecycle(log){
 const issues=[],check=(condition,message)=>{if(!condition)issues.push(message);};
 for(const [phase,kind,control] of [['trusted-pointer-entry','open','trigger'],['trusted-pointer-Cancel','Cancel','Cancel'],['trusted-entry-then-timed-API-close-reopen','open','trigger'],['trusted-entry-then-progress-gated-API','open','trigger']])check(log.accepted.some(a=>a.state.phase===phase&&a.kind===kind&&a.control===control&&a.trusted===true&&a.detail>0),'Missing positively observed trusted '+phase);
 check(log.input.length>0&&log.input.every(e=>e.trusted===true),'Missing or untrusted native input');check(!log.overflow,'Observer trace overflow');
 for(const e of log.accepted.filter(a=>a.kind==='open'))check(e.state.open&&e.state.modal&&!e.state.inert&&e.state.opacity===1&&e.state.focus==='Cancel','Accepted pointer opening must have opaque native modal and safe focus');
 for(const a of [...log.actions,...(log.progressActions||[]).flatMap(p=>[p.before,p.after].filter(Boolean).map(state=>({kind:p.label,state})))])if(a.state.open)check(a.state.opacity===1,'Sampled open shell not opaque: '+a.kind);
 const settled=log.actions.find(a=>a.kind==='API-reopen-settled')?.state;
 check(settled?.open&&settled.modal&&!settled.inert&&settled.expanded==='true'&&settled.focus==='Cancel','Reopened lifecycle/focus did not settle');
 check(settled?.animations.filter(a=>a.targetRelationship==='surface').length===0,'Surface animations retained after reopen settlement');
 const final=log.actions.find(a=>a.kind==='final-closed')?.state;
 check(final&&!final.open&&!final.modal&&final.presentation==='false'&&final.expanded==='false'&&final.focus==='trigger','Final native closure/focus did not settle');
 check(final?.animations.length===0,'Animations retained after final closure');
 return {status:issues.length?'failed':'observed-at-action-snapshots',issues,qualification:'Lifecycle and sampled style facts only. Frame pixels require independent review; final screenshot and recorder completion are separate.'};
}
function observerSummary(log){
 const deltas=log.raf.slice(1).map((r,i)=>r.timestamp-log.raf[i].timestamp);
 return {durationMs:log.endedAt-log.startedAt,rafIntervalsMs:statistics(deltas),rafCallbackLatenessMs:statistics(log.raf.map(r=>r.callbackAt-r.timestamp)),rafOwnCallbackCostMs:statistics(log.observerCallbackMs),snapshotCostMs:statistics(log.actions.map(a=>a.state.snapshotEndAt-a.state.at)),longTaskSupported:log.longTaskSupported,longTasks:statistics(log.longTasks.filter(r=>r.startTime>=log.startedAt).map(r=>r.duration)),qualification:'Same script in fresh contexts, baseline-before/capture/baseline-after; descriptive A-B-A comparison, no causal benchmark or uninstrumented baseline. No screenshot in motion windows.'};
}
try{
 save();
 report.checkoutCommit=execFileSync('git',['rev-parse','HEAD'],{cwd:dirname(gallery),encoding:'utf8'}).trim();
 const packageFile=join(dirname(modulePath),'package.json'),pkg=JSON.parse(readFileSync(packageFile,'utf8'));assert.equal(pkg.version,'1.63.0','Use the existing pinned official Playwright 1.63.0');
 report.playwright={version:pkg.version,modulePath,packageSha256:sha256(readFileSync(packageFile))};
 report.harness=Object.fromEntries(['transitions-library-dialog-lossless.browser.mjs','dialog-lossless-core.mjs','dialog-lossless-progress.mjs'].map(n=>[n,sha256(readFileSync(new URL(n,import.meta.url)))]));
 report.source={};for(const [name,pin] of Object.entries(SOURCE_PINS)){const hash=sha256(readFileSync(join(dirname(gallery),name)));report.source[name]=hash;assert.equal(hash,pin,'Source drift: '+name);}
 report.sourceTree=filesIn(dirname(gallery)).map(f=>({path:relative(dirname(gallery),f),bytes:readFileSync(f).length,sha256:sha256(readFileSync(f))}));
 // Preserve exact four product files and harness beside the diagnostic, outside the checkout.
 mkdirSync(join(out,'source'),{recursive:true});for(const name of Object.keys(SOURCE_PINS))copyFileSync(join(dirname(gallery),name),join(out,'source',name));
 for(const n of ['transitions-library-dialog-lossless.browser.mjs','dialog-lossless-core.mjs','dialog-lossless-progress.mjs'])copyFileSync(new URL(n,import.meta.url),join(out,'source',n));
 softTimer=setTimeout(()=>{report.status='profile-deadline-exceeded';error('profile-deadline','65s profile budget exhausted');void browser?.close().catch(e=>error('deadline-browser-close',e));},report.limits.softProfileMs);
 hardTimer=setTimeout(()=>{report.status='hard-deadline-exceeded';save();process.exit(1);},report.limits.hardProfileMs);
 const {chromium}=await import(pathToFileURL(modulePath).href);
 browser=await chromium.launch({headless:true,timeout:15000,...(process.env.SEENRY_CHROME_PATH?{executablePath:process.env.SEENRY_CHROME_PATH}:{})});report.browser=browser.version();report.status='running';save();
 for(const mode of ['baseline-before','png-capture','baseline-after']){
  const run={mode,status:'running',hostActions:[],pageErrors:[],consoleErrors:[],consoleWarnings:[],requestFailures:[],started:hostClock()};report.runs.push(run);save();
  let context,page,archive;
  try{
   context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,colorScheme:'light',reducedMotion:'no-preference',serviceWorkers:'block',acceptDownloads:false});
   page=await context.newPage();page.setDefaultTimeout(4000);page.setDefaultNavigationTimeout(10000);
   page.on('pageerror',e=>run.pageErrors.push(e.stack||String(e)));page.on('console',e=>{if(e.type()==='error')run.consoleErrors.push(e.text());else if(e.type()==='warning')run.consoleWarnings.push(e.text());});page.on('requestfailed',r=>run.requestFailures.push({url:r.url(),failure:r.failure()}));
   await page.route(/^https?:/,route=>route.abort());await page.goto(pathToFileURL(gallery).href);await page.evaluate(()=>document.fonts.ready);await page.locator('#library-search').fill('Dialog');
   if(!await page.locator('#blur-toggle').isChecked())await page.locator('label.blur-switch').click();
   await page.locator('#dialog-trigger').scrollIntoViewIfNeeded();await page.waitForTimeout(250);await page.evaluate(source=>{window.__naturalDialogProgress=eval('('+source+')');},atNaturalOwnedTransformProgress.toString());await page.evaluate(installObserver);
   if(mode==='png-capture'){
    const session=await context.newCDPSession(page);run.nativeVersion=await session.send('Browser.getVersion');await session.send('Page.enable');
    archive=new FrameArchive({session,out:join(out,'png-capture'),width,height});await archive.start();
   }
   await scenario(page,run);run.observations=await page.evaluate(()=>window.__dialogLosslessFinish());
   run.naturalInterruption=naturalCoverage(run.observations);run.progressGated={status:run.observations.progressTrusted===true&&run.observations.progressActions?.length===2&&run.observations.progressActions.every(a=>a.status==='observed')?'observed-positive-progress-both-windows':'blocked',actions:run.observations.progressActions||[],error:run.observations.progressError||null};run.lifecycle=verifyLifecycle(run.observations);run.observer=observerSummary(run.observations);
   run.status=run.lifecycle.status==='failed'||run.pageErrors.length||run.observations.progressError||run.progressGated.actions.some(a=>a.status.endsWith('-error'))?'failed':'scenario-observed';
  }catch(e){
   run.status='failed';run.error=e.stack||String(e);
   if(page)try{const recovered=await page.evaluate(()=>window.__dialogLosslessFinish?.());if(recovered)run.observations=recovered;}catch(readError){run.observationRecoveryError=readError.stack||String(readError);}
  }
  finally{
   if(archive)try{run.recording=await archive.finish();if(!run.recording.allReceivedEventsStored)run.status='failed';}catch(e){run.status='failed';run.recording=archive.summary();run.recordingError=e.stack||String(e);}
   // A post-recording settled still is independent of temporal frame coverage.
   if(page&&mode==='png-capture')try{const file=join(out,'final-after-recorder-stop.png');await page.screenshot({path:file,animations:'allow',timeout:4000});run.finalStill={file:'final-after-recorder-stop.png',sha256:sha256(readFileSync(file)),host:hostClock(),qualification:'Captured after recorder stopped; does not fill temporal gaps or prove intermediate readability'};}catch(e){run.finalStillError=e.stack||String(e);}
   await finalizeCase(run,context);save();
  }
 }
 report.observerComparison=report.runs.map(r=>({mode:r.mode,summary:r.observer??null}));
 report.status='finalizing';
 report.naturalCoverage=report.runs.map(r=>({mode:r.mode,coverage:r.naturalInterruption??{status:'unavailable'}}));
 report.qualityAcceptance='unverified: diagnostic completion is neither motion quality nor a performance score';
}catch(e){report.status='failed';error('top-level',e);}
finally{
 process.exitCode=await finalizeDiagnosticReport(report,{browser,verifySource:()=>{
  report.sourceAfter=Object.fromEntries(Object.keys(SOURCE_PINS).map(name=>[name,sha256(readFileSync(join(dirname(gallery),name)))]));
  for(const [name,pin] of Object.entries(SOURCE_PINS))assert.equal(report.sourceAfter[name],pin,'Source changed during diagnostic: '+name);
 }});
 clearTimeout(softTimer);clearTimeout(hardTimer);save();
}
console.log(JSON.stringify({status:report.status,profile:report.profile,recording:report.runs.find(r=>r.mode==='png-capture')?.recording,naturalCoverage:report.naturalCoverage}));
// Exit code is the finalizer's post-browser, post-source, post-event result.
