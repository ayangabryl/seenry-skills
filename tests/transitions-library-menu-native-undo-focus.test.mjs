import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PROFILES,actionPlan,assertPostUndoFocusEvidence,assertStepEvidence,assertStepOutcome} from './transitions-library-menu-native-contract.mjs';
import {nativeClipGeometry} from './transitions-library-menu-discovery-helpers.mjs';
import {captureSettledMenuUndoFocus} from './transitions-library-menu-native-observer.mjs';

const clone=value=>structuredClone(value);
const rect=(left,top,width=44,height=44)=>({x:left,y:top,left,top,right:left+width,bottom:top+height,width,height});
const observed=JSON.parse(readFileSync(new URL('./fixtures/transitions/menu-native-v4-undo-offscreen-observed.json',import.meta.url),'utf8'));
const viewport=rect(0,0,320,780);
const renderedRows=[['roadmap','Q4 roadmap'],['copy-1','Q4 roadmap copy'],['hiring','Hiring plan'],['copy-2','Hiring plan copy']].map(([id,name])=>({id,name,nameFits:true,accessibleName:`More actions for ${name}`,expanded:'false'}));

function style(overrides={}) {
 return {backgroundColor:'rgb(255, 255, 255)',backgroundImage:'none',color:'rgb(0, 0, 0)',opacity:'1',filter:'none',backdropFilter:'none',mixBlendMode:'normal',visibility:'visible',display:'block',transform:'none',translate:'none',scale:'none',rotate:'none',overflowX:'visible',overflowY:'visible',clipPath:'none',maskImage:'none',outlineColor:'rgb(0, 0, 0)',outlineWidth:'2px',outlineStyle:'solid',outlineOffset:'1px',boxShadow:'none',...overrides};
}

// Execute the exported browser sampler, including its real clip helper, against
// measured DOM-shaped objects. Any attempt to repair focus or scrolling fails.
function sampleDOM({actionId='undo-sample',row='roadmap',remainingDeletes=0,inputEvidence,triggerRect=rect(226,120),undoRect=rect(20,500,112,44),targetStyle={},ancestorStyle={},ancestorRect=rect(12,80,296,620),ancestorMetrics={},focusVisible=true,focused=true,connected=true,missing=false,active=null,hitAt,topLayer=false}={}) {
 const saved=new Map(),calls={queries:[],hits:[],mutations:[],matrices:[],styles:[],ranges:[]};let time=100;
 const replace=(key,value)=>{saved.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{configurable:true,writable:true,value});};
 const forbidden=name=>(...args)=>{calls.mutations.push({name,args});throw Error(`Sampler mutated ${name}`);};
 function node(id,bounds,control,parentElement=null,css={},metrics={}) {
  const value={id,tagName:'DIV',control,parentElement,isConnected:true,hidden:false,style:style(css),bounds:clone(bounds),offsetWidth:bounds.width,offsetHeight:bounds.height,clientLeft:0,clientTop:0,clientWidth:bounds.width,clientHeight:bounds.height,...metrics};
  value.getBoundingClientRect=()=>({...value.bounds,toJSON:()=>clone(value.bounds)});
  value.contains=other=>{for(let n=other;n;n=n.parentElement)if(n===value)return true;return false;};
  value.closest=selector=>{assert.equal(selector,'[popover]:popover-open,dialog:modal');for(let n=value;n;n=n.parentElement)if(n.topLayer)return n;return null;};
  value.matches=selector=>{assert.equal(selector,':focus-visible');return value.focusVisible===true;};
  for(const method of ['focus','blur','scroll','scrollTo','scrollBy','scrollIntoView'])value[method]=forbidden(`${id}.${method}`);
  for(const property of ['scrollTop','scrollLeft'])Object.defineProperty(value,property,{get:()=>0,set:forbidden(`${id}.${property}`)});
  return value;
 }
 const body=node('body',viewport,'outside');
 const ancestor=node('scroll-region',ancestorRect,'outside',body,ancestorStyle,ancestorMetrics);ancestor.topLayer=topLayer;
 const trigger=node(`trigger-${row}`,triggerRect,`trigger:${row}`,ancestor),undo=node('undo',undoRect,'undo',ancestor);
 const target=remainingDeletes>0?undo:trigger;target.style=style(targetStyle);target.focusVisible=focusVisible;target.isConnected=connected;
 const icon=node('target-icon',target.bounds,target.control,target),cover=node('sticky-header',viewport,'id:sticky-header',body);
 const nodes={body,ancestor,trigger,undo,target,icon,cover};
 const doc={querySelector:selector=>{calls.queries.push(selector);assert.equal(selector,remainingDeletes>0?'[data-menu-demo] [data-menu-undo]':`[data-menu-demo] [data-menu-file="${row}"] [data-menu-trigger]`);return missing?null:target;},elementFromPoint:(x,y)=>{calls.hits.push({x,y});if(hitAt)return hitAt({x,y},nodes);return x>=0&&y>=0&&x<320&&y<780?icon:null;},createRange:()=>{let selected;return {selectNodeContents:value=>{selected=value;calls.ranges.push(value.id);},getClientRects:()=>{assert.equal(selected,target);const b=selected.bounds,glyph=rect(b.left+8,b.top+8,Math.max(1,b.width-16),Math.max(1,b.height-16));return [{...glyph,toJSON:()=>clone(glyph)}];}};}};
 Object.defineProperty(doc,'activeElement',{get:()=>focused?target:body,set:forbidden('document.activeElement')});
 const trace={active,control:value=>value?.control??'outside'};
 Object.defineProperty(trace,'originalPoint',{get:()=>{throw Error('Old action point is not current hit evidence');}});
 const win={__menuNative:trace,__menuNativeClipGeometry:nativeClipGeometry};
 for(const method of ['scroll','scrollTo','scrollBy'])win[method]=forbidden(`window.${method}`);
 try {
  replace('window',win);replace('document',doc);replace('innerWidth',320);replace('innerHeight',780);replace('performance',{now:()=>time++});
  replace('getComputedStyle',value=>{calls.styles.push(value.id);return value.style;});
  replace('DOMMatrixReadOnly',class {constructor(value){calls.matrices.push(value);const numbers=value?.match(/^matrix\(([^)]+)\)$/)?.[1].split(',').map(Number)??[1,0,0,1,0,0];assert.equal(numbers.length,6);[this.a,this.b,this.c,this.d,this.e,this.f]=numbers;this.is2D=true;}});
  for(const method of ['scroll','scrollTo','scrollBy'])replace(method,forbidden(method));
  return {sample:captureSettledMenuUndoFocus({actionId,row,remainingDeletes,inputEvidence}),calls};
 } finally {
  for(const [key,descriptor] of saved){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}
 }
}

