// Full production runtime in the repository DOM/WAAPI model. No native paint claim.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const input=path.resolve(process.argv[2]||path.join(__dirname,'../skills/seenry/assets/components/transitions/seenry-transitions.js')),code=fs.readFileSync(input,'utf8');
const test=fs.readFileSync(path.join(__dirname,'transitions-library-card-input-policy.test.cjs'),'utf8'),scope={require,__dirname,process:{argv:['node','review',input]},console};
vm.runInNewContext(test.slice(0,test.indexOf('const alive='))+'\nthis.make=make;',scope);
const rect=(x,y,w,h)=>({left:x,top:y,right:x+w,bottom:y+h,width:w,height:h});
async function run(source,phase){
 const f=scope.make(source),E=f.env.E,sTitle=new E(),dTitle=new E();
 sTitle.dataset.stShared=dTitle.dataset.stShared='title';dTitle.setAttribute('data-st-shared-text','');sTitle.textContent=dTitle.textContent='A longer title';f.source.append(sTitle);f.surface.append(dTitle);
 const sc=f.source.querySelector('[data-st-shared="cover"]'),dc=f.detail.querySelectorAll('[data-st-shared]')[0];
 f.source.querySelector=s=>s==='[data-st-shared="title"]'?sTitle:s==='[data-st-shared="cover"]'?sc:null;
 const qall=f.detail.querySelectorAll;f.detail.querySelectorAll=s=>s==='[data-st-shared]'?[dc,dTitle]:s==='*'?[...qall(s),dTitle]:qall(s);
 for(const[e,r]of[[f.source,rect(0,0,100,130)],[f.surface,rect(0,0,160,100)],[sc,rect(0,0,100,100)],[dc,rect(0,0,100,100)],[sTitle,rect(0,108,50,20)],[dTitle,rect(108,0,50,20)]])e.getBoundingClientRect=()=>r;
 E.prototype.cloneNode=function(){const e=new E(this.tagName);e.dataset={...this.dataset};e.attrs={...this.attrs};e.style={...this.style};e.textContent=this.textContent;const r=this.getBoundingClientRect();e.getBoundingClientRect=()=>r;return e;};
 f.S.expand(f.source,f.detail,{keyboard:false});
 // Finish the actual shared trip; the production completion now schedules its fallback fade.
 f.animations.filter(a=>!a.cancelled).forEach(a=>a.finish());for(let i=0;i<20;i++)await Promise.resolve();
 let endpoint=dTitle;
 if(phase.startsWith('source')){f.S.collapse(f.detail,{keyboard:false});f.animations.filter(a=>!a.cancelled).forEach(a=>a.finish());for(let i=0;i<20;i++)await Promise.resolve();endpoint=sTitle;}
 const fade=f.animations.findLast(a=>a.owner===endpoint&&a.frames.some(k=>'opacity'in k));assert(fade);assert.equal(fade.options.duration,80);assert.equal(fade.cancelled,0);
 f.S.play(endpoint,[{opacity:.8},{opacity:.9}],{ms:400,channel:'o',current:false,blur:false});const unrelated=f.animations.at(-1);
 if(phase==='destination-reopen')f.S.collapse(f.detail,{keyboard:false});
 if(phase==='source-close'){f.S.expand(f.source,f.detail,{keyboard:false});f.S.collapse(f.detail,{keyboard:true});}
 else f.S.expand(f.source,f.detail,{keyboard:true});
 return {fade,unrelated,f};
}
(async()=>{let n=0;for(const phase of ['destination-direct','destination-reopen','source-open','source-close']){const good=await run(code,phase);assert(good.fade.cancelled>0,phase+' must retire the actual Card endpoint reveal');assert.equal(good.unrelated.cancelled,0,'Unrelated opacity owner is preserved');n++;const missing=code.replace('   retireExpandReveals(pairs);','').replace('retireExpandReveals(sharedPairs(source, detail));','');assert.notEqual(missing,code);const bad=await run(missing,phase);assert.equal(bad.fade.cancelled,0,'Removing the owner cleanup reproduces the surviving80ms fade');n++;}console.log(`${n}/${n} full-runtime endpoint-reveal contracts pass; actual80ms Card fades retire on both endpoints while unrelated opacity survives`);})().catch(e=>{console.error(e);process.exitCode=1});
