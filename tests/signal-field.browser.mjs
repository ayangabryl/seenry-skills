import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = path.resolve('.');
const moduleIndex = process.argv.indexOf('--playwright');
if (moduleIndex < 0) throw new Error('Pass --playwright /absolute/path/to/playwright-core/index.mjs');
const { chromium } = await import(pathToFileURL(path.resolve(process.argv[moduleIndex + 1])).href);
const outputIndex = process.argv.indexOf('--output');
const output = outputIndex < 0 ? null : path.resolve(process.argv[outputIndex + 1]);
const axeIndex = process.argv.indexOf('--axe');
const axePath = axeIndex < 0 ? null : path.resolve(process.argv[axeIndex + 1]);
const mime = new Map([['.html', 'text/html'], ['.mjs', 'text/javascript']]);
const server = createServer(async (request, response) => {
  const file = path.resolve(root, '.' + decodeURIComponent(request.url.split('?')[0]));
  if (!file.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
  try { response.setHeader('Content-Type', mime.get(path.extname(file)) || 'application/octet-stream'); response.end(await readFile(file)); }
  catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true, executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const url = `http://127.0.0.1:${server.address().port}/skills/seenry-motion/assets/signal-field/demo.html`;
try {
  const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await page.waitForFunction(() => Boolean(window.signalField));
  assert.equal(await page.locator('#field').getAttribute('aria-hidden'), 'true');
  assert.equal(await page.locator('#status').getAttribute('role'), 'status');
  assert.equal(await page.evaluate(() => window.signalField.isAnimating()), false);

  await page.getByRole('button', { name: 'Working' }).click();
  await page.waitForFunction(() => window.signalField.isAnimating());
  assert.equal(await page.locator('#status').textContent(), 'Processing…');
  const movingFrame = await page.locator('#field').evaluate(canvas => canvas.toDataURL());
  await page.waitForTimeout(250);
  assert.notEqual(await page.locator('#field').evaluate(canvas => canvas.toDataURL()), movingFrame);
  await page.getByRole('button', { name: 'Success' }).click();
  assert.equal(await page.evaluate(() => window.signalField.getState()), 'success');
  assert.equal(await page.evaluate(() => window.signalField.isAnimating()), false);
  assert.equal(await page.locator('#status').textContent(), 'Process complete');

  await page.getByRole('button', { name: 'Working' }).click();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForFunction(() => !window.signalField.isAnimating());
  assert.equal(await page.locator('#status').textContent(), 'Processing…');
  const settledFrame = await page.locator('#field').evaluate(canvas => canvas.toDataURL());
  await page.waitForTimeout(250);
  assert.equal(await page.locator('#field').evaluate(canvas => canvas.toDataURL()), settledFrame);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.waitForFunction(() => window.signalField.isAnimating());
  await page.evaluate(() => { document.querySelector('main').style.marginTop = '1800px'; });
  await page.waitForFunction(() => !window.signalField.isAnimating());
  await page.evaluate(() => { document.querySelector('main').style.marginTop = '0'; window.scrollTo(0, 0); });
  await page.waitForFunction(() => window.signalField.isAnimating());
  await page.getByRole('button', { name: 'Error' }).click();
  assert.equal(await page.evaluate(() => window.signalField.isAnimating()), false);
  assert.equal(await page.locator('#status').textContent(), 'Process could not finish');

  if (axePath) {
    await page.addScriptTag({ path: axePath });
    const violations = await page.evaluate(async () => (await axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] },
    })).violations.map(item => ({ id: item.id, nodes: item.nodes.map(node => node.target) })));
    assert.deepEqual(violations, []);
  }

  const mobile = await browser.newPage({ viewport: { width: 320, height: 700 } });
  await mobile.goto(url);
  await mobile.waitForFunction(() => Boolean(window.signalField));
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await mobile.getByRole('button', { name: 'Working' }).focus();
  await mobile.keyboard.press('Enter');
  await mobile.waitForFunction(() => window.signalField.isAnimating());
  if (output) {
    await mkdir(output, { recursive: true });
    await page.screenshot({ path: path.join(output, 'desktop-error.png') });
    await mobile.screenshot({ path: path.join(output, 'mobile-working.png') });
  }
  await mobile.evaluate(() => window.signalField.destroy());
  assert.equal(await mobile.evaluate(() => window.signalField.isAnimating()), false);
  assert.deepEqual(errors, []);
  await mobile.close();
  await page.close();
  console.log('Signal field: real state API, pause/resume, live reduced motion, keyboard, mobile and cleanup passed.');
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