function snapshot(time,rows,{row='roadmap',focus='undo',remainingDeletes=0,triggerRect=rect(226,120),statusText=''}={}) {
 const exists=rows.some(value=>value.id===row);
 return {snapshotStartedAt:time,snapshotCompletedAt:time+.1,rows:clone(rows),focus,count:`${rows.length} ${rows.length===1?'file':'files'}`,statusText,budgetText:'Copies: 2 of 2. Reset to start again.',recovery:{visible:remainingDeletes>0,text:remainingDeletes>0?`${remainingDeletes} deleted. Restore file.`:'',undoVisible:remainingDeletes>0},empty:rows.length===0,viewport:{width:320,height:780},stageOwner:'gallery',hash:'',search:{value:'Menu',focused:false},menuCard:{hidden:false,containsStage:true},menu:{open:false,presentationOpen:false,nativeOpen:false,inert:true,logicalStateSource:exists?'connected-trigger-inventory':'no-connected-origin-trigger'},trigger:{row,exists,expanded:exists?'false':null,rect:exists?clone(triggerRect):null,point:{x:248,y:28},hit:true,hitControl:`trigger:${row}`},editor:{open:false,modal:false,value:'',error:'',errorVisible:false,invalid:null},parent:{nativeOpen:false},animations:[]};
}

// The remaining count comes from deletion outcomes in the real audit object.
// It is never inferred from a sample label or the recovery banner's prose.
function auditAfterDeletes(profile,deletionOrder) {
 const audit={id:profile.id,profile,deleted:[]};let rows=clone(renderedRows);
 for(const row of deletionOrder){
  const before=snapshot(2,rows,{row}),at=rows.findIndex(value=>value.id===row),next=rows.filter(value=>value.id!==row);
  const after=snapshot(50,next,{row,focus:next.length?`trigger:${next[Math.min(at,next.length-1)].id}`:'reset',remainingDeletes:audit.deleted.length+1,statusText:`Deleted ${row}`});
  assertStepOutcome({op:'activate',check:'delete',row},{before,after},audit);rows=next;
 }
 audit.lastRows=rows.map(value=>[value.id,value.name]);return {audit,rows};
}

