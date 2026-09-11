// Render authored lessons only. Imported outcome screenshots are immutable evidence.
import {access, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';

const args = process.argv.slice(2);
const moduleIndex = args.indexOf('--playwright');
const {chromium} = await import(moduleIndex >= 0 ? pathToFileURL(path.resolve(args[moduleIndex + 1])).href : 'playwright');
const root = fileURLToPath(new URL('../references/lessons/', import.meta.url));
const manifest = JSON.parse(await readFile(path.join(root, 'index.json'), 'utf8'));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const browser = await chromium.launch();
const evidence = [], retained = [];
try {
  for (const lesson of manifest.lessons) for (const filename of lesson.inspect) {
    const source = path.join(root, filename.replace(/\.png$/, '.html'));
    try { await access(source); } catch {
      retained.push({file: filename, reason: 'No authored source; preserve imported outcome screenshot', sha256: sha(await readFile(path.join(root, filename)))});
      continue;
    }
    const page = await browser.newPage({viewport: {width: 780, height: 650}});
    const errors = [];
    page.on('pageerror', error => errors.push(String(error)));
    await page.goto(pathToFileURL(source).href + '?scene');
    await page.evaluate(() => document.fonts.ready);
    if (lesson.id === 'continuity') await page.locator('[data-expand]').click();
    await page.waitForTimeout(320);
    await page.screenshot({path: path.join(root, filename)});
    await page.setViewportSize({width: 320, height: 740});
    await page.screenshot({path: path.join(root, filename.replace('.png', '-mobile.png')), fullPage: true});
    evidence.push({file: filename, source_sha256: sha(await readFile(source)), image_sha256: sha(await readFile(path.join(root, filename))), errors,
      overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)});
    await page.close();
  }
  await writeFile(path.join(root, 'render-evidence.json'), JSON.stringify({generated_at: new Date().toISOString(), platform: process.platform,
    browser: await browser.version(), evidence, retained,
    limitations: ['Chromium emulation; not physical-device testing.', 'Rendered teaching exercises are not human-calibrated preferences. Imported outcomes retain their separate provenance.']}, null, 2) + '\n');
} finally { await browser.close(); }
console.log(JSON.stringify({rendered: evidence.length, retained: retained.length, failures: evidence.filter(x => x.errors.length || x.overflow)}));
if (evidence.some(x => x.errors.length || x.overflow)) process.exitCode = 1;
