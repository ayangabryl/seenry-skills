import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import path from 'node:path';
const index=process.argv.indexOf('--playwright');if(index<0)throw Error('Pass --playwright path');
const {chromium}=await import(pathToFileURL(process.argv[index+1]).href);
const root=path.resolve('.');
const server=createServer(async(req,res)=>{const p=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!p.startsWith(root+path.sep)){res.writeHead(403).end();return;}try{const bytes=await readFile(p);res.setHeader('Content-Type',/\.(mjs|js)$/.test(p)?'text/javascript':'text/plain');res.end(bytes);}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/README.md');
 await page.setContent('<style>body{font:32px Arial}.line{display:flex;gap:8px;align-items:baseline;width:400px}button{width:44px;height:44px}</style><div class="line"><span id="amount">9</span><span id="unit">items</span><button id="increase">+</button></div><span id="fallback">1</span>');
 await page.evaluate(async base=>{
  const module=await import(base+'/skills/seenry-motion/assets/number-transition.mjs');window.createNumberTransition=module.createNumberTransition;
  window.amount=createNumberTransition({slot:document.querySelector('#amount'),value:9,duration:600,reserveValues:[-888.88,888.88],format:{minimumFractionDigits:2,maximumFractionDigits:2}});
  document.querySelector('#increase').onclick=()=>amount.update(amount.value+1);
 },base);
 assert.equal(await page.evaluate(()=>amount.animationSupported),true);
 const position=()=>page.locator('#unit').evaluate(el=>el.getBoundingClientRect().left);
 const initial=await position();
 await page.locator('#increase').focus();await page.keyboard.press('Enter');
 assert.equal(await page.locator('[data-number-text]').first().textContent(),'10.00');
 // Actual engine animations must exist; changing a label does not count.
 const frames=await page.evaluate(async()=>{
  const flow=document.querySelector('[data-number-visual]');let snapshots=[];
  for(let i=0;i<8;i++){await new Promise(requestAnimationFrame);snapshots.push({animations:flow.shadowRoot.getAnimations().length,values:[...flow.shadowRoot.querySelectorAll('.digit__num')].map(n=>getComputedStyle(n).transform).join('|')});}return snapshots;
 });
 assert.ok(frames.some(f=>f.animations>0));assert.ok(new Set(frames.map(f=>f.values)).size>1);
 await page.evaluate(()=>{amount.update(99.95);amount.update(-3.5);amount.update(100.25);});
 await page.waitForTimeout(700);
 assert.equal(await page.locator('[data-number-text]').first().textContent(),'100.25');
 assert.ok(Math.abs(await position()-initial)<0.6,'Unit anchor survives sign, digit and decimal changes');
 // In-progress animation settles when the user changes motion preference.
 await page.evaluate(()=>amount.update(-12.75));await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(70);
 assert.equal(await page.evaluate(()=>document.querySelector('number-flow').shadowRoot.getAnimations().filter(a=>a.playState==='running').length),0);
 await page.evaluate(()=>amount.update(8));assert.equal(await page.locator('[data-number-text]').first().textContent(),'8.00');
 assert.equal(await page.evaluate(()=>document.querySelector('number-flow').shadowRoot.getAnimations().filter(a=>a.playState==='running').length),0);
 await page.emulateMedia({reducedMotion:'no-preference'});await page.evaluate(()=>amount.update(18));
 assert.ok(await page.evaluate(()=>document.querySelector('number-flow').shadowRoot.getAnimations().length)>0);
 await page.evaluate(()=>{amount.destroy();amount.update(999);});
 assert.equal(await page.locator('#amount').textContent(),'18.00');assert.equal(await page.locator('number-flow').count(),0);
 for(const options of [{locales:'ar-EG'},{locales:'en',format:{notation:'scientific'}},{locales:'en',rtl:true}]){
  const result=await page.evaluate(options=>{
   const slot=document.querySelector('#fallback');slot.style.direction=options.rtl?'rtl':'ltr';slot.textContent='1';
   const control=createNumberTransition({slot,value:1234.5,...options});control.update(12.75);
   const out={supported:control.animationSupported,text:slot.querySelector('[data-number-text]').textContent,expected:new Intl.NumberFormat(options.locales,options.format).format(12.75)};control.destroy();return out;
  },options);assert.equal(result.supported,false);assert.equal(result.text,result.expected);
 }
 assert.equal(await page.evaluate(()=>{try{createNumberTransition({slot:document.querySelector('#fallback'),value:NaN});return false;}catch{return true;}}),true);
 assert.deepEqual(errors,[]);
 const fallback=await browser.newPage();await fallback.goto(base+'/README.md');await fallback.setContent('<span id="number">4</span>');
 const unsupported=await fallback.evaluate(async base=>{
  const supports=CSS.supports.bind(CSS);CSS.supports=(...args)=>args[0]==='line-height'&&args[1]==='mod(1,1)'?false:supports(...args);
  const {createNumberTransition}=await import(base+'/skills/seenry-motion/assets/number-transition.mjs');
  const c=createNumberTransition({slot:document.querySelector('#number'),value:4});c.update(12);
  return {supported:c.animationSupported,text:document.querySelector('[data-number-text]').textContent,animations:document.querySelector('number-flow').shadowRoot.getAnimations().length};
 },base);assert.equal(unsupported.supported,false);assert.equal(unsupported.text,'12');assert.equal(unsupported.animations,0);await fallback.close();
 console.log('NumberFlow: actual digit frames, keyboard changes, fixed units, interruption, live reduced motion, formatting fallbacks and cleanup passed. Perceptual review is separate.');
}finally{await browser.close();await new Promise(r=>server.close(r));}
