import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = path.resolve('.');
const modulePath = process.argv[process.argv.indexOf('--playwright') + 1];
if (!modulePath || modulePath.startsWith('--')) throw new Error('Pass --playwright /absolute/path/to/playwright/index.mjs');
const { chromium } = await import(pathToFileURL(path.resolve(modulePath)).href);
const outputIndex = process.argv.indexOf('--output');
const output = outputIndex < 0 ? null : path.resolve(process.argv[outputIndex + 1]);
const mime = new Map([['.html', 'text/html'], ['.css', 'text/css'], ['.mjs', 'text/javascript']]);
const server = createServer(async (request, response) => {
  const file = path.resolve(root, '.' + decodeURIComponent(request.url.split('?')[0]));
  if (!file.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
  try { response.setHeader('Content-Type', mime.get(path.extname(file)) || 'application/octet-stream'); response.end(await readFile(file)); }
  catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await chromium.launch({ headless: true, ...(existsSync(chromePath) ? { executablePath: chromePath } : {}) });
const url = `http://127.0.0.1:${server.address().port}/skills/seenry-motion/assets/pointer-tilt/demo.html`;

try {
  const page = await browser.newPage({ viewport: { width: 1100, height: 800 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await page.waitForFunction(() => Boolean(window.study));
  const box = await page.locator('#host').boundingBox();
  await page.mouse.move(box.x + box.width * .8, box.y + box.height * .2);
  await page.waitForFunction(() => document.querySelector('#plane').style.getPropertyValue('--tilt-y') !== '0deg');
  const pose = await page.locator('#plane').evaluate(el => ({ x: el.style.getPropertyValue('--tilt-x'), y: el.style.getPropertyValue('--tilt-y') }));
  assert.ok(parseFloat(pose.x) > 0 && parseFloat(pose.y) > 0, JSON.stringify(pose));
  const glare = await page.locator('#glare').evaluate(el => el.style.getPropertyValue('--glare-x'));
  assert.ok(parseFloat(glare) > 50);
  if (output) { await mkdir(output, { recursive: true }); await page.screenshot({ path: path.join(output, 'active-desktop.png') }); }
  await page.mouse.move(0, 0);
  await page.waitForFunction(() => document.querySelector('#plane').style.getPropertyValue('--tilt-y') === '0deg');
  assert.equal(await page.locator('#glare').evaluate(el => el.style.opacity), '0');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.mouse.move(box.x + box.width * .2, box.y + box.height * .8);
  assert.equal(await page.locator('#plane').evaluate(el => el.style.getPropertyValue('--tilt-y')), '0deg');
  assert.match(await page.locator('.instruction').textContent(), /Touch and keyboard keep the card at rest/);
  const mobile = await browser.newPage({ viewport: { width: 320, height: 700 } });
  await mobile.goto(url);
  await mobile.waitForFunction(() => Boolean(window.study));
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  if (output) await mobile.screenshot({ path: path.join(output, 'mobile.png'), fullPage: true, animations: 'disabled' });
  await mobile.close();
  await page.evaluate(() => window.study.destroy());
  await page.mouse.move(0, 0);
  const mobileBox = await page.locator('#host').boundingBox();
  await page.mouse.move(mobileBox.x + mobileBox.width * .8, mobileBox.y + mobileBox.height * .2);
  assert.equal(await page.locator('#plane').evaluate(el => el.style.getPropertyValue('--tilt-y')), '0deg');
  assert.deepEqual(errors, []);
  console.log('Pointer tilt browser checks passed.');
} finally {
  await browser.close();
  server.close();
}
