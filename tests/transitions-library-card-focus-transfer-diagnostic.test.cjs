// Execute the diagnostic's actual focus wrapper with a native-focus boundary model.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const code=fs.readFileSync(path.join(__dirname,'transitions-library-card-focus-transfer-diagnostic.browser.mjs'),'utf8');
const start=code.indexOf('function installDiagnostic('),end=code.indexOf('\nmkdirSync(out,',start);
assert(start>0&&end>start);
function run(nativeSucceeds,observerChangesFocus=false){
 const calls=[],listeners={};let originalRan=false;
 const element=id=>({tagName:id==='close'?'BUTTON':'DIV',id,hidden:false,inert:false,isConnected:true,tabIndex:0,getAttribute:()=>null,closest:()=>null,getAnimations:()=>[],contains:e=>e===source,addEventListener(){}});
 const source=element('source'),detail=element('detail'),surface=element('surface'),close=element('close'),group=element('group');group.inert=true;source.closest=()=>group;
 detail.dataset={stOpen:'true'};detail.hasAttribute=()=>false;detail.querySelector=()=>surface;surface.querySelector=()=>close;
 const document={activeElement:source,querySelector:()=>detail,addEventListener(type,fn){listeners[type]=fn;}};
 close.focus=function(){calls.push('native');originalRan=true;if(nativeSucceeds)document.activeElement=close;return 'native-result';};
 const scope={window:{__cardAnchorSource:source},document,performance:{now:()=>1},getComputedStyle:e=>{assert(originalRan,'Diagnostic must not read computed style before native focus');calls.push('computed');if(observerChangesFocus)document.activeElement=close;return {visibility:e===source?'hidden':'visible',display:'block',opacity:'1',transitionProperty:'all',transitionDuration:'100ms',transitionDelay:'0ms'};}};
 vm.createContext(scope);vm.runInContext(code.slice(start,end)+'\nthis.install=installDiagnostic;',scope);scope.install('function capture(){return {}}');
 assert.equal(close.focus({preventScroll:true}),'native-result');assert.equal(calls[0],'native');
 const row=scope.window.__focusTransferCalls[0];row.observerLeftCloseFocused=document.activeElement===close;return row;
}
assert.equal(run(true).focusedCloseAfterNative,true);
assert.equal(run(false).sourceFocusedAfterNative,true);
const perturbed=run(false,true);assert.equal(perturbed.focusedCloseAfterNative,false);assert.equal(perturbed.sourceFocusedAfterNative,true);assert.equal(perturbed.observerLeftCloseFocused,true,'Modeled observer perturbation must be reported separately from the saved native outcome');
const fallback=fs.readFileSync(path.join(__dirname,'transitions-library-card-anchor-fallback.browser.mjs'),'utf8');
const a='\nfunction capture(){\n',b='\nconst inside=(a,b)=>';assert.equal(fallback.split(a).length,2);assert.equal(fallback.split(b).length,2);const capture=fallback.slice(fallback.indexOf(a)+1,fallback.indexOf(b));assert(capture.startsWith('function capture(){\n')&&capture.endsWith('\n}'));new vm.Script('('+capture+')');
console.log('4/4 focus diagnostic boundary/extraction checks pass; instrumentation cannot replace native acceptance.');
