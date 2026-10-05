import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {PROFILES,actionPlan,assertPostDeleteRecoveryEvidence,assertStepEvidence,assertStepOutcome} from './transitions-library-menu-native-contract.mjs';
import {nativeClipGeometry} from './transitions-library-menu-discovery-helpers.mjs';
import {captureSettledMenuUndoFocus} from './transitions-library-menu-native-observer.mjs';

const clone=value=>structuredClone(value);
const rect=(left,top,width=44,height=44)=>({x:left,y:top,left,top,right:left+width,bottom:top+height,width,height});
const viewport=rect(0,0,320,780);
const renderedRows=[['roadmap','Q4 roadmap'],['copy-1','Q4 roadmap copy'],['hiring','W'.repeat(60)],['copy-2',`${'W'.repeat(55)} copy`]].map(([id,name])=>({id,name,nameFits:true,accessibleName:`More actions for ${name}`,expanded:'false'}));

// Frozen ccbf131 review evidence, copied here so browser-free tests do not need
// a local native artifact tree. Sources: ../menu-ccbf131-independent-review-one/
// REVIEW.md, recovery-evidence.json and recovery-geometry.json.
// The stressed records measure rows, NOT Undo. Their Undo vertical extents are
// source/layout inferences using the existing 12px recovery padding and 44px
// control height. No inferred rectangle is represented as a native measurement.
const stressedObservations=[
 {actionId:'320-light-keyboard/delete-roadmap',row:'roadmap',deletionCount:1,focus:'trigger:copy-1',rowRects:[rect(42,406.0625,236,72),rect(42,478.0625,236,167.5),rect(42,645.5625,236,167.5)],measuredUndoRect:null,undoGeometryProvenance:'source-plus-measured-row-layout-inference',inferredUndoVertical:{top:825.0625,bottom:869.0625,height:44}},
 {actionId:'320-light-keyboard/delete-copy-1',row:'copy-1',deletionCount:2,focus:'trigger:hiring',rowRects:[rect(42,406.0625,236,167.5),rect(42,573.5625,236,167.5)],measuredUndoRect:null,undoGeometryProvenance:'source-plus-measured-row-layout-inference',inferredUndoVertical:{top:753.0625,bottom:797.0625,height:44}}
];
const ordinaryObservation={actionId:'320-light-detail/detail-delete',selector:'.menu-demo [data-menu-undo]',undoGeometryProvenance:'recorded-native-typography-rectangle',measuredUndoRect:rect(44,601.59375,135.21875,44),visibleClip:{left:20,top:369.59375,right:300,bottom:780,width:280,height:410.40625}};

function style(overrides={}) {
 return {backgroundColor:'rgb(255, 255, 255)',backgroundImage:'none',color:'rgb(0, 0, 0)',opacity:'1',filter:'none',backdropFilter:'none',mixBlendMode:'normal',visibility:'visible',display:'block',transform:'none',translate:'none',scale:'none',rotate:'none',overflowX:'visible',overflowY:'visible',clipPath:'none',maskImage:'none',outlineColor:'rgb(0, 0, 0)',outlineWidth:'0px',outlineStyle:'none',outlineOffset:'0px',boxShadow:'none',...overrides};
}

