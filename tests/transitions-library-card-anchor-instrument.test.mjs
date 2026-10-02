import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve,dirname,join} from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {instrumentPin} from './transitions-library-card-anchor-instrument.mjs';
const require=createRequire(import.meta.url),stage=resolve(process.argv[2]||join(dirname(fileURLToPath(import.meta.url)),'..')),input=join(stage,'skills/seenry/assets/components/transitions/seenry-transitions.js'),source=readFileSync(input,'utf8'),candidate=instrumentPin(source),fixture=readFileSync(join(stage,'tests/transitions-library-fixed-close-anchor.test.cjs'),'utf8');
const start=source.indexOf(' function pinExpandClose('),end=source.indexOf(' // Details hang',start);assert.equal(candidate.slice(0,start),source.slice(0,start));assert.equal(candidate.slice(candidate.indexOf(' // Details hang',start)),source.slice(end),'Injection must change only the pin helper');
function run(code,kind){
 const scope={require,__dirname:join(stage,'tests'),process:{argv:['node','test',input]},console,candidate:code};vm.runInNewContext(fixture.slice(0,fixture.indexOf('let passed=0;')).replace('scope.makeFixture(),','scope.makeFixture(candidate),')+'\nthis.make=make;',scope);const f=scope.make(),reads=[];
 for(const [name,e] of [['source',f.source],['surface',f.surface],['anchor',f.anchor],['close',f.control]]){const original=e.getBoundingClientRect;e.getBoundingClientRect=(...args)=>{reads.push('rect:'+name);return original(...args);};}
 const computed=f.env.context.getComputedStyle;f.env.context.getComputedStyle=e=>{reads.push('computed:'+(e===f.anchor?'anchor':e===f.control?'close':e===f.surface?'surface':e===f.source?'source':'other'));const result=computed(e);if(kind==='visibility'&&e===f.control&&f.control.style.positionAnchor)result.positionVisibility='anchors-visible';return result;};
 const supports=f.env.context.CSS.supports;f.env.context.CSS.supports=(...args)=>{reads.push('supports:'+args.join(':'));return kind==='unsupported'?false:supports(...args);};
 if(kind==='missing')f.source.querySelector=()=>null;
 if(kind==='outside')f.anchor.getBoundingClientRect=()=>{reads.push('rect:anchor');return {left:500,top:100,right:544,bottom:144,width:44,height:44};};
 if(kind==='unresolved')f.control.getBoundingClientRect=()=>{reads.push('rect:close');return {left:185,top:8,right:229,bottom:52,width:44,height:44};};
 f.S.expand(f.source,f.detail,{keyboard:false});return {reads,mode:f.control.dataset.stClosePinned||null,style:JSON.parse(JSON.stringify(f.control.style)),anchor:JSON.parse(JSON.stringify(f.anchor.style)),diagnostic:f.env.context.window.__anchorDiagnostic};
}
for(const [kind,branch]of [['good','pinned'],['missing','missing'],['outside','outside'],['unsupported','unsupported'],['unresolved','placement'],['visibility','placement']]){const a=run(source,kind),b=run(candidate,kind);assert.deepEqual(b.reads,a.reads,kind+': preserve native geometry/style/support read order exactly');assert.equal(b.mode,a.mode);assert.deepEqual(b.style,a.style);assert.deepEqual(b.anchor,a.anchor);assert(b.diagnostic.events.some(e=>e.kind===branch));if(['unresolved','visibility'].includes(kind))assert.equal(b.diagnostic.events.find(e=>e.kind==='placement').failed,true);if(kind==='good')assert.equal(b.diagnostic.events.find(e=>e.kind==='placement').failed,false);}
console.log('6/6 exact-runtime diagnostic controls pass; geometry/style/support read order and product result unchanged');

const diagnosticSource=readFileSync(join(stage,'tests/transitions-library-card-anchor-diagnostic.browser.mjs'),'utf8'),finalizerStart=diagnosticSource.indexOf('function finalizeRun('),finalizerEnd=diagnosticSource.indexOf('function installAnchorState(',finalizerStart);assert(finalizerStart>=0&&finalizerEnd>finalizerStart);
const finalize=vm.runInNewContext('('+diagnosticSource.slice(finalizerStart,finalizerEnd).trim()+')');
for(const status of ['pinned','fallback']){const run={status,errors:[]};assert.equal(finalize(run).status,status);}
const broken={status:'pinned',errors:['native crash'],firstRAF:{mode:'css'},diagnostic:{events:[{kind:'pinned'}]},frame:'retained.png'};finalize(broken);assert.equal(broken.status,'failed');assert.match(broken.error,/native crash/);assert.equal(broken.firstRAF.mode,'css');assert.equal(broken.diagnostic.events[0].kind,'pinned');assert.equal(broken.frame,'retained.png');
const prior={status:'failed',error:'original action failure',errors:['late native error']};finalize(prior);assert.equal(prior.error,'original action failure');assert.equal(prior.status,'failed');
assert(diagnosticSource.includes('await context.close();finalizeRun(run);writeFileSync'),'Finalize after native context closure, before writing retained case evidence');
console.log('4/4 diagnostic page-error classification controls pass; pin observations and earlier failures retained');
