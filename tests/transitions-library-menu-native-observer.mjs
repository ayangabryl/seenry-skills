// These exported functions run verbatim in the native browser. They never drive UI.
export function installMenuCaptureClock() {
 const trace=window.__menuNative={active:null,events:[],eventMap:new WeakMap(),nextEventId:0,dropped:0};
 trace.control=node=>{
  if(!node?.closest)return 'outside';
  const trigger=node.closest('[data-menu-trigger]');if(trigger)return `trigger:${trigger.closest('[data-menu-file]')?.dataset.menuFile}`;
  const item=node.closest('[data-menu-action]');if(item)return `action:${item.dataset.menuAction}`;
  if(node.closest('#menu-rename-name'))return 'editor-input';
  if(node.closest('[data-menu-cancel]'))return 'cancel';
  if(node.closest('#menu-rename [type="submit"]'))return 'save';
  if(node.closest('[data-menu-form]'))return 'editor-form';
  if(node.id==='library-search')return 'search';
  if(node.closest('[data-menu-reset]'))return 'reset';
  if(node.closest('[data-menu-undo]'))return 'undo';
  if(node.closest('[data-detail="menu"]'))return 'detail';
  if(node.id==='menu-1')return 'menu';
  if(node.id==='menu-rename')return 'editor';
  if(node.id==='library-detail')return 'parent';
  if(node.id==='blur-toggle'||node.closest('label.blur-switch'))return 'blur';
  if(node.matches?.('[data-key="menu"]'))return 'menu-card';
  return node.id?`id:${node.id}`:'outside';
 };
 for(const type of ['pointerdown','pointerup','click','keydown','keyup','input','submit','cancel','close','beforetoggle','st:close','focusin','focusout'])document.addEventListener(type,event=>{
  const eventAt=performance.now(),action=trace.active;
  const row={actionId:action?.id??null,eventId:++trace.nextEventId,type,trusted:event.isTrusted,key:event.key??null,detail:event.detail??null,eventAt,nativeTimeStamp:event.timeStamp,control:trace.control(event.target),oldState:event.oldState??null,newState:event.newState??null,value:event.type==='input'?event.target.value:null};
  if(action?.progressRequired&&['pointerdown','click','keydown'].includes(type)&&trace.snapshot)row.interruptionState=trace.snapshot(false);
  row.captureCompletedAt=performance.now();trace.eventMap.set(event,row);
  if(action){if(action.events.length<100)action.events.push(row);else action.overflow=true;}
  if(trace.events.length<800)trace.events.push(row);else trace.dropped++;
 },true);
}

