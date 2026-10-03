// Functional/native evidence contract only. This module never assigns a design score.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {sha256,identityValue,rectInside,effectivePaint,parseColor,contrast,nativeClipGeometry} from './transitions-library-menu-discovery-helpers.mjs';
import {reconcileMenuEvents,menuCollectionGroups} from './transitions-library-menu-native-collection.mjs';

export const VERSION = 'menu-native-v5';
export const ASSETS = ['gallery.html','gallery.js','gallery-menu.js','seenry-transitions.js','seenry-transitions.css','assets/morning.jpg','assets/lake.jpg','assets/forest.jpg'];
export const HARNESS = ['transitions-library-menu-native.browser.mjs','transitions-library-menu-native-contract.mjs','transitions-library-menu-native-observer.mjs','transitions-library-menu-discovery-helpers.mjs','transitions-library-menu-native-collection.mjs'];
export const WIDTHS = [320,390,1100,1440], THEMES = ['light','dark'];
export const PROFILES = WIDTHS.flatMap((width,w)=>THEMES.flatMap((theme,t)=>['pointer','keyboard','reduced','detail'].map(suite=>({
 id:`${width}-${theme}-${suite}`,width,height:780,theme,suite,shard:w*2+t,
 motion:suite==='reduced'||suite==='detail'&&[320,1100].includes(width)?'reduce':'no-preference',
 route:suite==='detail'?'detail':'gallery'
}))));
export const CALLBACK_PROFILE={id:'controlled-beforetoggle-close',width:390,height:780,theme:'light',suite:'controlled-callback',shard:'callback',motion:'no-preference',route:'gallery'};
export const profileFor=id=>PROFILES.find(p=>p.id===id)||(id===CALLBACK_PROFILE.id?CALLBACK_PROFILE:null);
export const STILL_STEPS=['roadmap-pointer-open','blur-pointer-open','roadmap-open','invalid-blank-save','hiring-save','limit-open','empty-recovery-persistent','detail-child-open','detail-rename-begin','search-away','search-restore'];
export const stillPlan=profile=>[...actionPlan(profile).filter(s=>STILL_STEPS.includes(s.id)).map(s=>s.id),'final-state'];
export const PHONE_TEXT_TARGETS=[
 ...['.menu-demo [data-menu-count]','.menu-demo [data-menu-reset]','.menu-demo [data-menu-file-note]','.menu-demo [data-menu-budget]','.menu-demo [data-menu-status]','.menu-demo [data-menu-deleted]','.menu-demo [data-menu-undo]','.menu-demo [data-menu-empty]','.menu-demo .menu-demo-disclosure','#menu-copy-limit'].map(selector=>({selector,minFontSize:15})),
 ...['#menu-rename label','#menu-rename input','#menu-rename .st-button'].map(selector=>({selector,minFontSize:16}))
];
export function typographyPlan(profile){return !profile||profile.width>650||profile.suite==='controlled-callback'?[]:actionPlan(profile).filter(step=>['initial','rename-begin','invalid-blank-save','hiring-save','limit-open','empty-recovery-persistent','empty-recovery-undo-visible','search-rename-begin','search-save','search-reset','detail-rename-begin','detail-delete','detail-return-reset','final-reset'].includes(step.id)).map(step=>step.id);}
export const eventBatchPlan=profile=>['setup',...menuCollectionGroups(actionPlan(profile)).map(group=>group.length===1?group[0].id:`rapid:${group[0].id}`)];
export const eventBatchLimit=profile=>eventBatchPlan(profile).length; // Setup, then one checkpoint per stable action/group; recovery retains the final bounded tail.
export const SHARDS = WIDTHS.flatMap((_,w)=>THEMES.map((_,t)=>({id:w*2+t,profiles:PROFILES.filter(p=>p.shard===w*2+t).map(p=>p.id)})));

export function exactSet(actual,expected,label) {
 assert(Array.isArray(actual)&&actual.length>0,`${label}: empty or missing`);
 assert.equal(new Set(actual).size,actual.length,`${label}: duplicate`);
 assert.equal(actual.length,expected.length,`${label}: incomplete or extra`);
 assert.deepEqual([...actual].sort(),[...expected].sort(),`${label}: wrong members`);
}
export function verifyPlan(profiles=PROFILES,shards=SHARDS) {
 exactSet(profiles.map(p=>p.id),PROFILES.map(p=>p.id),'profile union');
 exactSet(shards.map(s=>s.id),SHARDS.map(s=>s.id),'shard union');
 exactSet(shards.flatMap(s=>s.profiles),profiles.map(p=>p.id),'partition union');
 for(const shard of shards)exactSet(shard.profiles,profiles.filter(p=>p.shard===shard.id).map(p=>p.id),`shard ${shard.id}`);
 for(const p of profiles){assert.deepEqual(p,PROFILES.find(q=>q.id===p.id),'profile mutation');const ids=actionPlan(p).map(s=>s.id);exactSet(ids,ids,`${p.id} actions`);}
 return {version:VERSION,profiles:profiles.length,shards:shards.length,casesPerShard:4,controlledCases:[CALLBACK_PROFILE.id],requiredActions:Object.fromEntries([...profiles,CALLBACK_PROFILE].map(p=>[p.id,actionPlan(p).length]))};
}
export function actionPlan(p) {
 const a=[],push=(id,op,data={})=>a.push({id,op,...data});
 const mode=p.suite==='keyboard'?'keyboard':'pointer';
 const open=(id,row='roadmap',extra={})=>push(id,'open',{row,mode,instant:p.motion==='reduce'||mode==='keyboard',...extra});
 const click=(id,control,extra={})=>push(id,'activate',{control,mode,...extra});
 const key=(id,key,extra={})=>push(id,'key',{key,...extra});
 const type=(id,value)=>push(id,'type',{value});
 push('initial','inspect',{check:'initial'});
 if(p.suite==='controlled-callback'){push('native-beforetoggle-open-close','callback',{check:'callback-closed',row:'roadmap'});return a;}
 if(p.suite==='reduced')push('reduced-blur-on','blur',{on:true});
 if(p.suite==='pointer'){
  for(const row of ['roadmap','hiring']){open(`${row}-pointer-open`,row,{check:'placed'});push(`${row}-original-point-close`,'original-click',{row,check:'closed'});}
  push('blur-on','blur',{on:true});open('blur-pointer-open','roadmap',{check:'placed'});push('blur-original-close','original-click',{row:'roadmap',check:'closed'});
  open('entry-progress-open','roadmap',{settle:false});push('entry-progress-close','interrupt',{direction:'entry',input:'original-click',row:'roadmap',settle:false});
  push('exit-progress-reopen','interrupt',{direction:'exit',input:'original-click',row:'roadmap',check:'placed'});
  push('reopened-original-close','original-click',{row:'roadmap',check:'closed'});
  open('takeover-progress-open','roadmap',{settle:false});push('keyboard-takeover','interrupt',{direction:'entry',input:'key',key:'ArrowDown',check:'takeover'});
  key('takeover-escape','Escape',{check:'closed-focus',row:'roadmap'});
  open('close-mid-open','roadmap',{settle:false});push('close-mid-action','interrupt',{direction:'entry',input:'key',key:'Escape',check:'closed-focus',row:'roadmap'});
  open('repeat-open','hiring');key('repeat-escape','Escape',{check:'closed-focus',row:'hiring'});
  open('search-edit-open','hiring',{mode:'keyboard',instant:true});click('search-rename-begin','action:rename',{mode:'keyboard',check:'editor-open',row:'hiring'});
  push('search-rename-value','type',{value:'Search retained file'});click('search-save','save',{mode:'keyboard',check:'renamed',row:'hiring',name:'Search retained file'});
  open('search-open','hiring');key('search-slash','/',{check:'search-focused'});
  push('search-keep','search',{control:'search',value:'Menu',check:'search-kept'});
  push('search-away','search',{control:'search',value:'Dialog',check:'search-retired'});
  key('search-escape','Escape',{check:'search-escape'});
  push('search-restore','search',{control:'search',value:'Menu',check:'search-restored'});
  click('search-reset','reset',{mode:'keyboard',check:'reset'});
  return a;
 }
 if(p.suite==='detail'){
  push('detail-enter','activate',{control:'detail',mode:'pointer',check:'parent-open'});
  open('detail-child-open','roadmap',{mode:'keyboard',instant:true});key('detail-background-search-slash','/',{check:'detail-search-blocked'});key('detail-child-escape','Escape',{check:'child-escape',row:'roadmap'});
  open('detail-rename-open','hiring',{mode:'keyboard',instant:true});click('detail-rename-begin','action:rename',{mode:'keyboard',check:'editor-open',row:'hiring'});
  type('detail-draft','Discard this detail draft');key('detail-rename-escape','Escape',{check:'editor-cancel-parent',row:'hiring'});
  open('detail-duplicate-open','roadmap',{mode:'keyboard',instant:true});click('detail-duplicate','action:duplicate',{mode:'keyboard',check:'copy1'});
  open('detail-delete-open','copy-1',{mode:'keyboard',instant:true});click('detail-delete','action:delete',{mode:'keyboard',check:'delete',row:'copy-1'});
  click('detail-undo','undo',{mode:'keyboard',check:'undo',row:'copy-1'});
  open('detail-final-child-open','hiring',{mode:'keyboard',instant:true});key('detail-final-child-escape','Escape',{check:'child-escape',row:'hiring'});
  key('detail-parent-escape','Escape',{check:'parent-escape'});
  click('detail-return-reset','reset',{mode:'keyboard',check:'reset'});
  return a;
 }
 // Every keyboard and reduced profile executes the complete local application flow.
 // Menu first-paint checks are attached to every instant opening, not one chosen good sample.
 open('roadmap-open');click('rename-begin','action:rename',{check:'editor-open',row:'roadmap'});
 type('rename-valid','  Q4 roadmap  ');click('rename-save','save',{check:'renamed',row:'roadmap',name:'Q4 roadmap'});
 open('cancel-open');click('cancel-begin','action:rename',{check:'editor-open',row:'roadmap'});type('cancel-draft','Discard this draft');click('rename-cancel','cancel',{check:'editor-cancel',row:'roadmap'});
 open('invalid-open');click('invalid-begin','action:rename',{check:'editor-open',row:'roadmap'});type('invalid-blank','   ');click('invalid-blank-save','save',{check:'invalid'});
 type('invalid-long','x'.repeat(61));click('invalid-long-save','save',{check:'invalid'});key('invalid-escape','Escape',{check:'editor-cancel',row:'roadmap'});
 open('hiring-open','hiring');click('hiring-rename-begin','action:rename',{check:'editor-open',row:'hiring'});type('hiring-name','W'.repeat(60));click('hiring-save','save',{check:'renamed',row:'hiring',name:'W'.repeat(60)});
 open('duplicate-first-open');click('duplicate-first','action:duplicate',{check:'copy1'});
 open('duplicate-second-open','hiring');click('duplicate-second','action:duplicate',{check:'copy2'});
 open('limit-open','roadmap',{check:'limit'});key('limit-end','End',{check:'focused-delete'});key('limit-home','Home',{check:'focused-rename'});key('limit-skip-disabled','ArrowDown',{check:'focused-delete'});key('limit-escape','Escape',{check:'closed-focus',row:'roadmap'});
 for(const row of ['roadmap','copy-1','hiring','copy-2']){open(`delete-${row}-open`,row);click(`delete-${row}`,'action:delete',{check:'delete',row});}
 push('empty-recovery-persistent','observe-duration',{durationMs:6000,check:'empty-persistent'});
 if(p.width<=650)push('empty-recovery-undo-visible','reach',{control:'undo',mode:'keyboard',check:'undo-visible'});
 for(const row of ['copy-2','hiring','copy-1','roadmap'])click(`undo-${row}`,'undo',{check:'undo',row});
 open('restored-budget-open','hiring',{check:'limit'});key('restored-budget-escape','Escape',{check:'closed-focus',row:'hiring'});
 click('reset','reset',{check:'reset'});open('repeat-copy-open','hiring');click('repeat-copy','action:duplicate',{check:'copy1'});
 open('repeat-rename-open','copy-1');click('repeat-rename-begin','action:rename',{check:'editor-open',row:'copy-1'});type('repeat-draft','Do not retain');key('repeat-rename-escape','Escape',{check:'editor-cancel',row:'copy-1'});
 click('final-reset','reset',{check:'reset'});
 open('space-keyboard-open','hiring',{mode:'keyboard',key:'Space',instant:true});key('space-keyboard-escape','Escape',{check:'closed-focus',row:'hiring'});
 return a;
}

