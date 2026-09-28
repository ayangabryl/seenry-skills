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
const mime = new Map([['.html', 'text/html'], ['.css', 'text/css'], ['.mjs', 'text/javascript']]);
const server = createServer(async (request, response) => {
  const file = path.resolve(root, '.' + decodeURIComponent(request.url.split('?')[0]));
  if (!file.startsWith(root + path.sep)) return response.writeHead(403).end();
  try { response.setHeader('Content-Type', mime.get(path.extname(file)) || 'application/octet-stream'); response.end(await readFile(file)); }
  catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true, executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const url = `http://127.0.0.1:${server.address().port}/skills/seenry-motion/assets/boundary-trace/demo.html`;
try {
  const page = await browser.newPage({ viewport: { width: 1100, height: 800 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await page.waitForFunction(() => Boolean(window.boundaryTraceDemo));
  const overlay = page.locator('#sample .seenry-boundary-trace');
  assert.equal(await overlay.getAttribute('aria-hidden'), 'true');
  assert.equal(await overlay.getAttribute('data-mode'), 'idle');
  assert.equal(await page.locator('#status').textContent(), 'Preview stopped');
  await page.locator('#toggle').focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.boundaryTraceDemo.trace.mode === 'running');
  assert.equal(await page.locator('#toggle').getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('#status').textContent(), 'Preview active');
  assert.equal(await overlay.evaluate(node => node.getAnimations({ subtree: true }).length), 2);
  const offset = await overlay.locator('rect').last().evaluate(node => getComputedStyle(node).strokeDashoffset);
  await page.waitForTimeout(180);
  assert.notEqual(await overlay.locator('rect').last().evaluate(node => getComputedStyle(node).strokeDashoffset), offset);
  const before = await overlay.locator('rect').first().getAttribute('width');
  await page.locator('#width').fill('270');
  await page.waitForFunction(oldWidth => document.querySelector('.seenry-boundary-trace rect').getAttribute('width') !== oldWidth, before);
  assert.ok(Number(await overlay.locator('rect').first().getAttribute('width')) < Number(before));

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForFunction(() => window.boundaryTraceDemo.trace.mode === 'static');
  assert.equal(await overlay.locator('rect').last().getAttribute('stroke-dasharray'), '100 0');
  assert.equal(await overlay.evaluate(node => node.getAnimations({ subtree: true }).length), 0);
  const second = await page.evaluate(async () => {
    const { createBoundaryTrace } = await import('/skills/seenry-motion/assets/boundary-trace/boundary-trace.mjs');
    const host = document.createElement('div');
    host.style.cssText = 'width:200px;height:80px;border-radius:12px';
    document.body.append(host);
    const trace = createBoundaryTrace(host, { active: true, colors: ['#a34', '#46a'], staticAppearance: 'segment', segment: 13 });
    const gradientIds = [...document.querySelectorAll('.seenry-boundary-trace linearGradient')].map(node => node.id);
    const dash = host.querySelector('.seenry-boundary-trace__line').getAttribute('stroke-dasharray');
    const mode = trace.mode;
    trace.destroy();
    host.remove();
    return { gradientIds, dash, mode };
  });
  assert.equal(new Set(second.gradientIds).size, 2);
  assert.equal(second.dash, '13 87');
  assert.equal(second.mode, 'static');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.waitForFunction(() => window.boundaryTraceDemo.trace.mode === 'running');
  await page.evaluate(() => { document.querySelector('main').style.marginTop = '1800px'; });
  await page.waitForFunction(() => window.boundaryTraceDemo.trace.mode === 'paused');
  await page.evaluate(() => { document.querySelector('main').style.marginTop = '0'; window.scrollTo(0, 0); });
  await page.waitForFunction(() => window.boundaryTraceDemo.trace.mode === 'running');
  await page.locator('#toggle').click();
  assert.equal(await overlay.getAttribute('data-mode'), 'idle');
  if (axePath) {
    await page.addScriptTag({ path: axePath });
    const violations = await page.evaluate(async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })).violations.map(item => ({ id: item.id, nodes: item.nodes.map(node => node.target) })));
    assert.deepEqual(violations, []);
  }
  await page.locator('#toggle').click();
  if (output) {
    await mkdir(output, { recursive: true });
    await page.screenshot({ path: path.join(output, 'desktop-active.png') });
  }
  assert.deepEqual(errors, []);
  await page.evaluate(() => window.boundaryTraceDemo.trace.destroy());
  assert.equal(await overlay.count(), 0);

  const mobile = await browser.newPage({ viewport: { width: 320, height: 700 } });
  await mobile.goto(url);
  await mobile.waitForFunction(() => Boolean(window.boundaryTraceDemo));
  await mobile.locator('#toggle').focus();
  await mobile.keyboard.press('Space');
  assert.equal(await mobile.locator('#toggle').getAttribute('aria-pressed'), 'true');
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  if (output) await mobile.screenshot({ path: path.join(output, 'mobile-active.png') });
  await mobile.close();
  await page.close();
  console.log('Boundary trace: activation, resize, live reduced motion, visibility pause, keyboard, accessibility and cleanup passed.');
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
