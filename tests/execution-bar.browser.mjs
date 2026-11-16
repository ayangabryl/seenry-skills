import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {collectExecution, judgeExecution} from '../skills/seenry/scripts/execution_bar.mjs';

const index=process.argv.indexOf('--playwright');
if(index<0)throw new Error('Pass --playwright /absolute/path/to/playwright/index.mjs');
const {chromium}=await import(pathToFileURL(process.argv[index+1]).href);
const browser=await chromium.launch({headless:true,...(process.env.SEENRY_CHROME_PATH?{executablePath:process.env.SEENRY_CHROME_PATH}:(process.env.SEENRY_CHROME_CHANNEL?{channel:process.env.SEENRY_CHROME_CHANNEL}:{}))});
const page=await browser.newPage({viewport:{width:1440,height:900}});
const bars='<svg width="600" height="200" viewBox="0 0 600 200" fill="oklch(0.5 0.1 190)"><rect x="10" y="40" width="40" height="160"/><rect x="70" y="80" width="40" height="120"/><rect x="130" y="20" width="40" height="180"/></svg>';
try {
  // One chart in a box, a three-line headline at 96px, and a red alert on a teal page.
  await page.setContent(`<body style="margin:40px;font:16px Arial"><h1 style="font-size:96px;line-height:1;width:700px;margin:0">See the week cash dips below your floor</h1>
    <div data-seenry-product class="card" style="width:700px;padding:16px"><b>13-week cash</b>${bars}<p style="background:oklch(0.9 0.08 25);color:oklch(0.5 0.2 25);padding:12px;width:640px">W9 is $320k under</p></div></body>`);
  let found=judgeExecution(await page.evaluate(collectExecution));
  assert.equal(found.thinProduct.length,2,JSON.stringify(found));
  assert.ok(found.notes.some(n=>/hue families/.test(n)&&/teal/.test(n)&&/red/.test(n)),JSON.stringify(found.notes));
  assert.ok(found.notes.some(n=>/runs [34] lines/.test(n))&&found.notes.some(n=>/96px/.test(n)),JSON.stringify(found.notes));
  // A whole app in one hue.
  const ink='oklch(0.5 0.2 264)';
  await page.setContent(`<body style="margin:40px;font:14px Arial"><h1 style="font-size:68px;line-height:1.05;margin:0;font-weight:300">Know your lowest week<br>eleven weeks early</h1>
    <div data-seenry-product class="app" style="display:grid;grid-template-columns:200px 1fr;width:1100px">
      <aside><div class="search">Search <kbd>⌘K</kbd></div><a href="#">Forecast</a><a href="#">Moves <b class="badge" style="background:${ink};color:#fff;border-radius:99px;padding:0 6px">3</b></a><a href="#">Scenarios</a></aside>
      <div><header class="bar"><span class="crumbs">Acme / Forecast</span><span class="sync">Synced 07:00</span><span class="avs"><i style="display:inline-block;width:24px;height:24px;border-radius:50%;background:#ccd"></i><i style="display:inline-block;width:24px;height:24px;border-radius:50%;background:#99a"></i></span><button style="background:none;border:1px solid #ccc">Share</button><button style="background:#111;color:#fff;border:0">Export</button></header>
        <div class="kpis" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px"><div><span>Cash</span><b style="font-size:22px;display:block">$2.41M</b><svg width="64" height="32" viewBox="0 0 64 32" fill="none"><path d="M1 8c8 2 10 3 16 6s9 2 14 8" stroke="${ink}"/></svg></div><div><span>Lowest</span><b style="font-size:22px;display:block">$1.18M</b><div class="ticks" style="display:flex;gap:2px;align-items:flex-end;height:32px">${'<i style="width:2px;height:12px;background:#ccd"></i>'.repeat(8)}</div></div><div><span>Moves</span><b style="font-size:22px;display:block">3</b><div style="display:flex;gap:3px;align-items:flex-end;height:32px">${[20,20,20,32,32,20].map(h=>`<i style="width:8px;height:${h}px;background:${ink}"></i>`).join('')}</div></div></div>
        <div class="card"><div class="legend">Forecast</div><div role="tablist"><span role="tab" aria-selected="true">Weekly</span><span role="tab">Daily</span></div><span class="date">Nov 17 – Feb 9</span>
          <div class="yax">$3M $0</div><svg width="640" height="180" viewBox="0 0 640 180" fill="none"><path d="M0 40 C100 60 200 90 320 140 S520 80 640 60" stroke="${ink}" stroke-width="2"/></svg><div role="tooltip">W9 · $1.18M</div></div>
        <ul><li>Delay PO <input type="checkbox"></li><li>Draw on the line</li><li>Shift budget</li></ul></div></div></body>`);
  const data=await page.evaluate(collectExecution);
  found=judgeExecution(data);
  assert.deepEqual(found.thinProduct,[],JSON.stringify(data.product));
  assert.ok(data.product.kinds.length>=14&&data.product.vis.length>=3,JSON.stringify(data.product));
  assert.deepEqual(found.notes,[],JSON.stringify(found.notes));
  // Three sibling tiles showing one image at one crop, and a section of only equal cards.
  const img='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="#246"/></svg>');
  const tile=crop=>`<div style="position:relative;height:300px"><img src="${img}" style="width:100%;height:200px;object-fit:cover;object-position:${crop}"><p>Text</p></div>`;
  const cards='<section style="margin-top:900px;padding:40px"><h2>Plain cards</h2><p>Three equal cards and nothing else.</p><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">'+'<div style="border:1px solid #999;height:200px;padding:16px">A card of words</div>'.repeat(3)+'</div></section>';
  await page.setContent(`<body style="margin:0;font:16px Arial"><section style="height:900px"><h1>Hero</h1></section><section><div class="tiles" style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">${tile('center 100%').repeat(3)}</div></section>${cards}</body>`);
  found=judgeExecution(await page.evaluate(collectExecution));
  assert.equal(found.template.length,1,JSON.stringify(found));
  assert.match(found.template[0],/div\.tiles shows .* at the same crop in 3 tiles \(needs 1\)/);
  assert.ok(found.notes.some(n=>/"Plain cards".*0 moments/.test(n)),JSON.stringify(found.notes));
  await page.setContent(`<body style="margin:0;font:16px Arial"><section style="height:900px"><h1>Hero</h1></section><section><div class="tiles" style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">${tile('10% 100%')}${tile('50% 80%')}${tile('90% 100%')}</div></section></body>`);
  assert.deepEqual(judgeExecution(await page.evaluate(collectExecution)).template,[]);
  console.log('execution bar browser fixtures pass');
} finally { await browser.close(); }
