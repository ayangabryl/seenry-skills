import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';
import {FrameArchive,finalizeCase,finalizeDiagnosticReport,SOURCE_PINS,cadence,naturalCoverage,ownedProgressedTransform,pngDimensions,sha256} from './dialog-lossless-core.mjs';
import {atNaturalOwnedTransformProgress} from './dialog-lossless-progress.mjs';
const main=await readFile(new URL('./transitions-library-dialog-lossless.browser.mjs',import.meta.url),'utf8');
const core=await readFile(new URL('./dialog-lossless-core.mjs',import.meta.url),'utf8');
const progress=await readFile(new URL('./dialog-lossless-progress.mjs',import.meta.url),'utf8');
const active=()=>({open:true,modal:true,inert:false,expanded:'true',reduce:false,animations:[{id:1,target:'dialog-1',targetRelationship:'surface',pseudo:null,properties:['transform'],playState:'running',pending:false,currentTime:30,duration:220,endTime:220,progress:.13,endTransform:'none'}]});
const exit=()=>{const s=active();Object.assign(s,{inert:true,expanded:'false'});Object.assign(s.animations[0],{id:2,duration:120,endTime:120,progress:.25,endTransform:'scale(.97)'});return s;};
const natural=()=>({reversalTrusted:true,entryOwnerIds:[1],exitOwnerIds:[2],actions:[{kind:'before-API-close',state:active()},{kind:'before-API-reopen',state:exit()}]});
test('natural coverage requires both positively progressed owned native windows',()=>assert.equal(naturalCoverage(natural()).status,'observed-positive-progress-both-windows'));
for(const [name,patch] of [['pending',{pending:true}],['missing pending',{pending:undefined}],['time-zero',{currentTime:0}],['null-time',{currentTime:null}],['late',{currentTime:220}],['finished',{playState:'finished'}],['paused',{playState:'paused'}],['unknown owner',{id:999}],['child',{targetRelationship:'descendant'}],['backdrop',{pseudo:'::backdrop'}],['opacity only',{properties:['opacity']}],['zero progress',{progress:0}],['completed progress',{progress:1}],['unknown progress',{progress:null}],['infinite duration',{duration:Infinity}],['wrong endpoint',{endTransform:'scale(.97)'}]])test('entry rejects '+name,()=>{const s=active();Object.assign(s.animations[0],patch);assert.equal(ownedProgressedTransform(s,[1]),false);const n=natural();n.actions[0].state=s;assert.equal(naturalCoverage(n).status,'blocked-natural-windows');});
for(const value of ['scale(.97)','scale(.97,.97)','matrix(.97,0,0,.97,0,0)'])test('exit recognizes exact native equivalent '+value,()=>{const s=exit();s.animations[0].endTransform=value;assert(ownedProgressedTransform(s,[2],true));});
test('untrusted open never claims natural coverage',()=>{const n=natural();n.reversalTrusted=false;assert.equal(naturalCoverage(n).status,'blocked-natural-windows');});
test('native timestamp cadence uses only its own seconds, including invalidity',()=>{
 const rows=[10,10.02,10.04].map(timestamp=>({metadata:{timestamp}}));assert(Math.abs(cadence(rows,'timestamp').observedMeanReceivedFps-50)<1e-8);assert.equal(cadence(rows,'monotonicTimestamp').observedMeanReceivedFps,null);
 for(const values of [[10,10],[10,9],[10,null]])assert.equal(cadence(values.map(timestamp=>({metadata:{timestamp}})),'timestamp').validSequence,false);
});
// Complete tiny PNG, not a screenshot replacement; dimensions only are inspected by archive.
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zl1sAAAAASUVORK5CYII=','base64');
const event=(timestamp=1)=>({sessionId:7,metadata:{timestamp,offsetTop:0,pageScaleFactor:1,deviceWidth:1,deviceHeight:1,scrollOffsetX:0,scrollOffsetY:0},data:png.toString('base64')});
class FakeCDP extends EventEmitter {calls=[];async send(name,params){this.calls.push({name,params});if(this.reject===name)throw Error('injected '+name);return {};}}
async function archiveCase(options,work){const out=await mkdtemp(join(tmpdir(),'seenry-lossless-unit-'));const session=new FakeCDP();const a=new FrameArchive({session,out,width:1,height:1,...options});try{await a.start();await work(a,session,out);}finally{await a.stop();await rm(out,{recursive:true,force:true});}}
test('PNG validation rejects non-PNG and retains declared dimensions',()=>{assert.deepEqual(pngDimensions(png),{width:1,height:1});assert.throws(()=>pngDimensions(Buffer.from('JPEG')));});
test('actual archive stores exact bytes/full metadata and acknowledges every frame',async()=>archiveCase({},async(a,s,out)=>{
 s.emit('Page.screencastFrame',event(1));s.emit('Page.screencastFrame',event(1.02));const result=await a.finish();assert(result.allReceivedEventsStored);assert.equal(result.stored,2);assert.equal(result.bytes,2*png.length);
 assert.deepEqual(await readFile(join(out,'frames/000001.png')),png);assert.equal(a.rows[0].sha256,sha256(png));assert.deepEqual(a.rows[0].metadata,event().metadata);assert(a.rows[0].host.ackRequest.monotonicMs<=a.rows[0].host.handlerSyncEnd.monotonicMs);assert(a.rows[0].host.writeCompleted);assert(a.rows[0].host.ackAcknowledged);assert.equal(s.calls.filter(c=>c.name==='Page.screencastFrameAck').length,2);assert.deepEqual(s.calls[0],{name:'Page.startScreencast',params:{format:'png',everyNthFrame:1,maxWidth:1,maxHeight:1}});
}));
test('frame cap is explicit incomplete evidence, no silent dropping or overwrite',async()=>archiveCase({maxFrames:1},async(a,s)=>{
 s.emit('Page.screencastFrame',event(1));s.emit('Page.screencastFrame',event(1.02));const r=await a.finish();assert.equal(r.allReceivedEventsStored,false);assert.equal(r.omitted,1);assert.equal(a.rows[1].omission,'frame-cap');assert.equal(r.stopRequested.reason,'frame-cap');assert.equal(s.calls.filter(c=>c.name==='Page.screencastFrameAck').length,2);
}));
test('byte cap records omission and stops',async()=>archiveCase({maxBytes:1},async(a,s)=>{s.emit('Page.screencastFrame',event());const r=await a.finish();assert.equal(r.allReceivedEventsStored,false);assert.equal(r.stopRequested.reason,'byte-cap');assert.equal(r.bytes,0);}));
test('bad PNG is captured as raw error and makes transport incomplete',async()=>archiveCase({},async(a,s)=>{s.emit('Page.screencastFrame',{...event(),data:Buffer.from('not a PNG').toString('base64')});const r=await a.finish();assert.equal(r.allReceivedEventsStored,false);assert(a.rows[0].error.includes('Invalid PNG'));}));
test('write error retained and never accepted as recording completion',async()=>archiveCase({write:async(file,...rest)=>{if(file.endsWith('.png'))throw Error('disk full model');const {writeFile}=await import('node:fs/promises');return writeFile(file,...rest);}},async(a,s)=>{s.emit('Page.screencastFrame',event());const r=await a.finish();assert.equal(r.allReceivedEventsStored,false);assert(a.rows[0].writeError.includes('disk full'));}));
test('ACK error retained and stops transport',async()=>archiveCase({},async(a,s)=>{s.reject='Page.screencastFrameAck';s.emit('Page.screencastFrame',event());const r=await a.finish();assert.equal(r.allReceivedEventsStored,false);assert(a.rows[0].ackError.includes('injected'));}));
test('write queue cap is explicit; no infinite queue',async()=>archiveCase({maxPending:0},async(a,s)=>{s.emit('Page.screencastFrame',event());const r=await a.finish();assert.equal(r.stopRequested.reason,'pending-write-cap');assert.equal(r.omitted,1);}));
test('no frames cannot masquerade as completed recording',async()=>archiveCase({},async a=>{const r=await a.finish();assert.equal(r.allReceivedEventsStored,false);assert.equal(r.received,0);}));
async function runProgress({pending=false,currentTime=30,progress=.2,finished=false,staleDuringSnapshot=false,absent=false,snapshotError=false,actionError=false,expected='entry'}={}){
 let now=0,acted=0,snapshots=0;const timers=new Map();let id=0;
 const surface={open:true,inert:expected==='exit',matches:()=>true,getAnimations:()=>absent?[]:[animation]};
 const animation={playState:finished?'finished':'running',pending,currentTime,effect:{target:surface,pseudoElement:null,getComputedTiming:()=>({duration:120,endTime:120,progress}),getKeyframes:()=>[{transform:'scale(.98)'},{transform:expected==='exit'?'scale(.97)':'none'}]}};
 const context={performance:{now:()=>now},matchMedia:()=>({matches:false}),requestAnimationFrame:cb=>{const ticket=++id;timers.set(ticket,true);queueMicrotask(()=>{if(timers.has(ticket)){now+=16;cb(now);}});return ticket;},cancelAnimationFrame:i=>timers.delete(i),setTimeout:()=>++id,clearTimeout:()=>{}};
 const fn=vm.runInNewContext('('+atNaturalOwnedTransformProgress.toString()+')',context);
 const result=await fn(surface,[animation],()=>{acted++;if(actionError)throw Error('injected action error');},{label:'model',expected,maxFrames:3,snapshot:()=>{snapshots++;if(snapshotError)throw Error('injected snapshot error');if(staleDuringSnapshot){animation.currentTime=120;progress=1;}return {at:now};}});return {result,acted,snapshots};
}
test('page helper acts in same positively progressed callback, recording actual elapsed',async()=>{const {result,acted}=await runProgress();assert.equal(result.status,'observed');assert.equal(acted,1);assert.equal(result.actualElapsedMs,16);assert(result.qualifiedOwnedJobs[0].qualifies);});
test('page helper supports positively progressed owned exit',async()=>{const {result}=await runProgress({expected:'exit'});assert.equal(result.status,'observed');});
for(const [name,args] of [['pending',{pending:true}],['zero',{currentTime:0,progress:0}],['late',{currentTime:120,progress:1}],['finished',{finished:true}],['not live',{absent:true}],['snapshot consumed remaining window',{staleDuringSnapshot:true}]])test('page helper does not act on '+name,async()=>{const {result,acted}=await runProgress(args);assert.equal(result.status,'blocked');assert.equal(acted,0);});
test('page helper preserves observer failure without acting',async()=>{const {result,acted}=await runProgress({snapshotError:true});assert.equal(result.status,'observer-error');assert.equal(acted,0);assert.match(result.error,/injected snapshot/);});
test('page helper preserves action failure separately',async()=>{const {result,acted}=await runProgress({actionError:true});assert.equal(result.status,'action-error');assert.equal(acted,1);assert.match(result.error,/injected action/);});
test('CI guard refuses a local run before importing or launching browser',()=>{const r=spawnSync(process.execPath,[new URL('./transitions-library-dialog-lossless.browser.mjs',import.meta.url).pathname],{env:{...process.env,GITHUB_ACTIONS:'false',CI:'false'},encoding:'utf8'});assert.notEqual(r.status,0);assert.match(r.stderr,/existing authorized GitHub Actions/);});
test('source contract excludes mutation, time control, synthetic control dispatch, video codec and fake fps',()=>{
 for(const source of [main.replaceAll('archive.finish(', 'archive.drain('),progress])for(const forbidden of [/\.pause\s*\(/,/\.finish\s*\(/,/\.currentTime\s*=/,/\.updatePlaybackRate\s*\(/,/\.style\s*[.=]/,/\.setAttribute\s*\(/,/\.dispatchEvent\s*\(/,/\.addStyleTag\s*\(/,/\.setContent\s*\(/])assert(!forbidden.test(source),String(forbidden));
 assert(!/recordVideo\s*:|frameRate\s*:|fps\s*:/.test(main+core));assert.match(main,/for\(const mode of \['baseline-before','png-capture','baseline-after'\]/);assert.match(main,/run\.naturalInterruption=naturalCoverage/);assert.match(main,/run\.progressGated=/);assert.match(main,/archive\.finish\(\)/);assert.match(main,/animations:'allow'/);
 assert.match(core,/format:'png',everyNthFrame:1/);assert.match(core,/allReceivedEventsStored/);assert.match(core,/sourceFrameCompleteness:'unverified/);assert.match(core,/ackPromise=ack\(\)/);
});
test('exact four product assets pinned, runtime report includes checkout and harness provenance',()=>{assert.equal(Object.keys(SOURCE_PINS).length,4);assert.equal(SOURCE_PINS['seenry-transitions.js'].slice(0,8),'b7124d8c');assert.match(main,/git',\['rev-parse','HEAD'\]/);assert.match(main,/Source drift/);assert.match(main,/report\.harness=/);});

// Exercise the exact async finalizers imported and called by the browser runner.
const observedRun=(mode='baseline-before')=>({mode,status:'scenario-observed',pageErrors:[],consoleErrors:[],consoleWarnings:[],observations:{actions:[{kind:'retained-partial-action',state:{at:12}}]},lifecycle:{status:'observed-at-action-snapshots'},progressGated:{actions:[]},...(mode==='png-capture'?{recording:{allReceivedEventsStored:true,retainedMetadata:'unchanged'},finalStill:{file:'final.png'}}:{})});
const observedReport=()=>({status:'finalizing',errors:[],runs:['baseline-before','png-capture','baseline-after'].map(mode=>({...observedRun(mode),contextClosed:true}))});
const cleanFinalization={browser:{async close(){}},verifySource:()=>{}};
test('actual case finalizer includes page errors delivered while awaiting context closure',async()=>{
 const run=observedRun();const partial=run.observations;
 await finalizeCase(run,{async close(){await Promise.resolve();run.pageErrors.push('late page exception');}});
 assert.equal(run.status,'failed');assert(run.finalization.reasons.includes('page-errors'));assert.equal(run.observations,partial);assert.equal(run.contextClosed,true);
});
test('actual case finalizer includes console errors delivered during closure',async()=>{
 const run=observedRun();await finalizeCase(run,{async close(){run.consoleErrors.push('late console.error');}});assert.equal(run.status,'failed');assert(run.finalization.reasons.includes('console-errors'));assert.match(run.finalization.consoleErrorPolicy,/any console.error fails/);
});
test('console warnings remain recorded observations and do not fail',async()=>{
 const run=observedRun();await finalizeCase(run,{async close(){run.consoleWarnings.push('observed warning');}});assert.equal(run.status,'scenario-observed');assert.deepEqual(run.consoleWarnings,['observed warning']);
});
test('actual case finalizer fails a rejected context.close with raw error',async()=>{
 const run=observedRun();await finalizeCase(run,{async close(){throw Error('injected context close rejection');}});assert.equal(run.status,'failed');assert.equal(run.contextClosed,false);assert.match(run.contextCloseError,/injected context close rejection/);assert(run.finalization.reasons.includes('contextCloseError'));
});
test('case finalization preserves original action/recording failure and partial observations',async()=>{
 const run=observedRun('png-capture');Object.assign(run,{status:'failed',error:'original action stack',recordingError:'original recording stack',observationRecoveryError:'later observation retrieval failed'});run.recording={allReceivedEventsStored:false,received:4,stored:2,errors:[{kind:'disk-error',error:'original disk stack'}]};const observations=run.observations,recording=run.recording;
 await finalizeCase(run,{async close(){throw Error('additional context close rejection');}});
 assert.equal(run.status,'failed');assert.equal(run.error,'original action stack');assert.equal(run.recordingError,'original recording stack');assert.equal(run.observations,observations);assert.equal(run.recording,recording);assert.equal(run.observationRecoveryError,'later observation retrieval failed');assert.match(run.contextCloseError,/additional context/);
});
test('actual report finalizer waits for browser close and source verification before exit0',async()=>{
 const report=observedReport(),order=[];const code=await finalizeDiagnosticReport(report,{browser:{async close(){order.push('close-start');await Promise.resolve();order.push('close-done');}},verifySource:()=>{order.push('source-check');assert.equal(report.status,'finalizing');}});
 assert.equal(code,0);assert.equal(report.status,'diagnostic-recorded');assert.equal(report.finalization.exitCode,0);assert.deepEqual(order,['close-start','close-done','source-check']);
});
test('actual report finalizer makes browser.close rejection incomplete/exit1',async()=>{
 const report=observedReport();const code=await finalizeDiagnosticReport(report,{browser:{async close(){throw Error('injected browser close rejection');}},verifySource:()=>{}});
 assert.equal(code,1);assert.equal(report.status,'diagnostic-incomplete');assert.equal(report.finalization.exitCode,1);assert.equal(report.browserClosed,false);assert(report.errors.some(e=>e.kind==='browser-close'&&e.error.includes('injected browser close rejection')));
});
test('report finalizer reconciles a page error arriving even during browser.close',async()=>{
 const report=observedReport();const code=await finalizeDiagnosticReport(report,{browser:{async close(){report.runs[1].pageErrors.push('browser-close late pageerror');}},verifySource:()=>{}});
 assert.equal(code,1);assert.equal(report.runs[1].status,'failed');assert.equal(report.status,'diagnostic-incomplete');
});
test('report finalizer preserves original failed status/errors and partial run data',async()=>{
 const report=observedReport();report.status='failed';report.errors.push({kind:'original',error:'original top-level stack'});report.runs[0].status='failed';report.runs[0].error='original action stack';const partial=report.runs[0].observations;
 const code=await finalizeDiagnosticReport(report,{browser:{async close(){throw Error('later browser close failure');}},verifySource:()=>{}});
 assert.equal(code,1);assert.equal(report.status,'failed');assert.equal(report.errors[0].error,'original top-level stack');assert.equal(report.runs[0].error,'original action stack');assert.equal(report.runs[0].observations,partial);assert.equal(report.errors.length,2);
});
test('post-browser source verification failure cannot return exit0',async()=>{
 const report=observedReport();const code=await finalizeDiagnosticReport(report,{browser:{async close(){}},verifySource:()=>{throw Error('source drift model');}});assert.equal(code,1);assert.equal(report.status,'diagnostic-incomplete');assert.equal(report.sourceReverified,false);assert(report.errors.some(e=>e.kind==='post-run-source-check'));
});
test('missing final PNG fails even with complete frame storage',async()=>{
 const run=observedRun('png-capture');delete run.finalStill;await finalizeCase(run,{async close(){}});assert.equal(run.status,'failed');assert(run.finalization.reasons.includes('missing-final-still'));
});
test('runner calls tested finalizers in cleanup order and uses their final exit code',()=>{
 const caseFinally=main.slice(main.indexOf('if(archive)try{run.recording=await archive.finish();'),main.indexOf('report.observerComparison='));
 assert(caseFinally.indexOf('await finalizeCase(run,context)')>caseFinally.indexOf('await page.screenshot('));
 assert.match(main,/process\.exitCode=await finalizeDiagnosticReport\(report,/);assert(!main.includes("report.status=report.runs.length===3"));assert(!main.includes("if(report.status!=='diagnostic-recorded')process.exitCode=1"));assert.match(main,/run\.observationRecoveryError=readError\.stack/);
});
