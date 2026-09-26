// Run with: node tests/browser_count_pop.mjs /absolute/playwright-core/index.mjs /absolute/chrome
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const [playwrightPath,executablePath]=process.argv.slice(2);
if(!playwrightPath||!executablePath)throw new Error('Pass Playwright module and Chrome executable paths');
const {chromium}=await import(pathToFileURL(path.resolve(playwrightPath)).href);
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../skills/seenry-motion/assets');
const server=createServer(async(request,response)=>{
  const target=path.resolve(root,'.'+decodeURIComponent(request.url.split('?')[0]));
  if(!target.startsWith(root+path.sep))return response.writeHead(403).end();
  try{
    response.setHeader('Content-Type',target.endsWith('.mjs')?'text/javascript':target.endsWith('.css')?'text/css':'text/html');
    response.end(await readFile(target));
  }catch{response.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true,executablePath});
const url=`http://127.0.0.1:${server.address().port}/count-pop-demo.html`;
try{
  const page=await browser.newPage();
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(url);
  const sample=()=>page.evaluate(()=>{
    const host=document.querySelector('#count'),unit=document.querySelector('small');
    return {text:host.textContent,digits:host.querySelectorAll('.seenry-count-digit').length,
      animations:document.getAnimations().length,numberRight:host.getBoundingClientRect().right,
      unitLeft:unit.getBoundingClientRect().left};
  });
  const initial=await sample();
  await page.locator('#add').click();
  const nine=await sample();
  await page.locator('#add').click();
  const ten=await sample();
  await page.locator('#add').click();
  await page.locator('#add').click();
  const rapid=await sample();
  await page.emulateMedia({reducedMotion:'reduce'});
  const liveReduced=await sample();
  assert.equal(initial.text,'8');
  assert.equal(nine.text,'9');
  assert.equal(ten.text,'10');
  assert.equal(ten.digits,2);
  assert.equal(rapid.text,'12');
  assert.equal(rapid.digits,2);
  assert.equal(liveReduced.animations,0);
  assert(Math.abs(nine.numberRight-ten.numberRight)<1);
  assert(Math.abs(nine.unitLeft-ten.unitLeft)<1);
  assert(nine.unitLeft-nine.numberRight<=12);
  assert.deepEqual(errors,[]);
  const lifecycle=await page.evaluate(async()=>{
    const {createCountPop}=await import('/count-pop.mjs');
    const host=document.createElement('strong');host.textContent='9';document.body.append(host);
    const controller=createCountPop(host,{reserveDigits:2});
    controller.update(10);
    const changed=host.textContent;
    controller.destroy();
    return {changed,text:host.textContent,digits:host.children.length,styled:host.classList.contains('seenry-count-pop')};
  });
  assert.deepEqual(lifecycle,{changed:'10',text:'10',digits:0,styled:false});
  await page.close();
  const reduced=await browser.newPage({reducedMotion:'reduce'});
  await reduced.goto(url);
  await reduced.locator('#add').click();
  assert.deepEqual(await reduced.evaluate(()=>({text:document.querySelector('#count').textContent,animations:document.getAnimations().length})),{text:'9',animations:0});
  await reduced.close();
  console.log('count-pop browser checks passed');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
