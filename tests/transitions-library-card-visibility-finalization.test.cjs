const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const assert=require('node:assert/strict'),test=require('node:test');
const file=path.join(__dirname,'transitions-library-card-semantic-visibility.browser.mjs');
const source=fs.readFileSync(file,'utf8');
const a=source.indexOf('async function finalizeNativeCase('),b=source.indexOf('const profiles=',a);
assert(a>=0&&b>a);
const scope={};vm.createContext(scope);vm.runInContext(source.slice(a,b)+';this.finalize=finalizeNativeCase;',scope);
const snapshot=run=>JSON.parse(JSON.stringify(run));
test('late page errors delivered by context close fail before writing evidence',async()=>{
 const run={status:'passed',errors:[],firstRAF:{focusedClose:true}},order=[];let saved;
 await scope.finalize({close:async()=>{order.push('close');await Promise.resolve();run.errors.push('late native page error');}},run,()=>{order.push('write');saved=snapshot(run);});
 assert.deepEqual(order,['close','write']);assert.equal(saved.status,'failed');assert.deepEqual(saved.errors,['late native page error']);assert(saved.firstRAF.focusedClose);
});
test('context-close failure is retained without replacing the original action failure',async()=>{
 const run={status:'failed',error:'Original paint assertion',errors:[],initial:{visibility:'visible'}};let saved;
 await scope.finalize({close:async()=>{throw new Error('context teardown failed');}},run,()=>saved=snapshot(run));
 assert.equal(saved.status,'failed');assert.equal(saved.error,'Original paint assertion');assert.match(saved.errors[0],/Close context:.*context teardown failed/s);assert.equal(saved.initial.visibility,'visible');
});
test('clean passed cases write once only after context completion',async()=>{
 const run={status:'passed',errors:[]};let closed=false,writes=0;
 await scope.finalize({close:async()=>{await Promise.resolve();closed=true;}},run,()=>{assert(closed);writes++;assert.equal(run.status,'passed');});assert.equal(writes,1);
});
test('failed and nonterminal cases cannot become successful through clean teardown',async()=>{
 for(const status of ['failed','running']){const run={status,errors:[],trace:[{at:1}]};let saved;await scope.finalize({close:async()=>{}},run,()=>saved=snapshot(run));assert.equal(saved.status,'failed');assert.deepEqual(saved.trace,[{at:1}]);}
});
test('write errors propagate instead of fabricating completed evidence',async()=>{
 await assert.rejects(scope.finalize({close:async()=>{}},{status:'passed',errors:[]},()=>{throw new Error('artifact write failed');}),/artifact write failed/);
});
test('actual runner uses post-close finalization and browser-close errors remain nonzero',()=>{
 assert(source.includes('finally{await finalizeNativeCase(context,run,()=>{writeFileSync('));
 assert(source.includes("report.errors.push('Close browser: '"));
 assert(source.includes("if(report.errors.length||report.runs.some(r=>r.status!=='passed'))process.exitCode=1;"));
});
