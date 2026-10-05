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
const mime = new Map([['.html','text/html'],['.css','text/css'],['.mjs','text/javascript']]);
const server = createServer(async (request, response) => {
  const file = path.resolve(root, '.' + decodeURIComponent(request.url.split('?')[0]));
  if (!file.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
  try { response.setHeader('Content-Type', mime.get(path.extname(file)) || 'application/octet-stream'); response.end(await readFile(file)); }
  catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true, executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const url = `http://127.0.0.1:${server.address().port}/skills/seenry-motion/assets/action-menu/demo.html`;
try {
  const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await page.waitForFunction(() => Boolean(window.study));
  assert.equal(await page.locator('#actions').getAttribute('aria-expanded'), 'false');
  assert.equal(await page.locator('#actions-panel').isHidden(), true);

  await page.locator('#actions').focus();
  await page.keyboard.press('ArrowDown');
  assert.equal(await page.locator('#actions').getAttribute('aria-expanded'), 'true');
  assert.equal(await page.evaluate(() => document.activeElement.value), 'rename');
  if (axePath) {
    await page.waitForTimeout(250);
    await page.addScriptTag({ path: axePath });
    const violations = await page.evaluate(async () => (await axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] },
    })).violations.map(item => ({ id: item.id, impact: item.impact, nodes: item.nodes.map(node => node.target) })));
    assert.deepEqual(violations, []);
  }
  await page.keyboard.press('End');
  assert.equal(await page.evaluate(() => document.activeElement.value), 'share');
  await page.keyboard.press('ArrowDown');
  assert.equal(await page.evaluate(() => document.activeElement.value), 'rename');
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'actions');
  assert.equal(await page.locator('#actions-panel').getAttribute('data-state'), 'closed');
  await page.keyboard.press('ArrowUp');
  assert.equal(await page.evaluate(() => document.activeElement.value), 'share');
  await page.keyboard.press('Tab');
  await page.waitForFunction(() => document.querySelector('#actions').getAttribute('aria-expanded') === 'false', null, { timeout: 1000 });
  assert.equal(await page.locator('#actions').getAttribute('aria-expanded'), 'false');

  // A quick reversal must not let the old close timer hide the new menu.
  await page.locator('#actions').click();
  await page.waitForTimeout(320);
  assert.equal(await page.locator('#actions-panel').isVisible(), true);
  await page.locator('[value="duplicate"]').click();
  assert.equal(await page.locator('#result').textContent(), 'Duplicate selected');
  assert.equal(await page.locator('#actions').getAttribute('aria-expanded'), 'false');

  await page.locator('#actions').click();
  await page.locator('h1').click();
  await page.waitForTimeout(300);
  assert.equal(await page.locator('#actions-panel').isHidden(), true);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('#actions').click();
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#actions-panel').isHidden(), true);
  assert.equal(errors.length, 0, errors.join('\n'));

  const mobile = await browser.newPage({ viewport: { width: 320, height: 700 } });
  await mobile.goto(url);
  await mobile.waitForFunction(() => Boolean(window.study));
  await mobile.locator('#actions').click();
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  if (output) {
    await mkdir(output, { recursive: true });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.evaluate(() => window.study.setOpen(true));
    await page.waitForTimeout(230);
    assert.equal(await page.locator('#actions').getAttribute('aria-expanded'), 'true');
    await page.screenshot({ path: path.join(output, 'desktop.png') });
    await mobile.screenshot({ path: path.join(output, 'mobile.png') });
  }
  await page.evaluate(() => window.study.destroy());
  assert.equal(await page.locator('#actions').getAttribute('aria-expanded'), null);
  assert.equal(await page.locator('#actions-panel').getAttribute('role'), null);
  assert.equal(await page.locator('#actions-panel').isHidden(), true);
  await mobile.close();
  await page.close();
  console.log('Action menu: keyboard, selection, reversal, outside dismissal, reduced motion and narrow width passed.');
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
