// Diagnostic corroboration only. PNG acquisition can change capture/render timing.
// Unpaused video and each PNG keep separate clocks; neither is an acceptance oracle.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,renameSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

const arg=(name,fallback)=>{const i=process.argv.indexOf(name);return i<0?fallback:process.argv[i+1];};
assert(arg('--playwright')&&arg('--gallery'),'Pass the existing Playwright module and exact repository gallery');
const {chromium}=await import(pathToFileURL(resolve(arg('--playwright'))).href);
const gallery=resolve(arg('--gallery')),out=resolve(arg('--out','dialog-raster-evidence'));
mkdirSync(out,{recursive:true});
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const browser=await chromium.launch({headless:true,...(process.env.SEENRY_CHROME_PATH?{executablePath:process.env.SEENRY_CHROME_PATH}:{})});
const report={commit:execFileSync('git',['rev-parse','HEAD'],{cwd:dirname(gallery),encoding:'utf8'}).trim(),browser:browser.version(),harness:sha(fileURLToPath(import.meta.url)),source:Object.fromEntries(['gallery.html','gallery.js','seenry-transitions.js','seenry-transitions.css'].map(name=>[name,sha(join(dirname(gallery),name))])),scope:'Diagnostic only:320px light/dark native reduced preference, unchanged repository fixtures, unpaused video plus viewport PNGs bracketed by browser state. Screenshots and layout reads intervene in timing. Requested70ms API phases can finish during a PNG request. Browser performance, host monotonic/UTC screenshot request/completion timestamps and media PTS are distinct clocks without an asserted exact offset. A complete diagnostic, matching captures, or different captures do not establish clean product paint or its cause.',runs:[]};
const save=()=>writeFileSync(join(out,'results.json'),JSON.stringify(report,null,2)+'\n');

async function captureRaster(page,entry,{out,sha,save}){
 entry.before=await page.evaluate(()=>window.__rasterState());save();
 entry.hostCapture={requestedMonotonicMs:performance.now(),requestedUtc:new Date().toISOString()};
 try{
  try{await page.screenshot({path:join(out,entry.file),animations:'allow'});}
  finally{entry.hostCapture.completedMonotonicMs=performance.now();entry.hostCapture.completedUtc=new Date().toISOString();entry.hostCapture.elapsedMs=entry.hostCapture.completedMonotonicMs-entry.hostCapture.requestedMonotonicMs;}
  entry.sha256=sha(join(out,entry.file));entry.bytes=readFileSync(join(out,entry.file)).length;assert(entry.bytes>0);entry.status='captured';
 }catch(error){entry.status='failed';entry.error=String(error);throw error;}
 finally{entry.after=await page.evaluate(()=>window.__rasterState()).catch(error=>({error:String(error)}));if(entry.after.error&&entry.status==='captured')entry.status='captured-unbracketed';entry.sameObservedOpenState=entry.before.open===entry.after.open&&entry.before.lastAction===entry.after.lastAction;save();}
}

