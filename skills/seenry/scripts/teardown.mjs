#!/usr/bin/env node
/** The teardown: every reference opened at full size, cropped to what a thumbnail hides, and counted.
 *
 *  node teardown.mjs <image | url>… [--dir .seenry] [--product name=x,y,w,h] [--second name=x,y,w,h] [--playwright path]
 *    Writes three full-resolution crops per reference to <dir>/canvas/refs/crops/ (whole, product UI, second section)
 *    and adds one section per reference to <dir>/teardown.md with the measures to fill in from those crops.
 *    Boxes are fractions of the image (0 to 1); pass them when the guessed crop misses the product view.
 *  node teardown.mjs --check [--dir .seenry]
 *    Exits 1 while a section is unfilled, unmeasured or missing a crop. canvas.mjs verify and check.mjs run the same test.
 *
 *  Looking at a contact sheet teaches a mood. The level is in the counts: how many kinds of UI the product view
 *  shows, what form each chart takes, where the image crosses the interface, what returns below the hero. */
import {existsSync, readFileSync, writeFileSync, mkdirSync, realpathSync} from 'node:fs';
import {resolve, join, basename, extname, relative} from 'node:path';
import {pathToFileURL, fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {teardownProblems} from './execution_bar.mjs';

export const BLANK = '__';
const SCREEN = 0.69;
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

export const slug = name => basename(String(name)).replace(/\.[a-z0-9]+$/i, '').replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 48) || 'reference';

/** Pixel boxes for the three crops. With no box given, the product view is guessed as the lower part of the first
 *  screen and the second section as the screen after it; a page one screen tall has no second section. */
export function cropBoxes(w, h, {product, second} = {}) {
  const screen = Math.min(h, Math.round(w * SCREEN));
  const px = b => { const x = clamp(Math.round(b[0] * w), 0, w - 1), y = clamp(Math.round(b[1] * h), 0, h - 1); return {x, y, width: clamp(Math.round(b[2] * w), 1, w - x), height: clamp(Math.round(b[3] * h), 1, h - y)}; };
  const out = {whole: {x: 0, y: 0, width: w, height: h}};
  out.product = product ? px(product) : {x: Math.round(w * 0.08), y: Math.round(screen * 0.3), width: Math.round(w * 0.84), height: Math.min(h, Math.round(screen * 1.08)) - Math.round(screen * 0.3)};
  if (second) out.second = px(second);
  else if (h > screen * 1.25) out.second = {x: 0, y: screen, width: w, height: Math.min(h - screen, screen)};
  return out;
}

/** One section per reference. Every blank must become a count or a measurement read from the crops. */
export function section(name, crops = {}) {
  const line = (label, body) => `- ${label}: ${body}`;
  return [
    `## ${name}`,
    '',
    line('Crops', [crops.whole, crops.product, crops.second].filter(Boolean).join(', ') || BLANK),
    line('UI elements', `${BLANK} kinds in the product view: ${BLANK} (name each: side navigation, search, breadcrumb, avatars, actions, metric cards, tooltip…)`),
    line('Visualisation types', `${BLANK} kinds, and the form of each: ${BLANK} (sticks with a mirrored row, stacked blocks, a tick gauge, a filled curve…)`),
    line('Headline', `${BLANK}px at 1440, weight ${BLANK}, ${BLANK} lines, tracking ${BLANK}`),
    line('Hues', `${BLANK} saturated hues outside the images; a state is marked by ${BLANK}`),
    line('Image and UI interlock', `${BLANK} sits in front of ${BLANK}, covering ${BLANK}% of the product view`),
    line('Motif below the hero', `${BLANK} returns in ${BLANK} tiles of the second section; each tile holds ${BLANK}`),
    line('Logos', `${BLANK} marks or text, ${BLANK} of them, ${BLANK} colours`),
    line('Buttons, pills, tabs', `button height ${BLANK}px, icon tiles ${BLANK}, the tab control is ${BLANK}, radius ${BLANK}px`),
    line('Take from it', `${BLANK} (one principle with its number, for compose.md)`),
    '',
  ].join('\n');
}

export const unfilled = text => (String(text).match(/__/g) || []).length;

/** The same test verify and check.mjs run, plus the blanks this template leaves. */
export function checkTeardown(text, {crops = null} = {}) {
  const problems = teardownProblems(text);
  if (crops && crops.missing.length) problems.push(`${crops.missing.length} crop${crops.missing.length === 1 ? '' : 's'} named in it do not exist: ${crops.missing.slice(0, 3).join(', ')}`);
  return problems;
}

async function loadPlaywright(explicit) {
  for (const load of [() => explicit && import(pathToFileURL(resolve(explicit)).href), () => import(pathToFileURL(createRequire(join(process.cwd(), 'noop.js')).resolve('playwright')).href), () => import('playwright')]) {
    try { const mod = await load(); if (mod) return mod.chromium || mod.default?.chromium; } catch {}
  }
  return null;
}

const HEADER = '# Teardown\n\nOne section per reference. Open each crop at full size and replace every __ with a count or a measurement. Count and measure; do not describe.\n\n';