function undoFixture({mode='keyboard',remainingDeletes=0,row=remainingDeletes>0?'hiring':'roadmap',dom={},deletionOrder}={}) {
 // Pointer Undo is part of the real reduced-motion flow; the pointer-only
 // interaction profile intentionally has no delete/Undo application sequence.
 const profile=PROFILES.find(value=>value.width===320&&value.theme==='light'&&value.suite===(mode==='pointer'?'reduced':'keyboard'));
 const step=actionPlan(profile).find(value=>value.id===`undo-${row}`),id=`${profile.id}/${step.id}`;
 const order=deletionOrder??[...renderedRows.filter(value=>value.id!==row).slice(0,remainingDeletes).map(value=>value.id),row];
 const {audit,rows}=auditAfterDeletes(profile,order),last=audit.deleted.at(-1),afterRows=clone(rows);afterRows.splice(Math.min(last.index,afterRows.length),0,clone(last.row));
 const actualRemaining=audit.deleted.length-1,focus=actualRemaining>0?'undo':`trigger:${row}`;
 const event=(type,eventId,time,extra={})=>({actionId:id,eventId,type,control:'undo',trusted:true,eventAt:time,captureCompletedAt:time+.1,nativeTimeStamp:time,key:null,detail:0,...extra});
 const events=mode==='keyboard'?[event('keydown',1,10,{key:'Enter'}),event('click',2,12)]:[event('pointerdown',1,10),event('pointerup',2,11),event('click',3,12,{detail:1})];
 const click=events.at(-1),inputEvidence={mode,focusCueRequired:mode==='keyboard',clickEventId:click.eventId,clickTrusted:true,clickDetail:click.detail,keyEventId:mode==='keyboard'?events[0].eventId:null};
 const stateOptions={row,focus,remainingDeletes:actualRemaining,statusText:`Restored ${row}`,triggerRect:dom.triggerRect??rect(226,120)};
 const a={id,stepId:step.id,op:step.op,mode,row,targetControl:'undo',requestedAt:1,originalPoint:{x:248,y:28},before:snapshot(2,rows,{row,remainingDeletes:audit.deleted.length}),after:snapshot(50,afterRows,stateOptions),events,accepted:[{...click,phase:'post-production-stage-bubble',observerAt:12.2,snapshotStartedAt:12.3,snapshotCompletedAt:12.6,state:snapshot(12.4,afterRows,stateOptions)}],settlement:{status:'native-finite-settlement-observed',rafAt:48.8,elapsedMs:5,state:snapshot(49,afterRows,stateOptions)}};
 const {sample,calls}=sampleDOM({actionId:id,row,remainingDeletes:actualRemaining,inputEvidence,focusVisible:mode==='keyboard',...dom});a.settledUndoFocus=sample;
 return {step,a,audit,calls,remainingDeletes:actualRemaining};
}
const guard=f=>assertPostUndoFocusEvidence(f.step,f.a,f.remainingDeletes);
const full=f=>assertStepEvidence(f.step,f.a,f.audit);

test('actual sampler records current target paint, viewport/ancestor clip and five bounded fresh hit probes without mutations',()=>{
 for(const remainingDeletes of [0,2]){
  const f=undoFixture({remainingDeletes}),s=f.a.settledUndoFocus,r=s.rect,c={x:r.left+r.width/2,y:r.top+r.height/2};
  assert.doesNotThrow(()=>full(f));assert.equal(s.targetControl,remainingDeletes?'undo':'trigger:roadmap');
  assert.deepEqual(f.calls.hits,[c,{x:c.x,y:r.top+1},{x:r.right-1,y:c.y},{x:c.x,y:r.bottom-1},{x:r.left+1,y:c.y}]);
  assert.deepEqual(s.currentCenter.point,c);assert.equal(s.currentCenter.source,'current-focus-target-center');assert.equal(s.paint.focused,true);assert.equal(s.paint.focusVisible,true);
  assert.equal(s.clipAncestors.length,2);assert.equal(s.paint.chain.length,3);assert(f.calls.matrices.length===3&&f.calls.styles.length>3);assert.equal(f.calls.ranges.length,1);assert.deepEqual(f.calls.mutations,[]);
 }
});