// Run the exported sampler and real clipping helper, rather than supplying a
// precomputed passing sample. Every focus/scroll write is a hard test failure.
function sampleDOM({actionId='delete-sample',row='roadmap',remainingDeletes=1,inputEvidence,postDelete=true,undoRect=rect(20,500,112,44),targetStyle={},ancestorStyle={},ancestorRect=rect(12,80,296,620),ancestorMetrics={},focusVisible=false,focused=false,activeControl='trigger:copy-1',connected=true,missing=false,active=null,hitAt,topLayer=false}={}) {
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
 const undo=node('undo',undoRect,'undo',ancestor),trigger=node(`trigger-${row}`,rect(226,120),`trigger:${row}`,ancestor);
 const target=postDelete||remainingDeletes>0?undo:trigger;target.style=style(targetStyle);target.focusVisible=focusVisible;target.isConnected=connected;
 const icon=node('target-icon',target.bounds,target.control,target),cover=node('sticky-header',viewport,'id:sticky-header',body),fallback=node('fallback',rect(226,200),activeControl,ancestor);
 const nodes={body,ancestor,trigger,undo,target,icon,cover,fallback};
 const doc={querySelector:selector=>{calls.queries.push(selector);assert.equal(selector,postDelete||remainingDeletes>0?'[data-menu-demo] [data-menu-undo]':`[data-menu-demo] [data-menu-file="${row}"] [data-menu-trigger]`);return missing?null:target;},elementFromPoint:(x,y)=>{calls.hits.push({x,y});if(hitAt)return hitAt({x,y},nodes);return x>=0&&y>=0&&x<320&&y<780?icon:null;},createRange:()=>{let selected;return {selectNodeContents:value=>{selected=value;calls.ranges.push(value.id);},getClientRects:()=>{assert.equal(selected,target);const b=selected.bounds,glyph=rect(b.left+8,b.top+8,Math.max(1,b.width-16),Math.max(1,b.height-16));return [{...glyph,toJSON:()=>clone(glyph)}];}};}};
 Object.defineProperty(doc,'activeElement',{get:()=>focused?target:fallback,set:forbidden('document.activeElement')});
 const trace={active,control:value=>value?.control??'outside'};
 Object.defineProperty(trace,'originalPoint',{get:()=>{throw Error('Old action point is not current hit evidence');}});
 const win={__menuNative:trace,__menuNativeClipGeometry:nativeClipGeometry};
 for(const method of ['scroll','scrollTo','scrollBy'])win[method]=forbidden(`window.${method}`);
 for(const property of ['scrollX','scrollY','pageXOffset','pageYOffset'])Object.defineProperty(win,property,{get:()=>0,set:forbidden(`window.${property}`)});
 try {
  replace('window',win);replace('document',doc);replace('innerWidth',320);replace('innerHeight',780);replace('performance',{now:()=>time++});
  replace('getComputedStyle',value=>{calls.styles.push(value.id);return value.style;});
  replace('DOMMatrixReadOnly',class {constructor(value){calls.matrices.push(value);const numbers=value?.match(/^matrix\(([^)]+)\)$/)?.[1].split(',').map(Number)??[1,0,0,1,0,0];assert.equal(numbers.length,6);[this.a,this.b,this.c,this.d,this.e,this.f]=numbers;this.is2D=true;}});
  for(const method of ['scroll','scrollTo','scrollBy'])replace(method,forbidden(method));
  return {sample:captureSettledMenuUndoFocus({actionId,row,remainingDeletes,inputEvidence,postDelete}),calls};
 } finally {
  for(const [key,descriptor] of saved){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}
 }
}

function snapshot(time,rows,{row='roadmap',focus='action:delete',remainingDeletes=0,statusText='',open=false}={}) {
 const exists=rows.some(value=>value.id===row),inventory=clone(rows);if(open)inventory.find(value=>value.id===row).expanded='true';
 return {snapshotStartedAt:time,snapshotCompletedAt:time+.1,rows:inventory,focus,count:`${rows.length} ${rows.length===1?'file':'files'}`,statusText,budgetText:'Copies: 2 of 2. Reset to start again.',recovery:{visible:remainingDeletes>0,text:remainingDeletes>0?`${remainingDeletes} deleted. Restore file.`:'',undoVisible:remainingDeletes>0},empty:rows.length===0,viewport:{width:320,height:780},stageOwner:'gallery',hash:'',search:{value:'Menu',focused:false},menuCard:{hidden:false,containsStage:true},menu:{open,presentationOpen:open,nativeOpen:open,inert:!open,logicalStateSource:exists?'connected-trigger-inventory':'no-connected-origin-trigger'},trigger:{row,exists,expanded:exists?String(open):null,rect:exists?rect(226,120):null,point:{x:248,y:28},hit:true,hitControl:`trigger:${row}`},editor:{open:false,modal:false,value:'',error:'',errorVisible:false,invalid:null},parent:{nativeOpen:false},animations:[]};
}

