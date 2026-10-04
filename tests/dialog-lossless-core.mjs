// Pure helpers and an injected CDP archive. Importing this file never starts a browser.
import {mkdir, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
export const PRODUCT_BASELINE = '53c56304749ecb84eea8d6a9b18d146cf25d6ed7';
export const SOURCE_PINS = Object.freeze({
 'gallery.html':'39551a459e9d12a60c7478e0c140c6fb3fa7d1ad03112056c021ed5f4bd41ff6',
 'gallery.js':'c18397f5d7cb07cb9b7df9b86e34196a5e2f8ade7c32b1766173df02d6b18763',
 'seenry-transitions.js':'b7124d8c148a5b0d42a09b03c815b17a26be603d4c76f6f6ef487fb6f7ce3025',
 'seenry-transitions.css':'f406e5bc49f5fa7f991336c8c433386f4f19597100ed8b8b93dd0ccc35c7cf4f'
});
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
export const hostClock = () => ({monotonicMs:performance.now(),epochMs:Date.now()});
export function statistics(values) {
 const a=values.filter(Number.isFinite).sort((a,b)=>a-b);
 const q=p=>a.length?a[Math.ceil((a.length-1)*p)]:null;
 return {count:a.length,min:a[0]??null,median:q(.5),p95:q(.95),max:a.at(-1)??null,mean:a.length?a.reduce((x,y)=>x+y,0)/a.length:null};
}
export function cadence(rows, field) {
 const values=rows.map(r=>r.metadata?.[field]);
 const missing=values.filter(x=>!Number.isFinite(x)).length;
 const deltas=values.slice(1).map((x,i)=>(x-values[i])*1000);
 const valid=values.length>1&&!missing&&deltas.every(x=>x>0);
 return {field,units:'seconds in native CDP clock',receivedEvents:values.length,missing,nonIncreasing:deltas.filter(x=>Number.isFinite(x)&&x<=0).length,validSequence:valid,intervalMs:statistics(deltas.filter(x=>x>0)),observedMeanReceivedFps:valid?(values.length-1)/(values.at(-1)-values[0]):null,qualification:'Received-frame cadence only; includes idle periods. Not display refresh rate, guaranteed 60fps, or proof of no upstream loss.'};
}
export function isExitScale(value) {
 if(typeof value!=='string')return false;
 const m=/^(scale|matrix)\(([^()]*)\)$/.exec(value.trim());if(!m)return false;
 const tokens=m[2].split(',').map(s=>s.trim()),numeric=/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i;
 if(!tokens.length||tokens.some(s=>!numeric.test(s)))return false;
 const nums=tokens.map(Number),near=(a,b)=>Number.isFinite(a)&&Math.abs(a-b)<1e-8;
 return m[1]==='scale'?(nums.length===1||nums.length===2)&&nums.every(n=>near(n,.97)):nums.length===6&&nums.every((n,i)=>near(n,[.97,0,0,.97,0,0][i]));
}
export function ownedProgressedTransform(state, ownerIds, exit=false) {
 return !!state&&state.open===true&&state.modal===true&&state.reduce===false&&
   (exit?state.inert===true&&state.expanded==='false':state.inert===false&&state.expanded==='true')&&
   Array.isArray(ownerIds)&&state.animations?.some(a=>ownerIds.includes(a.id)&&a.target==='dialog-1'&&a.targetRelationship==='surface'&&a.pseudo===null&&a.properties?.includes('transform')&&a.playState==='running'&&a.pending===false&&Number.isFinite(a.currentTime)&&a.currentTime>0&&Number.isFinite(a.duration)&&a.duration>0&&Number.isFinite(a.endTime)&&a.currentTime<a.endTime&&Number.isFinite(a.progress)&&a.progress>0&&a.progress<1&&(exit?isExitScale(a.endTransform):a.endTransform==='none'))===true;
}
export function naturalCoverage(log) {
 const get=k=>log.actions?.find(a=>a.kind===k)?.state;
 const entry=ownedProgressedTransform(get('before-API-close'),log.entryOwnerIds),exit=ownedProgressedTransform(get('before-API-reopen'),log.exitOwnerIds,true);
 return {status:log.reversalTrusted===true&&entry&&exit?'observed-positive-progress-both-windows':'blocked-natural-windows',openingInterrupted:entry,exitInterrupted:exit,trustedOpening:log.reversalTrusted===true,reason:'Both native owned surface-transform jobs must be running, nonpending, with finite positive currentTime and progress strictly before completion. No time-zero, late, pseudo-only or descendant substitutions.'};
}
export function pngDimensions(buffer) {
 if(buffer.length<24||!buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))||buffer.toString('ascii',12,16)!=='IHDR')throw Error('Invalid PNG signature/IHDR');
 return {width:buffer.readUInt32BE(16),height:buffer.readUInt32BE(20)};
}
export class FrameArchive {
 constructor({session,out,width,height,maxFrames=600,maxBytes=96*1024*1024,maxPending=8,maxMs=15000,clock=hostClock,write=writeFile}) {
  Object.assign(this,{session,out,width,height,maxFrames,maxBytes,maxPending,maxMs,clock,write});
  this.rows=[];this.errors=[];this.errorOverflow=0;this.visibility=[];this.visibilityOverflow=0;this.pending=new Set();this.bytes=0;this.received=0;this.omitted=0;this.metadataOverflow=0;this.stopRequested=null;this.stopped=null;this.closed=false;
  this.onFrame=event=>this.accept(event);this.onVisibility=event=>{if(this.visibility.length<64)this.visibility.push({event,host:this.clock()});else this.visibilityOverflow++;};
 }
 error(kind,error) {if(this.errors.length<64)this.errors.push({kind,host:this.clock(),error:error?.stack||String(error)});else this.errorOverflow++;}
 async start() {
  await mkdir(join(this.out,'frames'),{recursive:true});
  this.session.on('Page.screencastFrame',this.onFrame);this.session.on('Page.screencastVisibilityChanged',this.onVisibility);
  this.startRequest=this.clock();
  // Common stable CDP parameters only. No guessed frameRate or new optional controls.
  this.parameters={format:'png',everyNthFrame:1,maxWidth:this.width,maxHeight:this.height};
  try {await this.session.send('Page.startScreencast',this.parameters);this.startAcknowledged=this.clock();}
  catch(e){this.error('startScreencast',e);await this.stop('start-error');throw e;}
  this.timer=setTimeout(()=>{this.error('capture-time-cap','Screencast exceeded maximum duration');void this.stop('capture-time-cap');},this.maxMs);
 }
 accept(event) {
  const receive=this.clock();this.received++;
  const row={index:this.received,sessionId:event.sessionId,metadata:event.metadata,host:{receive},stored:false};
  // Keep bounded metadata even if a broken backend continues after Stop. Never call that complete.
  if(this.rows.length<this.maxFrames+32)this.rows.push(row);else this.metadataOverflow++;
  const ack=async()=>{row.host.ackRequest=this.clock();try{await this.session.send('Page.screencastFrameAck',{sessionId:event.sessionId});row.host.ackAcknowledged=this.clock();}catch(e){row.ackError=e.stack||String(e);this.error('frame-ack',e);void this.stop('ack-error');}};
  const ackPromise=ack(); // Release protocol backpressure before decoding/hash/disk work.
  let buffer,reason;
  try {
   const predicted=Math.floor(event.data.length*3/4);
   if(this.rows.length>this.maxFrames||this.metadataOverflow)reason='frame-cap';
   else if(this.bytes+predicted>this.maxBytes)reason='byte-cap';
   else if(this.pending.size>=this.maxPending)reason='pending-write-cap';
   else if(this.closed)reason='frame-after-detach-boundary';
   else {
    buffer=Buffer.from(event.data,'base64');row.bytes=buffer.length;row.dimensions=pngDimensions(buffer);
    if(row.dimensions.width!==this.width||row.dimensions.height!==this.height)throw Error('PNG dimensions do not match full DPR1 viewport');
    row.sha256=sha256(buffer);row.file=`frames/${String(row.index).padStart(6,'0')}.png`;this.bytes+=buffer.length;
   }
  } catch(e){reason='invalid-frame';row.error=e.stack||String(e);this.error(reason,e);}
  if(reason){buffer=undefined;this.omitted++;row.omission=reason;row.base64Length=event.data?.length??null;this.error('incomplete-capture',reason);void this.stop(reason);}
  row.host.handlerSyncEnd=this.clock();
  const operation=(async()=>{
   if(buffer){row.host.writeRequest=this.clock();try{await this.write(join(this.out,row.file),buffer,{flag:'wx'});row.host.writeCompleted=this.clock();row.stored=true;}catch(e){row.writeError=e.stack||String(e);this.error('frame-write',e);void this.stop('write-error');}}
   await ackPromise;
   row.host.completed=this.clock();
   if(!this.metadataOverflow)try{await this.write(join(this.out,'frames',String(row.index).padStart(6,'0')+'.json'),JSON.stringify(row,null,2)+'\n',{flag:'wx'});}catch(e){this.error('metadata-write',e);void this.stop('metadata-write-error');}
  })();
  this.pending.add(operation);operation.finally(()=>this.pending.delete(operation));
 }
 stop(reason='scenario-complete') {
  if(this.stopPromise)return this.stopPromise;
  clearTimeout(this.timer);this.stopRequested={reason,host:this.clock()};
  this.stopPromise=(async()=>{try{await this.session.send('Page.stopScreencast');this.stopped=this.clock();}catch(e){this.error('stopScreencast',e);}})();
  return this.stopPromise;
 }
 async finish() {
  await this.stop();
  // Stop response is not assumed to drain queued encoded frames; retain a bounded grace window.
  await new Promise(r=>setTimeout(r,250));
  this.session.off('Page.screencastFrame',this.onFrame);this.session.off('Page.screencastVisibilityChanged',this.onVisibility);this.closed=true;this.detached=this.clock();
  await Promise.allSettled([...this.pending]);
  const report=this.summary();await this.write(join(this.out,'frames.json'),JSON.stringify({report,frames:this.rows},null,2)+'\n');return report;
 }
 summary() {
  const durations=(a,b)=>statistics(this.rows.map(r=>r.host[b]?.monotonicMs-r.host[a]?.monotonicMs));
  return {parameters:this.parameters,limits:{maxFrames:this.maxFrames,maxBytes:this.maxBytes,maxPending:this.maxPending,maxMs:this.maxMs},received:this.received,stored:this.rows.filter(r=>r.stored).length,omitted:this.omitted,metadataOverflow:this.metadataOverflow,bytes:this.bytes,
   allReceivedEventsStored:!!this.stopped&&this.received>1&&this.rows.every(r=>r.stored&&r.host.ackAcknowledged)&&!this.errors.length&&!this.omitted&&!this.metadataOverflow&&!this.errorOverflow&&!this.visibilityOverflow,
   sourceFrameCompleteness:'unverified: CDP can suppress, skip or fail to encode frames before delivering them; everyNthFrame:1 is not a completeness guarantee',
   qualityVerdict:'not-scored',clockAlignment:'not calibrated; do not align browser performance.now or host clocks with CDP timestamp',startRequest:this.startRequest,startAcknowledged:this.startAcknowledged,stopRequested:this.stopRequested,stopped:this.stopped,listenerDetached:this.detached,
   nativeEpochCadence:cadence(this.rows,'timestamp'),nativeMonotonicCadence:cadence(this.rows,'monotonicTimestamp'),
   observerCostHostMs:{synchronousHandler:durations('receive','handlerSyncEnd'),receiveToAckRequest:durations('receive','ackRequest'),ackRoundTrip:durations('ackRequest','ackAcknowledged'),writeLatency:durations('writeRequest','writeCompleted'),receiveToCompleted:durations('receive','completed')},visibility:this.visibility,visibilityOverflow:this.visibilityOverflow,errors:this.errors,errorOverflow:this.errorOverflow};
 }
}

