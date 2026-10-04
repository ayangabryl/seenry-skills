// Bounded Menu collection mechanics. No browser launch, product mutation or timing tolerance.
import assert from 'node:assert/strict';

export const EVENT_BUFFER_LIMIT=800;
export const RAPID_MENU_GROUPS=[
 ['entry-progress-open','entry-progress-close','exit-progress-reopen'],
 ['takeover-progress-open','keyboard-takeover'],
 ['close-mid-open','close-mid-action']
];
export function createMenuSaveGate(write){
 const deferred=new Set();return {save:run=>{if(!deferred.has(run))return write(run);},setDeferred:(run,value)=>{if(value)deferred.add(run);else deferred.delete(run);}};
}
export function menuCollectionGroups(steps){
 const groups=[];
 for(let i=0;i<steps.length;i++){
  const rapid=RAPID_MENU_GROUPS.find(ids=>ids[0]===steps[i].id);
  if(!rapid){groups.push([steps[i]]);continue;}
  const group=steps.slice(i,i+rapid.length);assert.deepEqual(group.map(s=>s.id),rapid,'Declared rapid Menu group changed');
  groups.push(group);i+=rapid.length-1;
 }
 return groups;
}
export async function observeMinimumDuration(durationMs,{now=()=>performance.now(),sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms)),check=()=>{}}={}){
 assert(Number.isFinite(durationMs)&&durationMs>=0);const started=now();assert(Number.isFinite(started),'Observation clock must be finite');let elapsed=0,previous=started;
 for(;;){const current=now();assert(Number.isFinite(current)&&current>=previous,'Observation clock must be finite and monotonic');previous=current;elapsed=current-started;if(elapsed>=durationMs)break;check();await sleep(durationMs-elapsed);}
 check();return elapsed;
}
export function assertEventChunk(chunk,after=0){
 assert(chunk&&chunk.dropped===0&&Array.isArray(chunk.events)&&chunk.events.length<=EVENT_BUFFER_LIMIT,'Native event buffer missing or overflowed');
 assert.equal(chunk.acknowledgedThrough,after,'Event checkpoint acknowledgement differs from host history');
 assert.equal(chunk.nextEventId,after+chunk.events.length,'Native event checkpoint is not contiguous');
 chunk.events.forEach((event,i)=>assert.equal(event.eventId,after+i+1,'Missing/duplicate/out-of-order native event'));
 return chunk.nextEventId;
}
export async function checkpointMenuEvents(run,label,{peek,persist,acknowledge,maxBatches}){
 assert(Number.isInteger(maxBatches)&&maxBatches>0,'Declared native event batch bound must be a finite positive integer');
 run.eventBatches??=[];
 assert(run.eventBatches.length<maxBatches,'Declared native event batch bound exceeded');
 assert(run.eventBatches.every(b=>b.status==='acknowledged'),'Earlier event checkpoint was not acknowledged');
 const after=run.eventBatches.at(-1)?.throughEventId??0,chunk=await peek(),through=assertEventChunk(chunk,after);
 const batch={index:run.eventBatches.length,label,afterEventId:after,throughEventId:through,events:chunk.events,dropped:chunk.dropped,status:'saved-before-acknowledgment'};
 run.eventBatches.push(batch);
 // A failed write leaves the browser buffer untouched. Do not acknowledge first.
 await persist();
 const ack=await acknowledge({afterEventId:after,throughEventId:through,count:chunk.events.length});
 assert(ack&&ack.acknowledgedThrough===through&&ack.removed===chunk.events.length,'Native event checkpoint acknowledgement failed');
 batch.acknowledgment=ack;batch.status='acknowledged';await persist();return batch;
}
export function reconcileMenuEvents(batches,inventory,maxBatches){
 assert(Number.isInteger(maxBatches)&&maxBatches>0,'Declared native event batch bound must be a finite positive integer');
 assert(Array.isArray(batches)&&batches.length<=maxBatches,'Native event batch inventory missing/exceeds declared bound');
 const events=[];let after=0;
 for(const [index,b] of batches.entries()){
  assert(b.index===index&&typeof b.label==='string'&&b.status==='acknowledged','Uncommitted or unordered event checkpoint');
  const through=assertEventChunk({events:b.events,dropped:b.dropped,acknowledgedThrough:b.afterEventId,nextEventId:b.throughEventId},after);
  assert(b.acknowledgment?.acknowledgedThrough===through&&b.acknowledgment.removed===b.events.length,'Event checkpoint acknowledgement evidence missing');
  events.push(...b.events);after=through;
 }
 assertEventChunk(inventory,after);events.push(...inventory.events);return events;
}
// Only the three enumerated rapid groups use this gate. The caller declares and
// durably persists every stub before entry; heavy host writes stay outside it.
export async function collectMenuRapidGroup(group,{declare,persist,setDeferred,collect,recover,checkpoint}){
 assert(RAPID_MENU_GROUPS.some(ids=>JSON.stringify(ids)===JSON.stringify(group.map(s=>s.id))),'Unknown rapid Menu group');
 await declare(group);await persist();setDeferred(true);
 let failure;
 try{for(const step of group)await collect(step);}
 catch(error){failure=error;try{await recover(error);}catch(recoveryError){error.recoveryError=recoveryError;}}
 finally{
  setDeferred(false);
  for(const operation of [persist,checkpoint])try{await operation();}catch(error){if(failure)(failure.finalizationErrors??=[]).push(error);else failure=error;}
 }
 if(failure)throw failure;
}
