// Actual text-copy geometry after a user-spacing change with a stable list width.
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const arg=(n,d)=>{const i=process.argv.indexOf(n);return i<0?d:process.argv[i+1];};
const modulePath=arg('--playwright');if(!modulePath)throw Error('Pass --playwright /existing/playwright/index.mjs');
const {chromium}=await import(pathToFileURL(resolve(modulePath)).href);
const gallery=resolve(arg('--gallery',fileURLToPath(new URL('../skills/seenry/assets/components/transitions/gallery.html',import.meta.url))));
const out=resolve(arg('--out','segmented-ink-results'));mkdirSync(out,{recursive:true});
const widths=arg('--widths','320,390,960,1000,1440').split(',').map(Number);assert(widths.length&&widths.every(w=>Number.isFinite(w)&&w>=195&&w<=4000));
const browser=await chromium.launch({headless:true,...(process.env.SEENRY_CHROME_PATH?{executablePath:process.env.SEENRY_CHROME_PATH}:{})});
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const report={browser:browser.version(),source:{html:sha(gallery),runtime:sha(join(dirname(gallery),'seenry-transitions.js'))},scope:'Header segmented original/paint-copy Range alignment before, during, and after four-property user spacing. Reduced motion for stable inspection; not a complete motion or accessibility audit.',runs:[]};
const spacingCSS=':root:not(#seenry-text-spacing-test) *{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}:root:not(#seenry-text-spacing-test) p{margin-block-end:2em!important}';
try{
 for(const width of widths)for(const theme of ['light','dark']){
  const context=await browser.newContext({viewport:{width,height:1000},colorScheme:theme,reducedMotion:'reduce',serviceWorkers:'block',acceptDownloads:false});const page=await context.newPage(),errors=[];page.setDefaultTimeout(5000);
  page.on('pageerror',e=>errors.push(e.message));await page.route(/^https?:/,r=>r.abort());
  try{
   await page.goto(pathToFileURL(gallery).href);await page.evaluate(()=>document.fonts.ready);let style;
   for(const phase of ['normal','spaced','restored']){
    const run={width,theme,phase,status:'running'};report.runs.push(run);
    try{
     if(phase==='spaced')style=await page.addStyleTag({content:spacingCSS});else if(phase==='restored')await style.evaluate(e=>e.remove());
     await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(r)))));
     run.groups=await page.evaluate(()=>{
      const rect=r=>({left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height});
      const layoutVisible=e=>{for(let n=e;n;n=n.parentElement){const s=getComputedStyle(n);if(n.hidden||s.display==='none'||s.visibility!=='visible'||Number(s.opacity)<.99)return false;}const r=e.getBoundingClientRect();return r.width>0&&r.height>0;};
      const text=e=>{const r=document.createRange();r.selectNodeContents(e);const c=getComputedStyle(e);return {text:e.textContent.trim(),layoutVisible:layoutVisible(e),rect:rect(e.getBoundingClientRect()),glyphs:[...r.getClientRects()].filter(r=>r.width&&r.height).map(rect),font:c.font,letterSpacing:c.letterSpacing,wordSpacing:c.wordSpacing,lineHeight:c.lineHeight,fontSize:c.fontSize};};
      return ['.theme','.library-tools .filter'].map(selector=>{const root=document.querySelector(selector);if(!root||!layoutVisible(root))return {selector,visible:false};const list=root.querySelector('[role=tablist]'),ink=list.querySelector(':scope>.st-tab-ink'),tabs=[...list.querySelectorAll('[role=tab]')],copies=[...ink.children];return {selector,visible:true,list:rect(list.getBoundingClientRect()),inkAriaHidden:ink.getAttribute('aria-hidden'),inkRect:rect(ink.getBoundingClientRect()),inkClip:getComputedStyle(ink).clipPath,tabs:tabs.map((t,i)=>({selected:t.getAttribute('aria-selected')==='true',original:text(t),copy:copies[i]?text(copies[i]):null}))};});
     });
     const visible=run.groups.filter(g=>g.visible);assert.equal(visible.length,width<=700?1:2,'Expected visible header groups must be tested');
     for(const group of visible){assert.equal(group.inkAriaHidden,'true');assert(group.tabs.length>=3);assert.equal(group.tabs.filter(t=>t.selected).length,1);
      for(const tab of group.tabs){const a=tab.original,b=tab.copy;assert(a.layoutVisible&&b?.layoutVisible&&a.glyphs.length>0&&b.glyphs.length>0,'Original and copy need positive displayed text geometry');assert.equal(b.text,a.text);assert.equal(b.glyphs.length,a.glyphs.length);
       for(let i=0;i<a.glyphs.length;i++)for(const k of ['left','top','width','height'])assert(Math.abs(a.glyphs[i][k]-b.glyphs[i][k])<=.5,`${group.selector}/${a.text} mismatched ${k}: original${a.glyphs[i][k]}, copy${b.glyphs[i][k]}`);
       if(tab.selected){for(const r of a.glyphs)assert(r.left>=-.5&&r.right<=width+.5,'Selected header text must remain within the viewport');const m=/inset\(([^)]*)\)/.exec(group.inkClip);assert(m,'Selected ink must have a measured clip');let v=m[1].split('round')[0].trim().split(/\s+/).map(parseFloat);v=[v[0],v[1]??v[0],v[2]??v[0],v[3]??v[1]??v[0]];const paint={left:group.inkRect.left+v[3],right:group.inkRect.right-v[1],top:group.inkRect.top+v[0],bottom:group.inkRect.bottom-v[2]};for(const r of b.glyphs)assert(r.left>=paint.left-.5&&r.right<=paint.right+.5&&r.top>=paint.top-.5&&r.bottom<=paint.bottom+.5,'Selected ink glyphs must fit the actual painted clip');}
       if(phase==='spaced')for(const t of [a,b])for(const [k,expected] of [['lineHeight',1.5],['letterSpacing',.12],['wordSpacing',.16]]){const value=parseFloat(t[k])/parseFloat(t.fontSize);assert(Number.isFinite(value)&&Math.abs(value-expected)<.001,`Spacing override missing on ${a.text}/${k}`);}
      }
     }
     assert.deepEqual(errors,[]);run.status='passed';
    }catch(e){run.status='failed';run.error=e.message;}
    finally{await page.screenshot({path:join(out,`${width}-${theme}-${phase}.png`)});writeFileSync(join(out,'results.json'),JSON.stringify(report,null,2));}
   }
  }finally{await context.close();}
 }
}finally{await browser.close();}
const failures=report.runs.filter(r=>r.status!=='passed');console.log(JSON.stringify({profiles:report.runs.length,passed:report.runs.length-failures.length,failed:failures.length,out},null,2));if(failures.length)process.exitCode=1;