export function sourceBundleSHA256(identity) {
 const canonical={schema:VERSION,reconstructionBaseCommit:identity.reconstructionBaseCommit,assets:Object.fromEntries([...ASSETS].sort().map(name=>[name,identity.assets?.[name]])),harness:Object.fromEntries([...HARNESS].sort().map(name=>[name,identity.harness?.[name]]))};
 return createHash('sha256').update(JSON.stringify(canonical)).digest('hex');
}
export function assertSourceIdentity(identity) {
 assert(identity?.frozen===true&&identity.schema===VERSION,'Frozen source identity/schema missing');assert(!Object.hasOwn(identity,'candidate'),'Ambiguous candidate Git commit label is forbidden');
 assert.match(identity.reconstructionBaseCommit||'',/^[0-9a-f]{40}$/,'Exact reconstruction base Git commit required');
 for(const [group,required] of [['assets',ASSETS],['harness',HARNESS]]){exactSet(Object.keys(identity[group]||{}),required,`${group} identity`);for(const hash of Object.values(identity[group]))assert.match(hash||'',/^[0-9a-f]{64}$/);}
 assert.match(identity.bundleSHA256||'',/^[0-9a-f]{64}$/,'Pre-publication bundle digest missing');assert.equal(identity.bundleSHA256,sourceBundleSHA256(identity),'Declared immutable source bundle digest mismatch');
}
export function assertRunIdentity(identity) {
 assert(identity&&typeof identity==='object','Actual CI run identity missing');assert.match(identity.checkoutHead||'',/^[0-9a-f]{40}$/,'Actual checkout HEAD missing');
 assert.match(identity.githubRunId||'',/^[1-9][0-9]*$/,'GitHub run ID missing');assert.match(identity.githubRunAttempt||'',/^[1-9][0-9]*$/,'GitHub run attempt missing');
}
export function verifyManifest(gallery,pins,harnessRoot,{allowUnfrozen=false}={}) {
 assert.equal(pins.schema,VERSION,'Pin schema mismatch');
 exactSet(Object.keys(pins.assets||{}),ASSETS,'asset manifest');exactSet(Object.keys(pins.harness||{}),HARNESS,'harness manifest');
 assert(!Object.hasOwn(pins,'candidate'),'Use reconstructionBaseCommit and bundleSHA256, not a candidate Git commit');
 if(!allowUnfrozen)assertSourceIdentity(pins);
 const result={schema:VERSION,reconstructionBaseCommit:pins.reconstructionBaseCommit??null,bundleSHA256:pins.bundleSHA256??null,assets:{},harness:{},frozen:pins.frozen===true};
 for(const [group,base] of [['assets',dirname(gallery)],['harness',harnessRoot]])for(const [name,wanted] of Object.entries(pins[group])){
  if(wanted===null&&allowUnfrozen){result[group][name]=null;continue;}
  assert.match(wanted||'',/^[0-9a-f]{64}$/,`${group}/${name}: final SHA256 missing`);
  const hash=sha256(join(base,name));assert.equal(hash,wanted,`${group}/${name}: SHA256 mismatch`);result[group][name]=hash;
 }
 return result;
}

