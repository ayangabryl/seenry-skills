// Executes the full runtime with the existing DOM/WAAPI fixture, plus a narrowly
// modeled CSS opacity transition on restoration from a held zero. This exposes
// the exact missing dependency from Mac candidate11; it is not pixel acceptance.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const input=path.resolve(process.argv[2]||path.join(__dirname,'../skills/seenry/assets/components/transitions/seenry-transitions.js'));
const source=fs.readFileSync(input,'utf8'),css=fs.readFileSync(input.replace(/\.js$/,'.css'),'utf8');
const fixtureFile=fs.readFileSync(path.join(__dirname,'transitions-library-reduced-expand-reopen.test.cjs'),'utf8');
const fixturePrefix=fixtureFile.slice(0,fixtureFile.indexOf('(async()=>{'));
const scope={require,__dirname,process:{argv:['node','test',input]},console};
vm.runInNewContext(fixturePrefix+'\nthis.createFixture=fixture;',scope);
const exception=/\[data-st="expand"\], \[data-st="expand"\] \* \{ transition-property: ([^;]+) !important; \}/;
assert(/transition-property: opacity, color, background-color, box-shadow, fill, stroke !important/.test(css),'Retain the existing broad reduced rule as the causal setting');
const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve()};
function environment(code,style,keyboard){
 const f=scope.createFixture(code,keyboard),transitions=new Map();let now=0;
 const allowOpacity=!exception.test(style)||exception.exec(style)[1].split(',').map(s=>s.trim()).includes('opacity');
 f.surface.style.opacity='1';
 for(const e of [f.surface,f.control,f.content]){
  const raw=e.style;e.style=new Proxy(raw,{set(target,key,value){const previous=target[key];target[key]=value;if(key==='opacity'&&Number(previous)===0&&previous!==''&&value!==previous&&allowOpacity&&!(e===f.control&&style.includes('[data-st="expand"] [data-st-close] { transition-property: color, background-color, box-shadow, transform !important; }')))transitions.set(e,{from:0,to:value===''?1:Number(value),start:now,duration:100});return true;}});
 }
 f.env.context.getComputedStyle=e=>{
  const own=e.style.opacity==null||e.style.opacity===''?1:Number(e.style.opacity);let opacity=own;
  const t=transitions.get(e);if(t)opacity=t.from+(t.to-t.from)*Math.min(1,Math.max(0,(now-t.start)/t.duration));
  const a=f.animations.findLast(a=>a.owner===e&&!a.cancelled&&!a.ended&&a.frames.some(k=>'opacity'in k));
  if(a){const p=Math.min(1,Math.max(0,(now-a.started)/(a.options.duration||1))),first=Number(a.frames[0].opacity??own),last=Number(a.frames.at(-1).opacity??own);opacity=first+(last-first)*p;}
  return {...e.style,opacity:String(opacity)};
 };
 const original=f.env.E.prototype.animate;f.env.E.prototype.animate=function(...args){const a=original.apply(this,args);a.started=now;const finish=a.finish;a.finish=()=>{a.ended=true;finish.call(a)};return a;};
 return {f,setTime:v=>now=v,read:e=>Number(f.env.context.getComputedStyle(e).opacity),transitions,allowOpacity};
}
async function sequence(code,style,keyboard){
 const e=environment(code,style,keyboard),f=e.f;f.S.expand(f.source,f.detail);const opening=e.read(f.surface);f.S.collapse(f.detail);
 const oldContent=f.animations.findLast(a=>a.owner===f.content),oldClose=f.animations.findLast(a=>a.owner===f.control),oldSurface=f.animations.findLast(a=>a.owner===f.surface);assert(oldContent&&oldClose&&oldSurface);
 e.setTime(80);oldContent.finish();oldClose.finish();await flush();assert.equal(f.content.style.opacity,0);assert.equal(f.control.style.opacity,0);
 f.S.expand(f.source,f.detail);const frames=[];for(const at of [0,16,33,50,100]){e.setTime(80+at);const surface=e.read(f.surface),close=e.read(f.control),content=e.read(f.content);frames.push({at,surface,close,content,effectiveClose:surface*close,effectiveContent:surface*content});}
 oldSurface.finish();await flush();assert.equal(f.detail.dataset.stOpen,'true');assert.equal(f.detail.inert,false);assert.equal(f.env.getActive(),f.control);
 return {opening,frames,inline:{close:f.control.style.opacity,content:f.content.style.opacity,surface:f.surface.style.opacity},cssRestorationTransitions:e.transitions.size};
}
(async()=>{
 const results=[];
 const observed=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/transitions/mac-reduced-card-paint-observed.json'),'utf8'));
 const committed=observed.runs.filter(r=>r.delay===80&&r.preReopen.content.some(c=>c.inlineOpacity==='0'));
 assert(committed.length>=3);for(const r of committed){assert.equal(r.trace[0].content[0].opacity,0);assert(r.trace.some(f=>f.content[0].opacity>0&&f.content[0].opacity<.99));assert(r.trace.at(-1).content[0].opacity>=.99);}
 assert(observed.runs.filter(r=>!r.keyboard).every(r=>r.trace[0].surfaceOpacity<.99));
 results.push({name:'Actual Mac committed80ms restore shows a new CSS fade and every pointer reopen starts with translucent backing',pass:true,result:{committedRuns:committed.length,observedRuns:observed.runs.length}});
 for(const keyboard of [false,true]){const r=await sequence(source,css,keyboard);assert.equal(r.opening,1,'Reduced first opening must already have an opaque backing');for(const x of r.frames){assert.equal(x.surface,1);assert.equal(x.close,.85);assert.equal(x.content,.65);assert.equal(x.effectiveClose,.85);assert.equal(x.effectiveContent,.65);}assert.equal(r.cssRestorationTransitions,0);results.push({name:`${keyboard?'Keyboard':'Pointer'} committed exit restores first-frame backing and authored child opacity`,pass:true,result:r});}
 const withoutCss=css.replace(exception,'');const cssControl=await sequence(source,withoutCss,true);assert.equal(cssControl.frames[0].close,.85,'Independent Close CSS guard remains protective');assert.equal(cssControl.frames[0].content,0);assert(cssControl.frames[1].content>0&&cssControl.frames[1].content<.65);results.push({name:'Removed reduced CSS exception recreates hidden/attenuated details; the independent Close exception remains protective',pass:true,result:cssControl});
 const guard="stop(surface, 'o'); stop(paint, 'clip');",old="play(surface, [{opacity: 0}, {opacity: 1}], {ms: 'quick', fade: true, channel: 'o'}); stop(paint, 'clip');";assert(source.includes(guard));const shellControl=await sequence(source.replace(guard,old).replace("  stop(owner.surface, 'o');",''),css,false);assert(shellControl.opening<1);assert(shellControl.frames.some(x=>x.surface<.99));results.push({name:'Restored shell fade recreates translucent backing despite restored child opacity',pass:true,result:shellControl});
 const report={scope:'Deterministic full-runtime + explicitly modeled100ms CSS restoration, not browser rendering',passed:results.length,total:results.length,results};if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(report,null,2)+'\n');console.log(`${results.length}/${results.length} reduced-card paint checks pass; CSS and shell removed-guard controls reproduce their distinct defects`);
})().catch(e=>{console.error(e);process.exitCode=1});
