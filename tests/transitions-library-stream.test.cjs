// Deterministic source-level stream contracts. No browser/visual score is implied.
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {test}=require('node:test');
const source=readFileSync(process.env.SEENRY_STREAM_SOURCE||process.argv[2]||path.join(__dirname,'../skills/seenry/assets/components/transitions/seenry-transitions.js'),'utf8');
const start=source.indexOf(' const streams = new WeakMap();'),end=source.indexOf(' /* ---------- Toast stack:',start);
assert(start>=0&&end>start,'Load the actual runtime stream implementation');
class Element {
 constructor(tag='div'){this.tagName=tag;this.children=[];this._text='';this.attrs={};this.events=[];this.isConnected=true;this.animations=[];}
 append(el){el.parent=this;this.children.push(el);}
 replaceChildren(){for(const el of this.children)el.parent=null;this.children=[];this._text='';}
 set textContent(text){this.replaceChildren();this._text=text;}
 get textContent(){return this._text+this.children.map(el=>el.textContent).join('');}
 get childElementCount(){return this.children.length;}
 setAttribute(name,value){this.attrs[name]=value;}
 dispatchEvent(event){this.events.push(event);}
 getAnimations(){return this.animations;}
 remove(){if(this.parent)this.parent.children=this.parent.children.filter(el=>el!==this);this.parent=null;this.isConnected=false;}
}
function fixture(reduce=true){
 let pending=[],nextId=0,now=0;const all=[];
 const descendants=el=>el.children.flatMap(n=>[n,...descendants(n)]);
 const qa=(el,selector)=>descendants(el).filter(n=>selector==='.st-word'?n.className==='st-word':n.className==='st-cite'||n.parent?.className==='st-word'&&n.tagName==='span');
 const context={doc:{createElement:tag=>new Element(tag)},reduced:()=>reduce,qa,
  cancelAnimationFrame:id=>pending=pending.filter(x=>x.id!==id),requestAnimationFrame:fn=>{pending.push({id:++nextId,fn});return nextId;},
  performance:{now:()=>now},CustomEvent:class{constructor(type,options){this.type=type;Object.assign(this,options);}},
  play:(el,frames,options)=>{const animation={currentTime:0,start:now,finished:false,effect:{getTiming:()=>({delay:options.delay||0})},finish(){this.finished=true;el.animations=el.animations.filter(x=>x!==this);}};el.animations.push(animation);all.push(animation);return Promise.resolve(true);}
 };
 vm.createContext(context);vm.runInContext(source.slice(start,end),context);
 const el=new Element();
 return {el,stream:(chunk,options)=>context.stream(el,chunk,options),flush(){const jobs=pending;pending=[];jobs.forEach(x=>x.fn());},advance(ms){now+=ms;for(const a of all)if(!a.finished)a.currentTime=now-a.start;},citations:()=>el.events.filter(e=>e.type==='st:cite').map(e=>e.detail.n),queued:()=>pending.length,descendants:()=>descendants(el)};
}
test('Reduced Stop keeps the already rendered answer and clears busy',()=>{const f=fixture();f.stream('Visible answer');f.flush();assert.equal(f.el.textContent,'Visible answer');f.stream('',{stop:true});assert.equal(f.el.textContent,'Visible answer');assert.equal(f.el.attrs['aria-busy'],'false');});
test('Reduced Stop preserves text and already emitted citations together',()=>{const f=fixture();f.stream('A [12] B');f.flush();f.stream('',{stop:true});assert.equal(f.el.textContent,'A 12 B');assert.deepEqual(f.citations(),[12]);});
test('Stop discards queued frame text before its first render',()=>{const f=fixture();f.stream('Visible',{done:true});f.stream(' future');assert.equal(f.queued(),1);f.stream('',{stop:true});f.flush();assert.equal(f.el.textContent,'Visible');assert.equal(f.queued(),0);});
test('Late chunks and final notifications cannot restart a stopped answer',()=>{const f=fixture();f.stream('Visible',{done:true});f.stream('',{stop:true});f.stream(' stale');f.stream(' final',{done:true});f.flush();assert.equal(f.el.textContent,'Visible');assert.equal(f.el.attrs['aria-busy'],'false');});
test('Explicit reset starts a fresh answer after Stop',()=>{const f=fixture();f.stream('Old',{done:true});f.stream('',{stop:true});f.stream('New [2]',{reset:true,done:true});assert.equal(f.el.textContent,'New 2');assert.deepEqual(f.citations(),[2]);});
test('Stop removes only unstarted animated letters and finishes started ones',()=>{const f=fixture(false);f.stream('ABCD');f.flush();f.advance(6);f.stream('',{stop:true});assert.equal(f.el.textContent,'AB');assert.equal(f.descendants().flatMap(e=>e.getAnimations()).length,0);f.stream('LATE');f.flush();assert.equal(f.el.textContent,'AB');});
test('Stop discards an unstarted citation without a later text reveal',()=>{const f=fixture(false);f.stream('A[1]');f.flush();f.advance(3);f.stream('',{stop:true});assert.equal(f.el.textContent,'A');f.advance(100);f.flush();assert.equal(f.el.textContent,'A');});
test('Literal brackets, whitespace and nonnumeric tokens retain exact text',()=>{const text='Use [draft], [[] and [x]  now\n[';const f=fixture();f.stream(text,{done:true});assert.equal(f.el.textContent,text);assert.deepEqual(f.citations(),[]);});
test('Complete citation retains its semantic event and text',()=>{const f=fixture();f.stream('See [12] now',{done:true});assert.equal(f.el.textContent,'See 12 now');assert.deepEqual(f.citations(),[12]);});
test('Every split of a citation across distinct RAF flushes has one semantic event',()=>{const text='See [123] now';for(let i=1;i<text.length;i++){const f=fixture();f.stream(text.slice(0,i));f.flush();f.stream(text.slice(i),{done:true});assert.equal(f.el.textContent,'See 123 now',`split ${i}`);assert.deepEqual(f.citations(),[123],`split ${i}`);}});
test('Character-at-a-time citations persist across multiple RAF flushes',()=>{const f=fixture();for(const c of 'A [12] [3] B'){f.stream(c);f.flush();}f.stream('',{done:true});assert.equal(f.el.textContent,'A 12 3 B');assert.deepEqual(f.citations(),[12,3]);});
test('Partial citation stays pending until completed instead of leaking its digits',()=>{const f=fixture();f.stream('A [12');f.flush();assert.equal(f.el.textContent,'A ');f.stream('] B');f.flush();assert.equal(f.el.textContent,'A 12 B');assert.deepEqual(f.citations(),[12]);});
test('End of stream flushes an incomplete citation as literal text',()=>{for(const text of ['A [','A [12']){const f=fixture();f.stream(text);f.flush();f.stream('',{done:true});assert.equal(f.el.textContent,text);assert.deepEqual(f.citations(),[]);}});
test('Nonnumeric continuation releases a pending bracket as literal text',()=>{const f=fixture();f.stream('A [12');f.flush();f.stream('x] B',{done:true});assert.equal(f.el.textContent,'A [12x] B');assert.deepEqual(f.citations(),[]);});
test('Stop cancels the incomplete citation buffer; later bracket is ignored',()=>{const f=fixture();f.stream('A [12');f.flush();f.stream('',{stop:true});f.stream('] future',{done:true});f.flush();assert.equal(f.el.textContent,'A ');assert.deepEqual(f.citations(),[]);});
test('Reset discards prior frame and incomplete-token work',()=>{const f=fixture();f.stream('Old [12');f.flush();f.stream(' stale');f.stream('New',{reset:true,done:true});f.flush();assert.equal(f.el.textContent,'New');assert.deepEqual(f.citations(),[]);});
test('Repeated Stop is idempotent with reduced-motion text',()=>{const f=fixture();f.stream('Keep',{done:true});f.stream('',{stop:true});f.stream('',{stop:true});assert.equal(f.el.textContent,'Keep');});
test('Detached target drops pending data and never appends it on reconnect',()=>{const f=fixture();f.stream('Old');f.el.isConnected=false;f.flush();f.el.isConnected=true;f.stream('New',{done:true});assert.equal(f.el.textContent,'New');});
