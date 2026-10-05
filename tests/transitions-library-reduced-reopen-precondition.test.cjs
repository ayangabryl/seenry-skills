// Tests the exact lifecycle classifier embedded in the native browser diagnostic.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const file=process.argv[2]||path.join(__dirname,'transitions-library-reduced-expand-reopen.browser.mjs'),source=fs.readFileSync(file,'utf8');
const a=source.indexOf('   function reopenReadiness('),b=source.indexOf('\n   window.__reducedReadiness=',a);assert(a>=0&&b>a);
const scope={};vm.createContext(scope);vm.runInContext(source.slice(a,b)+'\nthis.classify=reopenReadiness;',scope);
const pending={evidence:true,inlineOpacity:'',opacity:.4},committed={evidence:true,inlineOpacity:'0',opacity:0};
const pre=(close,content)=>({closing:'true',inert:true,open:'false',close,content:[content]});
assert.equal(scope.classify(pre(pending,pending),false),'ready');
assert.equal(scope.classify(pre(pending,pending),true),'wait');
assert.equal(scope.classify(pre(pending,committed),true),'wait');
assert.equal(scope.classify(pre(committed,pending),true),'wait');
assert.equal(scope.classify(pre(committed,committed),true),'ready');
assert.equal(scope.classify({...pre(committed,committed),closing:null},true),'blocked');
assert.equal(scope.classify(pre({...committed,opacity:.3},committed),true),'wait');
assert(source.includes("if(p.readiness==='wait'&&p.elapsed<500){requestAnimationFrame(attempt);return;}if(p.readiness!=='ready'){resolve();return;}"));
assert(source.indexOf("if(p.readiness!=='ready')")<source.indexOf('SeenryTransitions.expand(source,detail)'));
console.log('9/9 exact browser lifecycle precondition checks pass; pending80ms fades cannot count as committed restoration');
