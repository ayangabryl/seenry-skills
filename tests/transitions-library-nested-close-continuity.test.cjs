// Full-runtime geometry test with dynamic rectangles: parent translation changes
// the child's actual position. Fixed-rectangle tests cannot expose this origin bug.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const input=path.resolve(process.argv[2]||path.join(__dirname,'../skills/seenry/assets/components/transitions/seenry-transitions.js')),source=fs.readFileSync(input,'utf8');
const fixtureSource=fs.readFileSync(path.join(__dirname,'transitions-library-reduced-expand-reopen.test.cjs'),'utf8');
const scope={require,__dirname,process:{argv:['node','test',input]},console};vm.runInNewContext(fixtureSource.slice(0,fixtureSource.indexOf('(async()=>{'))+'\nthis.createFixture=fixture;',scope);
const xy=v=>String(v||'0px 0px').split(/\s+/).map(parseFloat),ty=v=>Number(/translateY\(([-\d.]+)px\)/.exec(v||'')?.[1]||0),rect=(x,y,w,h)=>({left:x,top:y,right:x+w,bottom:y+h,width:w,height:h});
const flush=async()=>{for(let i=0;i<10;i++)await Promise.resolve();};
async function replay(code){
 const f=scope.createFixture(code,true,true,false),cs=e=>{const out={...e.style};for(const a of f.animations.filter(a=>a.owner===e&&!a.cancelled)){const p=a.progress||0,first=a.frames[0],last=a.frames.at(-1);for(const property of Object.keys(last)){if(property==='translate'){const x=xy(first.translate),y=xy(last.translate);out.translate=`${x[0]+(y[0]-x[0])*p}px ${(x[1]||0)+((y[1]||0)-(x[1]||0))*p}px`;}else if(property==='transform'){out.transform=`translateY(${ty(first.transform)+(ty(last.transform)-ty(first.transform))*p}px)`;}else out[property]=p===1?last[property]:first[property];}}return out;};
 f.env.context.getComputedStyle=cs;f.env.context.DOMMatrix=class{constructor(v){this.m42=ty(v)}};
 f.source.getBoundingClientRect=()=>rect(0,0,80,80);f.surface.getBoundingClientRect=()=>rect(0,0,200,200);f.content.getBoundingClientRect=()=>rect(0,ty(cs(f.content).transform),200,200);f.control.getBoundingClientRect=()=>{const t=xy(cs(f.control).translate);return rect(160+(t[0]||0),4+ty(cs(f.content).transform)+(t[1]||0),32,32);};
 f.S.expand(f.source,f.detail);f.S.collapse(f.detail);
 // An explicitly controlled rendered wrapper offset simulates an in-flight owned t channel.
 // It is a causal state fixture, not a claim of native pixel evidence.
 f.S.play(f.content,[{transform:'translateY(40px)'},{transform:'translateY(40px)'}],{ms:300,channel:'t',current:false});
 const before=f.control.getBoundingClientRect();f.S.expand(f.source,f.detail);const first=f.control.getBoundingClientRect();
 const attachment=f.animations.findLast(a=>a.owner===f.control&&a.frames.some(k=>'translate'in k));assert(attachment);attachment.progress=1;const end=f.control.getBoundingClientRect();attachment.finish();await flush();const held=f.control.getBoundingClientRect(),heldTranslate=f.control.style.translate;
 f.env.setReduced(true);f.S.expand(f.source,f.detail);const cleaned=f.control.getBoundingClientRect(),cleanedTranslate=f.control.style.translate;
 return {before,first,end,held,heldTranslate,cleaned,cleanedTranslate,frames:attachment.frames,open:f.detail.dataset.stOpen,focused:f.env.getActive()===f.control};
}
(async()=>{const fixed=await replay(source);assert.equal(fixed.first.left,fixed.before.left);assert.equal(fixed.first.top,fixed.before.top,'Native focus settlement must preserve the previously rendered Close start');assert.equal(fixed.end.left,160);assert.equal(fixed.end.top,4,'The endpoint must use the restored parent origin, not the40px in-flight parent offset');assert.equal(fixed.held.left,160);assert.equal(fixed.held.top,4);assert.equal(fixed.cleaned.left,160);assert.equal(fixed.cleaned.top,4);assert.equal(fixed.cleanedTranslate,undefined,'Owned held translate must restore the authored empty style');assert.equal(fixed.open,'true');assert(fixed.focused);
 const early="  if (closeControl) { watchExpandCloseFocus(closeControl, s, surface); closeControl.focus?.({preventScroll: true}); if (s.version !== v || !s.open) return; revealFocusedExpandClose(closeControl); }";assert(source.includes(early));const bad=await replay(source.replace(early,"  if (closeControl) watchExpandCloseFocus(closeControl, s, surface);").replace("box(dr), 'expand', wasClosing, closeStart)","box(dr), 'expand', wasClosing)"));assert.equal(bad.before.top-bad.first.top,40);
 const report={scope:'Full-runtime dynamic-rectangle causal check, not native rendering',passed:2,total:2,fixed,removedSequencingControl:bad};if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(report,null,2)+'\n');console.log('2/2 nested Close continuity checks pass: start preserved, endpoint correct, held translate released; old sequencing jumps40px');
})().catch(e=>{console.error(e);process.exitCode=1});
