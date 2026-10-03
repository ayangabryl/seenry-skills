import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {VERSION,PROFILES,SHARDS,CALLBACK_PROFILE,ASSETS,HARNESS,sourceBundleSHA256,assertSourceIdentity,assertRunIdentity,verifyPlan,actionPlan,stillPlan,exactSet,verifyManifest,firstPaintResult,immediateIssues,progressed,reconcileCase,assertStepEvidence,assertCallbackEvidence,videoProbeFailure,assessVideoProbe,functionalSuccess,aggregateMedia,PHONE_TEXT_TARGETS,typographyPlan,assertSettledTypography,finalizeCase,finalizeReport,mergeReports} from './transitions-library-menu-native-contract.mjs';
import {boundedOperation} from './transitions-library-menu-discovery-helpers.mjs';
import {installMenuCaptureClock,captureSettledMenuTypography} from './transitions-library-menu-native-observer.mjs';

const here=dirname(fileURLToPath(import.meta.url)),clone=x=>structuredClone(x);
const rect={left:10,top:10,right:210,bottom:170,width:200,height:160};
function paint(focused=false){return {focused,focusVisible:focused,color:'rgb(0, 0, 0)',glyphs:[{left:20,top:20,right:100,bottom:40,width:80,height:20}],cue:{background:'rgb(255, 255, 255)',adjacentBackground:'rgb(255, 255, 255)',outlineColor:'rgb(0, 0, 0)',outlineWidth:'0px',outlineStyle:'none',boxShadow:focused?'rgb(0, 0, 0) 0px 0px 0px 2px inset':'none'},chain:[{node:'item',background:'rgb(255, 255, 255)',backgroundImage:'none',opacity:'1',filter:'none',backdropFilter:'none',mixBlendMode:'normal',visibility:'visible',display:'flex',transform:'none',translate:'none',scale:'none',rotate:'none'}]};}
function state(){return {menu:{open:true,nativeOpen:true,inert:false,ariaHidden:null},trigger:{expanded:'true',hit:true},focus:'action:rename',items:['rename','duplicate','delete'].map((action,i)=>({action,disabled:false,paint:paint(i===0)})),geometry:{status:'measured-axis-aligned-intersection',rect},animations:[]};}
function instant(){const s=nativeState(101.2,{open:true,focus:'action:rename'});return {id:'case/open',targetControl:'trigger:roadmap',mode:'keyboard',events:[{actionId:'case/open',eventId:6,eventAt:90,type:'keydown',key:'Enter',trusted:true,control:'trigger:roadmap'},{actionId:'case/open',eventId:7,eventAt:100,type:'click',detail:0,trusted:true,control:'trigger:roadmap'}],accepted:[{actionId:'case/open',eventId:7,eventAt:100,type:'click',detail:0,trusted:true,control:'trigger:roadmap',phase:'post-production-stage-bubble',observerAt:100.1,snapshotStartedAt:101,snapshotCompletedAt:102,state:clone(s)}],firstRAF:{actionId:'case/open',eventId:7,sequence:1,rafTimestamp:109,callbackAt:110,snapshotStartedAt:111,snapshotCompletedAt:112,state:{...clone(s),snapshotStartedAt:111.2,snapshotCompletedAt:111.3}}};}
function caseFixture(profile=CALLBACK_PROFILE){if(profile.id===CALLBACK_PROFILE.id)return callbackFixture();return {id:profile.id,profile:clone(profile),source:sourceFixture(),runIdentity:runIdentityFixture(),status:'running',actions:actionPlan(profile).map(s=>{const a={stepId:s.id,status:'observed'};if(s.op==='open'&&s.instant){Object.assign(a,instant());if(s.mode==='pointer'){a.mode='pointer';a.events[0]={...a.events[0],type:'pointerdown',key:null};a.events[1].detail=1;a.accepted[0].detail=1;a.accepted[0].state.focus='menu';a.firstRAF.state.focus='menu';}}a.id=`${profile.id}/${s.id}`;if(s.op==='open'){a.targetControl=`trigger:${s.row}`;a.mode=s.mode;for(const row of [...(a.events||[]),...(a.accepted||[])]){row.actionId=a.id;row.control=a.targetControl;}if(a.firstRAF)a.firstRAF.actionId=a.id;}return a;}),failures:[],errors:[],collectionComplete:true,pageClosed:true,contextClosed:true,video:{file:'native-speed.webm',sha256:'0'.repeat(64),finalized:true,bytes:20,probe:{status:'observed',packets:[{pts_time:'0.000'},{pts_time:'0.040'}]}},stills:stillPlan(profile).map(label=>({label,status:'captured',before:{},after:{},bytes:10}))};}

