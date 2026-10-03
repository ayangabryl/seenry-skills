import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PROFILES,actionPlan,assertStepEvidence,assertPostParentEscapeFocusEvidence} from './transitions-library-menu-native-contract.mjs';
import {captureSettledMenuUndoFocus} from './transitions-library-menu-native-observer.mjs';
import {nativeClipGeometry} from './transitions-library-menu-discovery-helpers.mjs';

const clone=value=>structuredClone(value);
const rect=(x,y,width,height)=>({x,y,left:x,top:y,right:x+width,bottom:y+height,width,height});
const retained=JSON.parse(readFileSync(new URL('./fixtures/transitions/menu-ccbf131-heading-focus-observed.json',import.meta.url),'utf8'));
const viewport=rect(0,0,390,820),positive=retained.matchedDefault.focus.rect;
const css=extra=>({backgroundColor:'rgb(21, 21, 23)',backgroundImage:'none',color:'rgb(255, 255, 255)',opacity:'1',filter:'none',backdropFilter:'none',mixBlendMode:'normal',visibility:'visible',display:'block',transform:'none',translate:'none',scale:'none',rotate:'none',overflowX:'visible',overflowY:'visible',clipPath:'none',maskImage:'none',outlineColor:'rgb(107, 155, 255)',outlineWidth:'2px',outlineStyle:'solid',outlineOffset:'2px',boxShadow:'none',...extra});

// Only the target rectangles come from the retained hosted records. The DOM,
// ancestor metrics and paint below are explicitly modeled, not native evidence.
function sample({actionId,targetRect=rect(positive.x,positive.y,positive.width,positive.height),targetStyle={},ancestorStyle={},ancestorRect=viewport,focused=true,focusVisible=true,missing=false,connected=true,active=null,occluded=null,inputEvidence}={}){
 const globals=new Map(),mutations=[],hits=[];let time=100;
 const replace=(key,value)=>{globals.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{configurable:true,writable:true,value});};
 const forbid=name=>()=>{mutations.push(name);throw Error(`Read-only sampler attempted ${name}`);};
 const make=(id,r,parentElement,style,control)=>({id,tagName:'DIV',parentElement,style:css(style),control,isConnected:true,offsetWidth:r.width,offsetHeight:r.height,clientWidth:r.width,clientHeight:r.height,clientLeft:0,clientTop:0,getBoundingClientRect:()=>({...r,toJSON:()=>clone(r)})});
 const body=make('body',viewport,null,{},'outside'),ancestor=make('ancestor',ancestorRect,body,ancestorStyle,'outside'),target=make('heading',targetRect,ancestor,targetStyle,'detail'),child=make('heading-label',targetRect,target,{},'detail');
 target.isConnected=connected;target.closest=()=>null;target.matches=selector=>{assert.equal(selector,':focus-visible');return focusVisible;};target.contains=node=>node===child||node===target;
 for(const node of [body,ancestor,target]){for(const method of ['focus','scroll','scrollTo','scrollBy','scrollIntoView'])node[method]=forbid(method);for(const prop of ['scrollTop','scrollLeft'])Object.defineProperty(node,prop,{get:()=>0,set:forbid(prop)});}
 const document={querySelector:selector=>{assert.equal(selector,'[data-key="menu"] [data-detail="menu"]');return missing?null:target;},elementFromPoint:(x,y)=>{const n=hits.length;hits.push({x,y});return occluded===n||x<0||y<0||x>=390||y>=820?body:child;},createRange:()=>({selectNodeContents:node=>assert.equal(node,target),getClientRects:()=>[{toJSON:()=>rect(targetRect.left+4,targetRect.top+8,targetRect.width-8,targetRect.height-16),width:targetRect.width-8,height:targetRect.height-16}]})};
 Object.defineProperty(document,'activeElement',{get:()=>focused?target:body,set:forbid('document.activeElement')});
 const window={__menuNative:{active,control:node=>node?.control??'outside'},__menuNativeClipGeometry:nativeClipGeometry};
 for(const method of ['scroll','scrollTo','scrollBy'])window[method]=forbid(method);
 try{
  replace('window',window);replace('document',document);replace('innerWidth',390);replace('innerHeight',820);replace('performance',{now:()=>time++});replace('getComputedStyle',node=>node.style);
  replace('DOMMatrixReadOnly',class{constructor(){this.is2D=true;this.a=1;this.b=0;this.c=0;this.d=1;}});
  return {value:captureSettledMenuUndoFocus({actionId,inputEvidence,postParentEscape:true}),mutations,hits};
 }finally{for(const [key,value] of globals){if(value)Object.defineProperty(globalThis,key,value);else delete globalThis[key];}}
}

