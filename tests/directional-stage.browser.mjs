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
const url = `http://127.0.0.1:${server.address().port}/skills/seenry-motion/assets/directional-stage/demo.html`;
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await page.waitForFunction(() => Boolean(window.study));
  assert.equal(await page.evaluate(() => study.stage.current), 'object');
  assert.equal(await page.locator('[data-view="process"]').getAttribute('aria-hidden'), 'true');
  assert.equal(await page.locator('[data-view="process"]').evaluate(el => el.inert), true);
  if (output) { await mkdir(output, { recursive: true }); await page.screenshot({ path: path.join(output, 'desktop-object.png') }); }

  await page.locator('.switches [data-go="process"]').click();
  assert.equal(await page.evaluate(() => study.stage.current), 'process');
  assert.equal(await page.locator('[data-view="object"]').evaluate(el => el.inert), true);
  assert.equal(await page.locator('[data-view="process"]').evaluate(el => el.inert), false);
  await page.waitForFunction(() => document.activeElement.id === 'process-title');
  await page.waitForTimeout(90);
  const forward = await page.evaluate(() => {
    const incoming = document.querySelector('[data-view="process"]');
    const outgoing = document.querySelector('[data-view="object"]');
    return { incoming: incoming.getBoundingClientRect().left, outgoing: outgoing.getBoundingClientRect().left,
      stage: document.querySelector('#stage').getBoundingClientRect().left };
  });
  assert.equal(forward.incoming > forward.stage, true, 'incoming view should still be travelling from the right');
  assert.equal(forward.outgoing < forward.stage, true, 'outgoing view should travel left');
  await page.waitForTimeout(500);
  assert.equal(await page.locator('#stage').getAttribute('data-stage-state'), 'settled');
  if (output) await page.screenshot({ path: path.join(output, 'desktop-process.png') });

  await page.goBack();
  await page.waitForFunction(() => study.stage.current === 'object');
  assert.equal(await page.locator('.switches [data-go="object"]').getAttribute('aria-current'), 'page');
  await page.evaluate(() => { study.navigate('process'); study.navigate('object'); study.navigate('process'); });
  await page.waitForTimeout(550);
  assert.equal(await page.evaluate(() => study.stage.current), 'process');
  assert.equal(await page.locator('[data-view="object"]').evaluate(el => el.inert), true);
  assert.equal(await page.locator('#stage').getAttribute('data-stage-state'), 'settled');

  const deepLink = await browser.newPage({ viewport: { width: 1000, height: 800 } });
  await deepLink.goto(url + '#process');
  await deepLink.waitForFunction(() => Boolean(window.study));
  assert.equal(await deepLink.evaluate(() => study.stage.current), 'process');
  assert.equal(await deepLink.locator('.switches [data-go="process"]').getAttribute('aria-current'), 'page');
  await deepLink.close();

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(() => study.navigate('object'));
  assert.equal(await page.evaluate(() => study.stage.current), 'object');
  assert.equal(await page.locator('#stage').getAttribute('data-stage-state'), 'settled');
  assert.equal(await page.locator('[data-view="object"]').evaluate(el => getComputedStyle(el).transitionDuration), '0s');

  const narrow = await browser.newPage({ viewport: { width: 320, height: 700 } });
  await narrow.goto(url);
  await narrow.waitForFunction(() => Boolean(window.study));
  assert.equal(await narrow.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  if (output) await narrow.screenshot({ path: path.join(output, 'mobile-object.png'), fullPage: true });
  await narrow.locator('.switches [data-go="process"]').click();
  await narrow.waitForTimeout(500);
  assert.equal(await narrow.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  assert.equal(await narrow.locator('#stage').evaluate(el => Math.abs(el.getBoundingClientRect().height - el.querySelector('[data-view="process"]').getBoundingClientRect().height) <= 1), true);
  if (output) await narrow.screenshot({ path: path.join(output, 'mobile-process.png'), fullPage: true });
  await narrow.evaluate(() => study.stage.destroy());
  assert.equal(await narrow.locator('[data-view="object"]').getAttribute('aria-hidden'), null);
  assert.deepEqual(errors, []);
  await narrow.close();
  await page.close();
  console.log('Directional stage: active semantics, focus, history, reversal, reduced motion and narrow width passed.');
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
