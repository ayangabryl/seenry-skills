import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const i = process.argv.indexOf('--playwright');
if (i < 0) throw new Error('Pass --playwright /absolute/path/to/playwright/index.mjs');
const {chromium} = await import(pathToFileURL(resolve(process.argv[i + 1])).href);
const browser = await chromium.launch({headless:true, ...(process.env.SEENRY_CHROME_PATH ? {executablePath:process.env.SEENRY_CHROME_PATH} : {})});
const galleryArg = process.argv.indexOf('--gallery');
const url = galleryArg >= 0 ? pathToFileURL(resolve(process.argv[galleryArg + 1])).href : new URL('../skills/seenry/assets/components/transitions/gallery.html', import.meta.url).href;
const checks = [];
try {
  for (const width of [320,390,720,1440]) for (const theme of ['light','dark']) {
    const context = await browser.newContext({viewport:{width,height:1000},colorScheme:theme,reducedMotion:'reduce'});
    const page = await context.newPage(), errors=[];
    page.on('pageerror', e => errors.push(e.message));
    // This test is an offline gallery regression; external content is not needed.
    await page.route(/^https?:/, route => route.abort());
    await page.goto(url);
    await page.evaluate(async () => { await document.fonts.ready; await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); });
    const result = await page.evaluate(() => {
      const rect = el => { const r=el.getBoundingClientRect(); return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}; };
      const failures=[];
      const inside=(a,b)=>a.left>=b.left-1&&a.top>=b.top-1&&a.right<=b.right+1&&a.bottom<=b.bottom+1;
      const area=(a,b)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
      for (const selector of ['#pay','#dialog-trigger']) {
        const button=document.querySelector(selector), label=button.querySelector('.st-button-label')||button.querySelector('.st-text-value')||button;
        const range=document.createRange();range.selectNodeContents(label);
        if (!inside(rect({getBoundingClientRect:()=>range.getBoundingClientRect()}),rect(button))) failures.push(`${selector}: label outside button`);
      }
      for (const key of ['list','switch']) {
        const card=document.querySelector(`[data-key="${key}"]`),app=card.querySelector('.app'),replay=card.querySelector('[data-replay]');
        if (area(rect(app),rect(replay))>1) failures.push(`${key}: Replay overlaps content`);
      }
      const list=document.querySelector('[data-key="list"] .app'),bar=list.querySelector('.app-bar'),first=list.querySelector('.task');
      if (rect(bar).bottom>rect(first).top+1) failures.push('list: header overlaps first task');
      for(const control of bar.querySelectorAll('button')) {
        if (!inside(rect(control),rect(bar))) failures.push('list: header control outside header');
        if (rect(control).bottom>rect(first).top+1) failures.push('list: header control overlaps first task');
      }
      const tip=document.querySelector('[data-key="tooltip"]'),line=tip.querySelector('.editor-line'),stage=tip.querySelector('.stage');
      if (!inside(rect(line),rect(stage))) failures.push('tooltip: placeholder lines clipped');
      const albums=document.querySelector('[data-key="expand"]'),albumStage=rect(albums.querySelector('.stage'));
      for (const card of albums.querySelectorAll('.cover-card')) {
        if (!inside(rect(card),albumStage)) failures.push('expand: album outside stage');
        const range=document.createRange();range.selectNodeContents(card.querySelector('b'));
        if (!inside(rect({getBoundingClientRect:()=>range.getBoundingClientRect()}),albumStage)) failures.push('expand: title outside stage');
      }
      return {width:innerWidth,scrollY,overflow:document.documentElement.scrollWidth-innerWidth,failures};
    });
    assert.deepEqual(errors,[],`${width}/${theme} runtime errors`);
    assert.equal(result.scrollY,0,`${width}/${theme} initialization unexpectedly scrolled`);
    assert.ok(result.overflow<=1,`${width}/${theme} document overflow ${result.overflow}`);
    assert.deepEqual(result.failures,[],`${width}/${theme} internal preview fit`);
    checks.push({width,theme,status:'passed'});
    await context.close();
  }
  console.log(JSON.stringify({checks,scope:'Live Chromium default-state layout and initial-scroll regression. No perceptual motion or overall quality score.'},null,2));
} finally { await browser.close(); }
