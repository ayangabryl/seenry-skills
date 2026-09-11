import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {studyPalettes} from '../skills/seenry/scripts/palette_study.mjs';
const i = process.argv.indexOf('--playwright');
if (i < 0) throw Error('Pass --playwright path');
const {chromium} = await import(pathToFileURL(process.argv[i + 1]).href);
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.setContent('<style>:root{--ink:#333;--surface:#fff}main{width:300px;padding:24px;color:var(--ink);background:var(--surface);transition:color 10s}button{color:inherit}</style><main><h2>Choose a format</h2><button>Download</button></main>');
  await page.evaluate(() => document.documentElement.style.setProperty('--ink', '#123456', 'important'));
  const spec = {scope: ':root', targets: [{id: 'component', selector: 'main'}], palettes: [
    {id: 'A', variables: {'--ink': '#202020', '--surface': '#fafafa'}},
    {id: 'B', variables: {'--ink': '#f2f2f2', '--surface': '#202020'}}
  ]};
  const options = {sourceSha256: 'a'.repeat(64)};
  const result = await studyPalettes(page, spec, {...options, onPalette: async () => {
    assert.ok((await page.screenshot()).length > 0); return 'host-captured';
  }});
  assert.equal(result.status, 'captured');
  assert.equal(result.captures[0].observed.targets[0].colors.foreground, 'rgb(32, 32, 32)');
  assert.equal(result.captures[1].observed.targets[0].colors.foreground, 'rgb(242, 242, 242)');
  assert.equal(result.captures[1].sameMeasuredContentAndGeometry, true);
  const restored = () => page.evaluate(() => ({value: document.documentElement.style.getPropertyValue('--ink'), priority: document.documentElement.style.getPropertyPriority('--ink'), surface: document.documentElement.style.getPropertyValue('--surface'), active: !!window.__seenryPaletteStudy}));
  assert.deepEqual(await restored(), {value: '#123456', priority: 'important', surface: '', active: false});
  await assert.rejects(studyPalettes(page, spec, {...options, onPalette: () => {throw Error('Capture failed');}}), /Capture failed/);
  assert.equal((await restored()).active, false); assert.equal((await restored()).value, '#123456');
  await assert.rejects(studyPalettes(page, {...spec, targets: [{id:'x', selector:'not-present'}]}, options), /Expected one target/);
  await assert.rejects(studyPalettes(page, {...spec, palettes: [spec.palettes[0], {id:'B', variables:{'--ink':'#333'}}]}, options), /same properties/);
  await assert.rejects(studyPalettes(page, {...spec, palettes: spec.palettes.map(x=>({...x, variables:{...x.variables,'--ink':'url(https://example.com)'}}))}, options), /Unsupported explicit color/);
  const drift = await studyPalettes(page, spec, {...options, onPalette: ({id}) => id === 'A' ? page.evaluate(() => document.querySelector('main').style.width = '400px') : null});
  assert.equal(drift.status, 'unverified-comparison');
  console.log('Actual palette colors, matched geometry, drift detection, rejected inputs and restoration after failed capture verified. No aesthetic verdict.');
} finally {await browser.close();}