test('sampler measures bordered ancestor client clips with both overflow axes and a DOM matrix',()=>{
 const {sample}=sampleDOM({ancestorRect:rect(12,80,296,620),ancestorMetrics:{clientLeft:4,clientTop:6,clientWidth:280,clientHeight:600},ancestorStyle:{overflowX:'hidden',overflowY:'auto',transform:'matrix(1, 0, 0, 1, 0, 0)'}});
 assert.equal(sample.clipAncestors[0].axisAligned,true);assert.equal(sample.clipAncestors[0].clipX,true);assert.equal(sample.clipAncestors[0].clipY,true);
 assert.deepEqual(sample.geometry.rect,{left:16,top:86,right:296,bottom:686,width:280,height:600});assert.deepEqual(sample.geometry.applied,['viewport','scroll-region']);
});

test('sampler stops clipping/paint ancestry at the native top layer',()=>{
 const {sample}=sampleDOM({topLayer:true});assert.equal(sample.clipAncestors.length,1);assert.equal(sample.paint.chain.length,2);assert.equal(sample.clipAncestors[0].node,'scroll-region');
});

test('the exact original offscreen observations retain their measured rectangles and old recovery policy',()=>{
 assert.equal(observed.source.schema,'menu-native-v4');assert.equal(observed.sourceCase,'menu-native-0-ubuntu/320-light-keyboard/case.json');
 assert.deepEqual(observed.observations.map(value=>value.afterTrigger.rect.y),[-121.1875,-180.9375,-152.9375]);
 for(const [index,value] of observed.observations.entries()){
  assert.deepEqual(value.acceptedTrigger.rect,value.afterTrigger.rect);assert.equal(value.acceptedFocus,`trigger:${value.acceptedTrigger.row}`);assert.equal(value.afterFocus,value.acceptedFocus);assert.equal(value.afterRecovery.visible,index<2);assert.equal(value.afterRecovery.undoVisible,index<2);
  const f=undoFixture({row:value.afterTrigger.row,remainingDeletes:2-index});
  for(const s of [f.a.accepted[0].state,f.a.after,f.a.settlement.state]){s.focus=value.afterFocus;s.trigger=clone(value.afterTrigger);s.recovery=clone(value.afterRecovery);}
  f.a.before.recovery=clone(value.beforeRecovery);
  assert.throws(()=>full(f),index<2?/Expected values to be strictly equal/:/Final Undo must reveal/);
 }
});

test('each exact observed offscreen trigger rect independently fails final acceptance and settled visibility in both input modes',()=>{
 for(const mode of ['keyboard','pointer'])for(const value of observed.observations){
  const f=undoFixture({mode,row:value.afterTrigger.row,dom:{triggerRect:value.afterTrigger.rect}});
  assert.deepEqual(f.a.settledUndoFocus.rect,value.afterTrigger.rect);assert.throws(()=>guard(f),/Final Undo must reveal/);
  f.a.accepted[0].state.trigger.rect=rect(226,120);
  assert.throws(()=>guard(f),/leaves viewport or ancestor scroll clip/);
  assert.deepEqual(f.calls.mutations,[]);
 }
});

test('remaining deletion stack retains Undo; the final restoration reveals and focuses its trigger',()=>{
 for(const mode of ['keyboard','pointer']){
  const first=undoFixture({mode,remainingDeletes:3,row:'copy-2',deletionOrder:['roadmap','copy-1','hiring','copy-2']}),audit=first.audit;
  for(const [index,row] of ['copy-2','hiring','copy-1','roadmap'].entries()){
   const f=index===0?first:undoFixture({mode,row,remainingDeletes:3-index,deletionOrder:['roadmap','copy-1','hiring','copy-2'].slice(0,4-index)});
   f.audit=audit;assert.equal(audit.deleted.length,4-index);assert.doesNotThrow(()=>full(f));assert.equal(audit.deleted.length,3-index);
   assert.equal(f.a.after.focus,index===3?'trigger:roadmap':'undo');assert.equal(f.a.after.recovery.undoVisible,index<3);assert.deepEqual(f.calls.mutations,[]);
  }
 }
});

