// Causal replay of the Mac v4 hidden-trigger and show()-Escape findings.
// Executes the complete exact runtime with a deterministic DOM/WAAPI model. This is
// not a browser pass: hidden/inert nodes reject focus and native show() does not
// synthesize cancel. Fresh trusted-input browser acceptance is still required.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
const filename = process.argv[2] || path.resolve(__dirname, '../skills/seenry/assets/components/transitions/seenry-transitions.js');
const source = fs.readFileSync(filename, 'utf8');
const results = [];
const flush = async () => { for (let i=0;i<12;i++) await Promise.resolve(); };
function fixture(reduce) {
 let focused, animations = [], focusLog = [];
 function cssStyle(){const values={},priorities={};Object.defineProperties(values,{getPropertyValue:{value:key=>values[key.replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]??''},getPropertyPriority:{value:key=>priorities[key]||''},setProperty:{value:(key,value,priority='')=>{values[key.replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=value;priorities[key]=priority;}}});return values;}
 const attrKey = k => k.replace(/^data-/, '').replace(/-([a-z])/g, (_, x) => x.toUpperCase());
 class E {
  constructor(tag='div') { this.tagName=tag.toUpperCase();this.dataset={};this.style=cssStyle();this.attrs={};this.children=[];this.handlers={};this.parentElement=null;this.isConnected=true;this.rect={left:20,top:20,width:200,height:160};this.clientWidth=320;this.clientHeight=400;this.clientLeft=this.clientTop=this.scrollLeft=this.scrollTop=0;this.hidden=false;this.open=false;this.textContent='';this._inert=false;this.className='';this.classList={contains:k=>this.className.split(' ').includes(k),add:k=>{if(!this.classList.contains(k))this.className+=' '+k;},remove:k=>this.className=this.className.split(' ').filter(x=>x!==k).join(' ')}; }
  get inert(){return this._inert;} set inert(v){this._inert=v;if(v&&this.contains(focused))focused=doc.body;}
  get childNodes(){return [...this.children];} get firstElementChild(){return this.children[0]||null;}
  get offsetWidth(){return this.rect.width;} get offsetHeight(){return this.rect.height;}
  get offsetParent(){return this.parentElement;} get innerHTML(){return this.textContent;} set innerHTML(v){this.textContent=v;}
  setAttribute(k,v){if(k.startsWith('data-'))this.dataset[attrKey(k)]=String(v);else this.attrs[k]=String(v);}
  hasAttribute(k){return this.getAttribute(k)!==null;} getAttribute(k){return k.startsWith('data-')?this.dataset[attrKey(k)]??null:this.attrs[k]??null;}
  removeAttribute(k){if(k.startsWith('data-'))delete this.dataset[attrKey(k)];else delete this.attrs[k];}
  matches(selector){return selector.split(',').some(s=>{s=s.trim();if(s==='*')return true;if(s===':popover-open')return !!this.popoverOpen;if(s.startsWith('.'))return this.classList.contains(s.slice(1));const noDisabled=s.endsWith(':not([disabled])');if(noDisabled){if(this.disabled)return false;s=s.replace(':not([disabled])','');}const a=/^\[([^=\]]+)(?:="([^\"]*)")?\]$/.exec(s);if(a)return this.hasAttribute(a[1])&&(a[2]===undefined||this.getAttribute(a[1])===a[2]);return s.toUpperCase()===this.tagName;});}
  closest(s){for(let e=this;e;e=e.parentElement)if(e.matches(s))return e;return null;}
  contains(e){return this===e||this.children.some(c=>c.contains(e));}
  querySelectorAll(s){return this.children.flatMap(c=>[...(c.matches(s)?[c]:[]),...c.querySelectorAll(s)]);}
  querySelector(s){return this.querySelectorAll(s)[0]||null;}
  append(...nodes){for(const e of nodes){if(e.parentElement)e.parentElement.children=e.parentElement.children.filter(c=>c!==e);this.children.push(e);e.parentElement=this;e.isConnected=true;}}
  prepend(e){this.append(e);this.children.unshift(this.children.pop());}
  remove(){if(this.contains(focused))focused=doc.body;this.isConnected=false;if(this.parentElement)this.parentElement.children=this.parentElement.children.filter(c=>c!==this);this.parentElement=null;}
  cloneNode(deep=false){const e=new E(this.tagName);e.dataset={...this.dataset};e.attrs={...this.attrs};e.style=Object.assign(cssStyle(),this.style);e.className=this.className;e.rect={...this.rect};e.alt=this.alt;if(deep)e.append(...this.children.map(c=>c.cloneNode(true)));return e;}
  addEventListener(k,fn){(this.handlers[k]??=[]).push(fn);} removeEventListener(k,fn){this.handlers[k]=(this.handlers[k]||[]).filter(f=>f!==fn);}
  dispatchEvent(e){e.target??=this;for(const fn of this.handlers[e.type]||[])fn(e);if(!e.propagationStopped&&e.bubbles){if(this.parentElement)this.parentElement.dispatchEvent(e);else if(this!==doc)doc.dispatchEvent(e);}return !e.defaultPrevented;}
  focus(){let rejected=!this.isConnected;for(let e=this;e;e=e.parentElement)if(e.hidden||e.inert||e.style.visibility==='hidden')rejected=true;focusLog.push({node:this,rejected});if(rejected||focused===this)return;focused=this;doc.dispatchEvent({type:'focusin',target:this});}
  getBoundingClientRect(){const r=this.rect;return {...r,right:r.left+r.width,bottom:r.top+r.height};}
  show(){this.open=true;this.modal=false;this.querySelector('button')?.focus();} showModal(){this.show();this.modal=true;}
  close(){this.open=false;if(this.contains(focused))focused=doc.body;}
  showPopover(){this.popoverOpen=true;} hidePopover(){this.popoverOpen=false;}
  animate(frames,options){let resolve,reject;const a={node:this,frames,options,settled:false,cancelled:false,finished:new Promise((r,j)=>{resolve=r;reject=j;}),finish(){if(!this.settled){this.settled=true;resolve();}},cancel(){this.cancelled=true;if(!this.settled){this.settled=true;reject(new Error('cancelled'));}},commitStyles:()=>Object.assign(this.style,frames.at(-1))};animations.push(a);return a;}
 }
 const doc=new E('document');doc.body=new E('body');doc.documentElement=new E('html');doc.documentElement.append(doc.body);doc.readyState='loading';doc.createElement=t=>new E(t);doc.getElementById=()=>null;Object.defineProperty(doc,'activeElement',{get:()=>focused});focused=doc.body;
 class Event {constructor(type,o={}){Object.assign(this,{type,bubbles:false,defaultPrevented:false,propagationStopped:false},o);}preventDefault(){this.defaultPrevented=true;}stopPropagation(){this.propagationStopped=true;}}
 const context={document:doc,window:{},innerWidth:800,innerHeight:800,matchMedia:()=>({matches:reduce,addEventListener(){}}),navigator:{},IntersectionObserver:class{observe(){}},MutationObserver:class{observe(){}},addEventListener(){},setTimeout(){return 1;},clearTimeout(){},requestAnimationFrame(){return 1;},cancelAnimationFrame(){},Event,CustomEvent:Event,getComputedStyle:e=>({position:'static',opacity:'1',transform:'none',clipPath:'none',borderRadius:'12px',borderTopLeftRadius:'12px',...e.style})};
 vm.createContext(context);vm.runInContext(source,context,{filename});
 const settle=async()=>{for(let i=0;i<8;i++){animations.filter(a=>!a.settled).forEach(a=>a.finish());await flush();}};
 const host=new E();host.dataset.stPreview='';doc.body.append(host);
 const morph=()=>{const trigger=new E('button'),menu=new E(),item=new E('button');menu.dataset.st='plus-menu';menu.dataset.stContained='';item.setAttribute('role','menuitem');menu.append(item);host.append(trigger,menu);context.window.SeenryTransitions.open(menu,trigger,{keyboard:true});item.focus();return {trigger,menu,item};};
 const card=()=>{const trigger=new E('button'),detail=new E(),cover=new E(),dest=new E(),button=new E('button');detail.dataset.st='expand';cover.dataset.stShared=dest.dataset.stShared='cover';button.dataset.stClose='';trigger.append(cover);detail.append(dest,button);host.append(trigger,detail);context.window.SeenryTransitions.expand(trigger,detail);return {trigger,detail,button};};
 const photo=(contained=true)=>{const trigger=new E('button'),img=new E('img');trigger.append(img);(contained?host:doc.body).append(trigger);context.window.SeenryTransitions.image(trigger);const dialog=(contained?host:doc.body).children.at(-1);return {trigger,img,dialog,button:dialog.querySelector('button')};};
 const key=(el,key='Escape',o={})=>{const e=new Event('keydown',{key,bubbles:true,...o});el.dispatchEvent(e);return e;};
 return {doc,E,S:context.window.SeenryTransitions,Event,settle,morph,card,photo,key,animations,focusLog,host};
}
async function test(name, fn){try{await fn();results.push({name,pass:true});}catch(e){results.push({name,pass:false,error:e.message.split("\n")[0]});}}
(async()=>{
for(const reduce of [false,true]){
 const mode=reduce?'reduce':'normal';
 for(const kind of ['morph','card']){
  await test(`${kind}/${mode}: hidden trigger receives focus only after reveal`,async()=>{const f=fixture(reduce),p=f[kind]();await f.settle();const layer=p.menu||p.detail;const before=f.focusLog.length;kind==='morph'?f.S.close(layer):f.S.collapse(layer);assert.equal(layer.inert,true);assert.equal(p.trigger.style.visibility,'hidden');assert.equal(f.doc.activeElement,f.doc.body);const attemptedHiddenFocus=f.focusLog.slice(before).some(r=>r.node===p.trigger);await f.settle();assert.equal(p.trigger.style.visibility,'');assert(f.doc.activeElement===p.trigger,'source must receive focus after its visibility is restored');assert(!attemptedHiddenFocus,'must not attempt hidden-trigger focus');assert.equal(layer.dataset.stOpen,'false');assert.equal(p.trigger.getAttribute('aria-expanded'),'false');});
  await test(`${kind}/${mode}: external focus ownership survives exit`,async()=>{const f=fixture(reduce),p=f[kind]();await f.settle();kind==='morph'?f.S.close(p.menu):f.S.collapse(p.detail);const other=new f.E('input');f.doc.body.append(other);other.focus();await f.settle();assert(f.doc.activeElement===other,'new external focus must be preserved');});
  await test(`${kind}/${mode}: newer focus then removal is not stolen from BODY`,async()=>{const f=fixture(reduce),p=f[kind]();await f.settle();kind==='morph'?f.S.close(p.menu):f.S.collapse(p.detail);const other=new f.E('input');f.doc.body.append(other);other.focus();other.remove();await f.settle();assert.equal(f.doc.activeElement,f.doc.body);});
  await test(`${kind}/${mode}: stale close cannot refocus or hide reopened layer`,async()=>{const f=fixture(reduce),p=f[kind]();await f.settle();const layer=p.menu||p.detail;kind==='morph'?f.S.close(layer):f.S.collapse(layer);kind==='morph'?f.S.open(layer,p.trigger,{keyboard:true}):f.S.expand(p.trigger,layer);(p.item||p.button).focus();await f.settle();assert.equal(f.doc.activeElement,p.item||p.button);assert.equal(layer.dataset.stOpen,'true');assert.equal(layer.inert,false);assert.equal(p.trigger.style.visibility,'hidden');});
  await test(`${kind}/${mode}: disconnected return target is not focused`,async()=>{const f=fixture(reduce),p=f[kind]();await f.settle();kind==='morph'?f.S.close(p.menu):f.S.collapse(p.detail);p.trigger.remove();const before=f.focusLog.length;await f.settle();assert(!f.focusLog.slice(before).some(x=>x.node===p.trigger));});
 }
 await test(`morph/${mode}: silent close does not claim focus`,async()=>{const f=fixture(reduce),p=f.morph();await f.settle();f.S.close(p.menu,{silent:true});await f.settle();assert.equal(f.doc.activeElement,f.doc.body);});
 await test(`card/${mode}: delegated Escape restores visible source`,async()=>{const f=fixture(reduce),p=f.card();await f.settle();assert(f.key(p.button).defaultPrevented);await f.settle();assert(f.doc.activeElement===p.trigger,'visible source must own final focus');assert.equal(p.detail.dataset.stOpen,'false');});
 await test(`image/${mode}: show() Escape is owned and fully cleaned up`,async()=>{const f=fixture(reduce),p=f.photo();await f.settle();assert.equal(p.dialog.modal,false);const first=f.key(p.button);assert(first.defaultPrevented,'non-modal Escape must request dismissal');assert(first.propagationStopped,'image Escape must not dismiss a parent layer');const count=f.animations.length;assert(f.key(p.button).defaultPrevented);assert.equal(f.animations.length,count,'repeated Escape must not restart the close');await f.settle();assert.equal(p.dialog.open,false);assert.equal(p.img.style.visibility,'');assert(f.doc.activeElement===p.trigger,'visible source must own final focus');assert(f.animations.filter(a=>p.dialog.contains(a.node)).every(a=>a.cancelled),'all dialog animation effects must release');const n=f.animations.length;f.S.closeImage();assert.equal(f.animations.length,n,'current-image ownership must be cleared');});
 await test(`image/${mode}: handled Escape remains handled by nested content`,async()=>{const f=fixture(reduce),p=f.photo();await f.settle();const e=f.key(p.button,'Escape',{defaultPrevented:true});assert.equal(e.propagationStopped,false);await f.settle();assert.equal(p.dialog.open,true);});
 await test(`image/${mode}: modal route retains native cancel handling`,async()=>{const f=fixture(reduce),p=f.photo(false);await f.settle();assert.equal(p.dialog.modal,true);const e=f.key(p.button);assert.equal(e.defaultPrevented,false,'showModal keydown must remain native');assert.equal(p.dialog.open,true);const cancel=new f.Event('cancel');p.dialog.dispatchEvent(cancel);assert(cancel.defaultPrevented);await f.settle();assert.equal(p.dialog.open,false);assert(f.doc.activeElement===p.trigger,'visible source must own final focus');});
 await test(`image/${mode}: stale Escape completion cannot close reopened photo`,async()=>{const f=fixture(reduce),p=f.photo();await f.settle();f.key(p.button);f.S.image(p.trigger);await f.settle();assert.equal(p.dialog.open,true);assert.equal(p.img.style.visibility,'hidden');assert(f.doc.activeElement===p.button,'reopened photo must retain button focus');});
 await test(`image/${mode}: external focus survives delayed close`,async()=>{const f=fixture(reduce),p=f.photo();await f.settle();f.S.closeImage();const other=new f.E('input');f.doc.body.append(other);other.focus();await f.settle();assert(f.doc.activeElement===other,'new external focus must be preserved');});
 await test(`image/${mode}: closing one photo cannot steal next photo's focus`,async()=>{const f=fixture(reduce),a=f.photo();await f.settle();const b=f.photo();await f.settle();assert.equal(a.dialog.open,false);assert.equal(b.dialog.open,true);assert(f.doc.activeElement===b.button,'new photo must retain button focus');});
}
const report={sourceSha256:require('node:crypto').createHash('sha256').update(source).digest('hex'),scope:'Exact production runtime in deterministic DOM/WAAPI; causal focus visibility, ownership and non-modal Escape contracts. Synthetic events and modeled geometry, not trusted-input/rendered/browser acceptance.',passed:results.filter(r=>r.pass).length,total:results.length,results};
if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));if(report.passed!==report.total)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
