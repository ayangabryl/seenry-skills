#!/usr/bin/env node
/** Scroll strip: the page as a visitor sees it while scrolling, not as two stills. Frames are taken by wheel at even
 *  points down the page, so fixed headers over content, text cut at the fold and half-finished section changes show.
 *  With --ref (the named site), each row pairs the reference and the candidate at the same point of their pages.
 *
 *  node scroll_strip.mjs <file|url> --out .seenry/review/scroll.png [--ref https://site.example] [--frames 8]
 *                        [--playwright <path>]
 *  Writes <out> for desktop (1440×900) and <out>-phone.png (390×844). Exits 0 even when the reference cannot load;
 *  the strip is then candidate-only and says so. */
import {resolve, join, dirname} from 'node:path';
import {existsSync, mkdirSync, readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {markWorkDir} from './workdir.mjs';

const args = process.argv.slice(2);
const flag = (name, fallback) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : fallback; };
const target = args.find((a, i) => !a.startsWith('--') && !(args[i - 1] || '').startsWith('--'));
if (!target) { console.error('usage: scroll_strip.mjs <file|url> --out scroll.png [--ref <url>] [--frames 8]'); process.exit(2); }
const out = resolve(flag('out', '.seenry/review/scroll.png'));
markWorkDir(out);
mkdirSync(dirname(out), {recursive: true});
const ref = flag('ref', '');
const frames = Number(flag('frames', '8'));

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
const browser = await chromium.launch({args: ['--enable-gpu', '--ignore-gpu-blocklist']});

// Wheel scrolling, not scrollTo, so smooth-scroll libraries, sticky headers and scroll-driven scenes behave as they do
// for a person. Each frame is taken after the page settles at that point.
async function film(url, viewport, count) {
  const ctx = await browser.newContext({viewport, deviceScaleFactor: 1, ...(viewport.width < 600 ? {isMobile: true, hasTouch: true} : {})});
  const page = await ctx.newPage();
  try {
    await page.goto(url, {waitUntil: 'networkidle', timeout: 45000}).catch(() => page.goto(url, {waitUntil: 'load', timeout: 45000}));
    await page.waitForTimeout(2500);
    await page.mouse.move(viewport.width / 2, viewport.height / 2);
    const total = await page.evaluate(() => Math.max(0, document.documentElement.scrollHeight - innerHeight));
    const shots = [];
    for (let k = 0; k < count; k++) {
      const goal = Math.round(total * k / Math.max(1, count - 1));
      for (let guard = 0; guard < 80; guard++) {
        const y = await page.evaluate(() => scrollY);
        if (Math.abs(goal - y) < 24) break;
        if (viewport.width < 600) await page.evaluate(d => scrollBy(0, d), Math.sign(goal - y) * Math.min(400, Math.abs(goal - y)));
        else await page.mouse.wheel(0, Math.sign(goal - y) * Math.min(400, Math.abs(goal - y)));
        await page.waitForTimeout(60);
      }
      await page.waitForTimeout(900);
      shots.push((await page.screenshot({type: 'jpeg', quality: 70})).toString('base64'));
    }
    return shots;
  } catch (e) { return null; } finally { await ctx.close(); }
}

const toUrl = t => /^https?:/.test(t) ? t : pathToFileURL(resolve(t)).href;
async function strip(viewport, count, file) {
  const ours = await film(toUrl(target), viewport, count);
  if (!ours) { console.error(`Could not render ${target}.`); process.exit(1); }
  const theirs = ref ? await film(ref, viewport, count) : null;
  const w = viewport.width < 600 ? 260 : 640, h = Math.round(w * viewport.height / viewport.width);
  const cell = (b64, label) => `<figure><figcaption>${label}</figcaption><img src="data:image/jpeg;base64,${b64}" width="${w}" height="${h}"></figure>`;
  const rows = ours.map((b64, k) => {
    const pct = Math.round(100 * k / Math.max(1, count - 1));
    return theirs ? `<div class="row">${cell(theirs[k], `Reference at ${pct}%`)}${cell(b64, `Candidate at ${pct}%`)}</div>` : cell(b64, `Candidate at ${pct}%`);
  }).join('');
  const cols = theirs ? 1 : (viewport.width < 600 ? 4 : 2);
  const html = `<!doctype html><html><body style="margin:0;background:#e9e9e6;font:14px system-ui;color:#222">
<style>.grid{display:grid;grid-template-columns:repeat(${cols},max-content);gap:16px;padding:16px}.row{display:flex;gap:12px}figure{margin:0}figcaption{padding:0 0 4px}img{display:block;box-shadow:0 0 0 1px #0002}</style>
<div class="grid">${rows}</div></body></html>`;
  const page = await browser.newPage({viewport: {width: 800, height: 600}});
  await page.setContent(html);
  await page.screenshot({path: file, fullPage: true});
  await page.close();
  return Boolean(theirs);
}

const paired = await strip({width: 1440, height: 900}, frames, out);
const phoneOut = out.replace(/\.png$/, '-phone.png');
await strip({width: 390, height: 844}, Math.max(4, Math.round(frames / 2)), phoneOut);
await browser.close();
console.log(`Scroll strip: ${out} and ${phoneOut}${ref ? (paired ? ` (paired with ${ref})` : ` (reference ${ref} did not load; candidate only)`) : ''}`);