test('full validation uses observed audit deletions rather than caller count, recovery prose or stale focus',()=>{
 for(const remainingDeletes of [0,2]){
  const f=undoFixture({remainingDeletes});f.a.settledUndoFocus.remainingDeletes=remainingDeletes?0:2;assert.throws(()=>full(f),/Expected values to be strictly equal/);
  const prose=undoFixture({remainingDeletes});for(const s of [prose.a.accepted[0].state,prose.a.after,prose.a.settlement.state])s.recovery.text='999 deleted. Restore file.';assert.doesNotThrow(()=>full(prose));
  const focus=undoFixture({remainingDeletes});for(const s of [focus.a.accepted[0].state,focus.a.after,focus.a.settlement.state])s.focus=remainingDeletes?`trigger:${focus.step.row}`:'undo';assert.throws(()=>full(focus),/Expected values to be strictly equal/);
 }
});

test('Undo requires a preceding deletion and actually available recovery before activation',()=>{
 for(const mutate of [f=>f.audit.deleted=[],f=>f.audit.deleted.at(-1).row.id='other',f=>f.a.before.recovery.visible=false,f=>f.a.before.recovery.undoVisible=false]){const f=undoFixture();mutate(f);assert.throws(()=>full(f));}
});

test('accepted and final recovery visibility must agree with the observed remaining stack',()=>{
 for(const remainingDeletes of [0,2])for(const boundary of ['accepted','after'])for(const key of ['visible','undoVisible']){
  const f=undoFixture({remainingDeletes}),state=boundary==='accepted'?f.a.accepted[0].state:f.a.after;state.recovery[key]=!state.recovery[key];assert.throws(()=>full(f));
 }
});

test('trusted keyboard Undo requires a visible strong cue while pointer Undo can have no focus-visible styling',()=>{
 const noCue={outlineWidth:'0px',outlineStyle:'none',boxShadow:'none'};
 for(const remainingDeletes of [0,2]){
  const keyboard=undoFixture({remainingDeletes,dom:{targetStyle:noCue}});assert.throws(()=>guard(keyboard),/strong visible focus cue/);
  const hidden=undoFixture({remainingDeletes,dom:{focusVisible:false}});assert.throws(()=>guard(hidden),/actual visible focus state/);
  const pointer=undoFixture({mode:'pointer',remainingDeletes,dom:{targetStyle:noCue,focusVisible:false}});assert.doesNotThrow(()=>full(pointer));
 }
});

test('keyboard cue requires actual opaque contrast and sufficient width, with a measured cue inventory',()=>{
 for(const targetStyle of [{outlineColor:'rgb(240, 240, 240)'},{outlineColor:'rgba(0, 0, 0, 0)'},{outlineWidth:'1px'},{outlineStyle:'none'},{outlineStyle:'hidden'},{outlineOffset:'unknown'},{backgroundColor:'rgb(0, 0, 0)',color:'rgb(255, 255, 255)',outlineStyle:'none',outlineWidth:'0px'}]){
  const f=undoFixture({dom:{targetStyle}});assert.throws(()=>guard(f),/strong visible focus cue/);
 }
 const missing=undoFixture();delete missing.a.settledUndoFocus.paint.cue;assert.throws(()=>guard(missing),/strong visible focus cue/);
});

test('a solid inset cue can satisfy keyboard focus without an outward outline',()=>{
 const f=undoFixture({dom:{targetStyle:{outlineWidth:'0px',outlineStyle:'none',boxShadow:'rgb(0, 0, 0) 0px 0px 0px 2px inset'}}});assert.doesNotThrow(()=>full(f));
});

test('all modes require the actual connected focused control and a visible full-opacity paint chain',()=>{
 for(const mode of ['keyboard','pointer'])for(const dom of [{focused:false},{connected:false},{targetStyle:{display:'none'}},{targetStyle:{visibility:'hidden'}},{targetStyle:{opacity:'.5'}},{ancestorStyle:{opacity:'0'}},{ancestorStyle:{visibility:'hidden'}},{targetStyle:{filter:'blur(1px)'}},{ancestorStyle:{backdropFilter:'blur(2px)'}}]){
  const f=undoFixture({mode,dom});assert.throws(()=>guard(f),/wrong or disconnected target|hidden, faded or has unsupported paint/);
 }
});

