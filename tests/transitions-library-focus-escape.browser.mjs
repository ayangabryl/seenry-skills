// Trusted Chromium input regressions, separate from deterministic DOM/WAAPI tests.
// Example: node tests/transitions-library-focus-escape.browser.mjs --playwright /path/to/playwright/index.mjs
// Optional: --gallery /path/to/gallery.html --out /path/to/artifacts; --list needs no browser.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {dirname, resolve, extname} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const arg = (name, fallback) => { const i=process.argv.indexOf(name); return i<0?fallback:process.argv[i+1]; };
const here = dirname(fileURLToPath(import.meta.url));
const gallery = resolve(arg('--gallery', resolve(here,'../skills/seenry/assets/components/transitions/gallery.html')));
const component = dirname(gallery);
const output = resolve(arg('--out', resolve(here,'../test-results/focus-escape')));
const selectorFile = resolve(here,'fixtures/transitions/focus-escape-selectors.json');
const selectorData = JSON.parse(await readFile(selectorFile,'utf8'));
const selectors = selectorData.cases;
const flows = ['morph-close','card-close','card-escape','image-escape','nested-image-escape','modal-image-escape'];
const profiles = [320,390,1440].flatMap(width=>['light','dark'].flatMap(theme=>['no-preference','reduce'].map(motion=>({width,theme,motion}))));
const plan = profiles.flatMap(profile=>flows.map(flow=>({...profile,flow})));
if (process.argv.includes('--list')) {
  console.log(JSON.stringify({plannedCases:plan.length,selectorSource:selectorData.sourceSha256,plan},null,2));
  process.exit(0);
}
const playwright = arg('--playwright');
if (!playwright) throw new Error('Pass --playwright /absolute/path/to/playwright/index.mjs');
const {chromium} = await import(pathToFileURL(resolve(playwright)).href);
const sourceHashes = {};
for (const name of ['gallery.html','gallery.js','gallery-menu.js','seenry-transitions.js','seenry-transitions.css']) {
  sourceHashes[name]=createHash('sha256').update(await readFile(name==='gallery.html'?gallery:resolve(component,name))).digest('hex');
}
await mkdir(output,{recursive:true});
const resources = new Map([
  ['/component/gallery.html',gallery],
  ...['gallery.js','gallery-menu.js','seenry-transitions.js','seenry-transitions.css','assets/lake.jpg','assets/forest.jpg','assets/morning.jpg'].map(name=>['/component/'+name,resolve(component,name)]),
  ['/fixtures/image-modal.html',resolve(here,'fixtures/transitions/image-modal.html')]
]);
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.jpg':'image/jpeg'};
const server=createServer(async(req,res)=>{
  const route=new URL(req.url,'http://localhost').pathname;
  if(route==='/favicon.ico'){res.writeHead(204);res.end();return;}
  const file=resources.get(route);
  if(!file){res.writeHead(404);res.end('Not a test resource');return;}
  try{res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream'});res.end(await readFile(file));}
  catch{res.writeHead(404);res.end('Missing fixture');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${server.address().port}`;
let browser;
const results=[];

// Observers only: do not patch focus(), cancel, source actions, or runtime state.
async function observe(context) {
  await context.addInitScript(()=>{
    window.__focusEscapeEvents=[];
    const describe=el=>el?{id:el.id,tag:el.tagName,text:el.textContent?.trim().slice(0,45)}:null;
    for(const type of ['pointerdown','click','keydown','focusin','cancel','close','st:close']) {
      document.addEventListener(type,e=>{
        const t=e.target;
        window.__focusEscapeEvents.push({type,key:e.key||null,trusted:e.isTrusted,at:performance.now(),
          target:describe(t),active:describe(document.activeElement),
          morphItem:!!t.matches?.('#morph-1 [role="menuitem"]'),
          imageDialog:!!t.matches?.('.st-lightbox'),
          visibility:t instanceof Element?getComputedStyle(t).visibility:null,
          inert:!!t.closest?.('[inert]'),
          parentOpen:!!document.querySelector('#library-detail')?.open});
      },true);
    }
  });
}
const eventIndex=page=>page.evaluate(()=>window.__focusEscapeEvents.length);
const eventsSince=(page,index)=>page.evaluate(index=>window.__focusEscapeEvents.slice(index),index);
async function settled(page,selector) {
  await page.waitForFunction(selector=>{
    const el=document.querySelector(selector);
    return !!el&&!el.getAnimations({subtree:true}).some(a=>a.playState==='running'||a.pending);
  },selector,{timeout:4000});
}
async function checkRestored(page,trigger,layer,index) {
  await page.waitForFunction(({trigger,layer})=>{
    const source=document.querySelector(trigger),surface=document.querySelector(layer);
    return surface.dataset.stOpen==='false'&&surface.inert&&source.getAttribute('aria-expanded')==='false'&&
      getComputedStyle(source).visibility==='visible'&&document.activeElement===source;
  },{trigger,layer},{timeout:2500});
  await settled(page,layer);
  const trace=await eventsSince(page,index);
  const focus=trace.filter(e=>e.type==='focusin'&&e.target?.id===trigger.slice(1));
  assert(focus.length>0,'No source focus event after dismissal');
  assert(focus.every(e=>e.visibility==='visible'&&!e.inert),'Source focused before visibility/inert restoration');
  assert.equal(await page.locator(trigger).evaluate(el=>document.activeElement===el),true,'Focus changed again after exit settled');
}
async function galleryReady(page,key) {
  await page.goto(origin+'/component/gallery.html');
  await page.waitForFunction(()=>!!window.SeenryTransitions&&!!window.galleryLibrary);
  await page.locator(selectors[key].stage).scrollIntoViewIfNeeded();
  await page.waitForTimeout(250); // Finite first-view opacity preview only; no state forcing.
}
async function assertImageClean(page,trigger,layer,parent=false) {
  await page.waitForFunction(({trigger,layer})=>{
    const source=document.querySelector(trigger),dialog=document.querySelector(layer);
    return !!dialog&&!dialog.open&&source.querySelector('img').style.visibility===''&&
      getComputedStyle(source).visibility==='visible'&&document.activeElement===source&&
      dialog.getAnimations({subtree:true}).length===0;
  },{trigger,layer},{timeout:2500});
  const status=await page.locator(layer).evaluate(el=>({open:el.open,images:el.querySelectorAll('img').length,animations:el.getAnimations({subtree:true}).length}));
  assert.deepEqual(status,{open:false,images:1,animations:0});
  assert.equal(await page.locator(layer).count(),1,'Repeated image open leaked another dialog');
  if(parent) {
    assert.equal(await page.locator('#library-detail').evaluate(el=>el.open&&!el.inert&&el.dataset.stOpen==='true'),true,'Image Escape dismissed the gallery detail');
    assert.equal(new URL(page.url()).hash,'#t/image','Image Escape changed parent navigation');
    assert.equal(await page.locator('#detail-preview #image-open').count(),1,'Image Escape moved the parent stage back');
  }
}
async function imageFlow(page,{nested=false,modal=false}={}) {
  const trigger=modal?'#modal-image':selectors.image.trigger;
  const layer=modal?'body > .st-lightbox':nested?'#detail-preview .st-lightbox':selectors.image.layer;
  const close=modal?'body > .st-lightbox .st-lightbox-close':nested?'#detail-preview .st-lightbox-close':selectors.image.close;
  if(modal) {
    await page.goto(origin+'/fixtures/image-modal.html');
    await page.waitForFunction(()=>!!window.SeenryTransitions);
    assert.equal(await page.locator('#modal-image').evaluate(el=>el.closest('[data-st-preview]')),null);
  } else {
    await galleryReady(page,'image');
    if(nested) {
      await page.locator('article[data-key="image"] .title-link').click();
      await page.waitForFunction(()=>document.querySelector('#library-detail').open);
      await settled(page,'#library-detail');
      assert.equal(await page.locator('#library-detail').evaluate(el=>el.matches(':modal')),true);
    }
  }
  await page.locator(trigger).click();
  await page.waitForFunction(selector=>document.querySelector(selector)?.open,layer);
  await settled(page,layer);
  assert.equal(await page.locator(layer).evaluate(el=>el.matches(':modal')),modal,'show()/showModal() fixture boundary changed');
  assert.equal(await page.locator(close).evaluate(el=>document.activeElement===el),true,'Real opening did not focus the image Close control');
  const index=await eventIndex(page);
  await page.keyboard.press('Escape'); // No locator.press/focus seeding.
  await assertImageClean(page,trigger,layer,nested);
  const trace=await eventsSince(page,index);
  assert(trace.some(e=>e.type==='keydown'&&e.key==='Escape'&&e.trusted),'Escape was not delivered as trusted keyboard input');
  const imageCancel=trace.filter(e=>e.type==='cancel'&&e.imageDialog);
  if(modal) assert(imageCancel.some(e=>e.trusted),'Body showModal did not retain the native cancel path');
  else assert.equal(imageCancel.length,0,'Contained fixture unexpectedly relied on native cancel');
  if(nested) assert(!trace.some(e=>e.type==='cancel'&&e.target?.id==='library-detail'),'Escape reached parent native cancel');
  const focus=trace.filter(e=>e.type==='focusin'&&e.target?.id===trigger.slice(1));
  assert(focus.some(e=>e.visibility==='visible'&&!e.inert),'Image source focus was not restored visibly');
  // Verify recovery with the real same thumbnail and real Close button.
  await page.locator(trigger).click();
  await page.waitForFunction(selector=>document.querySelector(selector)?.open,layer);
  await settled(page,layer);
  await page.locator(close).click();
  await assertImageClean(page,trigger,layer,nested);
  if(nested) {
    await page.locator('#library-detail .detail-close').click();
    await page.waitForFunction(()=>!document.querySelector('#library-detail').open&&!!document.querySelector('article[data-key="image"] .stage'));
  }
}
async function runFlow(page,flow) {
  if(flow==='morph-close') {
    await galleryReady(page,'morph');
    const s=selectors.morph;
    await page.locator(s.trigger).click();
    await settled(page,s.layer);
    const index=await eventIndex(page);
    await page.locator(s.close).click();
    await checkRestored(page,s.trigger,s.layer,index);
    const trace=await eventsSince(page,index);
    assert(trace.some(e=>e.type==='focusin'&&e.morphItem),'Menu item did not actually receive focus');
    assert(trace.some(e=>e.type==='click'&&e.morphItem&&e.trusted),'Menu close did not use a trusted item click');
  } else if(flow.startsWith('card-')) {
    await galleryReady(page,'expand');
    const s=selectors.expand;
    await page.locator(s.trigger).click();
    await settled(page,s.layer);
    assert.equal(await page.locator(s.close).evaluate(el=>document.activeElement===el),true);
    const index=await eventIndex(page);
    if(flow==='card-close') await page.locator(s.close).click();
    else await page.keyboard.press('Escape');
    await checkRestored(page,s.trigger,s.layer,index);
    const trace=await eventsSince(page,index);
    assert(trace.some(e=>e.trusted&&(flow==='card-close'?e.type==='click':e.type==='keydown'&&e.key==='Escape')),'Card dismissal was not trusted input');
  } else await imageFlow(page,{nested:flow==='nested-image-escape',modal:flow==='modal-image-escape'});
}
try {
  browser=await chromium.launch({headless:true,...(process.env.SEENRY_CHROME_PATH?{executablePath:process.env.SEENRY_CHROME_PATH}:{})});
  for(const profile of profiles) {
    const context=await browser.newContext({viewport:{width:profile.width,height:1000},colorScheme:profile.theme,reducedMotion:profile.motion,serviceWorkers:'block'});
    await observe(context);
    for(const flow of flows) {
      const page=await context.newPage(),errors=[],blocked=[];
      page.setDefaultTimeout(5000);
      page.on('pageerror',e=>errors.push(e.message));
      page.on('download',()=>errors.push('Unexpected download'));
      page.on('popup',p=>{errors.push('Unexpected popup');void p.close();});
      await page.route('**/*',route=>{
        const u=new URL(route.request().url());
        if(u.origin===origin&&(resources.has(u.pathname)||u.pathname==='/favicon.ico'))return route.continue();
        blocked.push(route.request().url());return route.abort();
      });
      const key=`${profile.width}-${profile.theme}-${profile.motion}-${flow}`;
      const result={...profile,flow,status:'failed'};
      try {
        await runFlow(page,flow);
        assert.deepEqual(errors,[],'Browser errors');
        assert.deepEqual(blocked,[],'Unexpected external requests');
        result.status='passed';
      } catch(error) {
        result.error=error.message;
        await page.screenshot({path:resolve(output,key+'.png'),fullPage:false}).catch(()=>{});
      } finally {
        result.events=await page.evaluate(()=>window.__focusEscapeEvents||[]).catch(()=>[]);
        result.errors=errors;result.blocked=blocked;result.url=page.url();
        await writeFile(resolve(output,key+'.json'),JSON.stringify(result,null,2)+'\n');
        results.push({...profile,flow,status:result.status,...(result.error?{error:result.error}:{})});
        await page.close();
      }
    }
    await context.close();
  }
} finally {
  const report={scope:'Trusted Chromium clicks and keyboard Escape; focus visibility/ownership, contained cleanup, nested parent preservation, native modal cancel. Not perceptual scoring or full gallery acceptance.',browserVersion:browser?.version(),sourceHashes,selectorSourceSha256:selectorData.sourceSha256,plannedCases:plan.length,passed:results.filter(r=>r.status==='passed').length,executed:results.length,results};
  await writeFile(resolve(output,'report.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
  await browser?.close();
  await new Promise(resolve=>server.close(resolve));
}
assert.equal(results.length,plan.length,'All configured flows must execute');
assert(results.every(r=>r.status==='passed'),'Focus/Escape browser regressions failed; see per-case event traces and failure screenshots');
