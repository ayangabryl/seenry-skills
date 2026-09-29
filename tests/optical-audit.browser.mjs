import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {collectOpticalAudit} from '../skills/seenry/scripts/optical_audit.mjs';

const index=process.argv.indexOf('--playwright');
if(index<0)throw new Error('Pass --playwright /absolute/path/to/playwright/index.mjs');
const {chromium}=await import(pathToFileURL(process.argv[index+1]).href);
const browser=await chromium.launch({headless:true,...(process.env.SEENRY_CHROME_PATH?{executablePath:process.env.SEENRY_CHROME_PATH}:{})});
const play='<svg viewBox="0 0 24 24" width="20" height="20"><path d="M5 4L19 12L5 20z" fill="currentColor"/></svg>';
const dot='<svg viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="12" r="6" fill="currentColor"/></svg>';
try {
  const page=await browser.newPage({viewport:{width:800,height:600}});
  await page.setContent(`<style>
    body{margin:24px;font:16px/24px Arial;display:grid;gap:16px;justify-items:start}
    button{all:unset;display:grid;place-items:center;width:48px;height:48px;border-radius:50%;background:#111;color:#fff}
    button svg{display:block}
    #fixed svg{translate:1px 0}
    .pill{all:unset;display:inline-flex;align-items:center;justify-content:center;height:40px;padding:0 16px;background:#eee;border-radius:20px;font:500 14px/20px Arial}
    #low{padding-top:8px;height:32px;padding-bottom:0}
    .row{display:flex;align-items:flex-start;gap:8px;font:14px/24px Arial}
    .row.ok{align-items:center}
    .row.ok span{text-box:trim-both cap alphabetic}
    h1{font:600 72px/1 Arial;margin:0}p{margin:0}
  </style>
  <button id="naive" aria-label="Play naive">${play}</button>
  <button id="fixed" aria-label="Play fixed">${play}</button>
  <button id="round" aria-label="Round">${dot}</button>
  <a class="pill" id="centered" href="#">Save changes</a>
  <a class="pill" id="low" href="#">Save changes</a>
  <div class="row" id="rowbad">${dot}<span>Status online</span></div>
  <div class="row ok" id="rowok">${dot}<span>Status online</span></div>
  <div><h1 id="head">Hello there</h1><p>Body text below the headline</p></div>`);
  const r=await page.evaluate(collectOpticalAudit,{});
  const icon=id=>r.iconOnly.find(x=>x.element===id);
  assert.ok(icon('#naive'),'geometrically centered play triangle is flagged');
  assert.ok(icon('#naive').nudge.x>0.75,'play triangle should move right');
  assert.equal(icon('#fixed'),undefined,'nudged play triangle passes');
  assert.equal(icon('#round'),undefined,'centered circle passes');
  assert.ok(r.controlText.some(x=>x.element==='#low'&&x.issue.startsWith('label not centered')));
  assert.ok(!r.controlText.some(x=>x.element==='#centered'&&x.issue.startsWith('label not centered')));
  assert.ok(r.iconText.some(x=>x.element==='#rowbad'));
  assert.ok(!r.iconText.some(x=>x.element==='#rowok'));
  assert.ok(r.sideBearing.some(x=>x.element==='#head'&&x.inkOffset>1));
  console.log('Optical audit: triangle centering, label centering, icon-to-text and headline side bearing passed.');
} finally { await browser.close(); }
