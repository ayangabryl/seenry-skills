// Causal viewport/observer scheduling checks against the actual runtime callbacks.
// Geometry is modeled from the captured Mac failure; native rendering remains separate.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(process.argv[2]||path.join(__dirname,'../skills/seenry/assets/components/transitions/seenry-transitions.js'),'utf8');
const selectStart=source.indexOf(' function revealTab('),selectEnd=source.indexOf(' /* ---------- Accordion:',selectStart);
const syncStart=source.indexOf('    const sync = () => { if (!el.isConnected) return ro.disconnect(); layoutInk(parts)'),syncEnd=source.indexOf('\n   }\n   if (kind === \'avatars\')',syncStart);
const resizeStart=source.indexOf(' let frame = 0;'),resizeEnd=source.indexOf(" mq.addEventListener('change'",resizeStart);
assert(selectStart>=0&&selectEnd>selectStart&&syncStart>=0&&syncEnd>syncStart&&resizeStart>=0&&resizeEnd>resizeStart);
function fixture(kind='tabs'){
 let next=0,frames=new Map(),inkSyncs=0,disconnects=0;
 const handlers=new Map(),roots=[],tabSyncs=new WeakMap();
 const list={clientWidth:196,clientLeft:0,scrollLeft:80,getBoundingClientRect:()=>({left:62}),scrollTo({left,behavior}){assert.equal(behavior,'instant');this.scrollLeft=Math.max(0,Math.min(left,this.scrollWidth-this.clientWidth));}};
 const ind={style:{width:'276px'}};
 Object.defineProperty(list,'scrollWidth',{get:()=>Math.max(list.clientWidth,276,parseFloat(ind.style.width)||0)});
 const tabs=[[0,74],[78,58],[140,59],[202,74]].map(([offsetLeft,offsetWidth],i)=>({offsetLeft,offsetWidth,attrs:{'aria-selected':String(i===3)},getAttribute(k){return this.attrs[k];},setAttribute(k,v){this.attrs[k]=v;},getBoundingClientRect(){const left=62+this.offsetLeft-list.scrollLeft;return {left,right:left+this.offsetWidth,width:this.offsetWidth};},focus(){throw Error('Resize must not steal focus');}}));
 const root={isConnected:true,dataset:{st:kind},dispatchEvent(){}},parts={list,ind,ink:null,tabs};roots.push(root);
 const c={el:root,parts,tabSyncs,doc:{getElementById:()=>null},active:new Set(),layers:new WeakMap(),POP:[],
  qa:()=>roots.filter(r=>r.isConnected),tabParts:()=>parts,layoutInk:()=>inkSyncs++,parseInset:()=>null,getComputedStyle:()=>({clipPath:'none'}),reduced:()=>false,stop(){},stopAll(){},CustomEvent:class{},
  ResizeObserver:class{constructor(fn){this.callback=fn;}observe(){}disconnect(){disconnects++;}},
  requestAnimationFrame:fn=>{frames.set(++next,fn);return next;},
  addEventListener:(type,fn)=>{if(!handlers.has(type))handlers.set(type,[]);handlers.get(type).push(fn);}
 };
 vm.createContext(c);vm.runInContext(source.slice(selectStart,selectEnd),c);vm.runInContext(source.slice(syncStart,syncEnd),c);vm.runInContext(source.slice(resizeStart,resizeEnd),c);
 const emit=type=>{for(const fn of handlers.get(type)||[])fn();};
 return {root,parts,c,roots,emit,get inkSyncs(){return inkSyncs;},get disconnects(){return disconnects;},
  width(value){list.clientWidth=value;list.scrollLeft=Math.min(list.scrollLeft,Math.max(0,list.scrollWidth-value));},
  flush(){const batch=[...frames.values()];frames.clear();batch.forEach(fn=>fn());},
  wideEnd(){this.width(295);list.scrollLeft=0;c.tabSelect(root,tabs[3],true);},
  visible(){const r=tabs[3].getBoundingClientRect();return r.left>=62-.5&&r.right<=62+list.clientWidth+.5;},
  resetCount(){inkSyncs=0;}
 };
}
const cases=[];function check(name,fn){fn();cases.push(name);}
check('Native resize repairs a same-size observer round trip after wide overflow clamps selection',()=>{
 const f=fixture();assert(f.visible());f.resetCount();f.wideEnd();f.emit('resize');f.width(196);f.emit('resize');assert.equal(f.parts.list.scrollLeft,0);assert(!f.visible());
 // No ResizeObserver callback is delivered: its last and final box sizes are identical.
 f.flush();assert(f.visible(),'Security remains selected but offscreen after the coalesced viewport round trip');assert.equal(f.parts.list.scrollLeft,80);assert.equal(f.parts.ind.style.width,'276px');assert.equal(f.parts.tabs[3].getAttribute('aria-selected'),'true');assert.equal(f.inkSyncs,1);
});
check('Several viewport notifications coalesce to one latest-layout synchronization',()=>{const f=fixture();f.resetCount();f.wideEnd();for(let i=0;i<5;i++)f.emit('resize');f.width(196);f.flush();assert.equal(f.inkSyncs,1);assert(f.visible());});
check('A later viewport notification schedules a fresh correction',()=>{const f=fixture();f.wideEnd();f.emit('resize');f.flush();f.width(196);f.emit('resize');f.flush();assert(f.visible());});
check('Manual strip scroll is not replaced by a permanent selected-tab loop',()=>{const f=fixture();f.resetCount();f.parts.list.scrollLeft=0;f.emit('scroll');f.flush();assert.equal(f.parts.list.scrollLeft,0);assert.equal(f.inkSyncs,0);});
check('Removed roots are not retained or called by the deferred viewport pass',()=>{const f=fixture();f.resetCount();f.emit('resize');f.root.isConnected=false;f.flush();assert.equal(f.inkSyncs,0);});
check('Reconnected roots are found at the current location without duplicating listeners',()=>{const f=fixture();f.root.isConnected=false;f.emit('resize');f.flush();f.root.isConnected=true;f.wideEnd();f.width(196);f.emit('resize');f.flush();assert(f.visible());});
check('Uninitialized roots are ignored by the shared resize pass',()=>{const f=fixture();f.roots.push({isConnected:true});f.emit('resize');f.flush();assert(f.visible());});
check('Segmented controls synchronize ink without introducing strip scrolling',()=>{const f=fixture('segmented');f.parts.list.scrollLeft=0;f.resetCount();f.emit('resize');f.flush();assert.equal(f.parts.list.scrollLeft,0);assert.equal(f.inkSyncs,1);});
console.log(`${cases.length}/${cases.length} viewport/tab scheduling checks passed; native resize evidence remains separate`);
