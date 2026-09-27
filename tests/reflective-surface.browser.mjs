import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = path.resolve('.');
const argument = name => { const index = process.argv.indexOf(name); return index < 0 ? null : process.argv[index + 1]; };
const playwright = argument('--playwright');
if (!playwright) throw new Error('Pass --playwright /absolute/path/to/playwright-core/index.mjs');
const { chromium } = await import(pathToFileURL(path.resolve(playwright)).href);
const output = argument('--output');
const axe = argument('--axe');
const mime = new Map([['.html', 'text/html'], ['.css', 'text/css'], ['.mjs', 'text/javascript']]);
const server = createServer(async (request, response) => {
  const file = path.resolve(root, '.' + decodeURIComponent(request.url.split('?')[0]));
  if (!file.startsWith(root + path.sep)) return response.writeHead(403).end();
  try { response.setHeader('Content-Type', mime.get(path.extname(file)) || 'application/octet-stream'); response.end(await readFile(file)); }
  catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({
  headless: true,
  ...(process.env.SEENRY_CHROME_PATH ? { executablePath: process.env.SEENRY_CHROME_PATH } : {}),
  args: ['--enable-webgl', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader'],
});
const url = `http://127.0.0.1:${server.address().port}/skills/seenry-motion/assets/reflective-surface/demo.html`;
try {
  const page = await browser.newPage({ viewport: { width: 1100, height: 800 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await page.waitForFunction(() => Boolean(window.reflectiveSurfaceDemo));
  await page.waitForFunction(() => window.reflectiveSurfaceDemo.surface.mode === 'running');
  const canvas = page.locator('#sample canvas');
  assert.equal(await canvas.getAttribute('aria-hidden'), 'true');
  assert.equal(await page.locator('#light').getAttribute('aria-pressed'), 'true');
  assert.equal(await canvas.evaluate(node => { const data = node.getContext('webgl2').readPixels; return typeof data; }), 'function');
  await page.locator('[data-palette="bronze"]').click();
  assert.equal(await page.locator('#sample').getAttribute('data-reflective-palette'), 'bronze');
  assert.equal(await page.locator('[data-palette="bronze"]').getAttribute('aria-pressed'), 'true');
  await page.locator('#light').focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('#light').getAttribute('aria-pressed'), 'false');
  assert.equal(await page.locator('#status').textContent(), 'Reflection paused');
  assert.equal(await page.locator('#sample').getAttribute('data-reflective-mode'), 'idle');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.reflectiveSurfaceDemo.surface.mode === 'running');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForFunction(() => window.reflectiveSurfaceDemo.surface.mode === 'static');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.waitForFunction(() => window.reflectiveSurfaceDemo.surface.mode === 'running');
  await page.evaluate(() => { document.querySelector('main').style.marginTop = '1800px'; });
  await page.waitForFunction(() => window.reflectiveSurfaceDemo.surface.mode === 'paused');
  await page.evaluate(() => { document.querySelector('main').style.marginTop = '0'; window.scrollTo(0, 0); });
  await page.waitForFunction(() => window.reflectiveSurfaceDemo.surface.mode === 'running');
  const hasContextLoss = await canvas.evaluate(node => {
    window.reflectiveTestContextLoss = node.getContext('webgl2').getExtension('WEBGL_lose_context');
    return Boolean(window.reflectiveTestContextLoss);
  });
  if (hasContextLoss) {
    await page.evaluate(() => window.reflectiveTestContextLoss.loseContext());
    await page.waitForFunction(() => window.reflectiveSurfaceDemo.surface.mode === 'fallback');
    await page.evaluate(() => window.reflectiveTestContextLoss.restoreContext());
    await page.waitForFunction(() => window.reflectiveSurfaceDemo.surface.mode === 'running');
  }
  if (axe) {
    await page.addScriptTag({ path: axe });
    const violations = await page.evaluate(async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })).violations.map(item => ({ id: item.id, nodes: item.nodes.map(node => node.target) })));
    assert.deepEqual(violations, []);
  }
  if (output) { await mkdir(output, { recursive: true }); await page.screenshot({ path: path.join(output, 'desktop.png') }); }
  assert.deepEqual(errors, []);
  await page.evaluate(() => window.reflectiveSurfaceDemo.surface.destroy());
  assert.equal(await canvas.count(), 0);
  assert.equal(await page.locator('#sample').getAttribute('data-reflective-mode'), null);
  await page.close();

  const mobile = await browser.newPage({ viewport: { width: 320, height: 700 } });
  await mobile.goto(url);
  await mobile.waitForFunction(() => Boolean(window.reflectiveSurfaceDemo));
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await mobile.locator('#light').focus();
  await mobile.keyboard.press('Space');
  assert.equal(await mobile.locator('#light').getAttribute('aria-pressed'), 'false');
  if (output) await mobile.screenshot({ path: path.join(output, 'mobile.png') });
  await mobile.close();

  const fallback = await browser.newPage();
  await fallback.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) {
      return type === 'webgl2' ? null : original.call(this, type, ...args);
    };
  });
  await fallback.goto(url);
  await fallback.waitForFunction(() => Boolean(window.reflectiveSurfaceDemo));
  assert.equal(await fallback.locator('#sample').getAttribute('data-reflective-mode'), 'fallback');
  await fallback.locator('#light').click();
  assert.equal(await fallback.locator('#light').getAttribute('aria-pressed'), 'false');
  assert.equal(await fallback.locator('#status').textContent(), 'Reflection paused');
  await fallback.close();
  console.log('Reflective surface: graphics, palette, keyboard, live reduced motion, visibility pause, accessibility, mobile layout and cleanup passed.');
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