function installRasterObserver(){
 const dialog=document.querySelector('#dialog-1'),trigger=document.querySelector('#dialog-trigger'),cancel=dialog.querySelector('[autofocus]');
 const log=window.__raster={startedAt:performance.now(),phase:'setup',accepted:[],events:[],actions:[]};
 const rect=e=>e.getBoundingClientRect().toJSON();
 const paint=e=>{if(!e)return null;const cs=getComputedStyle(e),range=document.createRange();range.selectNodeContents(e);return {text:e.textContent.trim(),rect:rect(e),glyphs:[...range.getClientRects()].filter(r=>r.width>0&&r.height>0).map(r=>r.toJSON()),color:cs.color,background:cs.backgroundColor,fontSize:cs.fontSize,opacity:cs.opacity,filter:cs.filter,transform:cs.transform,visibility:cs.visibility,display:cs.display,clipPath:cs.clipPath,overflow:cs.overflow,ancestors:[...function*(n){for(let p=n.parentElement;p;p=p.parentElement)yield p;}(e)].map(p=>{const c=getComputedStyle(p);return {tag:p.tagName,id:p.id||null,rect:rect(p),opacity:c.opacity,filter:c.filter,visibility:c.visibility,display:c.display,clipPath:c.clipPath,overflow:c.overflow};})};};
 window.__rasterState=()=>{const cs=getComputedStyle(dialog),backdrop=getComputedStyle(dialog,'::backdrop'),active=document.activeElement;return {at:performance.now(),phase:log.phase,lastAction:log.actions.at(-1)?.kind||null,viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio,visual:visualViewport?{width:visualViewport.width,height:visualViewport.height,offsetLeft:visualViewport.offsetLeft,offsetTop:visualViewport.offsetTop,scale:visualViewport.scale}:null},reduced:matchMedia('(prefers-reduced-motion:reduce)').matches,open:dialog.open,modal:dialog.matches(':modal'),inert:dialog.inert,expanded:trigger.getAttribute('aria-expanded'),focus:active===trigger?'trigger':active===cancel?'Cancel':active?.id||active?.tagName,focusVisible:!!active?.matches(':focus-visible'),rect:rect(dialog),opacity:cs.opacity,transform:cs.transform,filter:cs.filter,backdrop:{opacity:backdrop.opacity,filter:backdrop.filter,backdropFilter:backdrop.getPropertyValue('backdrop-filter')},heading:paint(dialog.querySelector('h3')),description:paint(dialog.querySelector('#dlg-description')),cancel:paint(cancel),confirm:paint(dialog.querySelector('.dialog-destructive')),backgroundCopy:paint(document.querySelector('[data-key="dialog"] .caption p')),animations:dialog.getAnimations({subtree:true}).map(a=>({target:a.effect?.target===dialog?'dialog':a.effect?.target?.className||null,pseudo:a.effect?.pseudoElement||null,state:a.playState,currentTime:a.currentTime,properties:[...new Set(a.effect?.getKeyframes().flatMap(k=>Object.keys(k))||[])]}))};};
 document.addEventListener('click',e=>{const opening=e.target===trigger||trigger.contains(e.target),closing=dialog.contains(e.target)&&!!e.target.closest('[data-st-close]');if(opening||closing)log.accepted.push({kind:opening?'open':'close',trusted:e.isTrusted,detail:e.detail,control:closing?e.target.closest('[data-st-close]').textContent.trim():null,at:performance.now(),phase:log.phase,open:dialog.open,modal:dialog.matches(':modal'),focus:document.activeElement===cancel?'Cancel':document.activeElement===trigger?'trigger':document.activeElement.tagName});});
 dialog.addEventListener('cancel',e=>log.accepted.push({kind:'cancel',trusted:e.isTrusted,at:performance.now(),phase:log.phase,open:dialog.open,modal:dialog.matches(':modal')}));
 for(const type of ['pointerdown','pointerup','click','keydown'])document.addEventListener(type,e=>{if(log.events.length>=120)return;if(e.target===trigger||trigger.contains(e.target)||dialog.contains(e.target)||e.key==='Escape')log.events.push({type,key:e.key||null,trusted:e.isTrusted,detail:e.detail??null,at:performance.now(),phase:log.phase,target:e.target===trigger?'trigger':e.target.closest('[data-st-close]')?.textContent.trim()||e.target.tagName});},true);
}

