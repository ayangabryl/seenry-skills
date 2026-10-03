// Browser-level stream text/state contracts. This fixture is not a gallery quality rating.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const here=dirname(fileURLToPath(import.meta.url));
const arg=(key,fallback)=>{const i=process.argv.indexOf(key);return i<0?fallback:process.argv[i+1];};
const runtime=resolve(arg('--runtime',resolve(here,'../skills/seenry/assets/components/transitions/seenry-transitions.js')));
const output=resolve(arg('--out',resolve(here,'../test-results/stream-contract')));
const plan=['no-preference','reduce'].flatMap(motion=>['visible-stop','split-citation','literal-final'].map(flow=>({motion,flow})));
if(process.argv.includes('--list')){console.log(JSON.stringify({plan,scope:'Native RAF, semantic text and trusted Stop; no style score'},null,2));process.exit(0);}
const pw=arg('--playwright');if(!pw)throw Error('Pass --playwright /absolute/path/to/playwright/index.mjs');
const {chromium}=await import(pathToFileURL(resolve(pw)).href);
const bytes=await readFile(runtime);const sourceSha256=createHash('sha256').update(bytes).digest('hex');
await mkdir(output,{recursive:true});
let browser;const results=[];
try{
 browser=await chromium.launch({headless:true,...(process.env.SEENRY_CHROME_PATH?{executablePath:process.env.SEENRY_CHROME_PATH}:{})});
 for(const profile of plan){
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:profile.motion});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const result={...profile,status:'failed'};
  try{
   await page.setContent('<!doctype html><html><body><main><p id="answer" aria-live="polite"></p><button id="stop">Stop answer</button></main></body></html>');
   await page.addScriptTag({path:runtime});
   await page.evaluate(()=>{
    const answer=document.getElementById('answer');window.events=[];
    answer.addEventListener('st:cite',e=>events.push({type:'cite',n:e.detail.n,at:performance.now()}));
    answer.addEventListener('st:stream-end',()=>events.push({type:'end',at:performance.now()}));
    document.getElementById('stop').addEventListener('click',e=>{events.push({type:'stop',trusted:e.isTrusted,at:performance.now()});SeenryTransitions.stream(answer,'',{stop:true});});
   });
   const snapshot=()=>page.evaluate(()=>{const el=document.getElementById('answer');return {text:el.textContent,busy:el.getAttribute('aria-busy'),citations:[...el.querySelectorAll('.st-cite')].map(n=>n.textContent),events:[...events],animations:el.getAnimations({subtree:true}).filter(a=>a.playState==='running'||a.pending).length};});
   if(profile.flow==='visible-stop'){
    await page.evaluate(()=>SeenryTransitions.stream(document.getElementById('answer'),'Visible answer [12]',{reset:true}));
    await page.waitForFunction(()=>document.getElementById('answer').textContent==='Visible answer 12');
    await page.waitForFunction(()=>!document.getElementById('answer').getAnimations({subtree:true}).some(a=>a.playState==='running'||a.pending));
    result.before=await snapshot();assert.equal(result.before.busy,'true');
    await page.locator('#stop').click();result.stopped=await snapshot();
    assert.equal(result.stopped.text,result.before.text);assert.equal(result.stopped.busy,'false');assert(result.stopped.events.some(e=>e.type==='stop'&&e.trusted));
    await page.evaluate(()=>{const el=document.getElementById('answer');SeenryTransitions.stream(el,' stale [3]',{done:true});});
    await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    result.afterLate=await snapshot();assert.equal(result.afterLate.text,result.before.text);assert.deepEqual(result.afterLate.citations,['12']);assert.equal(result.afterLate.events.filter(e=>e.type==='end').length,0);
    await page.evaluate(()=>SeenryTransitions.stream(document.getElementById('answer'),'New answer',{reset:true,done:true}));
    result.reset=await snapshot();assert.equal(result.reset.text,'New answer');assert.equal(result.reset.events.filter(e=>e.type==='end').length,1);
   }else if(profile.flow==='split-citation'){
    for(const [index,chunk]of ['Source [','1','2','] is ready.'].entries()){
     await page.evaluate(({chunk,index})=>{SeenryTransitions.stream(document.getElementById('answer'),chunk,{reset:index===0});return new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));},{chunk,index});
    }
    await page.evaluate(()=>SeenryTransitions.stream(document.getElementById('answer'),'',{done:true}));
    result.final=await snapshot();assert.equal(result.final.text,'Source 12 is ready.');assert.deepEqual(result.final.citations,['12']);assert.equal(result.final.events.filter(e=>e.type==='cite'&&e.n===12).length,1);assert.equal(result.final.events.filter(e=>e.type==='end').length,1);
   }else{
    await page.evaluate(()=>{SeenryTransitions.stream(document.getElementById('answer'),'Keep [draft] and [7',{reset:true,done:true});});
    result.final=await snapshot();assert.equal(result.final.text,'Keep [draft] and [7');assert.deepEqual(result.final.citations,[]);assert.equal(result.final.busy,'false');
   }
   assert.deepEqual(errors,[]);result.status='passed';
  }catch(e){result.error=String(e.stack||e);result.pageErrors=errors;}
  results.push(result);await context.close();
 }
}finally{
 const version=browser?await browser.version():null;
 await writeFile(resolve(output,'results.json'),JSON.stringify({sourceSha256,browser:version,scope:'Text retention, token parsing, lifecycle and trusted Stop in a minimal native browser fixture; no visual score',results},null,2));
 await browser?.close();
}
console.log(`${results.filter(x=>x.status==='passed').length}/${plan.length} native stream contracts passed`);
assert.equal(results.length,plan.length);assert(results.every(x=>x.status==='passed'),JSON.stringify(results.filter(x=>x.status!=='passed'),null,2));
