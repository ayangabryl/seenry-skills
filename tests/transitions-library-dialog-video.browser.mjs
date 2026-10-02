// Unpaused native Dialog recordings for qualitative review. Recording completion is
// not a motion score or a substitute for the independent Dialog assertion matrix.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,renameSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

const arg=(name,fallback)=>{const i=process.argv.indexOf(name);return i<0?fallback:process.argv[i+1];};
const modulePath=arg('--playwright');assert(modulePath,'Pass --playwright /existing/playwright/index.mjs');
const {chromium}=await import(pathToFileURL(resolve(modulePath)).href);
const gallery=resolve(arg('--gallery',fileURLToPath(new URL('../skills/seenry/assets/components/transitions/gallery.html',import.meta.url))));
const out=resolve(arg('--out','dialog-video-results'));mkdirSync(out,{recursive:true});
const sha=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const browser=await chromium.launch({headless:true,...(process.env.SEENRY_CHROME_PATH?{executablePath:process.env.SEENRY_CHROME_PATH}:{})});
const report={browser:browser.version(),commit:execFileSync('git',['rev-parse','HEAD'],{cwd:dirname(gallery),encoding:'utf8'}).trim(),harness:sha(fileURLToPath(import.meta.url)),source:Object.fromEntries(['gallery.html','gallery.js','seenry-transitions.js','seenry-transitions.css'].map(f=>[f,sha(join(dirname(gallery),f))])),scope:'Unpaused browser video at320/1440 CSSpx, both themes and native normal/reduced preference. Trusted pointer Cancel/open and keyboard Enter/Escape; timed API close/reopen are explicitly separate. No animation pausing, style replacement, simulated touch or quality score. Normal-motion natural70ms interruption may be coverage-blocked; recording it does not pass that requirement. Reduced cycles are immediate fresh transitions, with no interruption interval.',runs:[]};
const save=()=>writeFileSync(join(out,'results.json'),JSON.stringify(report,null,2)+'\n');
const waitOpen=page=>page.waitForFunction(()=>{const d=document.querySelector('#dialog-1');return d.open&&d.matches(':modal')&&!d.inert&&d.dataset.stOpen==='true';});
const waitClosed=page=>page.waitForFunction(()=>{const d=document.querySelector('#dialog-1');return !d.open&&d.dataset.stOpen==='false';});

function isDialogExitScale(value){
 if(typeof value!=='string')return false;
 const match=/^(scale|matrix)\(([^()]*)\)$/.exec(value.trim());if(!match)return false;
 const tokens=match[2].split(',').map(x=>x.trim()),number=/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i;
 if(!tokens.length||tokens.some(x=>!number.test(x)))return false;
 const values=tokens.map(Number),near=(a,b)=>Number.isFinite(a)&&Math.abs(a-b)<1e-8;
 if(match[1]==='scale')return (values.length===1||values.length===2)&&values.every(x=>near(x,.97));
 return values.length===6&&values.every((x,i)=>near(x,[.97,0,0,.97,0,0][i]));
}

function dialogAnimationEvidence(animation,surface){
 const effect=animation.effect,target=effect?.target,pseudo=effect?.pseudoElement||null;
 return {target:target?.id||target?.className||null,targetTag:target?.tagName||null,targetRelationship:target===surface?'surface':target&&surface.contains(target)?'descendant':target?'outside':'unknown',pseudo,properties:[...new Set((effect?.getKeyframes()||[]).flatMap(k=>Object.keys(k).filter(p=>!['offset','computedOffset','easing','composite'].includes(p))))]};
}
function assertInstantAnimations(animations){
 assert(Array.isArray(animations),'Complete animation inventory required');
 for(const a of animations)assert(a.targetRelationship==='descendant'&&a.pseudo===null&&Array.isArray(a.properties)&&a.properties.length>0&&a.properties.every(p=>['backgroundColor','boxShadow'].includes(p)),'Instant modal permits only explicit descendant paint feedback; surface, pseudo, geometry, opacity, filter and unknown jobs are forbidden');
}

function assertAcceptedCoverage(entries){
 assert(Array.isArray(entries)&&entries.length>0,'Positive post-production accepted observations required');
 const required=[['trusted-pointer-open','open','pointer'],['trusted-pointer-Cancel','close','pointer'],['trusted-keyboard-Enter','open','keyboard'],['trusted-keyboard-Escape','keyboard-cancel','keyboard'],['trusted-open-then-timed-API-reversal','open','pointer'],['trusted-final-Cancel','close','pointer']];
 for(const [phase,kind,input] of required)assert(entries.some(e=>e.trusted===true&&e.kind===kind&&e.state?.phase===phase&&(kind==='keyboard-cancel'||(input==='keyboard'?e.detail===0:e.detail>0))&&(kind!=='close'||e.control==='Cancel')),'Missing accepted '+phase+' with trusted actual control/input identity');
}

