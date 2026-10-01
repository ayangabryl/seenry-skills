// Regression replay of observed Mac geometry, RAF timestamps, and ANIMATED paint insets.
// Executes production sharedPairs(), ghost(), and travel(). DOM/WAAPI are deterministic
// fixtures: this is a cause-reproduction test, not a substitute for fresh browser capture.
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('node:assert/strict');
const input = process.argv[2] || path.resolve(__dirname, '../skills/seenry/assets/components/transitions/seenry-transitions.js');
const source = fs.readFileSync(input, 'utf8');
const recorded = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/transitions/mac-card-title-observed.json'), 'utf8'));
const sharedCode = source.slice(source.indexOf(' function sharedPairs('), source.indexOf(' function expandPaint('));
const ghostCode = source.slice(source.indexOf(' function ghost('), source.indexOf(' const followers ='));
const springCode = source.slice(source.indexOf(' const SPRINGS ='), source.indexOf(' /* play(el,'));
const parseCode = source.match(/^ function parseInset\(v\).*$/m)[0];
const b = r => ({x:r.left,y:r.top,w:r.width,h:r.height});
const mix = (a,c,p) => Object.fromEntries(Object.keys(a).map(k=>[k,a[k]+(c[k]-a[k])*p]));
const isGhost = e => e.ghost || e.dataset.stGhost !== undefined;
const walk = e => e.children.flatMap(c=>[c,...walk(c)]);
function matches(e, selector) {
 if (selector === '[data-st-shared]') return e.dataset.stShared !== undefined;
 if (selector === '[data-st-ghost]') return isGhost(e);
 if (selector === '[id],[data-st]') return !!e.id || e.dataset.st !== undefined;
 if (selector.includes('expand-surface')) return e.className === 'expand-surface';
 const key = /\[data-st-shared="([^"]+)"\]/.exec(selector);
 return key ? e.dataset.stShared === key[1] : false;
}
function transform(s) {
 const m=/translate\(([-\d.e]+)px, ([-\d.e]+)px\) scale\(([-\d.e]+), ([-\d.e]+)\)/.exec(s);
 assert(m,`finite transform expected: ${s}`); return m.slice(1).map(Number);
}
function frameAt(frames,p) {
 let i=frames.findIndex(f=>f.offset>=p); if(i<0)i=frames.length-1;
 const a=frames[Math.max(0,i-1)],c=frames[i],u=a===c?0:(p-a.offset)/(c.offset-a.offset);
 const x=transform(a.transform),y=transform(c.transform);return x.map((v,j)=>v+(y[j]-v)*u);
}
class E {
 constructor(rect,tag='div') {this.rect={...rect};this.tagName=tag.toUpperCase();this.nodeType=1;this.style={};this.dataset={};this.children=[];this.parentElement=null;this.isConnected=true;this.ghost=false;this.motion=null;this.progress=0;this.clientLeft=this.clientTop=this.scrollLeft=this.scrollTop=0;this.classList={add:()=>{}};}
 getBoundingClientRect() {
  let {x,y,w,h}=this.rect;
  if(this.style.position==='absolute'&&this.style.left!==undefined){const r=this.parentElement.getBoundingClientRect();x=r.left+parseFloat(this.style.left);y=r.top+parseFloat(this.style.top);w=parseFloat(this.style.width);h=parseFloat(this.style.height);}
  if(this.motion){const [dx,dy,sx,sy]=frameAt(this.motion,this.progress);x+=dx;y+=dy;w*=sx;h*=sy;}
  return {left:x,top:y,right:x+w,bottom:y+h,width:w,height:h};
 }
 get firstElementChild(){return this.children[0]||null;}
 append(...children){for(const e of children){e.parentElement=this;this.children.push(e);}}
 cloneNode(deep){const e=new E(this.rect,this.tagName);e.style={...this.style};e.dataset={...this.dataset};e.textContent=this.textContent;e.text=this.text;e.id=this.id;e.ghost=this.ghost;if(deep)e.append(...this.children.map(c=>c.cloneNode(true)));return e;}
 hasAttribute(k){return k==='data-st-shared-text'?!!this.text:k==='data-st-ghost'?isGhost(this):k==='id'?!!this.id:false;}
 setAttribute(k,v){if(k==='data-st-ghost')this.ghost=true;}
 removeAttribute(k){if(k==='id')delete this.id;if(k==='data-st')delete this.dataset.st;}
 querySelectorAll(s){return walk(this).filter(e=>matches(e,s));}
 querySelector(s){return this.querySelectorAll(s)[0]||null;}
 closest(s){for(let n=this;n;n=n.parentElement)if(matches(n,s))return n;return null;}
 contains(e){return this===e||walk(this).includes(e);}
 remove(){this.isConnected=false;if(this.parentElement)this.parentElement.children=this.parentElement.children.filter(c=>c!==this);}
}
const scope={clamp:(p,a,c)=>Math.min(c,Math.max(a,p)),q:(e,s)=>e.querySelector(s),qa:(e,s)=>e.querySelectorAll(s),positioned:e=>e,stop:e=>e.motion=null,stopAll:e=>e.motion=null,getComputedStyle:e=>({position:'static',clipPath:'none',font:'16px sans-serif',...e.style}),play:(e,frames,opts)=>{e.motion=frames;e.progress=0;e.options=opts;return new Promise(()=>{});}};
vm.createContext(scope);vm.runInContext(springCode+parseCode+ghostCode+sharedCode,scope);
function setup(run) {
 const g=run.g,src=new E(g.sf,'button'),detail=new E(g.st),surface=new E(g.st),paint=new E(g.st,'span');surface.className='expand-surface';detail.append(surface);
 const a=new E(g.af,'span'),label=new E(g.f,'b'),image=new E(g.at,'span'),title=new E(g.t,'h4');
 a.dataset.stShared=image.dataset.stShared='cover';label.dataset.stShared=title.dataset.stShared='title';title.text=true;title.textContent=label.textContent='Night Swim';src.append(a,label);surface.append(paint,image,title);
 return {g,src,detail,surface,paint,image,title,state:{source:src,paint,version:0},phase:null,phaseStart:null,phaseEnd:null,owner:null};
}
function actualShell(f) {const a=scope.parseInset(f.paint.style.clipPath);return a?{x:f.g.st.x+a[3],y:f.g.st.y+a[0],w:f.g.st.w-a[1]-a[3],h:f.g.st.h-a[0]-a[2]}:f.g.st;}
function progress(from,to,current) {
 let top=0,bottom=0;for(const k of ['x','y','w','h']){const d=to[k]-from[k];top+=(current[k]-from[k])*d;bottom+=d*d;}return bottom?Math.min(1,Math.max(0,top/bottom)):1;
}
function inside(t,s,e=.035){return t.x>=s.x-e&&t.y>=s.y-e&&t.x+t.w<=s.x+s.w+e&&t.y+t.h<=s.y+s.h+e;}
function disjoint(t,a,e=.035){return t.x+t.w<=a.x+e||t.x>=a.x+a.w-e||t.y+t.h<=a.y+e||t.y>=a.y+a.h-e;}
// Also drive the exact production sampled springs on simulated RAF time using the recorded
// input timestamps. These synthetic 60Hz samples are explicitly not captured browser frames.
function springAt(name,ms){const s=scope.spring(name),v=s.easing.slice(7,-1).split(',').map(Number),u=Math.min(1,Math.max(0,ms/s.duration))*(v.length-1),i=Math.floor(u);return v[i]+((v[i+1]??v[i])-v[i])*(u-i);}
function timedRun(run){
 const [open,close,reopen]=run.clicks.map(c=>c.at),end=reopen+scope.spring('expand').duration+20;
 const times=[open,close,reopen,...Array.from({length:Math.ceil((end-open)/(1000/60))+1},(_,i)=>Math.min(end,open+i*1000/60))].sort((a,b)=>a-b).filter((x,i,a)=>!i||x!==a[i-1]);
 let from=run.g.sf,to=run.g.st,start=open,phase='open';const trace=[];
 const sample=(at,shell)=>{const d=run.g.st;trace.push({at,open:phase==='close'?'false':'true',closing:phase==='close'?'true':null,shell,clip:`inset(${shell.y-d.y}px ${d.x+d.w-shell.x-shell.w}px ${d.y+d.h-shell.y-shell.h}px ${shell.x-d.x}px round 12px)`});};
 for(const at of times){let shell=mix(from,to,springAt(phase==='close'?'snappy':'expand',at-start));
  if(at===close||at===reopen){sample(at,shell);from=shell;to=at===close?run.g.sf:run.g.st;start=at;phase=at===close?'close':'reopen';}
  sample(at,shell);
 }
 return {...run,label:run.label+'-simulated-production-spring',trace};
}
const reports=[];
for(const run of [...recorded.runs,...recorded.runs.map(timedRun)]){
 const f=setup(run),issues=[],counts={duplicateSamples:0,escapeSamples:0,overlapSamples:0,hiddenSamples:0,identityChanges:0,inputJumps:0,scaledSamples:0},max={ghosts:0},starts=[];
 for(const row of run.trace){
  f.paint.style.clipPath=row.clip;
  const shell=actualShell(f);for(const k of Object.keys(shell))assert(Math.abs(shell[k]-row.shell[k])<.00001);
  const phase=row.closing?'close':f.phase==='close'||f.phase==='reopen'?'reopen':'open';
  if(phase!==f.phase){
   const previous=f.state.travelers?.get(f.title),before=previous&&b(previous.getBoundingClientRect());
   f.phase=phase;f.phaseStart={...shell};f.phaseEnd=phase==='close'?f.g.sf:f.g.st;f.state.version++;
   const pairs=scope.sharedPairs(f.src,f.detail);scope.travel(f.state,f.detail,pairs,phase==='close',f.state.version);
   const now=f.state.travelers.get(f.title);if(previous&&now!==previous)counts.identityChanges++;if(before){const r=b(now.getBoundingClientRect());if(Math.abs(r.x-before.x)>.035||Math.abs(r.y-before.y)>.035)counts.inputJumps++;}
   starts.push({at:row.at,phase,pairCount:pairs.length,before,after:b(now.getBoundingClientRect())});
  }
  const p=progress(f.phaseStart,f.phaseEnd,shell);
  for(const n of walk(f.detail))if(n.motion)n.progress=p;
  const ghosts=walk(f.detail).filter(n=>isGhost(n)&&n.isConnected),visible=ghosts.filter(n=>n.style.visibility!=='hidden'),image=b(f.image.getBoundingClientRect());
  max.ghosts=Math.max(max.ghosts,ghosts.length);if(ghosts.length!==1)counts.duplicateSamples++;if(visible.length!==1)counts.hiddenSamples++;
  for(const title of visible){const t=b(title.getBoundingClientRect());if(Math.abs(t.w-f.g.t.w)>.035||Math.abs(t.h-f.g.t.h)>.035)counts.scaledSamples++;if(!inside(t,shell)){counts.escapeSamples++;if(issues.length<5)issues.push({at:row.at,phase,reason:'paint-shell escape',title:t,shell});}if(!disjoint(t,image))counts.overlapSamples++;}
 }
 const pass=Object.values(counts).every(x=>x===0);reports.push({label:run.label,pass,counts,max,starts,issues});
}
// A generated wrapper containing a marked shared descendant must also be excluded.
const sample=setup(recorded.runs[0]),generated=new E(sample.g.t),nested=new E(sample.g.t);generated.ghost=true;nested.dataset.stShared='title';generated.append(nested);sample.surface.append(generated);const nestedExcluded=scope.sharedPairs(sample.src,sample.detail).length===2;
const result={sourceSha256:require('crypto').createHash('sha256').update(source).digest('hex'),scope:'Replay production discovery/ghost/travel against 36 observed Mac normal-motion traces plus 36 simulated production-spring schedules using recorded input timestamps; deterministic DOM/WAAPI fixtures, not a rendered pass.',nestedGeneratedDescendantExcluded:nestedExcluded,passed:reports.filter(r=>r.pass).length,total:reports.length,reports};
if(process.argv[3])fs.writeFileSync(path.resolve(process.argv[3]),JSON.stringify(result,null,2)+'\n');console.log(`${result.passed}/${result.total} observed/simulated shell replay runs pass; nested generated exclusion=${nestedExcluded}; exact source ${result.sourceSha256}`);
if(result.passed!==result.total||!nestedExcluded){console.log(JSON.stringify(reports.filter(r=>!r.pass).slice(0,2),null,2));process.exitCode=1;}
