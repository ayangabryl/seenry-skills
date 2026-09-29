import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const {chromium} = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const asset = path.join(root, 'skills/seenry/assets/layout-guides');
const server = createServer(async (request, response) => {
  if (request.url === '/dev-layout-grid.css' || request.url === '/DevLayoutGrid.mjs') {
    response.setHeader('Content-Type', request.url.endsWith('.css') ? 'text/css' : 'text/javascript');
    response.end(await readFile(path.join(asset, request.url.slice(1))));
  } else {
    response.setHeader('Content-Type', 'text/html');
    response.end(`<!doctype html><html><head><link rel="stylesheet" href="/dev-layout-grid.css">
      <style>body{margin:0}#region{margin:20px;padding:12px;width:200px;height:60px;border-radius:8px}#target{width:40px;height:20px}</style>
      </head><body><section id="region" data-layout-region data-layout-name="Sample region"><button id="target">Go</button></section>
      <script type="module">import {mountDevLayoutGrid} from '/DevLayoutGrid.mjs';window.unmountGuides=mountDevLayoutGrid({selectors:'body,[data-layout-region]'});</script></body></html>`);
  }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({headless:true,...(process.env.CHROME_PATH ? {executablePath:process.env.CHROME_PATH} : {})});
try {
  const page = await browser.newPage({viewport:{width:390,height:800}}), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.locator('.layout-grid-box').first().waitFor();
  assert.equal(await page.locator('.layout-grid-box').count(), 2);
  assert.equal(await page.locator('.layout-grid-box').filter({hasText:'Sample region'}).evaluate(element => element.style.left), '32px');
  assert.match(await page.locator('.layout-grid-box').filter({hasText:'Sample region'}).textContent(), /Sample region/);
  await page.keyboard.press('Alt+g');
  assert.equal(await page.locator('.layout-grid-overlay').isVisible(), false);
  await page.locator('.layout-grid-toggle').click();
  assert.equal(await page.locator('.layout-grid-overlay').isVisible(), true);
  await page.keyboard.press('Alt+c');
  assert.equal(await page.locator('.layout-grid-checks').isVisible(), true);
  await page.locator('#target').hover();
  assert.match(await page.locator('.layout-grid-hover span').textContent(), /padding/);
  if (process.env.LAYOUT_GUIDES_SCREENSHOT) await page.screenshot({path:process.env.LAYOUT_GUIDES_SCREENSHOT});
  await page.evaluate(() => {
    const replacement = document.createElement('section');
    replacement.id = 'region'; replacement.dataset.layoutRegion = '';
    replacement.dataset.layoutName = 'Replacement';
    replacement.style.cssText = 'margin:30px;padding:10px;width:180px;height:40px';
    document.querySelector('#region').replaceWith(replacement);
    window.unmountGuides.refresh();
  });
  await page.waitForFunction(() => [...document.querySelectorAll('.layout-grid-box span')].some(element => element.textContent.includes('Replacement')));
  assert.equal(await page.locator('.layout-grid-box').filter({hasText:'Replacement'}).evaluate(element => element.style.left), '40px');
  await page.evaluate(() => window.unmountGuides());
  assert.equal(await page.locator('.layout-grid-overlay,.layout-grid-toggle,.layout-check-toggle').count(), 0);
  assert.deepEqual(errors, []);
  console.log('Plain layout guide: measured edge, keyboard and pointer toggles, replaced region, cleanup passed.');
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
