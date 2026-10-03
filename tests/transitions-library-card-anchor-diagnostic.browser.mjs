// Diagnostic only: isolated runtime injection preserves the pin guard read order.
// Original and instrumented identities are recorded; this is not acceptance evidence.
import {readFileSync,mkdirSync,writeFileSync,mkdtempSync,cpSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {instrumentPin} from './transitions-library-card-anchor-instrument.mjs';
import {dirname,resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const arg=(n,d)=>{const i=process.argv.indexOf(n);return i<0?d:process.argv[i+1];};
if(!arg('--playwright')||!arg('--gallery'))throw Error('Pass existing --playwright and exact --gallery');
const {chromium}=await import(pathToFileURL(resolve(arg('--playwright'))).href),gallery=resolve(arg('--gallery')),out=resolve(arg('--out','card-anchor-diagnostic'));mkdirSync(out,{recursive:true});
function finalizeRun(run){
 if(run.errors.length){run.status='failed';run.error??='Captured native page error: '+run.errors.join('; ');}return run;
}
function installAnchorState(){
 const summary=e=>{if(!e)return null;const c=getComputedStyle(e);return {tag:e.tagName,id:e.id||null,classes:e.className,rect:e.getBoundingClientRect().toJSON(),inline:e.getAttribute('style'),position:c.position,positionAnchor:c.positionAnchor,positionVisibility:c.positionVisibility,anchorName:c.anchorName,top:c.top,left:c.left,transform:c.transform,translate:c.translate,visibility:c.visibility,display:c.display,opacity:c.opacity,inert:e.inert};};
 window.__anchorState=()=>{const close=document.querySelector('#expand-1 [data-st-close]');return {at:performance.now(),open:document.querySelector('#expand-1')?.dataset.stOpen,mode:close?.dataset.stClosePinned||null,close:summary(close),anchors:[...document.querySelectorAll('[data-st-close-anchor]')].map(summary)};};
}
const fixture=mkdtempSync(join(tmpdir(),'seenry-anchor-diagnostic-'));cpSync(dirname(gallery),fixture,{recursive:true});
const originalRuntime=readFileSync(join(dirname(gallery),'seenry-transitions.js'),'utf8'),instrumentedRuntime=instrumentPin(originalRuntime);writeFileSync(join(fixture,'seenry-transitions.js'),instrumentedRuntime);
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),browser=await chromium.launch({headless:true,...(process.env.SEENRY_CHROME_PATH?{executablePath:process.env.SEENRY_CHROME_PATH}:{})}),report={browser:browser.version(),scope:'Instrumented diagnostic runtime logs the existing pin guard values before restoration, without adding pre-decision layout reads. Product HTML/CSS/galleryJS are unchanged. This is separate from uninstrumented acceptance.',instrumentedRuntimeSha256:sha(join(fixture,'seenry-transitions.js')),instrumentationSha256:sha(new URL('./transitions-library-card-anchor-instrument.mjs',import.meta.url)),diagnosticSha256:sha(new URL(import.meta.url)),source:Object.fromEntries(['gallery.html','gallery.js','gallery-menu.js','seenry-transitions.js','seenry-transitions.css'].map(n=>[n,sha(join(dirname(gallery),n))])),runs:[]};
try{for(const [width,index] of [[320,0],[320,2],[390,1]]){
 const context=await browser.newContext({viewport:{width,height:1000},colorScheme:'light',reducedMotion:'no-preference',serviceWorkers:'block'}),page=await context.newPage(),run={width,index,status:'running',errors:[]};report.runs.push(run);page.on('pageerror',e=>run.errors.push(e.message));await page.route(/^https?:/,r=>r.abort());await page.addInitScript(installAnchorState);
 try{await page.goto(pathToFileURL(join(fixture,'gallery.html')).href);await page.evaluate(()=>document.fonts.ready);const card=page.locator('[data-key="expand"]'),source=card.locator('.cover-card').nth(index);await card.scrollIntoViewIfNeeded();await page.waitForTimeout(300);await page.evaluate(()=>{document.addEventListener('click',e=>{const source=e.target.closest('.cover-card');if(!source)return;window.__anchorAccepted={trusted:e.isTrusted,detail:e.detail,...window.__anchorState()};requestAnimationFrame(()=>window.__anchorFirstRAF=window.__anchorState());});});await source.locator('[data-st-close-anchor]').click();await page.waitForFunction(()=>window.__anchorFirstRAF);run.accepted=await page.evaluate(()=>window.__anchorAccepted);run.firstRAF=await page.evaluate(()=>window.__anchorFirstRAF);await page.waitForTimeout(650);run.settled=await page.evaluate(()=>window.__anchorState());run.diagnostic=await page.evaluate(()=>window.__anchorDiagnostic);run.frame=`${width}-${index}-settled.png`;await card.screenshot({path:join(out,run.frame)});run.status=run.firstRAF.mode==='css'?'pinned':'fallback';}
 catch(e){run.status='failed';run.error=e.stack||e.message;run.diagnostic=await page.evaluate(()=>window.__anchorDiagnostic).catch(()=>null);}
 finally{await context.close();finalizeRun(run);writeFileSync(join(out,`${width}-${index}-case.json`),JSON.stringify(run,null,2)+'\n');writeFileSync(join(out,'results.json'),JSON.stringify(report,null,2)+'\n');}
}}finally{await browser.close();writeFileSync(join(out,'results.json'),JSON.stringify(report,null,2)+'\n');rmSync(fixture,{recursive:true,force:true});}
console.log(JSON.stringify(report.runs.map(({width,index,status,errors})=>({width,index,status,errors})),null,2));if(report.runs.some(r=>r.status!=='pinned'))process.exitCode=1;
