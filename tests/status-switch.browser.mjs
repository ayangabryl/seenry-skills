import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = path.resolve('.');
const modulePath = process.argv[process.argv.indexOf('--playwright') + 1];
if (!modulePath || modulePath.startsWith('--')) throw new Error('Pass --playwright /absolute/path/to/playwright-core/index.mjs');
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
const browser = await chromium.launch({ headless: true, executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const url = `http://127.0.0.1:${server.address().port}/skills/seenry-motion/assets/status-switch/demo.html`;
try {
  const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await page.waitForFunction(() => Boolean(window.study));
  const status = page.locator('#request-status');
  assert.equal(await status.getAttribute('role'), 'status');
  assert.equal(await status.locator('.seenry-status-switch__accessible').textContent(), 'Ready for review');
  const width = await status.evaluate(element => element.getBoundingClientRect().width);

  await page.getByRole('button', { name: 'Reviewing' }).click();
  assert.equal(await status.locator('.seenry-status-switch__accessible').textContent(), 'Reviewing changes');
  await page.getByRole('button', { name: 'Approved' }).click();
  await page.getByRole('button', { name: 'Needs revision' }).click();
  assert.equal(await status.locator('.seenry-status-switch__accessible').textContent(), 'Needs revision');
  assert.equal(await status.locator('.seenry-status-switch__text').count() <= 2, true);
  await page.waitForTimeout(300);
  assert.equal(await status.locator('.seenry-status-switch__text').count(), 1);
  assert.equal(await status.locator('.seenry-status-switch__text').textContent(), 'Needs revision');
  assert.equal(Math.abs((await status.evaluate(element => element.getBoundingClientRect().width)) - width) < 1, true);

  if (axePath) {
    await page.addScriptTag({ path: axePath });
    const violations = await page.evaluate(async () => (await axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] },
    })).violations.map(item => ({ id: item.id, nodes: item.nodes.map(node => node.target) })));
    assert.deepEqual(violations, []);
  }

  await page.getByRole('button', { name: 'Ready' }).click();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForFunction(() => document.querySelectorAll('#request-status .seenry-status-switch__text').length === 1);
  assert.equal(await status.locator('.seenry-status-switch__text').count(), 1);
  await page.getByRole('button', { name: 'Approved' }).click();
  assert.equal(await status.locator('.seenry-status-switch__text').count(), 1);
  assert.equal(await status.locator('.seenry-status-switch__text').textContent(), 'Changes approved');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  assert.equal(await page.evaluate(() => {
    try { window.study.update(''); return false; } catch (error) { return error instanceof TypeError; }
  }), true);
  assert.equal(errors.length, 0, errors.join('\n'));

  const mobile = await browser.newPage({ viewport: { width: 320, height: 700 } });
  await mobile.goto(url);
  await mobile.waitForFunction(() => Boolean(window.study));
  await mobile.getByRole('button', { name: 'Needs revision' }).click();
  await mobile.waitForTimeout(300);
  assert.equal(await mobile.locator('#request-status .seenry-status-switch__text').count(), 1);
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  if (output) {
    await mkdir(output, { recursive: true });
    await page.screenshot({ path: path.join(output, 'desktop.png') });
    await mobile.screenshot({ path: path.join(output, 'mobile.png') });
  }
  await page.evaluate(() => window.study.destroy());
  assert.equal(await status.getAttribute('role'), null);
  assert.equal(await status.textContent(), 'Changes approved');
  await mobile.close();
  await page.close();
  console.log('Status switch: rapid updates, stable width, live reduced motion, narrow width and cleanup passed.');
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