const issue=(kind,reason)=>({kind,reason});
export function linkedBoundary(action,accepted) {
 if(!accepted||accepted.actionId!==action.id||accepted.phase!=='post-production-stage-bubble'||accepted.type!=='click'||accepted.trusted!==true)return null;
 const event=action.events?.find(e=>e.eventId===accepted.eventId);
 if(!event||event.actionId!==action.id||event.type!=='click'||event.trusted!==true||event.eventAt!==accepted.eventAt||event.control!==accepted.control)return null;
 return event;
}
function focusCue(paint) {
 try {
  const cue=paint.cue,model=effectivePaint(paint);if(model.status!=='modeled-only')return false;
  const backgrounds=model.samples.map(s=>s.background);
  const solidOutline=parseFloat(cue.outlineWidth)>=2&&cue.outlineStyle!=='none'&&backgrounds.every(background=>contrast(parseColor(cue.outlineColor),background)>=3);
  const color=/rgba?\([^)]*\)|color\(srgb\s+[^)]*\)/.exec(cue.boxShadow)?.[0];
  const shadowRest=color?cue.boxShadow.replace(color,'').replace(/inset/g,'').trim().split(/\s+/).map(Number.parseFloat):[];
  const solidInset=!!color&&cue.boxShadow.includes('inset')&&shadowRest.length>=4&&shadowRest[0]===0&&shadowRest[1]===0&&shadowRest[2]===0&&shadowRest[3]>=2&&backgrounds.every(background=>contrast(parseColor(color),background)>=3);
  return solidOutline||solidInset||model.samples.every(s=>s.backgroundCueRatio>=3);
 }catch{return false;}
}
export function immediateIssues(state,expectedFocus) {
 const issues=[],bad=(ok,reason)=>{if(!ok)issues.push(issue('immediate-semantics',reason));};
 bad(state?.menu?.open===true&&state.menu.presentationOpen===true&&state.menu.nativeOpen===true&&state.menu.inert===false&&state.menu.ariaHidden!=='true','Open native popover with accessible enabled semantics required');
 bad(state?.trigger?.expanded==='true'&&state.trigger.hit===true,'Original trigger must remain expanded and own its original point');
 bad(state?.focus===expectedFocus,'Expected immediate focus owner missing');
 bad(state?.items?.length===3&&state.items.map(x=>x.action).join(',')==='rename,duplicate,delete','Exact action set missing');
 bad(state?.geometry?.status==='measured-axis-aligned-intersection','Menu clip geometry unverified');
 for(const item of state?.items||[]){
  const paint=item.paint,model=effectivePaint(paint);
  bad(paint?.glyphs?.length>0&&paint.glyphs.every(g=>rectInside(g,state.geometry?.rect)),'Action glyphs not wholly inside measured Menu clip');
  bad(model.status==='modeled-only'&&model.visible&&(item.disabled||Math.abs(model.effectiveOpacity-1)<.001&&model.samples.every(s=>s.ratio>=4.5)),'Enabled actions require full-opacity readable flat-paint model; unsupported effects remain unverified');
  bad(paint?.chain?.every(n=>identityValue('transform',n.transform)&&identityValue('translate',n.translate)&&identityValue('scale',n.scale)&&identityValue('rotate',n.rotate)&&identityValue('filter',n.filter)),'Menu/action ancestor movement or blur survives instant acceptance');
  if(expectedFocus===`action:${item.action}`)bad(paint.focused&&paint.focusVisible&&focusCue(paint),'Focused item needs a measured strong visible focus cue');
 }
 bad(!(state?.animations||[]).some(a=>a.owner==='menu'&&(a.pending||a.playState==='running')),'Menu animation owner survives instant acceptance');
 return issues;
}
export function firstPaintResult(action,expectedFocus) {
 const accepted=action.accepted?.find(e=>e.type==='click'&&e.control===action.targetControl),event=linkedBoundary(action,accepted),first=action.firstRAF;
 const issues=[];
 if(!event||!first||first.actionId!==action.id||first.eventId!==event.eventId||first.sequence!==1)issues.push(issue('first-paint-provenance','Missing exact post-production accepted click → first selected rAF linkage'));
 if(event&&first){
  try{
   assertSnapshot(accepted.state,'accepted first-paint state');assertSnapshot(first.state,'first-rAF state');
   assert(Number.isFinite(first.rafTimestamp),'Native rAF timestamp is missing');
   for(const row of [accepted,first])assert(row.state.snapshotStartedAt>=row.snapshotStartedAt&&row.state.snapshotCompletedAt<=row.snapshotCompletedAt,'Actual state lies outside its measured wrapper interval');
  }catch(error){issues.push(issue('first-paint-state-clock',String(error)));}
  const times=[accepted.observerAt,accepted.snapshotStartedAt,accepted.snapshotCompletedAt,first.callbackAt,first.snapshotStartedAt,first.snapshotCompletedAt];
  if(times.some(t=>!Number.isFinite(t)||t<event.eventAt||t-event.eventAt>50))issues.push(issue('first-paint-window','Actual acceptance and first callback/snapshot completion must all be within 0–50ms of capture; late measurements remain unverified'));
  if(!(accepted.observerAt<=accepted.snapshotStartedAt&&accepted.snapshotStartedAt<=accepted.snapshotCompletedAt&&accepted.snapshotCompletedAt<=first.callbackAt&&first.callbackAt<=first.snapshotStartedAt&&first.snapshotStartedAt<=first.snapshotCompletedAt))issues.push(issue('first-paint-clock','Measurement clocks are nonmonotonic'));
  if(action.mode==='keyboard'&&!action.events.some(e=>e.trusted&&e.control===event.control&&e.type==='keydown'&&['Enter',' '].includes(e.key)&&e.eventAt<=event.eventAt)||action.mode==='keyboard'&&event.detail!==0)issues.push(issue('first-paint-input','Keyboard click must come from the target-owned trusted activation key'));
  if(action.mode==='pointer'&&(event.detail<=0||!action.events.some(e=>e.trusted&&e.control===event.control&&e.type==='pointerdown'&&e.eventAt<=event.eventAt)))issues.push(issue('first-paint-input','Pointer click must follow target-owned trusted pointerdown'));
  issues.push(...immediateIssues(accepted.state,expectedFocus).map(i=>({...i,boundary:'accepted'})),...immediateIssues(first.state,expectedFocus).map(i=>({...i,boundary:'first-raf'})));
 }
 return {status:issues.length?'unverified':'native-contract-observed',issues,inputEventId:event?.eventId??null,acceptedDeltaMs:event?accepted.snapshotCompletedAt-event.eventAt:null,firstCallbackDeltaMs:event&&first?first.callbackAt-event.eventAt:null,firstCompletionDeltaMs:event&&first?first.snapshotCompletedAt-event.eventAt:null,interpretation:'Actual pre-paint observations only; no native pixels, exact media alignment, frame completeness, or visual score is certified'};
}
export function progressed(snapshot) {
 return (snapshot?.animations||[]).some(a=>a.owner==='menu'&&a.target==='menu'&&a.pseudo===null&&a.properties?.includes('transform')&&a.playState==='running'&&a.pending===false&&Number.isFinite(a.currentTime)&&a.currentTime>0&&Number.isFinite(a.progress)&&a.progress>0&&a.progress<1);
}
export const closeState=s=>s.menu.open===false&&s.menu.presentationOpen===false&&s.menu.nativeOpen===false&&s.menu.inert===true&&s.rows.every(r=>r.expanded==='false');
export const parentOpen=s=>s.stageOwner==='detail'&&s.hash==='#t/menu'&&s.parent.nativeOpen===true&&s.parent.modal===true&&s.parent.presentation==='true'&&!s.parent.hidden&&!s.parent.inert&&s.parent.display!=='none'&&s.parent.visibility==='visible';
export function assertSnapshot(s,label='snapshot') {
 assert(s&&Number.isFinite(s.snapshotStartedAt)&&Number.isFinite(s.snapshotCompletedAt)&&s.snapshotCompletedAt>=s.snapshotStartedAt,`${label}: actual snapshot clocks required`);
 assert(Array.isArray(s.rows)&&new Set(s.rows.map(r=>r.id)).size===s.rows.length&&s.rows.every(r=>typeof r.id==='string'&&typeof r.name==='string'),`${label}: rendered rows required`);
 assert(typeof s.focus==='string'&&typeof s.count==='string'&&s.menu&&['open','presentationOpen','nativeOpen','inert'].every(k=>typeof s.menu[k]==='boolean'),`${label}: explicit logical/presentation/native Menu semantics required`);
 const expanded=s.rows.filter(r=>r.expanded==='true');assert(expanded.length<=1&&s.rows.every(r=>['true','false'].includes(r.expanded)),`${label}: expanded trigger inventory invalid`);
 assert.equal(s.menu.open,expanded.length===1,`${label}: logical state disagrees with expanded trigger`);
 if(s.menu.open)assert(!s.menu.inert&&s.menu.presentationOpen,`${label}: logical open lacks enabled presentation`);
 assert(s.trigger&&typeof s.trigger.exists==='boolean',`${label}: originating trigger presence evidence required`);
 const origin=s.rows.find(row=>row.id===s.trigger.row);
 if(s.trigger.exists){assert(origin&&s.trigger.expanded===origin.expanded,`${label}: connected origin trigger signals disagree`);assert.equal(s.menu.logicalStateSource,'connected-trigger-inventory',`${label}: logical signal provenance missing`);if(s.menu.open)assert.equal(s.trigger.expanded,'true',`${label}: active Menu belongs to another trigger`);}
 else {assert(!origin&&s.trigger.expanded===null,`${label}: absent origin must not fabricate aria-expanded`);assert.equal(s.menu.logicalStateSource,'no-connected-origin-trigger',`${label}: missing-origin provenance required`);assert(closeState(s),`${label}: missing origin is allowed only after complete native/presentation retirement`);}
 assert(s.editor&&typeof s.editor.open==='boolean'&&s.parent&&typeof s.parent.nativeOpen==='boolean'&&Array.isArray(s.animations),`${label}: native ownership/animation inventory required`);
 return s;
}
const semanticState=s=>({rows:s.rows.map(r=>[r.id,r.name]),count:s.count,statusText:s.statusText,budgetText:s.budgetText,recovery:s.recovery,empty:s.empty,focus:s.focus,editor:{open:s.editor.open,modal:s.editor.modal,value:s.editor.value,error:s.editor.error,errorVisible:s.editor.errorVisible,invalid:s.editor.invalid},menu:{open:s.menu.open,presentationOpen:s.menu.presentationOpen,nativeOpen:s.menu.nativeOpen,inert:s.menu.inert},stageOwner:s.stageOwner,hash:s.hash,search:s.search,menuCard:s.menuCard?{hidden:s.menuCard.hidden,containsStage:s.menuCard.containsStage}:undefined});
export function assertAccepted(a,event,phases) {
 const accepted=a.accepted?.find(row=>row.eventId===event.eventId&&phases.includes(row.phase));
 assert(accepted,`Missing post-production observation of event ${event.eventId}`);
 for(const k of ['actionId','eventId','eventAt','type','control','trusted'])assert.equal(accepted[k],event[k],`Accepted event ${k} mismatch`);
 assert([accepted.observerAt,accepted.snapshotStartedAt,accepted.snapshotCompletedAt].every(Number.isFinite)&&accepted.observerAt>=event.captureCompletedAt&&accepted.snapshotStartedAt>=accepted.observerAt&&accepted.snapshotCompletedAt>=accepted.snapshotStartedAt,'Accepted clocks must follow original capture');
 const s=assertSnapshot(accepted.state,'accepted state');assert(s.snapshotStartedAt>=accepted.snapshotStartedAt&&s.snapshotCompletedAt<=accepted.snapshotCompletedAt,'Accepted state must lie inside its measured snapshot interval');
 return accepted;
}
function primaryEvent(a,{type,control,key}) {
 const e=a.events?.find(e=>e.type===type&&e.control===control&&(key===undefined||e.key===key)&&e.trusted===true);
 assert(e,`Missing trusted ${type} owned by ${control}`);return e;
}
export function assertCallbackEvidence(a) {
 const c=a.callbackEvidence;assert.equal(c?.kind,'controlled-production-API-callback');assert.equal(c.actionId,a.id,'Callback action identity mismatch');
 const events=a.events.filter(e=>e.type==='beforetoggle'&&e.control==='menu');assert.equal(events.length,2,'Exactly native opening and retirement beforetoggle events required');
 assert.equal(c.beforetoggle?.length,2,'Exactly two callback observations required');assert.equal(c.closeCalls,1,'Exactly one host instant-close call required');
 for(let i=0;i<2;i++){
  const e=events[i],row=c.beforetoggle[i];assert(e.trusted===true&&row.trusted===true,'Native beforetoggle must be trusted');
  for(const k of ['actionId','eventId','eventAt','type','control','oldState','newState'])assert.equal(row[k],e[k],`Callback ${i} ${k} mismatch`);
  assert.deepEqual([e.oldState,e.newState],i===0?['closed','open']:['open','closed'],'Native callback order changed');
  assert(Number.isFinite(row.callbackAt)&&row.callbackAt>=e.captureCompletedAt);assertSnapshot(row.state,'callback entry');
  assert(row.state.snapshotStartedAt>=row.callbackAt);
 }
 const opening=c.beforetoggle[0],retirement=c.beforetoggle[1];
 assert(opening.state.menu.open&&!opening.state.menu.nativeOpen&&!opening.state.menu.inert,'Opening callback must precede native visibility');
 assertSnapshot(c.afterClose,'after host close');assert(closeState(c.afterClose),'Host close must retire managed state synchronously');
 assert(retirement.state.menu.nativeOpen&&!retirement.state.menu.open&&retirement.state.menu.inert,'Native retirement must follow the completed managed close');
 assertSnapshot(c.sync,'post-open return');assertSnapshot(c.firstRAF?.state,'callback first rAF');
 assert(c.firstRAF.actionId===a.id&&c.firstRAF.sequence===1&&Number.isFinite(c.firstRAF.rafTimestamp),'Actual first callback rAF identity required');
 const clocks=[c.requestedAt,opening.eventAt,opening.callbackAt,opening.state.snapshotCompletedAt,c.closeRequestedAt,c.closeReturnedAt,c.afterClose.snapshotStartedAt,c.afterClose.snapshotCompletedAt,retirement.eventAt,retirement.callbackAt,retirement.state.snapshotCompletedAt,c.returnedAt,c.sync.snapshotStartedAt,c.sync.snapshotCompletedAt,c.firstRAF.callbackAt,c.firstRAF.state.snapshotStartedAt,c.firstRAF.state.snapshotCompletedAt];
 assert(clocks.every(Number.isFinite)&&clocks.every((t,i)=>i===0||t>=clocks[i-1]),'Native callback/host-return/first-rAF order is invalid');
 for(const s of [c.afterClose,c.sync,c.firstRAF.state])assert(closeState(s)&&!s.animations.some(x=>x.owner==='menu'),'Callback close leaves native/managed ownership or Menu motion');
}
// Same evidence validation runs during live collection and after all close/error boundaries.
// Status labels and cached predicate results never supply missing native evidence.
export function assertStepEvidence(step,a,audit) {
 assert.equal(a.id,`${audit.id}/${step.id}`);assert.equal(a.stepId,step.id);assert.equal(a.op,step.op);assert(!a.overflow,'Action trace overflow');
 if(step.mode)assert.equal(a.mode,step.mode,'Declared native input mode mismatch');
 assertSnapshot(a.before,'before action');assertSnapshot(a.after,'after action');
 if(audit.lastRows)assert.deepEqual(a.before.rows.map(row=>[row.id,row.name]),audit.lastRows,'Committed file state changed between recorded actions');
 assert(Number.isFinite(a.requestedAt)&&a.before.snapshotStartedAt>=a.requestedAt&&a.after.snapshotStartedAt>=a.before.snapshotCompletedAt,'Action snapshot order invalid');
 assert(Array.isArray(a.events)&&Array.isArray(a.accepted),'Native input/accepted inventories required');
 const ids=new Set();for(const e of a.events){assert(!ids.has(e.eventId)&&Number.isInteger(e.eventId)&&e.actionId===a.id,'Input event identity is missing/duplicated');ids.add(e.eventId);assert(Number.isFinite(e.eventAt)&&Number.isFinite(e.captureCompletedAt)&&Number.isFinite(e.nativeTimeStamp)&&e.eventAt>=a.requestedAt&&e.captureCompletedAt>=e.eventAt&&e.eventAt<=a.after.snapshotCompletedAt,'Input capture clocks invalid');}
 if(step.settle!==false){
  const s=a.settlement;assert(s?.status==='native-finite-settlement-observed'&&Number.isFinite(s.rafAt)&&Number.isFinite(s.elapsedMs),'Actual native settlement evidence missing');assertSnapshot(s.state,'settlement state');
  assert(s.state.snapshotStartedAt>=a.before.snapshotCompletedAt&&s.state.snapshotCompletedAt<=a.after.snapshotStartedAt,'Settlement snapshot order invalid');
  assert(!s.state.animations.some(x=>x.pending||x.playState==='running'||x.iterations===null||x.playState==='finished'&&['forwards','both'].includes(x.fill)),'Settlement inventory still owns pending/running/unknown/held motion');
 }
 let primary,accepted;
 const isClick=['open','activate','original-click','blur'].includes(step.op)||step.op==='interrupt'&&step.input==='original-click';
 if(isClick){
  const control=['open','original-click'].includes(step.op)||step.op==='interrupt'?`trigger:${step.row}`:step.op==='blur'?'blur':step.control;
  if(step.op!=='blur')assert.equal(a.targetControl,control,'Intended click owner mismatch');
  primary=primaryEvent(a,{type:'click',control});
  if(step.mode==='keyboard'){
   assert.equal(a.mode,'keyboard');assert.equal(primary.detail,0);const key=primaryEvent(a,{type:'keydown',control,key:step.key==='Space'?' ':step.key||'Enter'});assert(key.eventAt<=primary.eventAt,'Keyboard activation order invalid');
  }else{
   assert(primary.detail>0,'Pointer activation must be a pointer click');const down=primaryEvent(a,{type:'pointerdown',control}),up=primaryEvent(a,{type:'pointerup',control});assert(down.eventAt<=up.eventAt&&up.eventAt<=primary.eventAt,'Native pointer down/up/click order invalid');
  }
  accepted=assertAccepted(a,primary,[['detail','blur'].includes(control)?'post-production-document-bubble':'post-production-stage-bubble']);
  if(step.op==='open'){assert(accepted.state.menu.open&&accepted.state.menu.nativeOpen&&!accepted.state.menu.inert&&accepted.state.trigger.expanded==='true'&&accepted.state.trigger.hit,'Post-handler native open was not accepted');assert.equal(accepted.state.trigger.row,step.row);audit.originalPoints??={};audit.originalPoints[step.row]=a.originalPoint;}
  if(step.op==='original-click'||step.op==='interrupt'&&step.input==='original-click'){assert.deepEqual(a.originalPoint,audit.originalPoints?.[step.row],'Original pointer point is not the opening point');assert(a.before.trigger.hit,'Original point hit owner missing');}
  if(step.op==='activate'&&['action:rename','action:duplicate','action:delete','cancel','undo','reset'].includes(control)){assert(closeState(accepted.state),'Host handoff must synchronously retire Menu');assert.deepEqual(semanticState(accepted.state),semanticState(a.after),'Post-production result changed before settlement');}
  if(step.op==='activate'&&control==='save'){const submit=primaryEvent(a,{type:'submit',control:'editor-form'});assert(submit.eventAt>=primary.eventAt,'Submit preceded activation click');const observed=assertAccepted(a,submit,['post-production-editor-submit']);assert.deepEqual(semanticState(observed.state),semanticState(a.after),'Accepted submit outcome changed before settlement');}
 }
 if(step.op==='key'||step.op==='interrupt'&&step.input==='key'){
  assert(a.before.focus!=='outside','Keyboard owner is unavailable');primary=primaryEvent(a,{type:'keydown',control:a.before.focus,key:step.key});
  accepted=assertAccepted(a,primary,step.key==='Escape'&&a.before.editor.open?['editor-keydown-before-native-default']:['post-production-document-keydown','post-production-stage-keydown']);
  if(step.key==='Escape'&&a.before.editor.open){const native=primaryEvent(a,{type:'cancel',control:'editor'});assert(native.eventAt>=primary.eventAt,'Native editor cancellation preceded Escape');assertAccepted({...a,accepted:a.lifecycle},native,['native-dialog-lifecycle']);}
  if(step.check==='parent-escape'){const native=a.events.find(e=>e.trusted&&e.control==='parent'&&['cancel','close'].includes(e.type));assert(native&&native.eventAt>=primary.eventAt,'Native parent lifecycle must follow its own Escape');assertAccepted({...a,accepted:a.lifecycle},native,['native-dialog-lifecycle']);}
 }
 if(step.op==='type'){primary=primaryEvent(a,{type:'input',control:'editor-input'});assertAccepted(a,primary,['post-production-stage-input']);assert.equal(a.after.editor.value,step.value,'Actual input value differs');}
 if(step.op==='reach'){assert.equal(a.targetControl,step.control);assert(a.events.some(e=>e.trusted&&e.type==='keydown'&&e.key==='Tab'),'Settled reach requires actual trusted Tab traversal');assert.equal(a.after.focus,step.control,'Actual keyboard reach did not focus intended control');}
 if(step.op==='search'){
  assert.equal(a.before.focus,'search','Search input must follow a real focus handoff');primary=primaryEvent(a,{type:'input',control:'search'});assert.equal(primary.value,step.value,'Trusted Search input value mismatch');accepted=assertAccepted(a,primary,['post-production-document-input']);assert.equal(accepted.state.search?.value,step.value);assert.equal(a.after.search?.value,step.value);
 }
 if(step.op==='blur')assert(a.after.blur?.checked===step.on&&a.after.blur?.rootOn===step.on,'Native Blur preference mismatch');
 if(step.op==='observe-duration')assert(a.after.snapshotStartedAt-a.before.snapshotCompletedAt>=step.durationMs,'Native persistence observation was shorter than requested');
 if(step.op==='callback')assertCallbackEvidence(a);
 if(step.op==='interrupt'){
  assert(primary&&progressed(primary.interruptionState),'Actual input was not inside a positive nonpending native Menu transform');
  assertSnapshot(primary.interruptionState,'interruption');assert(primary.interruptionState.snapshotStartedAt>=primary.eventAt&&primary.interruptionState.snapshotCompletedAt<=primary.captureCompletedAt,'Interruption state is not inside its capture boundary');
  assert.equal(primary.interruptionState.menu.open,step.direction==='entry','Interruption did not occur in the required entry/exit phase');
  assert.equal(a.progressEvidence?.eventId,primary.eventId,'Positive progress evidence is not linked to actual dispatch');assert.deepEqual(a.progressEvidence.state,primary.interruptionState);
  const open=step.direction==='exit'||step.key==='ArrowDown';assert.equal(accepted.state.menu.open,open,'Interruption did not publish requested logical state');assert.equal(accepted.state.menu.inert,!open);
  assert.equal(accepted.state.trigger.expanded,String(open),'Interruption expanded trigger disagrees with accepted logical state');
  if(step.input==='original-click'){
   assert(primary.interruptionState.menu.presentationOpen&&primary.interruptionState.menu.nativeOpen,'Pointer interruption lost its native presentation');
   assert(accepted.state.menu.presentationOpen&&accepted.state.menu.nativeOpen,'Pointer reversal must retain native outgoing/incoming presentation');
   assert(accepted.state.animations.some(x=>x.owner==='menu'&&x.target==='menu'&&x.pseudo===null&&x.properties?.includes('transform')&&(x.pending||x.playState==='running')),'Pointer interruption must retain a real owned transform');
  }
 }
 if(primary){assert(primary.eventAt>=a.before.snapshotCompletedAt,'Input preceded prepared snapshot');if(accepted)assert(accepted.snapshotCompletedAt<=a.after.snapshotStartedAt,'Accepted snapshot followed terminal snapshot');}
 assertStepOutcome(step,a,audit);
 if(typographyPlan(audit.profile).includes(step.id))assertSettledTypography(a.settledTypography,a,audit.profile);
 if(step.check==='undo-visible')assert(a.settledTypography.rows.some(r=>r.selector==='.menu-demo [data-menu-undo]'),'Reached Undo still lacks unchanged visible typography evidence');
 if(step.check==='undo')assertPostUndoFocusEvidence(step,a,audit.deleted.length);
 audit.lastRows=a.after.rows.map(row=>[row.id,row.name]);
}

