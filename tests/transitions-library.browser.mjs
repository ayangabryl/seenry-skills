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
      for (const key of ['list','switch','dialog','tabs']) {
        const card=document.querySelector(`[data-key="${key}"]`),app=card.querySelector('.app'),replay=card.querySelector('[data-replay]');
        if (area(rect(app),rect(replay))>1) failures.push(`${key}: Replay overlaps content`);
      }
      const list=document.querySelector('[data-key="list"] .app'),bar=list.querySelector('.app-bar'),first=list.querySelector('.task');
      if (rect(bar).bottom>rect(first).top+1) failures.push('list: header overlaps first task');
      for(const control of bar.querySelectorAll('button')) {
        if (!inside(rect(control),rect(bar))) failures.push('list: header control outside header');
        if (rect(control).bottom>rect(first).top+1) failures.push('list: header control overlaps first task');
      }
      const blur=document.querySelector('.blur-switch'),blurLabel=blur.firstElementChild;
      if(getComputedStyle(blurLabel).display==='none'||!inside(rect(blurLabel),rect(blur))) failures.push('header: Blur option has no visible contained label');
      const checklist=document.querySelector('[data-key="checkbox"]'),checkApp=checklist.querySelector('.app'),checkStage=checklist.querySelector('.stage'),checkReplay=checklist.querySelector('[data-replay]');
      for(const row of checklist.querySelectorAll('.st-check')) {
        if (getComputedStyle(row).display==='none'||!inside(rect(row),rect(checkApp))||!inside(rect(row),rect(checkStage))) failures.push('checkbox: counted item is hidden or clipped');
      }
      if(area(rect(checkApp),rect(checkReplay))>1) failures.push('checkbox: Replay overlaps content');
      const chip=checkApp.querySelector('.chip'),chipRange=document.createRange();chipRange.selectNodeContents(chip);
      if(!inside(rect({getBoundingClientRect:()=>chipRange.getBoundingClientRect()}),rect(chip))) failures.push('checkbox: counter outside chip');
      for(const avatar of document.querySelectorAll('.mail-list .msg>.avatar')) {
        if(getComputedStyle(avatar.closest('.msg')).display==='none') continue;
        const a=rect(avatar);if(Math.abs(a.width-32)>1||Math.abs(a.height-32)>1) failures.push('page: avatar lost circular geometry');
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
    await page.locator('#menu-trigger').click();
    await page.waitForTimeout(120);
    const shortcutRatios=await page.locator('#menu-1 kbd').evaluateAll(nodes=>{
      const color=s=>{const m=s.match(/^(?:rgba?\((.*)\)|color\(srgb (.*)\))$/);if(!m)throw new Error('Unsupported measured color '+s);const p=(m[1]||m[2]).replace(/[,/]/g,' ').trim().split(/\s+/).map(Number);return {rgb:p.slice(0,3).map(v=>m[1]?v/255:v),a:p[3]??1};};
      const lum=rgb=>rgb.map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
      return nodes.map(n=>{const fg=color(getComputedStyle(n).color),base=color(getComputedStyle(n.closest('[data-st="menu"]')).backgroundColor),over=color(getComputedStyle(n.closest('[role="menuitem"]')).backgroundColor);const bg=over.rgb.map((v,i)=>v*over.a+base.rgb[i]*(1-over.a)),ink=fg.rgb.map((v,i)=>v*fg.a+bg[i]*(1-fg.a));const a=lum(ink),b=lum(bg);return {text:n.textContent,ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};});
    });
    assert.ok(shortcutRatios.length>=2&&shortcutRatios.every(x=>x.ratio>=4.5),`${width}/${theme} informative menu shortcut contrast: ${JSON.stringify(shortcutRatios)}`);
    await page.keyboard.press('Escape');
    await page.waitForFunction(()=>document.querySelector('#menu-1').dataset.stOpen==='false');
    await page.locator('#mail [data-open="m2"]').click();
    const mailDetail=page.locator('#mail .detail');
    await mailDetail.waitFor({state:'visible'});
    assert.equal(await mailDetail.getAttribute('tabindex'),'0',`${width}/${theme} message scroll region is keyboard reachable`);
    const mailMetrics=await mailDetail.evaluate(el=>({overflow:getComputedStyle(el).overflowY,height:el.clientHeight,scrollHeight:el.scrollHeight,parentHeight:el.parentElement.clientHeight,viewClass:el.parentElement.classList.contains('mail-view')}));
    assert.equal(mailMetrics.overflow,'auto',`${width}/${theme} message detail owns vertical scrolling`);
    assert.ok(mailMetrics.viewClass&&mailMetrics.height>0&&mailMetrics.height<mailMetrics.parentHeight,`${width}/${theme} real mail-view reserves the header outside its scroll region`);
    const mailOverflow=mailMetrics.scrollHeight-mailMetrics.height;
    if(mailOverflow>1){await mailDetail.hover();await page.mouse.wheel(0,600);await page.waitForFunction(()=>{const el=document.querySelector('#mail .detail'),r=document.createRange();r.selectNodeContents(el.querySelector('p'));return el.scrollTop>0&&r.getBoundingClientRect().bottom<=el.getBoundingClientRect().bottom+1;});}
    const mailFit=await mailDetail.evaluate(el=>{const range=document.createRange();range.selectNodeContents(el.querySelector('p'));const text=range.getBoundingClientRect(),frame=el.getBoundingClientRect();return text.bottom<=frame.bottom+1;});
    assert.equal(mailFit,true,`${width}/${theme} complete message body can be revealed`);
    await mailDetail.press('Home');
    await page.waitForFunction(()=>document.querySelector('#mail .detail').scrollTop<=1);
    await mailDetail.press('End');
    await page.waitForFunction(()=>{const el=document.querySelector('#mail .detail'),r=document.createRange();r.selectNodeContents(el.querySelector('p'));return r.getBoundingClientRect().bottom<=el.getBoundingClientRect().bottom+1;});
    assert.equal(await mailDetail.evaluate(el=>{const r=document.createRange();r.selectNodeContents(el.querySelector('p'));return r.getBoundingClientRect().bottom<=el.getBoundingClientRect().bottom+1;}),true,`${width}/${theme} keyboard End reveals message tail`);
    await page.locator('#mail [data-back]').click();
    await page.locator('#mail .mail-list').waitFor({state:'visible'});
    const cover=page.locator('[data-key="expand"] .cover-card').first();
    await cover.hover();
    await page.waitForTimeout(120);
    assert.equal(await cover.evaluate(el=>{const t=getComputedStyle(el).transform;return t==='none'||new DOMMatrix(t).isIdentity;}),true,`${width}/${theme} reduced source-card hover must not translate/scale`);
    // Reach the last embedded Settings tab through the real keyboard path.
    await page.locator('#t-acc').focus();
    await page.keyboard.press('End');
    const lastTab=await page.evaluate(()=>{
      const tab=document.querySelector('#t-sec'),list=tab.parentElement,ind=list.querySelector('.st-tab-indicator'),a=tab.getBoundingClientRect(),b=list.getBoundingClientRect();
      return {selected:tab.getAttribute('aria-selected'),active:document.activeElement===tab,panelInert:document.querySelector('#p-sec').inert,
        visible:a.left>=b.left+list.clientLeft-1&&a.right<=b.left+list.clientLeft+list.clientWidth+1,
        canScroll:getComputedStyle(list).overflowX!=='clip'&&getComputedStyle(list).overflowX!=='hidden',
        indicatorContentWidth:ind.offsetWidth,tabEnd:tab.offsetLeft+tab.offsetWidth};
    });
    assert.equal(lastTab.selected,'true',`${width}/${theme} Security selection`);
    assert.equal(lastTab.active,true,`${width}/${theme} Security focus`);
    assert.equal(lastTab.panelInert,false,`${width}/${theme} Security panel access`);
    assert.equal(lastTab.visible,true,`${width}/${theme} Security tab visible after End`);
    assert.equal(lastTab.canScroll,true,`${width}/${theme} embedded strip permits pointer scrolling`);
    assert.ok(lastTab.indicatorContentWidth>=lastTab.tabEnd-1,`${width}/${theme} last tab underline has a painted surface`);
    await page.keyboard.press('Home');
    await page.locator('#tabs-1>[role=tablist]').hover();
    await page.mouse.wheel(500,0);
    await page.waitForFunction(()=>{const list=document.querySelector('#tabs-1>[role=tablist]');return list.scrollWidth<=list.clientWidth+1||list.scrollLeft>0;});
    await page.locator('#t-sec').click();
    assert.equal(await page.locator('#t-sec').getAttribute('aria-selected'),'true',`${width}/${theme} Security pointer selection after local wheel`);
    assert.equal(await page.evaluate(()=>scrollX),0,`${width}/${theme} embedded tab navigation does not pan document`);
    await page.setViewportSize({width:1440,height:1000});
    await page.locator('#t-sec').focus();
    await page.keyboard.press('End');
    await page.setViewportSize({width:320,height:1000});
    await page.waitForFunction(()=>{const tab=document.querySelector('#t-sec'),list=tab.parentElement,a=tab.getBoundingClientRect(),b=list.getBoundingClientRect();return a.left>=b.left+list.clientLeft-1&&a.right<=b.left+list.clientLeft+list.clientWidth+1;});
    assert.equal(await page.locator('#t-sec').getAttribute('aria-selected'),'true',`${width}/${theme} selected tab survives narrowing`);
    await page.setViewportSize({width,height:1000});
    // The gallery moves the real stage into its detail surface. Recheck there:
    // ancestor-card-only styles otherwise disappear even though the DOM survives.
    for(const key of ['checkbox','dialog','list']) {
      await page.locator(`[data-key="${key}"] .title-link`).click();
      await page.waitForFunction(()=>document.querySelector('#library-detail').dataset.stOpen==='true');
      const detailFailures=await page.evaluate(key=>{
        const stage=document.querySelector('#detail-preview .stage'),app=stage.querySelector('.app'),replay=stage.querySelector('[data-replay]');
        const r=e=>e.getBoundingClientRect(),inside=(a,b)=>a.left>=b.left-1&&a.top>=b.top-1&&a.right<=b.right+1&&a.bottom<=b.bottom+1;
        const a=r(app),b=r(replay),failures=[];
        if(Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top))>1) failures.push('Replay overlaps detail content');
        if(!inside(a,r(stage))) failures.push('app outside detail stage');
        if(key==='list') {
          const bar=app.querySelector('.app-bar'),first=app.querySelector('.task');
          if(r(bar).bottom>r(first).top+1) failures.push('detail header overlaps first task');
          for(const control of bar.querySelectorAll('button')) if(!inside(r(control),r(bar))||r(control).bottom>r(first).top+1) failures.push('detail header control outside reserved header');
        }
        if(key==='checkbox') for(const row of app.querySelectorAll('.st-check')) if(getComputedStyle(row).display==='none'||!inside(r(row),a)) failures.push('counted detail item hidden or clipped');
        return failures;
      },key);
      assert.deepEqual(detailFailures,[],`${width}/${theme}/${key} moved-detail fit`);
      await page.locator('#library-detail .detail-close').click();
      await page.waitForFunction(key=>!!document.querySelector(`[data-key="${key}"] .stage`),key);
    }
    assert.deepEqual(errors,[],`${width}/${theme} runtime errors after detail interactions`);
    checks.push({width,theme,status:'passed'});
    await context.close();
  }
  console.log(JSON.stringify({checks,scope:'Live Chromium gallery/moved-detail layout and initial-scroll regression. No perceptual motion or overall quality score.'},null,2));
} finally { await browser.close(); }
