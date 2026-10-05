// Replays candidate-6 Mac text envelopes and current animated paint insets.
// These are cause/regression checks, not a new browser or pixel acceptance run.
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('node:assert/strict');
const input = process.argv[2] || path.resolve(__dirname, '../skills/seenry/assets/components/transitions/seenry-transitions.js');
const source = fs.readFileSync(input, 'utf8');
const recorded = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/transitions/mac-spaced-title-observed.json'), 'utf8'));
const scope = {clamp:(x,a,b)=>Math.min(b,Math.max(a,x))};
vm.createContext(scope);
vm.runInContext(source.match(/^ function parseInset\(v\).*$/m)[0] + source.slice(source.indexOf(' const box = r =>'), source.indexOf(' function travel(')), scope);
const results = [], record = (name, fn) => {try {fn();results.push({name,pass:true});} catch(e) {results.push({name,pass:false,error:e.message});}};
const inside = (t,s,e=.05) => t.x>=s.x-e && t.y>=s.y-e && t.x+t.w<=s.x+s.w+e && t.y+t.h<=s.y+s.h+e;
const mix = (a,b,p) => Object.fromEntries(Object.keys(a).map(k=>[k,a[k]+(b[k]-a[k])*p]));
const observed = {normalRuns:0,spacedRuns:0,normalEscapes:0,spacedEscapes:0,maxExcess:0};
record('CSS inset expansion excludes round radius for all shorthand lengths',()=>{
 for(const [value,expected] of [['inset(3px round 16px)',[3,3,3,3]],['inset(3px 5px round 16px)',[3,5,3,5]],['inset(3px 5px 7px round 16px)',[3,5,7,5]],['inset(3px 5px 7px 11px round 16px)',[3,5,7,11]]]) assert.deepEqual(Array.from(scope.parseInset(value)),expected);
});
for(const run of recorded.runs) {
 let escaped = false;
 for(const frame of run.trace) {
  const a = scope.parseInset(frame.clip), d = run.g.st;
  const paint = a ? {x:d.x+a[3],y:d.y+a[0],w:d.w-a[1]-a[3],h:d.h-a[0]-a[2]} : d;
  for(const key of ['x','y','w','h']) assert(Math.abs(paint[key]-frame.shell[key])<.00001,`${run.label} shell parser`);
  for(const title of frame.titles) if(title.visibility!=='hidden') for(const r of [title.rect,...title.glyphs]) {
   if(!inside(r,paint)) escaped=true;
   observed.maxExcess=Math.max(observed.maxExcess,paint.x-r.x,paint.y-r.y,r.x+r.w-paint.x-paint.w,r.y+r.h-paint.y-paint.h);
  }
 }
 observed[run.spaced?'spacedRuns':'normalRuns']++;if(escaped)observed[run.spaced?'spacedEscapes':'normalEscapes']++;
 const g=run.g;
 record(`${run.label}: authored endpoint guard distinguishes actual impossible fit`,()=>{
  const route=scope.titleRoute(g.f,g.t,g.af,g.at,g.sf,g.st,g.t);
  if(run.spaced) assert.equal(route.kind,'fade','Candidate 6 incorrectly routed a destination-sized title beyond the initial source shell');
  else assert.notEqual(route.kind,'fade','Previously valid normal-title motion must remain available');
  if(run.spaced) assert.equal(scope.titleRoute(g.t,g.f,g.at,g.af,g.st,g.sf,g.t,true).kind,'fade','Closing must validate the source endpoint as well');
 });
 record(`${run.label}: content-width album-row geometry has a complete unscaled route`,()=>{
  // Geometry contract of the existing 60px album row: no font reduction, no clipping,
  // no change of line breaks during travel. Fresh browser captures verify the CSS realizes it.
  const sf={x:g.st.x+8,y:g.st.y+88,w:g.st.w-16,h:60},af={x:sf.x,y:sf.y,w:60,h:60};
  const f={x:sf.x+72,y:sf.y+30-g.f.h,w:sf.w-72,h:g.f.h};
  const route=scope.titleRoute(f,g.t,af,g.at,sf,g.st,g.t);assert.equal(route.kind,'direct');
  for(let i=0;i<=1000;i++) {const p=i/1000,s=mix(sf,g.st,p),a=mix(af,g.at,p),t={...mix(f,g.t,p),w:g.t.w,h:g.t.h};
   assert(inside(t,s),`title outside changing shell at ${p}`);
   assert(t.x>=a.x+a.w-.05||t.x+t.w<=a.x+.05||t.y>=a.y+a.h-.05||t.y+t.h<=a.y+.05,`title intersects cover at ${p}`);
  }
 });
}
record('Observed defect reproduced only in all24 spaced normal-motion runs',()=>{
 assert.equal(observed.normalRuns,24);assert.equal(observed.spacedRuns,24);assert.equal(observed.normalEscapes,0);assert.equal(observed.spacedEscapes,24);assert(Math.abs(observed.maxExcess-11.18775)<.00001);
});
record('Text bounds include inline text beyond every element-box edge',()=>{
 assert.equal(typeof scope.titleBox,'function');
 const r={left:10,top:20,right:80,bottom:44,width:70,height:24},rects=[{left:8,top:18,right:96,bottom:58,width:88,height:40}];
 const el={getBoundingClientRect:()=>r,ownerDocument:{createRange:()=>({selectNodeContents:e=>assert.equal(e,el),getClientRects:()=>rects})}};
 assert.deepEqual({...scope.titleBox(el)},{x:8,y:18,w:88,h:40});
});
record('Empty text rects do not expand text envelope',()=>{
 const el={getBoundingClientRect:()=>({left:10,top:20,right:80,bottom:44,width:70,height:24}),ownerDocument:{createRange:()=>({selectNodeContents:()=>{},getClientRects:()=>[{left:-100,top:-100,right:-100,bottom:-100,width:0,height:0}]})}};
 assert.deepEqual({...scope.titleBox(el)},{x:10,y:20,w:70,h:24});
});
record('A widened text envelope cannot reuse an element-only safe endpoint',()=>{
 const sf={x:0,y:0,w:100,h:100},st={x:0,y:0,w:220,h:200},f={x:6,y:65},t={x:110,y:20},af={x:6,y:0,w:54,h:54},at={x:12,y:12,w:88,h:88};
 assert.notEqual(scope.titleRoute(f,t,af,at,sf,st,{w:80,h:24}).kind,'fade');
 assert.equal(scope.titleRoute(f,t,af,at,sf,st,{w:108.515625,h:24}).kind,'fade');
});
const report={sourceSha256:require('crypto').createHash('sha256').update(source).digest('hex'),scope:'Observed candidate-6 cause replay and predicted corrected-layout geometry; fresh rendered acceptance is required',observed,passed:results.filter(r=>r.pass).length,total:results.length,results};
if(process.argv[3])fs.writeFileSync(path.resolve(process.argv[3]),JSON.stringify(report,null,2)+'\n');
console.log(`${report.passed}/${report.total} spaced-title regressions pass; observed ${observed.spacedEscapes}/${observed.spacedRuns} spaced escapes, ${observed.normalEscapes}/${observed.normalRuns} normal escapes, maximum${observed.maxExcess.toFixed(5)}px; source ${report.sourceSha256}`);
if(report.passed!==report.total){console.log(JSON.stringify(results.filter(r=>!r.pass),null,2));process.exitCode=1;}
