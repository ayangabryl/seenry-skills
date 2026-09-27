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
const server = createServer(async (request, response) => {
  const file = path.resolve(root, '.' + decodeURIComponent(request.url.split('?')[0]));
  if (!file.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
  try {
    response.setHeader('Content-Type', file.endsWith('.html') ? 'text/html' : 'text/javascript');
    response.end(await readFile(file));
  } catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const localChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await chromium.launch({ headless: true, ...(existsSync(localChrome) ? { executablePath: localChrome } : {}) });
const url = `http://127.0.0.1:${server.address().port}/skills/seenry-motion/assets/confirmation-burst/demo.html`;
const workbenchUrl = `http://127.0.0.1:${server.address().port}/skills/seenry-motion/assets/confirmation-burst/workbench.html`;

try {
  for (const viewport of [{ width: 1440, height: 900, name: 'desktop' }, { width: 390, height: 844, name: 'mobile' }]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(url);
    await page.waitForFunction(() => Boolean(window.study));
    assert.equal(await page.locator('#progress-value').textContent(), '02');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    if (output) { await mkdir(output, { recursive: true }); await page.screenshot({ path: path.join(output, `${viewport.name}-before.png`) }); }
    await page.locator('#complete').focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('#progress-value').textContent(), '03');
    assert.equal(await page.locator('#complete').isDisabled(), true);
    assert.equal(await page.locator('[data-confirmation-burst]').count(), 1);
    assert.equal(await page.locator('[data-confirmation-burst]').getAttribute('aria-hidden'), 'true');
    assert.equal(await page.locator('[data-confirmation-burst]').evaluate(el => getComputedStyle(el).pointerEvents), 'none');
    if (output) { await page.waitForTimeout(230); await page.screenshot({ path: path.join(output, `${viewport.name}-burst.png`) }); }
    await page.waitForFunction(() => !document.querySelector('[data-confirmation-burst]'));
    assert.equal(await page.locator('#progress-value').textContent(), '03', 'recorded result survives decorative motion');
    await page.locator('#reset').click();
    assert.equal(await page.locator('#progress-value').textContent(), '02');
    await page.evaluate(() => { window.study.burst.play(); window.study.burst.play(); });
    assert.equal(await page.locator('[data-confirmation-burst]').count(), 1, 'replay replaces prior canvas');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => !document.querySelector('[data-confirmation-burst]'));
    assert.equal(await page.locator('[data-confirmation-burst]').count(), 0, 'live preference change stops motion');
    await page.locator('#complete').click();
    assert.equal(await page.locator('#progress-value').textContent(), '03');
    assert.equal(await page.locator('[data-confirmation-burst]').count(), 0);
    const width = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, inner: innerWidth, wide: [...document.querySelectorAll('*')].filter(el => el.getBoundingClientRect().right > innerWidth).slice(0, 8).map(el => [el.tagName, el.className, Math.round(el.getBoundingClientRect().right)]) }));
    assert.equal(width.scroll <= width.inner, true, JSON.stringify(width));
    await page.evaluate(() => window.study.burst.destroy());
    assert.equal(await page.evaluate(() => window.study.burst.play()), false);
    assert.deepEqual(errors, []);
    await page.close();
  }
  for (const viewport of [{ width: 1440, height: 900, name: 'desktop' }, { width: 390, height: 844, name: 'mobile' }]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(workbenchUrl);
    await page.waitForFunction(() => Boolean(window.workbench));
    if (output) await page.screenshot({ path: path.join(output, `${viewport.name}-workbench.png`) });
    const openingWidth = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, inner: innerWidth, wide: [...document.querySelectorAll('*')].filter(el => el.getBoundingClientRect().right > innerWidth).slice(0, 8).map(el => [el.tagName, el.className, Math.round(el.getBoundingClientRect().right)]) }));
    assert.equal(openingWidth.scroll <= openingWidth.inner, true, JSON.stringify(openingWidth));
    await page.locator('#count').fill('42');
    await page.locator('#duration').fill('680');
    await page.locator('[data-palette="blue"]').click();
    assert.equal(await page.locator('#count-value').textContent(), '42');
    assert.equal(await page.locator('#duration-value').textContent(), '680 ms');
    assert.equal(await page.locator('[data-palette="blue"]').getAttribute('aria-pressed'), 'true');
    const snippet = await page.evaluate(() => window.workbench.snippet);
    assert.match(snippet, /count: 42/);
    assert.match(snippet, /duration: 680/);
    assert.match(snippet, /#73a9b9/);
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.locator('#copy').click();
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), snippet);
    await page.locator('#preview').click();
    await page.waitForFunction(() => Boolean(document.querySelector('[data-confirmation-burst]')));
    if (output) { await page.waitForTimeout(170); await page.screenshot({ path: path.join(output, `${viewport.name}-workbench-burst.png`) }); }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => !document.querySelector('[data-confirmation-burst]'));
    await page.locator('#preview').click();
    assert.equal(await page.locator('[data-confirmation-burst]').count(), 0);
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log('Confirmation burst: demo state and cleanup; workbench tuning, export, reduced motion and responsive width passed.');
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