function deleteFixture({mode='keyboard',row='roadmap',priorDeletes=[],dom={}}={}) {
 // Reduced profiles contain genuine pointer Delete; pointer-only profiles have
 // no deletion sequence. Use the unchanged actual application action plans.
 const profile=PROFILES.find(value=>value.width===320&&value.theme==='light'&&value.suite===(mode==='pointer'?'reduced':'keyboard'));
 const step=actionPlan(profile).find(value=>value.id===`delete-${row}`),id=`${profile.id}/${step.id}`;
 const audit={id:profile.id,profile,deleted:[]};let rows=clone(renderedRows);
 for(const deletedRow of priorDeletes){
  const before=snapshot(2,rows,{row:deletedRow}),at=rows.findIndex(value=>value.id===deletedRow),next=rows.filter(value=>value.id!==deletedRow);
  const after=snapshot(50,next,{row:deletedRow,focus:next.length?`trigger:${next[Math.min(at,next.length-1)].id}`:'reset',remainingDeletes:audit.deleted.length+1,statusText:`Deleted ${deletedRow}`});
  assertStepOutcome({op:'activate',check:'delete',row:deletedRow},{before,after},audit);rows=next;
 }
 audit.lastRows=rows.map(value=>[value.id,value.name]);
 const at=rows.findIndex(value=>value.id===row),next=rows.filter(value=>value.id!==row),deletionCount=audit.deleted.length+1;
 const focus=next.length?`trigger:${next[Math.min(at,next.length-1)].id}`:'reset';
 const event=(type,eventId,time,extra={})=>({actionId:id,eventId,type,control:'action:delete',trusted:true,eventAt:time,captureCompletedAt:time+.1,nativeTimeStamp:time,key:null,detail:0,...extra});
 const events=mode==='keyboard'?[event('keydown',1,10,{key:'Enter'}),event('click',2,12)]:[event('pointerdown',1,10),event('pointerup',2,11),event('click',3,12,{detail:1})];
 const click=events.at(-1),inputEvidence={mode,focusCueRequired:false,clickEventId:click.eventId,clickTrusted:true,clickDetail:click.detail,keyEventId:mode==='keyboard'?events[0].eventId:null};
 const stateOptions={row,focus,remainingDeletes:deletionCount,statusText:`Deleted ${row}`};
 const a={id,stepId:step.id,op:step.op,mode,row,targetControl:'action:delete',requestedAt:1,originalPoint:{x:248,y:28},before:snapshot(2,rows,{row,remainingDeletes:audit.deleted.length,open:true}),after:snapshot(50,next,stateOptions),events,accepted:[{...click,phase:'post-production-stage-bubble',observerAt:12.2,snapshotStartedAt:12.3,snapshotCompletedAt:12.6,state:snapshot(12.4,next,stateOptions)}],settlement:{status:'native-finite-settlement-observed',rafAt:48.8,elapsedMs:5,state:snapshot(49,next,stateOptions)}};
 const {sample,calls}=sampleDOM({actionId:id,row,remainingDeletes:deletionCount,inputEvidence,activeControl:focus,...dom});a.settledDeleteRecovery=sample;
 return {step,a,audit,calls,deletionCount};
}
const guard=f=>assertPostDeleteRecoveryEvidence(f.step,f.a,f.deletionCount);
const full=f=>assertStepEvidence(f.step,f.a,f.audit);

test('post-Delete sampler always measures Undo with five fresh read-only probes, regardless of count or focus',()=>{
 for(const remainingDeletes of [0,1,4]){
  const {sample:s,calls}=sampleDOM({remainingDeletes}),r=s.rect,c={x:r.left+r.width/2,y:r.top+r.height/2};
  assert.equal(s.targetControl,'undo');assert.equal(s.phase,'settled-post-delete-recovery');assert.equal(s.remainingDeletes,remainingDeletes);
  assert.equal(s.focus,'trigger:copy-1');assert.equal(s.paint.focused,false);assert.equal(s.paint.focusVisible,false);
  assert.deepEqual(calls.queries,['[data-menu-demo] [data-menu-undo]']);assert.deepEqual(calls.hits,[c,{x:c.x,y:r.top+1},{x:r.right-1,y:c.y},{x:c.x,y:r.bottom-1},{x:r.left+1,y:c.y}]);
  assert.deepEqual(s.currentCenter.point,c);assert.equal(s.currentCenter.source,'current-recovery-control-center');
  assert.equal(s.clipAncestors.length,2);assert.equal(s.paint.chain.length,3);assert.equal(calls.matrices.length,3);assert(calls.styles.length>3);assert.deepEqual(calls.ranges,['undo']);assert.deepEqual(calls.mutations,[]);
 }
});

