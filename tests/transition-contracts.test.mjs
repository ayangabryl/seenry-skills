import test from 'node:test';import assert from 'node:assert/strict';
import {checkTransitionContracts} from '../skills/seenry/scripts/transition_evidence.mjs';
const frame=(width,top=100,scroll=0)=>({scroll:{x:0,y:scroll},targets:[{label:'action',matches:1,rect:{left:20,right:20+width,top,bottom:top+44,width,height:44}}]});
const report={status:'captured',targets:[{label:'action'}],frames:[frame(160.59375),frame(105.640625)]};
const contract={id:'keep-action-width',target:'action',property:'width',coordinates:'viewport',maxTravel:0.5};
test('measured copy-label width jump fails; retained target passes',()=>{
  assert.equal(checkTransitionContracts(report,[contract]).status,'failed');
  assert.equal(checkTransitionContracts(report,[contract]).checks[0].observedTravel,54.953125);
  assert.equal(checkTransitionContracts({...report,frames:[frame(161),frame(161)]},[contract]).status,'passed');
});
test('missing evidence is not a passing motion contract',()=>{
  assert.equal(checkTransitionContracts({...report,frames:[frame(161)]},[contract]).status,'unverified');
  assert.equal(checkTransitionContracts({...report,status:'incomplete',frames:[frame(161),frame(161)]},[contract]).status,'unverified');
  assert.equal(checkTransitionContracts({...report,frames:[frame(161),{targets:[]}]},[contract]).status,'unverified');
});
test('document and viewport positions answer different scrolling questions',()=>{
  const scrolled={...report,frames:[frame(161),frame(161,80,20)]};
  assert.equal(checkTransitionContracts(scrolled,[{...contract,property:'top'}]).status,'failed');
  assert.equal(checkTransitionContracts(scrolled,[{...contract,property:'top',coordinates:'document'}]).status,'passed');
});
test('undeclared targets and unbounded numeric thresholds are rejected',()=>{
  assert.throws(()=>checkTransitionContracts(report,[{...contract,target:'missing'}]),/observed targets/);
  assert.throws(()=>checkTransitionContracts(report,[{...contract,maxTravel:NaN}]),/maximum travel/);
});
