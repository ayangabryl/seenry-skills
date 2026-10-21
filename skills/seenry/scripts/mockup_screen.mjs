#!/usr/bin/env node
/** Render an app screen (its own small HTML page, designed to app standards) to a crisp PNG for a device mockup.
 *  node mockup_screen.mjs <screen.html | url> <out.png> [--device phone|laptop] [--wait 600] [--playwright path]
 *  phone: 393×852 at 3× (status bar and home indicator are the page's job); laptop: 1440×900 at 2×. */
import {resolve, join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
const args = process.argv.slice(2);
const flag = (n, f) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : f; };
const [src, out] = args.filter((a, i) => !a.startsWith('--') && !(args[i - 1] || '').startsWith('--'));
if (!src || !out) { console.error('usage: mockup_screen.mjs <screen.html | url> <out.png> [--device phone|laptop]'); process.exit(2); }
const pw = flag('playwright', process.env.SEENRY_PLAYWRIGHT);
let chromium;
try { ({chromium} = pw ? await import(pathToFileURL(resolve(pw)).href) : await import(pathToFileURL(createRequire(join(process.cwd(), 'noop.js')).resolve('playwright')).href)); }
catch { try { ({chromium} = await import('playwright')); } catch { console.error('Playwright not found (npm i -D playwright, or pass --playwright).'); process.exit(2); } }
const laptop = flag('device', 'phone') === 'laptop';
const browser = await chromium.launch();
const page = await browser.newPage({viewport: laptop ? {width: 1440, height: 900} : {width: 393, height: 852}, deviceScaleFactor: laptop ? 2 : 3, reducedMotion: 'reduce'});
await page.goto(/^https?:/.test(src) ? src : pathToFileURL(resolve(src)).href, {waitUntil: 'networkidle'});
await page.evaluate(() => document.fonts && document.fonts.ready);
await page.waitForTimeout(Number(flag('wait', 600)));
await page.screenshot({path: resolve(out)});
await browser.close();
console.log(`${out} (${laptop ? '2880×1800' : '1179×2556'})`);