test('postDelete false preserves existing post-Undo target and phase semantics',()=>{
 for(const remainingDeletes of [0,2]){
  const {sample,calls}=sampleDOM({postDelete:false,remainingDeletes});assert.equal(sample.targetControl,remainingDeletes?'undo':'trigger:roadmap');assert.equal(sample.phase,'settled-post-undo-focus');assert.equal(sample.currentCenter.source,'current-focus-target-center');assert.deepEqual(calls.mutations,[]);
 }
});

test('full Delete validation accepts visible unfocused Undo with no keyboard focus ring and retains survivor or reset focus',()=>{
 for(const mode of ['keyboard','pointer']){
  const audit=deleteFixture({mode}).audit;
  for(const [index,row] of ['roadmap','copy-1','hiring','copy-2'].entries()){
   const f=deleteFixture({mode,row,priorDeletes:['roadmap','copy-1','hiring','copy-2'].slice(0,index)});f.audit=audit;
   assert.equal(audit.deleted.length,index);assert.doesNotThrow(()=>full(f));assert.equal(audit.deleted.length,index+1);
   assert.equal(f.a.settledDeleteRecovery.paint.focused,false);assert.equal(f.a.settledDeleteRecovery.paint.focusVisible,false);assert.equal(f.a.settledDeleteRecovery.paint.cue.outlineStyle,'none');
   assert.equal(f.a.settledDeleteRecovery.focus,f.a.after.focus);assert.equal(f.a.after.focus,index===3?'reset':`trigger:${['copy-1','hiring','copy-2'][index]}`);assert.deepEqual(f.calls.mutations,[]);
  }
 }
});

test('no post-Delete cue is required even when Undo lies flush with a viewport edge',()=>{
 for(const mode of ['keyboard','pointer']){
  const f=deleteFixture({mode,dom:{undoRect:rect(0,736,112,44)}});delete f.a.settledDeleteRecovery.paint.cue;assert.doesNotThrow(()=>full(f));
 }
});

test('full validation mandates the new sample after the deletion outcome and derives its count from the audit',()=>{
 for(const mode of ['keyboard','pointer']){
  const valid=deleteFixture({mode});assert.equal(valid.audit.deleted.length,0);assert.doesNotThrow(()=>full(valid));assert.equal(valid.audit.deleted.length,1);
  for(const mutate of [f=>delete f.a.settledDeleteRecovery,f=>f.a.settledDeleteRecovery.remainingDeletes=0,f=>f.a.settledDeleteRecovery.remainingDeletes=999]){
   const f=deleteFixture({mode});mutate(f);assert.throws(()=>full(f));assert.equal(f.audit.deleted.length,1,'Delete outcome must be recorded before recovery evidence is judged');
  }
  const prose=deleteFixture({mode});for(const state of [prose.a.after,prose.a.accepted[0].state,prose.a.settlement.state])state.recovery.text='999 deleted. Restore file.';assert.doesNotThrow(()=>full(prose));
 }
});

