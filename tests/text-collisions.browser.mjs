import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {collectTextCollisions} from '../skills/seenry/scripts/text_collisions.mjs';

const index=process.argv.indexOf('--playwright');
if(index<0)throw new Error('Pass --playwright /absolute/path/to/playwright/index.mjs');
const {chromium}=await import(pathToFileURL(process.argv[index+1]).href);
const browser=await chromium.launch({headless:true,...(process.env.SEENRY_CHROME_PATH?{executablePath:process.env.SEENRY_CHROME_PATH}:{})});
try {
  const page=await browser.newPage({viewport:{width:800,height:600}});
  await page.setContent(`<style>
    body{margin:20px;font:12px Arial}
    .faceplate{position:relative;width:280px;height:240px;background:#eee}
    .meter{position:absolute;top:100px;right:16px;width:100px;height:20px;background:#777}
    .caption{position:absolute;top:104px;left:30px;white-space:nowrap}
    @media(max-width:400px){.caption{left:130px}}
    .hidden{display:none}
  </style><main class="faceplate"><div class="meter" aria-hidden="true"></div><span class="caption">STANDBY / POWER</span><span class="hidden">Hidden</span></main>`);
  const wide=await page.evaluate(collectTextCollisions);
  assert.deepEqual(wide.candidates,[]);
  assert.deepEqual(wide.textAgainstPaint,[]);
  await page.setViewportSize({width:320,height:600});
  const narrow=await page.evaluate(collectTextCollisions);
  assert.equal(narrow.candidates.length,0);
  assert.ok(narrow.textAgainstPaint.some(item=>item.text.text==='STANDBY / POWER'&&item.paint.element==='div.meter'));
  assert.equal(narrow.truncated,false);
  assert.ok(!JSON.stringify(narrow).includes('Hidden'));
  await page.setContent(`<style>span{position:absolute;font:18px Arial}#a{left:20px;top:30px}#b{left:35px;top:34px}</style><span id="a">First label</span><span id="b">Second label</span>`);
  const textOverlap=await page.evaluate(collectTextCollisions);
  assert.ok(textOverlap.candidates.some(item=>item.first.element==='#a'&&item.second.element==='#b'));
  console.log('Text collision probe: cross-element paint overlap at 320px, clean wide state and hidden content passed.');
} finally {await browser.close();}
