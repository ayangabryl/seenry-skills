// Deterministic DOM/WAAPI model adapted from the pinned focus/escape fixture.
// Executes the COMPLETE supplied production runtime. Capture/bubble ordering,
// native focus callbacks, animation sampling and geometry remain source models,
// not trusted browser, top-layer, timing, focus-ring or pixel evidence.
const vm = require('node:vm');
function fixture(source, reduce = false) {
 const flush = async () => { for (let i=0;i<12;i++) await Promise.resolve(); };
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
  addEventListener(k,fn,o={}){(this.handlers[k]??=[]).push({fn,capture:o===true||!!o.capture,once:!!o.once});} removeEventListener(k,fn){this.handlers[k]=(this.handlers[k]||[]).filter(h=>h.fn!==fn);}
  dispatchEvent(e){
   e.target??=this;const path=[];for(let p=this.parentElement;p;p=p.parentElement)path.push(p);
   const invoke=(node,capture)=>{e.currentTarget=node;for(const h of [...node.handlers[e.type]||[]])if(h.capture===capture){h.fn(e);if(h.once)node.removeEventListener(e.type,h.fn);if(e.immediateStopped)break;}};
   for(const node of [...path].reverse()){invoke(node,true);if(e.propagationStopped)return !e.defaultPrevented;}
   invoke(this,true);if(!e.immediateStopped)invoke(this,false);
   if(e.bubbles&&!e.propagationStopped)for(const node of path){invoke(node,false);if(e.propagationStopped)break;}
   return !e.defaultPrevented;
  }
  focus(options={}){let rejected=!this.isConnected;for(let e=this;e;e=e.parentElement)if(e.hidden||e.inert||e.style.visibility==='hidden')rejected=true;focusLog.push({node:this,rejected,options});if(rejected||focused===this)return;focused=this;this.dispatchEvent(new Event('focusin',{bubbles:true}));}
  getBoundingClientRect(){const r=this.rect;return {...r,right:r.left+r.width,bottom:r.top+r.height};}
  show(){this.open=true;this.modal=false;this.querySelector('button')?.focus();} showModal(){this.show();this.modal=true;}
  close(){this.open=false;if(this.contains(focused))focused=doc.body;}
  showPopover(){this.popoverOpen=true;this.querySelector('[autofocus]')?.focus();} hidePopover(){this.popoverOpen=false;}
  getAnimations(){return animations.filter(a=>a.node===this&&!a.cancelled);}
  animate(frames,options){let resolve,reject;const a={node:this,frames,options,settled:false,cancelled:false,finished:new Promise((r,j)=>{resolve=r;reject=j;}),finish(){if(!this.settled){this.settled=true;resolve();}},cancel(){this.cancelled=true;if(!this.settled){this.settled=true;reject(new Error('cancelled'));}},commitStyles:()=>Object.assign(this.style,frames.at(-1))};animations.push(a);return a;}
 }
 const doc=new E('document');doc.body=new E('body');doc.documentElement=new E('html');doc.append(doc.documentElement);doc.documentElement.append(doc.body);doc.readyState='loading';doc.createElement=t=>new E(t);doc.getElementById=id=>doc.querySelectorAll('*').find(e=>e.id===id||e.getAttribute('id')===id)||null;Object.defineProperty(doc,'activeElement',{get:()=>focused});focused=doc.body;
 class Event {constructor(type,o={}){Object.assign(this,{type,bubbles:false,defaultPrevented:false,propagationStopped:false,isTrusted:false,detail:0},o);}preventDefault(){this.defaultPrevented=true;}stopPropagation(){this.propagationStopped=true;}stopImmediatePropagation(){this.propagationStopped=this.immediateStopped=true;}}
 const styleOf=e=>{const style={position:'static',opacity:'1',transform:'none',filter:'none',clipPath:'none',borderRadius:'12px',borderTopLeftRadius:'12px',...Object.fromEntries(Object.entries(e.style).filter(([,v])=>v!==undefined&&v!==''))};for(const a of e.getAnimations())if(!a.options.pseudoElement)Object.assign(style,a.frames[a.settled?a.frames.length-1:0]);return style;};
 const context={document:doc,window:{},innerWidth:800,innerHeight:800,matchMedia:()=>({matches:reduce,addEventListener(){}}),navigator:{},IntersectionObserver:class{observe(){}},MutationObserver:class{observe(){}},addEventListener(){},setTimeout(){return 1;},clearTimeout(){},requestAnimationFrame(){return 1;},cancelAnimationFrame(){},Event,CustomEvent:Event,getComputedStyle:styleOf};
 vm.createContext(context);vm.runInContext(source,context,{filename:'seenry-transitions.js'});
 const settle=async()=>{for(let i=0;i<8;i++){animations.filter(a=>!a.settled).forEach(a=>a.finish());await flush();}};
 const host=new E();host.dataset.stPreview='';doc.body.append(host);
 const morph=()=>{const trigger=new E('button'),menu=new E(),item=new E('button');menu.dataset.st='plus-menu';menu.dataset.stContained='';item.setAttribute('role','menuitem');menu.append(item);host.append(trigger,menu);context.window.SeenryTransitions.open(menu,trigger,{keyboard:true});item.focus();return {trigger,menu,item};};
 const card=()=>{const trigger=new E('button'),detail=new E(),cover=new E(),dest=new E(),button=new E('button');detail.dataset.st='expand';cover.dataset.stShared=dest.dataset.stShared='cover';button.dataset.stClose='';trigger.append(cover);detail.append(dest,button);host.append(trigger,detail);context.window.SeenryTransitions.expand(trigger,detail);return {trigger,detail,button};};
 const photo=(contained=true)=>{const trigger=new E('button'),img=new E('img');trigger.append(img);(contained?host:doc.body).append(trigger);context.window.SeenryTransitions.image(trigger);const dialog=(contained?host:doc.body).children.at(-1);return {trigger,img,dialog,button:dialog.querySelector('button')};};
 const key=(el,key='Escape',o={})=>{const e=new Event('keydown',{key,bubbles:true,...o});el.dispatchEvent(e);return e;};
 return {doc,E,S:context.window.SeenryTransitions,Event,settle,morph,card,photo,key,animations,focusLog,host,styleOf};
}

module.exports = {fixture};
