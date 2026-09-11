import assert from 'node:assert/strict';import {pathToFileURL}from'node:url';import{readFile}from'node:fs/promises';import{createServer}from'node:http';import path from'node:path';
const i=process.argv.indexOf('--playwright');if(i<0)throw Error('Pass --playwright path');const{chromium}=await import(pathToFileURL(process.argv[i+1]).href);
const root=path.resolve('.');const server=createServer(async(req,res)=>{const p=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!p.startsWith(root+path.sep)){res.writeHead(403).end();return;}try{res.setHeader('Content-Type',p.endsWith('.mjs')?'text/javascript':'text/plain');res.end(await readFile(p));}catch{res.writeHead(404).end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;const browser=await chromium.launch({headless:true});
try{const page=await browser.newPage({viewport:{width:1200,height:800}});await page.goto(base+'/README.md');
 await page.setContent('<style>body{height:2400px}main{margin:200px 40px}h2{font:24px/1.2 Arial}button{margin-left:0;padding:12px;border-radius:8px}</style><main><h2>Export image</h2><button>Download</button></main>');
 await page.evaluate(async base=>{Object.assign(window,await import(base+'/skills/seenry/scripts/design_continuity.mjs'));window.record=captureDesignContinuity({targets:[{id:'title',selector:'h2',styles:['font-family','font-size']},{id:'action',selector:'button',styles:['border-radius']}],relations:[{id:'alignment',from:'title',fromEdge:'left',to:'action',toEdge:'left',tolerance:1}]},{sourceSha256:'a'.repeat(64),selectionNote:'Fixture selection, not a design acceptance'});},base);
 assert.equal(await page.evaluate(()=>compareDesignContinuity(record).status),'retained');
 await page.evaluate(()=>scrollTo(0,180));assert.equal(await page.evaluate(()=>compareDesignContinuity(record).status),'retained');
 await page.evaluate(()=>document.querySelector('h2').style.fontSize='44px');
 let result=await page.evaluate(()=>compareDesignContinuity(record));assert.equal(result.status,'changed');assert.equal(result.checks.find(c=>c.property==='font-size').actual,'44px');
 await page.evaluate(()=>{document.querySelector('h2').style.fontSize='24px';document.querySelector('button').style.marginLeft='8px';});
 result=await page.evaluate(()=>compareDesignContinuity(record));assert.equal(result.status,'changed');assert.equal(result.checks.find(c=>c.relation).delta,8);
 await page.setViewportSize({width:390,height:800});assert.equal(await page.evaluate(()=>compareDesignContinuity(record).status),'unverified');
 await page.setViewportSize({width:1200,height:800});await page.evaluate(()=>document.querySelector('button').remove());
 assert.equal(await page.evaluate(()=>compareDesignContinuity(record).status),'unverified');
 assert.equal(await page.evaluate(()=>{try{captureDesignContinuity({targets:[{id:'x',selector:'h2',styles:[]}],relations:[{id:'bad',from:'x',to:'missing',fromEdge:'left',toEdge:'left',tolerance:1}]},{sourceSha256:'a'.repeat(64),selectionNote:'Invalid'});return false;}catch{return true;}}),true);
 assert.equal(await page.evaluate(()=>{try{captureDesignContinuity({targets:[{id:'x',selector:'h2',styles:['font-made-up']}],relations:[]},{sourceSha256:'a'.repeat(64),selectionNote:'Invalid property'});return false;}catch{return true;}}),true);
 console.log('Retained design: actual type drift, alignment drift, scroll compensation, width mismatch and missing targets verified. No aesthetic verdict implied.');
}finally{await browser.close();await new Promise(r=>server.close(r));}