test('frozen narrow observations keep inferred Undo bounds distinct from measured row and native Undo geometry',()=>{
 assert.deepEqual(stressedObservations.map(value=>value.rowRects.at(-1).bottom),[813.0625,741.0625]);
 for(const observed of stressedObservations){
  assert.equal(observed.measuredUndoRect,null);assert.equal(observed.undoGeometryProvenance,'source-plus-measured-row-layout-inference');
  assert.equal(observed.inferredUndoVertical.top,observed.rowRects.at(-1).bottom+12);assert.equal(observed.inferredUndoVertical.bottom,observed.inferredUndoVertical.top+44);
  // Horizontal position/width below are synthetic test inputs. Only vertical
  // placement reproduces the explicitly labeled source/layout inference.
  const f=deleteFixture({row:observed.row,priorDeletes:observed.deletionCount===2?['roadmap']:[],dom:{undoRect:rect(20,observed.inferredUndoVertical.top,112,44)}});
  assert.equal(f.a.id,observed.actionId);assert.equal(f.a.after.focus,observed.focus);assert(f.a.after.recovery.visible&&f.a.after.recovery.undoVisible);
  assert.throws(()=>full(f),/viewport or ancestor scroll clip/);assert.deepEqual(f.calls.mutations,[]);
 }
 assert(stressedObservations[0].inferredUndoVertical.top>viewport.bottom);
 assert(stressedObservations[1].inferredUndoVertical.top<viewport.bottom&&stressedObservations[1].inferredUndoVertical.bottom>viewport.bottom);
});

test('ordinary detail native Undo rectangle remains an exact positive measured-geometry comparison',()=>{
 assert.equal(ordinaryObservation.undoGeometryProvenance,'recorded-native-typography-rectangle');
 assert.deepEqual(ordinaryObservation.measuredUndoRect,rect(44,601.59375,135.21875,44));
 const clip=ordinaryObservation.visibleClip;
 const f=deleteFixture({dom:{undoRect:ordinaryObservation.measuredUndoRect,ancestorRect:rect(clip.left,clip.top,clip.width,clip.height),ancestorStyle:{overflowX:'hidden',overflowY:'auto'},topLayer:true}});
 assert.deepEqual(f.a.settledDeleteRecovery.rect,ordinaryObservation.measuredUndoRect);assert.deepEqual(f.a.settledDeleteRecovery.geometry.rect,clip);assert.doesNotThrow(()=>full(f));
});

test('logical recovery flags alone cannot pass missing, offscreen or partially clipped recovery paint',()=>{
 for(const mode of ['keyboard','pointer'])for(const dom of [{missing:true},{undoRect:rect(20,800,112,44)},{undoRect:rect(20,760,112,44)},{undoRect:rect(-10,500,112,44)},{undoRect:rect(280,500,112,44)},{undoRect:rect(20,-10,112,44)}]){
  const f=deleteFixture({mode,dom});assert(f.a.after.recovery.visible&&f.a.after.recovery.undoVisible);assert.throws(()=>full(f));assert.deepEqual(f.calls.mutations,[]);
 }
 const missing=deleteFixture({dom:{missing:true}});assert.equal(missing.a.settledDeleteRecovery.exists,false);assert.equal(missing.a.settledDeleteRecovery.connected,false);assert.equal(missing.a.settledDeleteRecovery.paint,undefined);assert.deepEqual(missing.calls.hits,[]);
});

test('missing, stale, premature, wrong-action, wrong-phase or active-action samples cannot satisfy post-Delete evidence',()=>{
 const mutations=[a=>delete a.settledDeleteRecovery,a=>a.settledDeleteRecovery.actionId='another/action',a=>a.settledDeleteRecovery.row='other',a=>a.settledDeleteRecovery.phase='settled-post-undo-focus',a=>a.settledDeleteRecovery.actionInactive=false,a=>delete a.settledDeleteRecovery.sampleStartedAt,a=>a.settledDeleteRecovery.sampleStartedAt=49,a=>a.settledDeleteRecovery.sampleCompletedAt=a.settledDeleteRecovery.sampleStartedAt-1];
 for(const mode of ['keyboard','pointer'])for(const mutate of mutations){const f=deleteFixture({mode});mutate(f.a);assert.throws(()=>guard(f));}
 const active=deleteFixture({dom:{active:{id:'still-active'}}});assert.equal(active.a.settledDeleteRecovery.actionInactive,false);assert.throws(()=>guard(active));
});

