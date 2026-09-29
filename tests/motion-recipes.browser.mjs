import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

const index=process.argv.indexOf('--playwright');
if(index<0)throw new Error('Pass --playwright /absolute/path/to/playwright/index.mjs');
const {chromium}=await import(pathToFileURL(process.argv[index+1]).href);
const recipes=readFileSync(new URL('../skills/seenry-motion/references/recipes.md',import.meta.url),'utf8');
const blocks=[...recipes.matchAll(/```css\n([\s\S]*?)```/g)].map(m=>m[1]);
const css=blocks.join('\n');
const browser=await chromium.launch({headless:true,...(process.env.SEENRY_CHROME_PATH?{executablePath:process.env.SEENRY_CHROME_PATH}:{})});
try {
  const page=await browser.newPage();
  await page.setContent(`<style>${css}</style>
    <button class="btn">Press</button>
    <div class="menu" popover id="menu">Menu</div>
    <dialog id="dlg">Dialog</dialog>
    <details id="det"><summary>More</summary><p>Hidden content line one.<br>Line two.</p></details>
    <div class="tabs"><button class="tab" role="tab" aria-selected="true" style="position:relative">A</button></div>`);
  const r=await page.evaluate(async()=>{
    const out={};
    const spring=getComputedStyle(document.documentElement).getPropertyValue('--spring-bounce').trim();
    out.springParses=CSS.supports('transition-timing-function',spring);
    const menu=document.getElementById('menu');menu.showPopover();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    out.popoverEnter=menu.getAnimations().length>0;
    const dlg=document.getElementById('dlg');dlg.showModal();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    out.dialogEnter=dlg.getAnimations().length>0;
    await new Promise(r=>setTimeout(r,260));dlg.close();
    out.dialogStaysForExit=getComputedStyle(dlg).display!=='none';
    out.dialogExitAnimating=dlg.getAnimations().length>0;
    const det=document.getElementById('det');const h0=det.getBoundingClientRect().height;det.open=true;
    await new Promise(r=>setTimeout(r,60));const h1=det.getBoundingClientRect().height;
    await new Promise(r=>setTimeout(r,300));const h2=det.getBoundingClientRect().height;
    out.detailsAnimating=h0<h1&&h1<h2;
    out.viewTransitions=typeof document.startViewTransition==='function';
    out.scrollTimeline=CSS.supports('animation-timeline: view()');
    return out;
  });
  for(const [k,v] of Object.entries(r))assert.equal(v,true,k);
  console.log('Motion recipes: spring linear() parses; popover, dialog enter and exit, details height and view transitions run in Chromium.');
} finally { await browser.close(); }
