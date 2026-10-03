// Native execution only on the existing authorized GitHub CI route.
// --verify-only and --merge are browser-free. No installation, publishing, or workflow edits.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync,writeFileSync,mkdirSync,renameSync,readdirSync,statSync,existsSync} from 'node:fs';
import {join,dirname,resolve,basename} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {platform,release} from 'node:os';
import {VERSION,ASSETS,HARNESS,PROFILES,SHARDS,CALLBACK_PROFILE,STILL_STEPS,PHONE_TEXT_TARGETS,typographyPlan,verifyPlan,actionPlan,verifyManifest,assertRunIdentity,firstPaintResult,immediateIssues,progressed,exactSet,reconcileCase,assertStepEvidence,assertVideoProbe,videoProbeFailure,functionalSuccess,closeState,parentOpen,finalizeCase,finalizeReport,mergeReports} from './transitions-library-menu-native-contract.mjs';
import {sha256,nativeClipGeometry,boundedOperation} from './transitions-library-menu-discovery-helpers.mjs';
import {installMenuCaptureClock,installMenuObserver,captureSettledMenuTypography} from './transitions-library-menu-native-observer.mjs';

const here=dirname(fileURLToPath(import.meta.url));
const arg=(name,fallback)=>{const i=process.argv.indexOf(name);if(i<0)return fallback;assert(process.argv[i+1]&&!process.argv[i+1].startsWith('--'),`${name}: value required`);return process.argv[i+1];};
const plan=verifyPlan();
const atomic=(path,value)=>{const tmp=path+'.tmp';writeFileSync(tmp,JSON.stringify(value,null,2)+'\n');renameSync(tmp,path);};
if(process.argv.includes('--merge')){
 let output=resolve('menu-native-union.json'),paths=[],callbackPath=null;const reports=[],inventory=[];
 const inspectInput=path=>{let row=inventory.find(r=>r.path===path);if(row)return row;row={path,status:'declared'};inventory.push(row);try{const stat=statSync(path);row.bytes=stat.size;row.status=stat.isFile()?'available-unread':'not-file';}catch(error){row.status='unavailable';row.error=String(error);}return row;};
 const readIndex=path=>{const row=inspectInput(path);try{const report=JSON.parse(readFileSync(path,'utf8'));assert(report&&typeof report==='object'&&!Array.isArray(report),'Index must be a JSON object');row.status='parsed';row.sha256=sha256(path);row.shard=report.shard??null;row.reportedStatus=report.status??null;return {...report,_file:path};}catch(error){row.status='failed';row.error=error.stack||String(error);throw error;}};
 try{
  output=resolve(arg('--out','menu-native-union.json'));paths=arg('--merge').split(',').map(path=>resolve(path));callbackPath=arg('--callback')?resolve(arg('--callback')):null;
  for(const path of [...paths,...(callbackPath?[callbackPath]:[])])inspectInput(path);
  assert(paths.length===8,'Provide exactly 8 shard index paths');for(const path of paths)reports.push(readIndex(path));
  const callback=callbackPath?readIndex(callbackPath):null;
  const result=mergeReports(reports,(report,entry)=>{
   assert.equal(entry.json,`${entry.id}/case.json`,'Case path must be the declared profile-local evidence file');
   const dir=join(dirname(report._file),entry.id),run=JSON.parse(readFileSync(join(dir,'case.json'),'utf8'));
   for(const media of [run.video,...(run.stills||[])]){assert(media&&/^[a-zA-Z0-9-]+\.(webm|png)$/.test(media.file),'Invalid or missing media filename');const path=join(dir,media.file);assert.equal(statSync(path).size,media.bytes,'Media byte count mismatch');assert.equal(sha256(path),media.sha256,'Media digest mismatch');}
   return run;
  },callback);
  result.declaredInputs={shards:paths,callback:callbackPath};result.inputInventory=inventory;
  atomic(output,result);console.log(JSON.stringify(result,null,2));process.exit(functionalSuccess(result)?0:2);
 }catch(error){
  const result={version:VERSION,status:'incomplete',functionalStatus:'failed',fatalError:error.stack||String(error),issues:[{kind:'merge-input',reason:String(error)}],declaredInputs:{shards:paths,callback:callbackPath},inputInventory:inventory,partialReports:reports.map(r=>({path:r._file,shard:r.shard??null,reportedStatus:r.status??null})),profiles:[],controlledProfile:null,visualVerdict:'unverified',motionScore:null};
  try{atomic(output,result);}catch(writeError){console.error('Could not retain failed union JSON:',String(writeError));}
  console.error(result.fatalError);process.exit(2);
 }
}

