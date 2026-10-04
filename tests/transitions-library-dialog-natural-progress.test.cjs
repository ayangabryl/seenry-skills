const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const assert=require('node:assert/strict'),test=require('node:test');
const main=fs.readFileSync(path.join(__dirname,'transitions-library-dialog.browser.mjs'),'utf8');
const video=fs.readFileSync(path.join(__dirname,'transitions-library-dialog-video.browser.mjs'),'utf8');
const cut=(s,a,b)=>{const i=s.indexOf(a),j=s.indexOf(b,i);assert(i>=0&&j>i);return s.slice(i,j);};
const natural=cut(main,'function naturalCoverage(','function isDialogExitScale(');
const api={};vm.runInNewContext(natural+';this.classify=naturalCoverage;',api);
const frame=exiting=>({modal:true,open:true,inert:exiting,expanded:exiting?'false':'true',animations:[{target:'dialog-1',pseudo:null,properties:['transform'],playState:'running',pending:false,currentTime:16,endTime:120}]});
const cycle=()=>({actions:[{kind:'before-close',...frame(false)},{kind:'before-reopen',...frame(true)}]});
test('normal coverage positively requires both progressed nonpending owned surface jobs',()=>assert.equal(api.classify(cycle()).status,'covered'));
for(const phase of [0,1])for(const [label,patch] of [['pending',{pending:true}],['unrecorded pending',{pending:undefined}],['zero time',{currentTime:0}],['negative time',{currentTime:-1}],['missing time',{currentTime:null}],['at end',{currentTime:120}],['paused',{playState:'paused'}]]){
 test(`${phase?'exit':'entry'} ${label} remains blocked coverage`,()=>{const r=cycle();Object.assign(r.actions[phase].animations[0],patch);assert.equal(api.classify(r).status,'blocked');});
}
test('all48 actual native routes retain their facts and classify37 progressed/11 blocked',()=>{
 const fixture=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/transitions/native-dialog-pending-progress-observed.json'),'utf8'));
 assert.equal(fixture.routes.length,48);let covered=0,blocked=0;
 for(const r of fixture.routes){const value=api.classify(r).status;assert.equal(value,r.expected_progressed?'covered':'blocked',`${r.platform}/${r.width}/${r.theme}/${r.route}`);if(value==='covered')covered++;else blocked++;}
 assert.deepEqual([covered,blocked],[37,11]);
 const removed=natural.replace('&&a.pending===false','').replace('&&a.currentTime>0',''),old={};assert.notEqual(removed,natural);vm.runInNewContext(removed+';this.classify=naturalCoverage;',old);
 assert.equal(fixture.routes.filter(r=>old.classify(r).status==='covered').length,48,'Removed guards reproduce the original overstatement');
});
const scale=cut(video,'function isDialogExitScale(','function dialogAnimationEvidence(');
const outgoing=video.match(/const outgoing=([^;]+);log\.naturalInterruptionCoverage=/)?.[1];assert(outgoing);
const v={window:{}};vm.runInNewContext(scale+';window.__dialogExitScale=isDialogExitScale;',v);vm.runInNewContext('this.classify=state=>'+outgoing+';',v);
const videoJob=()=>({target:'dialog-1',state:'running',pending:false,pseudo:null,endTransform:'scale(.97)',duration:120,currentTime:16,endTime:120});
test('video active-exit label uses the same strict pending/progress boundary',()=>{
 assert(v.classify({animations:[videoJob()]}));
 for(const change of [{pending:true},{pending:undefined},{currentTime:0},{currentTime:-1},{currentTime:null},{currentTime:120},{target:'child'},{pseudo:'::backdrop'},{state:'paused'}])assert(!v.classify({animations:[{...videoJob(),...change}]}),JSON.stringify(change));
});
test('actual video snapshot records both pending values instead of leaving them unknown',()=>{
 const install=cut(video,'function installRecorder(){','async function mark(');
 for(const pending of [true,false]){
  const active={tagName:'BUTTON',matches:()=>false},trigger={},d={open:true,inert:true,dataset:{stOpen:'false'},matches:()=>true,querySelector:()=>active,getBoundingClientRect:()=>({toJSON:()=>({})}),addEventListener:()=>{},getAnimations:()=>[{playState:'running',pending,currentTime:0,effect:{getComputedTiming:()=>({duration:120,endTime:120}),getKeyframes:()=>[{transform:'none'},{transform:'scale(.97)'}]}}]};
  const context={window:{dialogAnimationEvidence:()=>({target:'dialog-1',pseudo:null,properties:['transform']})},document:{querySelector:q=>q==='#dialog-1'?d:trigger,activeElement:active,addEventListener:()=>{}},performance:{now:()=>1},getComputedStyle:()=>({opacity:'1',filter:'none',transform:'none',getPropertyValue:()=> 'none'}),matchMedia:()=>({matches:false})};trigger.getAttribute=()=> 'false';
  vm.runInNewContext(install+';installRecorder();this.snapshot=window.__dialogVideoSnapshot();',context);assert.equal(context.snapshot.animations[0].pending,pending);
 }
});
test('controlled midpoint selector remains distinct and may select pending jobs before explicitly pausing them',()=>{
 const code=cut(main,'function selectMotionJobs(','function sampledMidpoints('),c={isDialogExitScale:()=>true};vm.runInNewContext(code+';this.select=selectMotionJobs;',c);const target={},job={playState:'running',pending:true,currentTime:0,effect:{target,pseudoElement:null,getComputedTiming:()=>({duration:120,endTime:120}),getKeyframes:()=>[{transform:'scale(.97)'}]}};
 assert.equal(c.select([job],target,true).length,1,'Only natural-progress labels changed; required controlled sampling keeps its own verified midpoint contract');
});