export function installMenuObserver() {
 const trace=window.__menuNative,stage=document.querySelector('[data-menu-demo]'),menu=stage.querySelector('#menu-1'),editor=stage.querySelector('#menu-rename'),parent=document.querySelector('#library-detail'),menuCard=document.querySelector('[data-key="menu"]'),search=document.querySelector('#library-search');
 const rect=e=>e?.getBoundingClientRect().toJSON()??null;
 const visible=e=>{if(!e)return false;const s=getComputedStyle(e),r=rect(e);return !e.hidden&&s.display!=='none'&&s.visibility==='visible'&&r.width>0&&r.height>0;};
 const paint=e=>{
  const s=getComputedStyle(e),range=document.createRange();range.selectNodeContents(e);
  const chain=[];
  // Native top-layer popovers escape DOM ancestor clipping/transform/opacity.
  // Stop at the actual opaque menu surface; this remains a flat paint model.
  for(let n=e;n;n=n.parentElement){const c=getComputedStyle(n);chain.push({node:n.id||n.tagName,background:c.backgroundColor,backgroundImage:c.backgroundImage,opacity:c.opacity,filter:c.filter,backdropFilter:c.backdropFilter,mixBlendMode:c.mixBlendMode,visibility:c.visibility,display:c.display,transform:c.transform,translate:c.translate,scale:c.scale,rotate:c.rotate});if(n===menu)break;}
  return {rect:rect(e),focused:document.activeElement===e,focusVisible:e.matches(':focus-visible'),color:s.color,glyphs:[...range.getClientRects()].filter(r=>r.width>0&&r.height>0).map(r=>r.toJSON()),cue:{background:s.backgroundColor,adjacentBackground:getComputedStyle(e.parentElement).backgroundColor,outlineColor:s.outlineColor,outlineWidth:s.outlineWidth,outlineStyle:s.outlineStyle,boxShadow:s.boxShadow},chain};
 };
 const animations=()=>{
  const found=new Set([...menu.getAnimations({subtree:true}),...editor.getAnimations({subtree:true}),...parent.getAnimations({subtree:true}),...menuCard.getAnimations({subtree:false})]);
  for(let n=stage;n;n=n.parentElement)for(const a of n.getAnimations({subtree:false}))found.add(a);
  return [...found].slice(0,40).map(a=>{const timing=a.effect?.getTiming()||{},computed=a.effect?.getComputedTiming()||{},target=a.effect?.target,frames=a.effect?.getKeyframes()||[];return {
   owner:target===menu||menu.contains(target)?'menu':target===editor||editor.contains(target)?'editor':target===parent?'parent':'ancestor',target:trace.control(target),pseudo:a.effect?.pseudoElement??null,kind:a.constructor.name,playState:a.playState,pending:a.pending,currentTime:typeof a.currentTime==='number'?a.currentTime:null,progress:computed.progress??null,endTime:Number.isFinite(computed.endTime)?computed.endTime:null,duration:timing.duration,iterations:Number.isFinite(timing.iterations)?timing.iterations:null,fill:timing.fill,
   properties:[...new Set(frames.flatMap(f=>Object.keys(f).filter(k=>!['offset','computedOffset','easing','composite'].includes(k))))],values:Object.fromEntries(['transform','translate','scale','rotate','filter'].map(k=>[k,[...new Set(frames.map(f=>f[k]).filter(x=>x!==undefined))].slice(0,8)]))
  };});
 };
 const menuClip=()=>{
  const s=getComputedStyle(menu),m=new DOMMatrixReadOnly(s.transform==='none'?undefined:s.transform),r=rect(menu);
  const metrics={node:'menu',rect:r,offsetWidth:menu.offsetWidth,offsetHeight:menu.offsetHeight,clientLeft:menu.clientLeft,clientTop:menu.clientTop,clientWidth:menu.clientWidth,clientHeight:menu.clientHeight,axisAligned:m.is2D&&Math.abs(m.b)<1e-8&&Math.abs(m.c)<1e-8&&m.a>0&&m.d>0&&['none','0deg'].includes(s.rotate),unsupportedClip:s.clipPath!=='none'||s.maskImage!=='none'};
  return window.__menuNativeClipGeometry(metrics,[],{left:0,top:0,right:innerWidth,bottom:innerHeight});
 };
 function snapshot(withPaint=true){
  const snapshotStartedAt=performance.now(),action=trace.active;
  const row=action?.row||stage.querySelector('[data-menu-trigger][aria-expanded="true"]')?.closest('[data-menu-file]')?.dataset.menuFile||'roadmap';
  const trigger=stage.querySelector(`[data-menu-file="${row}"] [data-menu-trigger]`),tr=rect(trigger),point=action?.originalPoint||(tr?{x:tr.left+tr.width/2,y:tr.top+tr.height/2}:null),hit=point?document.elementFromPoint(point.x,point.y):null;
  const s=getComputedStyle(menu),ps=getComputedStyle(parent),es=getComputedStyle(editor);
  const rows=[...stage.querySelectorAll('[data-menu-file]')].map(e=>{const name=e.querySelector('[data-menu-file-name]'),button=e.querySelector('[data-menu-trigger]'),r=rect(e),nr=rect(name);return {id:e.dataset.menuFile,name:name.textContent,rect:r,nameRect:nr,nameFits:name.scrollWidth<=name.clientWidth+1&&nr.left>=r.left-.5&&nr.right<=r.right+.5&&nr.top>=r.top-.5&&nr.bottom<=r.bottom+.5,trigger:button.id,accessibleName:button.getAttribute('aria-label'),expanded:button.getAttribute('aria-expanded')};});
  const result={snapshotStartedAt,focus:trace.control(document.activeElement),viewport:{width:innerWidth,height:innerHeight},hash:location.hash,stageOwner:parent.contains(stage)?'detail':'gallery',search:{value:search.value,focused:document.activeElement===search},menuCard:{hidden:menuCard.hidden,containsStage:menuCard.contains(stage),visible:visible(menuCard),opacity:getComputedStyle(menuCard).opacity},blur:{checked:document.querySelector('#blur-toggle').checked,rootOn:document.documentElement.hasAttribute('data-st-blur')},rows,count:stage.querySelector('[data-menu-count]').textContent,statusText:stage.querySelector('[data-menu-status]').textContent,budgetText:stage.querySelector('[data-menu-budget]').textContent,
   recovery:{visible:visible(stage.querySelector('[data-menu-recovery]')),text:stage.querySelector('[data-menu-deleted]').textContent,undoVisible:visible(stage.querySelector('[data-menu-undo]'))},empty:visible(stage.querySelector('[data-menu-empty]')),
   trigger:{row,exists:!!trigger,rect:tr,expanded:trigger?.getAttribute('aria-expanded')??null,point,hit:!!trigger&&(hit===trigger||trigger.contains(hit)),hitControl:trace.control(hit)},
   menu:{open:menu.dataset.stOpen==='true',nativeOpen:menu.matches(':popover-open'),inert:menu.inert,ariaHidden:menu.getAttribute('aria-hidden'),display:s.display,visibility:s.visibility,opacity:s.opacity,filter:s.filter,transform:s.transform,origin:s.transformOrigin,side:menu.dataset.stSide,rect:rect(menu),limitVisible:visible(stage.querySelector('[data-menu-limit]'))},geometry:menuClip(),
   items:[...menu.querySelectorAll('[data-menu-action]')].map(e=>({action:e.dataset.menuAction,disabled:e.disabled,role:e.getAttribute('role'),text:e.textContent.trim(),...(withPaint?{paint:paint(e)}:{})})),
   editor:{open:editor.open,modal:editor.matches(':modal'),inert:editor.inert,display:es.display,visibility:es.visibility,value:stage.querySelector('[data-menu-name]').value,error:stage.querySelector('[data-menu-error]').textContent,errorVisible:visible(stage.querySelector('[data-menu-error]')),invalid:stage.querySelector('[data-menu-name]').getAttribute('aria-invalid'),rect:rect(editor)},
   parent:{nativeOpen:parent.open,modal:parent.matches(':modal'),presentation:parent.dataset.stOpen,hidden:parent.hidden,inert:parent.inert,display:ps.display,visibility:ps.visibility},animations:animations()};
  result.snapshotCompletedAt=performance.now();return result;
 }
 trace.snapshot=snapshot;
 // Kept outside accepted/first-rAF capture and invoked only after finish().
 trace.typography=window.__menuCaptureSettledTypography;
 const measured=(event,phase)=>{const original=trace.eventMap.get(event),observerAt=performance.now(),snapshotStartedAt=performance.now(),state=snapshot(true),snapshotCompletedAt=performance.now();return {...original,phase,observerAt,snapshotStartedAt,snapshotCompletedAt,defaultPrevented:event.defaultPrevented,state};};
 function startFrames(action,accepted){
  if(action.frameArmed)return;action.frameArmed=true;action.selectedEventId=accepted.eventId;const started=performance.now();
  const tick=rafTimestamp=>{
   if(trace.active!==action)return;
   const callbackAt=performance.now(),sequence=++action.frameCount;
   const cheap=snapshot(false),hasProgress=window.__menuNativeProgressed(cheap);
   const selected=sequence===1||hasProgress&&!action.progressObserved||[3,6,10,16].includes(sequence);
   if(selected){const snapshotStartedAt=performance.now(),state=snapshot(true),snapshotCompletedAt=performance.now(),row={actionId:action.id,eventId:accepted.eventId,sequence,rafTimestamp,callbackAt,snapshotStartedAt,snapshotCompletedAt,state};action.frames.push(row);if(sequence===1)action.firstRAF=row;if(hasProgress&&!action.progressObserved){action.progressObserved=row;}}
   if(sequence<40&&performance.now()-started<750)action.raf=requestAnimationFrame(tick);else action.samplingStopped={at:performance.now(),reason:'bounded-observation-window'};
  };action.raf=requestAnimationFrame(tick);
 }
 function accept(event,phase){
  const a=trace.active;if(!a)return;const origin=trace.eventMap.get(event);if(!origin||origin.actionId!==a.id)return;
  if(a.accepted.some(e=>e.eventId===origin.eventId&&e.phase===phase))return;
  if(a.accepted.length>=24){a.overflow=true;return;}
  const row=measured(event,phase);a.accepted.push(row);
  if(event.type==='click'&&origin.control===a.targetControl)startFrames(a,row);
 }
 // Added after fixture mount: runtime item listener -> host action -> this observer.
 // Trigger clicks stop at stage; a document-bubble observer would miss acceptance.
 stage.addEventListener('click',e=>accept(e,'post-production-stage-bubble'));
 stage.addEventListener('keydown',e=>{if(e.target.closest('[data-menu-trigger]')&&['ArrowUp','ArrowDown'].includes(e.key))accept(e,'post-production-stage-keydown');});
 editor.addEventListener('keydown',e=>{if(e.key==='Escape')accept(e,'editor-keydown-before-native-default');});
 document.addEventListener('keydown',e=>accept(e,'post-production-document-keydown'));
 document.addEventListener('click',e=>{if(!stage.contains(e.target))accept(e,'post-production-document-bubble');});
 editor.addEventListener('submit',e=>accept(e,'post-production-editor-submit'));
 stage.addEventListener('input',e=>accept(e,'post-production-stage-input'));
 document.addEventListener('input',e=>{if(e.target===search)accept(e,'post-production-document-input');});
 menu.addEventListener('st:close',e=>{const a=trace.active;if(a){if(a.productionClosures.length<12)a.productionClosures.push(measured(e,'production-menu-close-completed'));else a.overflow=true;}});
 const hiddenObserver=new MutationObserver(records=>{const a=trace.active;if(!a)return;for(const mutation of records){if(mutation.attributeName!=='hidden')continue;if(a.filterMutations.length>=8){a.overflow=true;break;}const observerAt=performance.now(),state=snapshot(true);a.filterMutations.push({actionId:a.id,phase:'menu-card-hidden-mutation',oldValue:mutation.oldValue,hidden:menuCard.hidden,observerAt,state});}});hiddenObserver.observe(menuCard,{attributes:true,attributeFilter:['hidden'],attributeOldValue:true});
 for(const node of [editor,parent])for(const type of ['cancel','close'])node.addEventListener(type,e=>{const a=trace.active;if(a&&a.lifecycle.length<12)a.lifecycle.push(measured(e,'native-dialog-lifecycle'));});
 trace.arm=request=>{
  if(trace.active)throw Error('Previous native action must be collected before arming another');
  const a={...request,events:[],accepted:[],frames:[],lifecycle:[],productionClosures:[],filterMutations:[],frameCount:0,requestedAt:performance.now(),raf:null};trace.active=a;
  a.before=snapshot(true);if(!a.originalPoint)a.originalPoint=a.before.trigger.point;
  return {requestedAt:a.requestedAt,originalPoint:a.originalPoint,before:a.before};
 };
 trace.finish=()=>{const a=trace.active;if(!a)return null;if(a.raf)cancelAnimationFrame(a.raf);a.after=snapshot(true);trace.active=null;delete a.raf;return a;};
 trace.inventory=()=>({active:trace.active?{...trace.active,raf:undefined}:null,final:snapshot(true),events:trace.events,dropped:trace.dropped});
 trace.settle=()=>new Promise(resolve=>{
  const start=performance.now();let stable=0,raf=null,done=false;
  const finish=result=>{if(done)return;done=true;cancelAnimationFrame(raf);clearTimeout(timer);resolve({...result,elapsedMs:performance.now()-start});};
  const timer=setTimeout(()=>finish({status:'unverified',reason:'Native settlement deadline',state:snapshot(true)}),2200);
  const tick=rafAt=>{const s=snapshot(false),live=s.animations.filter(a=>a.pending||a.playState==='running'),unknown=s.animations.filter(a=>a.iterations===null),held=s.animations.filter(a=>a.playState==='finished'&&['forwards','both'].includes(a.fill));
   if(!live.length&&!unknown.length&&!held.length)stable++;else stable=0;
   if(stable>=2)return finish({status:'native-finite-settlement-observed',rafAt,state:snapshot(true)});
   raf=requestAnimationFrame(tick);
  };raf=requestAnimationFrame(tick);
 });
}


