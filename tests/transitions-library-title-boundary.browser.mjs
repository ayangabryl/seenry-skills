// Rendered boundary diagnostic: keeps product CSS/runtime unchanged and sets the album
// preview's content width explicitly. This is a component boundary fixture, not browser zoom.
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const arg=(name,fallback)=>{const i=process.argv.indexOf(name);return i<0?fallback:process.argv[i+1];};
const runtime=arg('--playwright');if(!runtime)throw new Error('Pass --playwright /existing/playwright/index.mjs');
const {chromium}=await import(pathToFileURL(resolve(runtime)).href);
const gallery=resolve(arg('--gallery',fileURLToPath(new URL('../skills/seenry/assets/components/transitions/gallery.html',import.meta.url))));
const out=resolve(arg('--out','title-boundary-results'));mkdirSync(out,{recursive:true});
const widths=arg('--widths','361,368,384,384.5,385,400,420').split(',').map(Number);
const pressHoldMs=Number(arg('--press-hold-ms','0')),inputMode=arg('--input','pointer');
assert(['pointer','touch'].includes(inputMode),'--input must be pointer or touch');
function heldPressObserved(p) {
 if(typeof p?.matches==='function'){const el=p;p={active:el.matches(':active'),hover:el.matches(':hover'),coarse:matchMedia('(pointer:coarse)').matches,hoverCapable:matchMedia('(hover:hover)').matches,transform:getComputedStyle(el).transform,anchored:!!el.querySelector('[data-st-close-anchor]'),artworkTransform:getComputedStyle(el.querySelector('.cover')||el).transform};}
 if(p?.anchored){if(p.active!==true||!['none','matrix(1, 0, 0, 1, 0, 0)'].includes(p.transform))return false;return heldPressObserved({...p,anchored:false,transform:p.artworkTransform});}
 const m=/^matrix\(([^)]+)\)$/.exec(p?.transform||'');if(p?.active!==true||!m)return false;
 const v=m[1].split(',').map(Number);if(v.length!==6||!v.every(Number.isFinite))return false;
 // Hover is stationary. Trusted held input uses the same authored .98 press scale on either pointer.
 const expected=[.98,0,0,.98,0,0];
 // Translation may retain a subpixel settling residue; paint containment remains a separate strict gate.
 return v.every((n,i)=>Math.abs(n-expected[i])<(i<4?.001:.02));
}
function readHeldPress(e){
 const feedback=e.querySelector('[data-st-close-anchor]')?(e.querySelector('.cover')||e):e;
 return {rect:e.getBoundingClientRect().toJSON(),transform:getComputedStyle(e).transform,anchored:feedback!==e,artworkTransform:getComputedStyle(feedback).transform,active:e.matches(':active'),hover:e.matches(':hover'),coarse:matchMedia('(pointer:coarse)').matches,hoverCapable:matchMedia('(hover:hover)').matches};
}
async function waitForNativeHeldPress(el,{readSource,matchSource}){
 const read=eval('('+readSource+')'),matches=eval('('+matchSource+')'),startedAt=performance.now(),before=read(el),feedback=el.querySelector('[data-st-close-anchor]')?(el.querySelector('.cover')||el):el;
 const inventory=a=>{const timing=a.effect.getComputedTiming();return {type:a.constructor.name,target:a.effect.target===feedback?'held-feedback':'other',property:a.transitionProperty,playState:a.playState,pending:a.pending,currentTime:a.currentTime,duration:timing.duration,endTime:timing.endTime};};
 const jobs=feedback.getAnimations().filter(a=>{const t=a.effect.getComputedTiming();return a.effect.target===feedback&&!a.effect.pseudoElement&&a.transitionProperty==='transform'&&a.playState==='running'&&Number.isFinite(t.duration)&&t.duration>0&&Number.isFinite(t.endTime)&&t.endTime>0;});
 const result={mode:'actual-native-held-transform-completion',before,jobsBefore:jobs.map(inventory),startedAt};
 if(matches(before))result.outcome='already-held';
 else if(!before.active)result.outcome='blocked-not-active';
 else if(!jobs.length)result.outcome='blocked-no-owned-transform';
 else{
  let timeout;
  try{result.outcome=await Promise.race([Promise.all(jobs.map(a=>a.finished)).then(()=>new Promise(r=>requestAnimationFrame(()=>r('native-completed')))),new Promise(r=>{timeout=setTimeout(()=>r('blocked-native-deadline'),1000);})]);}
  catch(error){result.outcome='blocked-native-cancelled';result.error=String(error);}
  finally{clearTimeout(timeout);}
 }
 result.after=read(el);result.jobsAfter=jobs.map(inventory);result.finishedAt=performance.now();result.elapsedMs=result.finishedAt-startedAt;return result;
}
function assertNativeHeldPress(result){
 assert(result&&['already-held','native-completed'].includes(result.outcome),'Coverage precondition: actual held transform must complete within its native bound');
 assert(heldPressObserved(result.after),'Coverage precondition: active stationary lane and authored .98 artwork scale remain required');
 if(result.outcome==='native-completed'){assert(result.jobsBefore.length>0&&result.jobsBefore.every(a=>a.target==='held-feedback'&&a.property==='transform'&&a.playState==='running'&&Number.isFinite(a.duration)&&a.duration>0),'Actual finite owned transform evidence required');assert(result.jobsAfter.length===result.jobsBefore.length&&result.jobsAfter.every(a=>['finished','idle'].includes(a.playState)&&a.pending===false),'Selected native feedback must no longer be running or pending after completion');}
}
const browser=await chromium.launch({headless:true,...(process.env.SEENRY_CHROME_PATH?{executablePath:process.env.SEENRY_CHROME_PATH}:{})});
const sha=file=>createHash('sha256').update(readFileSync(file)).digest('hex');
const report={browser:browser.version(),source:{html:sha(gallery),runtime:sha(join(dirname(gallery),'seenry-transitions.js'))},scope:'Fresh component-boundary RAF captures at explicit CSS content widths, all three album titles, four-property spacing. Touch input is browser emulation, not physical-device coverage. Dirty immediate input observation is retained separately.',inputMode,pressHoldMs,runs:[]};
const spacingCSS=':root:not(#seenry-text-spacing-test) *{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}:root:not(#seenry-text-spacing-test) p{margin-block-end:2em!important}';
try{
 for(const contentWidth of widths)for(const index of [0,1,2]){
  const context=await browser.newContext({viewport:{width:1440,height:1000},colorScheme:'light',reducedMotion:'no-preference',...(inputMode==='touch'?{hasTouch:true,isMobile:true}:{}),serviceWorkers:'block',acceptDownloads:false});
  const page=await context.newPage(),errors=[],run={contentWidth,index,status:'running'};report.runs.push(run);
  page.on('pageerror',e=>errors.push(e.message));await page.route(/^https?:/,route=>route.abort());
  try{
   await page.goto(pathToFileURL(gallery).href);await page.evaluate(()=>document.fonts.ready);await page.addStyleTag({content:spacingCSS});
   await page.addStyleTag({content:`.grid{display:block!important}.card:not([data-key="expand"]){display:none!important}.card[data-key="expand"]{width:${contentWidth+60}px!important}`});
   await page.locator('[data-key="expand"]').scrollIntoViewIfNeeded();await page.waitForTimeout(300);
   run.layout=await page.evaluate(({index})=>{
    const card=document.querySelector('[data-key="expand"]'),stage=card.querySelector('.stage'),source=card.querySelectorAll('.cover-card')[index],title=source.querySelector('b'),css=getComputedStyle(stage),rect=e=>e.getBoundingClientRect().toJSON();
    const result={contentWidth:stage.getBoundingClientRect().width-parseFloat(css.paddingLeft)-parseFloat(css.paddingRight)-parseFloat(css.borderLeftWidth)-parseFloat(css.borderRightWidth),sourceComposition:getComputedStyle(source).display==='grid'?'row':'tile',detailComposition:getComputedStyle(card.querySelector('.expand-surface')).display==='grid'?'tile':'row',stage:rect(stage),source:rect(source),title:rect(title),sourceText:title.textContent.trim(),gridColumns:getComputedStyle(card.querySelector('.covers')).gridTemplateColumns,sourcePadding:getComputedStyle(source).paddingLeft,sourceMargin:getComputedStyle(source).marginLeft};
    window.__titleBoundary=[];
    const textState=e=>{
     const range=document.createRange();range.selectNodeContents(e);const c=getComputedStyle(e),r=e.getBoundingClientRect(),glyphs=[...range.getClientRects()].filter(r=>r.width>0&&r.height>0).map(r=>r.toJSON());
     let rendered=c.visibility==='visible',effectiveOpacity=1;
     for(let n=e;n;n=n.parentElement){const style=getComputedStyle(n);if(n.hidden||style.display==='none')rendered=false;effectiveOpacity*=Number(style.opacity);}
     return {rect:r.toJSON(),glyphs,visibility:c.visibility,display:c.display,opacity:c.opacity,effectiveOpacity,transform:c.transform,text:e.textContent.trim(),painted:rendered&&effectiveOpacity>.01&&r.width>0&&r.height>0&&glyphs.length>0};
    };
    window.__titleBoundaryTextState=textState;
    window.__titleBoundaryFrame=()=>{
     const surface=card.querySelector('.expand-surface'),paint=surface.querySelector('.st-expand-paint'),detailTitle=surface.querySelector('[data-st-shared-text]'),cover=surface.querySelector('[data-st-shared="cover"]');
     const m=paint&&/inset\(([^)]*)\)/.exec(getComputedStyle(paint).clipPath),r=(paint||surface).getBoundingClientRect();let a=m?m[1].split('round')[0].trim().split(/\s+/).map(parseFloat):[0];a=[a[0],a[1]??a[0],a[2]??a[0],a[3]??a[1]??a[0]];
     const shell={left:r.left+a[3],top:r.top+a[0],right:r.right-a[1],bottom:r.bottom-a[2]};
     const ghosts=[...surface.querySelectorAll('[data-st-ghost][data-st-shared="title"]')];
     return {shell,cover:cover.getBoundingClientRect().toJSON(),title:textState(detailTitle),ghosts:ghosts.map(textState)};
    };
    source.addEventListener('pointerdown',e=>{window.__titleBoundaryPressDown={at:performance.now(),trusted:e.isTrusted};},{once:true,passive:true});
    source.addEventListener('pointerup',e=>{window.__titleBoundaryPressUp={at:performance.now(),trusted:e.isTrusted};},{once:true,passive:true});
    source.addEventListener('click',()=>{queueMicrotask(()=>{
     const start=performance.now();
     const sample=()=>{window.__titleBoundary.push({at:performance.now()-start,...window.__titleBoundaryFrame()});if(performance.now()-start<600)requestAnimationFrame(sample);};window.__titleBoundaryInitial={at:performance.now()-start,...window.__titleBoundaryFrame()};requestAnimationFrame(sample);
    });},{once:true});return result;
   },{index});
   assert(Math.abs(run.layout.contentWidth-contentWidth)<.05,'Explicit fixture must realize requested fractional content width');
   assert.equal(run.layout.sourceComposition,run.layout.detailComposition,'Source and detail must select the same composition, including fractional breakpoint widths');
   const target=page.locator('[data-key="expand"] .cover-card').nth(index);
   const pressed=()=>target.evaluate(readHeldPress);
   const observeHeld=async()=>{
    run.pressedInitial=await pressed();run.pressed=run.pressedInitial;run.pressExtraWaitMs=0;
    if(pressHoldMs>=100&&!heldPressObserved(run.pressedInitial)){
     run.nativeHeldWait=await target.evaluate(waitForNativeHeldPress,{readSource:readHeldPress.toString(),matchSource:heldPressObserved.toString()});run.pressExtraWaitMs=run.nativeHeldWait.elapsedMs;run.pressed=run.nativeHeldWait.after;assertNativeHeldPress(run.nativeHeldWait);
    }
   };
   if(inputMode==='touch'){
    const b=await target.boundingBox(),session=await context.newCDPSession(page),point={x:b.x+b.width/2,y:b.y+b.height/2};
    await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});try{await page.waitForTimeout(Math.max(1,pressHoldMs));await observeHeld();}finally{await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await session.detach();}
   }else if(pressHoldMs>0){await target.hover();await page.mouse.down();try{await page.waitForTimeout(pressHoldMs);await observeHeld();}finally{await page.mouse.up();}}
   else await target.click();
   if(pressHoldMs>=100)assert(heldPressObserved(run.pressed),'Coverage precondition: held input must realize active state and its authored .98 scale CSS contract');
   await page.waitForTimeout(80);run.frameFile=`${contentWidth}-${index}-moving.png`;await page.locator('[data-key="expand"]').screenshot({path:join(out,run.frameFile),animations:'allow'});
   await page.waitForTimeout(650);run.trace=await page.evaluate(()=>window.__titleBoundary);run.initialObservation=await page.evaluate(()=>window.__titleBoundaryInitial);run.pressTiming=await page.evaluate(()=>({down:window.__titleBoundaryPressDown||null,up:window.__titleBoundaryPressUp||null,observedHoldMs:window.__titleBoundaryPressDown&&window.__titleBoundaryPressUp?window.__titleBoundaryPressUp.at-window.__titleBoundaryPressDown.at:null}));run.errors=errors;
   run.settled=await page.evaluate(()=>window.__titleBoundaryFrame());
   assert(run.trace.length>5,'RAF evidence missing');let travelerFrames=0;
   const bounds=(t,row,label)=>{for(const b of [t.rect,...t.glyphs]){assert(b.left>=row.shell.left-.1&&b.right<=row.shell.right+.1&&b.top>=row.shell.top-.1&&b.bottom<=row.shell.bottom+.1,`Title outside paint at ${label}`);const a=row.cover;assert(b.right<=a.left+.1||b.left>=a.right-.1||b.bottom<=a.top+.1||b.top>=a.bottom-.1,`Title intersects artwork at ${label}`);}};
   for(const row of run.trace){
    assert(row.ghosts.length<=1,'Duplicate travelers');
    const painted=[...row.ghosts.filter(t=>t.painted),...(row.title.painted?[row.title]:[])];
    assert.equal(painted.length,1,`Exactly one painted title required at ${row.at}ms`);
    for(const t of painted){assert.equal(t.text,run.layout.sourceText,'Painted text must match clicked album');bounds(t,row,`${row.at}ms`);}
    for(const t of row.ghosts){travelerFrames++;assert(t.painted,`Traveler is not visibly painted at ${row.at}ms`);assert.equal(t.text,run.layout.sourceText,'Traveler content must match clicked album');assert.notEqual(t.visibility,'hidden','Endpoint guard hid this title');assert(Number(t.opacity)>.99,'Title should remain fully readable');
     const matrix=/matrix\(([^)]+)\)/.exec(t.transform);if(matrix){const v=matrix[1].split(',').map(Number);assert(Math.abs(v[0]-1)<.0001&&Math.abs(v[3]-1)<.0001,'Text scaled');}
    }
   }
   assert(travelerFrames>1,'No moving title evidence');assert(run.settled.title.painted,'Settled title must have visible positive text geometry');assert.equal(run.settled.title.text,run.layout.sourceText,'Settled title content must match clicked album');assert.equal(run.settled.ghosts.length,0,'Settled travelers must be retired');bounds(run.settled.title,run.settled,'settled');assert.equal(errors.length,0);run.status='passed';
  }catch(e){run.status='failed';run.error=e.message;await page.screenshot({path:join(out,`${contentWidth}-${index}-FAILED.png`)}).catch(()=>{});}
  finally{run.pressTiming=await page.evaluate(()=>({down:window.__titleBoundaryPressDown||null,up:window.__titleBoundaryPressUp||null,observedHoldMs:window.__titleBoundaryPressDown&&window.__titleBoundaryPressUp?window.__titleBoundaryPressUp.at-window.__titleBoundaryPressDown.at:null})).catch(e=>({error:e.message}));await context.close();}
 }
}finally{await browser.close();writeFileSync(join(out,'results.json'),JSON.stringify(report,null,2)+'\n');}
const failed=report.runs.filter(r=>r.status!=='passed');console.log(`${report.runs.length-failed.length}/${report.runs.length} rendered title boundary cases passed`);if(failed.length){console.log(failed.map(r=>({contentWidth:r.contentWidth,title:r.layout?.sourceText,error:r.error})));process.exitCode=1;}