// Reconcile only after asynchronous cleanup. Never overwrite original evidence/errors.
export function reconcileCaseErrors(run) {
 const reasons=[];
 if(run.status==='failed')reasons.push('prior-case-failure');
 else if(run.status!=='scenario-observed')reasons.push('scenario-not-completed');
 for(const field of ['error','recordingError','finalStillError','contextCloseError','observationRecoveryError'])if(run[field])reasons.push(field);
 if(run.pageErrors?.length)reasons.push('page-errors');
 // All console.error messages fail, including resource errors; no silent allow-list.
 if(run.consoleErrors?.length)reasons.push('console-errors');
 if(run.observations?.readError)reasons.push('observation-read-error');
 if(run.observations?.progressError||run.progressGated?.error)reasons.push('progress-observer-error');
 if(run.progressGated?.actions?.some(a=>a.status?.endsWith('-error')))reasons.push('progress-action-error');
 if(run.lifecycle?.status!=='observed-at-action-snapshots')reasons.push('lifecycle-not-observed');
 if(!run.observations)reasons.push('missing-observations');
 if(run.mode==='png-capture'){
  if(run.recording?.allReceivedEventsStored!==true)reasons.push('recording-incomplete');
  if(!run.finalStill)reasons.push('missing-final-still');
 }
 if(run.contextClosed!==true)reasons.push('context-not-closed');
 run.finalization={checkedAt:hostClock(),consoleErrorPolicy:'any console.error fails; warnings are observations only',reasons};
 run.status=reasons.length?'failed':'scenario-observed';
 return run.status;
}
export async function finalizeCase(run, context) {
 try{if(context){await context.close();run.contextClosed=true;}}
 catch(e){run.contextCloseError=e?.stack||String(e);run.contextClosed=false;}
 // pageerror/console events raised during context.close are now included.
 reconcileCaseErrors(run);run.finished=hostClock();return run.status;
}
export async function finalizeDiagnosticReport(report,{browser,verifySource}={}) {
 report.errors??=[];
 const record=(kind,e)=>report.errors.push({kind,host:hostClock(),error:e?.stack||String(e)});
 try{if(browser){await browser.close();report.browserClosed=true;}}
 catch(e){report.browserClosed=false;record('browser-close',e);}
 try{if(verifySource){await verifySource();report.sourceReverified=true;}}
 catch(e){report.sourceReverified=false;record('post-run-source-check',e);}
 // Reconcile again in case a queued event arrived during browser closure.
 for(const run of report.runs||[])reconcileCaseErrors(run);
 const priorFailure=['failed','diagnostic-incomplete','profile-deadline-exceeded','hard-deadline-exceeded'].includes(report.status);
 const modes=(report.runs||[]).map(r=>r.mode);
 const allCases=modes.length===3&&['baseline-before','png-capture','baseline-after'].every((m,i)=>modes[i]===m)&&(report.runs||[]).every(r=>r.status==='scenario-observed');
 const complete=!priorFailure&&allCases&&!report.errors.length&&report.browserClosed===true&&report.sourceReverified===true;
 report.finalization={checkedAt:hostClock(),priorFailure,allCases,consoleErrorPolicy:'any console.error fails; warnings are observations only',exitCode:complete?0:1};
 report.status=complete?'diagnostic-recorded':priorFailure?report.status:'diagnostic-incomplete';
 report.finished=hostClock();return report.finalization.exitCode;
}
