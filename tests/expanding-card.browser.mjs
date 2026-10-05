import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = path.resolve('.');
const modulePath = process.argv[process.argv.indexOf('--playwright') + 1];
if (!modulePath || modulePath.startsWith('--')) throw new Error('Pass --playwright /absolute/path/to/playwright/index.mjs');
const { chromium } = await import(pathToFileURL(path.resolve(modulePath)).href);
const outputIndex = process.argv.indexOf('--output');
const output = outputIndex < 0 ? null : path.resolve(process.argv[outputIndex + 1]);
const axeIndex = process.argv.indexOf('--axe');
const axePath = axeIndex < 0 ? null : path.resolve(process.argv[axeIndex + 1]);
const mime = new Map([['.html', 'text/html'], ['.css', 'text/css'], ['.mjs', 'text/javascript']]);
const server = createServer(async (request, response) => {
  const file = path.resolve(root, '.' + decodeURIComponent(request.url.split('?')[0]));
  if (!file.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
  try { response.setHeader('Content-Type', mime.get(path.extname(file)) || 'application/octet-stream'); response.end(await readFile(file)); }
  catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
const url = `http://127.0.0.1:${server.address().port}/skills/seenry-motion/assets/expanding-card/demo.html`;
try {
  const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await page.waitForFunction(() => Boolean(window.study));
  const trigger = page.locator('#review-trigger');
  const panel = page.locator('#review-panel');
  assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
  assert.equal(await panel.evaluate(element => element.inert), true);
  await trigger.focus();
  await page.keyboard.press('Enter');
  assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
  assert.equal(await panel.evaluate(element => element.inert), false);
  await page.waitForFunction(() => document.querySelector('#review-panel').style.height === 'auto');
  assert.equal(await panel.evaluate(element => element.style.height), 'auto');
  if (axePath) {
    await page.addScriptTag({ path: axePath });
    const violations = await page.evaluate(async () => (await axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] },
    })).violations.map(item => ({ id: item.id, nodes: item.nodes.map(node => node.target) })));
    assert.deepEqual(violations, []);
  }
  const firstHeight = await panel.evaluate(element => element.getBoundingClientRect().height);
  await panel.evaluate(element => {
    const note = document.createElement('p');
    note.textContent = 'More information appeared after loading.';
    element.firstElementChild.append(note);
  });
  await page.waitForFunction(previous => document.querySelector('#review-panel').getBoundingClientRect().height > previous + 10, firstHeight);

  await page.locator('#review-panel a').focus();
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'review-trigger');
  assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
  assert.equal(await panel.evaluate(element => element.inert), true);
  await trigger.click();
  await page.waitForTimeout(70);
  await trigger.click();
  await page.waitForTimeout(70);
  await trigger.click();
  await page.waitForFunction(() => document.querySelector('#review-panel').style.height === 'auto');
  assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
  assert.equal(await panel.evaluate(element => element.style.height), 'auto');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await trigger.click();
  assert.equal(await panel.evaluate(element => element.style.height), '0px');
  await trigger.click();
  assert.equal(await panel.evaluate(element => element.style.height), 'auto');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await trigger.click();
  await page.waitForTimeout(45);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  assert.equal(await panel.evaluate(element => element.style.height), '0px');
  await trigger.click();
  assert.equal(await panel.evaluate(element => element.style.height), 'auto');

  await page.setViewportSize({ width: 320, height: 700 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  if (output) {
    await mkdir(output, { recursive: true });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.screenshot({ path: path.join(output, 'mobile.png') });
    await page.setViewportSize({ width: 900, height: 700 });
    await page.screenshot({ path: path.join(output, 'desktop.png') });
  }
  await page.evaluate(() => window.study.destroy());
  assert.equal(await trigger.getAttribute('aria-expanded'), null);
  assert.equal(await trigger.getAttribute('aria-controls'), null);
  assert.equal(await panel.evaluate(element => element.inert), false);
  assert.deepEqual(errors, []);
  console.log('Expanding card: keyboard, reversal, resize, reduced motion, narrow width and cleanup passed.');
} finally {
  await browser.close();
  server.close();
}
