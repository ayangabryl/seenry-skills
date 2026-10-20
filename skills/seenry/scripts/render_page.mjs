#!/usr/bin/env node
/** Render one local page or URL to a PNG at 1440×900 (the identity board for the critic).
 *  node render_page.mjs <file|url> <out.png> [--full] [--playwright <path>] */
import {resolve, join} from 'node:path';
import {existsSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
const args = process.argv.slice(2);
const flag = (name, fallback) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : fallback; };
const [target, out] = args.filter((a, i) => !a.startsWith('--') && !(args[i - 1] || '').startsWith('--playwright'));
if (!target || !out) { console.error('usage: render_page.mjs <file|url> <out.png> [--full]'); process.exit(2); }
async function loadPlaywright() {
  const explicit = flag('playwright', process.env.SEENRY_PLAYWRIGHT);
  if (explicit) return import(pathToFileURL(resolve(explicit)).href);
  for (const base of [process.cwd(), resolve(process.cwd(), '..')]) {
    try { return import(pathToFileURL(createRequire(join(base, 'noop.js')).resolve('playwright')).href); } catch {}
  }
  try { return await import('playwright'); } catch {}
  console.error('Playwright not found (npm i -D playwright, or pass --playwright).'); process.exit(2);
}
const {chromium} = await loadPlaywright();
const browser = await chromium.launch();
const page = await browser.newPage({viewport: {width: 1440, height: 900}});
await page.goto(/^https?:/.test(target) ? target : pathToFileURL(resolve(target)).href, {waitUntil: 'networkidle'}).catch(() => {});
await page.waitForTimeout(1200);
await page.screenshot({path: resolve(out), fullPage: args.includes('--full')});
await browser.close();