const gallery=resolve(arg('--gallery',join(here,'../skills/seenry/assets/components/transitions/gallery.html')));
const pinsPath=resolve(arg('--pins',join(here,'transitions-library-menu-native.pins.example.json'))),pins=JSON.parse(readFileSync(pinsPath,'utf8'));
if(process.argv.includes('--verify-only')){
 const sources=verifyManifest(gallery,pins,here,{allowUnfrozen:!pins.frozen});
 console.log(JSON.stringify({mode:'verify-only',plan,sources,nativeExecution:'not-run',sourceAcceptance:pins.frozen?'frozen-manifest-verified':'unverified-until-final-composition',qualityVerdict:'unverified'},null,2));process.exit(0);
}
if(process.env.GITHUB_ACTIONS!=='true'||process.env.CI!=='true')throw Error('Native launch refused outside existing authorized GitHub CI. Use --verify-only locally.');
if(process.env.SEENRY_CHROME_PATH||process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH)throw Error('Alternate Chromium binaries are outside this route');
const sources=verifyManifest(gallery,pins,here);
const shard=process.argv.includes('--callback-only')?'callback':Number(arg('--shard'));assert(shard==='callback'||Number.isInteger(shard)&&SHARDS.some(s=>s.id===shard),'One --shard 0..7 or --callback-only is mandatory; there is no unbounded all-cases mode');
const modulePath=resolve(arg('--playwright')),pkg=JSON.parse(readFileSync(join(dirname(modulePath),'package.json'),'utf8'));
assert.equal(pkg.name,'playwright');assert.equal(pkg.version,'1.63.0','Use existing CI-installed Playwright 1.63.0; do not install a runtime');
const out=resolve(arg('--out',`menu-native-shard-${shard}`));mkdirSync(out,{recursive:true});assert(!existsSync(join(out,'index.json')),'Use a fresh evidence directory; original failures cannot be overwritten');
const profiles=shard==='callback'?[CALLBACK_PROFILE]:PROFILES.filter(p=>p.shard===shard),runs=[];
const report={version:VERSION,shard,status:'running',source:sources,manifestSHA256:sha256(pinsPath),startedUtc:new Date().toISOString(),environment:{platform:platform(),release:release(),playwright:pkg.version,playwrightModuleSHA256:sha256(modulePath)},errors:[],cases:profiles.map(p=>({id:p.id,status:'not-attempted',json:`${p.id}/case.json`})),bounds:{collectionMs:165000,hardExitMs:190000,caseMs:60000,perInputMs:3000,settlementMs:2200,firstObservationMs:50},clockContract:'Browser performance timestamps, host performance timestamps/UTC, and media packet PTS are independent. Screenshot intervals are bracketed; no exact cross-clock alignment or full-frame coverage is claimed.',qualityVerdict:'unverified',unverified:['native pixel readability/focus review','normal and slow playback review','independent motion/visual judge','touch device','browser zoom','native assistive technology']};
try{report.checkoutHead=execFileSync('git',['rev-parse','HEAD'],{cwd:dirname(gallery),encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();}catch{report.checkoutHead=null;}
report.runIdentity={checkoutHead:report.checkoutHead,githubRunId:process.env.GITHUB_RUN_ID??null,githubRunAttempt:process.env.GITHUB_RUN_ATTEMPT??null};
let browser,server,origin,current,activeCapture,stopping=false,executionEnded=false;
const save=run=>{if(run)atomic(join(out,run.id,'case.json'),run);for(const e of report.cases){const r=runs.find(x=>x.id===e.id);if(r){e.status=r.status;e.failures=r.failures.length;e.errors=r.errors.length;}}atomic(join(out,'index.json'),report);};
save();
const ensureRunning=()=>{if(stopping)throw Error('Shard collection stopped; no new inputs allowed');};
const inventoryFiles=()=>{const walk=(dir,depth=0)=>depth>3?[]:readdirSync(dir,{withFileTypes:true}).flatMap(e=>{const file=join(dir,e.name);return e.isDirectory()?walk(file,depth+1):[{file:file.slice(out.length+1),bytes:statSync(file).size}];});try{return walk(out).slice(0,250);}catch(e){return [{error:String(e)}];}};
let rejectDeadline;const deadline=new Promise((_,reject)=>{rejectDeadline=reject;});
const watchdog=setTimeout(()=>{stopping=true;report.status='failed';report.errors.push({kind:'deadline',reason:'165-second collection window exhausted'});report.diagnosticInventory=inventoryFiles();save(current);rejectDeadline(Error('Shard deadline'));},165000);
const hardStop=setTimeout(()=>{stopping=true;report.status='failed';report.errors.push({kind:'hard-deadline',reason:'190-second cap; unfinished evidence/finalization remains failed'});report.diagnosticInventory=inventoryFiles();save(current);process.exit(2);},190000);

const sel=control=>control.startsWith('trigger:')?`[data-menu-file="${control.slice(8)}"] [data-menu-trigger]`:control.startsWith('action:')?`#menu-1 [data-menu-action="${control.slice(7)}"]`:({save:'#menu-rename [type="submit"]',cancel:'[data-menu-cancel]',reset:'[data-menu-reset]',undo:'[data-menu-undo]',detail:'[data-detail="menu"]','editor-input':'#menu-rename-name',blur:'label.blur-switch'})[control];
async function tabTo(page,selector){for(let i=0;i<40;i++){ensureRunning();if(await page.locator(selector).evaluate(e=>document.activeElement===e))return;await page.keyboard.press('Tab');}throw Error(`Real Tab traversal could not reach ${selector}`);}
async function focusAction(page,control){
 if(control.startsWith('action:')){await page.keyboard.press('Home');for(let i=0;i<4;i++){if(await page.locator(sel(control)).evaluate(e=>document.activeElement===e))return;await page.keyboard.press('ArrowDown');}throw Error(`Enabled menu action unavailable: ${control}`);}
 await tabTo(page,sel(control));
}
async function prepare(page,run){
 page.setDefaultTimeout(3000);page.setDefaultNavigationTimeout(6000);
 await page.addInitScript({content:`(${installMenuCaptureClock.toString()})();window.__menuNativeClipGeometry=${nativeClipGeometry.toString()};window.__menuNativeProgressed=${progressed.toString()};window.__menuPhoneTypographyTargets=${JSON.stringify(PHONE_TEXT_TARGETS)};window.__menuCaptureSettledTypography=${captureSettledMenuTypography.toString()};`});
 const log=(kind,message)=>{if(run.errors.length<80)run.errors.push({kind,message:String(message).slice(0,1200),hostAt:performance.now()});else run.inventoryOverflow=true;save(run);};
 page.on('pageerror',e=>log('pageerror',e.stack||e.message));page.on('crash',()=>log('page-crash','Native page crashed'));
 page.on('console',m=>{if(m.type()==='error')log('console-error',m.text());else if(m.type()==='warning'&&run.warnings.length<30)run.warnings.push(m.text().slice(0,500));});
 page.on('requestfailed',r=>log('request-failed',`${r.url()} ${r.failure()?.errorText}`));
 page.on('response',r=>{if(r.status()>=400)log('http-error',`${r.status()} ${r.url()}`);});
 await page.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort('blockedbyclient'));
 await page.goto(origin+'/gallery.html');await page.evaluate(()=>document.fonts.ready);
 await page.locator(`[data-theme-choice="${run.profile.theme}"]`).click();await page.locator('#library-search').fill('Menu');
 await page.waitForFunction(()=>[...document.querySelectorAll('#library-grid > [data-key]')].filter(e=>!['menu','morph'].includes(e.dataset.key)).every(e=>e.hidden));
 await page.locator('#menu-trigger').scrollIntoViewIfNeeded();await page.evaluate(installMenuObserver);
 const prepared=await page.evaluate(()=>window.__menuNative.settle());assert.equal(prepared.status,'native-finite-settlement-observed','Fixture ancestors must settle before measurement');
 run.environment=await page.evaluate(()=>({width:innerWidth,height:innerHeight,dpr:devicePixelRatio,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,theme:document.documentElement.dataset.theme,fine:matchMedia('(pointer:fine)').matches,hover:matchMedia('(hover:hover)').matches,touchPoints:navigator.maxTouchPoints,blur:document.querySelector('#blur-toggle').checked,userAgent:navigator.userAgent}));
 assert.equal(run.environment.width,run.profile.width);assert.equal(run.environment.theme,run.profile.theme);assert.equal(run.environment.reduced,run.profile.motion==='reduce');assert.equal(run.environment.blur,false);
 save(run);
}
async function inputStep(page,step,a,run){
 ensureRunning();assert(!run.stopped,'Case stopped; input withheld');
 if(step.op==='inspect')return;
 if(step.op==='callback'){
  a.callbackEvidence=await page.evaluate(async()=>{
   const menu=document.querySelector('#menu-1'),trigger=document.querySelector('#menu-trigger'),trace=window.__menuNative,actionId=trace.active.id,beforetoggle=[];let closeCalls=0,closeRequestedAt=null,closeReturnedAt=null,afterClose=null;
   const callback=event=>{
    const original=trace.eventMap.get(event),callbackAt=performance.now(),state=trace.snapshot(true);beforetoggle.push({...original,callbackAt,state});
    if(event.newState==='open'){closeCalls++;closeRequestedAt=performance.now();window.SeenryTransitions.close(menu,{instant:true,silent:true});closeReturnedAt=performance.now();afterClose=trace.snapshot(true);}
   };
   menu.addEventListener('beforetoggle',callback);const requestedAt=performance.now();
   try{window.SeenryTransitions.open(menu,trigger,{keyboard:false});const returnedAt=performance.now(),sync=trace.snapshot(true);const firstRAF=await new Promise(resolve=>requestAnimationFrame(rafTimestamp=>{const callbackAt=performance.now(),state=trace.snapshot(true);resolve({actionId,sequence:1,rafTimestamp,callbackAt,state});}));return {kind:'controlled-production-API-callback',actionId,requestedAt,returnedAt,beforetoggle,closeCalls,closeRequestedAt,closeReturnedAt,afterClose,sync,firstRAF};}
   finally{menu.removeEventListener('beforetoggle',callback);}
  });return;
 }
 if(step.op==='observe-duration'){const t=performance.now();await new Promise(r=>setTimeout(r,step.durationMs));a.observedDurationMs=performance.now()-t;return;}
 if(step.op==='type'){await page.keyboard.press('ControlOrMeta+A');if(step.value)await page.keyboard.insertText(step.value);else await page.keyboard.press('Backspace');return;}
 if(step.op==='search'){
  assert.equal(await page.evaluate(()=>window.__menuNative.snapshot(false).focus),'search','Trusted Search handoff missing');
  await page.keyboard.press('ControlOrMeta+A');await page.keyboard.insertText(step.value);
  await page.waitForFunction(({value,hidden})=>{const s=window.__menuNative.snapshot(false);return s.search.value===value&&s.menuCard.hidden===hidden;},{value:step.value,hidden:step.check==='search-retired'},{timeout:2200,polling:'raf'});return;
 }
 if(step.op==='blur'){await page.locator('label.blur-switch').click();return;}
 if(step.op==='key'){await page.keyboard.press(step.key);return;}
 if(step.op==='interrupt'){
  await page.waitForFunction(()=>window.__menuNativeProgressed(window.__menuNative.snapshot(false)),{},{timeout:600,polling:'raf'});
  if(step.input==='key'){await page.keyboard.press(step.key);return;}
 }
 if(step.op==='original-click'||step.op==='interrupt'){
  const hit=await page.evaluate(()=>window.__menuNative.snapshot(false));assert.equal(hit.trigger.hit,true,'Original trigger no longer owns point; click withheld');await page.mouse.click(a.originalPoint.x,a.originalPoint.y);return;
 }
 if(step.mode==='keyboard'){await page.keyboard.press(step.key||'Enter');return;}
 if(step.op==='open'){assert(a.before.trigger.hit,'Trigger point unavailable');await page.mouse.click(a.originalPoint.x,a.originalPoint.y);return;}
 await page.locator(sel(step.control)).click();
}
async function collectStep(page,run,step){
 ensureRunning();assert(!run.stopped,'Case stopped; new action withheld');
 const a={id:`${run.id}/${step.id}`,stepId:step.id,status:'requested',op:step.op,mode:step.mode,row:step.row,targetControl:step.op==='open'||step.op==='original-click'||step.op==='interrupt'&&step.input==='original-click'?`trigger:${step.row}`:step.control??null,events:[],accepted:[],frames:[],lifecycle:[],hostRequest:{at:performance.now(),utc:new Date().toISOString()}};
 run.actions.push(a);save(run); // Durable stub before traversal, arming, or dispatch.
 try{
  if(step.op==='open'){await page.locator(sel(`trigger:${step.row}`)).scrollIntoViewIfNeeded();if(step.mode==='keyboard')await tabTo(page,sel(`trigger:${step.row}`));}
  if(step.op==='activate'&&step.mode==='keyboard')await focusAction(page,step.control);
  if(step.op==='original-click'||step.op==='interrupt')a.originalPoint=run.originalPoints[step.row];
  if(step.check==='parent-escape'){const s=await page.evaluate(()=>window.__menuNative.snapshot(false));assert(parentOpen(s)&&closeState(s),'Independent parent Escape boundary missing; key withheld');}
  const armed=await page.evaluate(r=>window.__menuNative.arm(r),{id:a.id,row:a.row,targetControl:a.targetControl,mode:a.mode,originalPoint:a.originalPoint,progressRequired:step.op==='interrupt'});Object.assign(a,armed);a.status='running';save(run);
  await inputStep(page,step,a,run);a.hostInputCompleted={at:performance.now(),utc:new Date().toISOString()};
  if(step.settle!==false){a.settlement=await page.evaluate(()=>window.__menuNative.settle());assert.equal(a.settlement.status,'native-finite-settlement-observed');}
  const observed=await page.evaluate(()=>window.__menuNative.finish());assert.equal(observed.id,a.id);Object.assign(a,observed);
  if(typographyPlan(run.profile).includes(step.id))a.settledTypography=await page.evaluate(actionId=>window.__menuNative.typography({actionId}),a.id);
  if(step.op==='open')run.originalPoints[step.row]=a.originalPoint;
  if(step.op==='open'||step.op==='activate'||step.op==='original-click'||step.op==='blur'){
   const control=step.op==='blur'?'blur':a.targetControl;assert(a.events.some(e=>e.type==='click'&&e.trusted&&e.control===control),'Target-owned trusted click missing');
   if(step.mode==='keyboard')assert(a.events.some(e=>e.type==='keydown'&&e.trusted&&['Enter',' '].includes(e.key)&&e.control===control),'Trusted keyboard activation missing');
  }
  if(step.op==='key')assert(a.events.some(e=>e.type==='keydown'&&e.trusted&&e.key===step.key),'Trusted requested key missing');
  if(step.op==='type')assert(a.events.some(e=>e.type==='input'&&e.trusted&&e.control==='editor-input'),'Trusted editor input missing');
  if(step.op==='interrupt'){
   const event=a.events.find(e=>e.trusted&&((step.input==='key'&&e.type==='keydown'&&e.key===step.key)||(step.input==='original-click'&&e.type==='click'&&e.control===`trigger:${step.row}`)));
   assert(event&&progressed(event.interruptionState),'No actual positive/nonpending Menu transform at trusted interruption input');
   a.progressEvidence={eventId:event.eventId,state:event.interruptionState};
  }
  assertStepEvidence(step,a,run);a.status='observed';
 }catch(error){a.status='failed';a.error=error.stack||String(error);run.failures.push({kind:'action',action:step.id,reason:a.error});
  try{const observed=await boundedOperation(()=>page.evaluate(()=>window.__menuNative?.finish()),1200,'failed-action-trace');if(observed?.id===a.id)Object.assign(a,observed,{status:'failed',error:a.error});}catch(e){a.recoveryError=String(e);}
  save(run);throw error; // Do not drive destructive/dependent actions from a failed state.
 }
 save(run);return a;
}
async function still(page,run,label){
 const entry={label,file:`${label}.png`,status:'requested',hostRequest:{at:performance.now(),utc:new Date().toISOString()},clock:'Diagnostic unpaused capture interval, not an exact first frame'};run.stills.push(entry);save(run);
 try{entry.before=await page.evaluate(()=>window.__menuNative.snapshot(true));await page.screenshot({path:join(out,run.id,entry.file),animations:'allow',timeout:3000});entry.after=await page.evaluate(()=>window.__menuNative.snapshot(true));entry.bytes=statSync(join(out,run.id,entry.file)).size;entry.sha256=sha256(join(out,run.id,entry.file));entry.status='captured';}
 catch(error){entry.status='failed';entry.error=String(error);run.failures.push({kind:'screenshot',reason:String(error)});}entry.hostCompleted={at:performance.now(),utc:new Date().toISOString()};save(run);
}
function videoMetadata(path){
 const result={file:basename(path),bytes:statSync(path).size,sha256:sha256(path),finalized:true,playback:'Unpaused native recording; pixels unreviewed',clock:'Media packet PTS only; no offset to browser/host clocks',fullFrameCoverage:'unverified',screenshotsDuringSequence:true};
 try{const value=JSON.parse(execFileSync('ffprobe',['-v','error','-select_streams','v:0','-show_entries','format=duration:stream=codec_name,width,height,r_frame_rate:packet=pts_time,duration_time','-of','json',path],{encoding:'utf8',timeout:1500,maxBuffer:1024*1024}));result.probe={status:'observed',...value};assertVideoProbe(result.probe);}catch(error){result.probe={...result.probe,...videoProbeFailure(error)};}return result;
}
async function makeCapture(run){
 const c={context:null,page:null,video:null,finalization:null};activeCapture=c;
 c.finish=()=>c.finalization??=finalizeCase(run,{bound:boundedOperation,persist:()=>save(run),recover:async()=>{if(!c.page)return;const inv=await c.page.evaluate(()=>window.__menuNative?.inventory());run.recoveredInventory=inv;if(inv?.active){const a=run.actions.find(a=>a.id===inv.active.id);if(a)Object.assign(a,{interruptedTrace:inv.active});}if(inv?.dropped)run.inventoryOverflow=true;},closePage:async()=>{if(c.page)await c.page.close();else throw Error('Native page was never created');},closeContext:async()=>{if(c.context)await c.context.close();else throw Error('Native context was never created');},finalizeMedia:async()=>{if(!c.video)throw Error('Native video handle missing');const path=join(out,run.id,'native-speed.webm');renameSync(await c.video.path(),path);run.video=videoMetadata(path);}});
 c.context=await browser.newContext({viewport:{width:run.profile.width,height:780},deviceScaleFactor:1,colorScheme:run.profile.theme,reducedMotion:run.profile.motion,hasTouch:false,isMobile:false,serviceWorkers:'block',acceptDownloads:false,recordVideo:{dir:join(out,run.id,'raw'),size:{width:run.profile.width,height:780}}});
 if(stopping){await c.finish();throw Error('Context arrived after deadline');}c.page=await c.context.newPage();c.video=c.page.video();return c;
}
async function execute(){
 assertRunIdentity(report.runIdentity);
 server=createServer((request,response)=>{const name=new URL(request.url,'http://127.0.0.1').pathname.slice(1);if(name==='favicon.ico'){response.writeHead(204);response.end();return;}if(!ASSETS.includes(name)){response.writeHead(404);response.end('Fixture asset not allowed');return;}try{const data=readFileSync(join(dirname(gallery),name));response.writeHead(200,{'Content-Type':name.endsWith('.html')?'text/html':name.endsWith('.css')?'text/css':name.endsWith('.jpg')?'image/jpeg':'text/javascript','Cache-Control':'no-store'});response.end(data);}catch{response.writeHead(500);response.end('Fixture read failed');}});
 await new Promise((res,rej)=>{server.once('error',rej);server.listen(0,'127.0.0.1',res);});origin=`http://127.0.0.1:${server.address().port}`;report.fixtureOrigin=origin;save();
 const {chromium}=await import(pathToFileURL(modulePath).href);ensureRunning();browser=await chromium.launch({headless:true});report.environment.browser=browser.version();if(stopping)throw Error('Browser arrived after deadline');save();
 for(const profile of profiles){
  ensureRunning();mkdirSync(join(out,profile.id),{recursive:true});
  const run=current={id:profile.id,profile,source:sources,runIdentity:report.runIdentity,status:'running',actions:[],stills:[],failures:[],errors:[],warnings:[],deleted:[],originalPoints:{},collectionComplete:false,startedUtc:new Date().toISOString()};runs.push(run);save(run);
  let c,caseTimer;
  try{
   c=await makeCapture(run);await prepare(c.page,run);
   const scenario=(async()=>{for(const step of actionPlan(profile)){await collectStep(c.page,run,step);if(STILL_STEPS.includes(step.id))await still(c.page,run,step.id);}await still(c.page,run,'final-state');run.collectionComplete=true;})();
   await Promise.race([scenario,new Promise((_,reject)=>{caseTimer=setTimeout(()=>reject(Error('60-second case deadline')),60000);})]);
  }catch(error){run.stopped=true;run.failures.push({kind:'case',reason:error.stack||String(error)});run.status='failed';run.diagnosticInventory=inventoryFiles();}
  finally{clearTimeout(caseTimer);if(c)await c.finish();else if(activeCapture)await activeCapture.finish();reconcileCase(run);save(run);}
  console.log(`${run.id}: ${run.status}; visual and motion score unverified`);
 }
}
const execution=execute().finally(()=>{executionEnded=true;});
try{await Promise.race([execution,deadline]);}catch(error){stopping=true;report.status='failed';report.errors.push({kind:'execution',reason:error.stack||String(error)});save(current);}
finally{
 stopping=true;if(activeCapture)await activeCapture.finish();
 await finalizeReport(report,runs,{bound:boundedOperation,persist:save,closeBrowser:async()=>{if(browser)await browser.close();else throw Error('Native browser was never created');},verifySources:()=>verifyManifest(gallery,pins,here)});
 if(server)try{await boundedOperation(()=>new Promise((res,rej)=>server.close(e=>e?rej(e):res())),1000,'fixture-server-close');}catch(error){report.errors.push({kind:'server-close',reason:String(error)});report.status='failed';}
 report.diagnosticInventory=inventoryFiles();save();clearTimeout(watchdog);if(executionEnded)clearTimeout(hardStop);
}
if(!functionalSuccess(report))process.exitCode=2;
