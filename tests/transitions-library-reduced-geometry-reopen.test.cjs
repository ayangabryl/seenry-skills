// New4.7.3 details own opacity, clipping, and translation. Exercise full production
// expand/collapse with a real shared-cover job keeping the exit pending in this VM.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const input=path.resolve(process.argv[2]||path.join(__dirname,'../skills/seenry/assets/components/transitions/seenry-transitions.js')),source=fs.readFileSync(input,'utf8');
const fixtureSource=fs.readFileSync(path.join(__dirname,'transitions-library-reduced-expand-reopen.test.cjs'),'utf8'),end=fixtureSource.indexOf('(async()=>{');
const scope={require,__dirname,process:{argv:['node','test',input]},console};vm.runInNewContext(fixtureSource.slice(0,end)+'\nthis.createFixture=fixture;',scope);
const flush=async()=>{for(let i=0;i<10;i++)await Promise.resolve();};
async function cycle(code,keyboard,committed){
 const f=scope.createFixture(code,keyboard,false,false),{E,context}=f.env,src=new E(),dst=new E();
 const rect=(x,y,w,h)=>({left:x,top:y,right:x+w,bottom:y+h,width:w,height:h});src.getBoundingClientRect=()=>rect(0,0,60,60);dst.getBoundingClientRect=()=>rect(20,20,88,88);dst.dataset.stShared='cover';f.source.append(src);f.surface.append(dst);
 const qa=f.detail.querySelectorAll;f.detail.querySelectorAll=s=>s==='[data-st-shared]'?[dst]:s==='*'?[...qa(s),dst]:qa(s);f.source.querySelector=s=>s==='[data-st-shared="cover"]'?src:null;
 context.DOMMatrix=class{constructor(v){this.m42=Number(/translateY\(([-\d.]+)px\)/.exec(v||'')?.[1]||0)}};
 const authored={opacity:'.65',clipPath:'inset(2px 3px 4px 5px)',transform:'translateY(7px)'};Object.assign(f.content.style,authored);
 f.S.expand(f.source,f.detail);for(const a of [...f.animations])a.finish();await flush();f.S.collapse(f.detail);
 const owned={};for(const property of ['opacity','clipPath','transform'])owned[property]=f.animations.findLast(a=>a.owner===f.content&&a.frames.some(k=>property in k));assert(Object.values(owned).every(Boolean));
 const oldCover=f.animations.findLast(a=>a.owner===dst),oldClose=f.animations.findLast(a=>a.owner===f.control&&a.frames.some(k=>'opacity'in k));
 if(committed){for(const a of Object.values(owned))a.finish();oldClose.finish();await flush();assert.equal(f.content.style.opacity,0);assert.notEqual(f.content.style.clipPath,authored.clipPath);assert.notEqual(f.content.style.transform,authored.transform);}
 assert.equal(f.detail.dataset.stClosing,'true','Shared-cover exit must still be active before reduced reversal');f.env.setReduced(true);f.S.expand(f.source,f.detail);
 const atReopen={...f.content.style};for(const a of [...Object.values(owned),oldCover,oldClose])a.finish();await flush();
 return {authored,atReopen,after:{...f.content.style},canceled:Object.fromEntries(Object.entries(owned).map(([p,a])=>[p,a.cancelled])),open:f.detail.dataset.stOpen,inert:f.detail.inert,focused:f.env.getActive()===f.control};
}
(async()=>{const results=[];for(const keyboard of [false,true])for(const committed of [false,true]){const r=await cycle(source,keyboard,committed);for(const p of ['opacity','clipPath','transform']){assert.equal(r.atReopen[p],r.authored[p]);assert.equal(r.after[p],r.authored[p]);assert(r.canceled[p]>0);}assert.equal(r.open,'true');assert.equal(r.inert,false);assert(r.focused);results.push({name:`Normal→reduced ${keyboard?'keyboard':'pointer'} reopen restores${committed?' held':' pending'} opacity/clip/translation`,pass:true,result:r});}
 const missing=source.replace("content.forEach(c => { stop(c, 'o'); stop(c, 'clip'); stop(c, 't'); });", "content.forEach(c => stop(c, 'o'));");assert.notEqual(missing,source);const bad=await cycle(missing,false,true);assert.notEqual(bad.after.clipPath,bad.authored.clipPath);assert.notEqual(bad.after.transform,bad.authored.transform);results.push({name:'Opacity-only cleanup causal control leaves committed clip and translation on reopened content',pass:true,result:bad});
 const native=fs.readFileSync(path.join(__dirname,'transitions-library-reduced-expand-reopen.browser.mjs'),'utf8');assert(native.includes('exitCommit.then(attempt)'));assert(native.includes("a.finished.catch(()=>false)"));assert(native.includes('window.__reducedExitJobs'));results.push({name:'Native committed phase follows actual child completion, retaining still-closing and held-zero guards',pass:true});
 const report={scope:'Complete production runtime with deterministic DOM/WAAPI; actual native new-layout verification remains required',passed:results.length,total:results.length,results};if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(report,null,2)+'\n');console.log(`${results.length}/${results.length} reduced geometry lifecycle checks pass; opacity-only control reproduces stale clipping/translation`);
})().catch(e=>{console.error(e);process.exitCode=1});