function postUndoCueBounds(paint){
 const model=effectivePaint(paint),cue=paint.cue,r=paint.rect,result=[],backgrounds=model.samples?.map(s=>s.background)||[];
 const strong=color=>{try{const c=parseColor(color);return c[3]===1&&backgrounds.length>0&&backgrounds.every(bg=>contrast(c,bg)>=3);}catch{return false;}};
 const width=Number.parseFloat(cue?.outlineWidth),offset=Number.parseFloat(cue?.outlineOffset);
 if(width>=2&&Number.isFinite(offset)&&['solid','double','dotted','dashed'].includes(cue.outlineStyle)&&strong(cue.outlineColor)){
  const outward=Math.max(0,width+offset);result.push({left:r.left-outward,top:r.top-outward,right:r.right+outward,bottom:r.bottom+outward,width:r.width+outward*2,height:r.height+outward*2});
 }
 const color=/rgba?\([^)]*\)|color\(srgb\s+[^)]*\)/.exec(cue?.boxShadow||'')?.[0];
 const shadow=color?cue.boxShadow.replace(color,'').replace(/inset/g,'').trim().split(/\s+/).map(Number.parseFloat):[];
 if(color&&cue.boxShadow.includes('inset')&&shadow.length===4&&shadow[0]===0&&shadow[1]===0&&shadow[2]===0&&shadow[3]>=2&&strong(color))result.push(r);
 return result;
}
export function assertPostUndoFocusEvidence(step,a,remainingDeletes){
 assert(step.check==='undo'&&Number.isInteger(remainingDeletes)&&remainingDeletes>=0,'Post-Undo guard requires the observed remaining deletion count');
 assert(['keyboard','pointer'].includes(step.mode)&&a.mode===step.mode,'Post-Undo input mode missing');
 const click=primaryEvent(a,{type:'click',control:'undo'}),key=step.mode==='keyboard'?a.events.find(e=>e.type==='keydown'&&e.control==='undo'&&e.trusted&&['Enter',' '].includes(e.key)&&e.eventAt<=click.eventAt):null;
 assert(step.mode==='keyboard'?click.detail===0&&!!key:click.detail>0,'Post-Undo focus requirement must follow actual trusted activation');
 const inputEvidence={mode:step.mode,focusCueRequired:step.mode==='keyboard',clickEventId:click.eventId,clickTrusted:true,clickDetail:click.detail,keyEventId:key?.eventId??null};
 const expected=remainingDeletes>0?'undo':`trigger:${step.row}`,accepted=assertAccepted(a,click,['post-production-stage-bubble']);
 assert.equal(accepted.state.focus,expected,'Undo must immediately retain recovery focus or reveal the final restored row');
 assert.equal(accepted.state.recovery.visible,remainingDeletes>0,'Accepted recovery state differs from remaining observed deletions');
 assert.equal(accepted.state.recovery.undoVisible,remainingDeletes>0,'Accepted Undo availability differs from remaining observed deletions');
 if(remainingDeletes===0){
  const trigger=accepted.state.trigger,viewport={left:0,top:0,right:accepted.state.viewport.width,bottom:accepted.state.viewport.height};
  assert(trigger.exists&&trigger.row===step.row&&rectInside(trigger.rect,viewport),'Final Undo must reveal the restored trigger at acceptance');
  // trigger.hit is deliberately not used: it may refer to an earlier action point.
 }
 const s=a.settledUndoFocus;
 assert(s&&s.actionId===a.id&&s.row===step.row&&s.phase==='settled-post-undo-focus'&&s.actionInactive===true,'Missing separate post-Undo focus sample');
 assert(Number.isFinite(s.sampleStartedAt)&&Number.isFinite(s.sampleCompletedAt)&&s.sampleStartedAt>=a.after.snapshotCompletedAt&&s.sampleCompletedAt>=s.sampleStartedAt,'Post-Undo sample must follow the finished action');
 assert.equal(s.remainingDeletes,remainingDeletes);assert.deepEqual(s.inputEvidence,inputEvidence,'Post-Undo cue requirement lacks linked trusted input');
 assert(s.exists&&s.connected&&s.targetControl===expected&&s.focus===expected&&s.paint?.focused===true,'Post-Undo focus sample has the wrong or disconnected target');
 assert(s.viewport&&s.viewport.left===0&&s.viewport.top===0&&s.viewport.width===a.after.viewport.width&&s.viewport.height===a.after.viewport.height&&s.viewport.right===s.viewport.width&&s.viewport.bottom===s.viewport.height,'Post-Undo viewport mismatch');
 assert(Array.isArray(s.clipAncestors)&&s.clipAncestors.length>0,'Post-Undo ancestor clip inventory missing');
 const base={node:'viewport',rect:s.viewport,offsetWidth:s.viewport.width,offsetHeight:s.viewport.height,clientLeft:0,clientTop:0,clientWidth:s.viewport.width,clientHeight:s.viewport.height,axisAligned:true,unsupportedClip:false};
 assert.deepEqual(s.geometry,nativeClipGeometry(base,s.clipAncestors,s.viewport),'Post-Undo clip differs from measured ancestor geometry');
 assert(s.geometry.status==='measured-axis-aligned-intersection'&&rectInside(s.rect,s.viewport)&&rectInside(s.rect,s.geometry.rect),'Post-Undo focused control leaves viewport or ancestor scroll clip');
 assert.deepEqual(s.paint.rect,s.rect,'Post-Undo paint belongs to another rectangle');
 const model=effectivePaint(s.paint);assert(model.status==='modeled-only'&&model.visible&&Math.abs(model.effectiveOpacity-1)<.001,'Post-Undo target is hidden, faded or has unsupported paint');
 assert(Array.isArray(s.paint.glyphs)&&s.paint.glyphs.length>0&&s.paint.glyphs.every(g=>rectInside(g,s.rect)&&rectInside(g,s.geometry.rect)),'Post-Undo target ink is missing or clipped');
 assert(model.samples.every(sample=>sample.ratio>=(remainingDeletes>0?4.5:3)),'Post-Undo label/icon paint is not distinguishable on its actual surface');
 assert(s.paint.chain.every(n=>identityValue('transform',n.transform)&&identityValue('translate',n.translate)&&identityValue('scale',n.scale)&&identityValue('rotate',n.rotate)),'Post-Undo target/ancestor movement prevents a settled cue measurement');
 const center={x:s.rect.left+s.rect.width/2,y:s.rect.top+s.rect.height/2};
 assert(s.currentCenter?.source==='current-focus-target-center'&&s.currentCenter.role==='center'&&Number.isFinite(s.currentCenter.measuredAt)&&s.currentCenter.measuredAt>=s.sampleStartedAt&&s.currentCenter.measuredAt<=s.sampleCompletedAt,'Post-Undo current-center provenance missing');
 assert.deepEqual(s.currentCenter.point,center,'Post-Undo hit point is not the actual current center');assert(s.currentCenter.hit===true&&s.currentCenter.hitControl===expected,'Post-Undo current center is occluded or owned by another control');
 const edges=[['top',{x:center.x,y:s.rect.top+1}],['right',{x:s.rect.right-1,y:center.y}],['bottom',{x:center.x,y:s.rect.bottom-1}],['left',{x:s.rect.left+1,y:center.y}]];
 assert(Array.isArray(s.edgeHits)&&s.edgeHits.length===edges.length,'Post-Undo edge hit inventory missing');
 edges.forEach(([role,point],i)=>{const hit=s.edgeHits[i];assert.equal(hit.role,role);assert.deepEqual(hit.point,point);assert(hit.hit===true&&hit.hitControl===expected,'Post-Undo focus target is partially occluded');});
 if(inputEvidence.focusCueRequired){assert(s.paint.focusVisible===true,'Keyboard Undo needs an actual visible focus state');assert(postUndoCueBounds(s.paint).some(bounds=>rectInside(bounds,s.viewport)&&rectInside(bounds,s.geometry.rect)),'Keyboard Undo needs a strong visible focus cue wholly inside viewport/scroll clip');}
}
export function assertSettledTypography(sample,action,profile) {
 assert(sample&&sample.actionId===action.id&&sample.phase==='settled-phone-typography'&&sample.actionInactive===true,'Settled typography must be separate from active input/rAF observation');
 assert(sample.viewportWidth===profile.width&&Number.isFinite(sample.sampleStartedAt)&&Number.isFinite(sample.sampleCompletedAt)&&sample.sampleStartedAt>=action.after.snapshotCompletedAt&&sample.sampleCompletedAt>=sample.sampleStartedAt,'Settled typography clocks/profile mismatch');
 assert(Array.isArray(sample.rows)&&sample.rows.length>0&&!sample.overflow,'Visible phone text sample missing/overflowed');
 for(const row of sample.rows){
  const target=PHONE_TEXT_TARGETS.find(t=>t.selector===row.selector);assert(target&&row.text&&Number.isFinite(row.fontSize)&&row.fontSize>=target.minFontSize-.01,`Phone text floor failed: ${row.selector}`);
  assert(Array.isArray(row.paintChain)&&row.paintChain.length>0&&row.paintChain.every(s=>s.display!=='none'&&s.visibility==='visible'&&Number.isFinite(Number(s.opacity))&&Number(s.opacity)>0),`Phone text paint inventory missing/hidden: ${row.selector}`);
  assert(rectInside(row.rect,row.containerRect,1)&&row.rect.left>=-1&&row.rect.right<=profile.width+1,`Phone control/text leaves container: ${row.selector}`);
  assert(rectInside(row.rect,row.visibleClip,1),`Phone sample is outside its visible scroll region: ${row.selector}`);
  assert(Array.isArray(row.glyphs)&&(row.selector==='#menu-rename input'||row.glyphs.length>0&&row.glyphs.every(g=>rectInside(g,row.rect,1))),`Phone glyph bounds are missing/clipped: ${row.selector}`);
  if(row.topLayer)assert(row.rect.top>=-1&&row.rect.bottom<=profile.height+1,`Phone top-layer leaf leaves viewport: ${row.selector}`);
  assert(row.painted===true&&row.fits===true,`Phone text is clipped or unpainted: ${row.selector}`);
 }
}
export function assertStepOutcome(step,a,run){
 const before=a.before,s=a.after,check=step.check;
 assert(s,'Actual native final snapshot required');
 assert.equal(s.count,`${s.rows.length} ${s.rows.length===1?'file':'files'}`,'Visible row count disagrees with rendered list');
 assert(s.rows.every(r=>r.nameFits),'A rendered row name overflows its own row');
 assert(s.rows.every(r=>r.accessibleName===`More actions for ${r.name}`),'Trigger name must track committed rendered file name');
 if(step.op==='open'){
  assert(s.menu.open&&s.menu.nativeOpen&&!s.menu.inert,'Native Menu did not open');assert.equal(s.trigger.expanded,'true');assert.equal(s.trigger.hit,true,'Original trigger hit ownership lost');
  exactSet(s.items.map(i=>i.action),['rename','duplicate','delete'],'Menu action set');
  if(step.instant){a.firstPaint=firstPaintResult(a,step.mode==='keyboard'?'action:rename':'menu');assert.equal(a.firstPaint.status,'native-contract-observed','First accepted/first-rAF instant semantics incomplete');}
 }
 if(check==='initial'||check==='reset'){
  assert.deepEqual(s.rows.map(r=>[r.id,r.name]),[['roadmap','Q3 roadmap'],['hiring','Hiring plan']]);assert.match(s.budgetText,/0 of 2/);assert(!s.recovery.visible&&!s.editor.open&&!s.editor.errorVisible&&s.editor.value==='');if(check==='reset')assert.equal(s.focus,'reset');
 }
 if(check==='callback-closed'){assertCallbackEvidence(a);assert(closeState(s));}
 if(check==='placed'){
  const t=s.trigger.rect,m=s.menu.rect,v=s.viewport,expectedX=Math.max(8,Math.min(t.right-m.width,v.width-m.width-8));
  const expectedY=Math.max(8,Math.min(s.menu.side==='top'?t.top-6-m.height:t.bottom+6,v.height-m.height-8));
  assert(Math.abs(m.left-expectedX)<=1&&Math.abs(m.top-expectedY)<=1,'Native placement differs from trigger-end anchor/6px gap and viewport clamp');
  assert(m.left>=7.5&&m.right<=v.width-7.5&&m.top>=7.5&&m.bottom<=v.height-7.5,'Menu not fully within viewport gutter');
  assert.equal(s.trigger.hit,true,'Original pointer target is covered');
 }
 if(check==='closed'||check==='closed-focus'){assert(closeState(s),'Closed Menu retains native or interactive ownership');if(check==='closed-focus')assert.equal(s.focus,`trigger:${step.row}`);}
 if(check==='takeover'){const accepted=a.accepted.find(e=>e.type==='keydown'&&e.key==='ArrowDown'&&e.phase==='post-production-document-keydown');assert(accepted,'Post-production keyboard takeover missing');assert.deepEqual(immediateIssues(accepted.state,'action:rename'),[],'Keyboard takeover must be immediately readable/focused');}
 if(check==='editor-open'){assert(closeState(s),'Host task begins only after synchronous Menu retirement');assert(s.editor.open&&s.editor.modal);assert.equal(s.focus,'editor-input');assert.equal(s.editor.value,s.rows.find(r=>r.id===step.row).name);assert(!s.editor.errorVisible);const accepted=a.accepted.find(e=>e.type==='click'&&e.control==='action:rename');assert(accepted&&closeState(accepted.state)&&accepted.state.editor.open&&accepted.state.focus==='editor-input','Post-handler Rename must already own focus with Menu retired');}
 if(check==='renamed'){assert.equal(s.rows.find(r=>r.id===step.row).name,step.name);assert(!s.editor.open&&!s.editor.errorVisible&&s.editor.value==='');assert.equal(s.focus,`trigger:${step.row}`);assert.match(s.statusText,/Renamed|unchanged/);}
 if(check==='editor-cancel'||check==='editor-cancel-parent'){assert.deepEqual(s.rows.map(r=>[r.id,r.name]),before.rows.map(r=>[r.id,r.name]));assert(!s.editor.open&&!s.editor.errorVisible&&s.editor.value==='');assert.equal(s.focus,`trigger:${step.row}`);if(check==='editor-cancel-parent')assert(parentOpen(s));}
 if(check==='invalid'){assert(s.editor.open&&s.editor.modal&&s.editor.errorVisible&&s.editor.error&&s.editor.invalid==='true');assert.equal(s.focus,'editor-input');assert.deepEqual(s.rows.map(r=>[r.id,r.name]),before.rows.map(r=>[r.id,r.name]));}
 if(check==='copy1'||check==='copy2'){
  const n=check==='copy1'?1:2;assert.equal(s.rows.length,before.rows.length+1);const source=before.rows.find(r=>r.id===before.trigger.row),at=s.rows.findIndex(r=>r.id===source.id);assert.equal(s.rows[at+1].id,`copy-${n}`);assert(s.rows[at+1].name.startsWith(source.name.slice(0,Math.min(20,source.name.length))));assert.match(s.rows[at+1].name,/ copy(?: \d+)?$/);assert.match(s.budgetText,new RegExp(`${n} of 2`));assert.equal(s.focus,`trigger:${source.id}`);assert(closeState(s));
 }
 if(check==='limit'){assert.equal(s.items.find(i=>i.action==='duplicate').disabled,true);assert(s.menu.limitVisible);assert.match(s.budgetText,/2 of 2/);}
 if(check==='focused-delete')assert.equal(s.focus,'action:delete');if(check==='focused-rename')assert.equal(s.focus,'action:rename');
 if(check==='delete'){
  const at=before.rows.findIndex(r=>r.id===step.row),remaining=before.rows.filter(r=>r.id!==step.row);assert(at>=0);assert.deepEqual(s.rows.map(r=>r.id),remaining.map(r=>r.id));assert.equal(s.focus,remaining.length?`trigger:${remaining[Math.min(at,remaining.length-1)].id}`:'reset');assert(s.recovery.visible&&s.recovery.undoVisible);assert.match(s.statusText,/Deleted/);assert(closeState(s));
  run.deleted.push({row:before.rows[at],index:at});
 }
 if(check==='empty-persistent'){assert.equal(s.rows.length,0);assert(s.empty&&s.recovery.visible&&s.recovery.undoVisible);assert.equal(s.focus,'reset');assert(a.observedDurationMs>=step.durationMs,'Persistence window not observed');}
 if(check==='undo-visible'){assert.equal(s.rows.length,0);assert(s.empty&&s.recovery.visible&&s.recovery.undoVisible);assert.equal(s.focus,'undo');assert.deepEqual(s.rows,before.rows);assert.equal(s.recovery.text,before.recovery.text);}
 if(check==='undo'){
  const last=run.deleted.at(-1);assert(last&&last.row.id===step.row);assert(before.recovery.visible&&before.recovery.undoVisible,'Undo requires an actually available recovery action');const expected=before.rows.map(r=>({id:r.id,name:r.name}));expected.splice(Math.min(last.index,expected.length),0,{id:last.row.id,name:last.row.name});assert.deepEqual(s.rows.map(r=>({id:r.id,name:r.name})),expected);const remaining=run.deleted.length-1;assert.equal(s.focus,remaining>0?'undo':`trigger:${step.row}`);assert.match(s.statusText,/Restored/);run.deleted.pop();assert.equal(s.recovery.visible,remaining>0);assert.equal(s.recovery.undoVisible,remaining>0);
 }
 if(check==='parent-open')assert(parentOpen(s));
 if(['search-focused','search-kept','search-retired','search-escape','search-restored','detail-search-blocked'].includes(check)){
  assert.deepEqual(s.rows.map(r=>[r.id,r.name]),before.rows.map(r=>[r.id,r.name]),'Search must retain committed rows');
  if(check==='detail-search-blocked'){const observed=a.accepted.find(e=>e.type==='keydown'&&e.key==='/'&&e.phase==='post-production-document-keydown');assert(observed&&parentOpen(observed.state)&&parentOpen(s)&&s.menu.open&&s.menu.nativeOpen&&s.focus===before.focus&&s.search?.focused===false,'Native modal must retain child focus and moved stage ownership');}
  else {
   assert.equal(s.focus,'search');assert(s.search?.focused,'Search must own focus');
   if(check==='search-focused'){const observed=a.accepted.find(e=>e.type==='keydown'&&e.key==='/'&&e.phase==='post-production-document-keydown');assert(observed?.state.focus==='search'&&observed.state.search.focused,'Slash focus must be observed after document delegation');assert(s.menu.open&&s.menu.nativeOpen&&!s.menu.inert);}
   if(check==='search-kept'){assert(s.menu.open&&s.menu.nativeOpen&&!s.menuCard.hidden&&s.menuCard.containsStage,'Matching filter must preserve Menu');assert(!(a.productionClosures||[]).length,'Matching filter incorrectly retired Menu');assert(s.menuCard.visible&&Number(s.menuCard.opacity)===1,'Matching filter result must remain painted');}
   if(check==='search-retired'){
    assert(before.menu.open&&before.menu.nativeOpen&&!before.menuCard.hidden&&before.menuCard.containsStage,'Filter-away must start from a live Menu in its gallery card');
    assert(closeState(s)&&s.menuCard.hidden&&s.menuCard.containsStage,'Accepted filter-away must retire and hide the gallery Menu');
    const closure=a.productionClosures?.find(row=>row.phase==='production-menu-close-completed');assert(closure,'Production completed-close observation missing');
    const event=a.events.find(e=>e.eventId===closure.eventId);assert(event&&event.type==='st:close'&&event.control==='menu'&&event.trusted===false,'Production event must stay distinct from trusted input');
    const input=primaryEvent(a,{type:'input',control:'search'});assert(event.eventAt>=input.captureCompletedAt,'Production close precedes the triggering trusted Search input');
    assertAccepted({...a,accepted:a.productionClosures},event,['production-menu-close-completed']);assert(closeState(closure.state)&&closure.state.menuCard.hidden===false&&closure.state.focus==='search','Menu must be natively/managed closed before card hides');
    const hidden=a.filterMutations?.find(row=>row.hidden===true);assert(hidden&&hidden.actionId===a.id&&hidden.phase==='menu-card-hidden-mutation','Accepted hidden-card mutation missing');assertSnapshot(hidden.state,'hidden-card observer');
    assert(Number.isFinite(hidden.observerAt)&&hidden.observerAt>=closure.snapshotCompletedAt&&hidden.state.snapshotStartedAt>=hidden.observerAt&&hidden.state.menuCard.hidden&&closeState(hidden.state)&&hidden.state.focus==='search','Hidden observation must follow completed native retirement');
    assert(hidden.state.snapshotCompletedAt<=a.settlement.state.snapshotStartedAt&&hidden.state.snapshotCompletedAt<=a.after.snapshotStartedAt,'Hidden observation must complete before the selected settled/terminal snapshot');
   }
   if(check==='search-escape'){const observed=a.accepted.find(e=>e.type==='keydown'&&e.key==='Escape'&&e.phase==='post-production-document-keydown');assert(observed&&observed.defaultPrevented===false&&observed.state.focus==='search'&&closeState(observed.state)&&closeState(s),'Search Escape must not be consumed by a stale Menu');}
   if(check==='search-restored')assert(closeState(s)&&!s.menuCard.hidden&&s.menuCard.visible&&Number(s.menuCard.opacity)===1,'Restored Menu card must be visible without reopening its popover');
  }
 }
 if(check==='child-escape'){assert(parentOpen(before)&&parentOpen(s));assert(closeState(s));assert.equal(s.focus,`trigger:${step.row}`);}
 if(check==='parent-escape'){
  assert(parentOpen(before)&&closeState(before));assert(a.lifecycle.some(e=>['cancel','close'].includes(e.type)&&e.trusted&&e.control==='parent'),'Trusted native parent close lifecycle missing');
  assert(!s.parent.nativeOpen&&!s.parent.modal&&s.stageOwner==='gallery'&&s.hash!=='#t/menu');assert.equal(s.focus,'detail');assert.deepEqual(s.rows.map(r=>[r.id,r.name]),before.rows.map(r=>[r.id,r.name]),'Moving stage must retain committed data');
 }
}

