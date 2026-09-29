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
  await page.setContent(`<style>body{margin:0;font:15px/20px Arial}
    .c{margin:24px;width:360px;padding:16px;border-radius:24px;background:#eee;display:grid;grid-template-columns:96px 1fr;gap:16px}
    .m{width:96px;height:96px;border-radius:8px;background:linear-gradient(#999,#777)}.bar{grid-column:1/-1;height:4px;background:#333;margin-left:4px}
    h3{margin:0;font:600 15px/20px Arial}.ok h3{text-box:trim-both cap alphabetic}.ok .bar{margin-left:0}
  </style><div class="c" data-component="loose"><div class="m"></div><h3>Title</h3><div class="bar"></div></div>
  <div class="c ok" data-component="tight"><div class="m"></div><h3>Title</h3><div class="bar"></div></div>`);
  const aligned=await page.evaluate(collectSystemAudit,{base:4});
  const loose=aligned.perComponent.find(x=>x.component==='loose').alignment, tight=aligned.perComponent.find(x=>x.component==='tight').alignment;
  assert.ok(loose.anchors.find(a=>a.relation==='beside').topOffset>1);
  assert.ok(loose.nearMisses.some(m=>m.side==='left'&&Math.abs(m.off-4)<0.2));
  assert.ok(Math.abs(tight.anchors.find(a=>a.relation==='beside').topOffset)<=1);
  assert.equal(tight.anchors.find(a=>a.relation==='below').leftOffset,0);
  assert.equal(tight.nearMisses.length,0);
  assert.equal(tight.insets.left,16);
  assert.equal(audit.horizontalOverflow,false);
  console.log('system audit: ok');
} finally { await browser.close(); }
