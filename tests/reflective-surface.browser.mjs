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

  const rim = await browser.newPage({ viewport: { width: 1100, height: 800 } });
  await rim.goto(`http://127.0.0.1:${server.address().port}/skills/seenry-motion/assets/reflective-surface/rim-demo.html`);
  await rim.waitForFunction(() => window.reflectiveRimDemo?.surface.mode === 'running');
  assert.equal(await rim.locator('#ring').getAttribute('data-reflective-appearance'), 'rim');
  assert.equal(await rim.locator('#neighbor canvas').count(), 1);
  const reflection = await rim.locator('#neighbor canvas').evaluate(canvas => {
    const { width, height } = canvas;
    const pixels = canvas.getContext('2d').getImageData(0, 0, width, height).data;
    const edge = x => {
      let sum = 0;
      for (let y = 0; y < height; y++) sum += pixels[(y * width + x) * 4 + 3];
      return sum;
    };
    return { left: edge(2), right: edge(width - 3) };
  });
  assert.ok(reflection.right > reflection.left, `Linked reflection should favor the nearby edge: ${JSON.stringify(reflection)}`);
  const ringBounds = await rim.locator('#ring').boundingBox();
  const rimBrightness = async () => {
    const screenshot = await rim.locator('#ring').screenshot();
    return rim.evaluate(async dataUrl => {
      const bitmap = new Image();
      bitmap.src = dataUrl;
      await bitmap.decode();
      const sample = document.createElement('canvas');
      sample.width = bitmap.naturalWidth;
      sample.height = bitmap.naturalHeight;
      const context = sample.getContext('2d');
      context.drawImage(bitmap, 0, 0);
      const pixels = context.getImageData(0, 0, sample.width, sample.height).data;
      const halves = [0, 0];
      const counts = [0, 0];
      for (let y = 0; y < sample.height; y++) for (let x = 0; x < sample.width; x++) {
        const distance = Math.hypot(x - sample.width / 2, y - sample.height / 2);
        if (distance < sample.width * 0.37 || distance > sample.width * 0.49) continue;
        const half = x < sample.width / 2 ? 0 : 1;
        const index = (y * sample.width + x) * 4;
        halves[half] += (pixels[index] + pixels[index + 1] + pixels[index + 2]) / 3;
        counts[half]++;
      }
      return halves.map((value, index) => value / counts[index]);
    }, `data:image/png;base64,${screenshot.toString('base64')}`);
  };
  await rim.mouse.move(ringBounds.x + ringBounds.width * 0.2, ringBounds.y + ringBounds.height / 2);
  await rim.waitForTimeout(130);
  const pointerLeft = await rimBrightness();
  await rim.mouse.move(ringBounds.x + ringBounds.width * 0.8, ringBounds.y + ringBounds.height / 2);
  await rim.waitForTimeout(130);
  const pointerRight = await rimBrightness();
  assert.ok(pointerLeft[0] > pointerRight[0] + 3, `Left-side light should follow the pointer: ${pointerLeft} / ${pointerRight}`);
  assert.ok(pointerRight[1] > pointerLeft[1] + 3, `Right-side light should follow the pointer: ${pointerLeft} / ${pointerRight}`);
  await rim.mouse.move(0, 0);
  await rim.keyboard.press('Tab');
  assert.equal(await rim.evaluate(() => document.activeElement.id), 'toggle');
  assert.equal(await rim.locator('#toggle').evaluate(el => el.matches(':focus-visible')), true);
  await rim.keyboard.press('Space');
  assert.equal(await rim.locator('#result').textContent(), 'Reading focus is off');
  assert.equal(await rim.locator('#neighbor-label').textContent(), 'Focus off');
  assert.equal(await rim.locator('#neighbor canvas').evaluate(el => el.style.opacity), '0');
  await rim.keyboard.press('Space');
  assert.equal(await rim.locator('#result').textContent(), 'Reading focus is on');
  await rim.emulateMedia({ reducedMotion: 'reduce' });
  await rim.waitForFunction(() => window.reflectiveRimDemo.surface.mode === 'static');
  await rim.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' });
  assert.equal(await rim.locator('#ring').evaluate(el => getComputedStyle(el).borderTopWidth), '1px');
  await rim.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'none' });
  if (output) await rim.screenshot({ path: path.join(output, 'rim-desktop.png') });
  await rim.evaluate(() => window.reflectiveRimDemo.surface.destroy());
  assert.equal(await rim.locator('#neighbor canvas').count(), 0);
  assert.equal(await rim.locator('#ring canvas').count(), 0);
  assert.equal(await rim.locator('#ring').getAttribute('data-reflective-appearance'), null);
  await rim.close();

  const mobile = await browser.newPage({ viewport: { width: 320, height: 700 } });
  await mobile.goto(url);
  await mobile.waitForFunction(() => Boolean(window.reflectiveSurfaceDemo));
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await mobile.locator('#light').focus();
  await mobile.keyboard.press('Space');
  assert.equal(await mobile.locator('#light').getAttribute('aria-pressed'), 'false');
  if (output) await mobile.screenshot({ path: path.join(output, 'mobile.png') });
  await mobile.close();

  const rimMobile = await browser.newPage({ viewport: { width: 320, height: 700 } });
  await rimMobile.goto(`http://127.0.0.1:${server.address().port}/skills/seenry-motion/assets/reflective-surface/rim-demo.html`);
  await rimMobile.waitForFunction(() => Boolean(window.reflectiveRimDemo));
  assert.equal(await rimMobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await rimMobile.locator('footer').scrollIntoViewIfNeeded();
  assert.equal(await rimMobile.locator('footer').isVisible(), true);
  if (output) await rimMobile.screenshot({ path: path.join(output, 'rim-mobile.png'), fullPage: true });
  await rimMobile.close();

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

  const rimFallback = await browser.newPage({ viewport: { width: 1100, height: 800 } });
  await rimFallback.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) {
      return type === 'webgl2' ? null : original.call(this, type, ...args);
    };
  });
  await rimFallback.goto(`http://127.0.0.1:${server.address().port}/skills/seenry-motion/assets/reflective-surface/rim-demo.html`);
  await rimFallback.waitForFunction(() => Boolean(window.reflectiveRimDemo));
  assert.equal(await rimFallback.locator('#ring').getAttribute('data-reflective-mode'), 'fallback');
  assert.equal(await rimFallback.locator('#neighbor canvas').evaluate(el => el.style.opacity), '0');
  if (output) await rimFallback.screenshot({ path: path.join(output, 'rim-fallback.png') });
  await rimFallback.locator('#toggle').click();
  assert.equal(await rimFallback.locator('#result').textContent(), 'Reading focus is off');
  await rimFallback.close();
  console.log('Reflective surface: solid and rim material, linked reflection, keyboard, reduced motion, visibility pause, mobile layout and cleanup passed.');
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