test('post-Delete guard requires an actual Delete and a positive integer observed deletion count',()=>{
 for(const count of [undefined,null,0,-1,.5,Infinity,'1']){const f=deleteFixture();assert.throws(()=>assertPostDeleteRecoveryEvidence(f.step,f.a,count));}
 for(const mutate of [f=>f.step.check='undo',f=>f.a.mode='pointer',f=>delete f.step.mode,f=>f.step.mode='touch']){const f=deleteFixture();mutate(f);assert.throws(()=>guard(f));}
 const wrongControl=deleteFixture();wrongControl.step.control='undo';assert.throws(()=>full(wrongControl));
});

test('all modes reject disconnected targets and hidden, faded or unsupported target/ancestor paint',()=>{
 for(const mode of ['keyboard','pointer'])for(const dom of [{connected:false},{targetStyle:{display:'none'}},{targetStyle:{visibility:'hidden'}},{targetStyle:{opacity:'.5'}},{ancestorStyle:{opacity:'0'}},{ancestorStyle:{opacity:'.99'}},{ancestorStyle:{visibility:'hidden'}},{targetStyle:{filter:'blur(1px)'}},{ancestorStyle:{backdropFilter:'blur(2px)'}},{targetStyle:{mixBlendMode:'multiply'}}]){
  const f=deleteFixture({mode,dom});assert.throws(()=>guard(f));assert.deepEqual(f.calls.mutations,[]);
 }
});

test('all modes require unmodified 4.5:1 Undo text contrast and measured, unclipped actual ink',()=>{
 for(const mode of ['keyboard','pointer']){
  for(const color of ['rgba(0, 0, 0, 0)','rgb(255, 255, 255)','rgb(200, 200, 200)','rgb(140, 140, 140)']){const f=deleteFixture({mode,dom:{targetStyle:{color}}});assert.throws(()=>guard(f),/paint is not distinguishable/);}
  for(const mutate of [s=>delete s.paint.glyphs,s=>s.paint.glyphs=[],s=>s.paint.glyphs[0].left=s.rect.left-2,s=>s.paint.glyphs[0].bottom=s.rect.bottom+2]){const f=deleteFixture({mode});mutate(f.a.settledDeleteRecovery);assert.throws(()=>guard(f),/target ink is missing or clipped/);}
 }
});

test('paint must belong to the actual Undo rectangle and include its measured visible ancestry',()=>{
 for(const mode of ['keyboard','pointer'])for(const mutate of [s=>delete s.paint,s=>s.paint.rect=rect(10,10),s=>delete s.paint.chain,s=>s.paint.chain=[],s=>s.targetControl='trigger:roadmap']){
  const f=deleteFixture({mode});mutate(f.a.settledDeleteRecovery);assert.throws(()=>guard(f));
 }
});

test('post-Delete recovery uses measured bordered ancestor clips and rejects a viewport-visible but ancestor-clipped target',()=>{
 const measured=deleteFixture({dom:{ancestorRect:rect(12,80,296,620),ancestorMetrics:{clientLeft:4,clientTop:6,clientWidth:280,clientHeight:600},ancestorStyle:{overflowX:'hidden',overflowY:'auto',transform:'matrix(1, 0, 0, 1, 0, 0)'}}});
 assert.deepEqual(measured.a.settledDeleteRecovery.geometry.rect,{left:16,top:86,right:296,bottom:686,width:280,height:600});assert.deepEqual(measured.a.settledDeleteRecovery.geometry.applied,['viewport','scroll-region']);assert.doesNotThrow(()=>full(measured));
 for(const mode of ['keyboard','pointer'])for(const dom of [{undoRect:rect(20,100,112,44),ancestorRect:rect(12,120,296,620),ancestorStyle:{overflowY:'auto'}},{undoRect:rect(20,650,112,44),ancestorRect:rect(12,80,296,600),ancestorStyle:{overflowY:'hidden'}},{undoRect:rect(10,400,112,44),ancestorRect:rect(20,80,280,620),ancestorStyle:{overflowX:'clip'}}]){
  const f=deleteFixture({mode,dom});assert.throws(()=>guard(f),/viewport or ancestor scroll clip/);assert.deepEqual(f.calls.mutations,[]);
 }
});

