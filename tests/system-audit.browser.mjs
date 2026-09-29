import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {collectSystemAudit} from '../skills/seenry/scripts/system_audit.mjs';

const index=process.argv.indexOf('--playwright');
if(index<0)throw new Error('Pass --playwright /absolute/path/to/playwright/index.mjs');
const {chromium}=await import(pathToFileURL(process.argv[index+1]).href);
const browser=await chromium.launch({headless:true,...(process.env.SEENRY_CHROME_PATH?{executablePath:process.env.SEENRY_CHROME_PATH}:{})});
try {
  const page=await browser.newPage({viewport:{width:800,height:600}});
  await page.setContent(`<style>
    body{margin:0;font:16px/24px Arial}
    .card{margin:32px;padding:8px;border-radius:24px;background:#eee;display:flex;gap:16px}
    .card img{width:96px;height:96px;border-radius:24px;background:#999;display:block}
    .good{margin:32px;padding:8px;border-radius:24px;background:#ddd}
    .good div{border-radius:16px;background:#bbb;height:40px}
    .bad-space{padding:15px 10px;margin:32px}
    h3{font-size:17px;font-weight:600;margin:0}p{font-size:15px;margin:0}small{font-size:12px;font-weight:500}em{font-size:13px;font-weight:700}
  </style>
  <section class="card" data-component="player"><img alt=""><div><h3>The Visit</h3><p>Agar Agar</p><small>3:49</small><em>HD</em></div></section>
  <div class="good"><div></div></div>
  <div class="bad-space">Off grid</div><button style="width:40px">Sign in now</button>`);
  const audit=await page.evaluate(collectSystemAudit,{base:4});
  assert.ok(audit.offGrid.some(x=>x.element==='div.bad-space'&&x.value==='15px'));
  assert.ok(audit.offGrid.some(x=>x.element==='div.bad-space'&&x.value==='10px'));
  assert.ok(!audit.offGrid.some(x=>x.element==='section.card'));
  const player=audit.perComponent.find(x=>x.component==='player');
  assert.deepEqual(player.sizes,[12,13,15,17]);
  assert.equal(player.overLimit,true);
  assert.ok(audit.nestedRadius.some(x=>x.parent==='section.card'&&x.childRadius===24&&x.expected===16));
  assert.ok(!audit.nestedRadius.some(x=>x.parent==='div.good'));
  assert.ok(audit.radii.some(x=>x.value==='24px'));
  assert.ok(audit.wrappedControls.some(x=>x.text==='Sign in now'&&x.lines>1));
  assert.equal(audit.horizontalOverflow,false);
  console.log('system audit: ok');
} finally { await browser.close(); }