test('all modes reject movement, unknown clip paths and non-axis-aligned clipped ancestors',()=>{
 for(const mode of ['keyboard','pointer'])for(const dom of [{targetStyle:{transform:'matrix(1, 0, 0, 1, 0, 2)'}},{ancestorStyle:{translate:'0px 2px'}},{ancestorStyle:{scale:'0.9'}},{ancestorStyle:{rotate:'2deg'}},{ancestorStyle:{clipPath:'inset(1px)'}},{ancestorStyle:{maskImage:'url(mask.png)'}},{ancestorStyle:{overflowY:'auto',transform:'matrix(1, 0.1, 0, 1, 0, 0)'}}]){
  const f=undoFixture({mode,dom});assert.throws(()=>guard(f),/movement|leaves viewport or ancestor scroll clip/);
 }
});

test('all modes reject a viewport-visible control cut off by a measured ancestor scroll clip',()=>{
 for(const mode of ['keyboard','pointer'])for(const remainingDeletes of [0,2]){
  const f=undoFixture({mode,remainingDeletes,dom:{triggerRect:rect(226,100),undoRect:rect(20,100,112,44),ancestorRect:rect(12,120,296,620),ancestorStyle:{overflowY:'auto'}}});
  assert.equal(f.a.settledUndoFocus.geometry.rect.top,120);assert.throws(()=>guard(f),/leaves viewport or ancestor scroll clip/);assert.deepEqual(f.calls.mutations,[]);
 }
});

test('keyboard cue bounds must remain inside both viewport and ancestor clip even when the target fits',()=>{
 for(const dom of [{triggerRect:rect(226,1)},{triggerRect:rect(226,81),ancestorStyle:{overflowY:'auto'}}]){
  const f=undoFixture({dom});assert.throws(()=>guard(f),/strong visible focus cue wholly inside viewport\/scroll clip/);
  const pointer=undoFixture({mode:'pointer',dom});assert.doesNotThrow(()=>full(pointer));
 }
});

test('sticky center occlusion is rejected using actual elementFromPoint hits for every mode and policy target',()=>{
 for(const mode of ['keyboard','pointer'])for(const remainingDeletes of [0,2]){
  const f=undoFixture({mode,remainingDeletes,dom:{hitAt:(point,nodes)=>point.x===nodes.target.bounds.left+nodes.target.bounds.width/2&&point.y===nodes.target.bounds.top+nodes.target.bounds.height/2?nodes.cover:nodes.icon}});
  assert.equal(f.a.settledUndoFocus.currentCenter.hit,false);assert.equal(f.a.settledUndoFocus.currentCenter.hitControl,'id:sticky-header');assert(f.a.settledUndoFocus.edgeHits.every(value=>value.hit));assert.throws(()=>guard(f),/current center is occluded/);
 }
});

test('each partially sticky-covered edge fails even with an unobscured current center',()=>{
 for(const mode of ['keyboard','pointer'])for(const edge of ['top','right','bottom','left']){
  const f=undoFixture({mode,dom:{hitAt:(point,nodes)=>{const r=nodes.target.bounds,covered=edge==='top'?point.y===r.top+1:edge==='right'?point.x===r.right-1:edge==='bottom'?point.y===r.bottom-1:point.x===r.left+1;return covered?nodes.cover:nodes.icon;}}});
  assert.equal(f.a.settledUndoFocus.currentCenter.hit,true);assert.equal(f.a.settledUndoFocus.edgeHits.filter(value=>!value.hit).length,1);assert.throws(()=>guard(f),/partially occluded/);
 }
});

test('retained old-point hit ownership never supplies fresh current-center evidence',()=>{
 for(const mode of ['keyboard','pointer']){
  const f=undoFixture({mode,dom:{hitAt:(point,nodes)=>point.x===248&&point.y===28?nodes.icon:nodes.cover}});
  assert.equal(f.a.after.trigger.hit,true);assert.deepEqual(f.a.originalPoint,{x:248,y:28});assert.deepEqual(f.a.settledUndoFocus.currentCenter.point,{x:248,y:142});assert.throws(()=>guard(f),/current center is occluded/);
  const stale=undoFixture({mode});Object.assign(stale.a.settledUndoFocus.currentCenter,{point:stale.a.originalPoint,hit:true,hitControl:'trigger:roadmap'});assert.throws(()=>guard(stale),/not the actual current center/);
  const fresh=undoFixture({mode});fresh.a.accepted[0].state.trigger.hit=false;fresh.a.after.trigger.hit=false;assert.doesNotThrow(()=>full(fresh));
 }
});