function snapshot(time,open){
 const name='Q3 roadmap';return {snapshotStartedAt:time,snapshotCompletedAt:time+.1,viewport:{width:390,height:820},focus:open?'trigger:roadmap':'detail',rows:[{id:'roadmap',name,nameFits:true,accessibleName:`More actions for ${name}`,expanded:'false'}],count:'1 file',statusText:'',budgetText:'Copies: 0 of 2.',recovery:{visible:false,undoVisible:false,text:''},stageOwner:open?'detail':'gallery',hash:open?'#t/menu':'',menu:{open:false,presentationOpen:false,nativeOpen:false,inert:true,logicalStateSource:'connected-trigger-inventory'},trigger:{row:'roadmap',exists:true,expanded:'false'},editor:{open:false,modal:false},parent:{nativeOpen:open,modal:open,presentation:String(open),hidden:!open,inert:!open,display:open?'block':'none',visibility:'visible'},animations:[]};
}
function fixture(options={}){
 const profile=PROFILES.find(p=>p.width===390&&p.theme==='dark'&&p.suite==='detail'),step=actionPlan(profile).find(s=>s.id==='detail-parent-escape'),id=`${profile.id}/${step.id}`;
 const key={actionId:id,eventId:1,type:'keydown',control:'trigger:roadmap',key:'Escape',trusted:true,eventAt:10,captureCompletedAt:10.1,nativeTimeStamp:10};
 const close={actionId:id,eventId:2,type:'close',control:'parent',trusted:true,eventAt:20,captureCompletedAt:20.1,nativeTimeStamp:20};
 const a={id,stepId:step.id,op:step.op,mode:step.mode,requestedAt:1,before:snapshot(2,true),after:snapshot(50,false),events:[key,close],accepted:[{...key,phase:'post-production-document-keydown',observerAt:10.2,snapshotStartedAt:10.3,snapshotCompletedAt:10.8,state:snapshot(10.4,true)}],lifecycle:[{...close,phase:'native-dialog-lifecycle',observerAt:20.2,snapshotStartedAt:20.3,snapshotCompletedAt:20.8,state:snapshot(20.4,false)}],settlement:{status:'native-finite-settlement-observed',rafAt:48,elapsedMs:8,state:snapshot(49,false)}};
 const inputEvidence={mode:'keyboard',focusCueRequired:true,keyEventId:1,keyTrusted:true,key:'Escape'};
 const observed=sample({actionId:id,inputEvidence,...options});a.settledParentEscapeFocus=observed.value;
 return {step,a,audit:{id:profile.id,profile,deleted:[]},...observed};
}
const guard=f=>assertPostParentEscapeFocusEvidence(f.step,f.a);
const full=f=>assertStepEvidence(f.step,f.a,f.audit);

