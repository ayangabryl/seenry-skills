// Execute the actual browser-harness writer against a temporary filesystem.
// These are model/I/O contracts; no Playwright import or browser is launched.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),test=require('node:test');
const input=path.resolve(process.argv[2]||path.join(__dirname,'transitions-library-close-attachment.browser.mjs')),source=fs.readFileSync(input,'utf8');
const slice=(start,end)=>{const a=source.indexOf(start),b=source.indexOf(end,a);assert(a>=0&&b>a,'Actual harness section is missing');return source.slice(a,b);};
const writer=slice('const savedReportRuns=','const spacing=');
const matrix={};vm.runInNewContext(slice('const profiles=','// Keyboard accepted-state observer:')+'\nthis.profiles=profiles;',matrix);
const cases=JSON.parse(JSON.stringify(matrix.profiles)).flatMap(profile=>(profile.delays||[50,100,150]).map(delay=>({...profile,delay})));
function fixture(t,report={mode:'native-close-assertions',browser:'model-Chromium',source:{html:'html-pin',runtime:'runtime-pin',css:'css-pin',galleryJS:'gallery-pin'},scope:'model evidence',runs:[]}){
 const out=fs.mkdtempSync(path.join(os.tmpdir(),'card-report-writer-'));t.after(()=>fs.rmSync(out,{recursive:true,force:true}));
 const writes=[],scope={report,out,join:path.join,writeFileSync:(file,data)=>{fs.writeFileSync(file,data);writes.push({file,bytes:Buffer.byteLength(data),format:JSON.parse(data).format});}};
 vm.runInNewContext(writer+'\nthis.save=saveReport;',scope,{filename:input});
 const read=file=>fs.readFileSync(path.join(out,file),'utf8'),count=file=>writes.filter(w=>w.file===path.join(out,file)).length;
 return {report,out,writes,save:scope.save,read,json:file=>JSON.parse(read(file)),count};
}
const evidence=seed=>Array.from({length:8},(_,at)=>({at,sourceGroupInert:true,title:{text:seed,painted:true,glyphs:[{left:0,right:140,top:0,bottom:22}],paintAncestors:[{filter:'none',diagnostic:'x'.repeat(4000)}]},close:{painted:true,ownsCenter:true},ghosts:[],details:[{text:'track',painted:true}]}));
test('startup saves a small progress index with original source metadata',t=>{
 const f=fixture(t),index=f.json('results.json');assert.equal(index.format,'incremental-case-index');assert.deepEqual(index.runs,[]);assert.deepEqual(index.source,f.report.source);assert.equal(index.browser,f.report.browser);assert.equal(f.writes.length,1);assert(f.read('results.json').length<1000);
});
test('all actual label/delay cases have distinct files and completed bytes are never rewritten',t=>{
 const f=fixture(t),completed=new Map();let maxIndexBytes=0;
 assert(cases.length>=15,'Exercise the complete input or anchor browser matrix');assert.equal(new Set(cases.map(r=>`${r.label}-${r.delay}-case.json`)).size,cases.length);
 for(const profile of cases){
  const run={...profile,status:'running',phase:'trusted-open-and-api-reversals',trace:evidence(profile.label),keyboardCloseTrace:evidence('keyboard'),keyboardCloseInitial:{detail:0,trusted:true},layout:{sourceText:profile.label}};f.report.runs.push(run);f.save();
  assert.equal(run.caseFile,`${profile.label}-${profile.delay}-case.json`);assert.deepEqual(f.json(run.caseFile),JSON.parse(JSON.stringify(run)));
  run.phase='focused-hover';f.save();run.status='passed';f.save();
  for(const [file,previous] of completed){assert.equal(f.read(file),previous.data,'Completed evidence bytes changed');assert.equal(f.count(file),previous.count,'Completed file was rewritten even if bytes matched');}
  completed.set(run.caseFile,{data:f.read(run.caseFile),count:f.count(run.caseFile)});
  const index=f.json('results.json');assert.equal(index.format,'incremental-case-index');assert.equal(index.runs.length,f.report.runs.length);
  for(const entry of index.runs){assert.equal(entry.trace,undefined);assert.equal(entry.keyboardCloseTrace,undefined);assert.equal(entry.keyboardCloseInitial,undefined);assert.equal(entry.layout,undefined);assert(entry.caseFile);}
  maxIndexBytes=Math.max(maxIndexBytes,Buffer.byteLength(f.read('results.json')));
 }
 assert(maxIndexBytes<1000+cases.length*600,'Progress must stay small per case over the full browser matrix');
 assert([...completed.values()].reduce((n,row)=>n+Buffer.byteLength(row.data),0)>1000000,'Exercise substantial retained RAF/leaf evidence');
 assert(f.writes.filter(w=>path.basename(w.file)==='results.json').every(w=>w.format==='incremental-case-index'),'No accumulated full report may be written during case progress');
 // Optional video progress must not rewrite even the last completed case.
 f.report.video={status:'running',phase:'recording',kind:'continuous Chromium recording'};f.save();f.save();
 for(const [file,previous] of completed){assert.equal(f.read(file),previous.data);assert.equal(f.count(file),previous.count);}
 const expected=JSON.parse(JSON.stringify(f.report));f.save(true);const final=f.json('results.json');assert.equal(final.format,undefined);assert.deepEqual(final,expected);
 assert.equal(f.writes.filter(w=>path.basename(w.file)==='results.json'&&w.format===undefined).length,1,'Assemble the full compatible report exactly once');
 for(const [file,previous] of completed){assert.equal(f.read(file),previous.data);assert.equal(f.count(file),previous.count);}
});
test('failed case keeps partial RAF/leaf evidence and error before subsequent cases or final output',t=>{
 const f=fixture(t),run={...cases[0],status:'running',phase:'keyboard-instant-state',trace:evidence('partial pointer'),keyboardCloseTrace:evidence('partial keyboard'),errors:['native page error']};f.report.runs.push(run);f.save();
 run.status='failed';run.error='AssertionError: keyboard instant paint failed\n    at strict assertion';f.save();const partial=f.read(run.caseFile),writes=f.count(run.caseFile);f.save();
 assert.equal(f.count(run.caseFile),writes,'Catch/finally must not duplicate terminal writes');const index=f.json('results.json');assert.equal(index.runs[0].status,'failed');assert.equal(index.runs[0].error,run.error);assert.equal(index.runs[0].phase,run.phase);assert.equal(index.runs[0].trace,undefined);
 f.report.runs.push({...cases[1],status:'running',phase:'navigate'});f.save();f.save(true);
 assert.equal(f.read(run.caseFile),partial);assert.equal(f.count(run.caseFile),writes);assert.deepEqual(f.json(run.caseFile),JSON.parse(JSON.stringify(run)));assert.deepEqual(f.json('results.json').runs[0],JSON.parse(partial));
});
test('an interrupted running case keeps its latest partial data at final assembly',t=>{
 const f=fixture(t),run={...cases[0],status:'running',phase:'navigate'};f.report.runs.push(run);f.save();run.phase='trusted-open-and-api-reversals';run.trace=evidence('fatal interruption');f.save(true);
 assert.deepEqual(f.json(run.caseFile),JSON.parse(JSON.stringify(run)));assert.deepEqual(f.json('results.json').runs[0],JSON.parse(JSON.stringify(run)));assert.equal(f.json('results.json').runs[0].status,'running','Interruption must not be mislabeled as success');
});
for(const status of ['recorded','blocked'])test(`video-only ${status} output retains recording metadata without synthetic cases`,t=>{
 const f=fixture(t);f.report.mode='representative-video-only';f.report.video={status:'running',phase:'enable-blur',source:f.report.source,viewport:{width:320,height:780}};f.save();
 Object.assign(f.report.video,{status,phase:'recording',actions:[{kind:'pointer-open',isTrusted:true}],file:status==='recorded'?'320-card-representative.webm':'320-card-attempt.webm',bytes:321,sha256:'video-pin',...(status==='blocked'?{error:'Failed native precondition',captureError:'Optional capture failure'}:{})});f.save();const expected=JSON.parse(JSON.stringify(f.report));f.save(true);
 assert.deepEqual(f.json('results.json'),expected);assert.deepEqual(fs.readdirSync(f.out),['results.json']);assert.equal(f.writes.filter(w=>w.format===undefined).length,1);
});
test('harness invokes one final assembly while preserving diagnostic and optional-video save sites',()=>{
 assert.equal((source.match(/saveReport\(true\)/g)||[]).length,1);assert(source.includes('}finally{await browser.close();saveReport(true);}'));
 assert(source.includes('phase:run.phase,error:run.error}));saveReport();await page.screenshot('),'Failed case data must be persisted before diagnostic screenshot');assert(source.includes('finally{saveReport();await context.close();}'));
 const video=slice(' if(recordVideo){','}finally{await browser.close()');assert(video.includes("report.video.phase='enable-blur';saveReport();"));assert(video.includes("report.video.phase='recording';saveReport();"));assert(video.includes('if(video&&!report.video.file)'));assert(video.includes('   saveReport();'));
});
