// Actual reduced-motion first-paint/reopen regression. CSS transitions are recorded
// separately from WAAPI because restoring committed opacity can start a new fade.
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {dirname,resolve,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const arg=(n,d)=>{const i=process.argv.indexOf(n);return i<0?d:process.argv[i+1];};
assert(arg('--playwright'),'Pass --playwright');
const {chromium}=await import(pathToFileURL(resolve(arg('--playwright'))).href);
const gallery=resolve(arg('--gallery',fileURLToPath(new URL('../skills/seenry/assets/components/transitions/gallery.html',import.meta.url))));
const out=resolve(arg('--out','reduced-expand-reopen-results'));mkdirSync(out,{recursive:true});
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const browser=await chromium.launch({headless:true,...(process.env.SEENRY_CHROME_PATH?{executablePath:process.env.SEENRY_CHROME_PATH}:{})});
const report={browser:browser.version(),source:{html:sha(gallery),runtime:sha(join(dirname(gallery),'seenry-transitions.js')),css:sha(join(dirname(gallery),'seenry-transitions.css')),galleryJS:sha(join(dirname(gallery),'gallery.js'))},scope:'Native reduced preference with actual Blur opt-in. Required coverage: trusted first opening, natural0/20ms reopens and a separately labeled native-controlled committed-exit case that pauses only the shell. Natural80ms committed attempts remain diagnostic, with missed lifecycle windows blocked rather than passed. No natural timing claim comes from controlled cases.',runs:[]};
function assertFrame(f,keyboard){
 assert.equal(f.nativeReducedMotion,true);assert.equal(f.blurEnabled,true);
 assert.equal(f.open,'true');assert.equal(f.inert,false);assert(f.focusedClose,'Reopen must retain Close focus');
 assert(f.surface.shown&&f.paint.shown&&f.surface.rect.width>0&&f.surface.rect.height>0&&f.paint.rect.width>0&&f.paint.rect.height>0,'Reduced backing must have visible positive geometry');
 assert(f.surface.opacity>=.99&&f.surface.effectiveOpacity>=.99&&f.paint.effectiveOpacity>=.99&&f.paint.backgroundAlpha>=.99,'Reduced card backing must be opaque from first painted RAF');
 assert(f.close.shown&&f.close.effectiveOpacity>=.99&&f.close.rect.width>0&&f.close.rect.height>0,'Focused Close must be fully painted after reduced opening/reopen');
 assert(f.content.length>0);for(const c of f.content)assert(c.shown&&c.effectiveOpacity>=.99&&c.rect.width>0&&c.rect.height>0,'Details must not retain or restart opacity fades after reduced opening/reopen');
 assert.equal(f.sourceVisibility,'hidden','Opened source card must not duplicate the detail');
 if(keyboard)assert(f.focusVisible,'Trusted keyboard opening must keep native visible focus');
}
const saveReport=()=>writeFileSync(join(out,'results.json'),JSON.stringify(report,null,2)+'\n');
function coverageFailures(runs){return runs.filter(r=>typeof r.required!=='boolean'||r.status!=='passed'&&(r.required||r.status!=='blocked'));}
const phases=[{name:'natural-0',delay:0,required:true},{name:'natural-20',delay:20,required:true},{name:'natural-80',delay:80,required:false},{name:'controlled-committed',delay:80,required:true,controlled:true}];
saveReport();
try{for(const width of [390,1440])for(const keyboard of [false,true])for(const phase of phases){
 const {delay,required}=phase,controlled=!!phase.controlled;
 const context=await browser.newContext({viewport:{width,height:1000},colorScheme:'light',reducedMotion:'reduce',serviceWorkers:'block',acceptDownloads:false});
 const page=await context.newPage(),run={width,keyboard,delay,phase:phase.name,required,controlled,status:'running',errors:[]};report.runs.push(run);saveReport();page.on('pageerror',e=>run.errors.push(e.message));await page.route(/^https?:/,r=>r.abort());
 try{
  await page.goto(pathToFileURL(gallery).href);await page.evaluate(()=>document.fonts.ready);if(!await page.locator('#blur-toggle').isChecked())await page.locator('label.blur-switch').click();await page.waitForFunction(()=>document.querySelector('#blur-toggle').checked&&document.documentElement.hasAttribute('data-st-blur'));await page.locator('[data-key="expand"]').scrollIntoViewIfNeeded();await page.waitForTimeout(250);
  await page.evaluate(()=>{
   const source=document.querySelector('#expand-src'),detail=document.querySelector('#expand-1'),close=detail.querySelector('[data-st-close]');
   const animations=e=>e.getAnimations().map(a=>({type:a.constructor.name,transitionProperty:a.transitionProperty||null,playState:a.playState,currentTime:a.currentTime,frames:a.effect.getKeyframes()}));
   const paint=e=>{const cs=getComputedStyle(e),color=cs.backgroundColor,parts=color.match(/[\d.]+/g),backgroundAlpha=color==='transparent'?0:color.startsWith('rgba')?Number(parts?.[3]??0):color.startsWith('rgb')?1:0;let shown=true,effectiveOpacity=1;for(let n=e;n;n=n.parentElement){const c=getComputedStyle(n);shown&&=c.visibility==='visible'&&c.display!=='none';effectiveOpacity*=Number(c.opacity);}return {shown,effectiveOpacity,backgroundAlpha,clipPath:cs.clipPath,transform:cs.transform,opacity:Number(cs.opacity),inlineOpacity:e.style.opacity,transitionProperty:cs.transitionProperty,transitionDuration:cs.transitionDuration,background:cs.backgroundColor,rect:e.getBoundingClientRect().toJSON(),animations:animations(e)};};
   function reopenReadiness(pre, committedRequired) {
    if(pre.closing!=='true'||!pre.inert||pre.open!=='false'||!pre.close.evidence||!pre.content.length||!pre.content.every(c=>c.evidence))return 'blocked';
    if(committedRequired){const committed=o=>o.inlineOpacity!==''&&Number(o.inlineOpacity)===0&&o.opacity<=.01;if(!committed(pre.close)||!pre.content.every(committed))return 'wait';}
    return 'ready';
   }
   window.__reducedReadiness=reopenReadiness;
   window.__measureReduced=at=>{const surface=detail.querySelector('.st-expand-surface,.expand-surface');return {at,nativeReducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches,blurEnabled:document.documentElement.hasAttribute('data-st-blur'),open:detail.dataset.stOpen,inert:detail.inert,focusedClose:document.activeElement===close,focusVisible:close.matches(':focus-visible'),sourceVisibility:getComputedStyle(source).visibility,surface:paint(surface),paint:paint(surface.querySelector('.st-expand-paint')||surface),close:paint(close),content:[...detail.querySelectorAll('[data-st-expand-content]')].map(c=>({...paint(c),text:c.textContent.trim()}))};};
   window.__reducedOpening=[];source.addEventListener('click',e=>{window.__reducedInput={trusted:e.isTrusted,detail:e.detail};window.__reducedInitial=window.__measureReduced(0);const start=performance.now();requestAnimationFrame(()=>window.__reducedOpening.push(window.__measureReduced(performance.now()-start)));},{once:true,capture:true});
  });
  const trigger=page.locator('#expand-src');if(keyboard){await trigger.focus();await page.keyboard.press('Enter');}else await trigger.click();
  await page.waitForFunction(()=>window.__reducedOpening.length>0);run.opening=await page.evaluate(()=>({input:window.__reducedInput,initial:window.__reducedInitial,trace:window.__reducedOpening}));
  assert(run.opening.input.trusted,'Opening must use trusted input');for(const f of run.opening.trace)assertFrame(f,keyboard);
  await page.evaluate(({delay,controlled})=>new Promise(resolve=>{
   const source=document.querySelector('#expand-src'),detail=document.querySelector('#expand-1'),close=detail.querySelector('[data-st-close]'),content=[...detail.querySelectorAll('[data-st-expand-content]')];
   function shellExit(detail) {
    const surface=detail.querySelector('.st-expand-surface,.expand-surface')||detail;
    return surface.getAnimations().findLast(a=>a.constructor.name==='Animation'&&a.effect?.target===surface&&Number(a.effect.getKeyframes().at(-1)?.opacity)===0);
   }
   SeenryTransitions.collapse(detail);const closedAt=performance.now();
   // Controlled coverage holds only the real shell exit. Child WAAPI completion and
   // committed styles remain native. This is not evidence of an80ms natural window.
   let heldShell=null;window.__controlledExit=null;
   if(controlled){
    heldShell=shellExit(detail);
    if(!heldShell){window.__reducedPreReopen={readiness:'blocked',error:'No outgoing shell opacity animation for controlled phase'};resolve();return;}
    heldShell.pause();window.__controlledExit={kind:'native-controlled-shell-pause',target:heldShell.effect.target.className||heldShell.effect.target.id||heldShell.effect.target.tagName,duration:heldShell.effect.getTiming().duration,pausedAt:performance.now()-closedAt};
   }
   // New card details exit in90ms, while the surface exits in100ms. Observe the real
   // child completion promises rather than hoping a RAF lands inside that10ms window.
   const exitAnimations=[close,...content].map(e=>e.getAnimations().findLast(a=>a.constructor.name==='Animation'&&Number(a.effect.getKeyframes().at(-1)?.opacity)===0));
   window.__reducedExitJobs=exitAnimations.map(a=>a?{type:a.constructor.name,duration:a.effect.getTiming().duration}:null);
   const exitCommit=Promise.all(exitAnimations.filter(Boolean).map(a=>a.finished.catch(()=>false)));
   const attempt=()=>{
    const outgoing=e=>{const animations=e.getAnimations().map(a=>({type:a.constructor.name,transitionProperty:a.transitionProperty||null,playState:a.playState,currentTime:a.currentTime,frames:a.effect.getKeyframes()})).filter(a=>a.frames.length&&Number(a.frames.at(-1).opacity)===0),inlineOpacity=e.style.opacity,opacity=Number(getComputedStyle(e).opacity);return {animations,inlineOpacity,opacity,evidence:animations.some(a=>a.playState!=='idle')||(inlineOpacity!==''&&Number(inlineOpacity)===0&&opacity<=.01)};};
    window.__reducedPreReopen={closing:detail.dataset.stClosing||null,inert:detail.inert,open:detail.dataset.stOpen,elapsed:performance.now()-closedAt,exitJobs:window.__reducedExitJobs,committedRequired:delay===80,controlled:window.__controlledExit?{...window.__controlledExit,playState:heldShell.playState,currentTime:heldShell.currentTime}:null,close:outgoing(close),content:content.map(outgoing)};
    const p=window.__reducedPreReopen;p.readiness=p.exitJobs.length===p.content.length+1&&p.exitJobs.every(Boolean)?window.__reducedReadiness(p,p.committedRequired):'blocked';window.__reducedReopen=[];if(p.readiness==='wait'&&p.elapsed<500){requestAnimationFrame(attempt);return;}if(p.readiness!=='ready'){resolve();return;}
    SeenryTransitions.expand(source,detail);
    if(heldShell){window.__controlledExit.afterReopen={playState:heldShell.playState,pending:heldShell.pending};if(heldShell.playState==='paused'||heldShell.pending)heldShell.play();}
    const start=performance.now();window.__reducedReopenStarted=start;window.__reducedReopenInitial=window.__measureReduced(0);
    const sample=()=>{const at=performance.now()-start;window.__reducedReopen.push(window.__measureReduced(at));if(window.__reducedReopen.length===1)resolve();if(at<300)requestAnimationFrame(sample);};requestAnimationFrame(sample);
   };setTimeout(()=>{if(delay===80)exitCommit.then(attempt);else attempt();},delay);
  }),{delay,controlled});
  run.preReopen=await page.evaluate(()=>window.__reducedPreReopen);run.controlledExit=await page.evaluate(()=>window.__controlledExit);saveReport();
  assert(run.preReopen.closing==='true'&&run.preReopen.inert&&run.preReopen.open==='false','Precondition: collapse must still be active immediately before reopening');
  assert(run.preReopen.close.evidence&&run.preReopen.content.length>0&&run.preReopen.content.every(c=>c.evidence),'Precondition: actual outgoing or held opacity-zero channels must exist before reopening');
  assert(run.preReopen.exitJobs.length===run.preReopen.content.length+1&&run.preReopen.exitJobs.every(Boolean),'Precondition: owned outgoing Close/content animations must be observed');
  assert.equal(run.preReopen.readiness,'ready','Precondition: committed phase must prove both Close and content inline opacity0 before surface collapse finishes');
  if(controlled){assert.equal(run.preReopen.controlled?.playState,'paused','Precondition: controlled shell must be genuinely held');assert.equal(run.controlledExit.afterReopen.playState,'idle','Reopen must retire the held old shell');assert.equal(run.controlledExit.afterReopen.pending,false);}
  run.captureBefore=await page.evaluate(()=>window.__reducedReopen.at(-1));run.earlyFrame=`${width}-${keyboard?'keyboard':'pointer'}-${phase.name}-early-reopen.png`;
  run.captureRequestAt=await page.evaluate(()=>performance.now()-window.__reducedReopenStarted);await page.locator('[data-key="expand"]').screenshot({path:join(out,run.earlyFrame)});run.captureCompletedAt=await page.evaluate(()=>performance.now()-window.__reducedReopenStarted);run.captureAfter=await page.evaluate(()=>window.__reducedReopen.at(-1));
  await page.waitForTimeout(350);run.trace=await page.evaluate(()=>window.__reducedReopen);run.initial=await page.evaluate(()=>window.__reducedReopenInitial);assert(run.trace.length>8);
  for(const f of run.trace)assertFrame(f,keyboard);
  run.frame=`${width}-${keyboard?'keyboard':'pointer'}-${phase.name}-reopened.png`;await page.locator('[data-key="expand"]').screenshot({path:join(out,run.frame)});
  await page.keyboard.press('Escape');await page.waitForTimeout(400);assert.equal(await trigger.evaluate(e=>document.activeElement===e),true);assert.equal(await page.locator('#expand-1').getAttribute('data-st-open'),'false');assert.equal(run.errors.length,0);run.status='passed';
 }catch(e){run.status=e.message.startsWith('Precondition:')&&!run.errors.length?'blocked':'failed';run.error=e.stack||e.message;console.error(JSON.stringify({width,keyboard,phase:phase.name,status:run.status,error:run.error}));saveReport();await page.screenshot({path:join(out,`${width}-${keyboard}-${phase.name}-FAILED.png`)}).catch(()=>{});}finally{saveReport();await context.close();}
}}finally{await browser.close();writeFileSync(join(out,'results.json'),JSON.stringify(report,null,2)+'\n');}
const failed=coverageFailures(report.runs),required=report.runs.filter(r=>r.required),natural=report.runs.filter(r=>!r.required);
console.log(`${required.filter(r=>r.status==='passed').length}/${required.length} required native cases passed (includes explicitly controlled committed-exit coverage)`);
console.log('Natural80ms committed-window diagnostics: '+JSON.stringify(natural.map(({width,keyboard,status,error})=>({width,keyboard,status,error}))));
if(failed.length){console.log(failed.map(({width,keyboard,phase,status,error})=>({width,keyboard,phase,status,error})));process.exitCode=1;}
