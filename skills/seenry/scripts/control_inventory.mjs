// Read-only inventory of rendered controls. Behavior still requires inspection.
// From a project with Playwright installed: node control_inventory.mjs --url http://localhost:5173 [--click SELECTOR] [--out FILE]
// Otherwise pass --playwright /path/to/playwright/index.mjs.
import {writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const args=process.argv.slice(2);
const flags={};
for(let i=0;i<args.length;i+=2){
  if(!args[i]?.startsWith('--')||!args[i+1])throw new Error('Use --url URL [--out FILE] [--playwright MODULE] [--click SELECTOR]');
  flags[args[i].slice(2)]=args[i+1];
}
if(!flags.url)throw new Error('Use --url URL [--out FILE] [--playwright MODULE] [--click SELECTOR]');
const playwrightPath=flags.playwright?path.resolve(flags.playwright):createRequire(path.join(process.cwd(),'package.json')).resolve('playwright');
const playwright=await import(pathToFileURL(playwrightPath).href);
const chromium=playwright.chromium??playwright.default?.chromium;
if(!chromium)throw new Error(`Playwright module has no chromium export: ${playwrightPath}`);
const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  const runtimeMessages=[];
  page.on('console',message=>{
    if(['error','warning'].includes(message.type()))runtimeMessages.push({type:message.type(),text:message.text().slice(0,500)});
  });
  page.on('pageerror',error=>runtimeMessages.push({type:'pageerror',text:error.message.slice(0,500)}));
  await page.goto(flags.url,{waitUntil:'load',timeout:30000});
  await page.evaluate(()=>Promise.race([document.fonts.ready,new Promise(resolve=>setTimeout(resolve,3000))]));
  if(flags.click)await page.locator(flags.click).click({timeout:4000});
  const report=await page.evaluate(()=>{
    const selector='a[href],button,input:not([type="hidden"]),select,textarea,[role="button"],[role="tab"],[role="menuitem"]';
    const controls=[...new Set(document.querySelectorAll(selector))].filter(element=>{
      const style=getComputedStyle(element),rect=element.getBoundingClientRect();
      return !element.closest('[hidden],[inert],[data-layout-tools]')&&style.display!=='none'&&style.visibility!=='hidden'&&rect.width>0&&rect.height>0;
    }).map((element,index)=>{
      const labelledBy=element.getAttribute('aria-labelledby');
      const referenced=labelledBy?.split(/\s+/).map(id=>document.getElementById(id)?.textContent?.trim()).filter(Boolean).join(' ');
      const label=element.getAttribute('aria-label')||referenced||element.labels?.[0]?.textContent?.trim()||element.innerText?.trim()||element.getAttribute('value')||element.getAttribute('placeholder')||'';
      const href=element instanceof HTMLAnchorElement?element.getAttribute('href'):null;
      const fragment=href?.startsWith('#')?href.slice(1):null;
      const rect=element.getBoundingClientRect();
      const hiddenRegion=element.closest('[aria-hidden="true"]');
      const hiddenFocusable=Boolean(hiddenRegion&&element.tabIndex>=0&&!element.matches(':disabled'));
      return {index,tag:element.tagName.toLowerCase(),role:element.getAttribute('role'),label:label.replace(/\s+/g,' ').slice(0,120),href,disabled:element.matches(':disabled'),x:Math.round(rect.x),y:Math.round(rect.y),
        finding:hiddenFocusable?'hidden-focusable':!label.trim()?'missing-label':href==='#'||href?.startsWith('javascript:')?'placeholder-link':fragment&&!document.getElementById(fragment)?'missing-fragment':null};
    });
    const claimCandidates=[...document.querySelectorAll('body *')].filter(element=>{
      const style=getComputedStyle(element),rect=element.getBoundingClientRect(),value=element.textContent?.trim()||'';
      return element.childElementCount===0&&!element.closest('[hidden],[inert],[data-layout-tools]')&&style.display!=='none'&&style.visibility!=='hidden'&&rect.width>0&&rect.height>0&&value.length<100&&/(\d|\bsaved\b|\bstorage\b|\bquota\b|\bavailable\b|\bupdated\b)/i.test(value);
    }).slice(0,100).map(element=>({text:element.textContent.trim().replace(/\s+/g,' '),context:element.parentElement?.textContent?.trim().replace(/\s+/g,' ').slice(0,140)||'',x:Math.round(element.getBoundingClientRect().x),y:Math.round(element.getBoundingClientRect().y)}));
    return {url:location.href,viewport:{width:innerWidth,height:innerHeight},controls,findings:controls.filter(control=>control.finding),claimCandidates,limits:[
      'Only rendered controls in the captured state are listed; repeat after opening menus and dialogs.',
      'A closing surface with aria-hidden must also remove its controls from keyboard focus; verify inertness and Tab behavior in the browser.',
      'A hash link without a matching element may instead be handled by a router; inspect its actual result.',
      'Numerical and status text is a review candidate, not automatically a false claim; verify its meaning against the brief or working state.',
      'This inventory cannot determine whether a JavaScript handler produces the promised result. Exercise each listed action or remove it.'
    ]};
  });
  report.runtimeMessages=[...new Map(runtimeMessages.map(message=>[message.type+message.text,message])).values()];
  report.findings.push(...report.runtimeMessages.map(message=>({finding:message.type==='warning'?'runtime-warning':'runtime-error',...message})));
  const output=JSON.stringify(report,null,2)+'\n';
  if(flags.out)await writeFile(path.resolve(flags.out),output);
  else process.stdout.write(output);
}finally{await browser.close();}
