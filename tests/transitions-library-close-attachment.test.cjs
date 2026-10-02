// Production Close-attachment helper replayed against observed candidate9 paint bounds.
// DOM/WAAPI are deterministic fixtures; fresh native pixels and inputs remain required.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const input=process.argv[2]||path.resolve(__dirname,'../skills/seenry/assets/components/transitions/seenry-transitions.js'),source=fs.readFileSync(input,'utf8');
const recorded=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/transitions/mac-close-shell-observed.json'),'utf8'));
const helper=source.slice(source.indexOf(' function attachExpandClose('),source.indexOf(' const cardClip ='));
assert(helper.includes('function attachExpandClose('),'Close needs an actual paint-attachment helper, not only an opacity fade');
const box=r=>({x:r.left,y:r.top,w:r.width,h:r.height}),rect=b=>({left:b.x,top:b.y,right:b.x+b.w,bottom:b.y+b.h,width:b.w,height:b.h});
const mix=(a,b,p)=>Object.fromEntries(Object.keys(a).map(k=>[k,a[k]+(b[k]-a[k])*p]));
const parse=v=>v&&v!=='none'?v.split(/\s+/).map(parseFloat):[0,0];
class Control{
 constructor(home,authored=''){this.home={...home};this.style={translate:authored};this.authored=authored;this.motion=null;this.progress=0;this.focused=true;this.disabled=false;this.tabIndex=0;}
 getBoundingClientRect(){let t=parse(this.style.translate);if(this.motion){const a=parse(this.motion[0].translate),b=parse(this.motion[1].translate);t=a.map((v,i)=>v+(b[i]-v)*this.progress);}return rect({...this.home,x:this.home.x+t[0],y:this.home.y+t[1]});}
}
const scope={box,stop:(e,channel)=>{assert.equal(channel,'expand-close-position');e.motion=null;e.style.translate=e.authored;},play:(e,frames,opts)=>{e.motion=frames;e.progress=0;e.opts=opts;return Promise.resolve(true);}};vm.createContext(scope);vm.runInContext(helper,scope);
const results=[],record=(name,fn)=>{fn();results.push({name,pass:true});};
const inside=(c,s,eps=.06)=>c.x>=s.x-eps&&c.y>=s.y-eps&&c.x+c.w<=s.x+s.w+eps&&c.y+c.h<=s.y+s.h+eps;
const progress=(from,to,current)=>{let num=0,den=0;for(const k of ['x','y','w','h']){const d=to[k]-from[k];num+=(current[k]-from[k])*d;den+=d*d;}return den?Math.max(0,Math.min(1,num/den)):1;};
let oldFloatingRuns=0,oldFloatingFrames=0;
for(const run of recorded.runs){
 const start=run.trace[0].shell,end=run.end,home={x:end.x+end.w-36,y:end.y+4,w:32,h:32};
 const oldBad=run.trace.filter(f=>f.at>=180&&f.at<=300&&!inside(home,f.shell));if(oldBad.length){oldFloatingRuns++;oldFloatingFrames+=oldBad.length;}
 record(`${run.label}: Close follows actual observed paint without scaling or losing focus`,()=>{
  const c=new Control(home),surface={getBoundingClientRect:()=>rect(end)};scope.attachExpandClose(c,surface,start,end,'expand',false);
  assert.equal(c.opts.spring,'expand');assert.equal(c.opts.current,false);assert.equal(c.opts.fill,'forwards');assert(c.motion.every(f=>Object.keys(f).every(k=>k==='translate')));
  for(const f of run.trace){c.progress=progress(start,end,f.shell);const r=box(c.getBoundingClientRect());assert(inside(r,f.shell),`Close escaped at${f.at}ms`);assert.equal(r.w,32);assert.equal(r.h,32);assert(c.focused&&!c.disabled&&c.tabIndex===0);}
 });
 for(const p of [.07,.25,.65,.9])record(`${run.label}: reverse at${p} and reopen continuously`,()=>{
  for(const size of [32,44])for(const q of [.25,.7]){
   const rest={x:end.x+end.w-4-size,y:end.y+4,w:size,h:size},c=new Control(rest),surface={getBoundingClientRect:()=>rect(end)};
   scope.attachExpandClose(c,surface,start,end,'expand',false);c.progress=p;const before=box(c.getBoundingClientRect()),mid=mix(start,end,p);
   scope.attachExpandClose(c,surface,mid,start,'snappy',true);assert.deepEqual(box(c.getBoundingClientRect()),before);
   for(let i=0;i<=100;i++){c.progress=i/100;assert(inside(box(c.getBoundingClientRect()),mix(mid,start,i/100)));}
   c.progress=q;const back=mix(mid,start,q),again=box(c.getBoundingClientRect());scope.attachExpandClose(c,surface,back,end,'expand',true);assert.deepEqual(box(c.getBoundingClientRect()),again);
   for(let i=0;i<=100;i++){c.progress=i/100;assert(inside(box(c.getBoundingClientRect()),mix(back,end,i/100)));}
  }
 });
}
record('Recorded385px Golden Hour geometry reproduces old visible fixed-endpoint escape',()=>{
 const r=recorded.runs.find(r=>r.label==='385-Golden Hour'),s=r.end,home={x:s.x+s.w-36,y:s.y+4,w:32,h:32};
 assert(r.trace.some(f=>f.at>=180&&f.at<=240&&!inside(home,f.shell)));assert(oldFloatingRuns>0&&oldFloatingFrames>0);
});
record('Authored individual translate is retained at the open endpoint and restored by cancellation',()=>{
 const end={x:0,y:0,w:300,h:240},start={x:80,y:90,w:180,h:60},home={x:260,y:8,w:32,h:32},c=new Control(home,'4px -4px'),surface={getBoundingClientRect:()=>rect(end)},rest=box(c.getBoundingClientRect());
 scope.attachExpandClose(c,surface,start,end,'expand',false);c.progress=1;assert.deepEqual(box(c.getBoundingClientRect()),rest);scope.stop(c,'expand-close-position');assert.equal(c.style.translate,'4px -4px');
});
record('Both directions use the same spring as their painted shell, with existing opacity/focus paths intact',()=>{
 assert(source.includes("box(dr), 'expand', wasClosing, closeStart)"));assert(source.includes("box(sr), 'snappy', true)"));assert(source.includes("if (!closeControl) focusFirst(detail)"));assert(source.includes("if (closeControl) stop(closeControl, 'expand-close-position')"));assert(source.includes("qa(detail, '*').forEach(stopAll)"));
});
const report={sourceSha256:require('crypto').createHash('sha256').update(source).digest('hex'),scope:'Causal replay and modeled interruption; fresh native rendered/input acceptance remains required',oldFloatingRuns,oldFloatingFrames,passed:results.length,total:results.length,results};
if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(report,null,2)+'\n');console.log(`${results.length}/${results.length} Close attachment checks passed; old fixed endpoint escapes in${oldFloatingFrames}observed-shell samples/${oldFloatingRuns}runs; no rendered pass claimed`);
