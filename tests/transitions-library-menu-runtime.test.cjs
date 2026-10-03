// Fresh reconstruction checks: complete production runtime, deterministic model.
// No browser was launched. Native focus, pixels, trusted input and timing need CI.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {fixture}=require('./transitions-library-menu-runtime-fixture.cjs');
const runtime=path.resolve(process.argv[2]||path.join(__dirname,'../skills/seenry/assets/components/transitions/seenry-transitions.js'));
const source=fs.readFileSync(runtime,'utf8'),css=fs.readFileSync(path.join(path.dirname(runtime),'seenry-transitions.css'),'utf8');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex'),results=[];
const flush=async()=>{for(let i=0;i<16;i++)await Promise.resolve();};
function menu({code=source,reduce=false,blur=true,kind='menu',native=true}={}){
 const f=fixture(code,reduce),trigger=new f.E('button'),layer=new f.E(),items=['Rename','Duplicate','Delete'].map(text=>{const e=new f.E('button');e.setAttribute('role','menuitem');e.textContent=text;return e;}),other=new f.E('button');
 layer.dataset.st=kind;layer.id='menu';if(native)layer.setAttribute('popover','manual');else layer.dataset.stContained='';
 trigger.dataset.stTarget='menu';layer.append(...items);f.host.append(trigger,layer,other);if(blur)f.host.dataset.stBlur='8';f.S.init(layer);trigger.focus();
 const events=[];layer.addEventListener('st:open',()=>events.push('open'));layer.addEventListener('st:close',()=>events.push('close'));
 const click=(target,o={})=>{const e=new f.Event('click',{bubbles:true,...o});target.dispatchEvent(e);return e;};
 const pointer=target=>target.dispatchEvent(new f.Event('pointerdown',{bubbles:true,isTrusted:true}));
 const open=(o={})=>f.S.open(layer,trigger,o);
 return {...f,trigger,layer,items,other,events,click,pointer,open};
}
function live(f){return f.animations.filter(a=>!a.cancelled);}
function accepted(f){assert.equal(f.layer.dataset.stOpen,'true');assert(!f.layer.inert);assert(f.layer.popoverOpen);assert.equal(f.trigger.getAttribute('aria-expanded'),'true');}
function closed(f){assert.equal(f.layer.dataset.stOpen,'false');assert(f.layer.inert);assert(!f.layer.popoverOpen);assert.equal(f.trigger.getAttribute('aria-expanded'),'false');}
function clearPaint(f){const s=f.styleOf(f.layer);assert.equal(Number(s.opacity),1);assert.equal(s.filter,'none');assert.equal(s.transform,'none');assert.equal(live(f).length,0);}
async function test(name,fn){if(process.env.MENU_RUNTIME_SKIP_CAUSAL==='1'&&name.startsWith('causal negative:'))return;try{const detail=await fn();results.push({name,pass:true,...(detail?{detail}:{})});}catch(e){results.push({name,pass:false,error:e.stack});}}
function remove(code,guard,replacement=''){assert(code.includes(guard),'Causal guard not found: '+guard);return code.replace(guard,replacement);}
(async()=>{
for(const reduce of [false,true])for(const keyboard of [false,true])await test(`${reduce?'reduced':'normal'}/${keyboard?'keyboard':'pointer'} entry and exit use the intended path`,async()=>{
 const f=menu({reduce});f.open({keyboard});accepted(f);
 assert.equal(f.doc.activeElement,keyboard?f.items[0]:f.layer);
 if(reduce||keyboard){clearPaint(f);f.S.close(f.layer,{keyboard});closed(f);assert.equal(f.doc.activeElement,f.trigger);assert.equal(f.animations.length,0,'Instant paths create no placeholder animations');}
 else {assert(live(f).some(a=>a.frames.some(k=>k.opacity===0)));assert(live(f).some(a=>a.frames.some(k=>String(k.filter).includes('blur(8px)'))));const opacity=live(f).find(a=>a.frames.some(k=>'opacity'in k));assert.equal(opacity.options.duration,160);assert.equal(opacity.options.easing,'cubic-bezier(.3,1,0,1)');await f.settle();f.S.close(f.layer,{keyboard:false});assert(f.layer.popoverOpen&&f.layer.inert);assert(live(f).some(a=>a.frames.at(-1).opacity===0&&a.options.duration===150));await f.settle();closed(f);assert.equal(f.doc.activeElement,f.trigger);clearPaint(f);}
});
for(const trusted of [false,true])for(const history of ['pointer','keyboard'])for(const detail of [0,1])await test(`${trusted?'trusted':'synthetic'} delegated click detail=${detail} after ${history} history`,()=>{
 const f=menu();history==='keyboard'?f.key(f.trigger,'Enter'):f.pointer(f.trigger);f.click(f.trigger,{isTrusted:trusted,detail});accepted(f);
 const keyboard=trusted?detail===0:history==='keyboard';assert.equal(f.doc.activeElement,keyboard?f.items[0]:f.layer);
 assert.equal(live(f).length===0,keyboard,'Synthetic click detail must not fabricate keyboard or pointer history');
});
await test('explicit keyboard false overrides history for API entry and exit, while reduction stays instant',async()=>{
 for(const reduce of [false,true]){const f=menu({reduce});f.key(f.trigger,'Enter');f.open({keyboard:false});accepted(f);assert.equal(f.doc.activeElement,f.layer);assert.equal(live(f).length===0,reduce);await f.settle();f.S.close(f.layer,{keyboard:false});assert.equal(f.layer.popoverOpen,!reduce);await f.settle();closed(f);}
});
await test('API keyboard default inherits actual history and explicit true conveys focus visibility',()=>{
 const f=menu();f.key(f.trigger,'Enter');f.open();accepted(f);clearPaint(f);assert.equal(f.doc.activeElement,f.items[0]);
 const g=menu();g.pointer(g.trigger);g.open({keyboard:true});assert.equal(g.focusLog.at(-1).options.focusVisible,true);clearPaint(g);
});
for(const trusted of [false,true])for(const history of ['pointer','keyboard'])for(const detail of [0,1])await test(`${trusted?'trusted':'synthetic'} menuitem click detail=${detail} after ${history} history`,async()=>{
 const f=menu();f.open({keyboard:false});await f.settle();history==='keyboard'?f.key(f.layer,'ArrowDown'):f.pointer(f.layer);f.click(f.items[0],{isTrusted:trusted,detail});
 const keyboard=trusted?detail===0:history==='keyboard';assert.equal(f.layer.popoverOpen,!keyboard,'Item activation follows the same input contract as its trigger');if(keyboard)closed(f);else {assert(f.layer.inert);await f.settle();closed(f);}
});
for(const key of ['ArrowDown','ArrowUp','Home','End'])await test(`${key} takes over an active pointer entry before focus reaches the row`,()=>{
 const f=menu();f.open({keyboard:false});assert.equal(f.styleOf(f.layer).opacity,0);let paintAtFocus;f.layer.addEventListener('focusin',()=>{paintAtFocus=f.styleOf(f.layer);});f.key(f.layer,key,{isTrusted:true});accepted(f);clearPaint(f);assert.equal(f.doc.activeElement,(key==='ArrowUp'||key==='End')?f.items.at(-1):f.items[0]);assert.equal(Number(paintAtFocus.opacity),1);assert.equal(paintAtFocus.filter,'none');assert.equal(paintAtFocus.transform,'none');
});
await test('keyboard API takeover of an already-open pointer Menu retires current owners',()=>{const f=menu();f.open({keyboard:false});assert(live(f).length);f.open({keyboard:true});accepted(f);clearPaint(f);});
await test('Tab and Escape retire an entered Menu synchronously',()=>{for(const key of ['Tab','Escape']){const f=menu();f.open({keyboard:false});f.key(f.layer,key);closed(f);assert.equal(f.doc.activeElement,f.trigger);assert.equal(live(f).length,0);}});
await test('fresh and reversed openings reset only the Menu scroll offset',()=>{const f=menu();f.layer.scrollTop=71;f.layer.scrollLeft=13;f.host.scrollTop=43;f.open();assert.equal(f.layer.scrollTop,0);assert.equal(f.layer.scrollLeft,0);assert.equal(f.host.scrollTop,43);f.S.close(f.layer,{keyboard:false});f.layer.scrollTop=92;f.open({keyboard:true});assert.equal(f.layer.scrollTop,0);accepted(f);clearPaint(f);});
await test('generic item listener before host action promotes an outgoing close synchronously',async()=>{
 const f=menu();f.open({keyboard:false});await f.settle();f.items[0].focus();const modal=new f.E('dialog');f.host.append(modal);let nativeAtAction;
 f.layer.addEventListener('click',()=>{assert(f.layer.popoverOpen&&f.layer.inert,'Generic listener runs first and starts a real pointer close');f.S.close(f.layer,{instant:true,silent:true});nativeAtAction=f.layer.popoverOpen;modal.showModal();});
 f.click(f.items[0],{isTrusted:true,detail:1});assert.equal(nativeAtAction,false,'Outgoing menu cannot remain above host Rename');closed(f);assert(modal.open&&modal.modal);assert.equal(live(f).length,0);await f.settle();closed(f);assert.deepEqual(f.events,['open','close']);
});
await test('instant promotion also clears a previously committed exit style before native handoff',async()=>{
 const f=menu();f.open({keyboard:false});await f.settle();f.S.close(f.layer,{keyboard:false});const exit=live(f).find(a=>a.frames.at(-1).transform);exit.finish();await flush();assert.notEqual(f.layer.style.transform,undefined);f.S.close(f.layer,{instant:true,silent:true});closed(f);assert.equal(f.layer.style.transform,undefined);assert.equal(live(f).length,0);
});
await test('pointer-close return-focus callback reopening prevents any stale exit animation',async()=>{
 const f=menu();f.open({keyboard:false});await f.settle();f.items[0].focus();f.events.length=0;let once=false;f.trigger.addEventListener('focusin',()=>{if(once)return;once=true;f.open({keyboard:true});f.items[1].focus();});const before=f.animations.length;f.S.close(f.layer,{keyboard:false});accepted(f);assert.equal(f.doc.activeElement,f.items[1]);assert.equal(f.animations.length,before,'Outer obsolete close must not schedule exit after host reopened');assert.deepEqual(f.events,['open']);await f.settle();accepted(f);clearPaint(f);
});
await test('return-focus callback may promote its own close without outer close restarting animation',async()=>{
 const f=menu();f.open();await f.settle();f.items[0].focus();f.trigger.addEventListener('focusin',()=>f.S.close(f.layer,{instant:true,silent:true}));const before=f.animations.length;f.S.close(f.layer,{keyboard:false});closed(f);assert.equal(f.animations.length,before);assert.deepEqual(f.events,['open','close']);
});
for(const instant of [false,true])await test(`${instant?'instant':'pointer'} native hide callback reopen survives cleanup and obsolete close event`,async()=>{
 const f=menu();f.layer.style.opacity='.91';f.items[0].style.opacity='.83';f.open({keyboard:false});await f.settle();f.events.length=0;let observed;
 f.layer.hidePopover=()=>{f.layer.popoverOpen=false;observed={opacity:f.layer.style.opacity,transform:f.layer.style.transform};f.open({keyboard:true});f.items[1].focus();};f.S.close(f.layer,{instant,keyboard:false});if(!instant)await f.settle();accepted(f);assert.equal(observed.opacity,'.91');assert.equal(observed.transform,undefined);assert.equal(f.doc.activeElement,f.items[1]);assert.equal(f.items[0].style.opacity,'.83');assert.deepEqual(f.events,['open']);assert.equal(live(f).length,0);
});
await test('native hide focus redirect without reopen stays host-owned',async()=>{
 const f=menu();f.open();await f.settle();let returns=0;f.trigger.addEventListener('focusin',()=>returns++);f.layer.hidePopover=()=>{f.layer.popoverOpen=false;f.other.focus();};f.S.close(f.layer,{instant:true});closed(f);assert.equal(f.doc.activeElement,f.other);assert.equal(returns,1);assert.deepEqual(f.events,['open','close']);
});
await test('native autofocus redirect without state change is never acquired twice',()=>{
 const f=menu();f.items[0].setAttribute('autofocus','');let calls=0;f.items[0].addEventListener('focusin',()=>{calls++;f.other.focus();});f.open({keyboard:true});accepted(f);assert.equal(calls,1);assert.equal(f.doc.activeElement,f.other);clearPaint(f);assert.deepEqual(f.events,['open']);
});
await test('native autofocus host close aborts old open work and event',()=>{
 const f=menu();f.items[0].setAttribute('autofocus','');f.items[0].addEventListener('focusin',()=>f.S.close(f.layer,{instant:true,silent:true}));f.open({keyboard:false});closed(f);assert.equal(f.animations.length,0);assert.deepEqual(f.events,['close']);
});
await test('native autofocus close/reopen retains only newest state and host focus',()=>{
 const f=menu();f.items[0].setAttribute('autofocus','');let once=false;f.items[0].addEventListener('focusin',()=>{if(once)return;once=true;f.S.close(f.layer,{instant:true,silent:true});f.open({keyboard:true});f.items[1].focus();});f.open({keyboard:false});accepted(f);assert.equal(f.doc.activeElement,f.items[1]);assert.equal(f.animations.length,0);assert.deepEqual(f.events,['close','open']);
});
for(const native of [false,true])await test(`${native?'native':'explicit'} focus callback hiding native Menu prevents stale open announcement`,()=>{
 const f=menu();if(native)f.items[0].setAttribute('autofocus','');f.items[0].addEventListener('focusin',()=>f.layer.hidePopover());f.open({keyboard:true});closed(f);assert.deepEqual(f.events,['close']);clearPaint(f);
});
function beforeToggleSnapshot(f,label){return {label,nativeOpen:!!f.layer.popoverOpen,managedOpen:f.layer.dataset.stOpen,inert:f.layer.inert,expanded:f.trigger.getAttribute('aria-expanded'),liveOwners:live(f).length};}
function beforeToggleShow(f,trace){
 // Native show dispatches beforetoggle while visibility is STILL closed; the
 // visibility change happens only after that synchronous handler returns.
 f.layer.showPopover=()=>{trace?.push(beforeToggleSnapshot(f,'before native beforetoggle'));f.layer.dispatchEvent(new f.Event('beforetoggle',{oldState:'closed',newState:'open'}));trace?.push(beforeToggleSnapshot(f,'after host callback, before visibility'));f.layer.popoverOpen=true;trace?.push(beforeToggleSnapshot(f,'after native visibility becomes showing'));};
}
for(const reduce of [false,true])await test(`${reduce?'reduced':'normal'} beforetoggle(open) instant close reconciles the later native show`,async()=>{
 const f=menu({reduce});beforeToggleShow(f);let calls=0;
 f.layer.addEventListener('beforetoggle',e=>{if(e.newState!=='open')return;calls++;assert(!f.layer.popoverOpen,'The host callback precedes native visibility');f.S.close(f.layer,{instant:true,silent:true});closed(f);});
 f.open({keyboard:true});closed(f);assert.equal(calls,1);assert.equal(f.animations.length,0);assert.deepEqual(f.events,['close']);await f.settle();closed(f);
});
await test('beforetoggle(open) pointer close keeps its pending outgoing owner until completion',async()=>{
 const f=menu(),trace=[];beforeToggleShow(f,trace);f.layer.addEventListener('beforetoggle',e=>{if(e.newState==='open')f.S.close(f.layer,{keyboard:false,silent:true});});f.open({keyboard:false});trace.push(beforeToggleSnapshot(f,'outer open returned'));assert(f.layer.popoverOpen&&f.layer.inert);assert.equal(f.layer.dataset.stOpen,'true');assert(live(f).some(a=>a.frames.at(-1).opacity===0&&a.options.duration===150));assert.deepEqual(f.events,[]);await flush();assert(f.layer.popoverOpen);await f.settle();closed(f);trace.push(beforeToggleSnapshot(f,'owned pointer exit settled'));assert.deepEqual(f.events,['close']);return {trace};
});
await test('reconciled native hide preserves a host focus redirect without another acquisition',()=>{
 const f=menu();beforeToggleShow(f);f.layer.addEventListener('beforetoggle',e=>{if(e.newState==='open')f.S.close(f.layer,{instant:true,silent:true});else f.other.focus();});f.layer.hidePopover=()=>{f.layer.dispatchEvent(new f.Event('beforetoggle',{oldState:'open',newState:'closed'}));f.layer.popoverOpen=false;};f.open({keyboard:true});closed(f);assert.equal(f.doc.activeElement,f.other);assert.deepEqual(f.events,['close']);
});
await test('reconciled hide completion callback reopen survives the superseded outer show',()=>{
 const f=menu();beforeToggleShow(f);let once=false;f.layer.addEventListener('beforetoggle',e=>{if(e.newState!=='open'||once)return;once=true;f.S.close(f.layer,{instant:true,silent:true});});f.layer.hidePopover=()=>{f.layer.popoverOpen=false;f.open({keyboard:true});f.items[1].focus();};f.open({keyboard:true});accepted(f);assert.equal(f.doc.activeElement,f.items[1]);assert.deepEqual(f.events,['close','open']);assert.equal(f.animations.length,0);
});
await test('held child Menu pointer exit owns one Escape; the following key reaches native parent',async()=>{
 const f=menu(),dialog=new f.E('dialog'),cancel=new f.E('button');dialog.dataset.st='modal';cancel.setAttribute('autofocus','');dialog.append(cancel);f.host.append(dialog);dialog.append(f.trigger,f.layer);f.S.init(dialog);f.S.open(dialog,f.other,{keyboard:true});f.open({keyboard:false});await f.settle();f.S.close(f.layer,{keyboard:false,silent:true});assert(f.layer.popoverOpen&&f.layer.inert);assert(dialog.open);const first=f.key(cancel,'Escape');assert(first.defaultPrevented);closed(f);assert(dialog.open&&!dialog.inert);const second=f.key(cancel,'Escape');assert(!second.defaultPrevented,'Next key is left to native modal cancel');assert(dialog.open);
});
await test('pointer-only exit keeps top-layer presentation until its owned fade settles',async()=>{const f=menu();f.open({keyboard:false});await f.settle();f.S.close(f.layer,{keyboard:false});assert(f.layer.popoverOpen&&f.layer.inert);await flush();assert(f.layer.popoverOpen);await f.settle();closed(f);});
await test('Menu retirement preserves authored trigger visibility it never owned',()=>{const f=menu();f.open({keyboard:true});f.trigger.style.visibility='hidden';f.S.close(f.layer,{instant:true});closed(f);assert.equal(f.trigger.style.visibility,'hidden');});
await test('unrelated host animations, styles and another runtime channel survive Menu takeover and retirement',async()=>{
 const f=menu();f.layer.style.filter='contrast(1.1)';f.items[0].style.opacity='.83';const authored=f.items[0].animate([{color:'red'},{color:'blue'}],{duration:9000}),shell=f.layer.animate([{rotate:'0deg'},{rotate:'2deg'}],{duration:9000});f.S.play(f.layer,[{color:'red'},{color:'blue'}],{channel:'host-accent',ms:9000});f.S.play(f.items[0],[{opacity:.83},{opacity:.9}],{channel:'o',ms:9000});f.open({keyboard:false});const saved=f.items[0].style.opacity;f.key(f.layer,'ArrowDown');assert(!authored.cancelled&&!shell.cancelled);assert.equal(f.layer.style.filter,'contrast(1.1)');assert.equal(f.items[0].style.opacity,saved);assert(live(f).some(a=>a.frames.some(k=>k.color==='blue')));f.S.close(f.layer,{instant:true,silent:true});closed(f);assert(!authored.cancelled&&!shell.cancelled);assert(live(f).some(a=>a.node===f.items[0]&&a.frames.some(k=>'opacity'in k)));assert.equal(f.layer.style.filter,'contrast(1.1)');assert.equal(f.items[0].style.opacity,'.83');
});
await test('rapid pointer reversal continues from sampled rendered values and old close cannot hide new state',async()=>{
 const f=menu();f.open();await f.settle();f.S.close(f.layer,{keyboard:false});const before=f.animations.length,rendered=f.styleOf(f.layer);f.open({keyboard:false});accepted(f);const newer=f.animations.slice(before),opacity=newer.find(a=>a.frames.some(k=>'opacity'in k)),transform=newer.find(a=>a.frames.some(k=>'transform'in k));assert.equal(opacity.frames[0].opacity,rendered.opacity);assert.equal(transform.frames[0].transform,rendered.transform);await f.settle();accepted(f);assert.equal(live(f).length,0);
});
await test('focus cue adds a distinct inset ring with source-token contrast on light and dark surfaces',()=>{
 assert(css.includes('[data-st="menu"]:not([data-st-morph]) [role="menuitem"]:focus-visible { box-shadow: inset 0 0 0 2px var(--focus-ring); }'));
 const lum=hex=>{let v=hex.replace('#','');if(v.length===3)v=[...v].map(c=>c+c).join('');return [0,2,4].map(i=>parseInt(v.slice(i,i+2),16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((a,x,i)=>a+x*[.2126,.7152,.0722][i],0);};
 const light=css.slice(css.indexOf(':root {'),css.indexOf(':root { color-scheme')),dark=css.slice(css.indexOf('[data-theme=\"dark\"] {'));for(const block of [light,dark]){const fg=/--focus-ring:\s*(#[a-f\d]+)/i.exec(block)[1],surface=/--surface:\s*(#[a-f\d]+)/i.exec(block)[1],hover=/--hover:\s*#([a-f\d]{6})([a-f\d]{2})/i.exec(block);let rgb=surface.slice(1);if(rgb.length===3)rgb=[...rgb].map(c=>c+c).join('');const alpha=parseInt(hover[2],16)/255,bg='#'+[0,2,4].map(i=>Math.round(parseInt(hover[1].slice(i,i+2),16)*alpha+parseInt(rgb.slice(i,i+2),16)*(1-alpha)).toString(16).padStart(2,'0')).join('');assert((Math.max(lum(fg),lum(bg))+.05)/(Math.min(lum(fg),lum(bg))+.05)>=3);}
});
await test('reduced Menu focus cascade reproduces native failure and makes the inset cue instant',()=>require('./transitions-library-menu-focus-cascade.cjs').verify(css,fs.readFileSync(path.join(path.dirname(runtime),'gallery.html'),'utf8')));
await test('plus-menu and plain popover retain their pre-existing pointer/keyboard recipes',()=>{for(const kind of ['plus-menu','popover']){const f=menu({kind});f.open({keyboard:true});assert(live(f).length>0,'The new Menu instant policy must not broaden to other recipes');}});

// Removed-guard causal negatives execute the entire mutated runtime, not a model
// of the condition. Each negative must reproduce a concrete wrong state or owner.
await test('causal negative: removing instant promotion keeps the old native Menu over host action',()=>{const code=remove(source,'if (!s.open && !isOpen(el) && !(menuInstant && s.closing)) return;','if (!s.open && !isOpen(el)) return;');const f=menu({code});f.open();f.S.close(f.layer,{keyboard:false});f.S.close(f.layer,{instant:true,silent:true});assert(f.layer.popoverOpen&&f.layer.inert);});
await test('causal negative: removing post-refocus guard schedules stale exit after callback reopen',async()=>{const code=remove(source,'  if (menu && (s.version !== v || s.open)) return;\n');const f=menu({code});f.open();await f.settle();f.items[0].focus();let once=false;f.trigger.addEventListener('focusin',()=>{if(once)return;once=true;f.open({keyboard:true});});const count=f.animations.length;f.S.close(f.layer,{keyboard:false});assert(f.animations.length>count);assert(live(f).some(a=>a.frames.at(-1).opacity===0));});
await test('causal negative: cleanup after native hide erases the reopened Menu',async()=>{let code=remove(source,"if (kind === 'modal' || menu) clean();","if (kind === 'modal') clean();");code=remove(code,"if ((kind === 'modal' || menu) && (s.version !== v || s.open)) return;","if (kind === 'modal' && (s.version !== v || s.open)) return;");code=remove(code,"if (kind !== 'modal' && !menu) clean();","if (kind !== 'modal') clean();");const f=menu({code});f.open();await f.settle();f.layer.hidePopover=()=>{f.layer.popoverOpen=false;f.open({keyboard:true});};f.S.close(f.layer,{instant:true});assert(f.layer.popoverOpen);assert.equal(f.layer.dataset.stOpen,'false','Obsolete cleanup corrupts the newer logical presentation');});
await test('causal negative: missing keyboard takeover retains opacity zero and blur at arrow focus',()=>{const code=remove(source,'if (plainMenu(el) && layerState(el).open) stopMenu(el);');const f=menu({code});f.open();f.key(f.layer,'ArrowDown');assert.equal(f.doc.activeElement,f.items[0]);assert.equal(f.styleOf(f.layer).opacity,0);assert.match(f.styleOf(f.layer).filter,/blur\(8px\)/);});
await test('causal negative: missing native focus ownership reclaims a host redirect',()=>{const code=remove(source," && (!menu || focusVersion === openingFocus)");const f=menu({code});f.items[0].setAttribute('autofocus','');let once=false;f.items[0].addEventListener('focusin',()=>{if(once)return;once=true;f.other.focus();});f.open({keyboard:true});assert.equal(f.doc.activeElement,f.items[0]);});
await test('causal negative: old Escape closing gate leaves the outgoing child Menu waiting',async()=>{const code=remove(source,'if (!layerState(top).closing || plainMenu(top))','if (!layerState(top).closing)');const f=menu({code});f.open();await f.settle();f.S.close(f.layer,{keyboard:false});assert(f.key(f.trigger,'Escape').defaultPrevented);assert(f.layer.popoverOpen&&f.layer.inert);});
await test('causal negative: detail-only synthetic classification invents keyboard entry',()=>{const code=remove(source,'plainMenu(el) && !e.isTrusted ? keyboardInput : e.detail === 0','e.detail === 0');const f=menu({code});f.pointer(f.trigger);f.click(f.trigger,{isTrusted:false,detail:0});assert.equal(f.doc.activeElement,f.items[0]);assert.equal(live(f).length,0);});
await test('causal negative: missing completed-close reconciliation strands the superseded native show',()=>{const code=remove(source,"   if (menu && !s.open && !s.closing && el.hasAttribute('popover') && el.matches(':popover-open')) el.hidePopover();\n");const f=menu({code});beforeToggleShow(f);f.layer.addEventListener('beforetoggle',e=>{if(e.newState==='open')f.S.close(f.layer,{instant:true,silent:true});});f.open({keyboard:true});assert(f.layer.popoverOpen&&f.layer.inert);assert.equal(f.layer.dataset.stOpen,'false');assert.equal(f.trigger.getAttribute('aria-expanded'),'false');});
await test('causal negative: reconciling a still-pending pointer close hides its presentation early',()=>{const code=remove(source,"if (menu && !s.open && !s.closing && el.hasAttribute('popover')", "if (menu && !s.open && el.hasAttribute('popover')");const f=menu({code}),trace=[];beforeToggleShow(f,trace);f.layer.addEventListener('beforetoggle',e=>{if(e.newState==='open')f.S.close(f.layer,{keyboard:false,silent:true});});f.open({keyboard:false});trace.push(beforeToggleSnapshot(f,'outer open returned with premature hide'));assert(!f.layer.popoverOpen,'Overbroad reconciliation hides the real pointer outgoing interval');assert(live(f).some(a=>a.frames.at(-1).opacity===0));return {trace};});
const report={runtimeSha256:sha(source),cssSha256:sha(css),testSha256:sha(fs.readFileSync(__filename)),fixtureSha256:sha(fs.readFileSync(path.join(__dirname,'transitions-library-menu-runtime-fixture.cjs'))),scope:'Fresh Menu reconstruction; complete supplied production runtime in deterministic DOM/WAAPI, modeled capture/bubble and native callback boundaries. Not browser/trusted-input/pixel/timing proof.',passed:results.filter(r=>r.pass).length,total:results.length,results};
if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));if(report.passed!==report.total)process.exitCode=1;
})();
