import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {collectScrollEvidence} from '../skills/seenry/scripts/scroll_evidence.mjs';
const index=process.argv.indexOf('--playwright');
if(index<0)throw new Error('Pass --playwright /absolute/path/to/playwright/index.mjs');
const {chromium}=await import(pathToFileURL(process.argv[index+1]).href);
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage({viewport:{width:800,height:600}});
 await page.setContent(`<style>body{margin:0}.spacer{height:900px}#later{opacity:0;transition:opacity .02s}</style><h1>Opening</h1><div class="spacer"></div><h2 id="later">Deferred work</h2><div class="spacer"></div><button id="tab">Choose another view</button><p id="state" hidden>Alternate content</p><script>new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.style.opacity='1'})).observe(document.querySelector('#later'));document.querySelector('#tab').onclick=()=>document.querySelector('#state').hidden=false;</script>`);
 await page.waitForTimeout(50);
 await page.screenshot({fullPage:true});
 assert.equal(await page.locator('#later').evaluate(e=>getComputedStyle(e).opacity),'0','A full-page screenshot does not execute traversal');
 const observations=[];
 const result=await collectScrollEvidence(page,{settleMs:60,capture:async step=>observations.push({...step,opacity:await page.locator('#later').evaluate(e=>getComputedStyle(e).opacity)})});
 assert.equal(result.reachedBottom,true);
 assert.ok(observations.some(x=>x.opacity==='1'));
 assert.equal(await page.locator('#state').isVisible(),false,'Traversal cannot substitute for tab actions');
 assert.equal(result.returned.y,result.origin.y);
 assert.ok(await page.locator('#later').evaluate(e=>e.style.opacity==='1'),'Actual application reveal state is retained');
 await page.evaluate(()=>scrollTo(0,100));
 const bounded=await collectScrollEvidence(page,{maxSteps:1,settleMs:0});
 assert.equal(bounded.reachedBottom,false);assert.equal(bounded.steps.length,1);assert.equal(bounded.returned.y,100);
 await assert.rejects(collectScrollEvidence(page,{maxSteps:0}));
 await assert.rejects(collectScrollEvidence(page,{capture:async()=>{throw new Error('Capture failed')},settleMs:0}),/Capture failed/);
 assert.equal(await page.evaluate(()=>scrollY),100,'Restore position even if capture fails');
 console.log('Scroll evidence: actual reveal, untouched alternate state, bounded coverage, position restoration and failure cleanup passed.');
} finally {await browser.close();}
