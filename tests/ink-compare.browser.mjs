import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const modulePath=process.argv[process.argv.indexOf('--playwright')+1];
if(!modulePath||modulePath.startsWith('--'))throw new Error('Pass --playwright /absolute/path/to/playwright/index.mjs');
const directory=await mkdtemp(path.join(tmpdir(),'seenry-ink-'));
const script=path.resolve('skills/seenry/scripts/ink_compare.mjs');
const source=path.join(directory,'source.svg'),output=path.join(directory,'output.svg'),regions=path.join(directory,'regions.json');
const svg=(x,y,width)=>`<svg xmlns="http://www.w3.org/2000/svg" width="100" height="60"><rect width="100" height="60" fill="white"/><rect x="${x}" y="${y}" width="${width}" height="10" fill="black"/></svg>`;
const chrome='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const args=['--source',source,'--output',output,'--regions',regions,'--playwright',modulePath,...(existsSync(chrome)?['--executable-path',chrome]:[])];
try{
  await Promise.all([writeFile(source,svg(10,10,20)),writeFile(output,svg(12,9,24))]);
  await writeFile(regions,JSON.stringify({regions:[{name:'heading',box:[0,0,100,60],threshold:100,tolerancePx:4}]}));
  const matched=JSON.parse(execFileSync(process.execPath,[script,...args],{encoding:'utf8'}));
  assert.deepEqual(matched.regions[0].source,{x:10,y:10,width:20,height:10,inkPixels:200});
  assert.deepEqual(matched.regions[0].delta,{x:2,y:-1,width:4,height:0});
  assert.equal(matched.regions[0].withinTolerance,true);
  await writeFile(regions,JSON.stringify({regions:[{name:'heading',box:[0,0,100,60],threshold:100,tolerancePx:2}]}));
  let failed;
  try{execFileSync(process.execPath,[script,...args],{encoding:'utf8',stdio:['ignore','pipe','pipe']});}
  catch(error){failed=error;}
  assert.equal(failed?.status,1);
  assert.equal(JSON.parse(failed.stdout).regions[0].withinTolerance,false);
  console.log('Ink comparison: physical-pixel bounds and tolerance failure passed.');
}finally{await rm(directory,{recursive:true,force:true});}