function runIdentityFixture(){return {checkoutHead:'1'.repeat(40),githubRunId:'12345',githubRunAttempt:'1'};}
function sourceFixture(){const value={schema:VERSION,frozen:true,reconstructionBaseCommit:'a'.repeat(40),assets:Object.fromEntries(ASSETS.map(name=>[name,'b'.repeat(64)])),harness:Object.fromEntries(HARNESS.map(name=>[name,'c'.repeat(64)]))};value.bundleSHA256=sourceBundleSHA256(value);return value;}
function nativeState(t,{open=false,nativeOpen=open,inert=!open,focus='reset'}={}) {
 const s=state();Object.assign(s,{snapshotStartedAt:t,snapshotCompletedAt:t+.1,focus,viewport:{width:320,height:780},hash:'',stageOwner:'gallery',search:{value:'Menu',focused:focus==='search'},menuCard:{hidden:false,containsStage:true,visible:true,opacity:'1'},count:'2 files',statusText:'',budgetText:'Copies: 0 of 2. Reset to start again.',recovery:{visible:false,text:'',undoVisible:false},empty:false,blur:{checked:false,rootOn:false},editor:{open:false,modal:false,inert:false,value:'',error:'',errorVisible:false,invalid:null},parent:{nativeOpen:false,modal:false,presentation:'false',hidden:false,inert:false,display:'none',visibility:'visible'}});
 s.rows=[['roadmap','Q3 roadmap'],['hiring','Hiring plan']].map(([id,name])=>({id,name,nameFits:true,accessibleName:`More actions for ${name}`,expanded:open&&id==='roadmap'?'true':'false'}));
 s.trigger={row:'roadmap',expanded:open?'true':'false',hit:true,rect:{left:180,right:212,top:50,bottom:82,width:32,height:32},point:{x:196,y:66}};
 Object.assign(s.menu,{open,nativeOpen,inert,side:'bottom',rect:{left:12,right:212,top:88,bottom:248,width:200,height:160}});return s;
}
const settlement=(t,s)=>({status:'native-finite-settlement-observed',rafAt:t-.2,elapsedMs:5,state:s||nativeState(t)});
function callbackFixture(){
 const p=CALLBACK_PROFILE,id=`${p.id}/native-beforetoggle-open-close`,event=(eventId,t,oldState,newState)=>({actionId:id,eventId,type:'beforetoggle',control:'menu',trusted:true,eventAt:t,captureCompletedAt:t+.1,nativeTimeStamp:t,oldState,newState});
 const events=[event(1,30,'closed','open'),event(2,33,'open','closed')];
 const callbackEvidence={kind:'controlled-production-API-callback',actionId:id,requestedAt:29,returnedAt:34,closeCalls:1,closeRequestedAt:31,closeReturnedAt:32,afterClose:nativeState(32.1),beforetoggle:[{...events[0],callbackAt:30.2,state:nativeState(30.3,{open:true,nativeOpen:false})},{...events[1],callbackAt:33.2,state:nativeState(33.3,{open:false,nativeOpen:true})}],sync:nativeState(34.1),firstRAF:{actionId:id,sequence:1,rafTimestamp:39,callbackAt:40,state:nativeState(40.1)}};
 const initial={id:`${p.id}/initial`,stepId:'initial',op:'inspect',status:'observed',requestedAt:1,before:nativeState(2),after:nativeState(11),events:[],accepted:[],settlement:settlement(10)};
 const callback={id,stepId:'native-beforetoggle-open-close',op:'callback',status:'observed',requestedAt:20,before:nativeState(21),after:nativeState(51),events,accepted:[],callbackEvidence,settlement:settlement(50)};
 return {id:p.id,profile:clone(p),source:sourceFixture(),runIdentity:runIdentityFixture(),status:'running',actions:[initial,callback],failures:[],errors:[],collectionComplete:true,pageClosed:true,contextClosed:true,video:{file:'native-speed.webm',sha256:'0'.repeat(64),finalized:true,bytes:20,probe:{status:'observed',packets:[{pts_time:'0.000'},{pts_time:'0.040'}]}},stills:[{label:'final-state',status:'captured',before:nativeState(52),after:nativeState(53),bytes:10,hostRequest:{at:10},hostCompleted:{at:20}}],recoveredInventory:{active:null,dropped:0,events:clone(events),final:nativeState(60)}};
}
function pointerFixture(interruption=false){
 const profile=PROFILES[0],step=actionPlan(profile).find(s=>s.id===(interruption?'entry-progress-close':'roadmap-pointer-open')),id=`${profile.id}/${step.id}`;
 const a={id,stepId:step.id,op:step.op,mode:step.mode,row:'roadmap',targetControl:'trigger:roadmap',status:'observed',requestedAt:1,before:nativeState(2,{open:interruption,focus:interruption?'menu':'reset'}),after:nativeState(50,{open:!interruption,focus:'menu'}),originalPoint:{x:196,y:66},accepted:[],events:['pointerdown','pointerup','click'].map((type,i)=>({actionId:id,eventId:i+1,type,control:'trigger:roadmap',trusted:true,detail:type==='click'?1:0,eventAt:10+i,captureCompletedAt:10.1+i,nativeTimeStamp:10+i}))};
 if(!interruption)a.settlement=settlement(49,nativeState(49,{open:true,focus:'menu'}));
 if(interruption){const s=nativeState(12.01,{open:true,focus:'menu'});s.snapshotCompletedAt=12.08;s.animations=[{owner:'menu',target:'menu',pseudo:null,properties:['transform'],playState:'running',pending:false,currentTime:50,progress:.2,iterations:1,fill:'both'}];a.events[2].interruptionState=s;a.progressEvidence={eventId:3,state:clone(s)};}
 a.accepted=[{...a.events[2],phase:'post-production-stage-bubble',observerAt:12.2,snapshotStartedAt:12.3,snapshotCompletedAt:12.6,state:nativeState(12.4,{open:!interruption,nativeOpen:true,focus:'menu'})}];
 return {step,a,audit:{id:profile.id,profile,deleted:[],originalPoints:{roadmap:{x:196,y:66}}}};
}