export function reconcileCase(run) {
 const issues=[...(run.failures||[]),...(run.errors||[]).map(e=>issue(e.kind||'native-error',e.message))];
 try{assertRunIdentity(run.runIdentity);}catch(error){issues.push(issue('run-identity',String(error)));}
 try{exactSet((run.actions||[]).map(a=>a.stepId),actionPlan(profileFor(run.id)).map(s=>s.id),'required action union');}catch(error){issues.push(issue('action-coverage',String(error)));}
 const profile=profileFor(run.id),steps=profile?actionPlan(profile):[],audit={id:run.id,profile,deleted:[],originalPoints:{}};
 try{assert.deepEqual(run.profile,profile);assert.deepEqual((run.actions||[]).map(a=>a.stepId),steps.map(s=>s.id),'Required native action order differs');}catch(error){issues.push(issue('action-order',String(error)));}
 for(const a of run.actions||[]){
  if(a.status!=='observed')issues.push(issue('action-incomplete',a.stepId));
  const step=steps.find(s=>s.id===a.stepId);
  try{assert(step,'Unknown action');assertStepEvidence(step,a,audit);}catch(error){issues.push({...issue('action-evidence',String(error)),action:a.stepId});}
 }
 if(profile&&profile.width<=650&&['keyboard','reduced'].includes(profile.suite)){
  const coverage=new Set((run.actions||[]).flatMap(a=>(a.settledTypography?.rows||[]).map(r=>r.selector)));
  for(const target of PHONE_TEXT_TARGETS)if(!coverage.has(target.selector))issues.push(issue('phone-text-coverage',`Required visible leaf was not measured: ${target.selector}`));
 }
 try{
  const inv=run.recoveredInventory;assert(inv&&inv.active===null&&inv.dropped===0&&Array.isArray(inv.events),'Completed native inventory missing, active, or overflowed');
  const completeEvents=reconcileMenuEvents(run.eventBatches,inv,eventBatchLimit(profile));
  assert.deepEqual(run.eventBatches.map(batch=>batch.label),eventBatchPlan(profile),'Required stable checkpoint sequence is incomplete or reordered');
  const terminal=assertSnapshot(inv.final,'terminal inventory'),last=run.actions?.at(-1)?.after;assert(last&&terminal.snapshotStartedAt>=last.snapshotCompletedAt,'Terminal inventory predates final action');
  assert(closeState(terminal)&&!terminal.editor.open&&!terminal.parent.nativeOpen&&!terminal.parent.modal,'Terminal inventory retained native ownership');
  assert(!terminal.animations.some(x=>x.owner==='menu'||x.pending||x.playState==='running'),'Terminal inventory retained motion');
  assert.deepEqual(semanticState(terminal),semanticState(last),'Terminal inventory differs from final accepted flow state');
  const events=new Map();for(const e of completeEvents){assert(!events.has(e.eventId),'Duplicate terminal input event');events.set(e.eventId,e);}
  for(const a of run.actions||[])for(const e of a.events||[]){const retained=events.get(e.eventId);assert(retained,'Action event absent from terminal inventory');for(const key of ['actionId','eventAt','type','control','trusted'])assert.equal(retained[key],e[key],`Terminal input ${key} mismatch`);}
 }catch(error){issues.push(issue('terminal-inventory',String(error)));}
 if(!run.collectionComplete)issues.push(issue('collection','Case did not finish'));
 if(!run.pageClosed||!run.contextClosed)issues.push(issue('closure','Page/context finalization incomplete'));
 try{
  assert(run.video?.finalized===true&&Number.isFinite(run.video.bytes)&&run.video.bytes>0&&run.video.file==='native-speed.webm','Finalized native recording missing');assert.match(run.video.sha256||'',/^[0-9a-f]{64}$/,'Raw native recording digest missing');
  const metadata=assessVideoProbe(run.video.probe);
  run.mediaMetadata=metadata.status==='observed'?{status:'observed',gaps:[]}:{status:'unavailable',gaps:[{code:'FFPROBE_NOT_FOUND',tool:'ffprobe',error:run.video.probe.error,rawVideo:{file:run.video.file,bytes:run.video.bytes,sha256:run.video.sha256}}]};
 }catch(error){run.mediaMetadata={status:'failed',gaps:[]};issues.push(issue('video',String(error)));}
 try{exactSet((run.stills||[]).map(s=>s.label),stillPlan(profileFor(run.id)),'required still union');}catch(error){issues.push(issue('stills',String(error)));}
 for(const still of run.stills||[])try{assert.equal(still.status,'captured');assert(Number.isFinite(still.bytes)&&still.bytes>0);assertSnapshot(still.before,'screenshot before');assertSnapshot(still.after,'screenshot after');assert(still.before.snapshotCompletedAt<=still.after.snapshotStartedAt,'Screenshot bracket clocks are reversed');assert(Number.isFinite(still.hostRequest?.at)&&Number.isFinite(still.hostCompleted?.at)&&still.hostCompleted.at>=still.hostRequest.at,'Actual screenshot host interval missing');}catch(error){issues.push({...issue('stills',String(error)),label:still.label});}
 if(run.inventoryOverflow)issues.push(issue('inventory','Error/request inventory exceeded its bounded cap'));
 if(run.status==='failed'&&!issues.length)issues.push(issue('prior-failure','Original failure preserved'));
 run.issues=issues;run.functionalStatus=issues.length?'failed':'observed';run.status=issues.length?'failed':run.mediaMetadata.status==='unavailable'?'native-functional-observed':'native-contract-observed';return run.status;
}
export function assertVideoProbe(probe) {
 assert.equal(probe?.status,'observed','Native video timing metadata missing');assert(Array.isArray(probe.packets)&&probe.packets.length>0,'Native media packet list is empty or missing');
 for(const packet of probe.packets){const pts=packet.pts_time;assert((typeof pts==='number'||typeof pts==='string'&&pts.trim()!=='')&&Number.isFinite(Number(pts)),'Native media packet has missing/nonfinite PTS');}
}
export function videoProbeFailure(error) {
 const evidence={code:error?.code??null,syscall:error?.syscall??null,path:error?.path??null,message:String(error?.message||error).slice(0,1200)};
 if(evidence.code==='ENOENT'&&evidence.syscall==='spawnSync ffprobe'&&evidence.path==='ffprobe')return {status:'unavailable',gapCode:'FFPROBE_NOT_FOUND',tool:'ffprobe',error:evidence};
 return {status:'failed',gapCode:null,tool:'ffprobe',error:evidence};
}
export function assessVideoProbe(probe) {
 if(probe?.status==='observed'){assertVideoProbe(probe);return {status:'observed'};}
 assert(probe?.status==='unavailable'&&probe.gapCode==='FFPROBE_NOT_FOUND'&&probe.tool==='ffprobe','Unknown media probe failure');
 assert(probe.error?.code==='ENOENT'&&probe.error.syscall==='spawnSync ffprobe'&&probe.error.path==='ffprobe','Missing ffprobe requires exact executable-not-found evidence');
 assert(!Object.hasOwn(probe,'packets'),'Unavailable ffprobe cannot supply observed packet timestamps');return {status:'unavailable'};
}
export const functionalSuccess=result=>result?.functionalStatus==='observed'&&['native-contract-observed','native-functional-observed'].includes(result.status);
export function aggregateMedia(runs) {
 const gaps=runs.flatMap(run=>(run.mediaMetadata?.gaps||[]).map(gap=>({profileId:run.id,...gap})));
 return {status:runs.some(run=>run.mediaMetadata?.status==='failed')?'failed':gaps.length?'unavailable':'observed',gaps};
}
export async function finalizeCase(run,{recover,closePage,closeContext,finalizeMedia,persist,bound}) {
 for(const [name,fn] of [['recover',recover],['close-page',closePage],['close-context',closeContext],['finalize-media',finalizeMedia]]){
  run.finalization??=[];const row={name,status:'requested'};run.finalization.push(row);persist();
  try{await bound(fn,2000,name);row.status='completed';if(name==='close-page')run.pageClosed=true;if(name==='close-context')run.contextClosed=true;}
  catch(error){row.status='failed';row.error=String(error);run.failures.push(issue(name,row.error));}persist();
 }
 reconcileCase(run);persist();
}
export async function finalizeReport(report,runs,{closeBrowser,verifySources,persist,bound}) {
 try{await bound(closeBrowser,2500,'close-browser');report.browserClosed=true;}catch(error){report.errors.push(issue('close-browser',String(error)));}
 try{report.endSource=verifySources();report.sourcesReverified=true;}catch(error){report.errors.push(issue('source-recheck',String(error)));}
 try{assertRunIdentity(report.runIdentity);assert.equal(report.checkoutHead,report.runIdentity.checkoutHead);for(const run of runs)assert.deepEqual(run.runIdentity,report.runIdentity,'Case belongs to another checkout/run/attempt');}catch(error){report.errors.push(issue('run-identity',String(error)));}
 for(const run of runs){reconcileCase(run);persist(run);}
 const expected=report.shard==='callback'?[CALLBACK_PROFILE.id]:SHARDS.find(s=>s.id===report.shard)?.profiles||[];
 try{exactSet(runs.map(r=>r.id),expected,'executed shard profiles');}catch(error){report.errors.push(issue('profile-coverage',String(error)));}
 report.mediaMetadata=aggregateMedia(runs);
 const failed=report.status==='failed'||report.errors.length||!report.browserClosed||!report.sourcesReverified||runs.some(r=>!functionalSuccess(r));
 report.functionalStatus=failed?'failed':'observed';report.status=failed?'failed':report.mediaMetadata.status==='unavailable'?'native-functional-observed':'native-contract-observed';
 report.finishedUtc=new Date().toISOString();persist();return report.status;
}
export function mergeReports(reports,readCase,callbackReport) {
 const issues=[],runs=[];try{exactSet(reports.map(r=>r.shard),SHARDS.map(s=>s.id),'reports');}catch(e){issues.push(issue('shard-coverage',String(e)));}
 const source=JSON.stringify(reports[0]?.source??null);
 const runIdentity=reports[0]?.runIdentity??null;
 try{assertSourceIdentity(reports[0]?.source);}catch(e){issues.push(issue('source-identity',String(e)));}
 try{assertRunIdentity(runIdentity);}catch(e){issues.push(issue('run-identity',String(e)));}
 for(const report of reports){
  if(report.version!==VERSION||!functionalSuccess(report)||!Array.isArray(report.errors)||report.errors.length||report.browserClosed!==true||report.sourcesReverified!==true)issues.push(issue('shard-failed',String(report.shard)));
  if(JSON.stringify(report.source)!==source||JSON.stringify(report.endSource)!==source)issues.push(issue('source-identity','All shards must share exact frozen source and harness identity'));
  try{assertRunIdentity(report.runIdentity);assert.deepEqual(report.runIdentity,runIdentity);assert.equal(report.checkoutHead,runIdentity.checkoutHead);}catch(e){issues.push(issue('run-identity',String(e)));}
  try{exactSet((report.cases||[]).map(c=>c.id),SHARDS.find(s=>s.id===report.shard)?.profiles||[],'shard cases');}catch(e){issues.push(issue('profile-coverage',String(e)));}
  const shardRuns=[];for(const entry of report.cases||[]){try{const run=readCase(report,entry);assert.equal(run.id,entry.id);assert.deepEqual(run.profile,PROFILES.find(p=>p.id===run.id));assert.equal(JSON.stringify(run.source),source);assert.deepEqual(run.runIdentity,runIdentity);reconcileCase(run);assert(functionalSuccess(run),`Case failed: ${run.id}`);runs.push(run);shardRuns.push(run);}catch(e){issues.push(issue('case-evidence',String(e)));}}
  try{assert.deepEqual(report.mediaMetadata,aggregateMedia(shardRuns),'Reported media gaps disagree with actual case evidence');}catch(e){issues.push(issue('media-summary',String(e)));}
 }
 try{exactSet(runs.map(r=>r.id),PROFILES.map(p=>p.id),'complete profile union');}catch(e){issues.push(issue('profile-coverage',String(e)));}
 let callbackRun=null;try{assert(callbackReport&&callbackReport.shard==='callback'&&callbackReport.version===VERSION&&functionalSuccess(callbackReport)&&callbackReport.browserClosed&&callbackReport.sourcesReverified);assertRunIdentity(callbackReport.runIdentity);assert.deepEqual(callbackReport.runIdentity,runIdentity);assert.equal(callbackReport.checkoutHead,runIdentity.checkoutHead);assert.equal(JSON.stringify(callbackReport.source),source);assert.equal(JSON.stringify(callbackReport.endSource),source);exactSet(callbackReport.cases.map(c=>c.id),[CALLBACK_PROFILE.id],'controlled callback case');const run=readCase(callbackReport,callbackReport.cases[0]);assert.deepEqual(run.profile,CALLBACK_PROFILE);assert.equal(run.id,CALLBACK_PROFILE.id,'Callback case identity mismatch');assert.equal(JSON.stringify(run.source),source,'Callback case source identity mismatch');assert.deepEqual(run.runIdentity,runIdentity);assert(Array.isArray(callbackReport.errors)&&callbackReport.errors.length===0,'Callback report contains late errors or lacks error inventory');reconcileCase(run);assert(functionalSuccess(run));assert.deepEqual(callbackReport.mediaMetadata,aggregateMedia([run]),'Callback media gap summary mismatch');callbackRun=run;}catch(e){issues.push(issue('controlled-callback',String(e)));}
 const mediaMetadata=aggregateMedia([...runs,...(callbackRun?[callbackRun]:[])]);
 return {version:VERSION,status:issues.length?'incomplete':mediaMetadata.status==='unavailable'?'native-functional-observed':'native-contract-observed',functionalStatus:issues.length?'failed':'observed',runIdentity,mediaMetadata,issues,profiles:runs.map(r=>r.id),controlledProfile:callbackReport?.cases?.[0]?.id??null,visualVerdict:'unverified',motionScore:null,scope:'Declared native functional evidence is independent of media metadata availability. Raw bytes remain mandatory; missing metadata is not observed PTS or pixel/playback acceptance.'};
}