test('parent Escape uses the actual settled sampler and existing full native evidence path without changing focus or scroll',()=>{
 const f=fixture();assert.doesNotThrow(()=>full(f));assert.equal(f.a.mode,undefined,'Existing key steps derive input modality from trusted events, not an invented mode field');
 assert.equal(f.value.targetControl,'detail');assert.equal(f.value.currentCenter.source,'current-restored-heading-center');assert.equal(f.hits.length,5);assert.deepEqual(f.mutations,[]);
});
test('exact retained hosted heading geometry distinguishes offscreen current return from visible matched default',()=>{
 assert.equal(retained.current.product,'ccbf13127596d0941e151b2bdac7a4e14a69e3f0');assert.equal(retained.current.focus.rect.y,912.0625);assert.equal(retained.current.focus.centerHit,false);assert.equal(retained.matchedDefault.focus.rect.y,768.0625);assert.equal(retained.matchedDefault.focus.centerHit,true);
 const r=retained.current.focus.rect,f=fixture({targetRect:rect(r.x,r.y,r.width,r.height)});assert.throws(()=>full(f),/leaves viewport or ancestor scroll clip/);assert.deepEqual(f.mutations,[]);
});
test('historical activeElement-only traces and missing or mismatched settled samples fail closed',()=>{
 for(const mutate of [f=>delete f.a.settledParentEscapeFocus,f=>f.value.actionId='another',f=>f.value.phase='settled-post-undo-focus',f=>f.value.actionInactive=false,f=>f.value.sampleStartedAt=49,f=>f.value.inputEvidence.keyEventId=2,f=>f.value.inputEvidence.keyTrusted=false,f=>f.value.inputEvidence.mode='pointer']){const f=fixture();mutate(f);assert.throws(()=>full(f));}
});
test('heading focus requires the exact trusted Escape owner and retained native parent lifecycle',()=>{
 for(const mutate of [f=>f.a.events[0].trusted=false,f=>f.a.events[0].key='Enter',f=>f.a.events[0].control='outside',f=>f.a.lifecycle=[],f=>f.a.after.parent.nativeOpen=true,f=>f.a.after.stageOwner='detail',f=>f.a.after.focus='search']){const f=fixture();mutate(f);assert.throws(()=>full(f));}
});
test('restored heading requires actual connected focus and visible full-opacity paint',()=>{
 for(const options of [{focused:false},{connected:false},{missing:true},{targetStyle:{display:'none'}},{targetStyle:{visibility:'hidden'}},{targetStyle:{opacity:'.5'}},{ancestorStyle:{opacity:'0'}},{targetStyle:{filter:'blur(1px)'}}]){const f=fixture(options);assert.throws(()=>guard(f));assert.deepEqual(f.mutations,[]);}
});
test('heading and its focus cue must both fit the actual viewport and ancestor scroll clip',()=>{
 for(const options of [{targetRect:rect(34,780,37.234375,44)},{targetRect:rect(34,775,37.234375,44)},{ancestorStyle:{overflowY:'auto'},ancestorRect:rect(0,0,390,800)}])assert.throws(()=>guard(fixture(options)),/viewport|clip/);
});
test('keyboard heading return rejects absent transparent weak or clipped focus cues',()=>{
 for(const options of [{focusVisible:false},{targetStyle:{outlineColor:'rgba(107, 155, 255, 0)'}},{targetStyle:{outlineStyle:'none'}},{targetStyle:{outlineWidth:'1px'}},{targetStyle:{outlineColor:'rgb(22, 22, 24)'}}])assert.throws(()=>guard(fixture(options)),/focus state|focus cue/);
});
test('fresh center and edge ownership reject sticky occlusion and retained original-point hits',()=>{
 for(const occluded of [0,1,2,3,4])assert.throws(()=>guard(fixture({occluded})),/occluded|another control/);
 for(const mutate of [f=>f.value.currentCenter.source='current-focus-target-center',f=>f.value.currentCenter.point.y=12,f=>f.value.currentCenter.hitControl='search',f=>delete f.value.currentCenter,f=>f.value.edgeHits.pop(),f=>delete f.value.clipAncestors,f=>f.value.geometry.rect.bottom=900]){const f=fixture();mutate(f);assert.throws(()=>guard(f));}
});
test('parent focus collection stays after finish and outside the accepted or first-RAF observer',()=>{
 const source=readFileSync(new URL('./transitions-library-menu-native.browser.mjs',import.meta.url),'utf8');
 const start=source.indexOf("if(step.check==='parent-escape'){",source.indexOf('const observed=await page.evaluate'));
 assert(start>source.indexOf('const observed=await page.evaluate(()=>window.__menuNative.finish())'));
 const end=source.indexOf('\n  }',start),body=source.slice(start,end);
 assert(body.includes('a.settledParentEscapeFocus=await page.evaluate(captureSettledMenuUndoFocus'));
 assert(body.includes('postParentEscape:true'));assert(!/scroll|focus\(/.test(body));
});
