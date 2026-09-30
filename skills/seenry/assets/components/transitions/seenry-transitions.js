/* Seenry Transitions. Original implementation, MIT. Classic script; no dependencies. */
(function () {
 'use strict';
 const reduced = matchMedia('(prefers-reduced-motion: reduce)'), states = new WeakMap(), animations = new Map(), initialized = new WeakSet();
 const q = (el,s) => el.querySelector(s), qa = (el,s) => [...el.querySelectorAll(s)];
 const token=(el,name,fallback)=>getComputedStyle(el).getPropertyValue(name).trim()||fallback;
 const duration=(el,name='control')=>parseFloat(token(el,'--st-'+name,'160ms'));
 const ease=(el,curve='E')=>token(el,'--st-'+curve,'cubic-bezier(.16,1,.3,1)');
 function animate(el,frames,speed='control',delay=0,curve='E') {
  if(!el) return Promise.resolve();
  const old=animations.get(el), current=old?getComputedStyle(el):null;
  if(current) {const first={}; for(const key of Object.keys(frames[0])) first[key]=current[key];frames[0]=first;old.cancel();}
  if(reduced.matches||!el.animate) {el.style.willChange='';return Promise.resolve();}
  el.style.willChange=Object.keys(frames[0]).filter(x=>['transform','opacity','clipPath'].includes(x)).join(',');
  const a=el.animate(frames,{duration:typeof speed==='number'?speed:duration(el,speed),easing:ease(el,curve),delay,fill:'backwards'});animations.set(el,a);
  return a.finished.catch(()=>{}).finally(()=>{if(animations.get(el)===a){animations.delete(el);el.style.willChange='';}});
 }
 reduced.addEventListener('change',()=>{if(reduced.matches){for(const [el,a] of animations){a.cancel();el.style.willChange='';}qa(document,'[data-st]').forEach(el=>el.getAnimations({subtree:true}).forEach(a=>{try{a.finish();}catch{a.cancel();}}));}});
 function pop(el){return animate(el,[{transform:'scale(.97)'},{transform:'scale(1)'}],'control');}
 function number(el,value,options={}) {
  if(!el||!Number.isFinite(Number(value)))return;
  const formatter=new Intl.NumberFormat(options.locale||document.documentElement.lang||'en',options.format||{}), formatted=formatter.format(Number(value));
  let s=states.get(el);
  if(!s||s.type!=='number'){el.replaceChildren();const sr=document.createElement('span'),vis=document.createElement('span');sr.className='st-sr';vis.className='st-digits';vis.setAttribute('aria-hidden','true');el.append(sr,vis);s={type:'number',sr,vis,value:Number(value),text:'',cells:new Map()};states.set(el,s);el.classList.add('st-number');}
  if(s.text===formatted)return;
  const before=s.text,direction=Number(value)>=s.value?1:-1;s.sr.textContent=formatted;s.value=Number(value);s.text=formatted;
  const parts=formatter.formatToParts(Number(value)), entries=[];let integer=[...parts.filter(p=>p.type==='integer').map(p=>p.value).join('')].length, fraction=0,other=0;
  for(const part of parts)for(const ch of part.value){const digit=/\p{Nd}/u.test(ch),key=digit?(part.type==='fraction'?'f'+fraction++:'i'+--integer):part.type+other++;entries.push({ch,digit,key});}
  const keep=new Set(entries.map(e=>e.key));for(const [key,cell]of s.cells)if(!keep.has(key)){cell.remove();s.cells.delete(key);}
  let changed=0;
  for(const entry of [...entries].reverse()){
   let cell=s.cells.get(entry.key);if(!cell){cell=document.createElement('span');cell.className='st-place';s.cells.set(entry.key,cell);}
   let ink=cell.querySelector('.st-ink');if(ink?.textContent===entry.ch)continue;
   cell.querySelectorAll('.st-digit-exit').forEach(x=>{animations.get(x)?.cancel();x.remove();});
   const delay=0; // Frequent readouts never queue a digit cascade.
   if(ink&&entry.digit&&before&&!reduced.matches){const old=ink;old.className='st-digit st-digit-exit';animate(old,[{transform:getComputedStyle(old).transform,opacity:getComputedStyle(old).opacity,filter:getComputedStyle(old).filter},{transform:`translateY(${-direction*40}%)`,opacity:0,filter:'blur(4px)'}],'feedback',0,'X').then(()=>old.remove());}else ink?.remove();
   ink=document.createElement('span');ink.className='st-ink '+(entry.digit?'st-digit':'st-glyph');ink.textContent=entry.ch;cell.append(ink);
   if(before&&entry.digit){changed++;animate(ink,[{transform:`translateY(${direction*40}%)`,opacity:0,filter:'blur(4px)'},{transform:'none',opacity:1,filter:'blur(0px)'}],'control',duration(el,'feedback')/2+delay);}
  }
  entries.forEach(e=>s.vis.append(s.cells.get(e.key)));
 }
 function swapText(el,text){
  text=String(text);if(el.dataset.stLabel===text)return Promise.resolve();
  const current=q(el,'.st-text-value'), previous=current?.textContent??el.textContent;
  el.style.minWidth=Math.max(el.getBoundingClientRect().width,parseFloat(el.style.minWidth)||0)+'px';el.dataset.stLabel=text;
  qa(el,'.st-text-exit').forEach(x=>x.remove());
  const old=current||document.createElement('span');if(!current){old.textContent=previous;el.replaceChildren(old);}old.className='st-text-exit';old.setAttribute('aria-hidden','true');
  const next=document.createElement('span');next.className='st-text-value';next.setAttribute('aria-hidden','true');const sr=document.createElement('span');sr.className='st-sr';sr.textContent=text;qa(el,'.st-sr').forEach(x=>x.remove());el.append(next,sr);
  animate(old,[{opacity:getComputedStyle(old).opacity},{opacity:0}],'feedback',0,'F').then(()=>old.remove());
  const thinking=el.dataset.st==='thinking';
  return Promise.all([...text].map((ch,i)=>{const glyph=document.createElement('span');glyph.className='st-letter';glyph.textContent=ch;next.append(glyph);return animate(glyph,thinking?[{opacity:0},{opacity:1}]:[{opacity:0,transform:'translateY(40%)',filter:'blur(4px)'},{opacity:1,transform:'none',filter:'blur(0px)'}],thinking?'quick':'control',thinking?40:Math.min(i*20,60),thinking?'F':'E');}));
 }

 function shake(el){el.dataset.stError='true';const input=el.matches('input')?el:q(el,'input');input?.setAttribute('aria-invalid','true');return animate(el,[{transform:'translateX(0)'},...[-4,4,-4,4,-4,4,0].map(x=>({transform:`translateX(${x}px)`}))],240);}
 function success(el){el.dataset.stDone='true';return pop(el.querySelector('svg')||el);}
 const resizing=new WeakMap();
 function resize(el,update){
  // FLIP the shell and siblings. Text is painted once at its final unscaled geometry.
  const previous=resizing.get(el), first=previous?previous.ghost.getBoundingClientRect():el.getBoundingClientRect();
  previous?.cleanup();animations.get(el)?.cancel();
  const parent=el.parentElement,siblings=parent?[...parent.children].filter(x=>x!==el):[],before=new Map(siblings.map(x=>[x,x.getBoundingClientRect()]));
  const style=getComputedStyle(el),paint={background:style.background,border:style.border,borderRadius:style.borderRadius};
  const outgoing=el.cloneNode(true);outgoing.querySelectorAll('.st-resize-shell').forEach(x=>x.remove());
  update();const last=el.getBoundingClientRect();if(reduced.matches||!first.width||!last.width)return Promise.resolve();
  const ghost=document.createElement('div');ghost.setAttribute('aria-hidden','true');ghost.className='st-resize-shell';
  Object.assign(ghost.style,{position:'absolute',inset:'-1px',pointerEvents:'none',transformOrigin:'top left',zIndex:'-1',...paint});
  const saved={position:el.style.position,background:el.style.background,borderColor:el.style.borderColor,isolation:el.style.isolation};
  Object.assign(el.style,{position:'relative',isolation:'isolate',background:'transparent',borderColor:'transparent'});el.prepend(ghost);
  if(last.height<first.height){outgoing.removeAttribute('id');outgoing.removeAttribute('data-st');outgoing.querySelectorAll('[data-st]').forEach(x=>x.removeAttribute('data-st'));outgoing.setAttribute('aria-hidden','true');outgoing.inert=true;Object.assign(outgoing.style,{position:'absolute',left:'-1px',top:'-1px',width:first.width+'px',height:first.height+'px',margin:'0',pointerEvents:'none'});outgoing.querySelectorAll('[id]').forEach(x=>x.removeAttribute('id'));el.append(outgoing);animate(outgoing,[{opacity:1},{opacity:0}],'feedback',0,'F').then(()=>outgoing.remove());}
  if(last.height>first.height||last.width>first.width)animate(el,[{clipPath:`inset(0 ${Math.max(0,last.width-first.width)}px ${Math.max(0,last.height-first.height)}px 0 round ${paint.borderRadius})`},{clipPath:`inset(0 0 0 0 round ${paint.borderRadius})`}],'surface',0,'M');
  const state={ghost,cleanup:()=>{animations.get(ghost)?.cancel();ghost.remove();outgoing.remove();Object.assign(el.style,saved);if(resizing.get(el)===state)resizing.delete(el);}};resizing.set(el,state);
  siblings.forEach(x=>{const a=before.get(x),b=x.getBoundingClientRect();if(a.top!==b.top)animate(x,[{transform:`translateY(${a.top-b.top}px)`},{transform:'none'}],'surface',0,'M');});
  return animate(ghost,[{transform:`scale(${first.width/last.width},${first.height/last.height})`},{transform:'none'}],last.height<first.height?'relocate':'surface',last.height<first.height?60:0,'M').finally(()=>{if(resizing.get(el)===state)state.cleanup();});
 }

 let pageVersion=0;
 async function page(direction,update,el=document.documentElement){
  const version=++pageVersion;await update();if(version!==pageVersion)return;
  return animate(el,[{opacity:0,transform:`translateX(${direction==='back'?-12:12}px)`},{opacity:1,transform:'none'}],direction==='back'?'surface':'spatial',0,'M');
 }

 const activeLayers=new Map();
 function positionLayer(layer,trigger){const r=trigger.getBoundingClientRect();const b=layer.getBoundingClientRect();const below=r.bottom+b.height+8<innerHeight;layer.style.left=Math.max(8,Math.min(r.left,innerWidth-b.width-8))+'px';layer.style.top=(below?r.bottom+8:Math.max(8,r.top-b.height-8))+'px';if(layer.hasAttribute('data-st-morph')&&['menu','plus-menu'].includes(layer.dataset.st))layer.style.top=Math.max(8,Math.min(r.top,innerHeight-b.height-8))+'px';layer.style.setProperty('--st-origin',`${Math.max(0,r.left+r.width/2-parseFloat(layer.style.left))}px ${below?0:b.height}px`);}
 const layers=new WeakMap();
 function layerState(el){let s=layers.get(el);if(!s){s={open:false,version:0};layers.set(el,s);}return s;}
 function morphGeometry(el,s){
  const a=s.trigger.getBoundingClientRect(),b=el.getBoundingClientRect();
  s.from=`translate(${a.left-b.left}px,${a.top-b.top}px) scale(${a.width/b.width},${a.height/b.height})`;
  s.close.style.left=(a.left+a.width/2-b.left-el.clientLeft-22)+'px';s.close.style.top=(a.top+a.height/2-b.top-el.clientTop-22)+'px';
 }
 function open(el,trigger){
  if(!el)return;const s=layerState(el);s.trigger=trigger||s.trigger||document.activeElement;el._stTrigger=s.trigger;const was=s.open;s.open=true;s.version++;el.inert=false;el.dataset.stManaged='';el.dataset.stOpen='true';
  if(el.tagName==='DIALOG'){if(!el.open)el.showModal();}
  else if(el.hasAttribute('popover')){if(!el.matches(':popover-open'))el.showPopover();if(s.trigger){positionLayer(el,s.trigger);activeLayers.set(el,s.trigger);}}
  s.trigger?.setAttribute('aria-expanded','true');
  const morph=['menu','plus-menu','sheet','panel'].includes(el.dataset.st)&&s.trigger?.tagName==='BUTTON';
  if(morph){
   if(!s.shell){s.shell=document.createElement('div');s.shell.className='st-origin-shell';s.shell.setAttribute('aria-hidden','true');s.close=document.createElement('button');s.close.className='st-button st-origin-close';s.close.textContent='×';s.close.setAttribute('aria-label','Close');s.close.addEventListener('click',()=>close(el));el.prepend(s.shell);el.append(s.close);el.dataset.stMorph='';}
   if(el.hasAttribute('popover')){positionLayer(el,s.trigger);if(['menu','plus-menu'].includes(el.dataset.st)){el.style.top=Math.max(8,Math.min(s.trigger.getBoundingClientRect().top,innerHeight-el.offsetHeight-8))+'px';}}morphGeometry(el,s);s.trigger.style.opacity='0';
   const clock=['sheet','panel'].includes(el.dataset.st)?'spatial':'relocate';
   animate(s.shell,[{transform:s.from},{transform:'none'}],clock,0,'M');
   const content=[...el.children].filter(x=>x!==s.shell&&x!==s.close);
   content.forEach((x,i)=>{animate(x,[{opacity:0},{opacity:1}],'quick',40,'F');for(const node of [...x.childNodes])if(node.nodeType===3&&node.textContent.trim()){const ink=document.createElement('span');ink.className='st-surface-label';node.replaceWith(ink);ink.append(node);}qa(x,'.st-surface-label').forEach(ink=>animate(ink,[{filter:'blur(4px)'},{filter:'blur(0px)'}],'quick',Math.min(40+i*20,60),'F'));});
   animate(s.close,[{opacity:0},{opacity:1}],'quick',40,'F');
  }else if(!was){
   const tip=el.dataset.st==='tooltip';animate(el,[{opacity:0,transform:tip?'translateY(2px)':'translateY(12px) scale(.97)'},{opacity:1,transform:'none'}],tip?'quick':'surface');
  }
 }
 function close(el){
  if(!el)return;const s=layerState(el);s.open=false;const version=++s.version;
  s.trigger?.setAttribute('aria-expanded','false');el.inert=true;if(el.contains(document.activeElement)){s.trigger?.focus();}
  const finish=()=>{if(s.version!==version||s.open)return;
   if(el.tagName==='DIALOG')el.close();else if(el.hasAttribute('popover')&&el.matches(':popover-open'))el.hidePopover();
   el.dataset.stOpen='false';activeLayers.delete(el);if(s.trigger)s.trigger.style.opacity='';
  };
  if(s.shell){morphGeometry(el,s);[...el.children].filter(x=>x!==s.shell).forEach(x=>animate(x,[{opacity:getComputedStyle(x).opacity},{opacity:0}],'feedback',0,'F'));
   animate(s.shell,[{transform:getComputedStyle(s.shell).transform},{transform:s.from}],el.dataset.st==='panel'?'surface':'quick',0,'M').then(finish);
  }else animate(el,[{opacity:getComputedStyle(el).opacity,transform:getComputedStyle(el).transform},{opacity:0,transform:'translateY(6px) scale(.98)'}],el.dataset.st==='tooltip'?'feedback':'quick',0,'X').then(finish);
 }
 function icon(el,on){el.dataset.stOn=String(on);}
 function skeleton(el,ready){el.setAttribute('aria-busy',String(!ready));const real=q(el,'.st-real');if(real)real.inert=!ready;}
 function reveal(el){return Promise.all([...el.children].map((x,i)=>animate(x,[{opacity:.6,transform:'translateY(6px)'},{opacity:1,transform:'none'}],'surface',Math.min(i*20,60))));}
 function shimmer(el){let shine=q(el,'.st-shine');if(!shine){shine=document.createElement('span');shine.className='st-shine';shine.setAttribute('aria-hidden','true');shine.textContent=el.textContent;el.append(shine);}return animate(shine,[{clipPath:'polygon(-30% 0,-10% 0,-10% 100%,-30% 100%)'},{clipPath:'polygon(110% 0,130% 0,130% 100%,110% 100%)'}],'spatial');}
 const streams=new WeakMap();
 function stream(el,chunk,{reset=false,done=false}={}){
  let s=streams.get(el);if(!s){s={buffer:'',frame:0};streams.set(el,s);}
  if(reset){cancelAnimationFrame(s.frame);s.frame=0;s.buffer='';el.replaceChildren();}
  el.setAttribute('aria-busy',String(!done));s.buffer+=chunk||'';
  const flush=()=>{s.frame=0;if(!el.isConnected){s.buffer='';return;}if(s.buffer){const span=document.createElement('span');span.className='st-chunk';span.textContent=s.buffer;s.buffer='';el.append(span);animate(span,[{opacity:0},{opacity:1}],'feedback',0,'F');}};
  if(done){cancelAnimationFrame(s.frame);flush();el.dispatchEvent(new CustomEvent('st:stream-end',{bubbles:true}));}
  else if(!s.frame)s.frame=requestAnimationFrame(flush);
 }
 function toast(region,message){
  const el=document.createElement('div');el.className='st-toast';el.setAttribute('role','status');const text=document.createElement('span');text.textContent=message;const button=document.createElement('button');button.type='button';button.className='st-button';button.setAttribute('aria-label','Dismiss notification');button.textContent='×';el.append(text,button);region.append(el);
  const dismiss=()=>{if(el.dataset.stLeaving)return;el.dataset.stLeaving='true';el.inert=true;if(el.contains(document.activeElement))region._stTrigger?.focus();animate(el,[{opacity:getComputedStyle(el).opacity,transform:getComputedStyle(el).transform},{opacity:0,transform:'translateY(8px)'}],'quick',0,'X').then(()=>{const remaining=[...region.children].filter(x=>x!==el),before=new Map(remaining.map(x=>[x,x.getBoundingClientRect().top]));el.remove();remaining.forEach(x=>animate(x,[{transform:`translateY(${before.get(x)-x.getBoundingClientRect().top}px)`},{transform:'none'}],'relocate',0,'M'));});};button.addEventListener('click',dismiss);
  let drag;el.addEventListener('pointerdown',e=>{if(e.target.closest('button')||!e.isPrimary)return;const base=new DOMMatrixReadOnly(getComputedStyle(el).transform).m41;el.style.transform=`translateX(${base}px)`;animations.get(el)?.cancel();el.style.transition='none';drag={id:e.pointerId,x:e.clientX,start:e.clientX,base,time:performance.now()};el.setPointerCapture(e.pointerId);});
  el.addEventListener('pointermove',e=>{if(drag?.id!==e.pointerId)return;const dx=e.clientX-drag.start;el.style.transform=`translateX(${drag.base+dx}px)`;drag.x=e.clientX;});
  const release=e=>{if(drag?.id!==e.pointerId)return;const dx=e.clientX-drag.start,v=Math.abs(dx)/(performance.now()-drag.time);drag=null;el.style.transition='';if(e.type!=='pointercancel'&&(Math.abs(dx)>64||Math.abs(dx)>16&&v>.5))dismiss();else {const from=el.style.transform;el.style.transform='';animate(el,[{transform:from},{transform:'none'}]);}};el.addEventListener('pointerup',release);el.addEventListener('pointercancel',release);
  const active=[...region.children].filter(x=>!x.dataset.stLeaving);if(active.length>3)active[0].querySelector('button').click();animate(el,[{opacity:0,transform:'translateY(16px)'},{opacity:1,transform:'none'}],'surface');return {element:el,dismiss};
 }
 function tabSelect(root,tab,keyboard=false){const tabs=qa(root,'[role="tab"]');tabs.forEach(t=>{const active=t===tab;t.setAttribute('aria-selected',String(active));t.tabIndex=active?0:-1;const panel=document.getElementById(t.getAttribute('aria-controls'));if(panel){const was=panel.hidden;panel.hidden=!active;if(active&&was&&!keyboard)animate(panel,[{opacity:0},{opacity:1}],'quick',40,'F');}});const ind=q(root,'.st-tab-indicator'),list=q(root,'[role="tablist"]');if(ind&&list){ind.style.transitionDuration=keyboard?'0s':'';ind.style.transform=`translateX(${tab.offsetLeft}px) scaleX(${tab.offsetWidth})`;}root.dispatchEvent(new CustomEvent('st:tab-change',{bubbles:true,detail:{tab}}));}
 let tooltipTimer,tooltipCurrent,tooltipWarm=0;
 function hideTip(){clearTimeout(tooltipTimer);if(tooltipCurrent){close(tooltipCurrent);tooltipCurrent=null;tooltipWarm=Date.now()+100;}}
 const observer=new IntersectionObserver(entries=>{entries.forEach(({target,isIntersecting})=>{if(isIntersecting){if(target.dataset.st==='reveal'){reveal(target);observer.unobserve(target);}if(target.dataset.st==='shimmer'&&!target.dataset.stPlayed){target.dataset.stPlayed='true';shimmer(target);}animations.get(q(target,'.st-shine'))?.play();}else animations.get(q(target,'.st-shine'))?.pause();});});
 function init(root=document){const nodes=[...(root.matches?.('[data-st]')?[root]:[]),...qa(root,'[data-st]')];nodes.forEach(el=>{if(initialized.has(el))return;initialized.add(el);const kind=el.dataset.st;
  if(el.hasAttribute('popover'))el.addEventListener('beforetoggle',event=>{if(event.newState==='closed'){activeLayers.delete(el);const state=layers.get(el);if(state){state.open=false;state.version++;el.dataset.stOpen='false';el.inert=true;if(state.trigger)state.trigger.style.opacity='';}if(el.contains(document.activeElement))el._stTrigger?.focus();}});
  if(kind==='number'||kind==='badge')number(el,el.dataset.value??el.textContent.trim());if(kind==='badge')pop(el);
  if(kind==='panel'&&el.dataset.stOpen!=='true')el.inert=true;
  if(kind==='skeleton')skeleton(el,el.getAttribute('aria-busy')==='false');
  if(kind==='reveal'||kind==='shimmer')observer.observe(el);
  if(el.tagName==='DIALOG')el.addEventListener('cancel',e=>{e.preventDefault();close(el);});
  if(kind==='modal')el.addEventListener('close',()=>{if(el._stTrigger)el._stTrigger.setAttribute('aria-expanded','false');});
  if(kind==='menu'||kind==='plus-menu'){el.addEventListener('beforetoggle',e=>{qa(document,'[data-st-target]').filter(b=>b.dataset.stTarget===el.id).forEach(b=>b.setAttribute('aria-expanded',String(e.newState==='open')));});el.addEventListener('keydown',e=>{const items=qa(el,'button:not(:disabled),a[href]');let i=items.indexOf(document.activeElement);if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();i=e.key==='Home'?0:e.key==='End'?items.length-1:(i+(e.key==='ArrowDown'?1:-1)+items.length)%items.length;items[i]?.focus();}});}
  if(kind==='avatars'){const lift=index=>[...el.children].forEach((x,i)=>{const distance=Math.abs(index-i);x.style.setProperty('--st-lift',index<0?'0px':`${-Math.max(0,6-distance*2)}px`);x.style.setProperty('--st-z',i===index?'5':'0');});[...el.children].forEach((x,i)=>{x.addEventListener('pointerenter',()=>{if(matchMedia('(hover:hover) and (pointer:fine)').matches)lift(i);});x.addEventListener('focus',()=>lift(i));});el.addEventListener('pointerleave',()=>lift(-1));el.addEventListener('focusout',()=>lift(-1));}
  if(kind==='accordion'){const summary=q(el,'summary');summary.addEventListener('click',e=>{e.preventDefault();resize(el,()=>el.open=!el.open);const body=q(el,'.st-details-body');if(body){body.inert=!el.open;if(el.open)animate(body,[{opacity:0},{opacity:1}],'quick',40,'F');}});}
  if(kind==='clear'){const input=q(el,'input'),button=q(el,'button');const sync=()=>button.disabled=!input.value;sync();input.addEventListener('input',sync);button.addEventListener('click',()=>{const copy=document.createElement('span');copy.className='st-clear-copy';copy.textContent=input.value;Object.assign(copy.style,{position:'absolute',left:'13px',top:'10px',pointerEvents:'none',maxWidth:'calc(100% - 64px)',overflow:'hidden',whiteSpace:'nowrap'});copy.setAttribute('aria-hidden','true');el.append(copy);input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();animate(copy,[{opacity:1,transform:'none'},{opacity:0,transform:'translateY(-4px)'}],'quick',0,'X').then(()=>copy.remove());});}
  if(kind==='like')el.addEventListener('click',()=>{const on=el.getAttribute('aria-pressed')!=='true';el.setAttribute('aria-pressed',String(on));const n=q(el,'[data-st="number"]');if(n)number(n,(states.get(n)?.value||0)+(on?1:-1));pop(q(el,'svg'));el.dispatchEvent(new CustomEvent('st:like-change',{bubbles:true,detail:{liked:on,value:n?states.get(n)?.value:undefined}}));});
  if(kind==='tabs'){const tabs=qa(el,'[role="tab"]');let ind=q(el,'.st-tab-indicator');if(!ind){ind=document.createElement('span');ind.className='st-tab-indicator';ind.setAttribute('aria-hidden','true');q(el,'[role="tablist"]').append(ind);}tabs.forEach(t=>{t.addEventListener('click',()=>tabSelect(el,t));t.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const i=tabs.indexOf(t),next=tabs[e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length];tabSelect(el,next,true);next.focus();});});tabSelect(el,tabs.find(t=>t.getAttribute('aria-selected')==='true')||tabs[0],true);const ro=new ResizeObserver(()=>{if(el.isConnected)tabSelect(el,tabs.find(t=>t.getAttribute('aria-selected')==='true'),true);else ro.disconnect();});ro.observe(el);}
 });
 qa(root,'[data-st-tip]').forEach(trigger=>{if(initialized.has(trigger))return;initialized.add(trigger);const tip=document.getElementById(trigger.dataset.stTip);if(!tip)return;trigger.setAttribute('aria-describedby',tip.id);const show=immediate=>{hideTip();tooltipTimer=setTimeout(()=>{open(tip,trigger);tooltipCurrent=tip;},immediate||Date.now()<tooltipWarm?0:400);};trigger.addEventListener('pointerenter',()=>show(false));trigger.addEventListener('pointerleave',()=>{clearTimeout(tooltipTimer);tooltipTimer=setTimeout(hideTip,150);});trigger.addEventListener('focus',()=>show(true));trigger.addEventListener('blur',hideTip);tip.addEventListener('pointerenter',()=>clearTimeout(tooltipTimer));tip.addEventListener('pointerleave',hideTip);});
 }
 let positionFrame;const reposition=()=>{if(!activeLayers.size||positionFrame)return;positionFrame=requestAnimationFrame(()=>{positionFrame=0;for(const [layer,trigger]of activeLayers){if(layer.isConnected&&layer.matches(':popover-open')){positionLayer(layer,trigger);const s=layers.get(layer);if(s?.shell)morphGeometry(layer,s);}else activeLayers.delete(layer);}});};addEventListener('resize',reposition);addEventListener('scroll',reposition,{capture:true,passive:true});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')hideTip();});
 document.addEventListener('click',e=>{const trigger=e.target.closest('[data-st-target]');if(trigger&&!trigger.disabled){const el=document.getElementById(trigger.dataset.stTarget);if(!el)return;const isOpen=layers.has(el)?layers.get(el).open:el.tagName==='DIALOG'?el.open:el.hasAttribute('popover')?el.matches(':popover-open'):el.dataset.stOpen==='true';isOpen?close(el):open(el,trigger);trigger.setAttribute('aria-expanded',String(!isOpen));}const dismiss=e.target.closest('[data-st-close]');if(dismiss)close(dismiss.closest('dialog,[popover],[data-st="panel"],[data-st="sheet"]'));});
 const mutation=new MutationObserver(records=>{for(const record of records){if(record.type==='attributes'&&['number','badge'].includes(record.target.dataset.st))number(record.target,record.target.dataset.value);for(const node of record.addedNodes)if(node.nodeType===1)init(node);for(const node of record.removedNodes)if(node.nodeType===1&&!node.isConnected){for(const layer of [node,...qa(node,'[data-st-managed]')]){const s=layers.get(layer);if(s){s.version++;s.open=false;if(s.trigger)s.trigger.style.opacity='';activeLayers.delete(layer);}}observer.unobserve(node);qa(node,'[data-st=shimmer],[data-st=reveal]').forEach(el=>observer.unobserve(el));for(const [el,a]of animations)if(el===node||node.contains(el)){a.cancel();animations.delete(el);}}}});
 const start=()=>{init();mutation.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-value']});};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
 window.SeenryTransitions={number,swapText,shake,success,page,resize,pop,open,close,icon,skeleton,reveal,shimmer,stream,toast,init,tab:tabSelect};
})();
