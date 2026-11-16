import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {collectChartGeometry, judgeCharts} from '../skills/seenry/scripts/chart_check.mjs';

const index=process.argv.indexOf('--playwright');
if(index<0)throw new Error('Pass --playwright /absolute/path/to/playwright/index.mjs');
const {chromium}=await import(pathToFileURL(process.argv[index+1]).href);
const browser=await chromium.launch({headless:true,...(process.env.SEENRY_CHROME_PATH?{executablePath:process.env.SEENRY_CHROME_PATH}:(process.env.SEENRY_CHROME_CHANNEL?{channel:process.env.SEENRY_CHROME_CHANNEL}:{}))});
const line='M40 36 Q92 60 143 98 L143 40 Q255 95 365 168 L365 80 Q395 95 423 114 L423 40 Q530 92 630 158';
const page=await browser.newPage({viewport:{width:900,height:900}});
try {
  // A bare sawtooth with peak labels and an HTML place axis: no value axis, and "31%" sits on the line.
  await page.setContent(`<body style="margin:20px;font:13px Arial"><svg width="640" height="230" viewBox="0 0 640 230" fill="none">
    <path d="${line}" stroke="#111" stroke-width="2"/><text x="146" y="34" font-size="12">90%</text><text x="600" y="152" font-size="12">31%</text></svg>
    <div style="display:flex;justify-content:space-between;width:640px"><span>Reno · mi 0</span><span>Elko · 286</span><span>Salt Lake City · 518</span></div>
    <svg width="800" height="300" viewBox="0 0 800 300" fill="none" stroke="#ccc"><path d="M0 50H70V200H200"/><path d="M800 40H700V120H560"/></svg></body>`);
  let found=judgeCharts(await page.evaluate(collectChartGeometry));
  assert.equal(found.bareChart.length,1,JSON.stringify(found));
  assert.ok(found.chartCollision.some(c=>c.includes('"31%"')),JSON.stringify(found));
  // The same series with a value axis and labels clear of it.
  await page.setContent(`<body style="margin:20px;font:13px Arial"><svg width="640" height="262" viewBox="0 0 640 262" fill="none" font-size="12">
    <g stroke="#eee"><path d="M40 20H630M40 70H630M40 120H630M40 170H630"/></g>
    <g fill="#777" text-anchor="end"><text x="32" y="24">100%</text><text x="32" y="74">75%</text><text x="32" y="124">50%</text><text x="32" y="174">25%</text><text x="32" y="224">0%</text></g>
    <path d="${line}" stroke="#111" stroke-width="2"/><text x="604" y="182" fill="#333">31%</text></svg></body>`);
  found=judgeCharts(await page.evaluate(collectChartGeometry));
  assert.deepEqual(found,{bareChart:[],chartCollision:[]});
  console.log('chart check browser fixtures pass');
} finally { await browser.close(); }