test('a missing target is recorded without side effects and cannot pass focus validation',()=>{
 const f=undoFixture({dom:{missing:true}}),s=f.a.settledUndoFocus;assert.equal(s.exists,false);assert.equal(s.connected,false);assert.equal(s.paint,undefined);assert.deepEqual(f.calls.hits,[]);assert.deepEqual(f.calls.mutations,[]);assert.throws(()=>guard(f),/wrong or disconnected target/);
});

test('missing, stale, premature or active-action samples cannot supply post-Undo evidence',()=>{
 const mutations=[a=>delete a.settledUndoFocus,a=>a.settledUndoFocus.actionId='another/action',a=>a.settledUndoFocus.row='other',a=>a.settledUndoFocus.phase='accepted',a=>a.settledUndoFocus.actionInactive=false,a=>delete a.settledUndoFocus.sampleStartedAt,a=>a.settledUndoFocus.sampleStartedAt=49,a=>a.settledUndoFocus.sampleCompletedAt=a.settledUndoFocus.sampleStartedAt-1];
 for(const mutate of mutations){const f=undoFixture();mutate(f.a);assert.throws(()=>guard(f),/Missing separate post-Undo focus sample|sample must follow the finished action/);}
 const active=undoFixture({dom:{active:{id:'still-active'}}});assert.equal(active.a.settledUndoFocus.actionInactive,false);assert.throws(()=>guard(active),/Missing separate/);
});

test('viewport, measured clip inventory and geometry provenance cannot be omitted or replaced',()=>{
 const mutations=[s=>delete s.viewport,s=>s.viewport.width=390,s=>s.viewport.right=319,s=>delete s.clipAncestors,s=>s.clipAncestors=[],s=>delete s.geometry,s=>s.geometry.rect.top=30,s=>s.geometry={status:'measured-axis-aligned-intersection',rect:clone(viewport),applied:[]}];
 for(const mode of ['keyboard','pointer'])for(const mutate of mutations){const f=undoFixture({mode});mutate(f.a.settledUndoFocus);assert.throws(()=>guard(f),/viewport mismatch|ancestor clip inventory missing|clip differs/);}
});

test('current-center origin, clock, role and current control ownership are required',()=>{
 const mutations=[s=>delete s.currentCenter,s=>delete s.currentCenter.source,s=>s.currentCenter.source='action.originalPoint',s=>s.currentCenter.role='old-trigger',s=>s.currentCenter.measuredAt=NaN,s=>s.currentCenter.measuredAt=s.sampleStartedAt-1,s=>s.currentCenter.measuredAt=s.sampleCompletedAt+1,s=>s.currentCenter.hitControl='trigger:other',s=>s.currentCenter.hit=false];
 for(const mode of ['keyboard','pointer'])for(const mutate of mutations){const f=undoFixture({mode});mutate(f.a.settledUndoFocus);assert.throws(()=>guard(f),/provenance missing|current center is occluded/);}
});

test('all four bounded edge probes must have their exact role, coordinates and current target ownership',()=>{
 const mutations=[s=>delete s.edgeHits,s=>s.edgeHits.pop(),s=>s.edgeHits.push(clone(s.edgeHits[0])),s=>s.edgeHits.reverse(),s=>s.edgeHits[0].point.y++,s=>s.edgeHits[0].hit=false,s=>s.edgeHits[0].hitControl='sticky'];
 for(const mode of ['keyboard','pointer'])for(const mutate of mutations){const f=undoFixture({mode});mutate(f.a.settledUndoFocus);assert.throws(()=>guard(f));}
});

test('paint must describe the actual sampled target rectangle with a measured visible paint chain',()=>{
 for(const mutate of [s=>delete s.paint,s=>s.paint.focused=false,s=>s.paint.rect=rect(10,10),s=>delete s.paint.chain,s=>s.paint.chain=[],s=>s.focus='outside',s=>s.targetControl='undo']){
  for(const mode of ['keyboard','pointer']){const f=undoFixture({mode});mutate(f.a.settledUndoFocus);assert.throws(()=>guard(f));}
 }
});