// Small state inventories accompany the actual video; no per-frame text-tree walk.
function installRecorder(){
 const d=document.querySelector('#dialog-1'),t=document.querySelector('#dialog-trigger');
 window.__dialogVideo={startedAt:performance.now(),phase:'setup',events:[],actions:[],samples:[],accepted:[]};
 window.__dialogVideoSnapshot=()=>{const s=getComputedStyle(d),b=getComputedStyle(d,'::backdrop'),a=document.activeElement;return {at:performance.now(),phase:window.__dialogVideo.phase,open:d.open,modal:d.matches(':modal'),inert:d.inert,presentation:d.dataset.stOpen,expanded:t.getAttribute('aria-expanded'),focus:a===t?'trigger':a===d.querySelector('[autofocus]')?'Cancel':a===d.querySelector('.dialog-destructive')?'Delete':a.tagName,focusVisible:a.matches(':focus-visible'),opacity:Number(s.opacity),filter:s.filter,transform:s.transform,rect:d.getBoundingClientRect().toJSON(),backdropOpacity:Number(b.opacity),backdropFilter:b.getPropertyValue('backdrop-filter'),reduce:matchMedia('(prefers-reduced-motion:reduce)').matches,animations:d.getAnimations({subtree:true}).map(a=>{const timing=a.effect.getComputedTiming(),last=a.effect.getKeyframes().at(-1);return {...window.dialogAnimationEvidence(a,d),state:a.playState,pending:a.pending,currentTime:a.currentTime,duration:timing.duration,endTime:timing.endTime,endOpacity:last&&'opacity' in last?Number(last.opacity):null,endTransform:last?.transform||null};})};};
 // Post-delegation snapshots establish immediate accepted paint, separate from video clocks.
 document.addEventListener('click',e=>{if(e.target!==t&&!t.contains(e.target)&&!d.contains(e.target))return;window.__dialogVideo.accepted.push({kind:e.target===t||t.contains(e.target)?'open':'close',trusted:e.isTrusted,detail:e.detail,control:e.target.closest('[data-st-close]')?.textContent.trim()||null,state:window.__dialogVideoSnapshot()});});
 d.addEventListener('cancel',e=>window.__dialogVideo.accepted.push({kind:'keyboard-cancel',trusted:e.isTrusted,state:window.__dialogVideoSnapshot()}));
 for(const type of ['pointerdown','pointerup','click','keydown'])document.addEventListener(type,e=>{
  if(e.target!==t&&!d.contains(e.target)&&!(type==='keydown'&&e.key==='Escape'&&d.open))return;
  const log=window.__dialogVideo;if(log.events.length<120)log.events.push({type,at:performance.now(),phase:log.phase,trusted:e.isTrusted,key:e.key||null,detail:e.detail??null,target:e.target===t?'trigger':e.target.closest('[data-st-close]')?.textContent.trim()||e.target.tagName});
 },true);
}
async function mark(page,phase){return page.evaluate(phase=>{window.__dialogVideo.phase=phase;const s=window.__dialogVideoSnapshot();window.__dialogVideo.samples.push(s);return s;},phase);}

