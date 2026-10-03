// Discovery evidence helpers. A complete trace is never an acceptance verdict.
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {join,dirname} from 'node:path';
export const sha256 = path => createHash('sha256').update(readFileSync(path)).digest('hex');
export function verifyPins(gallery, pins, harnessRoot) {
 const actual={assets:{},harness:{}};
 for(const [name,expected] of Object.entries(pins.assets)) {
  const hash=sha256(join(dirname(gallery),name)); actual.assets[name]=hash;
  if(hash!==expected) throw new Error(`SOURCE_PIN_MISMATCH ${name}: ${hash} != ${expected}`);
 }
 for(const [name,expected] of Object.entries(pins.harness)) {
  const hash=sha256(join(harnessRoot,name)); actual.harness[name]=hash;
  if(hash!==expected) throw new Error(`HARNESS_PIN_MISMATCH ${name}: ${hash} != ${expected}`);
 }
 return actual;
}
export function timingWindow(actualMs, minMs=0, maxMs=50) {
 return {actualMs,minMs,maxMs,status:Number.isFinite(actualMs)&&actualMs>=minMs&&actualMs<=maxMs?'observed-in-window':'blocked',reason:Number.isFinite(actualMs)&&actualMs>=minMs&&actualMs<=maxMs?null:'Intended observation window missed; neither a product failure nor a pass'};
}
export function finiteState(animations) {
 const finite=animations.filter(a=>a.iterations!==null&&Number.isFinite(a.iterations));
 return {running:finite.filter(a=>a.pending||a.playState==='running'),held:finite.filter(a=>a.playState==='finished'&&['forwards','both'].includes(a.fill)),unknown:animations.filter(a=>a.iterations===null)};
}
export function rectInside(inner,outer,tolerance=.5) {
 return !!inner&&!!outer&&inner.width>0&&inner.height>0&&inner.left>=outer.left-tolerance&&inner.top>=outer.top-tolerance&&inner.right<=outer.right+tolerance&&inner.bottom<=outer.bottom+tolerance;
}
export function classifyObservation(s) {
 const facts=[];
 if(s.expanded==='true'&&s.triggerPoint&&s.triggerHit?.isTrigger===false)facts.push({kind:'original-trigger-covered',evidence:'measured hit test',target:s.triggerHit.top});
 if(s.expanded==='true'&&s.inert)facts.push({kind:'open-menu-inert',evidence:'native DOM state'});
 if(s.expanded==='false'&&s.inert===false&&s.presentation==='true')facts.push({kind:'outgoing-menu-interactive',evidence:'native DOM state'});
 if(s.last?.focused&&s.clipGeometry?.status==='measured-axis-aligned-intersection'&&!rectInside(s.last.rect,s.menuClip))facts.push({kind:'focused-last-row-outside-scroll-clip',evidence:'measured geometry'});
 return facts;
}
export function parentOwnedOpen(s) {
 const p=s?.parent;
 return !!p&&p.tag==='DIALOG'&&p.nativeOpen===true&&p.modal===true&&p.presentation==='true'&&p.hidden===false&&p.inert===false&&p.display!=='none'&&p.visibility==='visible'&&s.stageOwner==='detail'&&s.hash==='#t/menu';
}
export function escapeOwnership(before,after,which) {
 if(which==='child')return parentOwnedOpen(before)&&parentOwnedOpen(after)&&before.hash===after.hash&&before.expanded==='true'&&after.expanded==='false'&&after.inert===true&&after.focus?.control==='menu-trigger'&&after.focus?.inParent===true;
 return parentOwnedOpen(before)&&after.parent?.nativeOpen===false&&after.parent?.modal===false&&after.parent?.presentation!=='true'&&after.stageOwner==='gallery'&&after.hash!=='#t/menu'&&after.focus?.control==='detail-title';
}
export function canSendParentEscape(child,current) {
 return child.status==='collected'&&child.trustedInputObserved===true&&child.ownership===true&&escapeOwnership(child.before,child.after,'child')&&parentOwnedOpen(current)&&current.hash===child.after.hash&&current.expanded==='false'&&current.inert===true&&current.focus?.control==='menu-trigger'&&current.focus?.inParent===true;
}
export function parseColor(value) {
 if(value==='transparent')return [0,0,0,0];
 const m=/^rgba?\(([^)]+)\)$/.exec(value),s=/^color\(srgb\s+([^)]*)\)$/.exec(value);
 if(!m&&!s)throw new Error(`Unsupported measured color: ${value}`);
 const raw=(m?.[1]||s[1]).replace(/[,/]/g,' ').trim().split(/\s+/);
 const channels=raw.slice(0,3).map(v=>v.endsWith('%')?parseFloat(v)/100:Number(v)/(m?255:1));
 const alpha=raw[3]===undefined?1:raw[3].endsWith('%')?parseFloat(raw[3])/100:Number(raw[3]);
 if([...channels,alpha].some(v=>!Number.isFinite(v)||v<0||v>1))throw new Error(`Invalid color: ${value}`);
 return [...channels,alpha];
}
export function over(a,b) {
 const alpha=a[3]+b[3]*(1-a[3]);
 return [...a.slice(0,3).map((v,i)=>alpha?(v*a[3]+b[i]*b[3]*(1-a[3]))/alpha:0),alpha];
}
const lum=c=>c.slice(0,3).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
export function contrast(a,b){const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
// Layers are leaf -> root. Group opacity belongs after background/child paint.
// This is a flat-background model, never sampled raster contrast or proof of readability.
export function effectivePaint(paint) {
 if(!paint?.chain?.length)return {status:'unverified',reason:'No measured paint chain'};
 try {
  const unsupported=paint.chain.flatMap(n=>[
   ...(n.backgroundImage!=='none'?[`${n.node}:background image`]:[]),
   ...(n.mixBlendMode!=='normal'?[`${n.node}:blend`]:[]),
   ...(n.filter!=='none'&&!/^blur\(0px\)$/.test(n.filter)?[`${n.node}:filter ${n.filter}`]:[]),
   ...(n.backdropFilter!=='none'?[`${n.node}:backdrop filter`]:[])
  ]);
  let fg=parseColor(paint.color),bg=[0,0,0,0],opacity=1;
  for(const layer of paint.chain){const c=parseColor(layer.background);fg=over(fg,c);bg=over(bg,c);const o=Number(layer.opacity);if(!Number.isFinite(o))throw new Error('Unknown opacity');opacity*=o;fg[3]*=o;bg[3]*=o;}
  let adjacent=[0,0,0,0];for(const layer of paint.chain.slice(1)){adjacent=over(adjacent,parseColor(layer.background));adjacent[3]*=Number(layer.opacity);}
  const samples=[[1,1,1,1],[0,0,0,1]].map(canvas=>({canvas,foreground:over(fg,canvas),background:over(bg,canvas),ratio:contrast(over(fg,canvas),over(bg,canvas)),adjacent:over(adjacent,canvas),backgroundCueRatio:contrast(over(bg,canvas),over(adjacent,canvas))}));
  return {status:unsupported.length?'unverified-effects':'modeled-only',effectiveOpacity:opacity,unsupported,samples,visible:paint.chain.every(n=>n.visibility==='visible'&&n.display!=='none'),reason:'Uniform ancestor surfaces only; sibling underpaint, antialiasing, actual focus-cue pixels and readability require native PNG/video inspection. Never a pass.'};
 }catch(error){return {status:'unverified',reason:String(error)};}
}
export function keyboardFirstPaint(action) {
 const keys=(action.events||[]).filter(e=>e.type==='keydown'&&e.trusted&&['Enter',' '].includes(e.key)&&e.target?.control==='menu-trigger');
 const isFirst=s=>s?.expanded==='true'&&s.inert===false&&s.focus?.control==='menuitem:0'&&s.first?.focused===true&&s.first?.node?.control==='menuitem:0';
 const accepted=(action.accepted||[]).find(e=>{const origin=inputEventBoundary(action,e);return origin&&e.type==='click'&&e.trusted&&e.detail===0&&e.target?.control==='menu-trigger'&&keys.some(k=>k.at<=origin.eventAt)&&isFirst(e.state);});
 const origin=accepted&&inputEventBoundary(action,accepted);
 const frame=origin&&(action.frames||[]).find(f=>(f.rafCallbackAt??f.at)>=origin.eventAt);
 if(!accepted||!frame||!isFirst(frame))return {status:'blocked',reason:'Missing linked capture-phase trusted trigger activation and correct first-item focus in accepted state / first rAF'};
 const frameAt=frame.rafCallbackAt??frame.at,window=timingWindow(frameAt-origin.eventAt),snapshotCompletionWindow=timingWindow((frame.snapshotCompletedAt??frameAt)-origin.eventAt);
 return {status:window.status==='blocked'||snapshotCompletionWindow.status==='blocked'?'blocked':'measured-not-pixel-reviewed',window,snapshotCompletionWindow,inputEvent:origin,acceptedAt:origin.eventAt,acceptedMeasurement:{observerStartedAt:accepted.observerStartedAt,snapshotStartedAt:accepted.snapshotStartedAt,snapshotCompletedAt:accepted.snapshotCompletedAt},frameAt,frameMeasurement:{rafTimestamp:frame.rafTimestamp,snapshotStartedAt:frame.snapshotStartedAt,snapshotCompletedAt:frame.snapshotCompletedAt},focus:frame.focus,paint:effectivePaint(frame.first),focusCue:frame.first?.cue,reason:'Input boundary is the linked capture-phase event; rAF arrival and snapshot completion are separate pre-paint measurements, not captured painted frames'};
}
export function identityValue(property,value) {
 const v=String(value).trim();if(v==='none')return true;
 const scalar=x=>/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(x)&&Number.isFinite(Number(x));
 const tokens=x=>x.trim().split(/\s+/);
 const zero=x=>/^[+-]?(?:0+(?:\.0*)?|\.0+)(?:px|%)?$/.test(x);
 const zeroAngle=x=>/^[+-]?(?:0+(?:\.0*)?|\.0+)(?:deg|rad|turn)?$/.test(x);
 if(property==='scale'){const t=tokens(v);return t.length>=1&&t.length<=3&&t.every(x=>scalar(x)&&Number(x)===1);}
 if(property==='translate'){const t=tokens(v);return t.length>=1&&t.length<=3&&t.every(zero);}
 if(property==='rotate')return zeroAngle(v);
 if(property==='filter')return /^blur\(\s*[+-]?(?:0+(?:\.0*)?|\.0+)(?:px)?\s*\)$/.test(v);
 const matrix=/^(matrix|matrix3d)\(\s*([^()]*)\s*\)$/.exec(v);
 if(matrix){const t=matrix[2].split(',').map(x=>x.trim()),expected=matrix[1]==='matrix'?[1,0,0,1,0,0]:[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];return t.length===expected.length&&t.every((x,i)=>scalar(x)&&Number(x)===expected[i]);}
 const fn=/^(translate(?:X|Y|Z|3d)?|scale(?:X|Y|Z|3d)?)\(([^()]*)\)$/.exec(v);
 if(!fn)return false;const t=fn[2].trim().split(/\s*,\s*|\s+/),max=fn[1].endsWith('3d')?3:fn[1].match(/[XYZ]$/)?1:2;
 return t.length>=1&&t.length<=max&&(fn[1].startsWith('scale')?t.every(x=>scalar(x)&&Number(x)===1):t.every(zero));
}
export function reducedMotionFindings(states) {
 const findings=[],seen=new Set();
 for(const state of states)for(const a of state.animations||[])for(const [property,values] of Object.entries(a.values||{})){
  if(values.some(v=>!identityValue(property,v))){const id=JSON.stringify([a.target,property]);if(!seen.has(id)){seen.add(id);findings.push({kind:'reduced-motion-nonidentity-keyframes',target:a.target,property,values,evidence:'native observed animation keyframes; pixel review separate'});}}
 }
 for(const state of states)for(const a of state.animations||[])if(a.properties?.includes('opacity')&&typeof a.duration==='number'&&a.duration>100){const id=JSON.stringify([a.target,'long-opacity']);if(!seen.has(id)){seen.add(id);findings.push({kind:'reduced-opacity-duration-over-100ms',target:a.target,duration:a.duration});}}
 return findings;
}
export function trustedActionEvidence(action) {
 const events=(action.events||[]).filter(e=>Number.isFinite(e.at)&&e.at>=(action.requestedAt??action.browserRequestedAt??-Infinity)),name=action.name;
 const expected=name.includes('pointer')||name.endsWith('open-parent-detail')||name.includes('original-point')?'pointer':name.includes('Escape')?'Escape':name.endsWith('-End')?'End':name.includes('Space')?' ':name.includes('Enter')?'Enter':null;
 if(expected==='pointer'){const control=name.endsWith('open-parent-detail')?'detail-title':'menu-trigger';const downs=events.filter(e=>e.type==='pointerdown'&&e.trusted&&e.target?.control===control);return events.some(e=>e.type==='click'&&e.trusted&&e.detail>0&&e.target?.control===control&&downs.some(d=>d.at<=e.at));}
 if(expected==='Enter'||expected===' ')return events.some(e=>e.type==='keydown'&&e.trusted&&e.key===expected&&e.target?.control==='menu-trigger');
 if(expected==='End')return events.some(e=>e.type==='keydown'&&e.trusted&&e.key==='End'&&/^menuitem:\d+$/.test(e.target?.control||''));
 if(expected==='Escape'){const control=action.before?.focus?.control;const allowed=name==='detail-parent-Escape'?control==='menu-trigger'&&action.before?.focus?.inParent===true:control==='menu-root'||/^menuitem:\d+$/.test(control||'');return !!allowed&&events.some(e=>e.type==='keydown'&&e.trusted&&e.key==='Escape'&&e.target?.control===control);}
 return false;
}
// Pure browser-safe helper also installed verbatim in the real native observer.
export function nativeClipGeometry(menu,ancestors,viewport) {
 const toClip=m=>{const r=m.rect;if(!m.axisAligned||!r||!(m.offsetWidth>0&&m.offsetHeight>0))return null;const sx=r.width/m.offsetWidth,sy=r.height/m.offsetHeight;if(!(sx>0&&sy>0))return null;const left=r.left+m.clientLeft*sx,top=r.top+m.clientTop*sy;return {left,top,right:left+m.clientWidth*sx,bottom:top+m.clientHeight*sy,width:m.clientWidth*sx,height:m.clientHeight*sy};};
 let clip=menu.unsupportedClip?null:toClip(menu);if(!clip)return {status:'blocked',reason:'Unsupported non-axis-aligned or empty Menu geometry',rect:null};const applied=[];
 for(const a of [{node:'viewport',clipX:true,clipY:true,direct:viewport},...ancestors]){
  if(a.unsupportedClip)return {status:'blocked',reason:`Unsupported ancestor clip: ${a.node}`,rect:null};if(!a.clipX&&!a.clipY)continue;const c=a.direct||toClip(a);if(!c||a.unsupportedClip)return {status:'blocked',reason:`Unsupported ancestor clip: ${a.node}`,rect:null};
  if(a.clipX){clip.left=Math.max(clip.left,c.left);clip.right=Math.min(clip.right,c.right);}if(a.clipY){clip.top=Math.max(clip.top,c.top);clip.bottom=Math.min(clip.bottom,c.bottom);}applied.push(a.node);
 }
 clip.width=Math.max(0,clip.right-clip.left);clip.height=Math.max(0,clip.bottom-clip.top);return {status:'measured-axis-aligned-intersection',rect:clip,applied};
}
export function actionCollectionIssues(a) {
 const issues=[];const add=(kind,reason)=>issues.push({action:a.name,kind,reason});
 if(a.blocked)add('action-error',a.blocked);if(a.error)add('trace-error',a.error);
 if(a.status==='requested'||a.status==='running')add('unfinished-action','Action did not complete collection');
 if(a.settlement?.status!=='native-finite-settlement-observed')add('settlement',a.settlement?.reason||'No native settlement evidence');
 if(!a.after)add('missing-final-snapshot','Final native snapshot unavailable');
 if(a.trustedInputObserved!==true)add('trusted-input','Required target-owned trusted input unavailable');
 if(a.firstPaint?.status==='blocked')add('first-paint',a.firstPaint.reason);
 return issues;
}
export function collectionSummary(run) {
 const issues=[...(run.blocked||[]),...(run.errors||[]).map(e=>({kind:'page-error',reason:e.message}))];
 for(const a of run.actions||[])issues.push(...actionCollectionIssues(a));
 for(const p of run.pngs||[]){if(p.status!=='captured'||!p.before||!p.after)issues.push({kind:'png-capture',action:p.name,reason:p.error||'PNG missing or unbracketed'});if(Object.values(p['first-paint-window']||{}).some(w=>w?.status==='blocked'))issues.push({kind:'png-timing',action:p.name,reason:'Intended timing window missed'});}
 if(!run.nativeSequenceCompleted)issues.push({kind:'native-sequence',reason:'Native sequence not completed'});
 if(!run.rasterCompleted)issues.push({kind:'raster-sequence',reason:'Raster companion not completed'});
 if(!run.video?.finalized||!run.video?.bytes)issues.push({kind:'video',reason:'Native recording not finalized'});
 if(run.video?.probe?.status==='blocked')issues.push({kind:'video-metadata',reason:run.video.probe.reason});
 return {status:issues.length?'incomplete':'collected',issues};
}
export async function collectNativeAction({run,name,arm,input,afterInput,settle,finish,persist,now=()=>performance.now()}) {
 const record={id:`${run.id}:${run.actions.length}`,name,status:'requested',hostRequestedAt:now(),hostRequestedUtc:new Date().toISOString(),events:[],accepted:[],frames:[]};
 run.actions.push(record);persist(); // Durable stub precedes browser arming and input dispatch.
 try{const armed=await arm(record);record.status='running';record.browserRequestedAt=armed.requestedAt;persist();await input(armed);record.hostInputCompletedAt=now();record.hostInputCompletedUtc=new Date().toISOString();if(afterInput)await afterInput(record);record.settlement=await settle();}
 catch(error){record.blocked=String(error);}
 try{const observation=await finish();if(observation&&observation.id===record.id)Object.assign(record,observation);else if(observation)record.error='Mismatched browser trace action identity';else if(!record.after)record.error='No trace returned by browser finalization';}catch(error){record.error=String(error);}
 if(record.settlement?.state){record.settlement.finalObservedAt=record.settlement.state.at;delete record.settlement.state;}
 record.trustedInputObserved=trustedActionEvidence(record);record.status='collected';record.collectionIssues=actionCollectionIssues(record);if(record.collectionIssues.length)record.status='blocked';
 run.blocked.push(...record.collectionIssues);persist();return record;
}
export async function boundedOperation(operation,timeoutMs,label='operation') {
 let timer;try{return await Promise.race([Promise.resolve().then(operation),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(`${label} finalization timeout`)),timeoutMs);})]);}finally{clearTimeout(timer);}
}
export function makeBoundedFinalizer(steps,{persist=()=>{},onError=()=>{},timeoutMs=1500}={}) {
 let promise;return ()=>promise??=(async()=>{const results=[];for(const step of steps){const row={name:step.name,status:'requested'};results.push(row);persist(results);try{row.value=await boundedOperation(step.run,step.timeoutMs??timeoutMs,step.name);row.status='completed';}catch(error){row.status='blocked';row.error=String(error);onError(row);}persist(results);}return results;})();
}
export function lifecycleObservation(phase,event,state) {
 return {phase,type:event.type,trusted:event.isTrusted??event.trusted??false,defaultPrevented:event.defaultPrevented??false,state,settled:false,nativeDefaultMayStillBePending:phase==='document-bubble-after-production-js'||phase==='dialog-lifecycle-dispatch'};
}
export function nativeBoundaryReady(action,state) {
 if(action?.name!=='detail-parent-Escape')return true;
 return (action.lifecycle||[]).some(e=>['cancel','close'].includes(e.type)&&e.trusted===true&&e.phase==='dialog-lifecycle-dispatch')&&state.parent?.nativeOpen===false&&state.parent?.modal===false;
}
// These exact listener functions run in the browser and in causal clock tests.
// Capture phase is cheap. Event time is never replaced by style/geometry work ending.
export function createClockedEventListeners({now,describe,snapshot}) {
 const events=new WeakMap();let nextId=0;
 const capture=event=>{
  const eventAt=now();const row={eventId:++nextId,type:event.type,key:event.key??null,trusted:event.isTrusted,detail:event.detail??null,eventAt,at:eventAt,nativeEventTimeStamp:Number.isFinite(event.timeStamp)?event.timeStamp:null,target:describe(event.target)};
  row.captureCompletedAt=now();events.set(event,row);return row;
 };
 const observe=(event,phase,rafTimestamp=null)=>{
  const observerStartedAt=now(),original=events.get(event),snapshotStartedAt=now();
  const state=snapshot(event,phase),snapshotCompletedAt=now();
  return {type:event.type,key:event.key??null,trusted:event.isTrusted,detail:event.detail??null,defaultPrevented:event.defaultPrevented??false,phase,captureEventId:original?.eventId??null,eventAt:original?.eventAt??null,at:original?.eventAt??null,clockStatus:original?'linked-capture-event':'blocked-missing-capture-event',nativeEventTimeStamp:original?.nativeEventTimeStamp??null,observerStartedAt,snapshotStartedAt,snapshotCompletedAt,rafTimestamp,target:original?.target??describe(event.target),state};
 };
 return {capture,accepted:event=>observe(event,'document-bubble-after-production-js'),lifecycle:event=>observe(event,'dialog-lifecycle-dispatch'),later:(event,rafTimestamp)=>observe(event,'next-raf-after-lifecycle',rafTimestamp)};
}
export function inputEventBoundary(action,observation) {
 if(observation?.clockStatus!=='linked-capture-event'||!Number.isFinite(observation.captureEventId))return null;
 const event=(action.events||[]).find(e=>e.eventId===observation.captureEventId);
 if(!event||!Number.isFinite(event.eventAt)||event.eventAt!==observation.eventAt||event.type!==observation.type||event.trusted!==true||event.target?.control!==observation.target?.control)return null;
 return {eventId:event.eventId,eventAt:event.eventAt,nativeEventTimeStamp:event.nativeEventTimeStamp??null};
}
