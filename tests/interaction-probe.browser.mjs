import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {probeInteractions,validateProbe} from '../skills/seenry/scripts/interaction_probe.mjs';
const i=process.argv.indexOf('--playwright');if(i<0)throw Error('Pass --playwright module');const{chromium}=await import(pathToFileURL(process.argv[i+1]).href);
const browser=await chromium.launch();
try{
 const page=await browser.newPage();
 const fixture=async broken=>{await page.setContent('<input data-subtotal value="96"><input data-tip value="12"><input data-people value="3"><output data-total="107.52">107.52</output><span data-share="35.84">35.84</span><button>Reset</button>');await page.evaluate(broken=>{
  let state={subtotal:96,tip:12,people:3};const render=()=>{const n=(state.subtotal*(1+state.tip/100)).toFixed(2);document.querySelector('output').textContent=n;document.querySelector('output').dataset.total=n;document.querySelector('[data-share]').dataset.share=(Number(n)/state.people).toFixed(2);};
  document.querySelector('button').onclick=()=>{state={subtotal:96,tip:12,people:3};for(const k in state)document.querySelector(`[data-${k}]`).value=state[k];render();};
  document.querySelectorAll('input').forEach(el=>el.oninput=e=>{const k=broken?(e.target.dataset.subtotal?'subtotal':e.target.dataset.tip?'tip':'people'):(e.target.hasAttribute('data-subtotal')?'subtotal':e.target.hasAttribute('data-tip')?'tip':'people');state[k]=Number(e.target.value);render();});
 },broken);};
 const a=(value)=>({selector:'output',property:'attribute',name:'data-total',expected:value});
 const spec={controls:['subtotal','tip','people'],cases:[
  {id:'subtotal changes total',control:'subtotal',setup:[{type:'click',selector:'button'}],actions:[{type:'fill',selector:'[data-subtotal]',value:'100'}],before:[a('107.52')],after:[a('112.00')]},
  {id:'tip changes total',control:'tip',setup:[{type:'click',selector:'button'}],actions:[{type:'fill',selector:'[data-tip]',value:'0'}],before:[a('107.52')],after:[a('96.00')]},
  {id:'people preserves bill total',control:'people',setup:[{type:'click',selector:'button'}],actions:[{type:'fill',selector:'[data-people]',value:'4'}],before:[a('107.52')],after:[a('107.52'),{selector:'[data-share]',property:'attribute',name:'data-share',expected:'26.88'}]}
 ]};
 await fixture(true);let report=await probeInteractions(page,spec);assert.equal(report.status,'failed');assert.deepEqual(report.cases.map(c=>c.status),['failed-result','failed-result','passed']);assert.deepEqual(report.missing,[]);
 await fixture(false);report=await probeInteractions(page,spec);assert.equal(report.status,'passed');
 const incomplete={...spec,cases:spec.cases.slice(0,1)};report=await probeInteractions(page,incomplete);assert.equal(report.status,'unverified');assert.deepEqual(report.missing,['tip','people']);
 const precondition={...spec,cases:[{...spec.cases[0],before:[a('wrong')]}]};report=await probeInteractions(page,precondition);assert.equal(report.cases[0].status,'failed-precondition');assert.equal(report.cases[0].actions.length,0);
 const ambiguous={...spec,cases:[{...spec.cases[0],actions:[{type:'fill',selector:'input',value:'4'}]}]};report=await probeInteractions(page,ambiguous);assert.equal(report.cases[0].status,'failed-action');
 assert.throws(()=>validateProbe({...spec,cases:[{...spec.cases[0],actions:[]}]}));assert.throws(()=>validateProbe({...spec,controls:['subtotal','subtotal']}));assert.throws(()=>validateProbe({...spec,cases:[{...spec.cases[0],after:[{...a('x'),property:'execute'}]}]}));
 console.log('Interaction probe: real empty-data routing regression, independent controls, preconditions, exact results, missing coverage and ambiguous selectors passed.');
}finally{await browser.close();}
