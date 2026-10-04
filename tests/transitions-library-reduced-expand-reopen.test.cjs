// Reuses the repository's deterministic DOM/WAAPI fixture and executes the COMPLETE
// production runtime. This is causal state evidence, not real browser paint acceptance.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const input=path.resolve(process.argv[2]||path.join(__dirname,'../skills/seenry/assets/components/transitions/seenry-transitions.js')),source=fs.readFileSync(input,'utf8');
const logic=fs.readFileSync(path.join(__dirname,'transitions-library-logic.test.cjs'),'utf8'),prefix=logic.slice(0,logic.indexOf('const results=[];'));assert(prefix.length>1000);
function fixture(code,keyboard,nested=false,reduced=true){
 const shim={...fs,readFileSync:(file,...args)=>path.resolve(file)===input?code:fs.readFileSync(file,...args)};
 const scope={require:name=>name==='fs'?shim:require(name),__dirname,process:{argv:['node','test',input],on(){}},console};
 vm.runInNewContext(prefix+'\ncompleted=true;this.env={E,S,animations,setReduced:v=>reduce=v,setActive:e=>active=e,getActive:()=>active,context};',scope,{filename:'full-runtime-fixture.cjs'});
 const env=scope.env,{E,S,animations}=env;env.setReduced(reduced);
 const original=E.prototype.animate;E.prototype.animate=function(...args){const a=original.apply(this,args);a.owner=this;return a;};E.prototype.prepend=function(...nodes){this.append(...nodes);};E.prototype.contains=function(e){return this===e||this.children.some(c=>c.contains(e));};E.prototype.getBoundingClientRect=function(){return {left:0,top:0,right:200,bottom:200,width:200,height:200};};
 const detail=new E(),surface=new E(),control=new E('button'),content=new E(),sibling=new E(),source=new E('button');detail.dataset.st='expand';detail.append(surface);if(nested){surface.append(content,sibling);content.append(control);}else surface.append(control,content);
 control.style.opacity='.85';content.style.opacity='.65';sibling.style.opacity='.75';control.matches=selector=>selector===':focus-visible'&&keyboard;control.focus=()=>{env.setActive(control);control.dispatchEvent({type:'focus'});};
 detail.querySelector=selector=>selector==='.st-expand-surface,.expand-surface'?surface:null;detail.querySelectorAll=selector=>selector==='*'?[surface,control,content,sibling]:[];
 surface.querySelector=selector=>selector==='[data-st-close]'?control:null;surface.querySelectorAll=selector=>selector==='[data-st-expand-content]'?(nested?[content,sibling]:[content]):[];
 return {S,animations,detail,surface,control,content,sibling,source,env};
}
const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
async function reopen(code,keyboard,committed){
 const f=fixture(code,keyboard);f.S.expand(f.source,f.detail);f.S.collapse(f.detail);
 const oldContent=f.animations.filter(a=>a.owner===f.content).at(-1),oldClose=f.animations.filter(a=>a.owner===f.control).at(-1);assert(oldContent&&oldClose);
 if(committed){oldContent.finish();oldClose.finish();await flush();}
 f.S.expand(f.source,f.detail);const cancelled={content:oldContent.cancelled,close:oldClose.cancelled};oldContent.finish();oldClose.finish();await flush();
 return {open:f.detail.dataset.stOpen,focused:f.env.getActive()===f.control,contentOpacity:f.content.style.opacity,closeOpacity:f.control.style.opacity,cancelled};
}
(async()=>{
 const results=[];
 for(const keyboard of [false,true])for(const committed of [false,true]){
  const result=await reopen(source,keyboard,committed);assert.equal(result.open,'true');assert.equal(result.focused,true);assert.equal(result.contentOpacity,'.65','Outgoing content must not commit0 after reduced reopen');assert.equal(result.closeOpacity,'.85','Pointer or keyboard Close must restore authored opacity');assert(result.cancelled.content>0&&result.cancelled.close>0);results.push({name:`reduced${keyboard?' keyboard':' pointer'} reopen after${committed?' committed':' pending'} outgoing fades`,pass:true,result});
 }
 const cleanup="content.forEach(c => { stop(c, 'o'); stop(c, 'clip'); stop(c, 't'); });\n   if (closeControl) { stop(closeControl, 'o'); stop(closeControl, 'expand-close-position'); }";assert(source.includes(cleanup));
 const causalSource=source.replace(cleanup,''),control=await reopen(causalSource,false,false);assert.equal(control.contentOpacity,0);assert.equal(control.closeOpacity,'.85','Always-visible Close independently retires its outgoing opacity');results.push({name:'Removed-content cleanup reproduces hidden details while the independent Close guard remains effective',pass:true,result:control});
 const nested=fixture(source,true,true,false);nested.S.expand(nested.source,nested.detail);const wrapper=nested.animations.find(a=>a.owner===nested.content&&a.frames.some(f=>'opacity'in f)),sibling=nested.animations.find(a=>a.owner===nested.sibling&&a.frames.some(f=>'opacity'in f));assert(wrapper.cancelled>0,'Focused ancestor wrapper fade must be retired');assert.equal(sibling.cancelled,0,'Unrelated sibling fade must continue');assert.equal(nested.content.style.opacity,'.65');results.push({name:'Full runtime reveals nested focused Close ancestor without retiring sibling choreography',pass:true,result:{wrapperCancelled:wrapper.cancelled,siblingCancelled:sibling.cancelled}});
 const ancestor="  for (let n = control.parentElement; n && n !== owner.surface; n = n.parentElement) { stop(n, 'o'); stop(n, 'clip'); stop(n, 't'); }\n";assert(source.includes(ancestor));const nestedControl=fixture(source.replace(ancestor,''),true,true,false);nestedControl.S.expand(nestedControl.source,nestedControl.detail);const blocked=nestedControl.animations.find(a=>a.owner===nestedControl.content&&a.frames.some(f=>'opacity'in f));assert.equal(blocked.cancelled,0);results.push({name:'Removed-ancestor causal control retains the focused wrapper fade',pass:true,result:{wrapperCancelled:blocked.cancelled}});
 const report={sourceSha256:require('crypto').createHash('sha256').update(source).digest('hex'),scope:'Complete production runtime with deterministic DOM/WAAPI; actual browser validation remains required',passed:results.length,total:results.length,results};if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(report,null,2)+'\n');console.log(`${results.length}/${results.length} full-runtime reduced-reopen/nested-focus checks pass; both removed-guard controls reproduce their defects`);
})().catch(e=>{console.error(e);process.exitCode=1});