// This runs only after an action has finished. No accepted/first-rAF caller invokes it.
export function captureSettledMenuTypography({actionId}) {
 const rect=node=>node?.getBoundingClientRect().toJSON()??null;
 const inside=(a,b)=>!!b&&a.left>=b.left-1&&a.right<=b.right+1&&a.top>=b.top-1&&a.bottom<=b.bottom+1;
 const sampleStartedAt=performance.now(),rows=[],skipped=[];let overflow=false;
 const activeModal=document.activeElement?.closest('dialog:modal')??null;
 const skip=(selector,reason)=>{if(skipped.length<40)skipped.push({selector,reason});else overflow=true;};
 for(const target of window.__menuPhoneTypographyTargets)for(const node of document.querySelectorAll(target.selector)){
  const text=(node instanceof HTMLInputElement?node.value||node.getAttribute('aria-label')||'File name input':node.textContent).trim();if(!text)continue;
  if(activeModal&&!activeModal.contains(node)){skip(target.selector,'outside-active-native-modal');continue;}
  const style=getComputedStyle(node),r=rect(node);if(style.display==='none'||style.visibility!=='visible'||!r.width||!r.height)continue;
  if(rows.length>=40){overflow=true;break;}
  const top=node.closest('[popover]:popover-open,dialog[open]'),container=top||node.closest('[data-menu-demo]'),box=rect(container);
  const clip={left:0,top:0,right:innerWidth,bottom:innerHeight};
  for(let n=node.parentElement;n;n=n.parentElement){
   const s=getComputedStyle(n),bounds=rect(n),sx=n.offsetWidth>0?bounds.width/n.offsetWidth:1,sy=n.offsetHeight>0?bounds.height/n.offsetHeight:1;
   const inner={left:bounds.left+(n.clientLeft||0)*sx,top:bounds.top+(n.clientTop||0)*sy,right:bounds.left+((n.clientLeft||0)+(n.clientWidth??bounds.width))*sx,bottom:bounds.top+((n.clientTop||0)+(n.clientHeight??bounds.height))*sy};
   if(/hidden|clip|scroll|auto/.test(s.overflowX)){clip.left=Math.max(clip.left,inner.left);clip.right=Math.min(clip.right,inner.right);}
   if(/hidden|clip|scroll|auto/.test(s.overflowY)){clip.top=Math.max(clip.top,inner.top);clip.bottom=Math.min(clip.bottom,inner.bottom);}
   if(n===top)break;
  }
  clip.width=Math.max(0,clip.right-clip.left);clip.height=Math.max(0,clip.bottom-clip.top);
  // Ordinary vertical scrolling may place valid content wholly/partly out of view.
  // Exclude it from this visible-leaf sample; horizontal overflow is still a failure.
  if(r.top<clip.top-1||r.bottom>clip.bottom+1){skip(target.selector,'outside-visible-vertical-scroll-region');continue;}
  let painted=true;const paintChain=[];for(let n=node;n;n=n.parentElement){const s=getComputedStyle(n);paintChain.push({display:s.display,visibility:s.visibility,opacity:s.opacity});if(s.display==='none'||s.visibility!=='visible'||Number(s.opacity)<=0)painted=false;if(n===top)break;}
  const range=document.createRange();range.selectNodeContents(node);const glyphs=[...range.getClientRects()].filter(g=>g.width&&g.height).map(g=>g.toJSON());
  const fits=inside(r,clip)&&inside(r,box)&&(node instanceof HTMLInputElement||glyphs.length>0&&glyphs.every(g=>inside(g,r)));
  rows.push({selector:target.selector,nodeId:node.id||null,text:text.slice(0,200),fontSize:Number.parseFloat(style.fontSize),painted,paintChain,fits,topLayer:!!top,rect:r,containerRect:box,visibleClip:clip,glyphs});
 }
 return {actionId,phase:'settled-phone-typography',actionInactive:window.__menuNative.active===null,viewportWidth:innerWidth,sampleStartedAt,sampleCompletedAt:performance.now(),overflow,rows,skipped};
}
