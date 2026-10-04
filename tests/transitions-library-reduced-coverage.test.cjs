const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const input=process.argv[2]?.endsWith('.browser.mjs')?process.argv[2]:path.join(__dirname,'transitions-library-reduced-expand-reopen.browser.mjs');
const source=fs.readFileSync(input,'utf8');const begin=source.indexOf('function coverageFailures('),end=source.indexOf('\nconst phases=',begin);assert(begin>=0&&end>begin);
const scope={};vm.createContext(scope);vm.runInContext(source.slice(begin,end)+';this.failures=coverageFailures;',scope);
for(const [status,required,expected]of [['passed',true,0],['passed',false,0],['blocked',true,1],['blocked',false,0],['failed',false,1],['failed',true,1],['running',false,1],['passed',undefined,1]])assert.equal(scope.failures([{status,required}]).length,expected,`${status}/${required}`);
assert(source.includes("{name:'natural-80',delay:80,required:false}"));assert(source.includes("{name:'controlled-committed',delay:80,required:true,controlled:true}"));
assert(source.includes('heldShell.pause()'));assert(source.includes('heldShell=shellExit(detail)'));assert(source.includes("run.preReopen.controlled?.playState,'paused'"));assert(source.includes("run.controlledExit.afterReopen.playState,'idle'"));
assert(source.includes("if(heldShell.playState==='paused'||heldShell.pending)heldShell.play()"));assert(source.includes("assert.equal(f.nativeReducedMotion,true);assert.equal(f.blurEnabled,true)"));
assert(source.includes("Natural80ms committed-window diagnostics:"));assert(source.includes('saveReport();await context.close()'));assert(source.includes("e.message.startsWith('Precondition:')&&!run.errors.length?'blocked':'failed'"));
console.log('Native reduced coverage classifier and controlled-phase source contracts passed; no native execution inferred');

// Execute the actual in-browser selector against the same wrapper/surface distinction
// as production collapse(), rather than blessing an incorrect target string.
const a=source.indexOf('   function shellExit('),b=source.indexOf('   SeenryTransitions.collapse(detail)',a);assert(a>=0&&b>a);
const e={};vm.createContext(e);vm.runInContext(source.slice(a,b)+';this.find=shellExit;',e);
const surface={getAnimations:()=>[]},wrapper={querySelector:s=>s==='.st-expand-surface,.expand-surface'?surface:null,getAnimations:()=>[]};
const animation=target=>({constructor:{name:'Animation'},effect:{target,getKeyframes:()=>[{opacity:1},{opacity:0}]}});
const actual=animation(surface);surface.getAnimations=()=>[actual];assert.equal(e.find(wrapper),actual,'Controlled phase must target the animated inner surface');
const direct={querySelector:()=>null,getAnimations:()=>[]};const fallback=animation(direct);direct.getAnimations=()=>[fallback];assert.equal(e.find(direct),fallback,'Authored detail without a separate surface uses its own shell');
surface.getAnimations=()=>[animation(wrapper)];assert.equal(e.find(wrapper),undefined,'Another target cannot masquerade as the owned surface exit');
const child={};surface.getAnimations=()=>[actual,animation(child)];assert.equal(e.find(wrapper),actual,'Child opacity animation must not be held as the shell');
const incoming=animation(surface);incoming.effect.getKeyframes=()=>[{opacity:0},{opacity:1}];surface.getAnimations=()=>[incoming];assert.equal(e.find(wrapper),undefined,'An incoming animation cannot be mistaken for the outgoing shell');
const old=source.slice(a,b).replace("detail.querySelector('.st-expand-surface,.expand-surface')||detail",'detail');const broken={};vm.createContext(broken);vm.runInContext(old+';this.find=shellExit;',broken);surface.getAnimations=()=>[actual];assert.equal(broken.find(wrapper),undefined,'Removed inner-surface resolution reproduces the blocked old selector');
console.log('Native shell selector6causal cases pass; exact browser run remains required');
