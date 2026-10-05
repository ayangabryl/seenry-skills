// Execute selection and completion helpers against the actual native profile matrix.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),test=require('node:test');
const source=fs.readFileSync(path.join(__dirname,'transitions-library-close-attachment.browser.mjs'),'utf8');
const slice=(a,b)=>{const x=source.indexOf(a),y=source.indexOf(b,x);assert(x>=0&&y>x);return source.slice(x,y);};
const scope={assert};vm.createContext(scope);vm.runInContext(slice('const profiles=','// Keyboard accepted-state observer:')+slice('function selectProfileShard(','const shardIndex=')+'\nthis.api={profiles,selectProfileShard,profileCaseKeys,assertCompleteProfileShard};',scope);
const {profiles,selectProfileShard,profileCaseKeys,assertCompleteProfileShard}=scope.api;
const terminal=selected=>selected.flatMap(p=>(p.delays||[50,100,150]).map(delay=>({...p,delay,status:'passed'})));
test('two deterministic shards cover all28 actual cases exactly once, preserving widths, titles, spacing and delays',()=>{
 const original=JSON.stringify(profiles),all=Array.from(profileCaseKeys(profiles)),a=selectProfileShard(profiles,0,2),b=selectProfileShard(profiles,1,2),keys=[...profileCaseKeys(a),...profileCaseKeys(b)];
 assert.equal(profiles.length,26);assert.equal(all.length,28);assert.deepEqual([profileCaseKeys(a).length,profileCaseKeys(b).length],[15,13]);assert.equal(new Set(keys).size,28);assert.deepEqual(keys.sort(),all.sort());assert.equal(JSON.stringify(profiles),original);assertCompleteProfileShard(terminal(a),a);assertCompleteProfileShard(terminal(b),b);assert.deepEqual(Array.from(profileCaseKeys(selectProfileShard(profiles,0,1))),Array.from(profileCaseKeys(profiles)));
});
test('invalid or empty partition configurations are rejected rather than producing a vacuous pass',()=>{for(const [index,count]of [[0,0],[0,-1],[0,27],[0,1.5],[-1,2],[2,2],[.5,2],[NaN,2],[0,NaN]])assert.throws(()=>selectProfileShard(profiles,index,count));assert.throws(()=>selectProfileShard([],0,1));assert.throws(()=>assertCompleteProfileShard([],[]));});
test('completion rejects omitted, duplicate, unexpected and nonterminal cases but retains terminal product failures',()=>{
 const selected=selectProfileShard(profiles,1,2),good=terminal(selected);
 for(const alter of [r=>r.pop(),r=>r.push({...r[0]}),r=>r[0].label='unexpected',r=>r[0].status='running']){const rows=JSON.parse(JSON.stringify(good));alter(rows);assert.throws(()=>assertCompleteProfileShard(rows,selected));}
 good[0].status='failed';assertCompleteProfileShard(good,selected);assert(source.includes("const failed=report.runs.filter(r=>r.status!=='passed')"),'Existing product failures still determine nonzero exit');
});
test('native loop uses selected profiles and records completion before optional independent video',()=>{assert(source.includes('if(!videoOnly)for(const profile of selectedProfiles)'));assert(source.includes('assertCompleteProfileShard(report.runs,selectedProfiles);report.coverage.executedComplete=true;saveReport();'));assert(source.includes("shardCount=Number(arg('--shard-count','1'))"));assert(source.includes('expectedCases:profileCaseKeys(selectedProfiles)'));});
