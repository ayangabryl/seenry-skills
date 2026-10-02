// Producer/schema contracts execute locally; no browser or model calls.
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const vm=require('node:vm');
const {test,before}=require('node:test');
const source=readFileSync(process.env.SEENRY_JUDGE_SOURCE||path.join(__dirname,'../skills/seenry/scripts/motion_judge.mjs'),'utf8');
let validMotionVerdict,KEYS;
before(async()=>{const m=await import(pathToFileURL(path.join(__dirname,'../skills/seenry/scripts/motion_contract.mjs')).href);validMotionVerdict=m.validMotionVerdict;KEYS=m.MOTION_SCORE_KEYS;});
const marker='// A quality failure is usable review evidence;';
const tail=source.slice(source.indexOf(marker));
assert(source.includes(marker),'Explicit producer outcome contract must exist');
const complete=(score=9)=>({scores:Object.fromEntries(['origin','attachment','choreography','character','exit','continuity','interruption','states','reduced_motion','overall'].map(k=>[k,k==='overall'?score:9])),rows:[{interaction:'Card',score:8,note:'A test row'}],verdict:'A complete fixture',fixes:[{interaction:'Card',problem:'A test finding',fix:'A proposed repair'}]});
function result(verdict,violations=[]){let data,exit;vm.runInNewContext(tail,{verdict,violations,validMotionVerdict,report:{violations},writeFileSync:(_p,s)=>data=JSON.parse(s),join:(...x)=>x.join('/'),out:'out',pages:[],console:{log(){}},process:{exit:c=>exit=c}});return {data,exit};}
for(const [name,verdict,violations,outcome,code] of [
 ['target met',complete(),[],'pass',0],['below target',complete(8),[],'quality-fail',1],
 ['hard violation',complete(),['held animation'],'quality-fail',1],['both failed',complete(7),['held animation'],'quality-fail',1],
 ['missing judgment',null,[],'unverified',2],['missing score',{scores:{}},[],'unverified',2],
 ['overall-only incomplete judgment',{scores:{overall:9},rows:[],fixes:[],verdict:'ok'},[],'unverified',2],
 ['string score',complete('9'),[],'unverified',2],['out of range',complete(11),[],'unverified',2],
 ['negative score',complete(-1),[],'unverified',2],['nonfinite score',complete(NaN),[],'unverified',2],
 ['violations without judgment',null,['held animation'],'unverified',2],
])test(name,()=>{const r=result(verdict,violations);assert.equal(r.exit,code);assert.equal(r.data.outcome,outcome);assert.deepEqual(r.data.violations,violations);});
for(const key of ['origin','attachment','choreography','character','exit','continuity','interruption','states','reduced_motion','overall'])test(`Missing required score ${key} is unverified`,()=>{const v=complete();delete v.scores[key];assert.equal(validMotionVerdict(v),false);assert.equal(result(v).exit,2);});
const malformed=[
 ['scores is null',v=>v.scores=null],['scores is an array',v=>v.scores=[]],
 ['fractional score',v=>v.scores.origin=8.5],['zero score',v=>v.scores.origin=0],['boolean score',v=>v.scores.origin=true],['null score',v=>v.scores.origin=null],['infinite score',v=>v.scores.origin=Infinity],['extra score key',v=>v.scores.other=9],
 ['verdict is not a string',v=>v.verdict={}],['missing verdict',v=>delete v.verdict],
 ['missing rows',v=>delete v.rows],['rows is not an array',v=>v.rows={}],['null row',v=>v.rows=[null]],
 ['row misses note',v=>delete v.rows[0].note],['row interaction is not text',v=>v.rows[0].interaction=5],['row score is a string',v=>v.rows[0].score='9'],['row score is fractional',v=>v.rows[0].score=8.5],['row score exceeds range',v=>v.rows[0].score=11],['extra row field',v=>v.rows[0].other=true],
 ['missing fixes',v=>delete v.fixes],['fixes is not an array',v=>v.fixes={}],['empty fixes',v=>v.fixes=[]],['too many fixes',v=>v.fixes=Array.from({length:11},()=>({...v.fixes[0]}))],['null fix',v=>v.fixes=[null]],['fix misses problem',v=>delete v.fixes[0].problem],['fix value is not text',v=>v.fixes[0].fix=42],['extra fix field',v=>v.fixes[0].other=true],['unknown verdict field',v=>v.other=true],
];
for(const [name,change]of malformed)test(`${name} is rejected before completion`,()=>{const v=complete();change(v);assert.equal(validMotionVerdict(v),false);assert.equal(result(v).exit,2);});
test('Every declared required top-level field is mandatory',()=>{for(const key of ['scores','rows','verdict','fixes']){const v=complete();delete v[key];assert.equal(validMotionVerdict(v),false,key);}});
test('Schema shapes do not impose new quality thresholds or row-count rules',()=>{const v=complete();v.scores.origin=1;v.rows=[];assert.equal(validMotionVerdict(v),true);assert.equal(result(v).exit,0);});
test('Ten fixes meet the declared maximum',()=>{const v=complete();v.fixes=Array.from({length:10},()=>({...v.fixes[0]}));assert.equal(validMotionVerdict(v),true);});
test('Only valid known producer annotations are accepted',()=>{const v={...complete(),cli:'codex',runs:[9,8,9],stillOpen:{criteria:['states'],interactions:['Card']}};assert.equal(validMotionVerdict(v),false);assert.equal(validMotionVerdict(v,{annotated:true}),true);assert.equal(result(v).exit,0);});
for(const [name,annotation]of [['numeric cli',{cli:9}],['empty runs',{runs:[]}],['invalid run',{runs:[11]}],['fractional run',{runs:[8.5]}],['malformed stillOpen',{stillOpen:[]}],['missing stillOpen keys',{stillOpen:{criteria:[]}}],['unknown stillOpen criterion',{stillOpen:{criteria:['bogus'],interactions:[]}}],['nontext interaction',{stillOpen:{criteria:[],interactions:[7]}}],['unknown stillOpen field',{stillOpen:{criteria:[],interactions:[],other:true}}]])test(`${name} is not a valid annotation`,()=>{assert.equal(result({...complete(),...annotation}).exit,2);});
// The internal branch uses stderr in its actual catch path; keep the same branch with
// process output captured, without starting a CLI.
function askResult(response,failed=false){let written,exit,error='';const block=source.slice(source.indexOf("if (flag('ask')) {"),source.indexOf('\n\nconst bare')).replaceAll('process.exit(', 'return fixtureExit(');vm.runInNewContext(`(function(){${block}})()`,{flag:()=>'/job',readFileSync:()=>JSON.stringify({result:'/result'}),findCli:()=>({cli:'claude'}),process:{env:{},stderr:{write:s=>error+=s}},askModel:()=>{if(failed)throw new Error('execution failed');return response;},validMotionVerdict,writeFileSync:(_p,s)=>written=JSON.parse(s),fixtureExit:c=>exit=c});return {written,exit,error};}
test('Raw model child accepts complete schema and adds only its CLI annotation',()=>{const r=askResult(complete());assert.equal(r.exit,0);assert.equal(r.written.cli,'claude');assert.equal(validMotionVerdict(r.written,{annotated:true}),true);});
test('Raw model child never writes partial JSON as completed output',()=>{const r=askResult({scores:{overall:9},rows:[],fixes:[],verdict:'ok'});assert.equal(r.exit,1);assert.equal(r.written,undefined);assert.match(r.error,/incomplete or malformed/);});
test('Raw model child never accepts model-supplied internal annotations',()=>{const r=askResult({...complete(),cli:'pretend'});assert.equal(r.exit,1);assert.equal(r.written,undefined);});
test('Tool exception never writes a judgment',()=>{const r=askResult(complete(),true);assert.equal(r.exit,1);assert.equal(r.written,undefined);});
test('Producer requests shared schema and validates runs before median aggregation',()=>{assert(source.includes('schema = MOTION_VERDICT_SCHEMA'));assert(source.includes('.filter(r => validMotionVerdict(r, {annotated: true}))'));assert(source.includes("if (code !== 0) throw new Error('model child failed')"));const results=[complete(),{scores:{overall:9}},{...complete(8),cli:'codex'}].filter(v=>validMotionVerdict(v,{annotated:true}));assert.equal(results.length,2);});
