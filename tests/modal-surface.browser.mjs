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
const localChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await chromium.launch({ headless: true, ...(existsSync(localChrome) ? { executablePath: localChrome } : {}) });
const url = `http://127.0.0.1:${server.address().port}/skills/seenry-motion/assets/modal-surface/demo.html`;
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await page.waitForFunction(() => Boolean(window.study));
  assert.equal(await page.locator('#specimen').evaluate(el => el.open), false);
  if (output) {
    await mkdir(output, { recursive: true });
    await page.screenshot({ path: path.join(output, 'desktop-closed.png') });
  }

  await page.locator('#open-specimen').click();
  await page.waitForFunction(() => document.querySelector('#specimen').dataset.state === 'open');
  assert.equal(await page.locator('#specimen').evaluate(el => el.open), true);
  assert.equal(await page.locator('#open-specimen').getAttribute('aria-expanded'), 'true');
  assert.equal(await page.evaluate(() => document.activeElement.getAttribute('aria-label')), 'Close specimen');
  if (output) {
    await mkdir(output, { recursive: true });
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(output, 'desktop-open.png') });
  }

  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#specimen').getAttribute('data-state'), 'closing');
  await page.evaluate(() => window.study.setOpen(true));
  await page.waitForTimeout(400);
  assert.equal(await page.locator('#specimen').evaluate(el => el.open), true, 'reopen must cancel the old close');
  assert.equal(await page.locator('#specimen').getAttribute('data-state'), 'open');
  await page.locator('[data-modal-close]').click();
  await page.waitForFunction(() => !document.querySelector('#specimen').open);
  assert.equal(await page.evaluate(() => document.activeElement.id), 'open-specimen');

  await page.locator('#open-specimen').click();
  await page.waitForFunction(() => document.querySelector('#specimen').dataset.state === 'open');
  await page.mouse.click(8, 8);
  await page.waitForFunction(() => !document.querySelector('#specimen').open);
  assert.equal(await page.evaluate(() => document.activeElement.id), 'open-specimen');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('#open-specimen').click();
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#specimen').evaluate(el => el.open), false);
  assert.equal(await page.locator('#open-specimen').getAttribute('aria-expanded'), 'false');
  await page.evaluate(() => { window.study.setOpen(true); window.study.setOpen(false); window.study.setOpen(true); });
  await page.waitForTimeout(60);
  assert.equal(await page.locator('#specimen').evaluate(el => el.open), true, 'a queued close event must not close a new opening');
  assert.equal(await page.locator('#open-specimen').getAttribute('aria-expanded'), 'true');
  await page.evaluate(() => window.study.setOpen(false));

  const mobile = await browser.newPage({ viewport: { width: 320, height: 700 } });
  await mobile.goto(url);
  await mobile.waitForFunction(() => Boolean(window.study));
  if (output) await mobile.screenshot({ path: path.join(output, 'mobile-closed.png') });
  await mobile.locator('#open-specimen').click();
  await mobile.waitForFunction(() => document.querySelector('#specimen').dataset.state === 'open');
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  assert.equal(await mobile.locator('#specimen').evaluate(el => el.getBoundingClientRect().width <= innerWidth), true);
  if (output) {
    await mobile.waitForTimeout(400);
    await mobile.screenshot({ path: path.join(output, 'mobile-open.png') });
  }
  await mobile.setViewportSize({ width: 320, height: 580 });
  assert.equal(await mobile.locator('#specimen').evaluate(el => el.getBoundingClientRect().height <= innerHeight - 30), true);
  await mobile.evaluate(() => window.study.destroy());
  assert.equal(await mobile.locator('#specimen').evaluate(el => el.open), false);
  assert.equal(await mobile.locator('#open-specimen').getAttribute('aria-haspopup'), null);
  assert.deepEqual(errors, []);
  await mobile.close();
  await page.close();
  console.log('Modal surface: native dialog, focus, Escape, reversal, reduced motion and narrow width passed.');
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
