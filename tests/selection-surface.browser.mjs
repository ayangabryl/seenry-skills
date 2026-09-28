import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
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
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await chromium.launch({ headless: true, ...(existsSync(chromePath) ? { executablePath: chromePath } : {}) });
const url = `http://127.0.0.1:${server.address().port}/skills/seenry-motion/assets/selection-surface-demo.html`;

async function checkAlignment(page) {
  const bounds = await page.evaluate(() => {
    const tab = document.querySelector('[role="tab"][aria-selected="true"]').getBoundingClientRect();
    const pill = document.querySelector('.motion-rail-selected').getBoundingClientRect();
    return { tab: { x: tab.x, y: tab.y, w: tab.width, h: tab.height }, pill: { x: pill.x, y: pill.y, w: pill.width, h: pill.height } };
  });
  for (const [a, b] of [['x', 'x'], ['y', 'y'], ['w', 'w'], ['h', 'h']]) {
    assert.ok(Math.abs(bounds.tab[a] - bounds.pill[b]) < 1, `${a} mismatch ${JSON.stringify(bounds)}`);
  }
}
async function waitForAlignment(page) {
  await page.waitForFunction(() => {
    const tab = document.querySelector('[role="tab"][aria-selected="true"]')?.getBoundingClientRect();
    const pill = document.querySelector('.motion-rail-selected')?.getBoundingClientRect();
    return tab && pill && ['x', 'y', 'width', 'height'].every(key => Math.abs(tab[key] - pill[key]) < 1);
  }, null, { timeout: 2500 });
  await checkAlignment(page);
}

try {
  const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await page.waitForFunction(() => Boolean(window.study));
  assert.equal(await page.locator('[role="tab"][aria-selected="true"]').count(), 1);
  await waitForAlignment(page);

  const startX = await page.locator('.motion-rail-selected').evaluate(el => el.getBoundingClientRect().x);
  await page.getByRole('tab', { name: 'Recent activity' }).click();
  await page.waitForTimeout(85);
  const middleX = await page.locator('.motion-rail-selected').evaluate(el => el.getBoundingClientRect().x);
  const targetX = await page.locator('#tab-activity').evaluate(el => el.getBoundingClientRect().x);
  assert.ok(middleX > startX + 2 && middleX < targetX - 2, `Selection should travel between labels: ${startX}, ${middleX}, ${targetX}`);
  await waitForAlignment(page);
  assert.equal(await page.locator('#panel-activity').isVisible(), true);
  assert.equal(await page.locator('#panel-overview').isHidden(), true);

  await page.getByRole('tab', { name: 'Notes' }).focus();
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'tab-overview');
  assert.equal(await page.locator('#tab-overview').getAttribute('aria-selected'), 'true');
  await page.keyboard.press('End');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'tab-notes');
  await page.keyboard.press('Home');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'tab-overview');
  await waitForAlignment(page);

  // A changed label width and a rapid pair of selections must settle on the final tab.
  await page.evaluate(() => {
    document.querySelector('#tab-activity').textContent = 'Activity and decisions';
    window.study.select(1);
    window.study.select(2);
  });
  await waitForAlignment(page);
  assert.equal(await page.locator('[role="tab"][aria-selected="true"]').count(), 1);
  assert.equal(await page.locator('#panel-notes').isVisible(), true);
  await page.setViewportSize({ width: 620, height: 700 });
  await waitForAlignment(page);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('tab', { name: 'Overview' }).click();
  await waitForAlignment(page);
  assert.equal(await page.locator('.motion-rail-selected').evaluate(el => getComputedStyle(el).transitionDuration), '0s');
  if (axePath) {
    await page.addScriptTag({ path: axePath });
    const violations = await page.evaluate(async () => (await axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] },
    })).violations.map(item => ({ id: item.id, impact: item.impact, nodes: item.nodes.map(node => node.target) })));
    assert.deepEqual(violations, []);
  }

  const mobile = await browser.newPage({ viewport: { width: 320, height: 700 } });
  await mobile.goto(url);
  await mobile.waitForFunction(() => Boolean(window.study));
  await mobile.getByRole('tab', { name: 'Recent activity' }).click();
  await waitForAlignment(mobile);
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  if (output) {
    await mkdir(output, { recursive: true });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.setViewportSize({ width: 900, height: 700 });
    await page.evaluate(() => {
      document.querySelector('#tab-activity').textContent = 'Recent activity';
      window.study.select(1);
      document.activeElement?.blur();
    });
    await page.waitForTimeout(320);
    await page.screenshot({ path: path.join(output, 'desktop.png') });
    await mobile.screenshot({ path: path.join(output, 'mobile.png') });
  }
  await page.evaluate(() => window.study.surface.destroy());
  assert.equal(await page.locator('#views').getAttribute('data-surface-ready'), null);
  assert.deepEqual(errors, []);
  await mobile.close();
  await page.close();
  console.log('Selection surface: unequal labels, keyboard, rapid selection, resize, reduced motion, narrow width and cleanup passed.');
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