/** Crops each reference and adds its section to <dir>/teardown.md. Takes an open Playwright browser. Returns the names added. */
export async function prepareTeardown({dir, inputs, browser, boxFor = () => null, log = () => {}}) {
  const file = join(dir, 'teardown.md'), cropDir = join(dir, 'canvas', 'refs', 'crops');
  mkdirSync(cropDir, {recursive: true});
  let text = existsSync(file) && readFileSync(file, 'utf8').trim() ? readFileSync(file, 'utf8') : HEADER;
  const added = [];
  for (const input of inputs) {
    const name = slug(input), isUrl = /^https?:\/\//.test(input);
    if (!isUrl && !existsSync(input)) { log(`No such reference: ${input}`); continue; }
    let source = resolve(input);
    if (isUrl) {
      const page = await browser.newPage({viewport: {width: 1440, height: 900}, deviceScaleFactor: 2});
      await page.goto(input, {waitUntil: 'networkidle', timeout: 60000}).catch(() => {});
      source = join(cropDir, `${name}.source.png`);
      await page.screenshot({path: source, fullPage: true}); await page.close();
    }
    const type = {'.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.gif': 'image/gif'}[extname(source).toLowerCase()] || 'image/png';
    const page = await browser.newPage({viewport: {width: 1200, height: 800}});
    await page.setContent(`<!doctype html><style>html,body{margin:0;background:#fff}img{display:block}</style><img src="data:${type};base64,${readFileSync(source).toString('base64')}">`);
    const {w, h} = await page.evaluate(async () => { const i = document.images[0]; await i.decode().catch(() => {}); return {w: i.naturalWidth, h: i.naturalHeight}; });
    if (!w || !h) { log(`Could not read ${input} as an image.`); await page.close(); continue; }
    await page.setViewportSize({width: Math.min(w, 8000), height: Math.min(h, 8000)});
    const boxes = cropBoxes(w, h, {product: boxFor('product', name), second: boxFor('second', name)}), crops = {};
    for (const [kind, clip] of Object.entries(boxes)) {
      await page.screenshot({path: join(cropDir, `${name}.${kind}.png`), clip, fullPage: true});
      crops[kind] = `crops/${name}.${kind}.png`;
    }
    await page.close();
    if (new RegExp(`^## ${name}$`, 'm').test(text)) log(`${name}: crops rewritten; its section in teardown.md is kept.`);
    else { text += section(name, crops) + '\n'; added.push(name); }
    log(`${name}  ${w}×${h}\n  ${Object.values(crops).map(c => join(dir, 'canvas', 'refs', c)).join('\n  ')}`);
  }
  writeFileSync(file, text);
  return added;
}

const real = p => { try { return realpathSync(p); } catch { return resolve(p); } };
const isMain = process.argv[1] && real(fileURLToPath(import.meta.url)) === real(process.argv[1]);
if (isMain) {
  const args = process.argv.slice(2);
  const flag = (n, f) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : f; };
  const flags = n => args.flatMap((a, i) => a === `--${n}` ? [args[i + 1]] : []);
  const dir = resolve(flag('dir', '.seenry')), file = join(dir, 'teardown.md');
  if (args.includes('--check')) {
    const text = existsSync(file) ? readFileSync(file, 'utf8') : '';
    const named = [...text.matchAll(/crops\/[\w.-]+\.png/g)].map(m => m[0]);
    const problems = checkTeardown(text, {crops: {missing: named.filter(n => !existsSync(join(dir, 'canvas', 'refs', n)))}});
    console.log(problems.length ? `Teardown ${relative(process.cwd(), file)}: ${problems.join('; ')}.` : `Teardown ${relative(process.cwd(), file)}: measured for every reference.`);
    process.exit(problems.length ? 1 : 0);
  }
  const valued = new Set(['dir', 'product', 'second', 'playwright']);
  const inputs = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && valued.has(args[i - 1].slice(2))));
  if (!inputs.length) { console.error('Usage: node teardown.mjs <image | url>… [--dir .seenry] [--product name=x,y,w,h] [--second name=x,y,w,h]\n       node teardown.mjs --check [--dir .seenry]'); process.exit(2); }
  const boxFor = (kind, name) => {
    for (const v of flags(kind)) {
      const [key, rest] = String(v).includes('=') ? String(v).split('=') : [null, String(v)];
      if (key && key !== name) continue;
      const b = rest.split(',').map(Number);
      if (b.length === 4 && b.every(Number.isFinite)) return b;
    }
    return null;
  };
  const chromium = await loadPlaywright(flag('playwright', process.env.SEENRY_PLAYWRIGHT));
  if (!chromium) { console.error('Playwright not found. Install it (npm i -D playwright && npx playwright install chromium) or pass --playwright.'); process.exit(2); }
  const browser = await chromium.launch({headless: true, args: ['--allow-file-access-from-files'], ...(process.env.SEENRY_CHROME_PATH ? {executablePath: process.env.SEENRY_CHROME_PATH} : {})});
  const added = await prepareTeardown({dir, inputs, browser, boxFor, log: console.log});
  await browser.close();
  console.log(`\n${relative(process.cwd(), file)}: ${added.length} section${added.length === 1 ? '' : 's'} added${added.length ? ` (${added.join(', ')})` : ''}. Open each crop at full size and replace every ${BLANK} with a count or a measurement. A crop that missed the product view: run again with --product name=x,y,w,h (fractions of the image).`);
}
