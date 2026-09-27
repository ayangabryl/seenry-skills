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
const mime = new Map([['.html', 'text/html'], ['.css', 'text/css'], ['.mjs', 'text/javascript'], ['.svg', 'image/svg+xml']]);
const server = createServer(async (request, response) => {
  const file = path.resolve(root, '.' + decodeURIComponent(request.url.split('?')[0]));
  if (!file.startsWith(root + path.sep)) return response.writeHead(403).end();
  try { response.setHeader('Content-Type', mime.get(path.extname(file)) || 'application/octet-stream'); response.end(await readFile(file)); }
  catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
const url = `http://127.0.0.1:${server.address().port}/skills/seenry-motion/assets/image-reveal/demo.html`;
try {
  const page = await browser.newPage({ viewport: { width: 1100, height: 800 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await page.waitForFunction(() => Boolean(window.imageRevealDemo));
  assert.equal(await page.locator('.seenry-image-reveal img').count(), 1);
  assert.equal(await page.locator('.seenry-image-reveal canvas').getAttribute('aria-hidden'), 'true');

  await page.locator('#b').focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.imageRevealDemo.state === 'revealing');
  assert.equal(await page.locator('.seenry-image-reveal canvas').isVisible(), true);
  if (output) { await mkdir(output, { recursive: true }); await page.waitForTimeout(250); await page.screenshot({ path: path.join(output, 'desktop-revealing.png') }); }
  await page.waitForFunction(() => window.imageRevealDemo.state === 'idle');
  assert.match(await page.locator('.seenry-image-reveal img').getAttribute('src'), /study-b\.svg$/);
  assert.match(await page.locator('.seenry-image-reveal img').getAttribute('alt'), /green landscape/);
  assert.equal(await page.locator('#artwork').count(), 1);
  assert.equal(await page.locator('.seenry-image-reveal canvas').isVisible(), false);

  await page.locator('#missing').click();
  await page.waitForFunction(() => window.imageRevealDemo.state === 'error');
  assert.match(await page.locator('.seenry-image-reveal img').getAttribute('src'), /study-b\.svg$/);
  assert.match(await page.locator('#status').textContent(), /could not load/);

  const rapid = await page.evaluate(async () => {
    const reveal = window.imageRevealDemo;
    const first = reveal.show('study-a.svg', 'Blue');
    const second = reveal.show('study-b.svg', 'Green');
    return [await first, await second];
  });
  assert.deepEqual(rapid, ['superseded', 'shown']);
  assert.match(await page.locator('.seenry-image-reveal img').getAttribute('src'), /study-b\.svg$/);

  const duringReveal = await page.evaluate(async () => {
    const reveal = window.imageRevealDemo;
    const first = reveal.show('study-a.svg', 'Blue');
    await new Promise(resolve => {
      const check = () => reveal.state === 'revealing' ? resolve() : requestAnimationFrame(check);
      check();
    });
    const second = reveal.show('study-b.svg', 'Green');
    return [await first, await second];
  });
  assert.deepEqual(duringReveal, ['superseded', 'shown']);
  assert.match(await page.locator('.seenry-image-reveal img').getAttribute('src'), /study-b\.svg$/);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  const reduced = await page.evaluate(() => window.imageRevealDemo.show('study-a.svg', 'Blue'));
  assert.equal(reduced, 'shown');
  assert.equal(await page.locator('.seenry-image-reveal canvas').isVisible(), false);
  assert.equal(await page.evaluate(() => document.getAnimations().length), 0);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.locator('#b').click();
  await page.waitForFunction(() => window.imageRevealDemo.state === 'revealing');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForFunction(() => window.imageRevealDemo.state === 'idle');
  assert.match(await page.locator('.seenry-image-reveal img').getAttribute('src'), /study-b\.svg$/);

  if (axePath) {
    await page.addScriptTag({ path: axePath });
    const violations = await page.evaluate(async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })).violations.map(item => ({ id: item.id, nodes: item.nodes.map(node => node.target) })));
    assert.deepEqual(violations, []);
  }
  assert.deepEqual(errors, []);
  await page.evaluate(() => window.imageRevealDemo.destroy());
  assert.equal(await page.locator('.seenry-image-reveal canvas').count(), 0);
  await page.close();

  const mobile = await browser.newPage({ viewport: { width: 320, height: 700 }, reducedMotion: 'reduce' });
  await mobile.goto(url);
  await mobile.waitForFunction(() => Boolean(window.imageRevealDemo));
  await mobile.locator('#b').focus();
  await mobile.keyboard.press('Space');
  await mobile.waitForFunction(() => window.imageRevealDemo.state === 'idle' && document.querySelector('.seenry-image-reveal img').src.endsWith('study-b.svg'));
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  if (output) await mobile.screenshot({ path: path.join(output, 'mobile.png') });
  await mobile.close();
  console.log('Image reveal: decode, reveal, failure, rapid replacement, live reduced motion, keyboard, axe and cleanup passed.');
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