test('32 immutable main profiles have exact complete eight-way partition; callback remains separate',()=>{assert.equal(verifyPlan().profiles,32);assert.equal(verifyPlan().shards,8);assert.equal(PROFILES.filter(p=>p.suite==='reduced').length,8);assert(!PROFILES.some(p=>p.id===CALLBACK_PROFILE.id));assert.equal(actionPlan(CALLBACK_PROFILE).length,2);});
test('missing, duplicate, empty and misplaced profiles/shards cannot verify',()=>{
 for(const profiles of [[],PROFILES.slice(1),[...PROFILES.slice(1),PROFILES[1]]])assert.throws(()=>verifyPlan(profiles));
 for(const shards of [[],SHARDS.slice(1),SHARDS.map((s,i)=>i? s:{...s,profiles:[]}),SHARDS.map((s,i)=>i? s:{...s,profiles:[...s.profiles,SHARDS[1].profiles[0]]})])assert.throws(()=>verifyPlan(PROFILES,shards));
 assert.throws(()=>exactSet(['a','a'],['a','b'],'actions'));
});
test('keyboard/reduced plans cover all outcomes, maximum unbroken name, cancellation, input errors, exhausted budget and empty recovery',()=>{
 for(const p of PROFILES.filter(p=>['keyboard','reduced'].includes(p.suite))){const a=actionPlan(p),ids=a.map(x=>x.id);for(const id of ['rename-save','rename-cancel','invalid-blank-save','invalid-long-save','invalid-escape','hiring-save','duplicate-first','duplicate-second','limit-skip-disabled','empty-recovery-persistent','undo-roadmap','final-reset','space-keyboard-open'])assert(ids.includes(id),`${p.id}: ${id}`);assert.equal(a.find(x=>x.id==='hiring-name').value.length,60);assert.equal(a.find(x=>x.id==='invalid-long').value.length,61);assert(ids.includes('delete-copy-2'));}
});
test('manifest contains five executable/markup dependencies plus all three bundled images; draft never permits native verification',()=>{
 const pins=JSON.parse(readFileSync(join(here,'transitions-library-menu-native.pins.example.json')));assert.equal(ASSETS.length,8);assert.equal(verifyManifest('/unused/gallery.html',pins,here,{allowUnfrozen:true}).frozen,false);assert.throws(()=>verifyManifest('/unused/gallery.html',pins,here));delete pins.assets['gallery-menu.js'];assert.throws(()=>verifyManifest('/unused/gallery.html',pins,here,{allowUnfrozen:true}),/asset manifest/);
});
test('local verify-only does not import or launch Playwright; ordinary invocation refuses native launch',()=>{
 const script=join(here,'transitions-library-menu-native.browser.mjs');const verify=spawnSync(process.execPath,[script,'--verify-only'],{encoding:'utf8'});assert.equal(verify.status,0,verify.stderr);assert.match(verify.stdout,/not-run/);assert.match(verify.stdout,/unverified-until-final-composition/);
 const native=spawnSync(process.execPath,[script],{encoding:'utf8',env:{...process.env,CI:'false',GITHUB_ACTIONS:'false'}});assert.notEqual(native.status,0);assert.match(native.stderr,/Native launch refused/);
});
test('actual capture listener records original event/action identity before snapshot work',()=>{
 const previous={window:globalThis.window,document:globalThis.document,performance:globalThis.performance};let now=100;const listeners=new Map();
 try{globalThis.window={};globalThis.document={addEventListener:(type,fn,capture)=>{assert.equal(capture,true);listeners.set(type,fn);}};globalThis.performance={now:()=>now++};installMenuCaptureClock();const trace=window.__menuNative;trace.active={id:'A',events:[]};const row={dataset:{menuFile:'roadmap'}},button={closest:s=>s==='[data-menu-file]'?row:button};const e={type:'click',target:button,isTrusted:true,detail:0,timeStamp:42};listeners.get('click')(e);const recorded=trace.eventMap.get(e);assert.equal(recorded.eventAt,100);assert.equal(recorded.captureCompletedAt,101);assert.equal(recorded.actionId,'A');assert.equal(recorded.control,'trigger:roadmap');assert.equal(trace.active.events[0],recorded);}finally{Object.assign(globalThis,previous);}
});
test('accepted and actual first selected rAF require the full same readable/focus semantics',()=>{assert.deepEqual(immediateIssues(state(),'action:rename'),[]);assert.equal(firstPaintResult(instant(),'action:rename').status,'native-contract-observed');for(const boundary of ['accepted','firstRAF']){const a=instant(),s=boundary==='accepted'?a.accepted[0].state:a.firstRAF.state;s.items[0].paint.chain[0].opacity='.2';assert.equal(firstPaintResult(a,'action:rename').status,'unverified');}});
test('cannot substitute later good sample, unrelated action, wrong input owner or wrong event',()=>{for(const mutate of [a=>delete a.firstRAF,a=>a.firstRAF.sequence=2,a=>a.firstRAF.actionId='another',a=>a.firstRAF.eventId=99,a=>a.accepted[0].actionId='another',a=>a.events[1].control='action:delete',a=>a.events[0].key='x',a=>a.accepted[0].phase='post-production-document-bubble']){const a=instant();mutate(a);assert.equal(firstPaintResult(a,'action:rename').status,'unverified');}});
test('late acceptance work retains 96ms actual callback delay, never fabricated time zero',()=>{const a=instant();a.accepted[0].snapshotCompletedAt=180;Object.assign(a.firstRAF,{rafTimestamp:195,callbackAt:196,snapshotStartedAt:197,snapshotCompletedAt:198});const result=firstPaintResult(a,'action:rename');assert.equal(result.status,'unverified');assert.equal(result.firstCallbackDeltaMs,96);assert.equal(result.acceptedDeltaMs,80);});
test('callback arrival in time but late snapshot completion remains unverified',()=>{const a=instant();a.firstRAF.snapshotCompletedAt=151;assert.equal(firstPaintResult(a,'action:rename').status,'unverified');});
test('focus cue, paint chain blur/transform, clipped glyph, missing action and wrong focus all fail both boundaries',()=>{
 for(const mutate of [s=>s.items[0].paint.cue.boxShadow='none',s=>s.items[0].paint.chain[0].filter='blur(1px)',s=>s.items[0].paint.chain[0].transform='matrix(1,0,0,1,0,2)',s=>s.items[0].paint.glyphs[0].bottom=180,s=>s.items.pop(),s=>s.focus='menu',s=>s.trigger.hit=false,s=>s.menu.inert=true]){const a=instant();mutate(a.accepted[0].state);assert.equal(firstPaintResult(a,'action:rename').status,'unverified');}
});
test('progress evidence needs actual Menu surface transform running nonpending after zero and before finish',()=>{const a={owner:'menu',target:'menu',pseudo:null,properties:['transform'],playState:'running',pending:false,currentTime:15,progress:.1};assert(progressed({animations:[a]}));for(const changes of [{pending:true},{currentTime:0},{progress:0},{progress:1},{target:'action:rename'},{pseudo:'::before'},{properties:['opacity']},{playState:'finished'}])assert(!progressed({animations:[{...a,...changes}]}));});
test('missing/duplicate/empty required actions cannot pass case reconciliation',()=>{for(const actions of [[],caseFixture().actions.slice(1),[...caseFixture().actions.slice(1),caseFixture().actions[1]]]){const run=caseFixture();run.actions=actions;assert.equal(reconcileCase(run),'failed');}assert.equal(reconcileCase(caseFixture()),'native-contract-observed');});
test('an instant opening marked observed cannot conceal absent first-rAF evidence on reconciliation',()=>{const run=caseFixture(PROFILES.find(p=>p.suite==='keyboard'));delete run.actions.find(a=>a.firstRAF).firstRAF;assert.equal(reconcileCase(run),'failed');});
test('wrong action ID/row and missing required still fail even with superficially observed labels',()=>{for(const mutate of [r=>r.actions[0].id='wrong',r=>r.actions.find(a=>a.firstRAF).targetControl='trigger:other',r=>r.stills.pop()]){const run=caseFixture(PROFILES.find(p=>p.suite==='keyboard'));mutate(run);assert.equal(reconcileCase(run),'failed');}});
test('page, context and media closure retain every original error, including native events delivered during close',async()=>{const run=caseFixture();run.failures.push({kind:'original',reason:'Original failure'});const order=[];await finalizeCase(run,{bound:boundedOperation,persist:()=>{},recover:async()=>order.push('recover'),closePage:async()=>{order.push('page');run.errors.push({kind:'late-page',message:'page close event'});},closeContext:async()=>{order.push('context');run.errors.push({kind:'late-context',message:'context close event'});},finalizeMedia:async()=>order.push('media')});assert.deepEqual(order,['recover','page','context','media']);assert.equal(run.status,'failed');assert.equal(run.failures[0].reason,'Original failure');assert.equal(run.errors.length,2);});
test('failed finalization and timeout do not suppress remaining cleanup or invent pass',async()=>{const run=caseFixture();let media=false;await finalizeCase(run,{bound:async(fn,ms,name)=>name==='recover'?Promise.reject(Error('trace timeout')):fn(),persist:()=>{},recover:async()=>{},closePage:async()=>{throw Error('page close failed');},closeContext:async()=>{},finalizeMedia:async()=>{media=true;}});assert(media);assert.equal(run.status,'failed');assert(run.failures.some(e=>e.kind==='recover'));assert(run.failures.some(e=>e.kind==='close-page'));});
test('browser-close late errors are reconciled across already completed cases before report result',async()=>{const runs=PROFILES.filter(p=>p.shard===0).map(caseFixture);const report={shard:0,status:'running',errors:[]};await finalizeReport(report,runs,{bound:boundedOperation,persist:()=>{},verifySources:()=>({frozen:true}),closeBrowser:async()=>{runs[0].errors.push({kind:'late-browser',message:'arrived during browser closure'});}});assert.equal(report.status,'failed');assert.equal(runs[0].status,'failed');});
test('empty, duplicate or missing shard union and absent controlled callback evidence cannot pass',()=>{for(const reports of [[],[{shard:0}],[{shard:0},{shard:0}]])assert.equal(mergeReports(reports,()=>caseFixture()).status,'incomplete');});
test('complete main union plus separately scoped callback is required; changed source or missing evidence never passes',()=>{
 const source=sourceFixture(),base={version:VERSION,runIdentity:runIdentityFixture(),checkoutHead:runIdentityFixture().checkoutHead,status:'native-contract-observed',functionalStatus:'observed',mediaMetadata:{status:'observed',gaps:[]},errors:[],source,endSource:source,browserClosed:true,sourcesReverified:true};
 const reports=SHARDS.map(s=>({...base,shard:s.id,cases:s.profiles.map(id=>({id}))})),callback={...base,shard:'callback',cases:[{id:CALLBACK_PROFILE.id}]};
 const read=(r,e)=>caseFixture(e.id===CALLBACK_PROFILE.id?CALLBACK_PROFILE:PROFILES.find(p=>p.id===e.id));
 assert.equal(mergeReports(reports,read,callback).status,'incomplete','Complete labels alone must not create main-profile native evidence');assert.equal(mergeReports(reports,read).status,'incomplete');
 const missing=clone(reports);missing[1].cases.pop();assert.equal(mergeReports(missing,read,callback).status,'incomplete');
 const changed=clone(reports);changed[1].source={frozen:true,changed:true};assert.equal(mergeReports(changed,read,callback).status,'incomplete');
});
test('browser-free merge CLI resolves each path and writes incomplete report without importing native runtime',()=>{
 const dir=mkdtempSync(join(tmpdir(),'menu-union-test-'));
 try{const files=SHARDS.map(s=>{const path=join(dir,`${s.id}.json`);writeFileSync(path,JSON.stringify({shard:s.id,cases:[]}));return path;});const output=join(dir,'union.json'),result=spawnSync(process.execPath,[join(here,'transitions-library-menu-native.browser.mjs'),'--merge',files.join(','),'--out',output],{encoding:'utf8'});assert.equal(result.status,2,result.stderr);assert.equal(JSON.parse(readFileSync(output)).status,'incomplete');assert(!result.stderr.includes('ERR_INVALID_ARG_TYPE'));}finally{rmSync(dir,{recursive:true,force:true});}
});
test('runner never uses the demo state model or changes animation speed/native popover methods',()=>{const source=readFileSync(join(here,'transitions-library-menu-native.browser.mjs'),'utf8');assert(!source.includes('galleryMenuDemo.getState'));assert(!/\.pause\(|playbackRate\s*=|showPopover\s*=|hidePopover\s*=/.test(source));assert(source.includes("animations:'allow'"));assert(source.includes('closeCalls++'));assert(source.includes('beforetoggle'));});

test('ordinary pointer validator derives a valid result from real-shaped input and accepted/settled snapshots',()=>{const f=pointerFixture();assert.doesNotThrow(()=>assertStepEvidence(f.step,f.a,f.audit));});
test('ordinary missing/synthetic/wrong-owner/wrong-order input cannot be replaced with an observed status',()=>{
 const negatives=[a=>a.events=[],a=>a.events.forEach(e=>e.trusted=false),a=>a.events[2].control='action:delete',a=>a.events[0].eventAt=13,a=>a.accepted=[],a=>delete a.accepted[0].state,a=>delete a.after,a=>delete a.settlement.state];
 for(const mutate of negatives){const f=pointerFixture();mutate(f.a);assert.throws(()=>assertStepEvidence(f.step,f.a,f.audit));}
});
test('ordinary progressed interruption must be linked to actual click, not pointerdown or an invented summary',()=>{
 const valid=pointerFixture(true);assert.doesNotThrow(()=>assertStepEvidence(valid.step,valid.a,valid.audit));
 for(const mutate of [a=>delete a.progressEvidence,a=>a.progressEvidence.eventId=1,a=>delete a.events[2].interruptionState,a=>a.events[2].interruptionState.animations[0].pending=true,a=>a.events[2].interruptionState.animations[0].progress=0,a=>a.events[2].trusted=false]){const f=pointerFixture(true);mutate(f.a);assert.throws(()=>assertStepEvidence(f.step,f.a,f.audit));}
});
test('controlled callback baseline validates native opening/retirement order, host close and first-rAF inventory',()=>{const run=callbackFixture();assert.doesNotThrow(()=>assertCallbackEvidence(run.actions[1]));assert.equal(reconcileCase(run),'native-contract-observed');});
test('missing/synthetic/duplicated/wrong-order callback evidence never reconciles as observed',()=>{
 const mutations=[r=>delete r.actions[1].callbackEvidence,r=>r.actions[1].callbackEvidence.beforetoggle=[],r=>r.actions[1].events=[],r=>r.actions[1].events[0].trusted=false,r=>r.actions[1].callbackEvidence.beforetoggle[0].trusted=false,r=>r.actions[1].callbackEvidence.beforetoggle.reverse(),r=>r.actions[1].callbackEvidence.closeCalls=0,r=>r.actions[1].callbackEvidence.closeCalls=2,r=>r.actions[1].callbackEvidence.returnedAt=31,r=>r.actions[1].callbackEvidence.firstRAF.sequence=2,r=>r.actions[1].callbackEvidence.sync.menu.nativeOpen=true,r=>r.actions[1].callbackEvidence.afterClose.animations=[{owner:'menu'}]];
 for(const mutate of mutations){const run=callbackFixture();mutate(run);assert.equal(reconcileCase(run),'failed');assert(run.issues.some(i=>i.kind==='action-evidence'));}
});
test('missing final snapshot, unmatched terminal event, active inventory and empty action list fail closed',()=>{
 for(const mutate of [r=>delete r.recoveredInventory,r=>delete r.recoveredInventory.final,r=>r.recoveredInventory.events.pop(),r=>r.recoveredInventory.active={id:'unfinished'},r=>r.recoveredInventory.final.menu.nativeOpen=true,r=>r.recoveredInventory.final.rows[0].name='stale',r=>r.actions=[]]){const run=callbackFixture();mutate(run);assert.equal(reconcileCase(run),'failed');}
});
test('the v1 forged ordinary/callback reproductions now fail even with complete IDs and media labels',()=>{
 for(const profile of [PROFILES[0],CALLBACK_PROFILE]){const run=caseFixture(profile);for(const a of run.actions){delete a.before;delete a.after;delete a.callbackEvidence;delete a.progressEvidence;a.events=[];a.accepted=[];}assert.equal(reconcileCase(run),'failed');assert(run.issues.some(i=>i.kind==='action-evidence'));}
});
test('callback merge enforces exact case ID, shared source, error inventory and actual native evidence',()=>{
 const source=sourceFixture(),base={version:VERSION,runIdentity:runIdentityFixture(),checkoutHead:runIdentityFixture().checkoutHead,status:'native-contract-observed',functionalStatus:'observed',mediaMetadata:{status:'observed',gaps:[]},errors:[],source,endSource:source,browserClosed:true,sourcesReverified:true};
 const reports=SHARDS.map(s=>({...clone(base),shard:s.id,cases:s.profiles.map(id=>({id}))})),makeReport=()=>({...clone(base),shard:'callback',cases:[{id:CALLBACK_PROFILE.id}]});
 const evaluate=(report,run)=>mergeReports(reports,(r,e)=>r.shard==='callback'?run:caseFixture(PROFILES.find(p=>p.id===e.id)),report).issues.filter(i=>i.kind==='controlled-callback');
 assert.deepEqual(evaluate(makeReport(),callbackFixture()),[],'Valid controlled case should pass its own branch even when main fixtures lack native proof');
 for(const mutate of [r=>r.id='substituted',r=>delete r.source,r=>r.source={frozen:true,wrong:true},r=>r.profile={...CALLBACK_PROFILE,id:'other'},r=>r.actions[1].events=[]]){const run=callbackFixture();mutate(run);assert(evaluate(makeReport(),run).length>0);}
 for(const mutate of [r=>r.errors.push({kind:'late-browser',reason:'late error'}),r=>delete r.errors,r=>r.source={frozen:true,wrong:true},r=>r.cases[0].id='substituted']){const report=makeReport();mutate(report);assert(evaluate(report,callbackFixture()).length>0);}
});

test('first-rAF state cannot substitute a later or unclocked snapshot inside an on-time wrapper',()=>{
 for(const mutate of [a=>Object.assign(a.firstRAF.state,{snapshotStartedAt:200,snapshotCompletedAt:201}),a=>delete a.firstRAF.state.snapshotCompletedAt,a=>a.firstRAF.state.snapshotStartedAt=110,a=>a.firstRAF.state.snapshotCompletedAt=113,a=>delete a.firstRAF.rafTimestamp,a=>a.firstRAF.rafTimestamp=NaN,a=>Object.assign(a.accepted[0].state,{snapshotStartedAt:200,snapshotCompletedAt:201})]){const a=instant();mutate(a);const result=firstPaintResult(a,'action:rename');assert.equal(result.status,'unverified');assert(result.issues.some(i=>i.kind==='first-paint-state-clock'));}
});

test('actual reduced-profile opening rejects a late nested first-rAF state and omitted callback timestamp',()=>{
 const profile=PROFILES.find(p=>p.id==='320-light-reduced'),step=actionPlan(profile).find(s=>s.id==='roadmap-open'),f=pointerFixture();
 Object.assign(f.a,{id:`${profile.id}/${step.id}`,stepId:step.id,op:step.op,mode:step.mode});for(const row of [...f.a.events,...f.a.accepted])row.actionId=f.a.id;f.a.firstRAF={actionId:f.a.id,eventId:3,sequence:1,callbackAt:20,snapshotStartedAt:20.5,snapshotCompletedAt:22,rafTimestamp:19,state:nativeState(21,{open:true,focus:'menu'})};f.audit={id:profile.id,profile,deleted:[],originalPoints:{}};
 assert.doesNotThrow(()=>assertStepEvidence(step,clone(f.a),clone(f.audit)));
 const bad=clone(f.a);bad.firstRAF.state.snapshotStartedAt=200;bad.firstRAF.state.snapshotCompletedAt=200.1;assert.throws(()=>assertStepEvidence(step,bad,clone(f.audit)));
 const missing=clone(f.a);delete missing.firstRAF.rafTimestamp;assert.throws(()=>assertStepEvidence(step,missing,clone(f.audit)));
});
test('empty, reversed or missing screenshot browser/host intervals fail reconciliation',()=>{
 for(const mutate of [s=>{s.before={};s.after={};},s=>s.after=nativeState(1),s=>delete s.before.snapshotCompletedAt,s=>delete s.hostRequest,s=>s.hostCompleted.at=1]){const run=callbackFixture();mutate(run.stills[0]);assert.equal(reconcileCase(run),'failed');assert(run.issues.some(i=>i.kind==='stills'));}
});
test('observed video labels without nonempty finite PTS packets fail reconciliation',()=>{
 for(const probe of [{status:'observed'},{status:'observed',packets:[]},{status:'observed',packets:[{}]},{status:'observed',packets:[{pts_time:null}]},{status:'observed',packets:[{pts_time:''}]},{status:'observed',packets:[{pts_time:'not a clock'}]}]){const run=callbackFixture();run.video.probe=probe;assert.equal(reconcileCase(run),'failed');assert(run.issues.some(i=>i.kind==='video'));}
});

function searchFixture(kind='search-retired'){
 const profile=PROFILES[0],step=actionPlan(profile).find(s=>s.check===kind),id=`${profile.id}/${step.id}`,before=nativeState(2,{open:true,focus:'search'}),after=nativeState(50,{open:kind==='search-kept',focus:'search'});
 const value=step.value;before.search={value:'Menu',focused:true};after.search={value,focused:true};after.menuCard.hidden=kind==='search-retired';after.menuCard.visible=!after.menuCard.hidden;
 for(const state of [before,after]){state.rows[1].name='Search retained file';state.rows[1].accessibleName='More actions for Search retained file';}
 const input={actionId:id,eventId:1,type:'input',control:'search',trusted:true,eventAt:10,captureCompletedAt:10.1,nativeTimeStamp:10,value};
 const inputState=clone(before);Object.assign(inputState,{snapshotStartedAt:10.4,snapshotCompletedAt:10.5});inputState.search.value=value;
 const a={id,stepId:step.id,op:step.op,targetControl:'search',status:'observed',requestedAt:1,before,after,events:[input],accepted:[{...input,phase:'post-production-document-input',observerAt:10.2,snapshotStartedAt:10.3,snapshotCompletedAt:10.6,state:inputState}],settlement:settlement(49,{...clone(after),snapshotStartedAt:49,snapshotCompletedAt:49.1}),productionClosures:[],filterMutations:[]};
 if(kind==='search-retired'){
  const event={actionId:id,eventId:2,type:'st:close',control:'menu',trusted:false,eventAt:30,captureCompletedAt:30.1,nativeTimeStamp:30};a.events.push(event);
  const state={...clone(after),snapshotStartedAt:30.4,snapshotCompletedAt:30.5,menuCard:{hidden:false,containsStage:true,visible:true,opacity:'0'}};
  a.productionClosures=[{...event,phase:'production-menu-close-completed',observerAt:30.2,snapshotStartedAt:30.3,snapshotCompletedAt:30.6,state}];
  a.filterMutations=[{actionId:id,phase:'menu-card-hidden-mutation',hidden:true,oldValue:null,observerAt:31,state:{...clone(after),snapshotStartedAt:31.1,snapshotCompletedAt:31.2}}];
 }
 return {step,a,audit:{id:profile.id,profile,deleted:[],originalPoints:{},lastRows:before.rows.map(r=>[r.id,r.name])}};
}
test('bounded Search paths are required in each pointer profile, with a moved-detail slash ownership check',()=>{
 for(const p of PROFILES.filter(p=>p.suite==='pointer'))for(const id of ['search-save','search-slash','search-keep','search-away','search-escape','search-restore','search-reset'])assert(actionPlan(p).some(s=>s.id===id));
 for(const p of PROFILES.filter(p=>p.suite==='detail'))assert(actionPlan(p).some(s=>s.id==='detail-background-search-slash'));
 assert(!PROFILES.some(p=>actionPlan(p).some(s=>s.id.includes('supersed'))),'Inherited superseded fade is explicitly outside this acceptance scope');
});
test('accepted Search filtering retires native ownership before hidden mutation while retaining committed names and focus',()=>{const f=searchFixture();assert.doesNotThrow(()=>assertStepEvidence(f.step,f.a,f.audit));});
test('Search retirement rejects stale ownership, missing completed-close evidence, reversed hide order, stolen focus and lost values',()=>{
 for(const mutate of [a=>a.productionClosures=[],a=>a.productionClosures[0].state.menu.nativeOpen=true,a=>a.productionClosures[0].state.menuCard.hidden=true,a=>a.filterMutations[0].state.snapshotStartedAt=29,a=>a.after.focus='trigger:roadmap',a=>a.after.rows[1].name='lost',a=>a.accepted[0].phase='post-production-stage-input',a=>a.events[0].trusted=false]){const f=searchFixture();mutate(f.a);assert.throws(()=>assertStepEvidence(f.step,f.a,f.audit));}
});
test('filter-keep requires live ownership and visible paint; inherited opacity-zero results cannot pass',()=>{const f=searchFixture('search-kept');assert.doesNotThrow(()=>assertStepEvidence(f.step,f.a,f.audit));for(const mutate of [a=>a.after.menu.nativeOpen=false,a=>a.after.menuCard.hidden=true,a=>a.after.menuCard.opacity='0',a=>a.productionClosures=[{}]]){const g=searchFixture('search-kept');mutate(g.a);assert.throws(()=>assertStepEvidence(g.step,g.a,g.audit));}});
test('slash Search focus is validated at post-document bubble, not the earlier stage boundary',()=>{
 const profile=PROFILES[0],step=actionPlan(profile).find(s=>s.id==='search-slash'),id=`${profile.id}/${step.id}`,before=nativeState(2,{open:true,focus:'menu'}),after=nativeState(50,{open:true,focus:'search'}),event={actionId:id,eventId:1,type:'keydown',key:'/',control:'menu',trusted:true,eventAt:10,captureCompletedAt:10.1,nativeTimeStamp:10};
 const a={id,stepId:step.id,op:'key',status:'observed',requestedAt:1,before,after,events:[event],accepted:[{...event,phase:'post-production-document-keydown',observerAt:10.2,snapshotStartedAt:10.3,snapshotCompletedAt:10.6,defaultPrevented:true,state:nativeState(10.4,{open:true,focus:'search'})}],settlement:settlement(49,nativeState(49,{open:true,focus:'search'}))};
 assert.doesNotThrow(()=>assertStepEvidence(step,clone(a),{id:profile.id,deleted:[]}));a.accepted[0].phase='post-production-stage-keydown';assert.throws(()=>assertStepEvidence(step,a,{id:profile.id,deleted:[]}));
});
const absentProbe=()=>videoProbeFailure({code:'ENOENT',syscall:'spawnSync ffprobe',path:'ffprobe',message:'spawnSync ffprobe ENOENT'});
test('only exact ffprobe executable-not-found evidence is an unavailable metadata diagnostic',()=>{
 assert.deepEqual(assessVideoProbe(absentProbe()),{status:'unavailable'});
 for(const error of [{code:'ENOENT',path:'video.webm',syscall:'open'},{code:'EACCES',path:'ffprobe',syscall:'spawnSync ffprobe'},{code:'ETIMEDOUT',path:'ffprobe',syscall:'spawnSync ffprobe'},{message:'ffprobe missing'}])assert.throws(()=>assessVideoProbe(videoProbeFailure(error)));
 assert.throws(()=>assessVideoProbe({...absentProbe(),packets:[{pts_time:'0'}]}),'Unavailable metadata must never invent PTS');
});
test('known unavailable metadata preserves raw bytes/hash and keeps actual functional evidence distinct',()=>{
 const run=callbackFixture();run.video.probe=absentProbe();assert.equal(reconcileCase(run),'native-functional-observed');assert.equal(run.functionalStatus,'observed');assert.equal(run.mediaMetadata.status,'unavailable');assert.equal(run.mediaMetadata.gaps[0].code,'FFPROBE_NOT_FOUND');assert.equal(run.mediaMetadata.gaps[0].rawVideo.sha256,run.video.sha256);assert(functionalSuccess(run));assert(!run.video.probe.packets);
});
test('missing ffprobe cannot waive missing raw capture, trace, action, screenshot, or late errors',()=>{
 for(const mutate of [r=>delete r.video.sha256,r=>r.video.bytes=0,r=>r.actions.pop(),r=>delete r.recoveredInventory.final,r=>r.actions[1].events=[],r=>r.stills[0].after={},r=>r.errors.push({kind:'late-page',message:'error'}),r=>r.failures.push({kind:'finalization',reason:'close timeout'})]){const run=callbackFixture();run.video.probe=absentProbe();mutate(run);assert.equal(reconcileCase(run),'failed');assert(!functionalSuccess(run));}
});
test('report summaries preserve the known media gap after successful native evidence and close',async()=>{
 const run=callbackFixture();run.video.probe=absentProbe();const report={shard:'callback',status:'running',errors:[],runIdentity:runIdentityFixture(),checkoutHead:runIdentityFixture().checkoutHead};await finalizeReport(report,[run],{bound:boundedOperation,persist:()=>{},verifySources:()=>run.source,closeBrowser:async()=>{}});assert.equal(report.status,'native-functional-observed');assert.equal(report.functionalStatus,'observed');assert.equal(report.mediaMetadata.gaps.length,1);assert.equal(report.mediaMetadata.gaps[0].profileId,CALLBACK_PROFILE.id);
});

test('pre-publication pin identity binds reconstruction base and every immutable hash without self-reference',()=>{
 const source=sourceFixture();assert.doesNotThrow(()=>assertSourceIdentity(source));const shuffled={...source,assets:Object.fromEntries(Object.entries(source.assets).reverse()),harness:Object.fromEntries(Object.entries(source.harness).reverse())};assert.equal(sourceBundleSHA256(shuffled),source.bundleSHA256);assert.doesNotThrow(()=>assertSourceIdentity(shuffled));
 for(const mutate of [s=>delete s.reconstructionBaseCommit,s=>s.reconstructionBaseCommit='d'.repeat(40),s=>delete s.bundleSHA256,s=>s.assets['gallery.js']='d'.repeat(64),s=>delete s.assets['gallery-menu.js'],s=>s.harness[HARNESS[0]]='e'.repeat(64),s=>s.candidate='f'.repeat(40)]){const bad=clone(source);mutate(bad);assert.throws(()=>assertSourceIdentity(bad));}
});
test('merge CLI retains original missing/malformed index failure and declared partial inventory',()=>{
 for(const kind of ['missing','malformed']){
  const dir=mkdtempSync(join(tmpdir(),'menu-union-input-test-'));
  try{
   const files=SHARDS.map(s=>{const path=join(dir,`${s.id}.json`);if(s.id!==3)writeFileSync(path,JSON.stringify({shard:s.id,cases:[]}));else if(kind==='malformed')writeFileSync(path,'{broken JSON');return path;});
   const output=join(dir,'union.json'),result=spawnSync(process.execPath,[join(here,'transitions-library-menu-native.browser.mjs'),'--merge',files.join(','),'--out',output],{encoding:'utf8'});
   assert.equal(result.status,2);const union=JSON.parse(readFileSync(output));assert.equal(union.status,'incomplete');assert.equal(union.functionalStatus,'failed');assert.equal(union.declaredInputs.shards.length,8);assert.equal(union.inputInventory.length,8);assert.equal(union.partialReports.length,3);assert.deepEqual(union.profiles,[]);assert.match(union.fatalError,kind==='missing'?/ENOENT/:/SyntaxError/);assert.equal(union.inputInventory.find(r=>r.path===files[3]).status,'failed');assert.equal(union.inputInventory.find(r=>r.path===files[7]).status,'available-unread');
  }finally{rmSync(dir,{recursive:true,force:true});}
 }
});
test('actual checkout and GitHub run/attempt provenance rejects missing and mixed packets including callback',()=>{
 assert.doesNotThrow(()=>assertRunIdentity(runIdentityFixture()));for(const mutate of [r=>delete r.checkoutHead,r=>delete r.githubRunId,r=>delete r.githubRunAttempt,r=>r.githubRunAttempt='0']){const id=runIdentityFixture();mutate(id);assert.throws(()=>assertRunIdentity(id));}
 const source=sourceFixture(),base={version:VERSION,status:'native-contract-observed',functionalStatus:'observed',mediaMetadata:{status:'observed',gaps:[]},errors:[],source,endSource:source,runIdentity:runIdentityFixture(),checkoutHead:runIdentityFixture().checkoutHead,browserClosed:true,sourcesReverified:true};
 const reports=SHARDS.map(s=>({...clone(base),shard:s.id,cases:s.profiles.map(id=>({id}))})),callback={...clone(base),shard:'callback',cases:[{id:CALLBACK_PROFILE.id}]};
 const read=(r,e)=>r.shard==='callback'?callbackFixture():caseFixture(PROFILES.find(p=>p.id===e.id));
 for(const mutate of [r=>delete r.runIdentity,r=>r.runIdentity.githubRunId='54321',r=>r.runIdentity.githubRunAttempt='2',r=>r.runIdentity.checkoutHead='2'.repeat(40),r=>r.checkoutHead='2'.repeat(40)]){const mixed=clone(reports);mutate(mixed[1]);assert(mergeReports(mixed,read,callback).issues.some(i=>i.kind==='run-identity'));const wrongCallback=clone(callback);mutate(wrongCallback);assert(mergeReports(reports,read,wrongCallback).issues.some(i=>i.kind==='controlled-callback'));}
 const wrongCase=callbackFixture();wrongCase.runIdentity.githubRunAttempt='2';assert(mergeReports(reports,(r,e)=>r.shard==='callback'?wrongCase:read(r,e),callback).issues.some(i=>i.kind==='controlled-callback'));
});
test('phone typography sampling is only required after selected settled actions, with actual font and glyph bounds',()=>{
 const profile=PROFILES.find(p=>p.id==='320-light-keyboard'),action={id:'phone/initial',after:nativeState(50)},sample={actionId:action.id,phase:'settled-phone-typography',actionInactive:true,viewportWidth:320,sampleStartedAt:51,sampleCompletedAt:52,overflow:false,rows:[{selector:PHONE_TEXT_TARGETS[0].selector,text:'2 files',fontSize:15,painted:true,paintChain:[{display:'block',visibility:'visible',opacity:'1'}],fits:true,topLayer:false,rect:{left:20,top:20,right:100,bottom:40,width:80,height:20},containerRect:rect,visibleClip:rect,glyphs:[{left:22,top:22,right:98,bottom:38,width:76,height:16}]}]};
 assert.doesNotThrow(()=>assertSettledTypography(sample,action,profile));assert(typographyPlan(profile).includes('rename-begin'));assert(!typographyPlan(profile).includes('roadmap-open'));assert.deepEqual(typographyPlan(PROFILES.find(p=>p.width===1100)),[]);
 for(const mutate of [s=>s.actionInactive=false,s=>s.sampleStartedAt=40,s=>s.rows[0].fontSize=14,s=>s.rows[0].paintChain=[],s=>s.rows[0].glyphs=[],s=>s.rows[0].glyphs[0].right=120,s=>s.rows[0].rect.right=400]){const bad=clone(sample);mutate(bad);assert.throws(()=>assertSettledTypography(bad,action,profile));}
 const input=clone(sample);input.rows[0].selector='#menu-rename input';input.rows[0].fontSize=15;assert.throws(()=>assertSettledTypography(input,action,profile));input.rows[0].fontSize=16;input.rows[0].glyphs=[];assert.doesNotThrow(()=>assertSettledTypography(input,action,profile));
});
test('Search close/hide sequence is causally after the input and before the selected settled snapshot',()=>{
 const valid=searchFixture();assert.doesNotThrow(()=>assertStepEvidence(valid.step,valid.a,valid.audit));
 for(const mutate of [
  a=>{const e=a.events[1],row=a.productionClosures[0];Object.assign(e,{eventAt:5,captureCompletedAt:5.1,nativeTimeStamp:5});Object.assign(row,e,{observerAt:5.2,snapshotStartedAt:5.3,snapshotCompletedAt:5.6});Object.assign(row.state,{snapshotStartedAt:5.4,snapshotCompletedAt:5.5});Object.assign(a.filterMutations[0],{observerAt:8});Object.assign(a.filterMutations[0].state,{snapshotStartedAt:8.1,snapshotCompletedAt:8.2});},
  a=>{a.filterMutations[0].observerAt=60;Object.assign(a.filterMutations[0].state,{snapshotStartedAt:61,snapshotCompletedAt:61.1});},
  a=>a.productionClosures[0].actionId='foreign',a=>a.filterMutations[0].actionId='foreign',a=>a.productionClosures=[],a=>a.filterMutations=[]
 ]){const f=searchFixture();mutate(f.a);assert.throws(()=>assertStepEvidence(f.step,f.a,f.audit));}
 const sync=searchFixture(),e=sync.a.events[1],row=sync.a.productionClosures[0];Object.assign(e,{eventAt:10.2,captureCompletedAt:10.3,nativeTimeStamp:10.2});Object.assign(row,e,{observerAt:10.4,snapshotStartedAt:10.5,snapshotCompletedAt:10.8});Object.assign(row.state,{snapshotStartedAt:10.6,snapshotCompletedAt:10.7});sync.a.filterMutations[0].observerAt=11;Object.assign(sync.a.filterMutations[0].state,{snapshotStartedAt:11.1,snapshotCompletedAt:11.2});Object.assign(sync.a.accepted[0],{observerAt:12,snapshotStartedAt:12.1,snapshotCompletedAt:12.4});Object.assign(sync.a.accepted[0].state,{snapshotStartedAt:12.2,snapshotCompletedAt:12.3});assert.doesNotThrow(()=>assertStepEvidence(sync.step,sync.a,sync.audit),'Synchronous close may precede document-bubble acceptance');
});
function executeTypography(leaves,activeModal=null){
 let time=1;const fakeRect=bounds=>({...bounds,toJSON:()=>({...bounds})});
 const doc={activeElement:activeModal?{closest:()=>activeModal}:null,querySelectorAll:selector=>leaves.filter(n=>n.selector===selector),createRange:()=>{let node;return {selectNodeContents:n=>node=n,getClientRects:()=>[fakeRect(node.glyphBounds||node.bounds)]};}};
 for(const node of leaves)node.getBoundingClientRect=()=>fakeRect(node.bounds);
 const selectors=[...new Set(leaves.map(n=>n.selector))].map(selector=>PHONE_TEXT_TARGETS.find(t=>t.selector===selector));
 return new Function('window','document','getComputedStyle','HTMLInputElement','performance','innerWidth','innerHeight',`return (${captureSettledMenuTypography.toString()})({actionId:'detail/sample'});`)
  ({__menuPhoneTypographyTargets:selectors,__menuNative:{active:null}},doc,n=>n.style,class {},{now:()=>time++},320,780);
}
function typographyGeometry(bounds,{fontSize='15px',selector=PHONE_TEXT_TARGETS[0].selector,parent=null}={}){
 const node={bounds,textContent:'2 files',id:'',selector,parentElement:parent,style:{display:'block',visibility:'visible',opacity:'1',fontSize,overflowX:'visible',overflowY:'visible'}};
 node.closest=()=>parent;return node;
}
function scrollDialog(bounds){return {bounds,parentElement:null,style:{display:'block',visibility:'visible',opacity:'1',overflowX:'auto',overflowY:'auto'},offsetWidth:bounds.width,offsetHeight:bounds.height,clientLeft:0,clientTop:0,clientWidth:bounds.width,clientHeight:bounds.height,getBoundingClientRect(){return {...this.bounds,toJSON:()=>({...this.bounds})};},contains(node){return node.parentElement===this;}};}
test('actual phone sampler excludes the peer-reproduced scrolled-offscreen leaf without relaxing visible fit',()=>{
 const parent=scrollDialog({left:0,top:62,right:320,bottom:780,width:320,height:718});
 const hidden=typographyGeometry({left:20,top:-24,right:80,bottom:-4,width:60,height:20},{parent});
 const offscreen=executeTypography([hidden],parent);assert.equal(offscreen.rows.length,0);assert.equal(offscreen.skipped[0].reason,'outside-visible-vertical-scroll-region');
 const visible=typographyGeometry({left:20,top:100,right:100,bottom:120,width:80,height:20},{parent});const sample=executeTypography([hidden,visible],parent);assert.equal(sample.rows.length,1);assert.equal(sample.rows[0].fits,true);assert.doesNotThrow(()=>assertSettledTypography(sample,{id:'detail/sample',after:{snapshotCompletedAt:0}},{width:320,height:780}));
 const horizontal=typographyGeometry({left:-10,top:100,right:100,bottom:120,width:110,height:20},{parent});const clipped=executeTypography([horizontal],parent);assert.equal(clipped.rows.length,1);assert.equal(clipped.rows[0].fits,false);assert.throws(()=>assertSettledTypography(clipped,{id:'detail/sample',after:{snapshotCompletedAt:0}},{width:320,height:780}));
});
test('actual phone sampler limits nested Rename samples to active modal leaves',()=>{
 const outer=scrollDialog({left:0,top:62,right:320,bottom:780,width:320,height:718}),inner=scrollDialog({left:16,top:100,right:304,bottom:600,width:288,height:500});
 const background=typographyGeometry({left:20,top:100,right:100,bottom:120,width:80,height:20},{parent:outer}),label=typographyGeometry({left:36,top:140,right:250,bottom:160,width:214,height:20},{parent:inner,fontSize:'16px',selector:'#menu-rename label'});
 const sample=executeTypography([background,label],inner);assert.equal(sample.rows.length,1);assert.equal(sample.rows[0].selector,'#menu-rename label');assert(sample.skipped.some(s=>s.reason==='outside-active-native-modal'));assert.doesNotThrow(()=>assertSettledTypography(sample,{id:'detail/sample',after:{snapshotCompletedAt:0}},{width:320,height:780}));
});