try{
 for(const theme of ['light','dark']){
  const label=`320-${theme}-reduce`,run={label,width:320,height:780,theme,motion:'reduce',status:'running',captures:[],pageErrors:[]};report.runs.push(run);save();
  let context,page,video;
  try{
   context=await browser.newContext({viewport:{width:320,height:780},colorScheme:theme,reducedMotion:'reduce',serviceWorkers:'block',acceptDownloads:false,recordVideo:{dir:join(out,'raw'),size:{width:320,height:780}}});page=await context.newPage();video=page.video();page.setDefaultTimeout(4000);page.on('pageerror',e=>run.pageErrors.push(e.message));await page.route(/^https?:/,r=>r.abort());
   await page.goto(pathToFileURL(gallery).href);await page.evaluate(()=>document.fonts.ready);await page.locator('#library-search').fill('Dialog');if(!await page.locator('#blur-toggle').isChecked())await page.locator('label.blur-switch').click();await page.locator('#dialog-trigger').scrollIntoViewIfNeeded();await page.evaluate(installRasterObserver);
   const mark=phase=>page.evaluate(phase=>{window.__raster.phase=phase;},phase);
   const capture=async requestedPhase=>{const entry={requestedPhase,status:'requested',file:`${label}-${String(run.captures.length).padStart(2,'0')}-${requestedPhase}.png`};run.captures.push(entry);await captureRaster(page,entry,{out,sha,save});};
   await mark('rest');await page.waitForTimeout(300);await capture('rest');
   await mark('trusted-pointer-open');await page.locator('#dialog-trigger').click();await capture('pointer-open-request');await page.waitForTimeout(400);await capture('pointer-open-settled');
   await mark('trusted-pointer-Cancel');await page.locator('#dialog-1 [autofocus]').click();await capture('pointer-closed-request');await page.waitForTimeout(250);
   await page.locator('#dialog-trigger').focus();await mark('trusted-keyboard-Enter');await page.keyboard.press('Enter');await capture('keyboard-open-request');await page.waitForTimeout(400);
   await mark('trusted-keyboard-Escape');await page.keyboard.press('Escape');await capture('keyboard-closed-request');await page.waitForTimeout(250);
   await mark('trusted-open-timed-api-cycle');await page.evaluate(()=>{const d=document.querySelector('#dialog-1'),t=document.querySelector('#dialog-trigger'),log=window.__raster;const observe=e=>{if(e.target!==t&&!t.contains(e.target))return;document.removeEventListener('click',observe);const start=performance.now(),record=kind=>log.actions.push({kind,elapsedMs:performance.now()-start,at:performance.now(),trustedStarter:e.isTrusted,open:d.open,modal:d.matches(':modal'),inert:d.inert,focus:document.activeElement===t?'trigger':document.activeElement.textContent.trim().slice(0,30)});record('after-trusted-open');setTimeout(()=>{record('before-api-close');SeenryTransitions.close(d);record('after-api-close');setTimeout(()=>{record('before-api-reopen');SeenryTransitions.open(d,t);record('after-api-reopen');},70);},70);};document.addEventListener('click',observe);});
   await page.locator('#dialog-trigger').click();await capture('timed-open-request');await page.waitForFunction(()=>window.__raster.actions.some(x=>x.kind==='after-api-reopen'));await capture('api-reopened-request');await page.waitForTimeout(500);await capture('api-reopened-settled');
   await mark('trusted-final-Cancel');await page.locator('#dialog-1 [autofocus]').click();await capture('final-closed-request');await page.waitForTimeout(350);
   run.observations=await page.evaluate(()=>window.__raster);assert(run.observations.events.some(x=>x.type==='keydown'&&x.key==='Enter'&&x.trusted));assert(run.observations.events.some(x=>x.type==='keydown'&&x.key==='Escape'&&x.trusted));assert(run.observations.accepted.some(x=>x.kind==='open'&&x.trusted&&x.detail>0));assert(run.observations.accepted.some(x=>x.kind==='close'&&x.trusted&&x.control==='Cancel'));assert(run.observations.actions.some(x=>x.kind==='after-api-reopen'&&x.trustedStarter));assert.equal(run.captures.length,10);assert(run.captures.every(x=>x.status==='captured'));assert.equal(run.pageErrors.length,0);run.status='captured';
  }catch(error){run.status='failed';run.error=error.stack||String(error);if(page)run.observations=await page.evaluate(()=>window.__raster).catch(()=>null);}
  finally{
   if(context)await context.close();if(run.pageErrors.length){run.status='failed';run.error??='Captured native page errors: '+run.pageErrors.join('; ');}
   if(video){try{const raw=await video.path(),file=label+'.webm';renameSync(raw,join(out,file));run.video={file,sha256:sha(join(out,file)),bytes:readFileSync(join(out,file)).length};assert(run.video.bytes>0);}catch(error){run.status='failed';run.videoError=String(error);}}
   save();console.log(label+': '+run.status+' (diagnostic collection only)');
  }
 }
}finally{await browser.close();save();}
if(report.runs.some(r=>r.status!=='captured'))process.exitCode=1;