test('post-Delete sampling respects the native top layer as the clip/paint ancestry boundary',()=>{
 const f=deleteFixture({dom:{topLayer:true}});assert.equal(f.a.settledDeleteRecovery.clipAncestors.length,1);assert.equal(f.a.settledDeleteRecovery.paint.chain.length,2);assert.equal(f.a.settledDeleteRecovery.clipAncestors[0].node,'scroll-region');assert.doesNotThrow(()=>full(f));
});

test('post-Delete guard rejects moving targets, unsupported clips and non-axis-aligned clipped ancestors',()=>{
 for(const mode of ['keyboard','pointer'])for(const dom of [{targetStyle:{transform:'matrix(1, 0, 0, 1, 0, 2)'}},{ancestorStyle:{translate:'0px 2px'}},{ancestorStyle:{scale:'0.9'}},{ancestorStyle:{rotate:'2deg'}},{ancestorStyle:{clipPath:'inset(1px)'}},{ancestorStyle:{maskImage:'url(mask.png)'}},{ancestorStyle:{overflowY:'auto',transform:'matrix(1, 0.1, 0, 1, 0, 0)'}}]){
  const f=deleteFixture({mode,dom});assert.throws(()=>guard(f));
 }
});

test('viewport, ancestor inventory and recomputed geometry provenance cannot be omitted or replaced',()=>{
 const mutations=[s=>delete s.viewport,s=>s.viewport.width=390,s=>s.viewport.right=319,s=>delete s.clipAncestors,s=>s.clipAncestors=[],s=>delete s.geometry,s=>s.geometry.rect.top=30,s=>s.geometry={status:'measured-axis-aligned-intersection',rect:clone(viewport),applied:[]}];
 for(const mode of ['keyboard','pointer'])for(const mutate of mutations){const f=deleteFixture({mode});mutate(f.a.settledDeleteRecovery);assert.throws(()=>guard(f));}
});

test('a sticky covering the current Undo center fails despite positive stale trigger and edge evidence',()=>{
 for(const mode of ['keyboard','pointer']){
  const f=deleteFixture({mode,dom:{hitAt:({x,y},nodes)=>x===76&&y===522?nodes.cover:nodes.icon}}),s=f.a.settledDeleteRecovery;
  assert.equal(f.a.after.trigger.hit,true);assert.equal(s.currentCenter.hit,false);assert.equal(s.currentCenter.hitControl,'id:sticky-header');assert(s.edgeHits.every(hit=>hit.hit));assert.throws(()=>guard(f),/current center is occluded/);
  const stale=deleteFixture({mode});Object.assign(stale.a.settledDeleteRecovery.currentCenter,{point:stale.a.originalPoint,hit:true,hitControl:'undo'});assert.throws(()=>guard(stale),/not the actual current center/);
 }
});

test('partial sticky occlusion fails each of the four edge probes even with a usable current center',()=>{
 for(const mode of ['keyboard','pointer'])for(const [x,y] of [[76,501],[131,522],[76,543],[21,522]]){
  const f=deleteFixture({mode,dom:{hitAt:(point,nodes)=>point.x===x&&point.y===y?nodes.cover:nodes.icon}}),s=f.a.settledDeleteRecovery;
  assert.equal(s.currentCenter.hit,true);assert.equal(s.edgeHits.filter(hit=>!hit.hit).length,1);assert.throws(()=>guard(f),/partially occluded/);assert.deepEqual(f.calls.mutations,[]);
 }
});

test('current-center source, clock, role and current Undo ownership are mandatory',()=>{
 const mutations=[s=>delete s.currentCenter,s=>delete s.currentCenter.source,s=>s.currentCenter.source='current-focus-target-center',s=>s.currentCenter.source='action.originalPoint',s=>s.currentCenter.role='old-trigger',s=>s.currentCenter.measuredAt=NaN,s=>s.currentCenter.measuredAt=s.sampleStartedAt-1,s=>s.currentCenter.measuredAt=s.sampleCompletedAt+1,s=>s.currentCenter.hitControl='trigger:copy-1',s=>s.currentCenter.hit=false];
 for(const mode of ['keyboard','pointer'])for(const mutate of mutations){const f=deleteFixture({mode});mutate(f.a.settledDeleteRecovery);assert.throws(()=>guard(f));}
});

