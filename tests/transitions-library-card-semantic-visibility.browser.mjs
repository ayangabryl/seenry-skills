// Uninstrumented runtime acceptance for authored transition:all on Card visibility.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {cardReadableFindings} from './transitions-library-card-readable.mjs';
const arg=(n,d)=>{const i=process.argv.indexOf(n);return i<0?d:process.argv[i+1];};
assert(arg('--playwright'),'Pass existing Playwright with --playwright');
const gallery=resolve(arg('--gallery',fileURLToPath(new URL('../skills/seenry/assets/components/transitions/gallery.html',import.meta.url)))),out=resolve(arg('--out','card-semantic-visibility-results'));mkdirSync(out,{recursive:true});
const captureFile=fileURLToPath(new URL('./transitions-library-card-anchor-fallback.browser.mjs',import.meta.url)),text=readFileSync(captureFile,'utf8'),a='\nfunction capture(){\n',b='\nconst inside=(a,b)=>';assert.equal(text.split(a).length,2);assert.equal(text.split(b).length,2);const capture=text.slice(text.indexOf(a)+1,text.indexOf(b));assert(capture.endsWith('\n}'));
function install(captureSource){
 const read=(0,eval)(`(${captureSource})`),detail=document.querySelector('#expand-1'),source=window.__cardAnchorSource,close=detail.querySelector('[data-st-close]');
 const extra=()=>{const surface=detail.querySelector('.expand-surface');return {detailVisibility:getComputedStyle(detail).visibility,surfaceVisibility:getComputedStyle(surface).visibility,closeVisibility:getComputedStyle(close).visibility,visibilityJobs:[detail,...detail.querySelectorAll('*')].flatMap(e=>e.getAnimations().filter(a=>a.effect?.target===e&&!a.effect.pseudoElement&&a.transitionProperty==='visibility').map(a=>({tag:e.tagName,id:e.id,classes:e.className,currentTime:a.currentTime,playState:a.playState,keyframes:a.effect.getKeyframes()})))};};
 window.__cardVisibilityRead=()=>({...read(),...extra()});window.__cardVisibilityFocus=[];
 close.addEventListener('focus',()=>window.__cardVisibilityFocus.push({at:performance.now(),activeClose:document.activeElement===close}));
 document.addEventListener('click',event=>{
  if(!source.contains(event.target))return;
  window.__cardVisibilityInitial={trusted:event.isTrusted,detail:event.detail,observedAt:'document-bubble',...window.__cardVisibilityRead()};
  requestAnimationFrame(()=>window.__cardVisibilityFirstRAF=window.__cardVisibilityRead());
 });
 document.addEventListener('keydown',event=>{
  if(event.key!=='Escape'||event.target!==close)return;
  window.__cardVisibilityEscape={trusted:event.isTrusted,observedAt:'document-bubble',...window.__cardVisibilityRead()};
 });
 document.addEventListener('click',event=>{
  if(event.target!==close&&!close.contains(event.target))return;
  window.__cardVisibilityClose={trusted:event.isTrusted,targetIsClose:true,observedAt:'document-bubble',...window.__cardVisibilityRead()};
 });
}
function usable(row,p){assert.equal(row.open,'true');assert(row.focusedClose&&row.sourceHidden&&row.sourceGroupInert&&row.blur);assert.equal(row.surfaceVisibility,'visible');assert.equal(row.closeVisibility,'visible');assert.equal(row.visibilityJobs.length,0);assert(row.close.painted&&row.close.opacity>=.99&&row.close.filter==='none'&&row.close.ownsCenter);assert.equal(row.mode,p.unsupported?null:'css');}
function hidden(row){assert.equal(row.open,'false');assert.equal(row.closing,null);assert(!row.sourceHidden&&!row.sourceGroupInert&&row.sourceFocused);assert.equal(row.detailVisibility,'hidden');assert.equal(row.surfaceVisibility,'hidden');assert.equal(row.closeVisibility,'hidden');assert.equal(row.visibilityJobs.length,0);assert(!row.close.painted&&!row.title.painted);for(const leaf of [row.keyboardText.cue,...row.keyboardText.tracks.flatMap(t=>[t.name,t.duration])])assert(!leaf.painted,'Closed Card text cannot remain visibly painted');}
async function finalizeNativeCase(context,run,persist){
 try{await context.close();}catch(error){run.errors.push('Close context: '+String(error?.stack||error));}
 // Browser teardown may deliver a final page error. Decide only after it settles.
 if(run.errors.length||run.status!=='passed')run.status='failed';
 persist();
}
const profiles=[...['pointer','keyboard'].flatMap(input=>[false,true].map(unsupported=>({input,unsupported,reduced:false,width:input==='pointer'?320:390}))),...[false,true].map(unsupported=>({input:'pointer',unsupported,reduced:true,width:1440}))];
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),{chromium}=await import(pathToFileURL(resolve(arg('--playwright'))).href),browser=await chromium.launch({headless:true,...(process.env.SEENRY_CHROME_PATH?{executablePath:process.env.SEENRY_CHROME_PATH}:{})}),report={browser:browser.version(),source:Object.fromEntries(['gallery.html','gallery.js','seenry-transitions.js','seenry-transitions.css'].map(n=>[n,sha(join(dirname(gallery),n))])),capture:{sha256:sha(captureFile)},scope:'Six trusted-input native cases with authored all/color transitions, supported and forced-unsupported anchors, immediate keyboard and reduced final hiding. Production focus is not intercepted.',runs:[],errors:[]};
try{for(const p of profiles){const id=`${p.width}-${p.input}-${p.reduced?'reduce':'normal'}-${p.unsupported?'fallback':'supported'}`,run={...p,id,status:'running',errors:[]},context=await browser.newContext({viewport:{width:p.width,height:1000},reducedMotion:p.reduced?'reduce':'no-preference',colorScheme:'light',serviceWorkers:'block'}),page=await context.newPage();report.runs.push(run);page.setDefaultTimeout(5000);page.on('pageerror',e=>run.errors.push(e.message));await page.route(/^https?:/,r=>r.abort());
 try{
  if(p.unsupported)await page.addInitScript(()=>{const original=CSS.supports.bind(CSS);CSS.supports=(...args)=>args[0]==='position-anchor'?false:original(...args);});
  await page.goto(pathToFileURL(gallery).href);await page.evaluate(()=>document.fonts.ready);if(!await page.locator('#blur-toggle').isChecked())await page.locator('label.blur-switch').click();assert(await page.evaluate(()=>document.documentElement.hasAttribute('data-st-blur')));
  const card=page.locator('[data-key="expand"]'),source=card.locator('.cover-card').nth(1),surface=card.locator('.expand-surface'),close=card.locator('[data-st-close]');await source.scrollIntoViewIfNeeded();await page.waitForTimeout(150);
  run.authoredBefore=await surface.evaluate((e,important)=>{const values={'background-color':'rgb(255, 255, 255)','overflow-x':'visible','overflow-y':'clip','transition-property':'all, color','transition-duration':'100ms, 240ms','transition-delay':'0ms, 25ms'};for(const[k,v]of Object.entries(values))e.style.setProperty(k,v,(k==='transition-property'?important:['background-color','overflow-x','transition-duration'].includes(k))?'important':'');return Object.fromEntries(Object.keys(values).map(k=>[k,{value:e.style.getPropertyValue(k),priority:e.style.getPropertyPriority(k)}]));},p.input==='keyboard');
  await source.evaluate(e=>window.__cardAnchorSource=e);await page.evaluate(install,capture);
  if(p.input==='keyboard'){await source.focus();await page.keyboard.press('Enter');}else await source.locator('[data-st-close-anchor]').click();
  await page.waitForFunction(()=>window.__cardVisibilityFirstRAF);run.initial=await page.evaluate(()=>window.__cardVisibilityInitial);run.firstRAF=await page.evaluate(()=>window.__cardVisibilityFirstRAF);assert(run.initial.trusted);assert.equal(run.initial.detail,p.input==='keyboard'?0:1);usable(run.initial,p);usable(run.firstRAF,p);run.focus=await page.evaluate(()=>window.__cardVisibilityFocus);assert.equal(run.focus.length,1,'Opening acquires Close focus once');
  if(p.input==='keyboard'||p.unsupported){assert.equal(run.initial.instant,true);assert.deepEqual(cardReadableFindings(run.initial),[]);assert.deepEqual(cardReadableFindings(run.firstRAF),[]);}else if(!p.reduced){assert.equal(run.initial.instant,false);assert(run.initial.animations.some(a=>a.properties.includes('clipPath')&&a.playState==='running'),'Supported pointer opening retains real shell motion');}
  await page.waitForFunction(()=>[document.querySelector('#expand-1 .expand-surface'),...document.querySelectorAll('#expand-1 .expand-surface *')].every(e=>e.getAnimations().every(a=>a.playState!=='running'||!Number.isFinite(a.effect.getComputedTiming().endTime))));run.settled=await page.evaluate(()=>window.__cardVisibilityRead());usable(run.settled,p);assert.deepEqual(cardReadableFindings(run.settled),[]);assert.equal(run.settled.title.text,'Night Swim');
  run.frame=id+'-open.png';await card.screenshot({path:join(out,run.frame),animations:'allow'});
  if(p.input==='keyboard'){await page.keyboard.press('Escape');run.closedInitial=await page.evaluate(()=>window.__cardVisibilityEscape);assert(run.closedInitial.trusted);hidden(run.closedInitial);}else{await close.click();run.closeAccepted=await page.evaluate(()=>window.__cardVisibilityClose);assert(run.closeAccepted.trusted&&run.closeAccepted.targetIsClose);if(p.unsupported)hidden(run.closeAccepted);else assert.equal(run.closeAccepted.closing,'true');}
  await page.waitForFunction(()=>document.querySelector('#expand-1').dataset.stOpen==='false'&&!document.querySelector('#expand-1').dataset.stClosing);run.closed=await page.evaluate(()=>window.__cardVisibilityRead());hidden(run.closed);
  run.authoredAfter=await surface.evaluate((e,keys)=>Object.fromEntries(keys.map(k=>[k,{value:e.style.getPropertyValue(k),priority:e.style.getPropertyPriority(k)}])),Object.keys(run.authoredBefore));assert.deepEqual(run.authoredAfter,run.authoredBefore);assert.equal(run.errors.length,0);run.status='passed';
 }catch(e){run.status='failed';run.error=e.stack||e.message;run.current=await page.evaluate(()=>window.__cardVisibilityRead?.()).catch(()=>null);await page.screenshot({path:join(out,id+'-FAILED.png')}).catch(()=>{});}finally{await finalizeNativeCase(context,run,()=>{writeFileSync(join(out,id+'-case.json'),JSON.stringify(run,null,2)+'\n');writeFileSync(join(out,'results.json'),JSON.stringify(report,null,2)+'\n');});}
}}finally{try{await browser.close();}catch(error){report.errors.push('Close browser: '+String(error?.stack||error));}writeFileSync(join(out,'results.json'),JSON.stringify(report,null,2)+'\n');}
console.log(`${report.runs.filter(r=>r.status==='passed').length}/${profiles.length} native Card semantic visibility cases passed`);if(report.errors.length||report.runs.some(r=>r.status!=='passed'))process.exitCode=1;
