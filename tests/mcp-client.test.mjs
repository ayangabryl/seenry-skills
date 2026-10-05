import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SeenryClient,ENDPOINT} from '../skills/seenry/scripts/mcp-client.mjs';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,readFileSync,existsSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
test('initializes and preserves session and protocol; prefers structured content',async()=>{
 const requests=[];const client=new SeenryClient({key:'test-only',fetchImpl:async(url,options)=>{
  const body=JSON.parse(options.body);requests.push({url,...options,body});
  if(body.method==='initialize') return new Response(JSON.stringify({id:body.id,result:{protocolVersion:'2025-06-18'}}),{headers:{'mcp-session-id':'fixture-session'}});
  if(body.method==='notifications/initialized') return new Response(null,{status:202});
  return new Response(JSON.stringify({id:body.id,result:{structuredContent:{ok:true},content:[]}}));
 }});
 await client.initialize();assert.deepEqual((await client.call('get_library_guide')).data,{ok:true});
 assert.equal(requests[2].url,ENDPOINT);assert.equal(requests[2].headers['Mcp-Session-Id'],'fixture-session');assert.equal(requests[2].headers['MCP-Protocol-Version'],'2025-06-18');
});
test('SSE handles CRLF and ignores unrelated notifications',async()=>{
 const c=new SeenryClient({key:'fixture',fetchImpl:async()=>new Response('data: {"method":"notice"}\r\n\r\ndata: {"id":1,"result":{"content":[{"type":"text","text":"{\\"ok\\":true}"}]}}\r\n\r\n',{headers:{'content-type':'text/event-stream'}})});
 assert.equal((await c.call('get_credits')).data.ok,true);
});
for(const status of [401,403,429,503]) test(`HTTP ${status} stops with no retry`,async()=>{
 let calls=0;const c=new SeenryClient({key:'fixture-secret',fetchImpl:async()=>{calls++;return new Response('fixture-secret',{status});}});
 await assert.rejects(c.call('get_library_guide'),e=>e.message.includes(String(status))&&!e.message.includes('fixture-secret'));assert.equal(calls,1);
});
test('tool errors cannot become empty results, and call budget is enforced',async()=>{
 const c=new SeenryClient({key:'fixture',maxCalls:1,fetchImpl:async()=>new Response(JSON.stringify({id:1,result:{isError:true,content:[]}}))});
 await assert.rejects(c.call('search_references'),/tool failed/);await assert.rejects(c.call('search_references'),/budget/);
});
test('no key writes an explicitly unresearched manual handoff and never requires browser dependencies',()=>{
 const dir=mkdtempSync(join(tmpdir(),'seenry-offline-'));const out=join(dir,'research');const env={...process.env};delete env.SEENRY_PRO_KEY;
 try {const r=spawnSync(process.execPath,['skills/seenry/scripts/research.mjs','--out',out],{env,encoding:'utf8'});
 assert.equal(r.status,0,r.stderr);assert.equal(JSON.parse(readFileSync(join(out,'status.json'))).calls,0);assert.match(readFileSync(join(out,'pack.md'),'utf8'),/Research not performed/);assert.equal(existsSync(join(out,'img')),false);
 const again=spawnSync(process.execPath,['skills/seenry/scripts/research.mjs','--out',out],{env,encoding:'utf8'});assert.equal(again.status,2);assert.match(again.stderr,/preserve earlier/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