test('every recovery edge probe needs the exact role, point and Undo ownership',()=>{
 const mutations=[s=>delete s.edgeHits,s=>s.edgeHits.pop(),s=>s.edgeHits.push(clone(s.edgeHits[0])),s=>s.edgeHits.reverse(),s=>s.edgeHits[0].point.y++,s=>s.edgeHits[0].hit=false,s=>s.edgeHits[0].hitControl='id:sticky-header'];
 for(const mode of ['keyboard','pointer'])for(const mutate of mutations){const f=deleteFixture({mode});mutate(f.a.settledDeleteRecovery);assert.throws(()=>guard(f));}
});

test('post-Delete input metadata is linked to the actual trusted Delete click and keyboard activation',()=>{
 const mutations=[f=>delete f.a.settledDeleteRecovery.inputEvidence,f=>f.a.settledDeleteRecovery.inputEvidence.focusCueRequired=true,f=>f.a.settledDeleteRecovery.inputEvidence.clickEventId=99,f=>f.a.settledDeleteRecovery.inputEvidence.clickTrusted=false,f=>f.a.settledDeleteRecovery.inputEvidence.clickDetail=1,f=>f.a.settledDeleteRecovery.inputEvidence.keyEventId=null,f=>f.a.events=[],f=>f.a.events.at(-1).trusted=false,f=>f.a.events.at(-1).control='undo',f=>f.a.events[0].trusted=false,f=>f.a.events[0].control='undo',f=>f.a.events[0].key='Tab',f=>f.a.events[0].eventAt=13,f=>f.a.events.at(-1).detail=1];
 for(const mutate of mutations){const f=deleteFixture();mutate(f);assert.throws(()=>guard(f));}
 const space=deleteFixture();space.step.key='Space';space.a.events[0].key=' ';assert.doesNotThrow(()=>full(space));
});

test('full pointer Delete validation retains trusted down/up/click and action identity requirements',()=>{
 const mutations=[a=>a.events.shift(),a=>a.events.splice(1,1),a=>a.events[0].trusted=false,a=>a.events[1].control='undo',a=>a.events.at(-1).detail=0,a=>a.events[0].eventAt=15,a=>a.events[0].actionId='another/action',a=>a.events[0].eventId=a.events[1].eventId];
 for(const mutate of mutations){const f=deleteFixture({mode:'pointer'});mutate(f.a);assert.throws(()=>full(f));}
 const unrelated=deleteFixture({mode:'pointer'});unrelated.a.events.unshift({actionId:unrelated.a.id,eventId:99,type:'keydown',control:'action:delete',key:'Tab',trusted:true,detail:0,eventAt:9,captureCompletedAt:9.1,nativeTimeStamp:9});assert.doesNotThrow(()=>full(unrelated));
});

test('accepted Delete must match its captured event and expose recovery at acceptance and settlement',()=>{
 const mutations=[a=>a.accepted=[],a=>a.accepted[0].phase='post-production-document-bubble',a=>a.accepted[0].eventId=999,a=>a.accepted[0].actionId='another/action',a=>a.accepted[0].trusted=false,a=>a.accepted[0].observerAt=11];
 for(const mode of ['keyboard','pointer'])for(const mutate of mutations){const f=deleteFixture({mode});mutate(f.a);assert.throws(()=>full(f));}
 for(const boundary of ['accepted','after'])for(const key of ['visible','undoVisible']){const f=deleteFixture(),state=boundary==='accepted'?f.a.accepted[0].state:f.a.after;state.recovery[key]=false;assert.throws(()=>full(f));}
});

test('the frozen 32-profile action matrix and all 72 planned Delete checkpoints remain unchanged',()=>{
 assert.equal(PROFILES.length,32);assert.equal(PROFILES.flatMap(profile=>actionPlan(profile).filter(step=>step.check==='delete')).length,72);
 assert.equal(createHash('sha256').update(JSON.stringify(PROFILES.map(profile=>({profile,actions:actionPlan(profile)})))).digest('hex'),'e28c1b8e647910e64af448d7c10fbb7ed74da96f31f62734135adb9bae684633');
});