try{
 for(const width of [320,1440])for(const theme of ['light','dark'])for(const motion of ['no-preference','reduce']){
  const label=`${width}-${theme}-${motion}`,run={label,width,height:780,theme,motion,status:'recording'};report.runs.push(run);save();
  let context,page,video;const errors=[];
  try{
   context=await browser.newContext({viewport:{width,height:780},colorScheme:theme,reducedMotion:motion,recordVideo:{dir:join(out,'raw'),size:{width,height:780}},serviceWorkers:'block',acceptDownloads:false});
   page=await context.newPage();video=page.video();page.setDefaultTimeout(4000);page.on('pageerror',e=>errors.push(e.message));await page.route(/^https?:/,route=>route.abort());
   await page.goto(pathToFileURL(gallery).href);await page.evaluate(()=>document.fonts.ready);await page.locator('#library-search').fill('Dialog');
   if(!await page.locator('#blur-toggle').isChecked())await page.locator('label.blur-switch').click();
   await page.locator('#dialog-trigger').scrollIntoViewIfNeeded();await page.evaluate(({scale,animation})=>{window.__dialogExitScale=eval('('+scale+')');window.dialogAnimationEvidence=eval('('+animation+')');},{scale:isDialogExitScale.toString(),animation:dialogAnimationEvidence.toString()});await page.evaluate(installRecorder);await mark(page,'rest');await page.waitForTimeout(300);
   await mark(page,'trusted-pointer-open');await page.locator('#dialog-trigger').click();await waitOpen(page);await page.waitForTimeout(400);await mark(page,'pointer-open-settled');
   await mark(page,'trusted-pointer-Cancel');await page.locator('#dialog-1 [autofocus]').click();await waitClosed(page);await page.waitForTimeout(250);await mark(page,'pointer-closed');
   // Focus setup is programmatic; Enter/Escape themselves are trusted keyboard input.
   await page.locator('#dialog-trigger').focus();await mark(page,'trusted-keyboard-Enter');await page.keyboard.press('Enter');await waitOpen(page);await page.waitForTimeout(400);await mark(page,'keyboard-open-settled');
   await mark(page,'trusted-keyboard-Escape');await page.keyboard.press('Escape');await waitClosed(page);await page.waitForTimeout(250);await mark(page,'keyboard-closed');
   await mark(page,'trusted-open-then-timed-API-reversal');
   await page.evaluate(()=>{
    const d=document.querySelector('#dialog-1'),t=document.querySelector('#dialog-trigger'),log=window.__dialogVideo;
    const handler=e=>{
     if(e.target!==t&&!t.contains(e.target))return;
     document.removeEventListener('click',handler);const start=performance.now();
     const record=kind=>{const state=window.__dialogVideoSnapshot();log.actions.push({kind,elapsedMs:performance.now()-start,state});return state;};
     log.reversalTrusted=e.isTrusted;record('after-trusted-open');
     setTimeout(()=>{record('before-API-close');SeenryTransitions.close(d);record('after-API-close');
      setTimeout(()=>{const state=record('before-API-reopen');const outgoing=state.animations.some(a=>a.target==='dialog-1'&&a.state==='running'&&a.pending===false&&!a.pseudo&&window.__dialogExitScale(a.endTransform)&&Number.isFinite(a.duration)&&a.duration>0&&Number.isFinite(a.currentTime)&&a.currentTime>0&&Number.isFinite(a.endTime)&&a.currentTime<a.endTime);log.naturalInterruptionCoverage=state.reduce?'reduced-immediate-fresh-cycle':state.modal&&state.open&&state.inert&&state.expanded==='false'&&outgoing?'observed-active-exit':'blocked-active-exit-not-observed';SeenryTransitions.open(d,t);record('after-API-reopen');},70);
     },70);
    };
    // Installed after production delegation, so the opening state is actually owned.
    document.addEventListener('click',handler);
   });
   await page.locator('#dialog-trigger').click();await page.waitForFunction(()=>window.__dialogVideo.actions.some(a=>a.kind==='after-API-reopen'));await waitOpen(page);await page.waitForTimeout(500);await mark(page,'reversal-settled');
   await mark(page,'trusted-final-Cancel');await page.locator('#dialog-1 [autofocus]').click();await waitClosed(page);await page.waitForTimeout(350);await mark(page,'final-closed');
   run.observations=await page.evaluate(()=>window.__dialogVideo);assert(run.observations.reversalTrusted);assert(run.observations.events.every(e=>e.trusted));
   for(const key of ['Enter','Escape'])assert(run.observations.events.some(e=>e.type==='keydown'&&e.key===key),'Missing trusted '+key);
   assert(run.observations.events.some(e=>e.type==='click'&&e.target==='Cancel'),'Missing trusted Cancel');
   assertAcceptedCoverage(run.observations.accepted);
   for(const entry of run.observations.accepted){const s=entry.state;assert(entry.trusted);if(entry.kind==='open'){assert(s.open&&s.modal&&!s.inert);assert.equal(s.opacity,1);if(entry.detail===0||s.reduce){assert.equal(s.backdropOpacity,1);assert.equal(s.transform,'none');assertInstantAnimations(s.animations);}}else if(entry.kind==='keyboard-cancel'||s.reduce){assert(!s.open&&!s.modal);assert.equal(s.focus,'trigger');assertInstantAnimations(s.animations);}else if(s.open)assert.equal(s.opacity,1,'Pointer exit remains opaque');}
   for(const {state:s} of run.observations.actions)if(s.open)assert.equal(s.opacity,1,'Sampled entry/exit/reopen shell remains opaque');
   if(motion==='reduce'){const at=kind=>run.observations.actions.find(a=>a.kind===kind)?.state;assert.equal(run.observations.naturalInterruptionCoverage,'reduced-immediate-fresh-cycle');for(const key of ['after-API-close','before-API-reopen']){assert(!at(key).open&&!at(key).modal);assert.equal(at(key).focus,'trigger');assertInstantAnimations(at(key).animations);}const reopened=at('after-API-reopen');assert(reopened.open&&reopened.modal&&!reopened.inert);assert.equal(reopened.opacity,1);assert.equal(reopened.backdropOpacity,1);assert.equal(reopened.transform,'none');assertInstantAnimations(reopened.animations);}
   assert.deepEqual(errors,[]);run.status='recorded';
  }catch(error){run.status='failed';run.error=error.stack;if(page){run.observations=await page.evaluate(()=>window.__dialogVideo).catch(()=>null);await page.screenshot({path:join(out,label+'-FAILED.png'),animations:'allow'}).catch(()=>{});}}
  finally{
   run.pageErrors=errors;save();if(context)await context.close();
   if(video){try{const raw=await video.path(),target=join(out,label+'.webm');renameSync(raw,target);run.video={file:label+'.webm',sha256:sha(target)};}catch(error){run.status='failed';run.videoError=String(error);}}
   save();console.log(label+': '+run.status);
  }
 }
}finally{await browser.close();save();}
console.log(JSON.stringify({recorded:report.runs.filter(r=>r.status==='recorded').length,total:report.runs.length,scope:report.scope}));
if(report.runs.some(r=>r.status!=='recorded'))process.exitCode=1;