test('all modes require measured unclipped glyph/icon bounds and distinguishable actual ink',()=>{
 for(const mode of ['keyboard','pointer'])for(const remainingDeletes of [0,2]){
  for(const mutate of [s=>delete s.paint.glyphs,s=>s.paint.glyphs=[],s=>s.paint.glyphs[0].left=s.rect.left-2,s=>s.paint.glyphs[0].bottom=s.rect.bottom+2]){
   const f=undoFixture({mode,remainingDeletes});mutate(f.a.settledUndoFocus);assert.throws(()=>guard(f),/target ink is missing or clipped/);
  }
  for(const color of ['rgba(0, 0, 0, 0)','rgb(255, 255, 255)','rgb(200, 200, 200)']){
   const f=undoFixture({mode,remainingDeletes,dom:{targetStyle:{color}}});assert.throws(()=>guard(f),/paint is not distinguishable/);
  }
 }
});

test('restored icon uses 3:1 distinguishability while retained Undo text requires 4.5:1',()=>{
 for(const mode of ['keyboard','pointer']){
  const dom={targetStyle:{color:'rgb(140, 140, 140)'}};
  const trigger=undoFixture({mode,dom});assert.doesNotThrow(()=>full(trigger));
  const undo=undoFixture({mode,remainingDeletes:2,dom});assert.throws(()=>guard(undo),/paint is not distinguishable/);
 }
});

test('input provenance cannot suppress keyboard cue requirements or invent trusted Undo activation',()=>{
 const mutations=[f=>delete f.a.settledUndoFocus.inputEvidence,f=>f.a.settledUndoFocus.inputEvidence.focusCueRequired=false,f=>f.a.settledUndoFocus.inputEvidence.clickEventId=99,f=>f.a.settledUndoFocus.inputEvidence.keyEventId=null,f=>f.a.events=[],f=>f.a.events.at(-1).trusted=false,f=>f.a.events[0].trusted=false,f=>f.a.events[0].key='Tab',f=>f.a.events[0].eventAt=13,f=>f.a.events.at(-1).detail=1,f=>f.a.mode='pointer',f=>delete f.step.mode];
 for(const mutate of mutations){const f=undoFixture();mutate(f);assert.throws(()=>guard(f));}
});

test('full input validation rejects pointer evidence without down/up, with synthetic events or wrong action identity',()=>{
 for(const mutate of [a=>a.events.shift(),a=>a.events.splice(1,1),a=>a.events[0].trusted=false,a=>a.events[1].control='other',a=>a.events.at(-1).detail=0,a=>a.events[0].eventAt=15,a=>a.events[0].actionId='another/action',a=>a.events[0].eventId=a.events[1].eventId]){
  const f=undoFixture({mode:'pointer'});mutate(f.a);assert.throws(()=>full(f));
 }
});

test('pointer cue policy follows trusted pointer activation even with unrelated prior keyboard navigation',()=>{
 const f=undoFixture({mode:'pointer',dom:{focusVisible:false,targetStyle:{outlineStyle:'none',outlineWidth:'0px'}}});
 f.a.events.unshift({actionId:f.a.id,eventId:99,type:'keydown',control:'undo',key:'Tab',trusted:true,detail:0,eventAt:9,captureCompletedAt:9.1,nativeTimeStamp:9});assert.doesNotThrow(()=>full(f));
});

test('accepted activation cannot be omitted, moved to a different phase or detached from the captured event',()=>{
 for(const mutate of [a=>a.accepted=[],a=>a.accepted[0].phase='post-production-document-bubble',a=>a.accepted[0].eventId=999,a=>a.accepted[0].actionId='another/action',a=>a.accepted[0].trusted=false,a=>a.accepted[0].observerAt=11,a=>a.accepted[0].state.focus='reset']){
  const f=undoFixture();mutate(f.a);assert.throws(()=>guard(f));
 }
});

test('post-Undo guard requires a nonnegative integer observed count and an explicit input mode',()=>{
 for(const remainingDeletes of [undefined,null,-1,.5,Infinity,'0']){const f=undoFixture();assert.throws(()=>assertPostUndoFocusEvidence(f.step,f.a,remainingDeletes),/observed remaining deletion count/);}
 const f=undoFixture();f.step.mode='touch';assert.throws(()=>guard(f),/input mode missing/);
});
